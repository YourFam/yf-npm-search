import test from 'node:test';
import assert from 'node:assert/strict';
import { createColors } from '../src/colors.js';

test('plain text when color is disabled', () => {
  const colors = createColors(false);
  assert.equal(colors.bold('x'), 'x');
  assert.equal(colors.dim('x'), 'x');
  assert.equal(colors.green('x'), 'x');
});

test('ANSI codes when color is enabled', () => {
  const colors = createColors(true);
  assert.equal(colors.bold('x'), '\x1b[1mx\x1b[0m');
  assert.equal(colors.dim('x'), '\x1b[2mx\x1b[0m');
  assert.equal(colors.green('x'), '\x1b[32mx\x1b[0m');
});
