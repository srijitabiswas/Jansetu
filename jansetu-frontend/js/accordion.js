/* accordion.js - accessible disclosure widgets.
   Each button controls one panel (aria-controls) and reports its state
   (aria-expanded). Only one panel is open at a time inside a group. */
(function (w, d) {
  'use strict';
  var JS = w.JanSetu;
  JS.initAccordion = function (root) {
    var buttons = JS.$$('.accordion__button', root);
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        buttons.forEach(function (b) {               // close all, then open the clicked one
          b.setAttribute('aria-expanded', 'false');
          d.getElementById(b.getAttribute('aria-controls')).hidden = true;
        });
        if (!open) {
          btn.setAttribute('aria-expanded', 'true');
          d.getElementById(btn.getAttribute('aria-controls')).hidden = false;
        }
      });
      /* Up / Down / Home / End move between headers (WAI-ARIA accordion pattern) */
      btn.addEventListener('keydown', function (e) {
        var i = buttons.indexOf(btn), n = buttons.length, t = null;
        if (e.key === 'ArrowDown') t = buttons[(i + 1) % n];
        if (e.key === 'ArrowUp')   t = buttons[(i - 1 + n) % n];
        if (e.key === 'Home')      t = buttons[0];
        if (e.key === 'End')       t = buttons[n - 1];
        if (t) { e.preventDefault(); t.focus(); }
      });
    });
  };
})(window, document);
