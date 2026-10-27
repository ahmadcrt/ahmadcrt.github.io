/* Forex sessions: Asian, London, New York.
   Conventional reference windows (NOT exchange hours):
     Asian     00:00-09:00 UTC
     London    08:00-17:00 London local time (Europe/London, follows UK daylight saving)
     New York  08:00-17:00 New York local time (America/New_York, follows US daylight saving)
   Sessions are shown as open Monday-Friday only (in the session's own time zone). Forex itself trades around the clock on weekdays.
   All times use the browser's IANA time-zone data, so daylight-saving changes are handled automatically. */
(function (root) {
  'use strict';
  var HOME = 'Africa/Lagos';
  var DEF = [
    { id: 'asian', name: 'Asian', tz: 'UTC', zone: 'UTC', open: [0, 0], close: [9, 0] },
    { id: 'london', name: 'London', tz: 'Europe/London', zone: 'London time', open: [8, 0], close: [17, 0] },
    { id: 'ny', name: 'New York', tz: 'America/New_York', zone: 'New York time', open: [8, 0], close: [17, 0] }
  ];
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  function parts(ts, tz) {
    var o = {}, f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }).formatToParts(new Date(ts));
    f.forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: o.weekday };
  }
  function offset(ts, tz) { var p = parts(ts, tz); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000; }
  function zonedToUtc(y, m, d, h, mi, tz) {
    var guess = Date.UTC(y, m - 1, d, h, mi), off = offset(guess, tz), t = guess - off, off2 = offset(t, tz);
    if (off2 !== off) t = guess - off2;
    return t;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(ts, tz) { var p = parts(ts, tz); return pad(p.h) + ':' + pad(p.mi); }
  function clock(ts, tz) { var p = parts(ts, tz); return pad(p.h) + ':' + pad(p.mi) + ':' + pad(p.s); }
  function windowFor(s, lp, dayShift) {
    var base = new Date(Date.UTC(lp.y, lp.m - 1, lp.d + dayShift)), y = base.getUTCFullYear(), m = base.getUTCMonth() + 1, d = base.getUTCDate();
    return { open: zonedToUtc(y, m, d, s.open[0], s.open[1], s.tz), close: zonedToUtc(y, m, d, s.close[0], s.close[1], s.tz), wd: DAYS.indexOf(new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })) > -1 };
  }
  function compute(nowMs) {
    return DEF.map(function (s) {
      var lp = parts(nowMs, s.tz), w = windowFor(s, lp, 0), open = w.wd && nowMs >= w.open && nowMs < w.close, nextChange, k, nw;
      if (open) nextChange = w.close;
      else if (w.wd && nowMs < w.open) nextChange = w.open;
      else { for (k = 1; k <= 4; k++) { nw = windowFor(s, lp, k); if (nw.wd) { nextChange = nw.open; break; } } }
      var shown = (w.wd && nowMs < w.close) ? w : (nw || windowFor(s, lp, 1));
      return { id: s.id, name: s.name, tz: s.tz, zone: s.zone, open: open, local: clock(nowMs, s.tz), localZoneTime: hm(shown.open, s.tz) + ' to ' + hm(shown.close, s.tz),
               homeTime: hm(shown.open, HOME) + ' to ' + hm(shown.close, HOME), openUtc: shown.open, closeUtc: shown.close, nextChange: nextChange, nextLabel: open ? 'Closes' : 'Opens' };
    });
  }
  function until(ms) { var m = Math.max(0, Math.round(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60; return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + mm + 'm'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function render(el, now, compact) {
    var list = compute(now), openOnes = list.filter(function (s) { return s.open; }).map(function (s) { return s.name; });
    var h = '<div class="sess-head"><span class="sess-home">Your time (Nigeria): <strong>' + clock(now, HOME) + '</strong> WAT</span>' + (openOnes.length > 1 ? '<span class="sess-overlap">Overlap: ' + esc(openOnes.join(' + ')) + '</span>' : '') + '</div><div class="sess-grid' + (compact ? ' compact' : '') + '">';
    list.forEach(function (s) {
      h += '<div class="sess ' + (s.open ? 'is-open' : 'is-closed') + '"><div class="sess-top"><strong>' + s.name + '</strong><span class="sess-badge"><i></i>' + (s.open ? 'Open' : 'Closed') + '</span></div>' +
        '<div class="sess-clock" aria-label="' + s.name + ' local time">' + s.local + '</div><div class="sess-zone">' + esc(s.zone === 'UTC' ? 'UTC' : s.tz.split('/')[1].replace('_', ' ')) + '</div>' +
        (compact ? '' : '<div class="sess-times">' + s.localZoneTime + ' ' + esc(s.zone) + '<br><span>' + s.homeTime + ' WAT</span></div>') +
        '<div class="sess-next">' + s.nextLabel + ' in ' + until(s.nextChange - now) + '</div></div>';
    });
    el.innerHTML = h + '</div>';
  }
  var timers = [];
  function mount(el, opts) {
    if (!el) return; opts = opts || {};
    var nowFn = opts.now || function () { return Date.now(); };
    function tick() { if (!document.body.contains(el)) return false; render(el, nowFn(), !!opts.compact); return true; }
    tick();
    if (!opts.now) { var t = setInterval(function () { if (!tick()) clearInterval(t); }, 1000); timers.push(t); }
  }
  var api = { compute: compute, mount: mount, render: render, zonedToUtc: zonedToUtc, parts: parts, DEF: DEF };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CRT_Sessions = api;
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', function () { Array.prototype.forEach.call(document.querySelectorAll('[data-sessions]'), function (el) { mount(el, { compact: el.getAttribute('data-sessions') === 'compact' }); }); });
})(typeof window !== 'undefined' ? window : this);
