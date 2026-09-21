/* i18n.js - tiny translation layer.
   Elements with data-i18n="key" get their text replaced; data-i18n-placeholder
   does the same for placeholders. English is the source; the Hindi and Bengali
   strings are samples that a native speaker should review before release. */
(function (w) {
  'use strict';
  var JS = (w.JanSetu = w.JanSetu || {});

  var DICT = {
    en: { 'nav.home': 'Home', 'nav.services': 'Services', 'nav.track': 'Track', 'nav.apply': 'Apply',
          'hero.t1': 'Every government service,', 'hero.t2': 'one trusted place.',
          'hero.sub': 'Apply, track and get updates in your own language.',
          'hero.ph': 'Search a service, e.g. Income Certificate', 'hero.btn': 'Search',
          'track.title': 'Track your application', 'track.btn': 'Track status' },
    hi: { 'nav.home': 'होम', 'nav.services': 'सेवाएँ', 'nav.track': 'ट्रैक', 'nav.apply': 'आवेदन करें',
          'hero.t1': 'हर सरकारी सेवा,', 'hero.t2': 'एक भरोसेमंद जगह।',
          'hero.sub': 'अपनी भाषा में आवेदन करें, ट्रैक करें और अपडेट पाएँ।',
          'hero.ph': 'सेवा खोजें, जैसे आय प्रमाण पत्र', 'hero.btn': 'खोजें',
          'track.title': 'अपना आवेदन ट्रैक करें', 'track.btn': 'स्थिति देखें' },
    bn: { 'nav.home': 'হোম', 'nav.services': 'পরিষেবা', 'nav.track': 'ট্র্যাক', 'nav.apply': 'আবেদন করুন',
          'hero.t1': 'সব সরকারি পরিষেবা,', 'hero.t2': 'এক বিশ্বস্ত জায়গায়।',
          'hero.sub': 'আপনার ভাষায় আবেদন করুন, ট্র্যাক করুন ও আপডেট পান।',
          'hero.ph': 'পরিষেবা খুঁজুন, যেমন আয়ের শংসাপত্র', 'hero.btn': 'খুঁজুন',
          'track.title': 'আপনার আবেদন ট্র্যাক করুন', 'track.btn': 'অবস্থা দেখুন' }
  };

  JS.setLang = function (lang) {
    if (!DICT[lang]) lang = 'en';
    document.documentElement.lang = lang;
    JS.$$('[data-i18n]').forEach(function (el) {
      var t = DICT[lang][el.getAttribute('data-i18n')];
      if (t) el.textContent = t;
    });
    JS.$$('[data-i18n-placeholder]').forEach(function (el) {
      var t = DICT[lang][el.getAttribute('data-i18n-placeholder')];
      if (t) el.setAttribute('placeholder', t);
    });
    JS.store.set('lang', lang);
  };
})(window);
