/* track.js - application tracker with animated progress bar and timeline.
   Data comes from localStorage (applications submitted on apply.html)
   plus two seeded demo applications so the page works on first visit. */
(function (w, d) {
  'use strict';
  var JS = w.JanSetu, V = w.JanSetuValidators, $ = JS.$, esc = JS.esc;

  function seed() {                                       // demo data, created once
    if (JS.store.get('seeded', false)) return;
    var day = 86400000, now = Date.now();
    var apps = JS.store.get('apps', []);
    apps.push({ ref: 'JS-2026-88912', serviceId: 'income', title: 'Income Certificate', status: 1, created: new Date(now - 3 * day).toISOString(),
      history: [{ status: 0, at: new Date(now - 3 * day).toISOString() }, { status: 1, at: new Date(now - day).toISOString() }] });
    apps.push({ ref: 'JS-2026-87740', serviceId: 'residence', title: 'Residence Certificate', status: 3, created: new Date(now - 9 * day).toISOString(),
      history: [{ status: 0, at: new Date(now - 9 * day).toISOString() }, { status: 1, at: new Date(now - 7 * day).toISOString() }, { status: 2, at: new Date(now - 5 * day).toISOString() }, { status: 3, at: new Date(now - 2 * day).toISOString() }] });
    JS.store.set('apps', apps); JS.store.set('seeded', true);
  }
  function find(ref) {
    var apps = JS.store.get('apps', []), r = ref.trim().toUpperCase();
    for (var i = 0; i < apps.length; i++) if (apps[i].ref === r) return apps[i];
    return null;
  }
  function chip(st) { return st === 3 ? '<span class="chip chip--ok">Approved</span>' : '<span class="chip chip--wait">' + JS.STATUS[st] + '</span>'; }

  function show(app) {
    var steps = JS.STATUS.map(function (name, i) {
      var st = i < app.status || app.status === 3 ? 'done' : i === app.status ? 'current' : 'todo';
      return '<li class="tracker__step" data-state="' + st + '"><span class="tracker__dot">' + (st === 'done' ? '\u2713' : i + 1) + '</span>' + name + '</li>';
    }).join('');
    $('#result').innerHTML =
      '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.5rem"><div><h2 style="margin:0">' + esc(app.title) + '</h2>' +
      '<p class="muted" style="margin:0">Reference ' + esc(app.ref) + ' &middot; Submitted ' + JS.formatDate(app.created) + '</p></div>' + chip(app.status) + '</div>' +
      '<ol class="tracker" style="--progress:0;list-style:none;padding:0" id="tracker"><span class="tracker__bar"></span><span class="tracker__fill"></span>' + steps + '</ol>' +
      '<h3>History</h3><ul class="timeline">' + app.history.map(function (h) {
        return '<li><strong>' + JS.STATUS[h.status] + '</strong> <span class="muted">' + JS.formatDate(h.at) + '</span></li>'; }).join('') + '</ul>' +
      (app.status < 3 ? '<button class="btn btn--outline" id="simulate" data-ref="' + esc(app.ref) + '">Demo: simulate officer update</button>' : '<p class="notice notice--ok">Your certificate is ready to download.</p>') + '</div>';
    /* Animate the green bar on the next frame so the CSS transition runs from 0 */
    var t = $('#tracker');
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.style.setProperty('--progress', app.status / (JS.STATUS.length - 1)); }); });
    $('#result').focus();
  }

  function renderList() {
    var apps = JS.store.get('apps', []);
    $('#my-apps').innerHTML = apps.length ? apps.map(function (a) {
      return '<tr><td><a href="track.html?ref=' + esc(a.ref) + '" data-ref="' + esc(a.ref) + '">' + esc(a.ref) + '</a></td><td>' + esc(a.title) + '</td><td>' + chip(a.status) + '</td><td>' + JS.formatDate(a.history[a.history.length - 1].at) + '</td></tr>';
    }).join('') : '<tr><td colspan="4" class="muted">No applications yet.</td></tr>';
  }

  function lookup(ref) {
    var input = $('#ref'), err = $('#ref-error');
    if (!V.refId(ref)) { err.textContent = 'Enter an ID like JS-2026-88912.'; input.setAttribute('aria-invalid', 'true'); $('#result').innerHTML = ''; return; }
    var app = find(ref);
    if (!app) { err.textContent = 'No application found with this ID. Check the number on your receipt.'; input.setAttribute('aria-invalid', 'true'); $('#result').innerHTML = ''; return; }
    err.textContent = ''; input.removeAttribute('aria-invalid');
    show(app);
  }

  $('#track-form').addEventListener('submit', function (e) { e.preventDefault(); lookup($('#ref').value); });
  $('#result').addEventListener('click', function (e) {
    var b = e.target.closest('#simulate');
    if (!b) return;
    var apps = JS.store.get('apps', []), app = apps.filter(function (a) { return a.ref === b.dataset.ref; })[0];
    if (app && app.status < 3) {
      app.status++; app.history.push({ status: app.status, at: new Date().toISOString() });
      JS.store.set('apps', apps); JS.toast('Status updated: ' + JS.STATUS[app.status]); show(app); renderList();
    }
  });
  $('#my-apps').addEventListener('click', function (e) {
    var a = e.target.closest('[data-ref]');
    if (a) { e.preventDefault(); $('#ref').value = a.dataset.ref; lookup(a.dataset.ref); }
  });

  seed(); renderList();
  var ref = JS.params().get('ref');
  if (ref) { $('#ref').value = ref; lookup(ref); }
})(window, document);
