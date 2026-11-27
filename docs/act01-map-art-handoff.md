# Hollow Ascent | Act I map art handoff

Status: **source PNGs packaged separately; not yet committed in this branch.** This manifest is not a runtime asset registry. Import the accompanying hollow_ascent_act01_art.zip into the proposed path below before implementation.

Proposed location: `assets/maps/act01/source/`. Confirm existing asset conventions before moving files. The five original PNGs are byte-for-byte preserved in the ZIP under these stable names.

| File | Actual source dimensions | SHA-256 |
|---|---|---|
| act01_verdant_remnants_map_background.png | 941 × 1672 RGB | 40406600a30a2d17ac0f8c4a661260c4ebd2c12fd97b0923b6d4615af82f853d |
| encounter_icons_atlas.png | 1448 × 1086 RGBA | e6c00cffd954a1649bc297aec6f6965a34e0cf3de688e64fcfd4499bc3ebb571 |
| encounter_node_frames_atlas.png | 1536 × 1024 RGBA | a7ec5f0e2b046d9453f0bc7987fae7a9738b085b92e8e4abd665b1ae2ea79a04 |
| map_vfx_atlas.png | 1536 × 1024 RGBA | 45e636445bfbf347cbbc9d2fabe0d4d0d22efec9b94986afcd14edb262b2dc77 |
| map_hud_atlas.png | 1536 × 1024 RGBA | 176031b824c20dba5c42500d3c3860bc8960abcb9af8df4ba62d13f2f6b84ed6 |

## Atlas mapping

- Icons, row-major 4×3, 362 px square source cells: combat, elite, unknown, rest; merchant, treasure, boss, shrine; forge, companion, hazard, act_exit.
- Frames, row-major 3×2, 512 px square source cells: locked, available, hovered; selected, completed, dangerous. Frame center alpha samples: 0, 0, 4, 12, 0, 0. Clean holes and validate alignment. Danger should be an independent presentation overlay.
- VFX, irregular atlas: top ground fog and mountain mist; second row golden embers, magical motes, crimson particles; third god rays, node aura, discovery pulse; fourth worn path and illuminated path; bottom journey base and gateway aura. Manually establish crop bounds and isolate alpha.
- HUD, irregular atlas: top left title, top right resources; middle left preview, middle center legend, middle right floor progression and route indicators, far right back and zoom controls; lower left confirm and button variants, lower right boss preview; bottom completion banner. Normalize button geometry or use one base with runtime tint.

## Integration

Preserve source art. Extract runtime sprites separately; normalize icons and frames to 256×256 with transparent padding, inspect at 40–48 px, and verify contrast against the map. VFX/HUD sheets have broad semitransparent regions; alpha channel presence does not guarantee clean isolation. The background native resolution is smaller than the requested target 2160×3840. Preserve aspect ratio and avoid unnecessary upscaling.

Use existing 13-floor map and existing encounter definitions; do not create gameplay for optional artwork. Render paths, labels, state and interaction dynamically. Preserve existing combat and saves. The implementation PR should import the actual PNG files and validate the registry, fallbacks and screenshots before merge.

The ZIP includes these five files plus a README and JSON manifest. No PNG data is present in this manifest-only commit; do not treat it as completed art integration.
