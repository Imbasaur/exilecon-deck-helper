# ExileCon Deck Helper

A small, unofficial helper for ExileCon 2026: Runes of Aldur. Add your item
cards, enter a monster's attack and defence, and find a usable loadout.

## Install on Android

The repository owner must first enable GitHub Pages in **Settings → Pages**,
using **Deploy from a branch**, branch **main**, folder **/(root)**. Once the
site has been published, its address is
`https://imbasaur.github.io/exilecon-deck-helper/`.

1. Connect to the internet and open the published app in Chrome.
2. Wait for the app to say it is ready offline. Open Chrome's menu and choose
   **Install app** or **Add to Home screen**.
3. Open it from your home screen. After the first successful load it works
   without an internet connection. Go online and reopen the app to get updates.

Your cards and any photos stay in this browser on this device. They are not
synced. Clearing browser data, uninstalling, changing browser or losing your
phone may remove them: use **Export backup** to save a copy elsewhere.
Photos use device storage; if saving fails, try a smaller photo or omit it.

## Using the app

Add cards manually, including all base and modifier symbols. A photo is
optional and is stored locally; **the app does not automatically read it**.
You can also take a photo of a monster as a reference while entering its
stats manually. Monster photos are temporary and are not included in backups.
Track remaining durability yourself after a fight. Broken cards are excluded
from calculations. Enter the monster's printed symbols and its additional
number on each side, then calculate. Wild symbols can match any one symbol.
Block and Physical match one another as well as their own type, per the
player's clarification. Confirm this rule with event staff if unsure.

The calculator searches available loadouts, including both possible jewellery
assignments. Specific symbols must be matched before the additional number.
It uses the [fan-written 2026 rules reference](https://github.com/qcksys/exilecon-card-game)
and the quick-reference symbols supplied by the user. Rules may be clarified
at the event; follow staff instructions if they differ. It does not account
for special effects, crafting rules, maps, or monster-specific damage.

## Developing

This is a dependency-free static app. Run `node --test tests/*.test.js` for the
calculator tests. Serve this directory over localhost or HTTPS to test service
worker installation; service workers do not work from a `file://` URL. Change
the cache version in `sw.js` whenever publishing changes to cached files, so
installed users receive the update.
