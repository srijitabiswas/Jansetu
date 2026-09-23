/* apply.js - multi-step application form.
   Step 1 Eligibility -> 2 Details -> 3 Documents -> 4 Review -> 5 Submitted.
   Fields for step 2 are generated from the chosen service (dynamic form),
   each step is validated before moving on, and progress is autosaved. */
(function (w, d) {
  'use strict';
  var JS = w.JanSetu, V = w.JanSetuValidators, $ = JS.$, $$ = JS.$$, esc = JS.esc;
  var TOTAL = 5;
  var state = { step: 1, serviceId: '', values: {}, elig: [], files: {} };

  var BASE_FIELDS = [
    { id: 'fullName', label: 'Full name', type: 'text', kind: 'name', auto: 'name' },
    { id: 'dob', label: 'Date of birth', type: 'date', kind: 'dob', auto: 'bday' },
    { id: 'mobile', label: 'Mobile number', type: 'tel', kind: 'mobile', auto: 'tel-national', hint: '10 digits, e.g. 98765 43210' },
    { id: 'email', label: 'Email (optional)', type: 'email', kind: 'email', optional: true, auto: 'email' },
    { id: 'address', label: 'Address', type: 'text', kind: 'text', auto: 'street-address', full: true },
    { id: 'pincode', label: 'PIN code', type: 'text', kind: 'pin', auto: 'postal-code', hint: '6 digits' }
  ];
  /* Build one form field. Every input gets a visible <label>, an optional hint
     and an error <p>; aria-describedby links them so screen readers read all three. */
  function fieldHTML(f, value) {
    var id = 'f-' + f.id, hint = f.hint ? '<span class="hint" id="' + id + '-hint">' + esc(f.hint) + '</span>' : '';
    var desc = (f.hint ? id + '-hint ' : '') + id + '-err';
    var attrs = ' id="' + id + '" name="' + f.id + '" aria-describedby="' + desc + '"' +
      (f.optional ? '' : ' required') + (f.auto ? ' autocomplete="' + f.auto + '"' : '') +
      (f.type === 'tel' || f.kind === 'pin' || f.kind === 'whole' ? ' inputmode="numeric"' : '');
    var control;
    if (f.type === 'select') {
      control = '<select' + attrs + '><option value="">Select\u2026</option>' + f.options.map(function (o) {
        return '<option' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    } else {
      control = '<input type="' + f.type + '"' + attrs + ' value="' + esc(value || '') + '">';
    }
    return '<div class="field' + (f.full ? ' full' : '') + '"><label for="' + id + '">' + esc(f.label) +
      (f.optional ? '' : ' <span class="req" aria-hidden="true">*</span>') + '</label>' + hint + control +
      '<p class="field__error" id="' + id + '-err"></p></div>';
  }

  function currentService() { return JS.getService(state.serviceId); }

  function renderStep2() {
    var s = currentService(), extra = s ? s.extra : [];
    $('#base-fields').innerHTML = BASE_FIELDS.map(function (f) { return fieldHTML(f, state.values[f.id]); }).join('');
    $('#dynamic-fields').innerHTML = extra.length
      ? '<h3 class="full" style="grid-column:1/-1">Details for ' + esc(s.title) + '</h3>' + extra.map(function (f) { return fieldHTML(f, state.values[f.id]); }).join('')
      : '';
  }

  function renderEligibility() {
    var s = currentService(), box = $('#eligibility');
    if (!s) { box.innerHTML = '<p class="muted">Select a service to see who can apply.</p>'; return; }
    box.innerHTML = '<fieldset style="border:0;padding:0;margin:0"><legend class="label">Please confirm</legend>' +
      s.eligibility.map(function (t, i) {
        return '<label class="check"><input type="checkbox" data-elig="' + i + '"' + (state.elig[i] ? ' checked' : '') + '> <span>' + esc(t) + '</span></label>';
      }).join('') + '</fieldset><p class="field__error" id="elig-err"></p>' +
      '<p class="muted">Fee: <strong>' + esc(s.fee) + '</strong> &middot; Processing time: <strong>about ' + s.days + ' days</strong></p>';
  }

  function renderDocs() {
    var s = currentService(), box = $('#docs');
    if (!s) { box.innerHTML = ''; return; }
    box.innerHTML = s.docs.map(function (name, i) {
      var f = state.files[name];
      return '<div class="doc-item"><label for="doc-' + i + '"><strong>' + esc(name) + '</strong> <span class="req" aria-hidden="true">*</span></label>' +
        '<span class="hint" id="doc-' + i + '-hint">PDF, JPG or PNG, up to 2 MB</span>' +
        '<input type="file" id="doc-' + i + '" data-doc="' + esc(name) + '" accept=".pdf,.jpg,.jpeg,.png" aria-describedby="doc-' + i + '-hint doc-' + i + '-err">' +
        '<p class="field__error" id="doc-' + i + '-err"></p>' +
        (f ? '<ul class="filelist"><li><span>' + esc(f.name) + ' (' + Math.max(1, Math.round(f.size / 1024)) + ' KB)</span>' +
             '<button type="button" class="btn btn--ghost" data-remove="' + esc(name) + '" style="min-height:2rem;padding:.1rem .6rem">Remove</button></li></ul>' : '') + '</div>';
    }).join('');
  }

  function renderReview() {
    var s = currentService(), rows = [['Service', s.title], ['Fee', s.fee]];
    BASE_FIELDS.concat(s.extra).forEach(function (f) { if (state.values[f.id]) rows.push([f.label.replace(' (optional)', ''), state.values[f.id]]); });
    rows.push(['Documents', s.docs.map(function (n) { return n + ': ' + (state.files[n] ? state.files[n].name : '-'); }).join('; ')]);
    $('#review').innerHTML = '<dl class="summary">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>';
  }
  /* Validate one field by its "kind". Returns an error message or '' when valid. */
  function validateField(f, value) {
    var v = String(value || '').trim();
    if (!V.required(v)) return f.optional ? '' : 'Enter ' + f.label.toLowerCase().replace(' (optional)', '') + '.';
    switch (f.kind) {
      case 'name':     return V.name(v) ? '' : 'Use letters only, for example Ananya Roy.';
      case 'mobile':   return V.mobile(v) ? '' : 'Enter a 10-digit mobile number starting with 6, 7, 8 or 9.';
      case 'email':    return V.email(v) ? '' : 'Enter an email like name@example.com.';
      case 'pin':      return V.pincode(v) ? '' : 'Enter a 6-digit PIN code.';
      case 'whole':
        if (!V.wholeNumber(v)) return 'Enter a whole number, for example 120000.';
        return V.maxDigits(v, 9) ? '' : 'That number looks too large. Enter an amount up to 9 digits.';
      case 'pastDate':
        if (!V.dateNotFuture(v)) return 'The date cannot be in the future.';
        return V.ageAtMost(v, 120) ? '' : 'Enter a realistic date.';
      case 'dob':
        if (!V.dateNotFuture(v)) return 'Date of birth cannot be in the future.';
        if (!V.ageAtMost(v, 120)) return 'Enter a realistic date of birth.';
        var s = currentService(), min = s && s.minAge ? s.minAge : 18;
        return V.ageAtLeast(v, min) ? '' : 'You must be at least ' + min + ' years old for this service.';
      default: return '';
    }
  }

  /* Validate the whole step; returns a list of {id, message} */
  function validateStep(n) {
    var errs = [], s = currentService();
    if (n === 1) {
      if (!s) errs.push({ id: 'service', message: 'Select a service to continue.' });
      else if (state.elig.filter(Boolean).length < s.eligibility.length) errs.push({ id: 'eligibility', message: 'Please confirm all the statements to continue.' });
    }
    if (n === 2) {
      BASE_FIELDS.concat(s.extra).forEach(function (f) {
        var m = validateField(f, state.values[f.id]);
        if (m) errs.push({ id: 'f-' + f.id, message: m });
      });
    }
    if (n === 3) {
      s.docs.forEach(function (name, i) {
        if (!state.files[name]) errs.push({ id: 'doc-' + i, message: 'Upload ' + name + '.' });
      });
    }
    if (n === 4 && !$('#declare').checked) errs.push({ id: 'declare', message: 'Please confirm the declaration to submit.' });
    return errs;
  }

  function showErrors(errs) {
    $$('.field__error').forEach(function (p) { p.textContent = ''; });
    $$('[aria-invalid]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
    var box = $('#error-summary');
    if (!errs.length) { box.hidden = true; box.innerHTML = ''; return; }
    errs.forEach(function (e) {
      var input = d.getElementById(e.id), out = d.getElementById(e.id + '-err') || d.getElementById(e.id === 'eligibility' ? 'elig-err' : 'x');
      if (input) input.setAttribute('aria-invalid', 'true');
      if (out) out.textContent = e.message;
    });
    box.innerHTML = '<strong>Please fix ' + errs.length + (errs.length === 1 ? ' problem' : ' problems') + ':</strong><ul>' +
      errs.map(function (e) { return '<li><a href="#' + e.id + '">' + esc(e.message) + '</a></li>'; }).join('') + '</ul>';
    box.hidden = false;
    box.focus();                                          // move focus to the summary so screen readers announce it
  }
  /* Show one step panel, update the stepper and move focus to the step heading */
  function goTo(n, opts) {
    opts = opts || {};
    state.step = n;
    $$('[data-step]').forEach(function (p) { p.hidden = +p.dataset.step !== n; });
    $$('.stepper li').forEach(function (li, i) {
      li.dataset.state = i + 1 < n ? 'done' : i + 1 === n ? 'current' : 'todo';
      if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('#step-count').textContent = 'Step ' + Math.min(n, TOTAL) + ' of ' + TOTAL;
    if (n === 2) renderStep2();
    if (n === 3) renderDocs();
    if (n === 4) renderReview();
    $('#btn-back').hidden = n === 1 || n === 5;
    $('#btn-next').hidden = n === 5;
    $('#btn-save').hidden = n === 5;
    $('#btn-next').textContent = n === 4 ? 'Submit application' : 'Next';
    var h = $('[data-step="' + n + '"] h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
    showErrors([]);
    /* Push a history entry per step (not on the very first render, and not when we are
       here *because* of Back/Forward) so the browser Back button moves between wizard
       steps instead of leaving the page. */
    if (!opts.initial && !opts.fromPop) {
      try { history.pushState({ jsStep: n }, '', location.pathname + location.search); } catch (e) {}
    }
    if (n < 5 && !opts.initial) save(true);
  }
  w.addEventListener('popstate', function (e) {
    /* Clicking an in-page "#f-..." link (for example from the error summary) also fires
       popstate in some browsers, with state === null. Only react when our own step data
       is present, so a plain fragment jump is left to scroll normally instead of resetting
       the wizard to step 1. */
    if (!e.state || typeof e.state.jsStep !== 'number') return;
    if (e.state.jsStep !== state.step) goTo(e.state.jsStep, { fromPop: true });
  });

  function collect() {                                     // copy the DOM values into state
    $$('#step-2 input, #step-2 select').forEach(function (el) { if (el.name) state.values[el.name] = el.value; });
  }

  $('#btn-next').addEventListener('click', function () {
    if (state.step === 2) collect();
    var errs = validateStep(state.step);
    if (errs.length) { showErrors(errs); return; }
    if (state.step === 4) return submit();
    goTo(state.step + 1);
  });
  $('#btn-back').addEventListener('click', function () { if (state.step === 2) collect(); goTo(state.step - 1); });
  /* Autosave: everything except the File objects is stored in localStorage */
  function save(quiet) {
    if (state.step === 2) collect();
    JS.store.set('draft', { step: Math.min(state.step, 4), serviceId: state.serviceId, values: state.values, elig: state.elig, files: state.files, at: new Date().toISOString() });
    var t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    $('#draft-status').textContent = 'Draft saved ' + t;
    if (quiet !== true) JS.toast('Draft saved. You can finish later.');
  }
  $('#btn-save').addEventListener('click', function () { save(); });
  $('#steps-root').addEventListener('input', JS.debounce(function () { if (state.step < 5) save(true); }, 600));

  /* Step 1: service select, eligibility checkboxes */
  $('#service').addEventListener('change', function (e) {
    state.serviceId = e.target.value; state.elig = []; state.files = {}; renderEligibility();
  });
  $('#eligibility').addEventListener('change', function (e) {
    var i = e.target.getAttribute('data-elig');
    if (i !== null) state.elig[+i] = e.target.checked;
  });

  /* Step 3: file inputs (delegated) */
  $('#docs').addEventListener('change', function (e) {
    var input = e.target, name = input.dataset.doc;
    if (!name || !input.files.length) return;
    var f = input.files[0], res = V.file({ name: f.name, size: f.size });
    var out = input.parentNode.querySelector('.field__error');
    if (!res.ok) { out.textContent = res.message; input.value = ''; input.setAttribute('aria-invalid', 'true'); return; }
    state.files[name] = { name: f.name, size: f.size };
    renderDocs(); save(true);
    JS.toast(name + ' added');
  });
  $('#docs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-remove]');
    if (b) { delete state.files[b.dataset.remove]; renderDocs(); }
  });

  function submit() {
    var s = currentService();
    var ref = V.generateRef(new Date().getFullYear());
    var apps = JS.getApps();
    var now = new Date().toISOString();
    apps.unshift({ ref: ref, serviceId: s.id, title: s.title, status: 0, created: now, history: [{ status: 0, at: now }] });
    JS.store.set('apps', apps);
    JS.store.remove('draft');
    $('#ref-code').textContent = ref;
    $('#track-link').href = 'track.html?ref=' + ref;
    goTo(5);
  }

  /* Copy the reference ID (Clipboard API with a fallback for older browsers) */
  $('#copy-ref').addEventListener('click', function () {
    var text = $('#ref-code').textContent;
    function selectFallback() {
      var r = d.createRange(); r.selectNodeContents($('#ref-code'));
      var sel = w.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      JS.toast('Selected. Press Ctrl+C to copy.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { JS.toast('Reference ID copied'); }, selectFallback);
    } else { selectFallback(); }
  });

  $('#start-over').addEventListener('click', function () {
    JS.store.remove('draft'); state = { step: 1, serviceId: '', values: {}, elig: [], files: {} };
    $('#service').value = ''; renderEligibility(); $('#restore-note').hidden = true; goTo(1);
  });

  /* ---- Initialise: fill the service list, restore a draft, honour ?service= ---- */
  $('#service').innerHTML = '<option value="">Select a service\u2026</option>' + JS.SERVICES.map(function (s) {
    return '<option value="' + s.id + '">' + esc(s.title) + '</option>'; }).join('');
  if (!JS.store.available()) { $('#storage-warning').hidden = false; }
  var draft = JS.store.get('draft', null, 'object'), wanted = JS.params().get('service'), hadFiles = false, restored = false;
  if (draft && draft.serviceId && (!wanted || wanted === draft.serviceId)) {
    state.serviceId = draft.serviceId; state.values = draft.values || {}; state.elig = draft.elig || [];
    hadFiles = !!(draft.files && Object.keys(draft.files).length);
    state.files = {};                       // the browser cannot restore File objects, so documents must always be re-attached
    restored = true;
    $('#restore-note').hidden = false;
    if (hadFiles) $('#restore-note').querySelector('.restore-text').textContent = 'We restored your saved draft. Please re-attach your documents in step 3, since files cannot be saved across visits.';
  } else if (wanted && JS.getService(wanted)) { state.serviceId = wanted; }
  $('#service').value = state.serviceId;
  renderEligibility();
  /* Resume at the saved step whenever this draft matches the service being restored -
     whether the visit came from a bare apply.html or from an apply.html?service=... link. */
  var startStep = restored && draft.step ? draft.step : 1;
  if (hadFiles && startStep > 3) startStep = 3;   // never resume past Documents with phantom files
  try { history.replaceState({ jsStep: startStep }, '', location.pathname + location.search); } catch (e) {}
  goTo(startStep, { initial: true });
})(window, document);
