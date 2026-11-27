# Enemy rig authoring

Serve the repository root and open **Enemy Animation Lab** from the title screen. Use the enemy ID (`veilmask`, `scrapclaw`, `stonewarden`...) as the registry key and the `assets/enemies/<id>/` folder name. Some older art sheets use working names: Hollow is `veilmask`, Scrapper is `scrapclaw` and Bulwark is `stonewarden`. See [docs/NAMING.md](../../docs/NAMING.md).

## Build a rig

1. Run `python cutsheet.py SOURCE.png PARTS_DIR` from an authoring directory with Pillow, NumPy, SciPy and rembg installed. The extractor uses the isnet-general-use model and writes transparent PNGs plus a numbered contact sheet. Review the alpha edges and separate touching pieces before layout.
2. Copy a layout from `layouts/`. Its `dir` points to the extracted part directory relative to the current working directory. Assign sheet IDs, centers, optional scale, rotation, mirror, pivot and motion. Set `mirror` on the layout when the assembled enemy faces right. The parts list is back to front. The historical Scrapclaw layout uses named input cutouts.
3. Run `python compose2.py LAYOUT.json` to inspect the rest pose. Run `python export.py KEY LAYOUT.json 0.65 --name "Enemy Name" --template creature` to write the WebPs and register the layout. Existing unrelated files in the sprite directory are preserved.
4. In the shared registry, bone pivots, sprite rectangles and weapon sockets are in rest-space pixels. A child inherits its parent's transform. Draw order follows the layers array independently of bone order. Available motion families include cloth sway, hair, floating shards, crystal pulse and moving limbs. A weapon or grip can be attached to any bone. The knight supplies a worked example with a moving spear and two elbow solves.
5. Open the lab, select the rig, inspect each state and scrub both endpoints and the strike. Select a bone to display its pivot and adjust its rest angle. The browser retains these edits per rig. Export the complete JSON for review and replace the corresponding registry entry to ship it.
6. To use an approved rig on an existing encounter, set its `EN` entry's `rig` to the registry key (the same as the enemy ID) and `w` to its combat display width. Replay a fight at gameplay scale. Combat cues use presentation-only state and preserve the engine's existing hit timings and VFX.

## Fallen Cathedral Knight

`python tools/rigs/extract_knight.py` regenerates the knight from the original separated sheet and painted reference. Both gripping gauntlets come from the portrait. The two forearms use the separated armor and stop at the wrist. The knight is available in the lab and the solo elite encounter pool. Combat uses the assembled rig at idle and the painted attack and hurt poses during strikes and hit reactions.

## Verification

Run `node --test tests/*.cjs`. The rig tests resolve each layer and sample every animation at 21 points, including both spear wrist constraints. Browser captures of all states are in [evidence](evidence/).
