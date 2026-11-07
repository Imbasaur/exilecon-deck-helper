const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parse } = require('../card-import.js');

const sword = { name: 'Rusted Hatchet', type: 'weapon', rarity: 'magic', hands: 1, durability: 2, symbols: { fire: 3 } };
const shield = { name: 'Shield', type: 'shield', durability: 1, symbols: { block: 1 } };
test('parses one card, arrays, wrapped arrays and fenced JSON', () => {
  assert.equal(parse(JSON.stringify(sword))[0].symbols.fire, 3);
  assert.equal(parse(JSON.stringify(sword))[0].rarity, 'magic');
  assert.equal(parse(JSON.stringify(shield))[0].rarity, 'unknown');
  assert.equal(parse(JSON.stringify([sword, shield])).length, 2);
  assert.equal(parse(JSON.stringify({ cards: [shield] }))[0].hands, 1);
  assert.equal(parse('```json\n' + JSON.stringify(sword) + '\n```')[0].symbols.cold, 0);
});
test('rejects uncertain or invalid fields rather than guessing', () => {
  for (const invalid of [
    { ...sword, durability: null }, { ...sword, hands: null }, { ...sword, symbols: { fire: null } },
    { ...sword, symbols: { sword: 1 } }, { ...sword, symbols: null }, { ...sword, type: 'unknown' },
    { ...sword, symbols: { fire: 100 } }, { ...sword, rarity: 'legendary' }, { ...sword, extra: 1 }
  ]) assert.throws(() => parse(JSON.stringify(invalid)));
});
test('rejects malformed, empty and oversized input', () => {
  for (const input of ['text', '[]', '{}', JSON.stringify(Array(201).fill(sword))]) assert.throws(() => parse(input));
});
