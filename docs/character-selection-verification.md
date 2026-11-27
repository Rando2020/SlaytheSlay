# Character selection verification

Based on main `afdc2a6`; inspected open PRs #1 (enemy rigs) and #4 (Oathbound preview). No repository AGENTS.md was found. PR #4 contains preview code but no image binaries; this change implements the complete shared screen on main without merging unrelated work.

## Artwork provenance

The exact approved attachment from conversation `6b0923aa-ff50-83e9-84e0-e53e4ba14da3`, `image(4).png`, was accessible locally. No matching selection artwork exists in main or PR #4. Recovered the original rather than generating a replacement.

- `art/source/oathbound/selection-approved.png`: exact original, 1672 x 941.
- SHA256: `c3e1b7cc1d6b4b88d3ddf30d76b5b91be7878fa84c70024205734033495c56af` (matches the attachment).
- `assets/bg_oath_select.webp`: quality 95 WebP at original dimensions, no crop or upscale.
- Aetherwright uses `assets/hero_idle.webp`; portraits reuse that file and `assets/oath/idle.webp`.
- Duelist has no HEROES entry on main, so its neutral selector is disabled. No class, deck or mechanics were invented.

## Changes

Shared responsive selection renderer, full composition on the left and charcoal/bronze details on the right. Existing HEROES, RELICS and GODS supply class descriptions, health, relics and expandable Oath laws/prices. Starting gold now has one shared constant for the screen and run creation. Deck inspection uses the real class deck factory and card renderer, restores run/combat state and IDs even after errors, and isolates keyboard focus from the underlying start button. Begin Ascent confirms the selected playable class. Existing title, map, save/continue and combat routing remain intact.

## Checks

- `node tests/character-selection.cjs`: selection rendering, dynamic class data, preview state restoration including exceptions, full inline-script parsing, dialog isolation and focus restoration passed.
- `git diff --check`: passed.
- Browser: both class switches, both 10-card starter decks, both start-to-map flows, Oath rule expansion, deck Close/Escape, Back and saved-run Continue passed.
- Screenshots inspected at 1440 x 900 and 390 x 844. No mobile horizontal overflow; full four-god image remains visible. Other desktop screenshot captured at browser default size.
- `output/playwright/` contains desktop/mobile selection, deck and start screenshots.
- Browser reported only a pre-existing missing `/favicon.ico` (404), no game script errors observed.
- No existing package/build/test configuration is present; this is a static HTML game.

## Review

Independent review found one keyboard issue: the inspector could leave focus on the background Begin Ascent button. Added a failing regression check, then isolated the background with inert, focused Close and restored focus on dismissal. Unit checks and browser verification passed after the fix. The test encoding typo identified by review was corrected. No deferred findings.
