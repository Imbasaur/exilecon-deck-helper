const { test } = require('node:test');
const assert = require('node:assert/strict');
const { symbols, matches, findLoadout } = require('../calculator.js');
const counts = values => Object.fromEntries(symbols.map(symbol => [symbol, values[symbol] || 0]));
const card = (name, type, values, options = {}) => ({ name, type, hands: options.hands || 1, durability: options.durability ?? 2, symbols: counts(values) });

test('specific symbols and additional numbers must both be covered', () => {
  assert.equal(matches(counts({ cold: 1, life: 2 }), { cold: 1, extra: 2 }), true);
  assert.equal(matches(counts({ life: 2, block: 1 }), { cold: 1, extra: 2 }), false);
  assert.equal(matches(counts({ physical: 2, fire: 1 }), { physical: 1, fire: 1, extra: 2 }), false);
});
test('wild symbols match one specific symbol or one extra, never both', () => {
  assert.equal(matches(counts({ wild: 1, life: 1 }), { cold: 1, extra: 1 }), true);
  assert.equal(matches(counts({ wild: 1 }), { cold: 1, extra: 1 }), false);
  assert.equal(matches(counts({ cold: 1, fire: 1 }), { cold: 1, wild: 1 }), true);
});
test('jewellery can be assigned to different sides', () => {
  const deck = [
    card('Sword', 'weapon', { physical: 2 }),
    card('Armour', 'armour', { life: 2 }),
    card('Fire ring', 'ring', { fire: 1 }),
    card('Cold ring', 'ring', { cold: 1 })
  ];
  const result = findLoadout(deck, { attack: { cold: 1, extra: 2 }, defence: { physical: 1, fire: 1, extra: 1 } });
  assert.ok(result);
  assert.deepEqual(result.attackCards.map(c => c.name), ['Sword', 'Fire ring']);
  assert.deepEqual(result.defenceCards.map(c => c.name), ['Armour', 'Cold ring']);
});
test('a single jewellery card cannot split its symbols between sides', () => {
  const deck = [card('Ring', 'ring', { fire: 1, cold: 1 })];
  assert.equal(findLoadout(deck, { attack: { cold: 1 }, defence: { fire: 1 } }), null);
});
test('two-handed weapons exclude shields; broken cards are unavailable', () => {
  const deck = [card('Sword', 'weapon', { physical: 2 }, { hands: 2 }), card('Shield', 'shield', { block: 1 }), card('Broken', 'armour', { life: 1 }, { durability: 0 })];
  assert.equal(findLoadout(deck, { attack: { block: 1 }, defence: { physical: 1 } }), null);
  assert.equal(findLoadout(deck, { attack: { life: 1 }, defence: {} }), null);
});
test('only two rings can be used and empty slots are allowed', () => {
  const deck = [card('1', 'ring', { fire: 1 }), card('2', 'ring', { fire: 1 }), card('3', 'ring', { fire: 1 })];
  assert.equal(findLoadout(deck, { attack: {}, defence: { fire: 3 } }), null);
  assert.ok(findLoadout(deck, { attack: {}, defence: { fire: 2 } }));
  assert.ok(findLoadout([], { attack: {}, defence: {} }));
});
test('modifier symbols count in addition to base symbols', () => {
  const deck = [card('Hatchet', 'weapon', { fire: 3 })];
  assert.ok(findLoadout(deck, { attack: {}, defence: { fire: 1, extra: 2 } }));
  assert.equal(findLoadout(deck, { attack: {}, defence: { fire: 1, extra: 3 } }), null);
});
