/* utils.js - small helpers shared by every page.
   All code lives under one global namespace (window.JanSetu) so scripts loaded
   with plain <script> tags (no build step, works from file://) never collide. */
(function (w) {
  'use strict';
  var JS = (w.JanSetu = w.JanSetu || {});

  JS.$  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  JS.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* localStorage wrapper: never throws (private mode / storage disabled) */
  JS.store = {
    get: function (key, fallback) {
      try { var v = w.localStorage.getItem('js.' + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { w.localStorage.setItem('js.' + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) { try { w.localStorage.removeItem('js.' + key); } catch (e) {} }
  };

  /* Escape text before putting it into innerHTML (prevents XSS) */
  JS.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  JS.debounce = function (fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  };

  JS.params = function () { return new URLSearchParams(w.location.search); };

  JS.formatDate = function (iso) {
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* Toast messages: the region has role="status" so screen readers announce them */
  JS.toast = function (message, type) {
    var region = JS.$('#toast-region');
    if (!region) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    el.textContent = message;
    region.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  };

  JS.reducedMotion = function () {
    return w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
})(window);
