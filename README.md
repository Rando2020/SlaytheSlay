# SlaytheSlay

A roguelike deckbuilder in the style of Slay the Spire, built as a single web page. Working title in game: **Hollow Ascent**.

Climb 13 floors, build your deck one card at a time, and topple the Hollow King. Pick one of two heroes at the start, each with painted art on a 2D mesh rig:

- **The Aetherwright**, an aether-punk gunslinger (Strength, poison, raw firepower).
- **The Oathbound**, a wandering knight (80 HP, Unbroken Vow relic) who can swear an Oath to one of four gods at a **Divine shrine**, or stay Unsworn. His card library follows the Master Card Library v0.4 design:
  - **Malleable cards** (Lay on Hands, Judgment, Penance, Reprisal, Prayer, Offering) start Mortal (T0). Play one while Sworn and it is Sanctified (T1) into that god's form, then lives in the god's Sanctum. Shrines, elites and the floor 7 treasure can Ascend it to T2 and Exalt it to T3. Every god has its own form for each tier: 72 evolved forms in all.
  - **Sanctum and Divine Draw**: while Sworn, each turn draws 4 ordinary cards and 1 card from your Sanctum. Divine cards return to their Sanctum after use. Recall, Offer (move a Sanctum card to Exhaust) and Restore manipulate the Sanctum. Abandoned gods' cards go Dormant and wake at their old tiers when you return.
  - **Gods**, each with a signature status, a Divine Law and a Divine Price:
    - **Aurel** (Radiance, Sanctuary, Anointed): Anointed blocks the next debuff. Excess healing becomes double Block. Price: sacrificing HP costs 1 Strength and 1 Dexterity for the turn.
    - **Varran** (Conquest, Crucible, Bloodlust): Bloodlust adds 3 to your next Attack. Card healing becomes double damage. Price: no healing from cards.
    - **Orun** (Protection, Reliquary, Resolve): Resolve cuts unblocked attack damage by 3. Blocked damage reflects 30% back (max 8 per enemy per turn). Price: Attack cards deal 20% less.
    - **Mora** (Twilight, Sepulcher, Soulbound): Offering a card with Soulbound hits ALL enemies for 4. The first two Exhausts each turn deal 3 to ALL enemies. Price: two Burden cards in every combat.
  - 4 divine-exclusive cards per god, 12 neutral cards, 4 Unsworn cards and 19 Oathbound relics (Twin Covenant lets you keep two gods at once).
  - Balance rules from the design doc are enforced by the engine: once-per-combat healing per card, once-per-combat Energy on evolved Offering cards, one Sanctum draw per card per turn, status caps of 3, and an 8-ordinary-card minimum before Sanctifying or changing gods.

## Play

Open `index.html` through any static web server (the hero rig loads its art from `assets/`, which browsers block over `file://`):

```
python3 -m http.server
```

then visit `http://localhost:8000`.

### Cooperative runs

Choose **Single Player** to begin a solo run, or **Multiplayer** on the title screen to share one device with two to four players. Each player chooses a class and manages their own hand, energy, HP, Block, relics and rewards. The party follows one route. Each living hero takes a turn before the enemies act once.

Every enemy attack targets every living hero. Each hit resolves against that hero's defenses. For example, a 6-damage attack against two heroes with 4 and 0 Block costs them 2 and 6 HP respectively. Player cards retain their individual targeting rules. Enemy starting and maximum HP use the rolled encounter HP multiplied by the starting party size, including bosses. A defeated hero stays down while surviving heroes continue.

For separate devices, start the included room server with Node.js:

```sh
node tools/coop-server.cjs
```

Open `http://localhost:8787` on the host and choose **Multiplayer**, then **Play online**. On the same network, guests open the host computer's LAN address on port 8787 and enter the room code. For internet play, all devices need access to the same reachable server. The host tab runs the battle and must stay open. Guests use a turn controller to inspect cards, choose targets and take actions. The host browser keeps a separate party checkpoint on the map.

