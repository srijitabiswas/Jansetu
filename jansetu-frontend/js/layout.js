/* layout.js - behaviour for the header shared by every page:
   hamburger menu, Services dropdown, language / theme / text-size controls. */
(function (w, d) {
  'use strict';
  var JS = w.JanSetu, $ = JS.$, $$ = JS.$$;
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#primary-nav');
    if (!toggle || !nav) return;

    /* --- Hamburger: show / hide the nav panel on small screens --- */
    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    /* --- Dropdown: a <button> controls a <ul>; aria-expanded tells assistive tech the state --- */
    $$('.has-sub > button', nav).forEach(function (btn) {
      var panel = d.getElementById(btn.getAttribute('aria-controls'));
      function setSub(open) {
        btn.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
      }
      btn.addEventListener('click', function () {
        setSub(btn.getAttribute('aria-expanded') !== 'true');
      });
      /* ArrowDown from the button jumps into the menu (keyboard pattern) */
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSub(true); panel.querySelector('a').focus(); }
      });
      panel.addEventListener('keydown', function (e) {
        var links = $$('a', panel), i = links.indexOf(d.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
      });
      btn._close = function () { setSub(false); };
    });

    /* Escape closes any open menu and returns focus to its button */
    d.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      $$('.has-sub > button[aria-expanded="true"]', nav).forEach(function (b) { b._close(); b.focus(); });
      if (toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });

    /* Clicking outside closes the dropdown */
    d.addEventListener('click', function (e) {
      $$('.has-sub > button[aria-expanded="true"]', nav).forEach(function (b) {
        if (!b.parentNode.contains(e.target)) b._close();
      });
    });
  }

  function initTools() {
    var lang = $('#lang'), theme = $('#theme-toggle'), size = $('#text-size');
    var root = d.documentElement;

    if (lang) {
      lang.value = JS.store.get('lang', 'en');
      JS.setLang(lang.value);
      lang.addEventListener('change', function () { JS.setLang(lang.value); });
    }
    if (theme) {
      var syncTheme = function () {
        var dark = root.dataset.theme === 'dark';
        theme.setAttribute('aria-pressed', String(dark));
        theme.textContent = dark ? 'Light mode' : 'Dark mode';
      };
      syncTheme();
      theme.addEventListener('click', function () {
        root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        JS.store.set('theme', root.dataset.theme);
        syncTheme();
      });
    }
    if (size) {
      var steps = ['', 'lg', 'xl'], label = ['A', 'A+', 'A++'];
      var cur = Math.max(0, steps.indexOf(root.dataset.text || ''));
      size.textContent = label[cur];
      size.addEventListener('click', function () {
        cur = (cur + 1) % steps.length;
        if (steps[cur]) root.dataset.text = steps[cur]; else delete root.dataset.text;
        JS.store.set('text', steps[cur]);
        size.textContent = label[cur];
      });
    }
  }

  initNav();
  initTools();
})(window, document);
