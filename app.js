'use strict';
const STORAGE_KEY = 'exilecon-deck-helper-v1';
const labels = { life: 'Life', block: 'Block', physical: 'Physical', lightning: 'Lightning', cold: 'Cold', fire: 'Fire', chaos: 'Chaos', wild: 'Wild' };
const icons = { life: '♥️', block: '🛡️', physical: '⚔️', lightning: '⚡', cold: '❄️', fire: '🔥', chaos: '💀', wild: '🌀' };
const types = ['weapon', 'shield', 'armour', 'amulet', 'ring'];
const $ = id => document.getElementById(id);
let cards = [];
let editingId = null;
let storedPhoto = '';
let storageBlocked = false;
let monsterPhotoUrl = '';
let cardPhotoUrl = '';
let selectedCardPhoto = null;

function showError(message) {
  $('notice').textContent = message;
  $('notice').hidden = false;
  $('notice').scrollIntoView({ block: 'nearest' });
}
function clearError() { $('notice').hidden = true; }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function countFields(target, prefix) {
  $(target).innerHTML = Calculator.symbols.map(symbol =>
    `<label><span aria-hidden="true">${icons[symbol]}</span> ${labels[symbol]} <input id="${prefix}-${symbol}" type="number" min="0" max="99" value="0" required inputmode="numeric"></label>`
  ).join('');
}
countFields('card-symbols', 'card');
countFields('monster-attack', 'attack');
countFields('monster-defence', 'defence');

function readCounts(prefix) {
  return Object.fromEntries(Calculator.symbols.map(symbol => [symbol, Number($(`${prefix}-${symbol}`).value)]));
}
function validCard(card) {
  return card && typeof card === 'object' && typeof card.id === 'string' && card.id.length > 0 &&
    typeof card.name === 'string' && card.name.trim().length > 0 && card.name.length <= 100 &&
    types.includes(card.type) && [1, 2].includes(card.hands) &&
    Number.isInteger(card.durability) && card.durability >= 0 && card.durability <= 99 &&
    card.symbols && typeof card.symbols === 'object' &&
    Calculator.symbols.every(symbol => Number.isInteger(card.symbols[symbol]) && card.symbols[symbol] >= 0 && card.symbols[symbol] <= 99) &&
    typeof card.photo === 'string' && (card.photo === '' || /^data:image\/jpeg;base64,[a-z0-9+/=]+$/i.test(card.photo));
}
function validateDeck(value) {
  return Array.isArray(value) && value.every(validCard) && new Set(value.map(card => card.id)).size === value.length;
}
function persist(nextCards, replacingDamagedData = false) {
  if (storageBlocked && !replacingDamagedData) {
    showError('Saving is blocked because the existing deck could not be read. Import a valid backup to replace it.');
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCards));
    cards = nextCards;
    storageBlocked = false;
    $('fight-result').textContent = '';
    renderCards();
    return true;
  } catch (error) {
    showError(`Could not save your deck on this device: ${error.message}. Try removing a photo or freeing storage.`);
    return false;
  }
}
function describeSymbols(counts) {
  return Calculator.symbols.filter(symbol => counts[symbol]).map(symbol => `${icons[symbol]} ${labels[symbol]} ×${counts[symbol]}`).join(' · ') || 'No symbols';
}
function renderCards() {
  if (!cards.length) {
    $('card-list').innerHTML = '<p>Your deck is empty. Add your first card to get started.</p>';
    return;
  }
  $('card-list').innerHTML = cards.map(card => `<article class="card">
    <h3>${escapeHtml(card.name)}</h3>
    <p>${escapeHtml(labelsForType(card))} · ${card.durability} durability${card.durability === 0 ? ' · Broken' : ''}</p>
    <p>${escapeHtml(describeSymbols(card.symbols))}</p>
    ${card.photo ? `<img class="card-photo" src="${card.photo}" alt="Photo of ${escapeHtml(card.name)}">` : ''}
    <div class="actions"><button type="button" class="secondary" data-edit="${escapeHtml(card.id)}">Edit</button><button type="button" class="secondary" data-delete="${escapeHtml(card.id)}">Delete</button></div>
  </article>`).join('');
}
function labelsForType(card) {
  const type = card.type[0].toUpperCase() + card.type.slice(1);
  return card.type === 'weapon' ? `${type} · ${card.hands === 2 ? 'Two-handed' : 'One-handed'}` : type;
}
function setHandsVisibility() { $('hands-label').hidden = $('card-type').value !== 'weapon'; }
function editCard(card) {
  clearError();
  editingId = card ? card.id : null;
  storedPhoto = card ? card.photo : '';
  if (cardPhotoUrl) URL.revokeObjectURL(cardPhotoUrl);
  cardPhotoUrl = '';
  selectedCardPhoto = null;
  $('card-form').reset();
  $('form-title').textContent = card ? 'Edit card' : 'Add a card';
  $('card-name').value = card ? card.name : '';
  $('card-type').value = card ? card.type : 'weapon';
  $('card-hands').value = card ? String(card.hands) : '1';
  $('card-durability').value = card ? card.durability : 2;
  for (const symbol of Calculator.symbols) $(`card-${symbol}`).value = card ? card.symbols[symbol] : 0;
  $('photo-preview').hidden = !storedPhoto;
  if (storedPhoto) $('photo-preview').src = storedPhoto;
  $('remove-photo').checked = false;
  setHandsVisibility();
  $('card-form').hidden = false;
  $('card-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('card-name').focus({ preventScroll: true });
}
function makePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image processing is unavailable.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The image could not be opened.')); };
    image.src = url;
  });
}

