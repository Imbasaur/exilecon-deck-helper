(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Calculator = api;
})(globalThis, function () {
  'use strict';
  const symbols = ['life', 'block', 'physical', 'lightning', 'cold', 'fire', 'chaos', 'wild'];

  function matches(available, required) {
    let missing = 0;
    let total = 0;
    let needed = 0;
    for (const symbol of symbols) {
      total += available[symbol] || 0;
      if (symbol !== 'wild' && symbol !== 'physical' && symbol !== 'block') {
        const requirement = required[symbol] || 0;
        needed += requirement;
        missing += Math.max(0, requirement - (available[symbol] || 0));
      }
    }
    const physicalAndBlock = (required.physical || 0) + (required.block || 0);
    needed += physicalAndBlock;
    missing += Math.max(0, physicalAndBlock - (available.physical || 0) - (available.block || 0));
    const extras = (required.wild || 0) + (required.extra || 0);
    return missing <= (available.wild || 0) && total >= needed + extras;
  }

  function add(cards) {
    const result = {};
    for (const card of cards) {
      if (!card) continue;
      for (const symbol of symbols) result[symbol] = (result[symbol] || 0) + (card.symbols[symbol] || 0);
    }
    return result;
  }

  function findLoadout(cards, monster) {
    const live = cards.filter(card => card.durability > 0);
    const options = type => [null, ...live.filter(card => card.type === type)];
    const rings = live.filter(card => card.type === 'ring');
    const ringSets = [[]];
    for (let i = 0; i < rings.length; i++) {
      ringSets.push([rings[i]]);
      for (let j = i + 1; j < rings.length; j++) ringSets.push([rings[i], rings[j]]);
    }
    for (const weapon of options('weapon')) {
      for (const shield of options('shield')) {
        if (weapon && weapon.hands === 2 && shield) continue;
        for (const armour of options('armour')) {
          for (const amulet of options('amulet')) {
            for (const selectedRings of ringSets) {
              const jewellery = [amulet, ...selectedRings].filter(Boolean);
              for (let mask = 0; mask < 2 ** jewellery.length; mask++) {
                const attackJewellery = jewellery.filter((_, i) => mask & (1 << i));
                const defenceJewellery = jewellery.filter((_, i) => !(mask & (1 << i)));
                const attackCards = [weapon, ...attackJewellery].filter(Boolean);
                const defenceCards = [shield, armour, ...defenceJewellery].filter(Boolean);
                const attack = add(attackCards);
                const defence = add(defenceCards);
                if (matches(attack, monster.defence) && matches(defence, monster.attack)) {
                  return { attackCards, defenceCards, attack, defence };
                }
              }
            }
          }
        }
      }
    }
    return null;
  }
  return { symbols, matches, findLoadout };
});
