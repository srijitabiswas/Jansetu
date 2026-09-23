/* home.js - homepage: hero search, quick track, FAQ, animated counters. */
(function (w, d) {
  'use strict';
  var JS = w.JanSetu, $ = JS.$;

  /* Hero search sends the query to the directory page */
  var hero = $('#hero-search');
  if (hero) hero.addEventListener('submit', function (e) {
    e.preventDefault();
    w.location.href = 'services.html?q=' + encodeURIComponent($('#hero-q').value.trim());
  });

  /* Quick track: validate the reference ID format before leaving the page */
  var quick = $('#quick-track');
  if (quick) quick.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#quick-ref'), err = $('#quick-ref-error');
    var ok = w.JanSetuValidators.refId(input.value);
    err.textContent = ok ? '' : 'Enter an ID like JS-2026-88912.';
    input.setAttribute('aria-invalid', String(!ok));
    if (ok) w.location.href = 'track.html?ref=' + encodeURIComponent(input.value.trim().toUpperCase());
    else input.focus();
  });

  /* FAQ: build the accordion from data, then attach behaviour */
  var faq = $('#faq');
  if (faq) {
    faq.innerHTML = JS.FAQS.map(function (f, i) {
      return '<div class="accordion__item"><h3 style="margin:0">' +
        '<button class="accordion__button" id="faq-b' + i + '" aria-expanded="false" aria-controls="faq-p' + i + '">' +
        JS.esc(f.q) + '<span class="caret" aria-hidden="true"></span></button></h3>' +
        '<div class="accordion__panel" id="faq-p' + i + '" role="region" aria-labelledby="faq-b' + i + '" hidden>' +
        '<p>' + JS.esc(f.a) + '</p></div></div>';
    }).join('');
    JS.initAccordion(faq);
  }
  /* Animated counters: start counting only when the section scrolls into view */
  function animate(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (JS.reducedMotion()) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
    var start = null, dur = 1400;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);                       // ease-out cubic
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = JS.$$('[data-count]');
  if ('IntersectionObserver' in w && !JS.reducedMotion()) {
    counters.forEach(function (c) { c.textContent = '0'; });   // the HTML holds the final numbers (works without JS); reset to 0 only when we will animate
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = (+c.dataset.count).toLocaleString('en-IN') + (c.dataset.suffix || ''); });
  }
})(window, document);
