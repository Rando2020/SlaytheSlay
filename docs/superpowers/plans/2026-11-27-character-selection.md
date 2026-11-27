# Character selection implementation plan

Goal: Implement the supplied Hollow Ascent character selection brief on current main.

Architecture: Keep the single-page renderer and delegated actions. Store selected class separately from run state; use HEROES, RELICS, GODS and existing card rendering for all gameplay details. Preserve the full approved painting with contain sizing.

Tasks:
- [x] Add a shared cinematic selection view and data-driven portrait buttons; keep Duelist unavailable because main has no class definition.
- [x] Add deck inspection and explicit start, without modifying saved runs during browsing.
- [x] Import the exact attached Oathbound reference, document provenance, verify both start flows, responsive layouts, saved-run navigation and browser errors.
- [x] Review diff, commit scoped changes and open a PR against main.

Review focus: no art crop, no fourth class, no invented mechanics, no preview mutations to run state, keyboard access and narrow screens.

