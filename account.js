(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var C = window.Cloud, EMAIL = 'Fxahmadey@gmail.com';
  var NAMES = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  function okEmail(e) { return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function busy(btn, on, label) { btn.disabled = on; if (on) { btn.setAttribute('data-l', btn.textContent); btn.textContent = 'Please wait\u2026'; } else btn.textContent = label || btn.getAttribute('data-l') || btn.textContent; }
  function dName() { return (C && C.name && C.name()) || (C && C.user() && C.user().email) || 'student'; }

  /* ---------- login controls in the menu ---------- */
  function navAuth() {
    var m = $('#menu'); if (!m || !C || !C.enabled) return;
    Array.prototype.forEach.call(m.querySelectorAll('.authitem'), function (e) { e.remove(); });
    var add = function (tag, text, href, cls) { var e = document.createElement(tag); e.textContent = text; if (href) e.href = href; e.className = 'authitem' + (cls ? ' ' + cls : ''); if (tag === 'button') e.type = 'button'; var cur = location.pathname.split('/').pop(); if (href && href === cur) e.setAttribute('aria-current', 'page'); m.appendChild(e); return e; };
    if (C.user()) {
      add('a', 'MY DASHBOARD', 'dashboard.html');
      add('button', 'LOG OUT', null, 'navbtn').addEventListener('click', function () { C.signOut().then(function () { if (/dashboard\.html$/.test(location.pathname)) location.href = 'index.html'; }); });
    } else {
      add('a', 'LOG IN', 'account.html#login');
      add('a', 'CREATE FREE ACCOUNT', 'account.html#signup', 'navcta');
    }
  }
  if (C && C.enabled) { navAuth(); C.onChange(navAuth); }

  var notReady = '<div class="card"><h3>Accounts are not set up yet</h3><p>Free accounts are coming to this site soon. All lessons, the quiz, the simulator and the risk calculator work without an account.</p><a class="btn o" href="learn.html">Go to Learn CRT</a></div>';
  var needLogin = '<div class="card"><h3>Please log in</h3><p>Log in to see your personal dashboard.</p><div class="btns"><a class="btn g" href="account.html#login">Log In</a><a class="btn o" href="account.html#signup">Create Free Account</a></div></div>';

  /* ---------- account page ---------- */
  var box = $('#authBox');
  if (box) {
    var mode = 'login';
    var fld = function (id, label, type, extra) { return '<label class="f" for="' + id + '">' + label + '</label><input class="t" id="' + id + '" type="' + type + '" ' + (extra || '') + '>'; };
    var show = function (m, msg, ok) {
      mode = m;
      var h = '';
      if (msg) h += '<div class="' + (ok ? 'okbox' : 'errbox') + '" role="' + (ok ? 'status' : 'alert') + '">' + esc(msg) + '</div>';
      if (m === 'login') h += '<form id="fLogin" class="card" novalidate><h3>Log in</h3>' + fld('aEmail', 'Email address', 'email', 'autocomplete="email" maxlength="254"') + fld('aPass', 'Password', 'password', 'autocomplete="current-password" maxlength="72"') + '<p class="err" id="aErr" role="alert"></p><div class="btns"><button class="btn g" type="submit">Log In</button></div><p class="note"><a href="#forgot" data-m="forgot">Forgot your password?</a> &middot; <a href="#signup" data-m="signup">Create a free account</a></p></form>';
      if (m === 'signup') h += '<form id="fSign" class="card" novalidate><h3>Create a free account</h3>' + fld('aName', 'Your name', 'text', 'autocomplete="name" maxlength="60"') + fld('aEmail', 'Email address', 'email', 'autocomplete="email" maxlength="254"') + fld('aPass', 'Password (at least 8 characters)', 'password', 'autocomplete="new-password" maxlength="72"') + fld('aPass2', 'Confirm password', 'password', 'autocomplete="new-password" maxlength="72"') + '<p class="note">We will email you a link to confirm your address. Never use your broker password here.</p><p class="err" id="aErr" role="alert"></p><div class="btns"><button class="btn g" type="submit">Create Account</button></div><p class="note">Already registered? <a href="#login" data-m="login">Log in</a></p></form>';
      if (m === 'forgot') h += '<form id="fForgot" class="card" novalidate><h3>Reset your password</h3><p>Enter your email address and we will send you a reset link.</p>' + fld('aEmail', 'Email address', 'email', 'autocomplete="email" maxlength="254"') + '<p class="err" id="aErr" role="alert"></p><div class="btns"><button class="btn g" type="submit">Send Reset Link</button></div><p class="note"><a href="#login" data-m="login">Back to log in</a></p></form>';
      if (m === 'reset') h += '<form id="fReset" class="card" novalidate><h3>Choose a new password</h3>' + fld('aPass', 'New password (at least 8 characters)', 'password', 'autocomplete="new-password" maxlength="72"') + fld('aPass2', 'Confirm new password', 'password', 'autocomplete="new-password" maxlength="72"') + '<p class="err" id="aErr" role="alert"></p><div class="btns"><button class="btn g" type="submit">Save New Password</button></div></form>';
      if (m === 'in') h += '<div class="card"><h3>You are logged in</h3><p>Signed in as <strong>' + esc(dName()) + '</strong>.</p><div class="btns"><a class="btn g" href="dashboard.html">My Dashboard</a><button class="btn o" type="button" id="aOut">Log Out</button></div></div>';
      box.innerHTML = h;
      var out = $('#aOut'); if (out) out.addEventListener('click', function () { C.signOut().then(function () { show('login', 'You have been logged out.', true); }); });
      Array.prototype.forEach.call(box.querySelectorAll('a[data-m]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); show(a.getAttribute('data-m')); }); });
      var f = box.querySelector('form'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); submit(f); });
    };
    var err = function (t) { $('#aErr').textContent = t; return false; };
    var submit = function (f) {
      var btn = f.querySelector('button[type=submit]'), email = f.querySelector('#aEmail') ? $('#aEmail').value.trim() : '', pw = f.querySelector('#aPass') ? $('#aPass').value : '';
      if (mode !== 'reset' && !okEmail(email)) return err('Enter a valid email address.');
      if (mode === 'login') { if (!pw) return err('Enter your password.'); busy(btn, true); C.signIn(email, pw).then(function () { location.href = 'dashboard.html'; }).catch(function (e) { busy(btn, false); err(C.friendly(e)); }); }
      else if (mode === 'forgot') { err(''); busy(btn, true); C.recover(email).then(function () { show('login', 'If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.', true); }).catch(function (e) { busy(btn, false); err(e && e.status === 429 ? C.friendly(e) : 'If an account exists for that email, a reset link is on its way.'); }); }
      else {
        if (pw.length < 8) return err('Use a password of at least 8 characters.');
        if (pw !== $('#aPass2').value) return err('The two passwords do not match.');
        if (mode === 'signup') {
          var name = $('#aName').value.trim(); if (!name || name.length > 60) return err('Enter your name (up to 60 characters).');
          busy(btn, true); C.signUp(name, email, pw).then(function (r) { if (r.needsConfirm) show('login', 'Almost done. We sent a confirmation link to your email. Click it, then log in here.', true); else location.href = 'dashboard.html'; })
            .catch(function (e) { busy(btn, false); err(e && e.status === 422 ? 'We could not create that account. If you already registered, log in or reset your password.' : C.friendly(e)); });
        } else if (mode === 'reset') {
          busy(btn, true); C.updatePassword(pw).then(function () { C.recovery = false; location.href = 'dashboard.html'; }).catch(function (e) { busy(btn, false); err(C.friendly(e)); });
        }
      }
    };
    if (!C || !C.enabled) box.innerHTML = notReady;
    else {
      var h0 = (location.hash || '').replace('#', '');
      if (C.recovery) show('reset', 'Your link worked. Choose a new password below.', true);
      else if (C.fromLink === 'signup') show(C.user() ? 'in' : 'login', 'Your email is confirmed. Welcome!', true);
      else if (C.notice) show('login', C.notice);
      else if (C.user()) show('in');
      else show(['signup', 'forgot'].indexOf(h0) > -1 ? h0 : 'login');
      C.onChange(function (ev) { if (ev === 'SIGNED_IN' && !C.recovery && mode !== 'in' && (C.fromLink === 'signup' || !$('#aErr'))) show('in', C.fromLink === 'signup' ? 'Your email is confirmed. Welcome!' : '', true); });
      window.addEventListener('hashchange', function () { var m = (location.hash || '').replace('#', ''); if (['login', 'signup', 'forgot'].indexOf(m) > -1 && !C.user()) show(m); });
    }
  }

  /* ---------- My Dashboard ---------- */
  var md = $('#myDash');
  if (md) {
    var rows = [];
    var stats = function (a) {
      var w = 0, l = 0, b = 0, o = 0, pl = 0, hasPl = false, rr = 0, nrr = 0;
      a.forEach(function (x) { if (x.result === 'Win') w++; else if (x.result === 'Loss') l++; else if (x.result === 'Breakeven') b++; else o++; if (x.result !== 'Open' && typeof x.profit_loss === 'number') { pl += x.profit_loss; hasPl = true; } if (typeof x.planned_rr === 'number') { rr += x.planned_rr; nrr++; } });
      var closed = w + l + b; return { n: a.length, w: w, l: l, b: b, o: o, closed: closed, wr: closed ? Math.round(w / closed * 1000) / 10 : null, pl: hasPl ? parseFloat(pl.toPrecision(12)) : null, rr: nrr ? Math.round(rr / nrr * 100) / 100 : null, nrr: nrr };
    };
    var csv = function () {
      var cols = ['trade_date', 'trade_time', 'instrument', 'session', 'strategy', 'direction', 'entry_price', 'stop_loss', 'take_profit', 'risk_percent', 'risk_amount', 'planned_rr', 'result', 'profit_loss', 'notes', 'mistakes', 'lessons'];
      var cell = function (v) { var s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
      var t = cols.join(',') + '\r\n' + rows.map(function (r) { return cols.map(function (c) { return cell(r[c]); }).join(','); }).join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv;charset=utf-8' })); a.download = 'crt-journal.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };
    var load = function () {
      md.innerHTML = '<p class="note">Loading your dashboard\u2026</p>';
      var q = function (t, s) { return C.db.select(t, s); };
      Promise.all([q('lesson_progress', 'select=lesson&order=lesson.asc'), q('quiz_results', 'select=score,total,taken_at&order=taken_at.desc&limit=500'), q('sim_results', 'select=level,score,taken_at&order=taken_at.desc&limit=200'), q('exercise_log', 'select=level,exercise,correct,answered_at&order=answered_at.desc&limit=5'), q('journal_entries', 'select=*&order=trade_date.desc,created_at.desc&limit=1000')])
        .then(function (r) { render(r); }).catch(function (e) { md.innerHTML = '<div class="errbox" role="alert">' + esc(C.friendly(e)) + ' <button class="btn o sm" type="button" id="dRetry">Try again</button></div>'; $('#dRetry').addEventListener('click', load); });
    };
    var render = function (r) {
      var les = r[0] || [], qz = r[1] || [], sim = r[2] || [], ex = r[3] || [], j = r[4] || []; rows = j;
      var u = C.user(), s = stats(j), best = 0; qz.forEach(function (x) { best = Math.max(best, x.score); });
      var lv = {}; sim.slice().reverse().forEach(function (x) { var o = lv[x.level] || { best: 0, runs: 0 }; o.best = Math.max(o.best, x.score); o.runs++; lv[x.level] = o; });
      var since = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      var h = '<div class="card"><h3>Welcome, ' + esc(dName()) + '</h3><p>' + esc(u.email || '') + (since ? ' &middot; member since ' + esc(since) : '') + '</p>' +
        '<form id="fName" novalidate><label class="f" for="nName">Display name</label><input class="t" id="nName" maxlength="60" value="' + esc(C.name()) + '"><p class="err" id="nErr" role="alert"></p><div class="btns"><button class="btn o sm" type="submit">Save name</button></div></form>' +
        '<div class="btns" style="margin-top:14px"><button class="btn o sm" type="button" id="dOut">Log Out</button><button class="btn o sm" type="button" id="dPw">Email me a password reset link</button><button class="btn o sm" type="button" id="dCsv">Export journal (CSV)</button></div><p class="note" id="dAct" aria-live="polite"></p></div>';
      h += '<div class="tdash" style="margin-top:14px"><div class="card"><h3>CRT lessons</h3><p>' + les.length + ' of 8 lessons completed.</p><div class="prog big"><i style="width:' + (les.length / 8 * 100) + '%"></i></div><a class="btn o sm" href="learn.html#learn">Go to lessons</a></div>' +
        '<div class="card"><h3>Quiz scores</h3><p>' + (qz.length ? 'Last: ' + qz[0].score + ' / ' + qz[0].total + '. Best: ' + best + ' / ' + qz[0].total + '. Attempts: ' + qz.length + '.' : 'No quiz attempts saved yet.') + '</p><a class="btn o sm" href="learn.html#learn">Take the quiz</a></div>' +
        '<div class="card"><h3>CRT Simulator</h3><p>' + (Object.keys(lv).length ? Object.keys(NAMES).filter(function (k) { return lv[k]; }).map(function (k) { return NAMES[k] + ': best ' + lv[k].best + ' / 3 (' + lv[k].runs + ' run' + (lv[k].runs > 1 ? 's' : '') + ')'; }).join('. ') + '.' : 'No simulator level completed yet.') + '</p>' + (ex.length ? '<p class="note">Recent: ' + ex.map(function (x) { return esc(NAMES[x.level]) + ' ' + esc(x.exercise) + (x.correct ? ' \u2713' : ' \u2717'); }).join(', ') + '</p>' : '') + '<a class="btn o sm" href="learn.html#simulator">Open simulator</a></div>' +
        '<div class="card"><h3>Trading journal</h3>' + (s.n ? '<p>' + s.n + ' trades: ' + s.w + ' wins, ' + s.l + ' losses, ' + s.b + ' breakeven, ' + s.o + ' open.</p><p>' + (s.wr === null ? 'Win rate: needs at least one closed trade.' : 'Win rate: ' + s.wr + '% of ' + s.closed + ' closed trades.') + '</p><p>' + (s.pl === null ? 'No profit/loss amounts recorded on closed trades.' : 'Closed-trade profit/loss recorded: ' + s.pl + '.') + '</p><p>' + (s.rr === null ? 'Average planned R:R: not enough data.' : 'Average planned R:R: 1 : ' + s.rr + ' (' + s.nrr + ' trade' + (s.nrr > 1 ? 's' : '') + ').') + '</p><p class="note">Open trades are not counted in win rate or profit/loss. Figures use only what you recorded and are not trading advice.</p>' : '<p>No trades recorded yet. Open the journal and add your first trade to see your statistics here.</p>') + '<a class="btn g sm" href="tools.html#journal">Open journal</a></div></div>';
      if (j.length) h += '<div class="card" style="margin-top:14px"><h3>Recent journal entries</h3>' + j.slice(0, 5).map(function (x) { return '<p>' + esc(x.trade_date) + ' &middot; ' + esc(x.instrument) + ' ' + esc(x.direction) + ' &middot; ' + esc(x.result) + (typeof x.profit_loss === 'number' ? ' &middot; ' + esc(x.profit_loss) : '') + '</p>'; }).join('') + '</div>';
      h += '<div class="card" style="margin-top:14px"><h3>Quick links</h3><div class="btns"><a class="btn g sm" href="tools.html#risk">Risk Calculator</a><a class="btn o sm" href="learn.html#simulator">CRT Simulator</a><a class="btn o sm" href="tools.html#journal">Trading Journal</a><a class="btn o sm" href="courses.html">Courses</a></div></div>' +
        '<div class="card" style="margin-top:14px"><h3>Your data</h3><p>Your journal, lesson progress and quiz and simulator results are saved to your account in a database hosted by Supabase, and database rules let each account read only its own records. You can export your journal above.</p><p>Account deletion is handled by request: <a href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Account deletion request') + '&body=' + encodeURIComponent('Please delete my AHMAD CRT SNIPER account and all saved records. Account email: ' + (u.email || '')) + '">email us to delete your account and records</a>.</p></div>';
      md.innerHTML = h;
      $('#dOut').addEventListener('click', function () { C.signOut().then(function () { location.href = 'index.html'; }); });
      $('#dCsv').addEventListener('click', function () { if (!rows.length) { $('#dAct').textContent = 'There are no journal entries to export yet.'; return; } csv(); $('#dAct').textContent = 'Journal exported.'; });
      $('#dPw').addEventListener('click', function () { var b = this; b.disabled = true; C.recover(u.email).then(function () { $('#dAct').textContent = 'Reset link sent. Check your inbox.'; b.disabled = false; }).catch(function (e) { $('#dAct').textContent = C.friendly(e); b.disabled = false; }); });
      $('#fName').addEventListener('submit', function (e) { e.preventDefault(); var n = $('#nName').value.trim(); if (!n || n.length > 60) { $('#nErr').textContent = 'Enter a name up to 60 characters.'; return; } $('#nErr').textContent = ''; C.updateName(n).then(function () { $('#dAct').textContent = 'Name saved.'; var hd = md.querySelector('h3'); if (hd) hd.textContent = 'Welcome, ' + n; }).catch(function (er) { $('#nErr').textContent = C.friendly(er); }); });
    };
    if (!C || !C.enabled) md.innerHTML = notReady;
    else if (!C.user()) { md.innerHTML = needLogin; C.onChange(function (ev) { if (ev === 'SIGNED_IN') load(); }); }
    else load();
  }
})();
