/* Unit tests for the pure validation functions.
   Run with:  node --test tests/validators.test.js   (Node 18 or newer, no packages needed) */
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../js/validators.js');

test('required', () => {
  assert.equal(V.required('a'), true);
  assert.equal(V.required('   '), false);
  assert.equal(V.required(null), false);
});

test('name accepts letters from any script and rejects digits', () => {
  assert.equal(V.name('Ananya Roy'), true);
  assert.equal(V.name("D'Souza-Rao"), true);
  assert.equal(V.name('সৃজিতা বিশ্বাস'), true);
  assert.equal(V.name('R2D2'), false);
  assert.equal(V.name('A'), false);
});

test('mobile numbers', () => {
  assert.equal(V.mobile('9876543210'), true);
  assert.equal(V.mobile('+91 98765 43210'), true);
  assert.equal(V.mobile('098765-43210'), true);
  assert.equal(V.mobile('5876543210'), false);   // must start 6-9
  assert.equal(V.mobile('98765'), false);
});

test('email', () => {
  assert.equal(V.email('name@example.com'), true);
  assert.equal(V.email('name@example'), false);
  assert.equal(V.email('name example@x.com'), false);
});

test('pincode', () => {
  assert.equal(V.pincode('700001'), true);
  assert.equal(V.pincode('012345'), false);
  assert.equal(V.pincode('7000'), false);
});

test('wholeNumber allows commas but not decimals or text', () => {
  assert.equal(V.wholeNumber('120000'), true);
  assert.equal(V.wholeNumber('1,20,000'), true);
  assert.equal(V.wholeNumber('12.5'), false);
  assert.equal(V.wholeNumber('abc'), false);
});

test('dates and age use an injectable "today"', () => {
  const today = '2026-09-21';
  assert.equal(V.dateNotFuture('2026-09-21', today), true);
  assert.equal(V.dateNotFuture('2026-09-22', today), false);
  assert.equal(V.ageAtLeast('2008-09-21', 18, today), true);    // turns 18 today
  assert.equal(V.ageAtLeast('2008-09-22', 18, today), false);   // turns 18 tomorrow
  assert.equal(V.ageAtLeast('not-a-date', 18, today), false);
});

test('file rules: type, size, empty', () => {
  assert.equal(V.file({ name: 'id.pdf', size: 1000 }).ok, true);
  assert.equal(V.file({ name: 'photo.JPG', size: 1000 }).ok, true);
  assert.equal(V.file({ name: 'run.exe', size: 1000 }).ok, false);
  assert.equal(V.file({ name: 'big.pdf', size: 3 * 1024 * 1024 }).ok, false);
  assert.equal(V.file({ name: 'empty.pdf', size: 0 }).ok, false);
  assert.equal(V.file(null).ok, false);
});

test('reference ID format and generator', () => {
  assert.equal(V.refId('JS-2026-88912'), true);
  assert.equal(V.refId('js-2026-88912'), true);
  assert.equal(V.refId('JS-26-88912'), false);
  const ref = V.generateRef(2026, () => 0.5);
  assert.equal(V.refId(ref), true);
  assert.equal(V.generateRef(2026, () => 0), 'JS-2026-10000');
  assert.equal(V.generateRef(2026, () => 0.999999), 'JS-2026-99999');
});
