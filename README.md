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
- Run saves to the browser's local storage when you're on the map

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole game: markup, styles and script |
| `assets/` | Cut-out hero poses used in game (WebP with transparency) |
| `art/source/concept/` | Character concept, model and expression sheets |
| `art/source/hero/` | Original generated hero poses and the parts sheet |
| `assets/props/` | Props placed in each biome's midground and foreground |
| `art/cutouts/props/` | All 50 props cut from the prop sheets, plus a numbered contact sheet |
| `assets/enemies/` | Painted enemies, all facing left toward the hero. Each is a cut-out rig: one folder of part images per enemy |
| `art/source/enemies/` | Original enemy art and model sheets |
| `assets/fx/` | Ambient and combat effects (black background, drawn with screen blending) |
| `art/cutouts/fx/` | Every effect cut from the two FX sheets, with contact sheets |
| `assets/oath/` | Oathbound poses: idle, attack, hurt, cast (oath invocation), power (oath sworn) |
| `art/source/oathbound/` | Oathbound concept sheets, generated poses and parts sheets |
| `assets/bg_*_4k.webp` | 3840 px backgrounds (AI upscale blended 75/25 with a plain resize to keep brush texture), loaded only on large screens |
| `docs/DEVLOG.md` | How the game was built, the decisions behind it and the art pipeline |
| `tools/` | Python scripts used to cut the hero poses out of their backgrounds (`cut_oathbound.py` for the knight) |

## Art pipeline

1. Generate a full-body pose facing right on a plain background, using the concept sheets as reference.
2. Cut it out with the scripts in `tools/` (flat-color keying, or an AI matte via `rembg` for busy backgrounds).
3. Save it to `assets/` as WebP, about 760 px tall, and add it to `PIMG` in `index.html`.

Enemies stand on the right, so they must face **left**. Generated art usually faces right; mirror it when cutting it out so the file on disk already faces left, then add `img`, `w` (display width in px) and `ar` (width / height) to its entry in `EN`.

Enemies with a parts sheet are cut-out rigs: each part is its own WebP, and `RIGS` in `index.html` lists every part's position, width, idle animation (sway, nod, claw, leg, chew, glow, pulse, hover, flick, drift) and pivot. Give the enemy `rig:'<folder>'` instead of `img`. The claws strike on attacks, and the canister, crystal or flames flare on Overclock, Charge and Phase.

Next up: painted art for the Hex Mother and the Hollow King, then layered backgrounds and card illustrations.
