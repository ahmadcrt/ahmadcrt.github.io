(function () {
  'use strict';
  var WA = '2349166116812';
  var PLAYLIST_ID = 'PLL9JUfhCNYEQ';

  /* ===== EASY TO UPDATE: add future trade videos here (newest first) =====
     id = the part after youtube.com/shorts/ (or youtu.be/) in the link */
  var TRADE_VIDEOS = [
    { id: 'M7zwY2m5faU', title: 'Latest CRT Sniper trade breakdown', note: 'Educational walkthrough of an actual CRT setup.' }
  ];

  var LESSONS = [
    { t: 'CRT fundamentals', p: ['CRT stands for Candle Range Theory. It treats the high and low of one candle as a map for what price may do next.', 'A common model uses three candles: accumulation (the range candle), manipulation (price pushes beyond one side of the range) and distribution (price moves back through the range).', 'This is a framework for reading price, not a rule. Sometimes it works and sometimes it fails.'], k: 'Mark the range first. Decide what you would do before price gets there.' },
    { t: 'Candle ranges', p: ['A candle range runs from its high to its low. Draw both lines, then add the 50% midpoint halfway between them.', 'Many students use a higher timeframe candle, such as the 4-hour, to set the range, then study smaller timeframes for detail.', 'The diagram below shows a range with its High, Low and 50% midpoint.'], k: 'High, Low and the 50% midpoint are the three lines you mark on every range.', d: true },
    { t: 'Liquidity', p: ['Liquidity is where many orders rest, usually stop orders just above recent highs and just below recent lows.', 'Price often moves beyond those levels briefly. This is called a sweep. After a sweep, price may reverse, but it may also keep going.', 'A sweep is a clue, never a guarantee.'], k: 'A sweep is a reason to pay attention, not a reason to enter.' },
    { t: 'Market structure', p: ['Structure is the pattern of highs and lows. Higher highs and higher lows describe an uptrend. Lower highs and lower lows describe a downtrend.', 'Check the bigger picture first. A setup that fits the larger direction is usually easier to read than one that fights it.', 'When structure is unclear, skipping the trade is a valid decision.'], k: 'Read the bigger direction before you look for a setup.' },
    { t: 'Entries', p: ['In CRT, many traders wait for price to sweep one side of the range and then close back inside it. Only then do they look for an entry.', 'Entry ideas include a smaller timeframe shift in structure, or a pullback toward the 50% midpoint.', 'Always decide your stop loss and target before you place the order.'], k: 'Patience matters more than speed. Fewer, clearer trades are easier to manage.' },
    { t: 'Confirmations', p: ['Confirmation means waiting for extra evidence. Examples include a candle that closes back inside the range or a shift in structure on a smaller timeframe.', 'A wick alone is weaker evidence than a close. Waiting for a close can mean a later entry, but it filters some false moves.', 'No confirmation removes risk. It only helps you be more selective.'], k: 'Confirmation improves selectivity. It does not remove risk.' },
    { t: 'Risk management', p: ['Decide how much you are willing to lose before every trade. Many educators suggest risking a small percentage of the account, such as 1% or less.', 'Place the stop loss where the idea is proven wrong, for example beyond the sweep. Then size the position so that a stop-out costs only the amount you chose.', 'Losing trades are normal. Protecting your account lets you keep learning.'], k: 'Size the trade from the stop distance, not from how confident you feel.' },
    { t: 'Trade execution', p: ['Use a simple checklist: 1) Mark the range. 2) Wait for a sweep. 3) Wait for confirmation. 4) Plan entry, stop and target. 5) Size the position. 6) Execute and leave the plan alone.', 'Record every trade in a journal, including the ones you skipped, and review it weekly.', 'Practise on a demo account first. Nothing here guarantees profit.'], k: 'Plan, execute, journal, review. Repeat.' }
  ];

  var QUIZ = [
    { q: 'What does CRT stand for?', o: ['Candle Range Theory', 'Currency Risk Trading', 'Chart Reversal Technique'], a: 0, e: 'CRT is Candle Range Theory.' },
    { q: 'Which three lines do you mark on a candle range?', o: ['Open, Close and Volume', 'High, Low and the 50% midpoint', 'Support, Resistance and Trend'], a: 1, e: 'High, Low and the 50% midpoint.' },
    { q: 'What is a liquidity sweep?', o: ['Price briefly moves beyond a recent high or low', 'A broker closing your trade', 'A new indicator signal'], a: 0, e: 'Price pushes past a level where orders rest, then may reverse or continue.' },
    { q: 'Why check the bigger structure first?', o: ['It guarantees a win', 'It gives context for whether a setup fits the larger direction', 'It removes the need for a stop loss'], a: 1, e: 'Context helps, but nothing guarantees a win.' },
    { q: 'In CRT, what do many traders wait for before looking for an entry?', o: ['A sweep and a close back inside the range', 'Any green candle', 'A news headline'], a: 0, e: 'A sweep followed by a close back inside the range.' },
    { q: 'What does confirmation do?', o: ['Removes all risk', 'Guarantees profit', 'Helps you be more selective'], a: 2, e: 'It improves selectivity. Risk remains.' },
    { q: 'Where is a sensible place for a stop loss?', o: ['Wherever feels comfortable', 'Where the trade idea is proven wrong', 'As far away as possible'], a: 1, e: 'Place it where the idea is invalid, then size the position to match.' },
    { q: 'What should you do after every trade?', o: ['Delete the chart', 'Record it in a journal and review it', 'Double the next position'], a: 1, e: 'Journaling and review build consistency.' }
  ];

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* menu */
  var burger = $('#burger'), menu = $('#menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var o = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* trade breakdown videos. videos.json is rewritten automatically by GitHub Actions from your YouTube playlist.
     If it cannot be loaded, the built-in TRADE_VIDEOS list is shown instead. Works with or without the card grid. */
  var box = $('#videoBox');
  if (box) {
    var grid = $('#videoList'), vt = $('#videoTitle'), vn = $('#videoNote'), vl = $('#videoLink'), vs = $('#videoStatus');
    var videos = TRADE_VIDEOS.slice(), cur = -1;
    var fmt = function (d) { var t = new Date(d); return (!d || isNaN(t)) ? '' : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
    var mark = function () {
      if (!grid) return;
      Array.prototype.forEach.call(grid.children, function (c, k) {
        c.classList.toggle('on', k === cur);
        var bt = c.querySelector('button'); bt.textContent = k === cur ? 'Now playing' : 'Play Video'; bt.setAttribute('aria-pressed', k === cur ? 'true' : 'false');
      });
    };
    var play = function (i, auto) {
      cur = i; var v = videos[i];
      box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(v.id) + '?rel=0&playsinline=1' + (auto ? '&autoplay=1' : '') + '" title="' + esc(v.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
      if (vt) vt.textContent = v.title;
      if (vn) vn.textContent = fmt(v.published) ? 'Published ' + fmt(v.published) : (v.note || '');
      if (vl) vl.href = 'https://youtube.com/watch?v=' + encodeURIComponent(v.id);
      mark();
      if (auto && box.scrollIntoView) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    var draw = function () {
      if (grid) {
        grid.innerHTML = videos.map(function (v, i) {
          return '<article class="vcard"><img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.id) + '/hqdefault.jpg" alt="" width="480" height="360" loading="lazy"><div class="vinfo"><h4>' + esc(v.title) + '</h4>' + (fmt(v.published) ? '<time datetime="' + esc(v.published) + '">' + fmt(v.published) + '</time>' : '') + '<button class="btn g sm" type="button" data-i="' + i + '">Play Video</button></div></article>';
        }).join('');
        Array.prototype.forEach.call(grid.querySelectorAll('img'), function (im) { im.addEventListener('error', function () { var c = im.closest('.vcard'); if (c) c.classList.add('noimg'); }); });
      }
      play(0, false);
    };
    if (grid) grid.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-i]') : null;
      if (b) play(Number(b.getAttribute('data-i')), true);
    });
    draw();
    var pb = $('#playlistBtn');
    if (pb) pb.addEventListener('click', function () {
      cur = -1;
      box.innerHTML = '<iframe src="https://www.youtube.com/embed/videoseries?list=' + encodeURIComponent(PLAYLIST_ID) + '&rel=0&playsinline=1" title="CRT Sniper trade breakdowns playlist" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
      if (vt) vt.textContent = 'All trade breakdowns (playlist)';
      if (vn) vn.textContent = 'Plays every video in the playlist, including the newest.';
      mark();
      if (box.scrollIntoView) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    if (window.fetch) {
      fetch('videos.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); }).then(function (d) {
        var ok = (d && Array.isArray(d.videos) ? d.videos : []).filter(function (v) { return v && /^[A-Za-z0-9_-]{11}$/.test(v.id) && v.title; });
        if (ok.length) { videos = ok; draw(); }
      }).catch(function () { if (vs) vs.textContent = 'The latest video list could not be loaded right now. Showing a saved video. Please refresh in a moment.'; });
    }
  }

  /* lessons */
  var L = $('#lessonBody');
  if (L) {
    var cur = 0, nav = $('#lessonNav'), prev = $('#prevBtn'), next = $('#nextBtn'), bar = $('#progBar'), cnt = $('#lessonCount');
    var tpl = $('#rangeDiagram');
    LESSONS.forEach(function (l, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = String(i + 1);
      b.setAttribute('aria-label', 'Lesson ' + (i + 1) + ': ' + l.t);
      b.addEventListener('click', function () { go(i); });
      nav.appendChild(b);
    });
    var go = function (i) {
      cur = Math.max(0, Math.min(LESSONS.length - 1, i));
      var l = LESSONS[cur];
      L.innerHTML = '<h3>Lesson ' + (cur + 1) + ': ' + esc(l.t) + '</h3>' + l.p.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + (l.d && tpl ? '<div class="diagram">' + tpl.innerHTML + '</div>' : '') + '<p class="key">' + esc(l.k) + '</p>';
      cnt.textContent = 'Lesson ' + (cur + 1) + ' of ' + LESSONS.length;
      bar.style.width = ((cur + 1) / LESSONS.length * 100) + '%';
      prev.disabled = cur === 0; next.disabled = cur === LESSONS.length - 1;
      Array.prototype.forEach.call(nav.children, function (b, j) { b.classList.toggle('on', j === cur); b.setAttribute('aria-pressed', j === cur ? 'true' : 'false'); });
    };
    prev.addEventListener('click', function () { go(cur - 1); });
    next.addEventListener('click', function () { go(cur + 1); });
    go(0);
  }

  /* quiz */
  var Q = $('#quizBody');
  if (Q) {
    var res = $('#quizResult'), render = function () {
      Q.innerHTML = QUIZ.map(function (x, i) {
        return '<div class="q" id="q' + i + '"><p>' + (i + 1) + '. ' + esc(x.q) + '</p>' + x.o.map(function (o, j) {
          return '<label><input type="radio" name="q' + i + '" value="' + j + '"><span>' + esc(o) + '</span></label>';
        }).join('') + '<p class="ex"></p></div>';
      }).join('');
      res.textContent = '';
    };
    render();
    $('#quizCheck').addEventListener('click', function () {
      var score = 0, answered = 0;
      QUIZ.forEach(function (x, i) {
        var sel = Q.querySelector('input[name="q' + i + '"]:checked'), el = $('#q' + i);
        el.className = 'q';
        if (!sel) return;
        answered++;
        var ok = Number(sel.value) === x.a;
        if (ok) score++;
        el.className = 'q ' + (ok ? 'ok' : 'bad');
        $('.ex', el).textContent = (ok ? 'Correct. ' : 'Not quite. ') + x.e;
      });
      if (answered < QUIZ.length) { res.textContent = 'Please answer all ' + QUIZ.length + ' questions first (' + answered + ' answered).'; return; }
      var m = score === 8 ? 'Excellent. You understand the basics well.' : score >= 6 ? 'Good work. Review the lessons for the ones you missed.' : score >= 4 ? 'A fair start. Go back through the lessons and try again.' : 'Take your time with the lessons, then retake the quiz.';
      res.textContent = 'Score: ' + score + ' / ' + QUIZ.length + '. ' + m;
    });
    $('#quizReset').addEventListener('click', render);
  }

  /* WhatsApp enrolment form */
  var f = $('#enrolForm');
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = f.elements.name.value.trim(), c = f.elements.course.value, m = f.elements.msg.value.trim(), er = $('#formErr');
      if (!n) { er.textContent = 'Please enter your name.'; f.elements.name.focus(); return; }
      if (!c) { er.textContent = 'Please choose a course.'; f.elements.course.focus(); return; }
      er.textContent = '';
      var t = 'Hello Ahmad, my name is ' + n + '. I want to enrol for: ' + c + '.' + (m ? ' ' + m : '');
      window.location.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);
    });
  }

  /* hide any image that fails to load (no broken-image icons) */
  Array.prototype.forEach.call(document.querySelectorAll('figure img'), function (im) {
    im.addEventListener('error', function () { var fg = im.closest('figure'); if (fg) fg.hidden = true; });
  });
})();


