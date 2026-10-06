import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateShippingExpense, resolveShippingExpense } from './operations-utils.ts';

test('shipping stays at half the reference cost up to half the reference quantity', () => {
  assert.equal(calculateShippingExpense(1000, 300, 0), 0);
  assert.equal(calculateShippingExpense(1000, 300, 1), 500);
  assert.equal(calculateShippingExpense(1000, 300, 68), 500);
  assert.equal(calculateShippingExpense(1000, 300, 150), 500);
});

test('shipping returns to proportional calculation above half quantity and rounds to an integer', () => {
  assert.equal(calculateShippingExpense(1000, 300, 151), 503);
  assert.equal(calculateShippingExpense(1000, 300, 200), 667);
  assert.equal(calculateShippingExpense(1000, 300, 300), 1000);
  assert.equal(calculateShippingExpense(1000, 300, 500), 1667);
  assert.equal(calculateShippingExpense(1001, 300, 150), 501);
});

test('manual shipping overrides automatic shipping only when enabled and included', () => {
  assert.equal(resolveShippingExpense(1667, false, 2000, true), 1667);
  assert.equal(resolveShippingExpense(1667, true, 2000, true), 2000);
  assert.equal(resolveShippingExpense(1667, true, 2000, false), 0);
  assert.equal(resolveShippingExpense(1667, true, Number.NaN, true), 0);
});