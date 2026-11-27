# Full-screen battlefield implementation plan

Approved direction: scenery fills the viewport; a shallow fanned hand overlays its bottom edge, cards lift for reading, energy and End Turn stay near the hand, and a compact top bar overlays scenery. Both classes and their mechanics remain intact.

Approach: retain the existing scene, actor renderer and delegated inputs. Apply combat-only viewport positioning, and size the fan against a capped centered hand rather than the old 900px app. Keep menus and map in their existing layout. This avoids replacing the scene or gameplay engine.

- [ ] Add regression checks for hand geometry at narrow, desktop and wide widths with 1, 5 and 10 cards.
- [ ] Add combat-only full-viewport stage, transparent hand layer, readable bottom shading, responsive actors and controls. Keep zoom calculations consistent with pointer coordinates.
- [ ] Run all Node tests and diff checks, then verify both classes, card play, enemy targeting, End Turn and narrow layout in the published browser preview.
- [ ] Review the complete change and publish a scoped PR and commit-pinned playable link.

Review focus: ten-card hands, short landscape screens, card hover/focus overlap, actor targets above the hand, menu layout and pointer coordinates after resize.
