/* utils.js - small helpers shared by every page.
   All code lives under one global namespace (window.JanSetu) so scripts loaded
   with plain <script> tags (no build step, works from file://) never collide. */
(function (w) {
  'use strict';
  var JS = (w.JanSetu = w.JanSetu || {});

  JS.$  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  JS.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* localStorage wrapper: never throws (private mode / storage disabled) */
  /* Shape check used by store.get: stored data may come from an older version,
     another tool, or a user editing DevTools, so its type is verified before use. */
  function hasType(v, type) {
    if (type === 'array') return Array.isArray(v);
    if (type === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
    if (type) return typeof v === type;
    return true;
  }
  JS.store = {
    get: function (key, fallback, type) {
      try {
        var raw = w.localStorage.getItem('js.' + key);
        if (raw === null) return fallback;
        var v = JSON.parse(raw);
        return hasType(v, type) ? v : fallback;      // wrong shape -> safe default
      } catch (e) { return fallback; }
    },
    /* true when the browser lets us use localStorage (false in some private modes) */
    available: function () {
      try { var k = 'js.__probe'; w.localStorage.setItem(k, '1'); w.localStorage.removeItem(k); return true; }
      catch (e) { return false; }
    },
    set: function (key, value) {
      try { w.localStorage.setItem('js.' + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) { try { w.localStorage.removeItem('js.' + key); } catch (e) { /* storage unavailable */ } }
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

  /* Applications list with every entry checked, so a damaged record cannot crash the pages */
  JS.getApps = function () {
    return JS.store.get('apps', [], 'array').filter(function (a) {
      return a && typeof a.ref === 'string' && typeof a.title === 'string' && typeof a.status === 'number' &&
             a.status >= 0 && a.status <= 3 && Array.isArray(a.history) && a.history.length > 0;
    });
  };

  JS.reducedMotion = function () {
    return w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
})(window);
