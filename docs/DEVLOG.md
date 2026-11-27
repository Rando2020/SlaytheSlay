# Dev log

A record of how SlaytheSlay (working title Hollow Ascent) was built, the decisions behind it, and how the art pipeline works, so the next session can pick up without the original chat.

## Timeline

1. **Core game.** A single-page roguelike deckbuilder in the style of Slay the Spire: a 13-floor branching map (fights, elites, rest, shop, events, treasure, boss), 25 cards with upgrades, 7 relics, Strength, Vulnerable, Weak and Poison, saves on the map screen.
2. **Side-view stage and juice.** Hero on the left facing right, enemies on the right facing left. Fanned hand, card flight to the target, lunges, hit flashes, screen shake, death dissolves, rare-card foil, boss and elite banners.
3. **Targeting arrow and drag-to-play.** Targeted cards draw a chevron arrow from the card to the enemy (drag or tap). Untargeted cards are dragged up into the play area and released to play.
4. **Art direction.** Painterly Final Fantasy meets Arcane, animated like Slay the Spire. Decision: **2D rigging, not 3D.** The camera never moves, 2D keeps the painted look, and it fits an image-generator art pipeline.
5. **The Aetherwright.** Concept sheets, then five poses (idle, attack, hurt, cast, raised-gun power). Cut out and rendered as painted art on a deforming WebGL mesh: breathing, cape and braid sway, canister glow, pose swaps per card type, muzzle sparks.
6. **Backgrounds.** Sunlit ruins (floors 1 to 4), great aether tree (5 to 9), storm-sealed gate (10 to 13 and the title).
7. **Diorama depth.** Background, midground props and a blurred foreground at different depths with a slow camera sway, so the layers parallax. Props come from the Verdant Remnants sheets.
8. **Ambient and combat effects.** Fog, light rays, motes, moths, leaves, petals, mushrooms, violet rain, an energy pillar and lightning. Combat bursts: slash, ripple, rune circle, pillar, vortex, poison puff, shard burst.
9. **Damage preview.** Aiming a card recolors its numbers for Strength, Weak and the target's Vulnerable (green up, red down), flashes the HP the target would lose, flags lethal, and shows Block gained. The card is simulated on a copy of the fight, so previews always match the result.
10. **Resolution.** The UI scales up on screens over 1300 px wide (QHD, 4K). The hero renders at up to 3x pixel density. Art is exported at full source resolution, and large screens load 4K backgrounds upscaled with Real-ESRGAN.
11. **Particle ambience.** Motes, fireflies and leaves moved from sliding pictures to a canvas particle system that runs continuously (the image effects used to restart and jump on every screen update). The camera no longer follows the mouse, and its idle sway is much smaller.
12. **The Oathbound.** A second playable hero (separate session): hero pick on New run, his own deck, the Pilgrim Star relic and four Oath stances.

## Art pipeline

- **Generate** with the concept sheets attached as reference. Heroes face right, enemies face left, full body, plain flat background, light from the upper left, palette of crimson, bone, gold and violet aether.
- **Cut out** with the scripts in `tools/`:
  - `cut_flat_background.py`: keys a flat or gently graded background.
  - `rembg_pass.py` + `cut_ai_matte.py`: AI matte (rembg, `isnet-anime` works best on this art) for busy or fake-transparent backgrounds, then smoke cleanup.
  - `cut_prop_sheet.py`: splits a transparent prop sheet into one file per prop.
  - `cut_oathbound.py`: the Oathbound poses, including erasing the painted swing arc.
- **Effects sheets** with blotchy fake transparency are composited over black and drawn with screen blending, which hides the blotches.
- **Upscale** with `tools/upscale.py` (Real-ESRGAN x4plus on CPU, about 6 minutes per background). Blend 75/25 with a plain resize to keep brush texture.
- **Wire in:** name the file after its ID and put it in its category folder ([NAMING.md](NAMING.md)), then run `node tools/build-asset-manifest.mjs` and `node tools/build-id-registry.mjs`. Hero poses go in `assets/heroes/<heroId>/`, per-pose scale and anchor in `PMETA`, props in `PROPS`, ambient layers in `AMB`, combat bursts in `VFX`.

## Conventions

- Naming and folders: see [NAMING.md](NAMING.md). One ID per game object, used for every file that belongs to it.

- Poses are cropped to their content. The rig draws every pose at the same height unless `PMETA` says otherwise.
- `assets/` holds what the game loads; `art/source/` keeps the originals; `art/cutouts/` keeps every cut piece with numbered contact sheets so props and effects can be referred to by id (for example `b25`, `slash2`).
- Run locally with `python3 -m http.server`. Over `file://` the browser blocks the WebGL textures and heroes fall back to a still image.

## Next up

- Painted enemies in the same style (idle, plus attack and hurt if possible), replacing the drawn placeholder monsters.
- Card illustrations.
- Unused props and effects are ready in `art/cutouts/` for more variety.