$('add-card').addEventListener('click', () => editCard(null));
$('cancel-card').addEventListener('click', () => { $('card-form').hidden = true; clearError(); });
$('card-type').addEventListener('change', setHandsVisibility);
for (const id of ['card-camera', 'card-photo']) {
  $(id).addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please choose an image file for the card.');
      return;
    }
    if (cardPhotoUrl) URL.revokeObjectURL(cardPhotoUrl);
    selectedCardPhoto = file;
    cardPhotoUrl = URL.createObjectURL(file);
    $('photo-preview').src = cardPhotoUrl;
    $('photo-preview').hidden = false;
    $('remove-photo').checked = false;
    clearError();
  });
}
$('photo-preview').addEventListener('error', () => {
  $('photo-preview').hidden = true;
  showError('The card photo could not be opened. Please choose another image.');
});
$('card-list').addEventListener('click', event => {
  const edit = event.target.closest('[data-edit]');
  const remove = event.target.closest('[data-delete]');
  if (edit) editCard(cards.find(card => card.id === edit.dataset.edit));
  if (remove) {
    const card = cards.find(item => item.id === remove.dataset.delete);
    if (card && confirm(`Delete "${card.name}" from your deck?`)) {
      if (persist(cards.filter(item => item.id !== card.id)) && editingId === card.id) $('card-form').hidden = true;
    }
  }
});
$('card-form').addEventListener('submit', async event => {
  event.preventDefault();
  clearError();
  const name = $('card-name').value.trim();
  if (!name) { showError('Enter a card name.'); return; }
  const saveButton = $('card-form').querySelector('[type=submit]');
  saveButton.disabled = true;
  try {
    const photo = $('remove-photo').checked ? '' : (selectedCardPhoto ? await makePhoto(selectedCardPhoto) : storedPhoto);
    const card = {
      id: editingId || crypto.randomUUID(), name, type: $('card-type').value,
      hands: Number($('card-hands').value), durability: Number($('card-durability').value),
      symbols: readCounts('card'), photo
    };
    if (!validCard(card)) throw new Error('Check the card fields and try again.');
    const next = editingId ? cards.map(item => item.id === editingId ? card : item) : [...cards, card];
    if (persist(next)) $('card-form').hidden = true;
  } catch (error) { showError(`Could not save card: ${error.message}`); }
  finally { saveButton.disabled = false; }
});

document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
  for (const tab of document.querySelectorAll('.tab')) {
    const active = tab === button;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    $(tab.dataset.tab).hidden = !active;
  }
  clearError();
}));
$('fight-form').addEventListener('input', () => { $('fight-result').textContent = ''; });
$('monster-name').addEventListener('input', () => { $('fight-result').textContent = ''; });
$('monster-preview').addEventListener('error', () => {
  $('monster-preview').hidden = true;
  showError('The monster photo could not be opened. Please choose another image.');
});
function selectMonsterPhoto(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showError('Please choose an image file for the monster.');
    return;
  }
  if (monsterPhotoUrl) URL.revokeObjectURL(monsterPhotoUrl);
  monsterPhotoUrl = '';
  $('monster-preview').hidden = true;
  monsterPhotoUrl = URL.createObjectURL(file);
  $('monster-preview').src = monsterPhotoUrl;
  $('monster-preview').hidden = false;
  clearError();
}
$('monster-photo').addEventListener('change', selectMonsterPhoto);
$('monster-camera').addEventListener('change', selectMonsterPhoto);
$('fight-form').addEventListener('submit', event => {
  event.preventDefault();
  const attack = { ...readCounts('attack'), extra: Number($('attack-extra').value) };
  const defence = { ...readCounts('defence'), extra: Number($('defence-extra').value) };
  const result = Calculator.findLoadout(cards, { attack, defence });
  if (!result) {
    $('fight-result').innerHTML = '<h3 class="failure">No matching loadout found</h3><p>Check the monster symbols, your cards and their remaining durability.</p>';
    return;
  }
  const names = items => items.length ? items.map(item => escapeHtml(item.name)).join(', ') : 'None';
  const monsterName = $('monster-name').value.trim();
  $('fight-result').innerHTML = `<h3 class="success">A matching loadout was found${monsterName ? ` for ${escapeHtml(monsterName)}` : ''}</h3>
    <p><strong>Attack:</strong> ${names(result.attackCards)}<br>${escapeHtml(describeSymbols(result.attack))}</p>
    <p><strong>Defence:</strong> ${names(result.defenceCards)}<br>${escapeHtml(describeSymbols(result.defence))}</p>
    <p>Check special effects and staff instructions. Update durability after the fight.</p>`;
});
$('export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, cards }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'exilecon-deck-backup.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('import').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  clearError();
  try {
    const data = JSON.parse(await file.text());
    if (!data || data.version !== 1 || !validateDeck(data.cards)) throw new Error('This is not a valid Deck Helper backup.');
    if (confirm(`Replace your current deck with ${data.cards.length} cards from this backup?`)) {
      if (persist(data.cards, true)) $('card-form').hidden = true;
    }
  } catch (error) { showError(`Could not import backup: ${error.message}`); }
  finally { event.target.value = ''; }
});

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    const parsed = JSON.parse(saved);
    if (!validateDeck(parsed)) throw new Error('Saved deck is invalid; it has not been overwritten.');
    cards = parsed;
  }
} catch (error) { storageBlocked = true; showError(`Could not load your saved deck: ${error.message}`); }
renderCards();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => {
    $('offline-status').textContent = 'Ready offline on this device.';
  }).catch(error => {
    $('offline-status').textContent = `Offline setup failed: ${error.message}. Open the app online to retry.`;
  });
} else {
  $('offline-status').textContent = 'Offline installation is not supported in this browser. Try Chrome.';
}
