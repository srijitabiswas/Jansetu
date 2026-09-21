/* services.js - Service directory: live search, category filter, sort,
   and an accessible modal with the full service details. */
(function (w, d) {
  'use strict';
  var JS = w.JanSetu, $ = JS.$, esc = JS.esc;
  var grid = $('#results'), count = $('#count'), q = $('#q'), sort = $('#sort'), chipsBox = $('#cat-chips');
  var modal = $('#service-modal');
  var state = { q: '', cat: 'All', sort: 'relevance' };
  /* Pure function: takes the state, returns the matching services */
  function filterServices(list, s) {
    var term = s.q.trim().toLowerCase();
    var out = list.filter(function (sv) {
      var inCat = s.cat === 'All' || sv.cat === s.cat;
      var hay = (sv.title + ' ' + sv.dept + ' ' + sv.desc).toLowerCase();
      return inCat && (!term || hay.indexOf(term) !== -1);
    });
    if (s.sort === 'title') out.sort(function (a, b) { return a.title.localeCompare(b.title); });
    if (s.sort === 'days')  out.sort(function (a, b) { return a.days - b.days; });
    return out;
  }

  function render() {
    var list = filterServices(JS.SERVICES, state);
    count.textContent = list.length + (list.length === 1 ? ' service found' : ' services found');  // read out by screen readers (aria-live)
    if (!list.length) {
      grid.innerHTML = '<div class="card empty" style="grid-column:1/-1"><h3>No services match your search</h3>' +
        '<p class="muted">Try a shorter word, or clear the filters.</p><button class="btn btn--outline" id="clear">Clear filters</button></div>';
      $('#clear').addEventListener('click', reset);
      return;
    }
    grid.innerHTML = list.map(function (s) {
      return '<article class="card card--hover service-card">' +
        '<h3>' + esc(s.title) + '</h3><div class="muted">' + esc(s.dept) + '</div>' +
        '<p>' + esc(s.desc) + '</p>' +
        '<div><span class="chip chip--ok">Online</span> <span class="chip chip--info">' + (s.days === 1 ? '1 day' : s.days + ' days') + '</span> ' +
        '<span class="chip chip--wait">' + esc(s.fee) + '</span></div>' +
        '<div class="actions"><button class="btn btn--outline" data-open="' + s.id + '">View details</button>' +
        '<a class="btn" href="apply.html?service=' + s.id + '">Apply</a></div></article>';
    }).join('');
    syncUrl();
  }

  function syncUrl() {                                   // keep the URL shareable: services.html?q=tax&cat=Civic
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.cat !== 'All') p.set('cat', state.cat);
    var qs = p.toString();
    try { history.replaceState(null, '', qs ? '?' + qs : w.location.pathname); } catch (e) {}
  }

  function renderChips() {
    chipsBox.innerHTML = ['All'].concat(JS.CATEGORIES).map(function (c) {
      return '<button class="chip-btn" aria-pressed="' + (c === state.cat) + '" data-cat="' + c + '">' + c + '</button>';
    }).join('');
  }
  function reset() { state = { q: '', cat: 'All', sort: 'relevance' }; q.value = ''; sort.value = 'relevance'; renderChips(); render(); q.focus(); }
  /* Modal built on the native <dialog> element: showModal() gives us a focus trap,
     Escape-to-close and an inert background for free. */
  function openModal(id, trigger) {
    var s = JS.getService(id);
    $('#modal-title').textContent = s.title;
    $('#modal-body').innerHTML =
      '<p>' + esc(s.desc) + '</p>' +
      '<p><span class="chip chip--info">' + esc(s.dept) + '</span> <span class="chip chip--ok">Approx. ' + s.days + ' days</span> <span class="chip chip--wait">Fee: ' + esc(s.fee) + '</span></p>' +
      '<h3>Who can apply?</h3><ul>' + s.eligibility.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>' +
      '<h3>Documents you will need</h3><ul>' + s.docs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>';
    $('#modal-apply').href = 'apply.html?service=' + s.id;
    modal._trigger = trigger;
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  }
  function closeModal() { if (modal.close) modal.close(); else modal.removeAttribute('open'); }

  modal.addEventListener('click', function (e) {          // click on the dark backdrop closes the dialog
    var r = modal.getBoundingClientRect();
    var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeModal();
  });
  modal.addEventListener('close', function () {           // return focus to the button that opened it
    if (modal._trigger) modal._trigger.focus();
  });
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-dismiss').addEventListener('click', closeModal);

  /* Event delegation: one listener handles every card button */
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]');
    if (b) openModal(b.dataset.open, b);
  });
  chipsBox.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat; renderChips(); render();
  });
  q.addEventListener('input', JS.debounce(function () { state.q = q.value; render(); }, 150));   // debounce = wait until typing pauses
  $('#search-form').addEventListener('submit', function (e) { e.preventDefault(); state.q = q.value; render(); });
  sort.addEventListener('change', function () { state.sort = sort.value; render(); });

  /* Initial state from the URL (?q= and ?cat=) */
  var p = JS.params();
  if (p.get('q')) { state.q = p.get('q'); q.value = state.q; }
  if (p.get('cat') && JS.CATEGORIES.indexOf(p.get('cat')) !== -1) state.cat = p.get('cat');
  renderChips(); render();

  w.JanSetu.filterServices = filterServices;              // exposed for tests
})(window, document);
