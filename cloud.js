/* Minimal Supabase client: Auth (GoTrue) + database (PostgREST) over fetch.
   Uses only the PUBLIC url and anon key from supabase-config.js. Security comes from Row Level Security in the database. */
(function () {
  'use strict';
  var cfg = window.CRT_CFG || {}, KEY = 'crt.auth';
  var enabled = !!(cfg.url && cfg.anonKey && /^(https:\/\/|http:\/\/localhost)/.test(cfg.url));
  var base = enabled ? cfg.url.replace(/\/+$/, '') : '';
  var sess = null, listeners = [], refreshing = null;
  var C = { enabled: enabled, recovery: false, notice: '' };

  function load() { try { sess = JSON.parse(localStorage.getItem(KEY)); } catch (e) { sess = null; } if (sess && !sess.access_token) sess = null; }
  function save(s) { sess = s; try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) { } }
  function emit(ev) { listeners.forEach(function (f) { try { f(ev, C.user()); } catch (e) { } }); }
  function now() { return Math.floor(Date.now() / 1000); }
  function toSession(j) {
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || (now() + (Number(j.expires_in) || 3600)), user: j.user || (sess && sess.user) || null };
  }
  function nice(e) {
    if (!(e instanceof Error) || e.status === undefined) return 'Network problem. Check your connection and try again.';
    var m = String(e.message || '').toLowerCase(), c = String(e.code || '').toLowerCase();
    if (c === 'email_not_confirmed' || m.indexOf('not confirmed') > -1) return 'Please confirm your email first. Check your inbox for the confirmation link.';
    if (c === 'invalid_credentials' || m.indexOf('invalid login') > -1) return 'Incorrect email or password.';
    if (c === 'weak_password' || m.indexOf('password') > -1 && m.indexOf('least') > -1) return 'That password is too weak. Use at least 8 characters.';
    if (e.status === 429 || c.indexOf('rate') > -1) return 'Too many attempts. Please wait a few minutes and try again.';
    if (e.status === 401 || e.status === 403) return 'Your session has expired. Please log in again.';
    return 'Something went wrong. Please try again.';
  }
  C.friendly = nice;

  function raw(path, o) {
    o = o || {};
    var h = { apikey: cfg.anonKey, 'Content-Type': 'application/json' };
    h.Authorization = 'Bearer ' + (o.token || cfg.anonKey);
    for (var k in (o.headers || {})) h[k] = o.headers[k];
    return fetch(base + path, { method: o.method || 'GET', headers: h, body: o.body !== undefined ? JSON.stringify(o.body) : undefined }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { }
        if (!r.ok) { var e = new Error((j && (j.msg || j.message || j.error_description || j.error)) || ('HTTP ' + r.status)); e.status = r.status; e.code = j && (j.error_code || j.code); throw e; }
        return j;
      });
    });
  }
  function refresh() {
    if (!sess || !sess.refresh_token) return Promise.reject(new Error('no session'));
    if (refreshing) return refreshing;
    refreshing = raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } })
      .then(function (j) { save(toSession(j)); refreshing = null; return sess; })
      .catch(function (e) { refreshing = null; if (e.status && e.status < 500) { save(null); C.notice = 'Your session expired. Please log in again.'; emit('SIGNED_OUT'); } throw e; });
    return refreshing;
  }
  function authed(path, o) {
    o = o || {};
    if (!sess) return Promise.reject(Object.assign(new Error('Not logged in'), { status: 401 }));
    var go = function () { o.token = sess.access_token; return raw(path, o); };
    var p = sess.expires_at - 60 < now() ? refresh().then(go) : go();
    return p.catch(function (e) {
      if (e.status === 401 && !o._retried) { o._retried = true; return refresh().then(go); }
      throw e;
    });
  }

  C.onChange = function (f) { listeners.push(f); };
  C.user = function () { return sess && sess.user ? sess.user : null; };
  C.name = function () { var u = C.user(); return u && u.user_metadata && u.user_metadata.display_name ? u.user_metadata.display_name : ''; };
  C.back = function (p) { return new URL(p, location.href).href.split('#')[0]; };

  C.signUp = function (name, email, pw) {
    return raw('/auth/v1/signup?redirect_to=' + encodeURIComponent(C.back('account.html')), { method: 'POST', body: { email: email, password: pw, data: { display_name: name } } }).then(function (j) {
      if (j && j.access_token) { save(toSession(j)); emit('SIGNED_IN'); return { needsConfirm: false }; }
      return { needsConfirm: true };
    });
  };
  C.signIn = function (email, pw) {
    return raw('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email, password: pw } }).then(function (j) { save(toSession(j)); emit('SIGNED_IN'); });
  };
  C.signOut = function () {
    var t = sess && sess.access_token;
    var p = t ? raw('/auth/v1/logout?scope=local', { method: 'POST', token: t }).catch(function () { }) : Promise.resolve();
    return p.then(function () { save(null); emit('SIGNED_OUT'); });
  };
  C.recover = function (email) { return raw('/auth/v1/recover?redirect_to=' + encodeURIComponent(C.back('account.html')), { method: 'POST', body: { email: email } }); };
  C.updatePassword = function (pw) { return authed('/auth/v1/user', { method: 'PUT', body: { password: pw } }); };
  C.updateName = function (name) {
    return authed('/auth/v1/user', { method: 'PUT', body: { data: { display_name: name } } }).then(function (u) {
      if (sess && u) { sess.user = u; save(sess); }
      return C.db.upsert('profiles', { id: C.user().id, display_name: name }, 'id').catch(function () { });
    });
  };

  C.db = {
    select: function (table, qs) { return authed('/rest/v1/' + table + (qs ? '?' + qs : '')); },
    upsert: function (table, row, conflict) { return authed('/rest/v1/' + table + '?on_conflict=' + conflict, { method: 'POST', body: row, headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }); },
    insertIgnore: function (table, row, conflict) { return authed('/rest/v1/' + table + '?on_conflict=' + conflict, { method: 'POST', body: row, headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' } }); },
    insert: function (table, row) { return authed('/rest/v1/' + table, { method: 'POST', body: row, headers: { Prefer: 'return=minimal' } }); },
    remove: function (table, filter) { return authed('/rest/v1/' + table + '?' + filter, { method: 'DELETE' }); }
  };

  /* ----- start-up: read tokens from email links, restore session ----- */
  if (enabled) {
    load();
    var h = location.hash || '';
    if (/access_token=|error_description=|error=/.test(h)) {
      var q = new URLSearchParams(h.replace(/^#/, ''));
      if (q.get('access_token') && q.get('refresh_token')) {
        save(toSession({ access_token: q.get('access_token'), refresh_token: q.get('refresh_token'), expires_in: q.get('expires_in'), expires_at: Number(q.get('expires_at')) || 0, user: null }));
        C.recovery = q.get('type') === 'recovery'; C.fromLink = q.get('type') || 'link';
        authed('/auth/v1/user').then(function (u) { sess.user = u; save(sess); emit('SIGNED_IN'); }).catch(function () { save(null); C.notice = 'That link is not valid any more. Please request a new one.'; emit('SIGNED_OUT'); });
      } else if (q.get('error_description')) { C.notice = 'That link is invalid or has expired. Please request a new one.'; }
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
    }
    window.addEventListener('storage', function (e) { if (e.key === KEY) { var had = !!C.user(); load(); if (had !== !!C.user()) emit(C.user() ? 'SIGNED_IN' : 'SIGNED_OUT'); } });
    if (sess && sess.expires_at - 60 < now()) refresh().catch(function () { });
  }
  window.Cloud = C;
})();
