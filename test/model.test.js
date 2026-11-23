import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRows, buildFamilies, sortFamilies, takeConsoleRows } from '../src/model.js';

function row(name, overrides = {}) {
  return {
    name,
    version: '1.0.0',
    published: '2026-01-01T00:00:00Z',
    description: '',
    publisher: 'p',
    developer: 'd',
    maintainers: [],
    keywords: [],
    total: 0,
    week: null,
    month: null,
    ...overrides,
  };
}

test('buildFamilies pairs a scoped package with its alias', () => {
  const rows = [
    row('@yourfam/yf-tree', { total: 860, published: '2026-11-10T00:00:00Z' }),
    row('yf-git-tree', { total: 40, description: 'Unscoped alias of @yourfam/yf-tree' }),
    row('left-pad', { total: 900 }),
  ];
  classifyRows(rows);
  const families = buildFamilies(rows);
  assert.equal(families.length, 2);
  const scoped = families.find((f) => f.name === '@yourfam/yf-tree');
  assert.equal(scoped.rows.length, 2);
  assert.equal(scoped.rows[1].name, 'yf-git-tree');
  assert.equal(scoped.total, 860);
});

test('lone alias keeps the alias word and stays its own family', () => {
  const rows = [
    row('yf-git-tree', { total: 40, description: 'Unscoped alias of @yourfam/yf-tree' }),
  ];
  classifyRows(rows);
  assert.equal(rows[0].isLoneAlias, true);
  const families = buildFamilies(rows);
  assert.equal(families.length, 1);
  assert.equal(families[0].rows[0].name, 'yf-git-tree');
});

test('default sort is total descending then name', () => {
  const rows = [row('a', { total: 10 }), row('b', { total: 100 }), row('c', { total: 50 })];
  classifyRows(rows);
  const families = sortFamilies(buildFamilies(rows), 'downloads');
  assert.deepEqual(families.map((f) => f.name), ['b', 'c', 'a']);
});

test('sort by name', () => {
  const rows = [row('b'), row('a'), row('c')];
  classifyRows(rows);
  const families = sortFamilies(buildFamilies(rows), 'name');
  assert.deepEqual(families.map((f) => f.name), ['a', 'b', 'c']);
});

test('sort by recent', () => {
  const rows = [
    row('old', { published: '2020-01-01T00:00:00Z' }),
    row('new', { published: '2024-01-01T00:00:00Z' }),
  ];
  classifyRows(rows);
  const families = sortFamilies(buildFamilies(rows), 'recent');
  assert.deepEqual(families.map((f) => f.name), ['new', 'old']);
});

test('takeConsoleRows keeps the alias with its scoped package (one extra row)', () => {
  const rows = [
    row('@yourfam/yf-tree', { total: 860 }),
    row('yf-git-tree', { total: 40, description: 'Unscoped alias of @yourfam/yf-tree' }),
    row('left-pad', { total: 900 }),
  ];
  classifyRows(rows);
  const families = sortFamilies(buildFamilies(rows), 'downloads');
  const taken = takeConsoleRows(families, 2);
  assert.deepEqual(
    taken.map((r) => r.name),
    ['left-pad', '@yourfam/yf-tree', 'yf-git-tree'],
  );
});
