import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, developerName, sanitizeCell, detectAlias } from '../src/format.js';

test('formatDate → dd-mmm-yyyy', () => {
  assert.equal(formatDate('2026-11-10T15:31:08.147Z'), '10-Nov-2026');
  assert.equal(formatDate('2026-11-22T00:00:00Z'), '22-Nov-2026');
});

test('formatDate invalid → dash', () => {
  assert.equal(formatDate(''), '-');
  assert.equal(formatDate('not-a-date'), '-');
});

test('developerName from object author', () => {
  assert.equal(developerName({ name: 'YourFam' }), 'YourFam');
  assert.equal(developerName({ name: '' }), '-');
});

test('developerName from string author', () => {
  assert.equal(
    developerName('Jane Doe <jane@example.com> (https://example.com)'),
    'Jane Doe',
  );
});

test('developerName empty → dash', () => {
  assert.equal(developerName(null), '-');
  assert.equal(developerName(''), '-');
});

test('sanitizeCell replaces newlines and pipes', () => {
  assert.equal(sanitizeCell('a\nb\r\nc|d'), 'a b c\\|d');
});

test('detectAlias', () => {
  assert.equal(
    detectAlias('Unscoped alias of @yourfam/yf-tree — write a directory tree'),
    '@yourfam/yf-tree',
  );
  assert.equal(detectAlias('Just a package'), null);
  assert.equal(detectAlias(null), null);
});

test('detectAlias trims trailing punctuation', () => {
  assert.equal(detectAlias('Unscoped alias of @yourfam/yf-merge-check.'), '@yourfam/yf-merge-check');
  assert.equal(detectAlias('Unscoped alias of @yourfam/yf-merge-check, safe check'), '@yourfam/yf-merge-check');
});
