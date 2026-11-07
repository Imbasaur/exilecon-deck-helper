(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Monsters = api;
})(globalThis, function () {
  'use strict';
  const symbols = ['life', 'block', 'physical', 'lightning', 'cold', 'fire', 'chaos', 'wild'];
  const count = value => Number.isInteger(value) && value >= 0 && value <= 99;
  function validStats(stats) {
    return stats && typeof stats === 'object' && symbols.every(symbol => count(stats[symbol])) && count(stats.extra);
  }
  function validList(monsters) {
    return Array.isArray(monsters) && monsters.every(monster =>
      monster && typeof monster.id === 'string' && monster.id.length > 0 &&
      typeof monster.name === 'string' && monster.name.trim().length > 0 && monster.name.length <= 100 &&
      validStats(monster.attack) && validStats(monster.defence)
    ) && new Set(monsters.map(monster => monster.id)).size === monsters.length;
  }
  return { validStats, validList };
});
