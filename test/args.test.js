import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/args.js';

test('no args → no error, empty positional', () => {
  const r = parseArgs([]);
  assert.equal(r.error, null);
  assert.deepEqual(r.positional, []);
});

test('positional args kept in order', () => {
  const r = parseArgs(['merge', 'conflict', 'branches']);
  assert.deepEqual(r.positional, ['merge', 'conflict', 'branches']);
});

test('flags are not positional', () => {
  const r = parseArgs(['@yourfam', '--month']);
  assert.deepEqual(r.positional, ['@yourfam']);
  assert.equal(r.opts.month, true);
});

test('unknown option error', () => {
  assert.equal(parseArgs(['--bogus']).error, 'Unknown option: --bogus.');
});

test('sort requires a value', () => {
  assert.equal(parseArgs(['x', '--sort']).error, '--sort requires a value.');
});

test('unknown sort', () => {
  assert.equal(parseArgs(['x', '--sort', 'stars']).error, 'Unknown sort: stars.');
});

test('valid sort values', () => {
  assert.equal(parseArgs(['x', '--sort', 'recent']).sort, 'recent');
  assert.equal(parseArgs(['x', '--sort', 'name']).sort, 'name');
  assert.equal(parseArgs(['x']).sort, 'downloads');
});

test('limit requires a positive integer', () => {
  assert.equal(parseArgs(['x', '--limit']).error, '--limit requires a positive integer.');
  assert.equal(parseArgs(['x', '--limit', '0']).error, '--limit requires a positive integer.');
  assert.equal(parseArgs(['x', '--limit', '-1']).error, '--limit requires a positive integer.');
  assert.equal(parseArgs(['x', '--limit', 'abc']).error, '--limit requires a positive integer.');
});

test('valid limit', () => {
  assert.equal(parseArgs(['x', '--limit', '10']).limit, 10);
});

test('--md with a path', () => {
  const r = parseArgs(['x', '--md', 'out.md']);
  assert.equal(r.mdFlag, true);
  assert.equal(r.mdPath, 'out.md');
});

test('--md without a path', () => {
  const r = parseArgs(['x', '--md']);
  assert.equal(r.mdFlag, true);
  assert.equal(r.mdPath, '');
});

test('help and version flags', () => {
  assert.equal(parseArgs(['--help']).opts.help, true);
  assert.equal(parseArgs(['-h']).opts.help, true);
  assert.equal(parseArgs(['--version']).opts.version, true);
});
