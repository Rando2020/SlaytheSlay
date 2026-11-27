# Act I navigation

The game and [Map Lab](../../map-lab.html) use the illustrated renderer in `src/act-map.js` and the Act I registry in `assets/maps/act01/registry.js`. The lab also opens at `index.html?lab=map`. The separate [prototype](../../map-prototype.html) preserves the original configurable region experiments, state previews and SVG export.

Confirming travel writes the destination before the animation. Continue resumes the encounter from its last stable state. Single-player and party saves have separate keys. Party saves retain the active climber, the shared enemies, and the remaining room visits. Existing map-only saves retain their stored graph.

The notes below describe the original prototype and its historical QA captures. Its asset inventory and performance measurements predate the illustrated production renderer.

# Original prototype design and validation

The production map and `map-lab.html` share `js/act-map.js`, `js/map-assets.js` and `map.css`. Serve the repository with a static HTTP server; no build or new runtime dependency is required.

## Existing systems preserved

Development started from main `5ae733a`, then incorporated main `aeceb69` including the painted enemy rigs and Juggernaut action poses. No repository AGENTS.md was present; the user-supplied owned-memory instruction was followed. Existing encounter handlers, classes, starting decks/relics, combat, reward economy, save key (`hollow-ascent-v1`) and the row-array graph representation remain in use. No forge, companion, hazard or exit mechanics were invented.

## Graph and configuration

`ActMap.generate(hero, seed, options)` uses a local seeded PRNG; it does not consume gameplay randomness. The seed and full graph are persisted for new runs. Existing saves retain their graph exactly. Configuration defaults to 13 floors, 3–4 nodes per floor, 55% branching, no elites before zero-based floor 4, first-floor fights, Oathbound shrine at floor 2, treasure at floor 6, rest before boss, then one boss. Early encounter weights retain the existing fight/event/shop mix. Later weights come from the region. Consecutive elites and repeated shops/rests are replaced with fights, except the mandatory final rest floor. `treasureFloor`, `shrineFloor`, `merchantFloors` and `restFloors` can customize placements; ordinary service-repeat restrictions still apply.

Edges form a monotone cover between adjacent rows. Every node has a reachable parent and an outgoing boss route; merge/branch connections cannot cross. `validate(map, hero, options)` checks connectivity, forward targets, dead ends, duplicate edges, crossing paths, boss convergence, early elites, repeated services and shrine class prerequisites. At most six nodes per row and 8–40 floors are supported. Generation is independent from rendering and encounter execution.

`MapAssets.regions` separates visual palettes/backgrounds/effects/music/transition/boss identifiers from generation weights and existing enemy-pool identifiers. Verdant Remnants is the gameplay default; Twilight Study demonstrates another configuration in the lab with existing fallback artwork. This does not introduce multiple-Act progression. Ambient music is null because no licensed map track was supplied. New regions must use existing supported encounter types and enemy pools, or separately implement/test new gameplay first.

## Asset manifest and dependencies

`MapAssets.assets` records source, actual dimensions when known, optional atlas, anchor, scale, fallback and animation fields. Backgrounds currently use existing `bg_ruins.webp` and `bg_gate.webp`, each measured at **1672 × 941, RGB, no alpha**. Opaque backgrounds are appropriate for environment layers. The shared vector icons are the existing game encounter symbols. Frames, danger badges, paths, journey marker, HUD and atmosphere are generated at runtime, with no map labels or route topology baked into art.

The referenced conversation API returned no attachments. A local search did not locate any of these files:

- `misty_sanctuary_among_ruins.png`
- `dark_fantasy_encounter_icon_set.png`
- `a_clean_graphic_design_sprite_sheet_on_a_transpare.png`
- `a_high_resolution_png_style_spritesheet_asset_shee.png`
- `a_clean_png_asset_sheet_on_a_transparent_checkerbo.png`

Their dimensions, alpha, baked checkerboard content and readability **cannot be verified**. They have not been extracted or integrated. This is an outstanding dependency, not completed asset work. `output/map/asset-audit/audit.json` records the result. The existing vector fallback icons are rendered in 40px SVGs and 48px buttons; mobile/desktop screenshots were visually inspected for silhouette and label separation. This does not establish readability of the unavailable illustrated originals.

