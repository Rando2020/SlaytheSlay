# Naming and wiring guide

How to name things so new art and content drop straight into the game. If you only read one section, read **The rule**.

For the full list of every current ID and the exact file each one expects, see [ID-REGISTRY.md](ID-REGISTRY.md) (generated).

## The rule

Every game object has **one ID**. The ID is its key in a table in `index.html`, and every file that belongs to it uses that same ID.

- IDs are lowercase letters, digits and underscores: `sporeling`, `cathedralknight`, `exploit_opening`. No spaces, capitals or hyphens.
- The ID never changes once the object ships, even if its display name does. Saves store IDs.
- File and folder names are built from IDs, never from display names. The Ember Heart relic has ID `heart`, so its icon is `heart.png`, not `ember-heart.png`.
- Do not add lookup tables that translate one name into another. If art and code disagree, rename the file.

`tests/naming.test.cjs` checks all of this and tells you what to rename when something is off.

## IDs at a glance

| Thing | Defined in `index.html` | Example ID | Its art |
| --- | --- | --- | --- |
| Hero | `HEROES` | `aether` (The Aetherwright), `oath` (The Oathbound) | `assets/heroes/<id>/<pose>.webp` |
| Enemy | `EN`, placed in `EASY`, `HARD`, `ELITE` or the boss fight | `hexmother` | `assets/enemies/<id>/` |
| Card | `K` (hero cards), `COLORLESS` (shared cards) | `bash`, `judgment`, `exploit_opening` | `assets/ui/cards/art/<heroId or shared>/<id>.png` |
| Relic | `RELICS` | `heart` | `assets/ui/relics/<id>.png` |
| God (Oathbound oath) | `GODS` | `aurel` | `assets/ui/hud/oath-<id>.png`, `assets/ui/sanctums/<id>.png` |
| Status | `STN` | `vuln` | `assets/ui/hud/status-<id>.png` |

Hero IDs are short (`aether`, `oath`) for historical reasons. Use them exactly; the display names live in `HEROES`.

## Where files go

```
assets/                     everything the game loads (lowercase names, WebP for world art, PNG for UI)
  manifest.js               generated list of asset files; never edit by hand
  backgrounds/              <biome>_<layer>.webp, plus <biome>_<layer>_4k.webp at 3840 px wide
  heroes/<heroId>/          idle, attack, cast, power, hurt (.webp), facing RIGHT
  enemies/<enemyId>/        idle/attack/hurt.webp and/or rig parts, facing LEFT
  props/                    midground and foreground props, named by contact-sheet number (a03, b21)
  fx/                       ambient and combat effects on black, drawn with screen blending
  scenes/                   full-screen scene art (rest-site.webp)
  rigs/                     enemy rig registry, player and Animation Lab scripts
  maps/act01/               Act I map art and its generated registry.js (source/ holds the originals)
  ui/cards/art/<heroId|shared>/<cardId>.png    card illustrations
  ui/cards/faces/<type>.png                    card frames by type: attack, skill, power, curse
  ui/cards/borders/<state>.png                 overlays: upgraded, uncommon, rare, hover, selected
  ui/cards/backs/<heroId|universal>.png        deck button card backs
  ui/relics/<relicId>.png
  ui/hud/                   status-<statusId>, oath-<godId>, intent-*, pile-*, other HUD pieces
  ui/sanctums/<godId>.png
art/                        originals, never loaded by the game
  source/heroes/<heroId>/   concept/ and poses/ for each hero
  source/enemies/           <enemyId>-<what>.png, e.g. hexmother-attack.png, rustjaw-parts-sheet.png
  source/backgrounds/, props/, fx/
  cutouts/                  every piece cut from a sheet, with numbered contact sheets
src/                        game scripts split out of index.html (map, online co-op)
tools/                      cut-out, import, rig and generator scripts
tests/                      node tests (node --test tests/*.cjs) and browser test pages
docs/                       design docs, QA captures (docs/qa/), this guide, the ID registry
```