## What's in it

- Branching 13-floor map: fights, elites, rest sites, shops, events, treasure and a boss
- Painted enemies with their own moves and passives: Sporeling (Spore Cloud poisons you, Burst Spores on death), Aether Tick (Charge, Lunge, Siphon heals), Scrapclaw (Overclock, Twin Claws, Scrap Grab), Rustjaw (Gnash, Maul, Hunker; Bloodscent gives +3 Strength below half HP), Veil Mask (Hex Gaze, Wail, Phase), and the elites Stone Warden (Bulwark keeps half its Block; Shield Slam adds its Block to the hit) and Juggernaut (Crushing Fist, Hammerfall, Vent; Overpressure vents for +2 Strength and 10 Block at half HP). Each move's name shows above its intent; hover the ◆ by an enemy's name to read its passive
- 25 Aetherwright cards and 138 Oathbound card forms, 26 relics, Strength, Dexterity, Vulnerable, Weak and Poison
- Side-view combat stage with a painted backdrop for each third of the climb: sunlit ruins (floors 1 to 4), the great aether tree (5 to 9) and the storm-sealed gate (10 to 13, also the title art)
- Diorama depth: the backdrop, a midground prop layer and a blurred foreground layer sit at different depths and slide past each other as the camera slowly sways
- Ambient effects per area (screen-blended): drifting fog and light rays, plus a particle system of twinkling motes, wandering fireflies and leaves that tumble in 3D (gold in the ruins, green at the tree, violet embers at the gate), glowing mushrooms at the tree, and violet rain, an energy pillar and lightning at the gate
- Combat bursts: slash on hits, ripple on Block, rune circle and pillar on powers, vortex on targeted skills, green puff on Poison, shard burst on kills
- Damage preview: aiming a card at an enemy recolors its numbers for Strength, Weak and Vulnerable (green up, red down), flashes the HP the target would lose and flags lethal hits; dragging a skill shows the Block you'd gain
- Scales up on large screens (QHD and 4K) and renders the hero at up to 3x pixel density; art is exported at full source resolution, and large or high-density screens load 4K backgrounds upscaled with Real-ESRGAN
- Fanned hand, drag-to-play, a targeting arrow for attacks, card flight, lunges, hit flashes, screen shake and death dissolves
- The Aetherwright rendered as painted art on a WebGL mesh: breathing, cape and braid sway, pose swaps for attack, cast, power and hurt
- 40 colorless cards (34 universal and six cooperative concepts) with upgrades, dedicated merchant slots and optional Forgotten Library rewards; see [rules, balance decisions and compatibility](docs/design/colorless-card-pool-v0.2.md)
- Run saves to the browser's local storage when you're on the map

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The game: markup, styles, engine and data tables (`HEROES`, `EN`, `K`, `RELICS`...) |
| `src/` | Scripts split out of the page: the Act map and online co-op |
| `assets/` | Everything the game loads, by category: `heroes/`, `enemies/`, `backgrounds/`, `props/`, `fx/`, `scenes/`, `maps/`, `rigs/`, `ui/` |
| `assets/manifest.js` | Generated list of asset files the game checks before showing optional art |
| `art/` | Originals, never loaded: `source/heroes/<heroId>/`, `source/enemies/`, backgrounds, props, effects, and `cutouts/` contact sheets |
| `tools/` | Cut-out, import, rig, lab and generator scripts |
| `tests/` | Node tests (`node --test tests/*.cjs`) and browser test pages |
| `docs/` | [Naming guide](docs/NAMING.md), [ID registry](docs/ID-REGISTRY.md), [dev log](docs/DEVLOG.md), design docs and QA captures |
| `AGENTS.md` | Rules for AI agents and contributors (`CLAUDE.md` points here) |

## Adding art

