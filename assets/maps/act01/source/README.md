# Hollow Ascent: Act I map artwork

Status: generated source artwork, not yet integrated. Preserve these original PNGs. Proposed repository destination: `assets/maps/act01/source/` (confirm existing conventions).

| Filename | Actual dimensions | Description |
|---|---|---|
| `act01_verdant_remnants_map_background.png` | 941 × 1672 | Act I backdrop |
| `encounter_icons_atlas.png` | 1448 × 1086 | 4 columns × 3 rows; 362 × 362 source cells |
| `encounter_node_frames_atlas.png` | 1536 × 1024 | 3 columns × 2 rows; 512 × 512 source cells |
| `map_vfx_atlas.png` | 1536 × 1024 | irregular atlas; manually crop and isolate |
| `map_hud_atlas.png` | 1536 × 1024 | irregular atlas; manually crop and isolate |

## Atlas order (row-major)

- Icons: combat, elite, unknown, rest; merchant, treasure, boss, shrine; forge, companion, hazard, act_exit.
- Frames: locked, available, hovered; selected, completed, dangerous. Treat danger as an independent overlay. Center alpha samples: 0, 0, 4, 12, 0, 0; clean holes and verify shape alignment.
- VFX: top row ground fog, mountain mist; next row golden embers, magical motes, crimson particles; next row god rays, node aura, discovery pulse; next row worn path, illuminated path; bottom row journey base, gateway aura.
- HUD: top left act title, top right resource container; middle left preview panel, middle center legend, middle right floor progression and route indicators, far right back/zoom controls; lower left confirm and button variants, lower right boss preview; bottom completion banner. Irregular sheet: manually establish bounds. Button states differ in geometry; normalize or use one base and runtime tint.

## Integration notes

- Source map is 941 × 1672 RGB; preserve aspect ratio. Target 2160 × 3840 is an upscale, not native resolution.
- Source icon/frame atlases are RGBA; extract each cell and normalize to 256 × 256 with transparent padding. Inspect at 40–48 px. Alpha exists but does not guarantee clean isolation. VFX and HUD have broad semitransparent regions; verify on actual map before use.
- Generate routes, labels, encounter types and interaction states at runtime. Never bake map topology into the backdrop.
- Do not create gameplay mechanics for optional art without existing encounter definitions. Keep original files separate from runtime crops.
- See manifest.json for original filenames, source dimensions, and SHA-256 checksums.