When originals arrive, run `python tools/prepare-map-assets.py SOURCE_DIRECTORY`. Pillow is required for this offline authoring tool only. It records actual dimensions/alpha, refuses fully opaque sprite sheets, checks grid divisibility, extracts and normalizes icon/frame candidates to 256px, and generates 40/48px contact sheets. Frames preserve their complete cell geometry. A real alpha channel alone does not prove that a checkerboard was not painted into the RGB pixels: inspect the contact sheet and openings before promotion. Irregular HUD/effect sheets need individually measured rectangles; do not guess a grid. Update registry sources and atlas coordinates after review.

## Rendering and interaction

Layer order: environment, optional scenery/parallax, runtime connections, frames, vector encounter icons, journey marker, restrained atmosphere, HUD. Node coordinates derive from the persisted graph and stored jitter; resizing only changes viewport scaling. Rows are 106 logical pixels apart; minimum canvas width keeps circles at least 48px apart. Very wide custom rows scroll within the map. Short visual captions preserve full accessible labels.

Native scrolling supports wheel and touch panning. Buttons expose interaction, floor and independent danger through labels, pressed/disabled semantics, geometry, checkmarks and `!` badges. Arrow keys navigate between rows/columns; Enter/Space selects native buttons. Selection opens a generic preview; Confirm travel is required to advance. Unknown events never disclose their specific event, choices, reward or identity before arrival. Reduced motion suppresses mist and marker animation. Controller behavior is limited to keyboard events supplied by the browser/controller mapping; no native Gamepad API integration is claimed.

## Travel and persistence

Confirmation validates reachability and writes a `travel` record with `pending` status before any animation or progression. Failed writes roll back the pending record and show an alert. Repeated confirmation is locked. The marker animates for 700ms (immediate under reduced motion), and the current connection illuminates. Commit advances position/path/floor once, changes status to `active`, dispatches the existing handler and saves its encounter snapshot.

Additive `encounter` snapshots contain stable combat, rewards, shop/rest/shrine state, event definition index plus mutable event state, and card UID. Event functions are reconstructed from existing definitions. Rendered stable mutations are saved. Combat snapshots are deep copies; busy/locked combat writes are skipped entirely, retaining the last complete action boundary. Reloading an interrupted animation replays from that boundary, not a partial card/enemy action. Restoring a completed combat resolves its reward immediately, and persists that reward state to avoid duplication. `goMap` clears the active encounter/travel only when the encounter's existing Continue action completes.

This protects ordinary refresh/interruption in one browser tab. Cross-tab simultaneous play, hostile save editing, storage becoming unavailable after a successful initial travel write and crash-durable browser storage are not transactional guarantees. Keep the current save key and additive fields when extending the schema.

## Map Lab

Open `map-lab.html`: choose seed, class, region, interaction presentation, effects and desktop/mobile layout; generate/regenerate paths, inspect distribution, validate all routes, and select/confirm reachable nodes without starting combat. Dangerous nodes retain the selected/hovered/completed layer. Capture map image downloads a self-contained SVG of the actual shared DOM renderer, with CSS and background embedded. PNG desktop/mobile screenshots are included in `output/map`. Physical touch devices and native gamepads have not been tested.

## Validation

Run `node --test tests/*.cjs`. Eight tests pass: 1,000 seeds for each class, another 1,000 for each region, deterministic output, reachability, prerequisites, boss/rest/treasure rules, variable widths, malformed configurations, idempotent commit, danger/unknown presentation, 48px separation, class starting state and existing art checks.

Browser reproduction: run `python tools/build-map-qa.py`, serve the repository over HTTP on port 8878, then run `tools/browser-map-check.js` and `tools/browser-map-visuals.js` through Playwright CLI `run-code --filename`. The generated QA page is ignored and never deployed. The first suite checks keyboard input, pending reload, repeated confirmation, combat partial-action rollback, victory-delay reload and reward idempotency, all five noncombat encounter kinds, failed writes and legacy graphs. The visual suite checks missing background fallback, wheel scrolling and reduced motion, captures 1440×1000 and 390×844 layouts, and measures 100 render/layout iterations. The server URL can be adjusted in the scripts.

Measured headless Edge result: 43 nodes, median 3.4ms and p95 5.8ms per render plus layout on this machine. This is a local synthetic measurement, not a physical mobile frame-rate certification. No existing numeric rendering performance target was found. Cosmetic favicon 404 and intentionally aborted fallback image requests do not represent application exceptions.

## Delivery status

Phases 1, 3–8 and functional QA are implemented. Phase 2 uses verified existing art and explicit vector fallbacks; integration of the five specified originals remains blocked on access. Phase 9 includes automated coverage and desktop/mobile browser screenshots; physical-device testing and final illustrated-asset QA remain open. Keep the PR unmerged for review.
