(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CardImport = api;
})(globalThis, function () {
  'use strict';
  const types = ['weapon', 'shield', 'armour', 'amulet', 'ring'];
  const rarities = ['unknown', 'normal', 'magic', 'rare', 'unique'];
  const symbols = ['life', 'block', 'physical', 'lightning', 'cold', 'fire', 'chaos', 'wild'];

  function parse(text) {
    let input = text.trim();
    const fenced = input.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/i);
    if (fenced) input = fenced[1];
    let parsed;
    try { parsed = JSON.parse(input); }
    catch { throw new Error('Paste a valid JSON card object or array, without extra text.'); }
    const list = Array.isArray(parsed) ? parsed :
      parsed && Array.isArray(parsed.cards) ? parsed.cards : [parsed];
    if (list.length === 0) throw new Error('The card list is empty.');
    if (list.length > 200) throw new Error('Import at most 200 cards at a time.');
    return list.map((item, index) => {
      const error = message => { throw new Error(`Card ${index + 1}: ${message}`); };
      if (!item || typeof item !== 'object' || Array.isArray(item)) error('expected a card object.');
      if (Object.keys(item).some(key => !['name', 'type', 'rarity', 'hands', 'durability', 'symbols'].includes(key))) error('unknown field; use only name, type, rarity, hands, durability and symbols.');
      if (typeof item.name !== 'string' || !item.name.trim() || item.name.trim().length > 100) error('name must be 1–100 characters.');
      if (!types.includes(item.type)) error('type must be weapon, shield, armour, amulet or ring.');
      if (item.rarity !== undefined && !rarities.includes(item.rarity)) error('rarity must be unknown, normal, magic, rare or unique.');
      if (item.type === 'weapon' && ![1, 2].includes(item.hands)) error('weapon hands must be 1 or 2.');
      if (item.type !== 'weapon' && item.hands !== undefined && ![1, 2].includes(item.hands)) error('hands must be 1 or 2 if provided.');
      if (!Number.isInteger(item.durability) || item.durability < 0 || item.durability > 99) error('durability must be a whole number from 0 to 99; check clipped marks.');
      if (!item.symbols || typeof item.symbols !== 'object' || Array.isArray(item.symbols)) error('symbols must be an object; use {} if the card has none.');
      for (const [symbol, count] of Object.entries(item.symbols)) {
        if (!symbols.includes(symbol)) error(`unknown symbol "${symbol}".`);
        if (!Number.isInteger(count) || count < 0 || count > 99) error(`${symbol} must be a whole number from 0 to 99.`);
      }
      return {
        name: item.name.trim(), type: item.type, rarity: item.rarity ?? 'unknown', hands: item.type === 'weapon' ? item.hands : 1,
        durability: item.durability,
        symbols: Object.fromEntries(symbols.map(symbol => [symbol, item.symbols[symbol] ?? 0]))
      };
    });
  }
  return { parse };
});
