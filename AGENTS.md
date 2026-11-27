# Working on SlaytheSlay

Instructions for AI agents and new contributors. Read this before changing anything.

SlaytheSlay (in-game title **Hollow Ascent**) is a Slay the Spire-style roguelike deckbuilder that runs as a static web page. Heroes: **The Aetherwright** (ID `aether`) and **The Oathbound** (ID `oath`). Art is painted (Final Fantasy meets Arcane) and animated with 2D rigs, not 3D.

## Run and test

```sh
python3 -m http.server            # then open http://localhost:8000 (file:// breaks WebGL textures)
node --test tests/*.cjs           # must pass before every commit
node tools/coop-server.cjs        # online co-op room server on port 8787
```

Browser checks: `index.html?dev=combat` (Combat Lab), `tests/combat-interactions.html`, `?gallery=1` (reference gallery), `enemy-lab.html` (Enemy Animation Lab).

## Names: the rule that matters most

**Every game object has one ID, and every file for it uses that ID.** Full guide: [docs/NAMING.md](docs/NAMING.md). Every current ID and the file it expects: [docs/ID-REGISTRY.md](docs/ID-REGISTRY.md).

- IDs are the keys in `HEROES`, `EN`, `K`, `COLORLESS`, `RELICS`, `GODS` and `STN` in `index.html`: lowercase letters, digits, underscores.
- Never name files after display names, and never add a table that maps one name to another. Rename the file instead.
- Never rename a shipped ID: saves store them. If an ID truly must change, add the old key to a legacy map (see `LEGACY_ENEMY_IDS`) so old saves still load.
- Heroes face right, enemies face left.

When you add, rename or remove anything under `assets/`, or change a game table:

```sh
node tools/build-asset-manifest.mjs   # regenerates assets/manifest.js
node tools/build-id-registry.mjs      # regenerates docs/ID-REGISTRY.md
```

`tests/naming.test.cjs` fails with a fix-it message if names, folders or generated files drift.

## Layout

- `index.html`: the game (markup, styles, engine, data tables). Large; search for the table you need (`const EN=`, `const K=`, `const RELICS=`).
- `src/`: scripts split out of the page (`act-map.js`, `coop-online.js`). New standalone modules go here.
- `assets/`: runtime art, by category. `art/`: originals, never loaded.
- `tools/`: cut-out, import, rig, lab and generator scripts. `tools/game-data.cjs` reads the game tables for tools and tests.
- `tests/`: node tests and browser test pages. `docs/`: design docs, QA captures (`docs/qa/`), naming guide, dev log.

Generated files, never edited by hand: `assets/manifest.js`, `docs/ID-REGISTRY.md`, `assets/maps/act01/registry.js` (from `tools/import_act01.py`).

## Workflow

- Branch as `<type>/<short-name>`: `feat`, `fix`, `art`, `balance`, `docs`, `chore`.
- Keep a branch to one feature. Many branches touch `index.html` at once, so merge `main` in before opening a PR and resolve conflicts by keeping both sides' intent.
- Run the generators and `node --test tests/*.cjs` before pushing. Add a test for new rules or mechanics.
- Delete the branch after it merges.
- Any script `index.html` loads with `<script src>` must also be listed in `pages` in `tools/coop-server.cjs`, or online co-op cannot load it (the naming test checks this).
- No em dashes in text written for this project.
