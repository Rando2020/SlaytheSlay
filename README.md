# SlaytheSlay

A roguelike deckbuilder in the style of Slay the Spire, built as a single web page. Working title in game: **Hollow Ascent**.

Climb 13 floors, build your deck one card at a time, and topple the Hollow King. Pick one of two heroes at the start, each with painted art on a 2D mesh rig:

- **The Aetherwright**, an aether-punk gunslinger (Strength, poison, raw firepower).
- **The Oathbound**, a wandering knight who swears Oaths to four gods. Each Oath is a stance that changes how he fights, and his blade glows in that god's color:
  - **Radiance** (Aurel, gold): at the end of your turn, deal 4 damage to ALL enemies.
  - **Conquest** (Varran, red): your attacks deal 50% more damage, you take 25% more.
  - **Protection** (Orun, blue): at the end of your turn, gain 6 Block.
  - **Twilight** (Mora, violet): your attacks apply 1 Weak, draw 1 extra card each turn.

  He starts with the Pilgrim Star relic (first Oath each combat gives 1 Energy) and has his own pool of 22 cards.

## Play

Open `index.html` through any static web server (the hero rig loads its art from `assets/`, which browsers block over `file://`):

```
python3 -m http.server
```

then visit `http://localhost:8000`.

## What's in it

- Branching 13-floor map: fights, elites, rest sites, shops, events, treasure and a boss
- Painted enemies with their own moves and passives: Sporeling (Spore Cloud poisons you, Burst Spores on death), Aether Tick (Charge, Lunge, Siphon heals), Scrapclaw (Overclock, Twin Claws, Scrap Grab), Rustjaw (Gnash, Maul, Hunker; Bloodscent gives +3 Strength below half HP), Veil Mask (Hex Gaze, Wail, Phase) and the elite Stone Warden (Bulwark keeps half its Block; Shield Slam adds its Block to the hit). Each move's name shows above its intent; hover the ◆ by an enemy's name to read its passive
- 25 cards with upgrades, 7 relics, Strength, Vulnerable, Weak and Poison
- Side-view combat stage with a painted backdrop for each third of the climb: sunlit ruins (floors 1 to 4), the great aether tree (5 to 9) and the storm-sealed gate (10 to 13, also the title art)
- Diorama depth: the backdrop, a midground prop layer and a blurred foreground layer sit at different depths and slide past each other as the camera slowly sways
- A few ambient effects per area (screen-blended): fog, light rays, gold motes and a falling leaf in the ruins; green motes, glowing mushrooms and a leaf at the tree; violet rain, an energy pillar and lightning flashes at the gate
- Combat bursts: slash on hits, ripple on Block, rune circle and pillar on powers, vortex on targeted skills, green puff on Poison, shard burst on kills
- Damage preview: aiming a card at an enemy recolors its numbers for Strength, Weak and Vulnerable (green up, red down), flashes the HP the target would lose and flags lethal hits; dragging a skill shows the Block you'd gain
- Scales up on large screens (QHD and 4K) and renders the hero at up to 3x pixel density; art is exported at full source resolution
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
| `tools/` | Python scripts used to cut the hero poses out of their backgrounds (`cut_oathbound.py` for the knight) |

## Art pipeline

1. Generate a full-body pose facing right on a plain background, using the concept sheets as reference.
2. Cut it out with the scripts in `tools/` (flat-color keying, or an AI matte via `rembg` for busy backgrounds).
3. Save it to `assets/` as WebP, about 760 px tall, and add it to `PIMG` in `index.html`.

Enemies stand on the right, so they must face **left**. Generated art usually faces right; mirror it when cutting it out so the file on disk already faces left, then add `img`, `w` (display width in px) and `ar` (width / height) to its entry in `EN`.

Enemies with a parts sheet are cut-out rigs: each part is its own WebP, and `RIGS` in `index.html` lists every part's position, width, idle animation (sway, nod, claw, leg, chew, glow, pulse, hover, flick, drift) and pivot. Give the enemy `rig:'<folder>'` instead of `img`. The claws strike on attacks, and the canister, crystal or flames flare on Overclock, Charge and Phase.

Next up: painted art for the Hex Mother and the Hollow King, then layered backgrounds and card illustrations.
