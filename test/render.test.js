import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTable, renderMarkdown } from '../src/render.js';
import { createColors } from '../src/colors.js';

const colors = createColors(false);

function row(name, overrides = {}) {
  return {
    name,
    version: '0.1.1',
    published: '2026-11-10T15:31:08.147Z',
    publisher: 'kamal-yourfam',
    developer: 'YourFam',
    total: 860,
    description: '',
    maintainers: [],
    keywords: [],
    week: 40,
    month: null,
    isScoped: name.startsWith('@'),
    isAlias: false,
    isLoneAlias: false,
    ...overrides,
  };
}

test('renderTable prints header and a package row', () => {
  const out = renderTable([row('@yourfam/yf-tree')], colors);
  assert.match(out, /Name\s+Version\s+Published\s+Publisher\s+Developer\s+Week\s+Total/);
  assert.match(out, /@yourfam\/yf-tree/);
  assert.match(out, /0\.1\.1/);
  assert.match(out, /10-Nov-2026/);
  assert.match(out, /40/);
  assert.match(out, /860/);
});

test('renderTable pads a lone alias name with the alias word', () => {
  const out = renderTable(
    [row('yf-git-tree', { isAlias: true, isLoneAlias: true, total: 40 })],
    colors,
  );
  assert.match(out, /yf-git-tree alias/);
});

test('renderMarkdown with extra columns', () => {
  const rows = [{ ...row('@yourfam/yf-tree'), month: 210 }];
  const out = renderMarkdown(rows, ['month']);
  assert.match(
    out,
    /\| Name \| Version \| Published \| Publisher \| Developer \| Week \| Total \| Month \|/,
  );
  assert.match(
    out,
    /\| @yourfam\/yf-tree \| 0\.1\.1 \| 10-Nov-2026 \| kamal-yourfam \| YourFam \| 40 \| 860 \| 210 \|/,
  );
});

test('renderMarkdown sanitizes pipes in cells', () => {
  const rows = [row('pkg', { description: 'a|b' })];
  const out = renderMarkdown(rows, ['description']);
  assert.match(out, /a\\\|b/);
});
