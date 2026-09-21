/* validators.js - pure validation functions with no DOM access.
   Written as a UMD module so the same file runs in the browser
   (window.JanSetuValidators) and in Node for unit tests (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.JanSetuValidators = factory(); }
})(this, function () {
  'use strict';
  var V = {};

  V.required = function (v) { return String(v == null ? '' : v).trim().length > 0; };

  /* Names: letters and combining marks (vowel signs) from any script, spaces, dots, hyphens, apostrophes; 2-60 chars */
  V.name = function (v) { return /^[\p{L}][\p{L}\p{M} .'\-]{1,59}$/u.test(String(v).trim()); };

  /* Indian mobile: 10 digits starting 6-9; spaces, dashes and a +91 / 0 prefix are ignored */
  V.mobile = function (v) {
    var d = String(v).replace(/[\s\-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
    return /^[6-9]\d{9}$/.test(d);
  };

  V.email = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); };
  V.pincode = function (v) { return /^[1-9]\d{5}$/.test(String(v).trim()); };

  /* Whole rupees / counts: digits only, commas allowed (1,20,000) */
  V.wholeNumber = function (v) { return /^\d+$/.test(String(v).replace(/,/g, '').trim()); };

  V.dateNotFuture = function (iso, today) {
    var d = new Date(iso), t = today ? new Date(today) : new Date();
    return !isNaN(d) && d <= t;
  };

  V.ageAtLeast = function (iso, years, today) {
    var d = new Date(iso), t = today ? new Date(today) : new Date();
    if (isNaN(d)) return false;
    var age = t.getFullYear() - d.getFullYear();
    var m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
    return age >= years;
  };

  /* Uploaded document: PDF / JPG / PNG and at most 2 MB */
  V.MAX_FILE_BYTES = 2 * 1024 * 1024;
  V.file = function (meta) {
    if (!meta || !meta.name) return { ok: false, message: 'Choose a file to upload.' };
    if (!/\.(pdf|jpe?g|png)$/i.test(meta.name)) return { ok: false, message: 'Only PDF, JPG or PNG files are accepted.' };
    if (meta.size > V.MAX_FILE_BYTES) return { ok: false, message: 'File is larger than 2 MB. Please upload a smaller file.' };
    if (meta.size === 0) return { ok: false, message: 'This file is empty.' };
    return { ok: true, message: '' };
  };

  V.refId = function (v) { return /^JS-\d{4}-\d{5}$/i.test(String(v).trim()); };

  /* Reference ID: JS-<year>-<5 digits>. The random source is injectable for tests. */
  V.generateRef = function (year, rand) {
    var n = Math.floor((rand ? rand() : Math.random()) * 90000) + 10000;
    return 'JS-' + year + '-' + n;
  };

  return V;
});
