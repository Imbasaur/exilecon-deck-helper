const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validList } = require('../monsters.js');
const stats = { life: 0, block: 0, physical: 0, lightning: 2, cold: 0, fire: 1, chaos: 0, wild: 0, extra: 4 };
const monster = { id: 'one', name: 'Boss', attack: stats, defence: stats };
test('validates saved monsters and rejects invalid or duplicate records', () => {
  assert.equal(validList([monster]), true);
  assert.equal(validList([]), true);
  assert.equal(validList([monster, monster]), false);
  assert.equal(validList([{ ...monster, name: '  ' }]), false);
  assert.equal(validList([{ ...monster, attack: { ...stats, extra: -1 } }]), false);
  assert.equal(validList([{ ...monster, defence: { ...stats, fire: null } }]), false);
  assert.equal(validList([{ ...monster, attack: { extra: 1 } }]), false);
});