Every game object has one ID (its key in `index.html`), and its files use that ID. The [naming guide](docs/NAMING.md) has the folder for each kind of art and step-by-step checklists. [ID-REGISTRY.md](docs/ID-REGISTRY.md) lists every ID with the exact path its art should use and whether it exists yet.

1. Generate the art using the concept sheets as reference. Heroes face **right**; enemies face **left** (mirror them when cutting out).
2. Cut it out with the scripts in `tools/` (flat-color keying, or an AI matte via `rembg` for busy backgrounds). Keep the original in `art/source/`.
3. Save it at the path from the registry, for example `assets/ui/relics/heart.png` or `assets/enemies/hexmother/attack.webp`.
4. Run `node tools/build-asset-manifest.mjs && node tools/build-id-registry.mjs`, then `node --test tests/*.cjs`. Card, relic, status and oath art appears with no code change.

Open **Enemy Animation Lab** on the title screen to play, scrub and tune the painted rigs. The shared bone and attachment registry lives in `assets/rigs/registry.js`. See [Enemy rig tools](tools/rigs/README.md) for authoring and validation.

### Act I navigation and Map Lab

Choose a gold-ringed room to preview it, then select **Enter room**. Keyboard players can Tab to an available room and press Enter or Space to preview it. Confirming follows the existing encounter transition. The map save stores the graph and the route taken. Older saves use their stored graphs directly.

Open **Map Lab** on the title screen to generate a route for a hero and a 32-bit seed, inspect the art registry, or walk a full route without changing a saved run. Both screens call the renderer in `src/act-map.js`.

The five PNGs from the Act I package live in `assets/maps/act01/source/`. Rebuild the runtime WebPs and their registry with `python tools/import_act01.py` (Pillow required). The importer checks each source against the SHA-256 manifest from the PR #10 handoff. Run `node --test tests/*.cjs` for graph, registry, save compatibility and character-selection checks.

[Phone capture](docs/qa/act01/map-390.png) · [Desktop capture](docs/qa/act01/map-1440.png)
## Combat Lab

Open [Combat Lab](./index.html?dev=combat) on the same static server as the game.
Choose a hero, oath, encounter and floor, then launch. Expand **Combat Lab** in the
lower left to launch a fresh fight or download a JSON report with the current run,
turn, card piles, enemy intents and setup URL. Sharing the URL repeats the setup.
Deck shuffles, HP rolls and rewards still use normal game randomness. Lab sessions
skip player save reads, writes and deletion. **Exit to game** returns to the title.

### Automated interaction testing

Open [the browser interaction suite](./tests/combat-interactions.html) on the static
server to exercise a real two-enemy fight, card targeting, block, enemy turns,
modal dialogs and reward collection. Five Oathbound fights cover the Unsworn
starter and each god. They check Unbroken Vow, Judgment's tier and ownership,
Divine Draw, and the evolved card's return to its Sanctum. The page displays each assertion and sets
`#results[data-result]` to `pass` or `fail` when finished.

A browser agent in a launched Combat Lab encounter can use the following API.
Inspect returns a detached snapshot with the live hand, costs, targets, statuses
and available actions. Act accepts the observed revision and action index and
resolves at the next decision, including choices that interrupt card resolution.

```js
const state = window.hollowLab.inspect();
const index = state.actions.findIndex(action => action.type === 'endTurn');
const next = await window.hollowLab.act(state.revision, index);
console.log(next.turn, next.energy, next.enemies);
```

Read the returned actions after each decision. Concurrent commands, stale
revisions and invalid indices are rejected. The state report includes the most
recent 200 agent actions. The API is available only in Combat Lab.

Open **Reference gallery** on the title screen or in Combat Lab to browse registered
cards (including oath forms), relics, statuses, oaths and Sanctums. Search by rule
text, name or ID. The artwork filter separates loaded illustrations, shared icons,
text placeholders and failed image loads. The gallery also shows each mapped file.

Open [Map Lab](map-lab.html) to inspect the production Act I renderer. See [navigation and encounter saves](docs/map/README.md).