(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var S = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  function num(s) { s = String(s == null ? '' : s).replace(/,/g, '').trim(); if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN; var n = Number(s); return isFinite(n) ? n : NaN; }
  function clean(n) { return parseFloat(n.toPrecision(12)); }
  function levelsError(dir, e, s, t) {
    if (s === e) return 'The stop-loss price cannot be the same as the entry price.';
    if (dir === 'BUY') { if (s >= e) return 'For a BUY trade, the stop loss must be below the entry price.'; if (t <= e) return 'For a BUY trade, the take profit must be above the entry price.'; }
    else { if (s <= e) return 'For a SELL trade, the stop loss must be above the entry price.'; if (t >= e) return 'For a SELL trade, the take profit must be below the entry price.'; }
    return '';
  }
  /* ---------- risk calculator ---------- */
  var rf = $('#riskForm');
  if (rf) {
    var rOut = $('#rOut'), SYM = { USD: '$', NGN: '\u20A6' };
    var money = function (n, c) { return SYM[c] + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var fail = function (m) { rOut.innerHTML = '<div class="errbox" role="alert">' + esc(m) + '</div>'; };
    Array.prototype.forEach.call(document.querySelectorAll('#rPre .chip'), function (b) {
      b.addEventListener('click', function () { $('#rPct').value = b.getAttribute('data-v'); });
    });
    rf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var bal = num($('#rBal').value), pct = num($('#rPct').value), e = num($('#rEnt').value), s = num($('#rSl').value), t = num($('#rTp').value);
      var cur = $('#rCur').value, dir = $('#rDir').value, ins = $('#rIns').value.trim() || 'this trade';
      if (isNaN(bal)) return fail('Enter your account balance as a number.');
      if (bal <= 0) return fail('The account balance must be greater than zero.');
      if (bal > 1e12) return fail('The account balance is too large to calculate reliably.');
      if (isNaN(pct)) return fail('Enter a risk percentage as a number.');
      if (pct <= 0 || pct > 100) return fail('The risk percentage must be above 0 and no more than 100.');
      if (isNaN(e)) return fail('Enter the entry price as a number.');
      if (isNaN(s)) return fail('Enter the stop-loss price as a number.');
      if (isNaN(t)) return fail('Enter the take-profit price as a number.');
      if (e <= 0 || s <= 0 || t <= 0) return fail('Prices must be greater than zero.');
      var le = levelsError(dir, e, s, t); if (le) return fail(le);
      var risk = bal * pct / 100, sl = clean(Math.abs(e - s)), tp = clean(Math.abs(t - e)), rr = tp / sl, reward = risk * rr;
      var warn = pct > 5 ? '<div class="errbox">Caution: risking more than 5% of your account on one trade is considered very aggressive.</div>' : '';
      rOut.innerHTML = '<div class="out"><dl><dt>Amount at risk</dt><dd>' + money(risk, cur) + '</dd><dt>Stop-loss distance</dt><dd>' + sl + ' (price units)</dd><dt>Take-profit distance</dt><dd>' + tp + ' (price units)</dd><dt>Risk-to-reward ratio</dt><dd>1 : ' + (Math.round(rr * 100) / 100) + '</dd><dt>Estimated reward at take profit</dt><dd>' + money(reward, cur) + '</dd></dl><p>' + esc('If this ' + dir + ' on ' + ins + ' is stopped out, you would lose about ' + money(risk, cur) + ' (' + pct + '% of your balance). If it reaches your take profit, the estimated gain is ' + money(reward, cur) + '. This assumes your position size is chosen so that a stop-out costs exactly the amount at risk.') + '</p></div>' + warn;
    });
    $('#rReset').addEventListener('click', function () { rf.reset(); $('#rPct').value = '1'; rOut.innerHTML = ''; });
  }
  /* ---------- progress storage ---------- */
  var LES = 'crt.lessons', QZ = 'crt.quiz', SIM = 'crt.sim', JR = 'crt.journal';
  var lessonsDone = function () { var a = S.get(LES, []); return Array.isArray(a) ? a : []; };
  var cloudOn = !!(window.Cloud && Cloud.enabled);
  function loggedIn() { return cloudOn && !!Cloud.user(); }
  function toast(msg) { var t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 8000); }
  function failSave(e) { toast('Could not save to your account: ' + (Cloud.friendly ? Cloud.friendly(e) : 'please try again.') + ' Your change is kept on this device only.'); }
  var sync = {
    lesson: function (n) { if (loggedIn()) Cloud.db.insertIgnore('lesson_progress', { lesson: n }, 'user_id,lesson').catch(failSave); },
    quiz: function (s, t) { if (loggedIn()) Cloud.db.insert('quiz_results', { score: s, total: t }).catch(failSave); },
    exercise: function (x) { if (loggedIn()) Cloud.db.insert('exercise_log', { level: x.l, exercise: x.n, correct: x.ok }).catch(failSave); },
    level: function (l, s) { if (loggedIn()) Cloud.db.insert('sim_results', { level: l, score: s }).catch(failSave); }
  };
  function clearLocal() { try { localStorage.removeItem(LES); localStorage.removeItem(QZ); localStorage.removeItem(SIM); } catch (e) { } }
  function pullAll() {
    return Promise.all([Cloud.db.select('lesson_progress', 'select=lesson'), Cloud.db.select('quiz_results', 'select=score,total,taken_at&order=taken_at.desc&limit=500'), Cloud.db.select('sim_results', 'select=level,score,taken_at&order=taken_at.desc&limit=200'), Cloud.db.select('exercise_log', 'select=level,exercise,correct,answered_at&order=answered_at.desc&limit=30')]).then(function (r) {
      S.set(LES, (r[0] || []).map(function (x) { return x.lesson; }));
      var q = r[1] || [];
      if (q.length) { var best = 0; q.forEach(function (x) { best = Math.max(best, x.score); }); S.set(QZ, { last: q[0].score, total: q[0].total, best: best, attempts: q.length }); } else { try { localStorage.removeItem(QZ); } catch (e) { } }
      var lv = {}; (r[2] || []).slice().reverse().forEach(function (x) { var o = lv[x.level] || { best: 0, runs: 0 }; o.best = Math.max(o.best, x.score); o.last = x.score; o.runs++; lv[x.level] = o; });
      S.set(SIM, { levels: lv, log: (r[3] || []).slice().reverse().map(function (x) { return { t: String(x.answered_at).slice(0, 10), l: x.level, n: x.exercise, ok: x.correct }; }) });
    });
  }
  var L = $('#lessonBody');
  function addDone() {
    if (!L || L.querySelector('#doneBtn')) return;
    var m = /Lesson (\d+) of/.exec(($('#lessonCount') || {}).textContent || ''); if (!m) return;
    var n = Number(m[1]), p = document.createElement('p'), b = document.createElement('button');
    b.type = 'button'; b.id = 'doneBtn'; b.className = 'btn o sm';
    var paint = function () { var d = lessonsDone().indexOf(n) > -1; b.textContent = d ? 'Lesson completed' : 'Mark lesson complete'; b.setAttribute('aria-pressed', d ? 'true' : 'false'); };
    b.addEventListener('click', function () { var a = lessonsDone(); if (a.indexOf(n) < 0) a.push(n); S.set(LES, a); sync.lesson(n); paint(); dash(); });
    paint(); p.appendChild(b); L.appendChild(p);
  }
  if (L && window.MutationObserver) { addDone(); new MutationObserver(addDone).observe(L, { childList: true }); }
  var QR = $('#quizResult');
  if (QR && window.MutationObserver) {
    new MutationObserver(function () {
      var m = /Score: (\d+) \/ (\d+)/.exec(QR.textContent); if (!m) return;
      var q = S.get(QZ, { best: 0 }); q.last = Number(m[1]); q.total = Number(m[2]); q.best = Math.max(q.best || 0, q.last); q.attempts = (q.attempts || 0) + 1; S.set(QZ, q); sync.quiz(q.last, q.total); dash();
    }).observe(QR, { childList: true });
  }
  /* ---------- CRT simulator ---------- */
  var R0 = [104, 120, 100, 116], SW = [110, 112, 94, 108];
  var EX = {
    beginner: [
      { c: [R0], hl: 0, ln: [['A', 100], ['B', 120], ['C', 110]], q: 'The highlighted range candle has a high of 120 and a low of 100. Which line marks the 50% midpoint?', o: ['Line A', 'Line B', 'Line C'], a: 2, e: 'The midpoint is halfway between the high and the low: (120 + 100) \u00F7 2 = 110, which is line C. Line B is the high and line A is the low.' },
      { c: [[52, 60, 40, 46]], hl: 0, ln: [['A', 50], ['B', 40], ['C', 60]], q: 'This range candle has a high of 60 and a low of 40. Which line marks the candle HIGH?', o: ['Line A', 'Line B', 'Line C'], a: 2, e: 'The high is the very top of the candle, including the wick. That is 60, line C. Line A (50) is the midpoint and line B (40) is the low.' },
      { c: [R0, SW], hl: 0, ln: [['H', 120], ['L', 100]], q: 'The second candle wicked below the range low (line L) but closed back inside the range at 108. What is this called?', o: ['A liquidity sweep of the low', 'A confirmed breakout lower', 'Nothing happened'], a: 0, e: 'Price reached below the low, where stop orders often rest, then closed back inside the range. That is a liquidity sweep. It is a clue, not a guarantee of what comes next.' }
    ],
    intermediate: [
      { c: [R0, [116, 127, 112, 113]], hl: 0, ln: [['H', 120], ['M', 110], ['L', 100]], q: 'The second candle pushed above the range high (line H) but closed back inside at 113. Which side was swept, and what might a CRT student watch for?', o: ['The high was swept; price may move back toward the midpoint or low', 'The low was swept; price must now rise', 'No sweep occurred'], a: 0, e: 'Price took the liquidity above the high, then closed back inside. CRT students then watch for movement back through the range. It is a possibility, never a certainty.' },
      { c: [R0, [104, 106, 90, 94]], hl: 0, ln: [['H', 120], ['L', 100]], q: 'The second candle wicked below the low and closed at 94, below the range low of 100. Is this a sweep that closed back inside the range?', o: ['Yes, it closed back inside', 'No, it closed outside the range, so it does not match the pattern', 'Yes, any wick below the low counts'], a: 1, e: 'A close below the low means price accepted lower prices, which looks more like a breakout than a sweep and reclaim. The pattern needs a close back inside the range.' },
      { c: [R0, SW, [108, 110, 104, 106], [106, 113, 105, 111], [111, 112, 107, 108], [108, 118, 107, 116]], hl: 0, ln: [['S', 113], ['L', 100]], q: 'After the sweep, price made a short-term high at line S (113). Which event could signal a market structure shift to the upside?', o: ['A candle closing above line S', 'A candle wicking back to the sweep low', 'A candle closing at 106'], a: 0, e: 'Closing above the latest short-term high breaks the pattern of lower highs and may signal a shift in structure. Many students wait for this close before acting.' }
    ],
    advanced: [
      { c: [R0, SW, [108, 112, 106, 111]], hl: 0, ln: [['H', 120], ['M', 110], ['W', 94]], q: 'A long idea follows the sweep of the low. Where do many CRT students place the stop loss?', o: ['Just below the sweep wick (line W)', 'At the 50% midpoint (line M)', 'Above the range high (line H)'], a: 0, e: 'If price trades back below the sweep wick, the sweep idea has failed, so the stop goes just beyond it. A stop at the midpoint or above the high would not match the idea.' },
      { c: [R0, SW], hl: 0, ln: [['E', 110], ['S', 95], ['T', 140]], q: 'Entry 110, stop loss 95, take profit 140 (hypothetical numbers). What is the risk-to-reward ratio?', o: ['1 : 1', '1 : 2', '1 : 3'], a: 1, e: 'Risk = 110 \u2212 95 = 15. Reward = 140 \u2212 110 = 30. 30 \u00F7 15 = 2, so the ratio is 1 : 2.' },
      { c: [R0, SW, [108, 112, 106, 111]], hl: 0, ln: [['H', 120], ['M', 110], ['W', 94]], q: 'For a long idea after a low sweep, which level is a commonly taught first target?', o: ['The 50% midpoint (line M)', 'Below the sweep wick (line W)', 'There is never a target'], a: 0, e: 'Many CRT lessons use the midpoint as a first target and the opposite side of the range as a final target. This is a teaching convention, not a rule that price must reach it.' }
    ]
  };
  var NAMES = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  var sBox = $('#sBox'), st = { l: 'beginner', i: 0, score: 0, done: false };
  function chart(ex) {
    var W = 360, H = 230, pad = 16, lo = 1e9, hi = -1e9;
    ex.c.forEach(function (k) { lo = Math.min(lo, k[2]); hi = Math.max(hi, k[1]); });
    ex.ln.forEach(function (l) { lo = Math.min(lo, l[1]); hi = Math.max(hi, l[1]); });
    lo -= 4; hi += 4;
    var y = function (p) { return pad + (hi - p) / (hi - lo) * (H - 2 * pad); }, step = 280 / Math.max(ex.c.length, 3);
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Hypothetical candlestick chart with labelled price lines">';
    ex.ln.forEach(function (l) {
      s += '<line x1="8" x2="318" y1="' + y(l[1]) + '" y2="' + y(l[1]) + '" stroke="#f0cf86" stroke-width="2" stroke-dasharray="7 5"/><text x="326" y="' + (y(l[1]) + 6) + '" fill="#f0cf86" font-size="20" font-weight="700">' + esc(l[0]) + '</text>';
    });
    ex.c.forEach(function (k, i) {
      var x = 16 + i * step + step / 2, up = k[3] >= k[0], col = up ? '#4cc38a' : '#ff8f7e', w = Math.min(34, step * .6);
      s += '<line x1="' + x + '" x2="' + x + '" y1="' + y(k[1]) + '" y2="' + y(k[2]) + '" stroke="' + col + '" stroke-width="3"/><rect x="' + (x - w / 2) + '" y="' + y(Math.max(k[0], k[3])) + '" width="' + w + '" height="' + Math.max(3, Math.abs(y(k[0]) - y(k[3]))) + '" fill="' + col + '"/>';
      if (i === ex.hl) s += '<rect x="' + (x - w / 2 - 6) + '" y="' + (y(k[1]) - 6) + '" width="' + (w + 12) + '" height="' + (y(k[2]) - y(k[1]) + 12) + '" fill="none" stroke="#d9b25a" stroke-width="2.5" rx="4"/>';
    });
    return s + '</svg>';
  }
  function shuffle(a) { var r = a.map(function (t, i) { return { t: t, i: i }; }); for (var i = r.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = r[i]; r[i] = r[j]; r[j] = x; } return r; }
  function logSim(entry) { sync.exercise(entry); var d = S.get(SIM, { levels: {}, log: [] }); d.log = (d.log || []).concat([entry]).slice(-30); S.set(SIM, d); }
  function drawSim() {
    Array.prototype.forEach.call(document.querySelectorAll('#sLevels .chip'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-l') === st.l ? 'true' : 'false'); b.classList.toggle('on', b.getAttribute('data-l') === st.l); });
    var list = EX[st.l];
    if (st.done) {
      var m = st.score === 3 ? 'Excellent work.' : st.score === 2 ? 'Good. Review the explanation you missed.' : 'Keep practising. Re-read the lessons, then try again.';
      sBox.innerHTML = '<h3>' + NAMES[st.l] + ' complete</h3><p class="result">Score: ' + st.score + ' / 3</p><p>' + m + '</p><div class="btns"><button class="btn g" type="button" id="sRestart">Restart ' + NAMES[st.l] + '</button></div>';
      $('#sRestart').addEventListener('click', function () { st = { l: st.l, i: 0, score: 0, done: false }; drawSim(); });
      return;
    }
    var ex = list[st.i], opts = shuffle(ex.o);
    sBox.innerHTML = '<div class="tag">' + NAMES[st.l] + ' &middot; Exercise ' + (st.i + 1) + ' of 3 &middot; Score ' + st.score + '</div><span class="badge">HYPOTHETICAL EXAMPLE &middot; NOT REAL MARKET DATA</span><div class="simchart">' + chart(ex) + '</div><p><strong>' + esc(ex.q) + '</strong></p><div id="sOpts"></div><div id="sFb" aria-live="polite"></div><div class="btns"><button class="btn g" type="button" id="sNext" hidden>' + (st.i === 2 ? 'See results' : 'Next Exercise') + '</button><button class="btn o" type="button" id="sRe">Restart</button></div>';
    var box = $('#sOpts');
    opts.forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = o.t; b.setAttribute('data-correct', o.i === ex.a ? '1' : '0');
      b.addEventListener('click', function () {
        var ok = o.i === ex.a; if (ok) st.score++;
        Array.prototype.forEach.call(box.children, function (x) { x.disabled = true; if (x.getAttribute('data-correct') === '1') x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        $('#sFb').innerHTML = '<div class="' + (ok ? 'okbox' : 'errbox') + '">' + (ok ? 'Correct. ' : 'Not quite. ') + esc(ex.e) + '</div>';
        $('#sNext').hidden = false;
        logSim({ t: new Date().toISOString().slice(0, 10), l: st.l, n: st.i + 1, ok: ok });
        dash();
      });
      box.appendChild(b);
    });
    $('#sNext').addEventListener('click', function () {
      if (st.i === 2) { st.done = true; var d = S.get(SIM, { levels: {}, log: [] }); var lv = d.levels[st.l] || { best: 0, runs: 0 }; lv.best = Math.max(lv.best, st.score); lv.last = st.score; lv.runs++; d.levels[st.l] = lv; S.set(SIM, d); sync.level(st.l, st.score); dash(); } else st.i++;
      drawSim();
    });
    $('#sRe').addEventListener('click', function () { st = { l: st.l, i: 0, score: 0, done: false }; drawSim(); });
  }
  if (sBox) {
    Array.prototype.forEach.call(document.querySelectorAll('#sLevels .chip'), function (b) { b.addEventListener('click', function () { st = { l: b.getAttribute('data-l'), i: 0, score: 0, done: false }; drawSim(); }); });
    drawSim();
  }
  /* ---------- trading journal (saved to the user's account when logged in) ---------- */
  var jf = $('#jForm'), editId = null, pendingId = null, jrows = [], jBusy = false, JLOCAL = 'crt.journal';
  function uuid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
  function jMode() { return !cloudOn ? 'local' : (Cloud.user() ? 'cloud' : 'login'); }
  function norm(x) {
    if (!x || typeof x !== 'object' || !x.id) return null;
    if (x.ins !== undefined || x.date !== undefined) return { id: x.id, trade_date: x.date || '', trade_time: null, instrument: x.ins || '', session: null, strategy: x.str || null, direction: x.dir || 'BUY', entry_price: x.ent == null ? null : x.ent, stop_loss: x.sl == null ? null : x.sl, take_profit: x.tp == null ? null : x.tp, risk_percent: x.risk == null ? null : x.risk, risk_amount: null, planned_rr: x.rr == null ? null : x.rr, result: x.res || 'Open', profit_loss: typeof x.pl === 'number' ? x.pl : null, notes: x.notes || null, mistakes: null, lessons: x.les || null };
    return x;
  }
  function jLoad() {
    if (jMode() === 'cloud') return Cloud.db.select('journal_entries', 'select=*&order=trade_date.desc,created_at.desc&limit=1000').then(function (a) { return (a || []).map(norm).filter(Boolean); });
    var a = S.get(JLOCAL, []); return Promise.resolve((Array.isArray(a) ? a : []).map(norm).filter(Boolean));
  }
  function jPut(rec) {
    if (jMode() === 'cloud') return Cloud.db.upsert('journal_entries', rec, 'id');
    var all = (S.get(JLOCAL, []) || []).map(norm).filter(Boolean), i = all.findIndex(function (y) { return y.id === rec.id; });
    if (i > -1) all[i] = rec; else all.push(rec);
    return S.set(JLOCAL, all) ? Promise.resolve() : Promise.reject(new Error('local'));
  }
  function jDel(id) {
    if (jMode() === 'cloud') return Cloud.db.remove('journal_entries', 'id=eq.' + encodeURIComponent(id));
    S.set(JLOCAL, (S.get(JLOCAL, []) || []).map(norm).filter(Boolean).filter(function (y) { return y.id !== id; })); return Promise.resolve();
  }
  function jfail(e) { return (jMode() === 'cloud' && Cloud.friendly ? Cloud.friendly(e) : 'Could not save in this browser.') + ' Your entry is still in the form, so you can try again.'; }
  function jmsg(t, ok) { $('#jMsg').innerHTML = t ? '<div class="' + (ok ? 'okbox' : 'errbox') + '" role="' + (ok ? 'status' : 'alert') + '">' + esc(t) + '</div>' : ''; }
  function fillSel(id, vals, all) { var el = $(id), cur = el.value; el.innerHTML = '<option value="">' + all + '</option>' + vals.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join(''); el.value = vals.indexOf(cur) > -1 ? cur : ''; }
  function uniq(a, k) { var seen = {}, out = []; a.forEach(function (x) { var v = (x[k] || '').trim(), key = v.toLowerCase(); if (v && !seen[key]) { seen[key] = 1; out.push(v); } }); return out.sort(); }
  function jstats(a) {
    var w = 0, l = 0, b = 0, o = 0, pl = 0, hasPl = false, rr = 0, nrr = 0;
    a.forEach(function (x) {
      if (x.result === 'Win') w++; else if (x.result === 'Loss') l++; else if (x.result === 'Breakeven') b++; else o++;
      if (x.result !== 'Open' && typeof x.profit_loss === 'number') { pl += x.profit_loss; hasPl = true; }
      if (typeof x.planned_rr === 'number') { rr += x.planned_rr; nrr++; }
    });
    var closed = w + l + b; return { n: a.length, w: w, l: l, b: b, o: o, closed: closed, wr: closed ? Math.round(w / closed * 1000) / 10 : null, pl: hasPl ? clean(pl) : null, rr: nrr ? Math.round(rr / nrr * 100) / 100 : null, nrr: nrr };
  }
  window.CRT_jstats = jstats;
  function jgate() {
    var m = jMode(), g = $('#jGate'), app = $('#jApp'); if (!g) return;
    if (m === 'login') { g.innerHTML = '<div class="card"><h3>Log in to use your journal</h3><p>Your journal is saved to your own account, so you can open it on any device. Public lessons and tools stay free without an account.</p><div class="btns"><a class="btn g" href="account.html#login">Log In</a><a class="btn o" href="account.html#signup">Create Free Account</a></div></div>'; app.hidden = true; }
    else { app.hidden = false; g.innerHTML = m === 'cloud' ? '<p class="okbox">Signed in. Entries are saved to your account and available on any device where you log in.</p>' : '<p class="disc">Account features are not set up on this site yet, so entries are saved in this browser on this device only. They are not synced, not cloud storage and not password protected. Never enter passwords or broker login details.</p>'; }
  }
  function jrender() {
    var box = $('#jList'); if (!box) return Promise.resolve();
    box.innerHTML = '<p class="note">Loading your entries\u2026</p>';
    return jLoad().then(function (all) { jrows = all; jdraw(); }).catch(function (e) {
      box.innerHTML = '<div class="errbox" role="alert">' + esc(jMode() === 'cloud' && Cloud.friendly ? Cloud.friendly(e) : 'Could not load entries.') + ' <button type="button" class="btn o sm" id="jRetry">Try again</button></div>';
      $('#jRetry').addEventListener('click', jrender);
    });
  }
  function jdraw() {
    var all = jrows; fillSel('#fIns', uniq(all, 'instrument'), 'All instruments'); fillSel('#fStr', uniq(all, 'strategy'), 'All strategies');
    var s = jstats(all);
    $('#jStats').innerHTML = [['Total trades', s.n], ['Wins', s.w], ['Losses', s.l], ['Breakeven', s.b], ['Open', s.o], ['Win rate', s.wr === null ? '\u2014' : s.wr + '%'], ['Closed-trade profit / loss', s.pl === null ? '\u2014' : s.pl], ['Average planned R:R', s.rr === null ? '\u2014' : '1 : ' + s.rr]].map(function (p) { return '<div class="stat"><b>' + esc(p[1]) + '</b>' + p[0] + '</div>'; }).join('');
    $('#jPerf').textContent = s.n ? 'Win rate = wins \u00F7 closed trades (wins, losses, breakeven); open trades are not counted. Profit/loss adds the amounts you entered for closed trades, in your own units. Average R:R uses ' + s.nrr + ' trade(s) with a planned ratio.' : 'No trades recorded yet. Add your first entry above.';
    var fi = $('#fIns').value.toLowerCase(), fs = $('#fStr').value.toLowerCase(), fr = $('#fRes').value, q = ($('#fQ').value || '').toLowerCase();
    var list = all.filter(function (x) { return (!fi || (x.instrument || '').toLowerCase() === fi) && (!fs || (x.strategy || '').toLowerCase() === fs) && (!fr || x.result === fr) && (!q || [x.instrument, x.strategy, x.notes, x.mistakes, x.lessons].join(' ').toLowerCase().indexOf(q) > -1); });
    var box = $('#jList'); box.innerHTML = '';
    if (!list.length) { box.innerHTML = '<p class="note">' + (all.length ? 'No entries match these filters.' : 'No saved entries yet.') + '</p>'; return; }
    list.forEach(function (x) {
      var d = document.createElement('div'); d.className = 'entry';
      d.innerHTML = '<h4>' + esc(x.instrument) + ' &middot; ' + esc(x.direction) + '</h4><p><span class="pill ' + esc(x.result) + '">' + esc(x.result) + '</span>' + esc(x.trade_date) + (x.trade_time ? ' ' + esc(String(x.trade_time).slice(0, 5)) : '') + (typeof x.profit_loss === 'number' ? ' &middot; P/L ' + esc(x.profit_loss) : '') + '</p><p>' + (x.strategy ? 'Setup: ' + esc(x.strategy) + '. ' : '') + (x.session ? 'Session: ' + esc(x.session) + '. ' : '') + (x.entry_price ? 'Entry ' + esc(x.entry_price) : '') + (x.stop_loss ? ', stop ' + esc(x.stop_loss) : '') + (x.take_profit ? ', target ' + esc(x.take_profit) : '') + (x.planned_rr ? ', planned R:R 1 : ' + esc(x.planned_rr) : '') + (x.risk_percent ? ', risk ' + esc(x.risk_percent) + '%' : '') + (x.risk_amount ? ' (' + esc(x.risk_amount) + ')' : '') + '</p>' + (x.notes ? '<p>Notes: ' + esc(x.notes) + '</p>' : '') + (x.mistakes ? '<p>Mistakes: ' + esc(x.mistakes) + '</p>' : '') + (x.lessons ? '<p>Lesson: ' + esc(x.lessons) + '</p>' : '') + '<div class="btns"><button type="button" class="btn o sm" data-a="e">Edit</button><button type="button" class="btn o sm" data-a="d">Delete</button></div>';
      d.querySelector('[data-a=e]').addEventListener('click', function () { jedit(x); });
      d.querySelector('[data-a=d]').addEventListener('click', function () {
        if (!window.confirm('Delete this journal entry? This cannot be undone.')) return;
        jDel(x.id).then(function () { if (editId === x.id) jreset(); return jrender(); }).then(function () { jmsg('Entry deleted.', true); dash(); }).catch(function (e) { jmsg(jfail(e).replace(' Your entry is still in the form, so you can try again.', '')); });
      });
      box.appendChild(d);
    });
  }
  var F = { trade_date: '#jDate', trade_time: '#jTime', instrument: '#jIns', session: '#jSes', direction: '#jDir', strategy: '#jStr', entry_price: '#jEnt', stop_loss: '#jSl', take_profit: '#jTp', risk_percent: '#jRisk', risk_amount: '#jRamt', planned_rr: '#jRr', result: '#jRes', profit_loss: '#jPl', notes: '#jNotes', mistakes: '#jMis', lessons: '#jLes' };
  function jreset() { jf.reset(); editId = null; pendingId = uuid(); $('#jSave').textContent = 'Add entry'; $('#jSave').disabled = false; $('#jCancel').hidden = true; $('#jDate').value = new Date().toISOString().slice(0, 10); }
  function jedit(x) { editId = x.id; Object.keys(F).forEach(function (k) { var v = x[k]; $(F[k]).value = v == null ? '' : (k === 'trade_time' ? String(v).slice(0, 5) : v); }); $('#jSave').textContent = 'Save changes'; $('#jCancel').hidden = false; jmsg('Editing an entry. Change what you need, then save.', true); jf.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function jInit() {
    if (!jf) return; jgate(); jreset(); jmsg('');
    if (jMode() !== 'login') jrender();
  }
  if (jf) {
    jf.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (jBusy) return;
      var v = {}; Object.keys(F).forEach(function (k) { v[k] = $(F[k]).value.trim(); });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.trade_date)) return jmsg('Choose the trade date.');
      if (!v.instrument) return jmsg('Enter the instrument or currency pair.');
      var labels = { entry_price: 'entry price', stop_loss: 'stop-loss price', take_profit: 'take-profit price', risk_percent: 'risk percentage', risk_amount: 'risk amount', planned_rr: 'planned risk-to-reward', profit_loss: 'profit or loss amount' }, n = {};
      for (var k in labels) { if (v[k] !== '') { n[k] = num(v[k]); if (isNaN(n[k])) return jmsg('The ' + labels[k] + ' must be a number.'); } }
      if (n.risk_percent !== undefined && (n.risk_percent <= 0 || n.risk_percent > 100)) return jmsg('The risk percentage must be above 0 and no more than 100.');
      if (n.risk_amount !== undefined && n.risk_amount < 0) return jmsg('The risk amount cannot be negative.');
      if (n.planned_rr !== undefined && n.planned_rr <= 0) return jmsg('The planned risk-to-reward must be greater than zero.');
      if ((n.entry_price !== undefined && n.entry_price <= 0) || (n.stop_loss !== undefined && n.stop_loss <= 0) || (n.take_profit !== undefined && n.take_profit <= 0)) return jmsg('Prices must be greater than zero.');
      var rr = n.planned_rr;
      if (n.entry_price !== undefined && n.stop_loss !== undefined && n.take_profit !== undefined) {
        var le = levelsError(v.direction, n.entry_price, n.stop_loss, n.take_profit); if (le) return jmsg(le);
        if (rr === undefined) rr = Math.round(Math.abs(n.take_profit - n.entry_price) / Math.abs(n.entry_price - n.stop_loss) * 100) / 100;
      }
      var nz = function (s) { return s === '' ? null : s; };
      var rec = { id: editId || pendingId, trade_date: v.trade_date, trade_time: nz(v.trade_time), instrument: v.instrument, session: nz(v.session), strategy: nz(v.strategy), direction: v.direction, entry_price: n.entry_price === undefined ? null : n.entry_price, stop_loss: n.stop_loss === undefined ? null : n.stop_loss, take_profit: n.take_profit === undefined ? null : n.take_profit, risk_percent: n.risk_percent === undefined ? null : n.risk_percent, risk_amount: n.risk_amount === undefined ? null : n.risk_amount, planned_rr: rr === undefined ? null : rr, result: v.result, profit_loss: n.profit_loss === undefined ? null : n.profit_loss, notes: nz(v.notes), mistakes: nz(v.mistakes), lessons: nz(v.lessons) };
      var wasEdit = editId !== null, btn = $('#jSave'), label = btn.textContent;
      jBusy = true; btn.disabled = true; btn.textContent = 'Saving\u2026';
      jPut(rec).then(function () { jBusy = false; jreset(); return jrender(); }).then(function () { jmsg(wasEdit ? 'Entry updated.' : (jMode() === 'cloud' ? 'Entry saved to your account.' : 'Entry saved in this browser.'), true); dash(); })
        .catch(function (e) { jBusy = false; btn.disabled = false; btn.textContent = label; jmsg(jfail(e)); });
    });
    $('#jCancel').addEventListener('click', function () { jreset(); jmsg(''); });
    ['#fIns', '#fStr', '#fRes'].forEach(function (id) { $(id).addEventListener('change', jdraw); });
    $('#fQ').addEventListener('input', jdraw);
  }
  /* ---------- dashboard (learn page) ---------- */
  function dash() {
    if (!$('#dLes')) return;
    var m = jMode(), nt = $('#dNote');
    if (nt) nt.innerHTML = m === 'cloud' ? 'Signed in as <strong>' + esc(Cloud.name() || (Cloud.user().email || 'your account')) + '</strong>. Your progress is saved to your account and follows you to other devices. <a href="dashboard.html">Open My Dashboard</a>' : m === 'login' ? 'You are not logged in, so progress is stored in this browser only. <a href="account.html#login">Log in</a> or <a href="account.html#signup">create a free account</a> to save it to your account and use it on other devices.' : 'Account features are not set up on this site yet, so progress is stored in this browser on this device only.';
    var n = lessonsDone().filter(function (x) { return x >= 1 && x <= 8; }).length;
    $('#dLes').textContent = n + ' of 8 lessons completed.'; $('#dLbar').style.width = (n / 8 * 100) + '%';
    var q = S.get(QZ, null); $('#dQuiz').textContent = q && q.total ? 'Last score: ' + q.last + ' / ' + q.total + '. Best: ' + q.best + ' / ' + q.total + '.' + (q.attempts ? ' Attempts: ' + q.attempts + '.' : '') : 'No quiz score saved yet.';
    var sm = S.get(SIM, { levels: {}, log: [] }), parts = [];
    ['beginner', 'intermediate', 'advanced'].forEach(function (k) { var lv = (sm.levels || {})[k]; if (lv) parts.push(NAMES[k] + ': best ' + lv.best + ' / 3'); });
    $('#dSim').textContent = parts.length ? parts.join('. ') + '.' : 'No simulator level completed yet.';
    var log = (sm.log || []).slice(-5).reverse();
    $('#dRec').innerHTML = log.length ? log.map(function (x) { return '<p>' + esc(x.t) + ' &middot; ' + esc(NAMES[x.l] || x.l) + ' exercise ' + esc(x.n) + ': ' + (x.ok ? 'correct' : 'incorrect') + '</p>'; }).join('') : '<p class="note">No exercises completed yet.</p>';
    var jd = $('#dJour');
    if (m === 'login') { jd.textContent = 'Log in to see your journal summary.'; return; }
    jLoad().then(function (a) { var js = jstats(a); jd.textContent = js.n ? js.n + ' trades recorded: ' + js.w + ' wins, ' + js.l + ' losses, ' + js.b + ' breakeven, ' + js.o + ' open.' + (js.wr === null ? '' : ' Win rate ' + js.wr + '% (closed trades).') : 'No journal entries yet.'; }).catch(function () { jd.textContent = 'Could not load the journal summary right now.'; });
  }
  var dr = $('#dReset');
  if (dr) dr.addEventListener('click', function () {
    var cloud = jMode() === 'cloud';
    if (!window.confirm(cloud ? 'Delete your saved lesson, quiz and simulator progress from your account? Your journal is not affected.' : 'Reset your lesson, quiz and simulator progress on this device? Your journal is not affected.')) return;
    var done = function () { clearLocal(); st = { l: 'beginner', i: 0, score: 0, done: false }; if (sBox) drawSim(); var b = $('#doneBtn'); if (b) b.textContent = 'Mark lesson complete'; dash(); };
    if (!cloud) return done();
    var f = 'user_id=eq.' + encodeURIComponent(Cloud.user().id);
    Promise.all(['lesson_progress', 'quiz_results', 'sim_results', 'exercise_log'].map(function (t) { return Cloud.db.remove(t, f); })).then(done).catch(function (e) { toast(Cloud.friendly(e)); });
  });
  /* ---------- account sync ---------- */
  function startSync() {
    var loc = lessonsDone().filter(function (x) { return x >= 1 && x <= 8; });
    Promise.all(loc.map(function (n) { return Cloud.db.insertIgnore('lesson_progress', { lesson: n }, 'user_id,lesson'); }))
      .then(pullAll).then(function () { afterAuth(); }).catch(function (e) { toast(Cloud.friendly(e)); afterAuth(); });
  }
  function afterAuth() { jInit(); dash(); var b = $('#doneBtn'); if (b && b.parentNode) { b.parentNode.remove(); addDone(); } }
  if (cloudOn) {
    Cloud.onChange(function (ev) { if (ev === 'SIGNED_OUT') { clearLocal(); afterAuth(); } else if (ev === 'SIGNED_IN') startSync(); });
    if (Cloud.user()) startSync(); else afterAuth();
  } else afterAuth();
})();