Nothing goes loose in `assets/` except `manifest.js`. New top-level folders need adding to this guide and to the naming test.

## Adding things

After any art change run the two generators, then the tests:

```sh
node tools/build-asset-manifest.mjs   # lets the game see new files
node tools/build-id-registry.mjs      # refreshes docs/ID-REGISTRY.md
node --test tests/*.cjs
```

### Card illustration

1. Look up the card's ID in [ID-REGISTRY.md](ID-REGISTRY.md).
2. Save it as `assets/ui/cards/art/<heroId>/<cardId>.png`. Colorless, status and curse cards use `shared` in place of the hero ID.
3. Run the generators. The card shows the art on its next render; no code change.

If both heroes use a card (like `strike`), each hero can have its own version in their folder.

### Relic icon

Save it as `assets/ui/relics/<relicId>.png` and run the generators. A relic without an icon shows its first letter.

### Status or oath icon

`assets/ui/hud/status-<statusId>.png` or `assets/ui/hud/oath-<godId>.png`. Statuses without an icon show as text chips.

### Enemy

1. Pick the ID: the enemy's name, lowercase, no spaces (`Fallen Cathedral Knight` became `cathedralknight`).
2. Save originals as `art/source/enemies/<id>-<what>.png` (`-idle`, `-attack`, `-hurt`, `-parts-sheet`, `-reference`).
3. Put runtime art in `assets/enemies/<id>/`, mirrored to face **left**:
   - **Painted poses:** `idle.webp`, `attack.webp`, `hurt.webp`.
   - **Rig:** part images plus an entry in `assets/rigs/registry.js` keyed by the same ID (see [tools/rigs/README.md](../tools/rigs/README.md)).
4. Add an entry to `EN` in `index.html` keyed by the ID: `n` (display name), `hp`, `ai`, and then
   - painted: `img:'<id>/idle'`, `ar` (width / height), `w` (display width), `paintedIdle:true`, `actionPoses:true`;
   - rig: `rig:'<id>'`, `w`, and `actionPoses:true` if it has attack and hurt poses.
5. Add the ID to an encounter list (`EASY`, `HARD`, `ELITE`) or the boss fight, then run the generators and tests.

### Hero

1. Pick a short lowercase ID and add the hero to `HEROES`.
2. Save the five poses as `assets/heroes/<id>/{idle,attack,cast,power,hurt}.webp`, facing **right**, about 760 px tall.
3. Optional: `assets/ui/cards/backs/<id>.png` for the deck button and `PMETA.<id>` for per-pose scale and anchor.
4. Originals go in `art/source/heroes/<id>/concept/` and `art/source/heroes/<id>/poses/`.

### Background

`assets/backgrounds/<biome>_<layer>.webp` and a 3840 px `<biome>_<layer>_4k.webp` (see `tools/upscale.py`). The combat stage uses the `_overhead` layer for each biome (`ruins`, `tree`, `gate`).

## Other names you will see

- **Art sheet names for enemies.** Some generated sheets used working names: Hollow is `veilmask`, Scrapper is `scrapclaw`, Bulwark is `stonewarden`. Always use the ID.
- **Old short enemy keys** (`spore`, `tick`, `hex`, `jugg`, `king`...) were retired in November 2026. `LEGACY_ENEMY_IDS` in `index.html` translates them when an old save or Combat Lab link loads. Never use them for new work.
- **Props** keep their contact-sheet numbers (`a03`, `b21`) from `art/cutouts/props/`, and effects keep their sheet names (`slash`, `motes_gold`). The contact sheets are the lookup.

## Branches and pull requests

- Branch names: `<type>/<short-name>` with type `feat`, `fix`, `art`, `balance`, `docs` or `chore`, for example `art/hexmother-poses`.
- One feature per branch. Merge `main` in before opening the PR, run the generators and tests, and delete the branch after it merges.
