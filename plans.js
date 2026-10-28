/* Trading plans manager.
   Works with the existing Cloud client (cloud.js) and the trading_plans table.
   - Each plan has a title, description and a checklist (items with categories).
   - Edits autosave. The database refuses a save based on an old version, so one device
     can never silently overwrite another.
   - Unsaved edits are also kept on this device until the server confirms the save.
   - Ticks in the "Use before a trade" view are stored on this device only and never change the plan. */
(function () {
  'use strict';
  var root = document.getElementById('plansApp');
  if (!root) return;
  var C = window.Cloud;
  var MAX_PLANS = 30, MAX_ITEMS = 200, MAX_CATS = 20, SAVE_DELAY = 1200;
  var COLS = 'id,title,description,items,sort_order,version,updated_at';
  var S = { plans: [], loaded: false, loading: false, loadErr: '', view: 'list', cur: null, checkId: null, notice: '', noticeKind: '', focus: null, busy: false };
  var saveTimer = null;

  /* ---------- small helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function $(sel, el) { return (el || root).querySelector(sel); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Array(16), i;
    for (i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = b.map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function uid() { var u = C && C.user && C.user(); return u ? u.id : ''; }
  function find(id) { for (var i = 0; i < S.plans.length; i++) if (S.plans[i].id === id) return S.plans[i]; return null; }
  function itemsOf(p) { return (p && Array.isArray(p.items) ? p.items : []).map(function (x) { return { id: x.id, category: x.category || 'General', text: x.text || '' }; }); }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function draftKey(id) { return 'crt.pdraft.' + uid() + '.' + id; }
  function ticksKey(id) { return 'crt.ticks.' + uid() + '.' + id; }
  function fmtDate(s) { try { return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
  function cats(items) {
    var seen = {}, out = [];
    items.forEach(function (x) { var c = String(x.category || '').trim(); if (c && !seen[c.toLowerCase()]) { seen[c.toLowerCase()] = 1; out.push(c); } });
    return out;
  }
  function nextOrder() { var m = -1; S.plans.forEach(function (p) { if (p.sort_order > m) m = p.sort_order; }); return m + 1; }
  function setNotice(msg, kind) { S.notice = msg || ''; S.noticeKind = kind || ''; }

  /* ---------- error handling ---------- */
  function classify(e) {
    if (!(e instanceof Error) || e.status === undefined) return { t: 'offline', msg: 'Could not reach the server. Your edits are still on this screen and saved on this device.' };
    var m = String(e.message || '');
    if (e.status === 409 && (e.code === 'PT409' || /changed somewhere else/i.test(m))) return { t: 'conflict', msg: 'This plan was changed on another device or tab after you opened it. Nothing was overwritten.' };
    if (e.status === 401 || e.status === 403) return { t: 'auth', msg: 'Your session expired. Log in again. Your edits are kept on this device.' };
    if (e.status === 404 && (e.code === 'PGRST205' || /schema cache|could not find the table/i.test(m))) return { t: 'setup', msg: 'The plans database is not set up yet. Please tell the site owner.' };
    if (e.status === 428) return { t: 'error', msg: 'The save was refused because the page is out of date. Reload the page and try again.' };
    if (e.status === 400 || e.status === 422) {
      if (/Plan limit reached/i.test(m)) return { t: 'rejected', msg: 'You have reached the limit of ' + MAX_PLANS + ' plans.' };
      return { t: 'rejected', msg: 'The server did not accept this plan. Check the title and item lengths.' };
    }
    if (e.status === 429) return { t: 'error', msg: 'Too many requests. Wait a moment and retry.' };
    return { t: 'error', msg: 'Something went wrong on the server. Your edits are kept. Please retry.' };
  }

  /* ---------- validation (mirrors the database rules) ---------- */
  function validate(c) {
    var title = String(c.title || '').trim();
    if (!title) return { ok: false, msg: 'Give the plan a title.' };
    if (title.length > 120) return { ok: false, msg: 'The title must be 120 characters or fewer.' };
    var desc = String(c.description || '').trim();
    if (desc.length > 1000) return { ok: false, msg: 'The description must be 1000 characters or fewer.' };
    if (c.items.length > MAX_ITEMS) return { ok: false, msg: 'A plan can have at most ' + MAX_ITEMS + ' items.' };
    var out = [], seen = {}, n = 0;
    for (var i = 0; i < c.items.length; i++) {
      var t = String(c.items[i].text || '').trim(), g = String(c.items[i].category || '').trim() || 'General';
      if (!t) return { ok: false, msg: 'Item ' + (i + 1) + ' needs some text, or remove it.' };
      if (t.length > 300) return { ok: false, msg: 'Item ' + (i + 1) + ' is longer than 300 characters.' };
      if (g.length > 60) return { ok: false, msg: 'The category of item ' + (i + 1) + ' is longer than 60 characters.' };
      if (!seen[g.toLowerCase()]) { seen[g.toLowerCase()] = 1; n++; }
      out.push({ id: c.items[i].id, category: g, text: t });
    }
    if (n > MAX_CATS) return { ok: false, msg: 'Use at most ' + MAX_CATS + ' different categories.' };
    return { ok: true, title: title, description: desc, items: out };
  }

  /* ---------- loading ---------- */
  function boot() {
    if (!C || !C.enabled) { render(); return; }
    if (!C.user()) { render(); return; }
    if (!S.loaded && !S.loading) loadPlans(); else render();
  }
  function loadPlans() {
    S.loading = true; S.loadErr = ''; render();
    return C.db.select('trading_plans', 'select=' + COLS + '&order=sort_order.asc,created_at.asc').then(function (rows) {
      S.plans = rows || []; S.loaded = true; S.loading = false; render();
    }).catch(function (e) { S.loading = false; S.loadErr = classify(e).msg; render(); });
  }
  function applyRow(row) {
    var keep = { id: row.id, title: row.title, description: row.description, items: row.items, sort_order: row.sort_order, version: row.version, updated_at: row.updated_at };
    for (var i = 0; i < S.plans.length; i++) if (S.plans[i].id === row.id) { S.plans[i] = keep; return; }
    S.plans.push(keep);
  }

  /* ---------- drafts kept on this device ---------- */
  function writeDraft() {
    var c = S.cur; if (!c) return;
    lsSet(draftKey(c.id), { title: c.title, description: c.description, items: c.items, baseVersion: c.base.version, t: Date.now() });
  }
  function readDraft(id) { return lsGet(draftKey(id)); }
  function sameContent(a, b) { return JSON.stringify([a.title || '', a.description || '', a.items || []]) === JSON.stringify([b.title || '', b.description || '', b.items || []]); }

  /* ---------- opening a plan ---------- */
  function openEdit(id) {
    var p = find(id); if (!p) { S.view = 'list'; render(); return; }
    clearTimeout(saveTimer);
    var c = { id: id, base: { version: p.version }, title: p.title, description: p.description || '', items: itemsOf(p), dirty: false, status: 'saved', msg: '', rev: 0, inflight: false, pending: false, draft: null, undo: null };
    var d = readDraft(id);
    if (d && !sameContent(d, { title: c.title, description: c.description, items: c.items })) c.draft = d;
    S.cur = c; S.view = 'edit'; setNotice(''); render();
  }
  function openCheck(id) {
    var run = function () { S.cur = null; S.checkId = id || (S.plans[0] && S.plans[0].id) || null; S.view = 'check'; setNotice(''); render(); };
    if (S.cur && (S.cur.dirty || S.cur.inflight)) {
      saveNow().then(function () { if (S.cur && (S.cur.dirty || S.cur.inflight)) return; run(); });
    } else run();
  }
  function goList() { clearTimeout(saveTimer); S.cur = null; S.view = 'list'; render(); }
  function leaveEdit() {
    var c = S.cur; if (!c) { goList(); return; }
    if (!c.dirty && !c.inflight) { goList(); return; }
    saveNow().then(function () { if (!S.cur || (!S.cur.dirty && !S.cur.inflight)) goList(); });
  }

  /* ---------- saving ---------- */
  function touched() {
    var c = S.cur; if (!c) return;
    c.rev++; c.dirty = true; c.undo = null;
    if (c.status !== 'conflict' && c.status !== 'gone') { c.status = 'dirty'; c.msg = ''; }
    writeDraft(); updateStatus(); schedule();
  }
  function schedule() {
    clearTimeout(saveTimer);
    var c = S.cur; if (!c || c.status === 'conflict' || c.status === 'gone') return;
    saveTimer = setTimeout(function () { save(); }, SAVE_DELAY);
  }
  function saveNow() { clearTimeout(saveTimer); return save() || Promise.resolve(); }
  function save() {
    var c = S.cur; if (!c) return null;
    clearTimeout(saveTimer);
    if (c.status === 'conflict' || c.status === 'gone') return null;
    if (c.inflight) { c.pending = true; return null; }
    if (!c.dirty) { return null; }
    var v = validate(c);
    if (!v.ok) { c.status = 'invalid'; c.msg = v.msg; updateStatus(); return null; }
    c.inflight = true; c.status = 'saving'; c.msg = ''; updateStatus();
    var rev = c.rev;
    var body = { title: v.title, description: v.description || null, items: v.items, expected_version: c.base.version };
    return C.db.patch('trading_plans', 'id=eq.' + encodeURIComponent(c.id), body).then(function (rows) {
      c.inflight = false;
      if (!rows || !rows.length) { S.plans = S.plans.filter(function (x) { return x.id !== c.id; }); c.status = 'gone'; c.msg = 'This plan no longer exists (it was deleted somewhere else). Your edits are kept below.'; render(); return; }
      var row = rows[0]; applyRow(row); c.base.version = row.version;
      if (c.rev === rev) { c.dirty = false; c.status = 'saved'; c.msg = ''; lsDel(draftKey(c.id)); }
      else { c.status = 'dirty'; schedule(); }
      if (c.pending) { c.pending = false; schedule(); }
      updateStatus();
      var vv = $('.pl-ver'); if (vv) vv.textContent = 'Version ' + c.base.version;
    }).catch(function (e) {
      c.inflight = false; var k = classify(e);
      c.errType = k.t; c.msg = k.msg;
      c.status = k.t === 'conflict' ? 'conflict' : (k.t === 'rejected' ? 'invalid' : 'error');
      if (c.status === 'conflict') render(); else updateStatus();
    });
  }
  function updateStatus() {
    var c = S.cur, el = $('#plStatus'); if (!c || !el) return;
    var label = { saved: 'Saved', saving: 'Saving...', dirty: 'Unsaved changes', invalid: 'Not saved', error: 'Not saved', conflict: 'Conflict: not saved', gone: 'Plan missing' }[c.status] || '';
    var h = '<p class="pl-st"><b>' + esc(label) + '</b>' + (c.msg ? ' ' + esc(c.msg) : '') + '</p>';
    if (c.status === 'error') h += '<div class="btns"><button type="button" class="btn g sm" data-act="retry">Retry now</button></div>';
    if (c.status === 'conflict') h += '<div class="btns"><button type="button" class="btn g sm" data-act="conflict-copy">Save my version as a new plan</button><button type="button" class="btn o sm" data-act="conflict-reload">Discard my edits, load latest</button></div>';
    if (c.status === 'gone') h += '<div class="btns"><button type="button" class="btn g sm" data-act="conflict-copy">Save my version as a new plan</button><button type="button" class="btn o sm" data-act="back-force">Back to my plans</button></div>';
    el.setAttribute('data-s', c.status); el.innerHTML = h;
  }

  /* ---------- plan operations ---------- */
  function createPlan(title, desc, items) {
    if (S.plans.length >= MAX_PLANS) return Promise.reject(Object.assign(new Error('Plan limit reached'), { status: 400 }));
    var row = { id: uuid(), title: title, description: desc || null, items: items || [], sort_order: nextOrder() };
    return C.db.upsert('trading_plans', row, 'id').then(function (rows) {
      var r = rows && rows[0]; if (!r) throw Object.assign(new Error('No row returned'), { status: 500 });
      applyRow(r); return r;
    });
  }
  function dupPlan() {
    var c = S.cur; if (!c) return;
    var go = function () {
      var p = find(c.id); if (!p) return;
      if (S.plans.length >= MAX_PLANS) { setNotice('You already have ' + MAX_PLANS + ' plans. Delete one first.', 'err'); render(); return; }
      var items = itemsOf(p).map(function (x) { return { id: uuid(), category: x.category, text: x.text }; });
      var t = (p.title + ' (copy)').slice(0, 120);
      S.busy = true; render();
      createPlan(t, p.description, items).then(function (r) { S.busy = false; setNotice('Plan duplicated.', 'ok'); openEdit(r.id); setNotice('Plan duplicated.', 'ok'); render(); })
        .catch(function (e) { S.busy = false; setNotice(classify(e).msg, 'err'); render(); });
    };
    if (c.dirty) saveNow().then(function () { if (S.cur && !S.cur.dirty) go(); }); else go();
  }
  function deletePlan() {
    var c = S.cur; if (!c) return;
    var p = find(c.id); if (!p) return;
    if (!window.confirm('Delete the plan "' + p.title + '"? This cannot be undone. Journal entries keep their saved checklist copy.')) return;
    clearTimeout(saveTimer);
    S.busy = true; render();
    C.db.remove('trading_plans', 'id=eq.' + encodeURIComponent(c.id) + '&version=eq.' + p.version).then(function () {
      return C.db.select('trading_plans', 'id=eq.' + encodeURIComponent(c.id) + '&select=id');
    }).then(function (rows) {
      S.busy = false;
      if (rows && rows.length) { setNotice('The plan was not deleted because it changed somewhere else. Reload it and try again.', 'err'); S.cur = null; loadPlans().then(function () { openEdit(c.id); setNotice('The plan was not deleted because it changed somewhere else.', 'err'); render(); }); return; }
      S.plans = S.plans.filter(function (x) { return x.id !== c.id; });
      lsDel(draftKey(c.id)); lsDel(ticksKey(c.id));
      S.cur = null; S.view = 'list'; setNotice('Plan deleted.', 'ok'); render();
    }).catch(function (e) { S.busy = false; setNotice(classify(e).msg, 'err'); render(); });
  }
  function movePlan(id, dir) {
    var i = -1; S.plans.forEach(function (p, k) { if (p.id === id) i = k; });
    var j = i + dir; if (i < 0 || j < 0 || j >= S.plans.length) return;
    var t = S.plans[i]; S.plans[i] = S.plans[j]; S.plans[j] = t;
    var changed = [];
    S.plans.forEach(function (p, k) { if (p.sort_order !== k) { p.sort_order = k; changed.push(p); } });
    render();
    var chain = Promise.resolve();
    changed.forEach(function (p) { chain = chain.then(function () { return C.db.patch('trading_plans', 'id=eq.' + encodeURIComponent(p.id), { sort_order: p.sort_order }); }); });
    chain.catch(function (e) { setNotice('The new order could not be saved: ' + classify(e).msg, 'err'); loadPlans(); });
  }
  function conflictReload() {
    var c = S.cur; if (!c) return;
    C.db.select('trading_plans', 'id=eq.' + encodeURIComponent(c.id) + '&select=' + COLS).then(function (rows) {
      lsDel(draftKey(c.id));
      if (rows && rows[0]) { applyRow(rows[0]); openEdit(c.id); setNotice('Loaded the latest version.', 'ok'); render(); }
      else { S.plans = S.plans.filter(function (x) { return x.id !== c.id; }); goList(); }
    }).catch(function (e) { c.msg = classify(e).msg; updateStatus(); });
  }
  function conflictCopy() {
    var c = S.cur; if (!c) return;
    var v = validate(c); if (!v.ok) { c.msg = v.msg; updateStatus(); return; }
    var items = v.items.map(function (x) { return { id: uuid(), category: x.category, text: x.text }; });
    createPlan((v.title + ' (my edits)').slice(0, 120), v.description, items).then(function (r) {
      lsDel(draftKey(c.id)); openEdit(r.id); setNotice('Your version was saved as a new plan.', 'ok'); render();
    }).catch(function (e) { c.msg = classify(e).msg; updateStatus(); });
  }

  /* ---------- checklist ticks (device only) ---------- */
  function readTicks(id) { return lsGet(ticksKey(id)) || {}; }

  /* ---------- rendering ---------- */
  function itemRow(it, i, n) {
    return '<div class="pl-item"><div class="pl-fields">' +
      '<input class="t pl-cat" list="plCats" data-f="category" data-i="' + i + '" maxlength="60" placeholder="Category" aria-label="Category for item ' + (i + 1) + '" autocomplete="off" value="' + esc(it.category) + '">' +
      '<input class="t pl-txt" data-f="text" data-i="' + i + '" maxlength="300" placeholder="Checklist item" aria-label="Text for item ' + (i + 1) + '" autocomplete="off" value="' + esc(it.text) + '"></div>' +
      '<div class="pl-btns"><button type="button" class="pl-ib" data-act="item-up" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + '>Up</button>' +
      '<button type="button" class="pl-ib" data-act="item-down" data-i="' + i + '"' + (i === n - 1 ? ' disabled' : '') + '>Down</button>' +
      '<button type="button" class="pl-ib pl-rm" data-act="item-del" data-i="' + i + '">Remove</button></div></div>';
  }
  function noticeHtml() { return S.notice ? '<p class="pl-notice ' + esc(S.noticeKind) + '" role="status">' + esc(S.notice) + '</p>' : ''; }

  function listHtml() {
    var h = noticeHtml();
    h += '<form id="plNew" class="pl-new" novalidate><input class="t" id="plNewTitle" maxlength="120" autocomplete="off" placeholder="New plan name, e.g. London session checklist" aria-label="New plan name"><button class="btn g" type="submit"' + (S.busy ? ' disabled' : '') + '>Create plan</button></form>';
    h += '<p class="note pl-count">' + S.plans.length + ' of ' + MAX_PLANS + ' plans</p>';
    if (!S.plans.length) return h + '<div class="card"><p class="m0">No plans yet. Name your first plan above, then add the checks you want to confirm before every trade.</p></div>';
    h += '<div class="pl-list">';
    S.plans.forEach(function (p, k) {
      var n = (p.items || []).length;
      h += '<div class="card pl-card"><h3 class="pl-ctitle">' + esc(p.title) + '</h3><p class="note m0">' + n + (n === 1 ? ' item' : ' items') + (p.updated_at ? ' · updated ' + esc(fmtDate(p.updated_at)) : '') + '</p>' +
        (p.description ? '<p class="pl-desc">' + esc(p.description) + '</p>' : '') +
        '<div class="btns"><button type="button" class="btn g sm" data-act="use" data-id="' + esc(p.id) + '">Use before a trade</button><button type="button" class="btn o sm" data-act="open" data-id="' + esc(p.id) + '">Edit</button>' +
        '<button type="button" class="btn o sm" data-act="plan-up" data-id="' + esc(p.id) + '"' + (k === 0 ? ' disabled' : '') + ' aria-label="Move plan up">Up</button>' +
        '<button type="button" class="btn o sm" data-act="plan-down" data-id="' + esc(p.id) + '"' + (k === S.plans.length - 1 ? ' disabled' : '') + ' aria-label="Move plan down">Down</button></div></div>';
    });
    return h + '</div>';
  }

  function editHtml() {
    var c = S.cur, n = c.items.length;
    var h = noticeHtml();
    h += '<div class="pl-top"><button type="button" class="btn o sm" data-act="back">All plans</button><span class="pl-ver note">Version ' + c.base.version + '</span></div>';
    h += '<div id="plStatus" class="pl-status" role="status" aria-live="polite"></div>';
    if (c.draft) h += '<div class="card pl-banner"><p class="m0"><b>Unsaved edits found on this device.</b> They were not saved to your account.' + (c.draft.baseVersion !== c.base.version ? ' The plan has changed since then, so saving them will ask you to choose.' : '') + '</p><div class="btns"><button type="button" class="btn g sm" data-act="draft-restore">Restore my edits</button><button type="button" class="btn o sm" data-act="draft-discard">Discard them</button></div></div>';
    h += '<div class="card pl-edit"><label class="f" for="plTitle">Plan title</label><input class="t" id="plTitle" data-f="title" maxlength="120" autocomplete="off" value="' + esc(c.title) + '">';
    h += '<label class="f" for="plDesc">Description (optional)</label><textarea id="plDesc" data-f="description" rows="2" maxlength="1000">' + esc(c.description) + '</textarea>';
    h += '<h4 class="pl-h">Checklist <span class="note">' + n + ' of ' + MAX_ITEMS + '</span></h4>';
    h += '<datalist id="plCats">' + cats(c.items).map(function (x) { return '<option value="' + esc(x) + '"></option>'; }).join('') + '</datalist>';
    h += '<div class="pl-items">' + c.items.map(function (it, i) { return itemRow(it, i, n); }).join('') + '</div>';
    if (!n) h += '<p class="note">No items yet. Add your first checklist item.</p>';
    if (c.undo) h += '<p class="pl-undo">Item removed. <button type="button" class="pl-link" data-act="undo-del">Undo</button></p>';
    h += '<div class="btns"><button type="button" class="btn g sm" data-act="add-item"' + (n >= MAX_ITEMS ? ' disabled' : '') + '>Add item</button><button type="button" class="btn o sm" data-act="save-now">Save now</button></div></div>';
    h += '<div class="btns pl-actions"><button type="button" class="btn g sm" data-act="use" data-id="' + esc(c.id) + '">Use before a trade</button><button type="button" class="btn o sm" data-act="dup"' + (S.busy ? ' disabled' : '') + '>Duplicate</button><button type="button" class="btn o sm pl-danger" data-act="del-plan"' + (S.busy ? ' disabled' : '') + '>Delete plan</button></div>';
    return h;
  }

  function checkHtml() {
    var h = noticeHtml();
    h += '<div class="pl-top"><button type="button" class="btn o sm" data-act="back">All plans</button></div>';
    if (!S.plans.length) return h + '<div class="card"><p class="m0">Create a plan first, then you can tick it off here.</p></div>';
    var p = find(S.checkId) || S.plans[0]; S.checkId = p.id;
    var ticks = readTicks(p.id), items = itemsOf(p);
    var done = items.filter(function (x) { return ticks[x.id]; }).length;
    h += '<div class="card pl-check"><label class="f" for="plPick">Plan</label><select id="plPick">' +
      S.plans.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === p.id ? ' selected' : '') + '>' + esc(x.title) + '</option>'; }).join('') + '</select>';
    if (!items.length) {
      h += '<p class="note">This plan has no items yet.</p>';
    } else {
      h += '<p class="pl-prog" id="plProg" role="status">' + done + ' of ' + items.length + ' checked</p><div class="pl-bar"><span id="plBar" style="width:' + Math.round(done * 100 / items.length) + '%"></span></div>';
      cats(items).forEach(function (cat) {
        h += '<h4 class="pl-cat-h">' + esc(cat) + '</h4>';
        items.forEach(function (it) {
          if (String(it.category).toLowerCase() !== cat.toLowerCase()) return;
          h += '<label class="pl-tick"><input type="checkbox" data-tick="' + esc(it.id) + '"' + (ticks[it.id] ? ' checked' : '') + '><span>' + esc(it.text) + '</span></label>';
        });
      });
    }
    h += '<div class="btns"><button type="button" class="btn o sm" data-act="reset-ticks">Reset ticks for a new trade</button><button type="button" class="btn o sm" data-act="open" data-id="' + esc(p.id) + '">Edit plan</button></div>';
    h += '<p class="note">Ticks stay on this device and never change your plan.</p></div>';
    return h;
  }

  function render() {
    var h;
    if (!C || !C.enabled) { root.innerHTML = '<div class="card"><p class="m0">Accounts are not available on this page right now.</p></div>'; return; }
    if (!C.user()) { root.innerHTML = '<div class="card"><p>Log in to create and save your own trading plans. They stay private to your account.</p><div class="btns"><a class="btn g" href="account.html">Log in or create an account</a></div></div>'; return; }
    if (S.loading && !S.loaded) { root.innerHTML = '<p class="note" role="status">Loading your plans...</p>'; return; }
    if (S.loadErr && !S.loaded) { root.innerHTML = '<div class="card"><p class="err">' + esc(S.loadErr) + '</p><div class="btns"><button type="button" class="btn g sm" data-act="reload">Try again</button></div></div>'; return; }
    h = S.view === 'edit' && S.cur ? editHtml() : (S.view === 'check' ? checkHtml() : listHtml());
    root.innerHTML = h;
    if (S.view === 'edit' && S.cur) updateStatus();
    if (S.focus) { var f = $(S.focus); S.focus = null; if (f && f.focus) { try { f.focus({ preventScroll: false }); } catch (e) { f.focus(); } } }
  }

  /* ---------- events ---------- */
  root.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'plNew') {
      e.preventDefault();
      var inp = $('#plNewTitle'), t = inp ? inp.value.trim() : '';
      if (!t) { setNotice('Type a name for the plan first.', 'err'); render(); return; }
      if (S.plans.length >= MAX_PLANS) { setNotice('You have reached the limit of ' + MAX_PLANS + ' plans.', 'err'); render(); return; }
      S.busy = true; render();
      createPlan(t, '', []).then(function (r) { S.busy = false; openEdit(r.id); S.focus = '[data-act="add-item"]'; render(); })
        .catch(function (err) { S.busy = false; setNotice(classify(err).msg, 'err'); render(); });
    }
  });
  root.addEventListener('input', function (e) {
    var el = e.target, f = el.getAttribute && el.getAttribute('data-f'); if (!f || !S.cur) return;
    var c = S.cur;
    if (f === 'title') c.title = el.value;
    else if (f === 'description') c.description = el.value;
    else { var i = Number(el.getAttribute('data-i')); if (c.items[i]) c.items[i][f] = el.value; }
    touched();
  });
  root.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'plPick') { S.checkId = el.value; render(); return; }
    var tk = el.getAttribute && el.getAttribute('data-tick');
    if (tk) {
      var p = find(S.checkId); if (!p) return;
      var t = readTicks(p.id); if (el.checked) t[tk] = true; else delete t[tk];
      lsSet(ticksKey(p.id), t);
      var items = itemsOf(p), done = items.filter(function (x) { return t[x.id]; }).length;
      var pr = $('#plProg'), bar = $('#plBar');
      if (pr) pr.textContent = done + ' of ' + items.length + ' checked';
      if (bar) bar.style.width = Math.round(done * 100 / items.length) + '%';
    }
  });
  root.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null; if (!b || b.disabled) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id'), i = Number(b.getAttribute('data-i')), c = S.cur;
    switch (act) {
      case 'reload': loadPlans(); break;
      case 'open': if (S.cur && S.cur.dirty && S.cur.id !== id) { saveNow().then(function () { openEdit(id); }); } else openEdit(id); break;
      case 'use': openCheck(id); break;
      case 'back': if (S.view === 'edit') leaveEdit(); else goList(); break;
      case 'back-force': goList(); break;
      case 'plan-up': movePlan(id, -1); break;
      case 'plan-down': movePlan(id, 1); break;
      case 'add-item':
        if (!c || c.items.length >= MAX_ITEMS) return;
        c.items.push({ id: uuid(), category: c.items.length ? c.items[c.items.length - 1].category : 'General', text: '' });
        touched(); S.focus = '.pl-txt[data-i="' + (c.items.length - 1) + '"]'; render(); break;
      case 'item-del':
        if (!c) return; var gone = c.items.splice(i, 1)[0]; touched(); c.undo = { item: gone, index: i }; render(); break;
      case 'undo-del':
        if (!c || !c.undo) return; c.items.splice(c.undo.index, 0, c.undo.item); c.undo = null; touched(); render(); break;
      case 'item-up': case 'item-down':
        if (!c) return; var j = act === 'item-up' ? i - 1 : i + 1; if (j < 0 || j >= c.items.length) return;
        var t = c.items[i]; c.items[i] = c.items[j]; c.items[j] = t; touched(); S.focus = '.pl-txt[data-i="' + j + '"]'; render(); break;
      case 'save-now': if (c) { if (c.status === 'invalid' || c.status === 'error') c.status = 'dirty'; c.dirty = true; saveNow(); } break;
      case 'retry': if (c) { c.status = 'dirty'; saveNow(); } break;
      case 'dup': dupPlan(); break;
      case 'del-plan': deletePlan(); break;
      case 'conflict-reload': conflictReload(); break;
      case 'conflict-copy': conflictCopy(); break;
      case 'draft-restore':
        if (!c || !c.draft) return;
        c.title = c.draft.title; c.description = c.draft.description; c.items = c.draft.items || [];
        c.base.version = c.draft.baseVersion; c.draft = null; touched(); render(); break;
      case 'draft-discard': if (c) { lsDel(draftKey(c.id)); c.draft = null; render(); } break;
      case 'reset-ticks': var p = find(S.checkId); if (p) { lsDel(ticksKey(p.id)); render(); } break;
    }
  });

  window.addEventListener('beforeunload', function (e) {
    var c = S.cur;
    if (c && (c.dirty || c.inflight)) { e.preventDefault(); e.returnValue = ''; return ''; }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && S.cur && S.cur.dirty) saveNow();
  });
  window.addEventListener('online', function () {
    var c = S.cur; if (c && c.dirty && c.status === 'error') { c.status = 'dirty'; saveNow(); }
  });
  if (C && C.onChange) C.onChange(function () { S.loaded = false; S.loading = false; S.plans = []; S.cur = null; S.view = 'list'; setNotice(''); boot(); });

  /* Small public hook so the journal can attach a copy of a checklist (with its ticks) to a trade. */
  window.CRTPlans = {
    list: function () { return S.plans.slice(); },
    snapshot: function (planId) {
      var p = find(planId); if (!p) return null;
      var t = readTicks(p.id);
      return { plan_id: p.id, title: p.title, captured_at: new Date().toISOString(), items: itemsOf(p).map(function (x) { return { id: x.id, category: x.category, text: x.text, checked: !!t[x.id] }; }) };
    },
    resetTicks: function (planId) { lsDel(ticksKey(planId)); }
  };

  boot();
})();
