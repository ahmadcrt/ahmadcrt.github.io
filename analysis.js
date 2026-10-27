/* Market Analysis page: renders analysis.json and opens charts in a viewer that never crops the image.
   Entry, stop loss, take profit and outcome are shown ONLY when a chart has "verified": true in analysis.json. */
(function () {
  'use strict';
  var grid = document.getElementById('chartGrid'); if (!grid) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function day(d) { var t = new Date(d + 'T12:00:00Z'); return isNaN(t) ? esc(d) : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function card(c) {
    var title = esc(c.instrument || 'Chart') + (c.timeframe ? ' &middot; ' + esc(c.timeframe) : ''), ok = c.verified === true, rows = '';
    if (ok) [['Entry', c.entry], ['Stop loss', c.stop_loss], ['Take profit', c.take_profit], ['Outcome', c.outcome]].forEach(function (r) { if (r[1]) rows += '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; });
    var q = 'Hello Ahmad, I have a question about your ' + (c.instrument || '') + ' ' + (c.timeframe || '') + ' chart' + (c.date ? ' (' + c.date + ')' : '') + '.';
    return '<article class="acard"><button type="button" class="aimg" data-src="' + esc(c.image) + '" data-title="' + title.replace(/&middot;/g, '-') + '" aria-label="View ' + esc(c.instrument || 'chart') + ' larger"><img src="' + esc(c.image) + '" alt="' + esc((c.instrument || 'Trading') + ' ' + (c.timeframe || '') + ' chart') + '" loading="lazy"><span class="zoomhint">Tap to enlarge</span></button>' +
      '<div class="abody"><div class="atags"><span class="pill Open">Real chart</span>' + (ok ? '<span class="pill Win">Verified</span>' : '<span class="pill">Details pending</span>') + '</div><h3>' + title + '</h3>' +
      (c.date ? '<p class="note">Chart date: ' + day(c.date) + '</p>' : '') + (c.setup ? '<p><strong>CRT setup:</strong> ' + esc(c.setup) + '</p>' : '') + (c.explanation ? '<p>' + esc(c.explanation) + '</p>' : '') +
      (rows ? '<dl class="alev">' + rows + '</dl>' : '') + '<a class="btn o sm" href="https://wa.me/2349166116812?text=' + encodeURIComponent(q) + '">Ask about this chart</a></div></article>';
  }
  function draw(list) { grid.innerHTML = list.map(card).join(''); }
  if (window.fetch) fetch('analysis.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { if (d && Array.isArray(d.charts) && d.charts.length) draw(d.charts.filter(function (c) { return c && /^[\w.-]+\.(webp|png|jpe?g)$/i.test(c.image || ''); })); }).catch(function () { });
  /* viewer */
  var lb = document.getElementById('lb'), img = document.getElementById('lbImg'), wrap = document.getElementById('lbWrap'), zb = document.getElementById('lbZoom'), opener = null;
  function close() { lb.hidden = true; document.body.classList.remove('lb-open'); img.removeAttribute('src'); wrap.classList.remove('zoom'); zb.setAttribute('aria-pressed', 'false'); if (opener) opener.focus(); }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button.aimg') : null; if (!b) return; e.preventDefault(); opener = b;
    img.src = b.getAttribute('data-src'); img.alt = b.querySelector('img').alt; document.getElementById('lbTitle').textContent = b.getAttribute('data-title'); document.getElementById('lbOpen').href = b.getAttribute('data-src');
    lb.hidden = false; document.body.classList.add('lb-open'); document.getElementById('lbClose').focus();
  });
  zb.addEventListener('click', function () { var z = wrap.classList.toggle('zoom'); zb.setAttribute('aria-pressed', z ? 'true' : 'false'); zb.textContent = z ? 'Fit screen' : 'Zoom'; });
  document.getElementById('lbClose').addEventListener('click', close);
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === wrap) close(); });
  document.addEventListener('keydown', function (e) { if (!lb.hidden && e.key === 'Escape') close(); });
})();
