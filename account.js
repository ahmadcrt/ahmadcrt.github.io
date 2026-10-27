(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var C = window.Cloud, EMAIL = 'Fxahmadey@gmail.com';
  var NAMES = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  var COURSES = { master_class: 'Forex Trading Master Class', crt_mastery: 'CRT Mastery', crt_pdf: 'Complete CRT Course PDF' };
  var ESTAT = { requested: 'Requested. Confirmed after payment on WhatsApp.', active: 'Enrolled', completed: 'Completed', cancelled: 'Cancelled' };
  function okEmail(e) { return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function busy(btn, on, label) { if (btn.form) btn.form.setAttribute('data-busy', on ? '1' : ''); btn.disabled = on; if (on) { btn.setAttribute('data-l', btn.textContent); btn.textContent = 'Please wait\u2026'; } else btn.textContent = label || btn.getAttribute('data-l') || btn.textContent; }
  function lagosHour(d) { return parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hourCycle: 'h23', hour: '2-digit' }).format(d), 10) % 24; }
  /* 05:00-11:59 Morning, 12:00-16:59 Afternoon, 17:00-04:59 Evening (Nigeria time) */
  function greeting(d) { var h = lagosHour(d || new Date()); return h >= 5 && h < 12 ? 'Good Morning' : h >= 12 && h < 17 ? 'Good Afternoon' : 'Good Evening'; }
  window.CRT_greeting = greeting;
  function gname() { return (C && C.name && C.name()) || ''; }
  setInterval(function () { var g = $('#greet'); if (g) g.textContent = greeting() + (gname() ? ', ' + gname() : ''); }, 30000);
  function dName() { return (C && C.name && C.name()) || (C && C.user() && C.user().email) || 'student'; }

  /* ---------- login controls in the menu ---------- */
  function navAuth() {
    var m = $('#menu'); if (!m || !C || !C.enabled) return;
    Array.prototype.forEach.call(m.querySelectorAll('.authitem'), function (e) { e.remove(); });
    var add = function (tag, text, href, cls) { var e = document.createElement(tag); e.textContent = text; if (href) e.href = href; e.className = 'authitem' + (cls ? ' ' + cls : ''); if (tag === 'button') e.type = 'button'; var cur = location.pathname.split('/').pop(); if (href && href === cur) e.setAttribute('aria-current', 'page'); m.appendChild(e); return e; };
    if (C.user()) {
      add('a', 'MY DASHBOARD', 'dashboard.html');
      C.isAdmin().then(function (ok) { if (ok && C.user() && !m.querySelector('.adminlink')) { var l = add('a', 'ADMIN', 'admin.html'); l.classList.add('adminlink'); var lo = m.querySelector('.navbtn'); if (lo) m.insertBefore(l, lo); } });
      add('button', 'LOG OUT', null, 'navbtn').addEventListener('click', function () { C.signOut().then(function () { if (/dashboard\.html$/.test(location.pathname)) location.href = 'index.html'; }); });
    } else {
      add('a', 'LOG IN', 'account.html#login');
      add('a', 'CREATE FREE ACCOUNT', 'account.html#signup', 'navcta');
    }
  }
  if (C && C.enabled) { navAuth(); C.onChange(navAuth); }

  /* ---------- sign-up / dashboard buttons on public pages ---------- */
  function acctCta() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-acct="cta"]'), function (el) {
      if (!C || !C.enabled) { el.hidden = true; return; }
      el.hidden = false;
      if (C.user()) { el.textContent = 'My Dashboard'; el.href = 'dashboard.html'; } else { el.textContent = 'Create Free Account'; el.href = 'account.html#signup'; }
    });
  }
  acctCta(); if (C && C.enabled) C.onChange(acctCta);

  /* ---------- course tracking buttons ---------- */
  function trackBtns() { var on = !!(C && C.enabled && C.user()); Array.prototype.forEach.call(document.querySelectorAll('[data-track]'), function (b) { b.hidden = !on; }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-track]') : null; if (!b || !C || !C.user()) return;
    var msg = b.parentNode.querySelector('.ctrack'); b.disabled = true; msg.textContent = 'Saving\u2026';
    C.db.insertIgnore('enrollments', { course: b.getAttribute('data-course') }, 'user_id,course').then(function () { msg.textContent = 'Added to your dashboard as a request. Your enrolment is confirmed after payment on WhatsApp.'; b.disabled = false; })
      .catch(function (er) { msg.textContent = C.friendly(er); b.disabled = false; });
  });
  trackBtns(); if (C && C.enabled) C.onChange(trackBtns);

  /* ---------- mentorship enquiry ---------- */
  var mf = $('#mForm');
  if (mf) {
    var MLAB = { master_class: 'Forex Master Class guidance', crt_strategy: 'CRT strategy guidance', not_sure: 'not sure yet' };
    var mval = function () {
      var n = $('#mName').value.trim(), c = $('#mContact').value.trim(), i = $('#mInterest').value, m = $('#mMsg').value.trim(), er = $('#mErr'); er.textContent = ''; $('#mDone').textContent = '';
      if (!n || n.length > 60) { er.textContent = 'Enter your name (up to 60 characters).'; return null; }
      if (c.length < 3 || c.length > 100) { er.textContent = 'Enter your WhatsApp number or email address.'; return null; }
      if (!i) { er.textContent = 'Choose what you are interested in.'; return null; }
      return { name: n, contact: c, interest: i, message: m || null };
    };
    mf.addEventListener('submit', function (e) {
      e.preventDefault(); var v = mval(); if (!v) return;
      window.location.href = 'https://wa.me/2349166116812?text=' + encodeURIComponent('Hello Ahmad, I would like to join mentorship. Name: ' + v.name + '. Contact: ' + v.contact + '. Interested in: ' + MLAB[v.interest] + '.' + (v.message ? ' ' + v.message : ''));
    });
    $('#mSend').addEventListener('click', function () {
      var v = mval(); if (!v) return; var b = this; b.disabled = true; b.textContent = 'Sending\u2026';
      C.db.insert('mentorship_enquiries', v).then(function () { $('#mDone').textContent = 'Enquiry saved in your account for Ahmad to review. You can also message on WhatsApp.'; b.textContent = 'Send enquiry from my account'; b.disabled = false; $('#mMsg').value = ''; })
        .catch(function (er) { $('#mErr').textContent = C.friendly(er); b.textContent = 'Send enquiry from my account'; b.disabled = false; });
    });
    var mvis = function () { var on = !!(C && C.enabled && C.user()); $('#mSend').hidden = !on; $('#mHint').hidden = on || !(C && C.enabled); };
    mvis(); if (C && C.enabled) C.onChange(mvis);
  }

  var notReady = '<div class="card"><h3>Accounts are not set up yet</h3><p>Free accounts are coming to this site soon. All lessons, the quiz, the simulator and the risk calculator work without an account.</p><a class="btn o" href="learn.html">Go to Learn CRT</a></div>';
  var needLogin = '<div class="card"><h3>Please log in</h3><p>Log in to see your personal dashboard.</p><div class="btns"><a class="btn g" href="account.html#login">Log In</a><a class="btn o" href="account.html#signup">Create Free Account</a></div></div>';

  /* ---------- account page ---------- */
  var box = $('#authBox');
  if (box) {
    var mode = 'login';
    var fld = function (id, label, type, extra) {
      var inp = '<input class="t" id="' + id + '" type="' + type + '" ' + (extra || '') + '>';
      if (type === 'password') inp = '<div class="pw">' + inp + '<button type="button" class="pwt" data-for="' + id + '" aria-label="Show password" aria-pressed="false">Show</button></div>';
      return '<label class="f" for="' + id + '">' + label + '</label>' + inp;
    };
    var ico2 = function (n) { return '<svg class="ic" aria-hidden="true" focusable="false"><use href="icons.svg#i-' + n + '"/></svg>'; };
    var side = '<aside class="authside"><p class="eyebrow">AHMAD CRT SNIPER</p><h2>Learn CRT. Track your progress.</h2><ul><li>' + ico2('book') + 'Free CRT lessons, quiz and simulator</li><li>' + ico2('journal') + 'Trading journal saved to your account</li><li>' + ico2('dash') + 'Your progress on every device</li></ul></aside>';
    var show = function (m, msg, ok) {
      mode = m;
      var h = '';
      if (msg) h += '<div class="' + (ok ? 'okbox' : 'errbox') + '" role="' + (ok ? 'status' : 'alert') + '">' + esc(msg) + '</div>';
      if (m === 'login') h += '<form id="fLogin" class="card" novalidate><h2 class="authh">Welcome back</h2><p class="note">Log in to continue your CRT learning.</p>' + fld('aEmail', 'Email address', 'email', 'autocomplete="email" maxlength="254"') + fld('aPass', 'Password', 'password', 'autocomplete="current-password" maxlength="72"') + '<p class="err" id="aErr" role="alert"></p><div class="btns"><button class="btn g" type="submit">Log In</button></div><p class="note"><a href="#forgot" data-m="forgot">Forgot your password?</a> &middot; <a href="#signup" data-m="signup">Create a free account</a></p></form>';
      if (m === 'signup') h += '<form id="fSign" class="card" novalidate><h2 class="authh">Create your account</h2><p class="note">Free. Save your journal and progress on any device.</p>' + fld('aName', 'Your name', 'text', 'autocomplete="name" maxlength="60"') + fld('aEmail', 'Email address', 'email', 'autocomplete="email" maxlength="254"') + fld('aPass', 'Password (at least 8 characters)', 'password', 'autocomplete="new-password" maxlength="72"') + fld('aPass2', 'Confirm password', 'password', 'autocomplete="new-password" maxlength="72"') + '<p class="note">We will email you a link to confirm your address. Never use your broker password here.</p><p class="err" id="aErr" role="alert"></p><div class="btns"><button class="btn g" type="submit">Create Account</button></div><p class="note">Already registered? <a href="#login" data-m="login">Log in</a></p></form>';
      if (m === 'forgot') h += '<form id="fForgot" class="card" novalidate><h2 class="authh">Reset your password</h2><p class="note">Enter your email address and we will send you a reset link.</p>' + fld('aEmail', 'Email address', 'email', 'autocomplete="email" maxlength="254"') + '<p class="err" id="aErr" role="alert"></p><div class="btns"><button class="btn g" type="submit">Send Reset Link</button></div><p class="note"><a href="#login" data-m="login">Back to log in</a></p></form>';
      if (m === 'reset') h += '<form id="fReset" class="card" novalidate><h2 class="authh">Choose a new password</h2>' + fld('aPass', 'New password (at least 8 characters)', 'password', 'autocomplete="new-password" maxlength="72"') + fld('aPass2', 'Confirm new password', 'password', 'autocomplete="new-password" maxlength="72"') + '<p class="err" id="aErr" role="alert"></p><div class="btns"><button class="btn g" type="submit">Save New Password</button></div></form>';
      if (m === 'in') h += '<div class="card"><h3>You are logged in</h3><p>Signed in as <strong>' + esc(dName()) + '</strong>.</p><div class="btns"><a class="btn g" href="dashboard.html">My Dashboard</a><button class="btn o" type="button" id="aOut">Log Out</button></div></div>';
      box.innerHTML = m === 'in' ? h : '<div class="authgrid">' + side + '<div class="authmain">' + h + '</div></div>';
      Array.prototype.forEach.call(box.querySelectorAll('.pwt'), function (t) { t.addEventListener('click', function () { var i = document.getElementById(t.getAttribute('data-for')), s = i.type === 'password'; i.type = s ? 'text' : 'password'; t.textContent = s ? 'Hide' : 'Show'; t.setAttribute('aria-pressed', s ? 'true' : 'false'); t.setAttribute('aria-label', s ? 'Hide password' : 'Show password'); }); });
      var out = $('#aOut'); if (out) out.addEventListener('click', function () { C.signOut().then(function () { show('login', 'You have been logged out.', true); }); });
      Array.prototype.forEach.call(box.querySelectorAll('a[data-m]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); show(a.getAttribute('data-m')); }); });
      var f = box.querySelector('form'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); submit(f); });
    };
    var err = function (t) { $('#aErr').textContent = t; return false; };
    var submit = function (f) {
      if (f.getAttribute('data-busy') === '1') return;
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
      Promise.all([q('learning_progress', 'select=lesson&order=lesson.asc'), q('quiz_results', 'select=score,total,taken_at&order=taken_at.desc&limit=500'), q('sim_results', 'select=level,score,taken_at&order=taken_at.desc&limit=200'), q('exercise_log', 'select=level,exercise,correct,answered_at&order=answered_at.desc&limit=5'), q('trading_journal', 'select=*&order=trade_date.desc,created_at.desc&limit=1000'), q('enrollments', 'select=course,status,payment_status,created_at&order=created_at.desc').catch(function () { return []; })])
        .then(function (r) { render(r); }).catch(function (e) { md.innerHTML = '<div class="errbox" role="alert">' + esc(C.friendly(e)) + ' <button class="btn o sm" type="button" id="dRetry">Try again</button></div>'; $('#dRetry').addEventListener('click', load); });
    };
    var ico = function (n) { return '<svg class="ic" aria-hidden="true" focusable="false"><use href="icons.svg#i-' + n + '"/></svg>'; };
    var ring = function (n, t) { var c = 213.63; return '<svg class="ring" viewBox="0 0 80 80" role="img" aria-label="' + n + ' of ' + t + ' lessons completed"><circle class="rb" cx="40" cy="40" r="34"/><circle class="rf" cx="40" cy="40" r="34" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - (t ? n / t : 0))).toFixed(1) + '"/><text x="40" y="47" text-anchor="middle">' + n + '/' + t + '</text></svg>'; };
    var dc = function (icon, title, body, link) { return '<div class="card dcard2"><div class="dh"><span class="ib sm">' + ico(icon) + '</span><h3>' + title + '</h3></div>' + body + (link || '') + '</div>'; };
    var kpi = function (v, l) { return '<div class="kpi"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>'; };
    var render = function (r) {
      var les = (r[0] || []).map(function (x) { return x.lesson; }), qz = r[1] || [], sim = r[2] || [], ex = r[3] || [], j = r[4] || [], en = r[5] || []; rows = j;
      var u = C.user(), s = stats(j), best = 0; qz.forEach(function (x) { best = Math.max(best, x.score); });
      var lv = {}; sim.slice().reverse().forEach(function (x) { var o = lv[x.level] || { best: 0, runs: 0 }; o.best = Math.max(o.best, x.score); o.runs++; lv[x.level] = o; });
      var since = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      var nav = [['dash', 'Overview', 'dashboard.html'], ['book', 'Lessons', 'learn.html#learn'], ['target', 'Simulator', 'learn.html#simulator'], ['calc', 'Calculator', 'tools.html#risk'], ['journal', 'Journal', 'tools.html#journal'], ['chart', 'Sessions', 'tools.html#sessions'], ['cap', 'Courses', 'courses.html'], ['arrow', 'Website', 'index.html']];
      var h = '<div class="dlayout"><nav class="dnav" aria-label="Dashboard">' + nav.map(function (n) { return '<a href="' + n[2] + '"' + (n[1] === 'Overview' ? ' aria-current="page"' : '') + '>' + ico(n[0]) + '<span>' + n[1] + '</span></a>'; }).join('') + '</nav><div class="dmain">';
      h += '<div class="card"><div class="dh"><span class="ib sm">' + ico('user') + '</span><div><h2 id="greet" class="greet">' + greeting() + (gname() ? ', ' + esc(gname()) : '') + '</h2><p class="note" style="margin:0">' + esc(u.email || '') + (since ? ' &middot; member since ' + esc(since) : '') + '</p></div></div>' +
        '<form id="fName" novalidate><label class="f" for="nName">Display name</label><input class="t" id="nName" maxlength="60" value="' + esc(C.name()) + '"><p class="err" id="nErr" role="alert"></p><div class="btns"><button class="btn o sm" type="submit">Save name</button></div></form>' +
        '<div class="btns" style="margin-top:14px"><a class="btn g sm" href="index.html">Back to website</a><button class="btn o sm" type="button" id="dOut">Log Out</button><button class="btn o sm" type="button" id="dPw">Email me a password reset link</button><button class="btn o sm" type="button" id="dCsv">Export journal (CSV)</button></div><p class="note" id="dAct" aria-live="polite"></p></div>';
      var cs = en.length ? en.map(function (x) { var paid = x.payment_status === 'verified'; return '<div class="crow"><strong>' + esc(COURSES[x.course] || x.course) + '</strong><span class="chip2 ' + (x.status === 'cancelled' ? 'bad' : x.status === 'active' || x.status === 'completed' ? 'ok' : '') + '">' + esc({ requested: 'Requested', active: 'Enrolled', completed: 'Completed', cancelled: 'Cancelled' }[x.status] || x.status) + '</span><span class="chip2 ' + (paid ? 'ok' : '') + '">' + (paid ? 'Payment verified' : 'Payment not verified yet') + '</span></div>'; }).join('') + '<p class="note">Payments are confirmed by Ahmad after you pay on WhatsApp. Materials are sent by WhatsApp or email.</p>' : '<p>No course added yet. Choose a course and tap Add to my dashboard.</p>';
      h += '<div class="card" style="margin-top:14px"><div class="dh"><span class="ib sm">' + ico('chart') + '</span><h3>Forex sessions</h3></div><div id="sessMini"></div><a class="btn o sm" href="tools.html#sessions" style="margin-top:10px">Full session details</a></div>';
      h += '<div class="tdash" style="margin-top:14px">' + dc('cap', 'My courses', cs, '<a class="btn o sm" href="courses.html">View courses</a>');
      h += dc('book', 'Lessons', '<div class="rrow">' + ring(les.length, 8) + '<div><p style="margin:0"><strong>' + les.length + ' of 8</strong> free lessons completed</p><div class="dots" role="img" aria-label="Lessons completed">' + [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<span class="dot2' + (les.indexOf(n) > -1 ? ' on' : '') + '"></span>'; }).join('') + '</div></div></div>', '<a class="btn o sm" href="learn.html#learn">Go to lessons</a>');
      var recent = qz.slice(0, 5).reverse();
      h += dc('check', 'Quiz scores', qz.length ? '<div class="kpis">' + kpi(qz[0].score + '/' + qz[0].total, 'Last') + kpi(best + '/' + qz[0].total, 'Best') + kpi(qz.length, 'Attempts') + '</div><div class="bars" role="img" aria-label="Your last quiz scores">' + recent.map(function (x) { return '<span style="height:' + Math.max(8, Math.round(x.score / x.total * 100)) + '%" title="' + x.score + '/' + x.total + '"></span>'; }).join('') + '</div>' : '<p>No quiz attempts saved yet.</p>', '<a class="btn o sm" href="learn.html#learn">Take the quiz</a>');
      h += dc('target', 'CRT Simulator', '<div class="badges">' + Object.keys(NAMES).map(function (k) { var b = lv[k] ? lv[k].best : null; return '<div class="badge2' + (b === 3 ? ' ok' : '') + '"><b>' + NAMES[k] + '</b><span>' + (b === null ? 'Not done' : b + ' / 3') + '</span></div>'; }).join('') + '</div>' + (ex.length ? '<p class="note">Recent: ' + ex.map(function (x) { return esc(NAMES[x.level]) + ' ' + esc(x.exercise) + (x.correct ? ' \u2713' : ' \u2717'); }).join(', ') + '</p>' : ''), '<a class="btn o sm" href="learn.html#simulator">Open simulator</a>');
      h += dc('journal', 'Trading journal', s.n ? '<div class="kpis">' + kpi(s.n, 'Trades') + kpi(s.wr === null ? '\u2014' : s.wr + '%', 'Win rate') + kpi(s.pl === null ? '\u2014' : s.pl, 'Closed P/L') + kpi(s.rr === null ? '\u2014' : '1:' + s.rr, 'Avg planned R:R') + '</div><p class="note">' + s.w + ' wins, ' + s.l + ' losses, ' + s.b + ' breakeven, ' + s.o + ' open. Win rate counts closed trades only. Figures use only what you recorded and are not trading advice.</p>' : '<p>No trades recorded yet. Add your first trade to see your statistics.</p>', '<a class="btn g sm" href="tools.html#journal">Open journal</a>') + '</div>';
      if (j.length) h += '<div class="card" style="margin-top:14px"><div class="dh"><span class="ib sm">' + ico('chart') + '</span><h3>Recent journal entries</h3></div>' + j.slice(0, 5).map(function (x) { return '<div class="crow"><strong>' + esc(x.instrument) + ' ' + esc(x.direction) + '</strong><span class="note">' + esc(x.trade_date) + '</span><span class="chip2 ' + (x.result === 'Win' ? 'ok' : x.result === 'Loss' ? 'bad' : '') + '">' + esc(x.result) + '</span>' + (typeof x.profit_loss === 'number' ? '<span class="note">' + esc(x.profit_loss) + '</span>' : '') + '</div>'; }).join('') + '</div>';
      h += '<div class="card" style="margin-top:14px"><h3>Your data</h3><p>Your journal, progress, course requests and enquiries are saved to your account. Database rules let each account read only its own records. The site owner can see your name, email, course requests, mentorship enquiries and lesson progress, but not your journal.</p><p>Account deletion is handled by request: <a href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Account deletion request') + '&body=' + encodeURIComponent('Please delete my AHMAD CRT SNIPER account and all saved records. Account email: ' + (u.email || '')) + '">email us to delete your account and records</a>.</p></div>';
      md.innerHTML = h + '</div></div>';
      if (window.CRT_Sessions) window.CRT_Sessions.mount($('#sessMini'), { compact: true });
      $('#dOut').addEventListener('click', function () { C.signOut().then(function () { location.href = 'index.html'; }); });
      $('#dCsv').addEventListener('click', function () { if (!rows.length) { $('#dAct').textContent = 'There are no journal entries to export yet.'; return; } csv(); $('#dAct').textContent = 'Journal exported.'; });
      $('#dPw').addEventListener('click', function () { var b = this; b.disabled = true; C.recover(u.email).then(function () { $('#dAct').textContent = 'Reset link sent. Check your inbox.'; b.disabled = false; }).catch(function (e) { $('#dAct').textContent = C.friendly(e); b.disabled = false; }); });
      $('#fName').addEventListener('submit', function (e) { e.preventDefault(); var n = $('#nName').value.trim(); if (!n || n.length > 60) { $('#nErr').textContent = 'Enter a name up to 60 characters.'; return; } $('#nErr').textContent = ''; C.updateName(n).then(function () { $('#dAct').textContent = 'Name saved.'; var hd = $('#greet'); if (hd) hd.textContent = greeting() + ', ' + n; }).catch(function (er) { $('#nErr').textContent = C.friendly(er); }); });
    };
    if (!C || !C.enabled) md.innerHTML = notReady;
    else if (!C.user()) { md.innerHTML = '<p class="note">Please log in to see your dashboard. Taking you to the login page\u2026</p>' + needLogin; setTimeout(function () { if (!C.user()) location.replace('account.html#login'); }, 900); C.onChange(function (ev) { if (ev === 'SIGNED_IN') load(); }); }
    else load();
  }
})();
