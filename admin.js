/* Owner-only admin page. The page asks the database "is this account an admin?" (rpc is_admin) and the database
   itself refuses to return admin data to anyone else (Row Level Security). Hiding this page is NOT the protection. */
(function () {
  'use strict';
  var C = window.Cloud, box = document.getElementById('adminBox'); if (!box) return;
  document.body.classList.add('page-admin');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var COURSES = { master_class: 'Forex Trading Master Class', crt_mastery: 'CRT Mastery', crt_pdf: 'Complete CRT Course PDF' };
  var INTEREST = { master_class: 'Forex Master Class guidance', crt_strategy: 'CRT strategy guidance', not_sure: 'Not sure yet' };
  var flash = '';
  var ES = ['requested', 'active', 'completed', 'cancelled'], QS = ['new', 'contacted', 'closed'];
  function day(d) { var t = new Date(d); return isNaN(t) ? '' : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function card(h, t, extra) { return '<div class="card"><h3>' + h + '</h3><p>' + t + '</p>' + (extra || '') + '</div>'; }
  function fail(e) { box.innerHTML = '<div class="errbox" role="alert">' + esc(C.friendly(e)) + ' <button class="btn o sm" id="aRetry" type="button">Try again</button></div>'; document.getElementById('aRetry').addEventListener('click', start); }
  if (!C || !C.enabled) { box.innerHTML = card('Accounts are not set up', 'The admin area needs Supabase to be connected.'); return; }
  if (!C.user()) { box.innerHTML = '<p class="note">Please log in. Taking you to the login page\u2026</p>'; setTimeout(function () { if (!C.user()) location.replace('account.html#login'); }, 800); C.onChange(function (ev) { if (ev === 'SIGNED_IN') start(); }); return; }
  start();
  function start() {
    box.innerHTML = '<p class="note">Checking access\u2026</p>';
    C.db.rpc('is_admin').then(function (r) {
      if (r !== true) box.innerHTML = card('Access denied', 'This area is only for the website owner.', '<a class="btn o" href="index.html">Back to website</a>');
      else load();
    }).catch(fail);
  }
  function load() {
    box.innerHTML = '<p class="note">Loading\u2026</p>';
    var q = function (t, s) { return C.db.select(t, s); };
    Promise.all([q('profiles', 'select=id,display_name,email,created_at&order=created_at.desc&limit=1000'), q('enrollments', 'select=id,user_id,course,status,payment_status,verified_at,created_at&order=created_at.desc&limit=1000'), q('mentorship_enquiries', 'select=*&order=created_at.desc&limit=500'), q('learning_progress', 'select=user_id,lesson&limit=5000')]).then(render).catch(fail);
  }
  function sections(html) {
    var parts = html.split('<!--S:'), out = parts[0];
    for (var i = 1; i < parts.length; i++) {
      var k = parts[i].indexOf('-->'), title = parts[i].slice(0, k), body = parts[i].slice(k + 3);
      var cnt = (body.match(/class="arow"/g) || []).length, open = (title === 'Mentorship enquiries' || title === 'Course enrolments') ? ' open' : '';
      out += '<details class="asec"' + open + '><summary>' + title + (cnt ? ' <span class="acount">' + cnt + '</span>' : '') + '</summary>' + body + '</details>';
    }
    return out;
  }
  function sel(opts, cur, id, f, label) { return '<label class="sel">' + (label || '') + '<select data-f="' + f + '" data-id="' + esc(id) + '">' + opts.map(function (o) { return '<option' + (o === cur ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label>'; }
  function render(r) {
    var pr = r[0] || [], en = r[1] || [], mq = r[2] || [], lp = r[3] || [], by = {}, week = Date.now() - 7 * 864e5;
    pr.forEach(function (p) { by[p.id] = p; });
    var lessons = {}; lp.forEach(function (x) { lessons[x.user_id] = (lessons[x.user_id] || 0) + 1; });
    var who = function (id) { var p = by[id]; return p ? esc(p.display_name || 'No name') + (p.email ? ' &middot; ' + esc(p.email) : '') : 'Unknown user'; };
    var n = function (a, f) { return a.filter(f).length; };
    var h = '<div class="btns abar"><a class="btn g sm" href="index.html">Back to website</a><button class="btn o sm" type="button" id="aRefresh">Refresh</button><button class="btn o sm" type="button" id="aOut">Log Out</button></div><p class="note" id="aMsg" aria-live="polite"></p>';
    h += '<h2 class="h8">Overview</h2><div class="stats astats">' + [['Registered users', pr.length], ['Joined in the last 7 days', n(pr, function (p) { return new Date(p.created_at).getTime() > week; })], ['Enrolment requests', n(en, function (x) { return x.status === 'requested'; })], ['Payments awaiting verification', n(en, function (x) { return x.payment_status !== 'verified' && x.status !== 'cancelled'; })], ['Active enrolments', n(en, function (x) { return x.status === 'active'; })], ['New mentorship enquiries', n(mq, function (x) { return x.status === 'new'; })]].map(function (s) { return '<div class="stat"><b>' + s[1] + '</b>' + s[0] + '</div>'; }).join('') + '</div><p class="note">Figures come from the database. Only the first 1000 records are loaded.</p>';
    h += '<!--S:Mentorship enquiries-->' + (mq.length ? mq.map(function (x) { return '<div class="arow"><h4><span class="dot ' + (x.status === 'new' ? '' : x.status === 'closed' ? 'bad' : 'ok') + '"></span>' + esc(x.name) + '</h4><p>Contact: ' + esc(x.contact) + '</p><p>Interested in: ' + esc(INTEREST[x.interest] || x.interest) + ' &middot; ' + esc(day(x.created_at)) + '</p>' + (x.message ? '<p>' + esc(x.message) + '</p>' : '') + '<div class="btns">' + sel(QS, x.status, x.id, 'status').replace('<select', '<select data-t="mentorship_enquiries"') + '<button class="btn o sm" type="button" data-save>Save status</button></div></div>'; }).join('') : '<p class="note">No enquiries yet.</p>');
    h += '<!--S:Course enrolments--><p class="note">Verify payment yourself (WhatsApp or bank), then set the enrolment to active. The website never collects or confirms payments.</p>' + (en.length ? en.map(function (x) { return '<div class="arow"><h4><span class="dot ' + (x.status === 'active' || x.status === 'completed' ? 'ok' : x.status === 'cancelled' ? 'bad' : '') + '"></span>' + esc(COURSES[x.course] || x.course) + '</h4><p>' + who(x.user_id) + ' &middot; ' + esc(day(x.created_at)) + '</p><p>Payment: <strong>' + esc(x.payment_status === 'verified' ? 'Verified' + (x.verified_at ? ' on ' + day(x.verified_at) : '') : 'Not verified yet') + '</strong></p><div class="btns">' + sel(ES, x.status, x.id, 'status', 'Status ').replace('<select', '<select data-t="enrollments"') + sel(['unverified', 'verified'], x.payment_status || 'unverified', x.id, 'payment_status', 'Payment ').replace('<select', '<select data-t="enrollments"') + '<button class="btn o sm" type="button" data-save>Save status</button></div></div>'; }).join('') : '<p class="note">No enrolment requests yet.</p>');
    h += '<!--S:Students-->' + (pr.length ? pr.map(function (p) { var mine = en.filter(function (x) { return x.user_id === p.id; }).map(function (x) { return (COURSES[x.course] || x.course) + ' (' + x.status + ')'; }).join(', '); return '<div class="arow"><h4>' + esc(p.display_name || 'No name') + '</h4><p>' + esc(p.email || '') + '</p><p>Joined ' + esc(day(p.created_at)) + ' &middot; ' + (lessons[p.id] || 0) + ' of 8 free lessons completed</p>' + (mine ? '<p>Courses: ' + esc(mine) + '</p>' : '') + '</div>'; }).join('') : '<p class="note">No registered users yet.</p>');
    h += '<!--S:Not built yet--><div class="card"><p>Editing courses, lessons or website text from this page, suspending accounts and deleting accounts are not included. Course and lesson content lives in the website files. To delete a user, use Supabase: Authentication, Users.</p></div>';
    box.innerHTML = sections(h);
    if (flash) { document.getElementById('aMsg').textContent = flash; flash = ''; }
    document.getElementById('aRefresh').addEventListener('click', load);
    document.getElementById('aOut').addEventListener('click', function () { C.signOut().then(function () { location.href = 'index.html'; }); });
    Array.prototype.forEach.call(box.querySelectorAll('[data-save]'), function (b) {
      b.addEventListener('click', function () {
        var ss = b.parentNode.querySelectorAll('select'), s = ss[0], body = {}, msg = document.getElementById('aMsg'); b.disabled = true; msg.textContent = 'Saving\u2026';
        Array.prototype.forEach.call(ss, function (x) { body[x.getAttribute('data-f')] = x.value; });
        C.db.patch(s.getAttribute('data-t'), 'id=eq.' + encodeURIComponent(s.getAttribute('data-id')), body).then(function (rows) {
          b.disabled = false; if (!rows || !rows.length) { msg.textContent = 'Not saved. The database did not allow this change.'; return; } flash = 'Saved.'; load();
        }).catch(function (e) { b.disabled = false; msg.textContent = C.friendly(e); });
      });
    });
  }
})();
