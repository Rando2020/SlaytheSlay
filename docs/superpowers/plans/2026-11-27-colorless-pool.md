# Colorless Card Pool Implementation Plan

**Goal:** Implement the user's 40-card specification on current main, preserving class rewards, saves and neutral art.
**Architecture:** Extend the existing registry inside the static game's closure. Reuse Attack, Block, exhaust and choice interfaces; add isolated colorless state/hooks for history, delayed effects, retention, safe retrieval and recipient routing.
**Spec:** User request in this chat, continuing conversation 6b09283d-69a8-83ea-afab-9c16f42e4051. Initial baseline aaa1e8e; integrated newly merged main 3373dc4, 96ae95a and ced57ec; no tracked AGENTS.md.

## Constraints and decisions
- No new art or dependencies; use existing ART fallback. Ordinary rewards stay class-only.
- Dedicated merchant slots: one common/uncommon and one uncommon/rare colorless; optional explicit Burned Library colorless choice. No random replacement of standard reward options.
- Recover reads only ordinary discard, excluding Recover, divine/progression and temporary Sanctum cards. Unfinished Business returns the same physical card, only from ordinary discard.
- Cooperative rarities/upgrades: Cover common 7/10; Rally uncommon 2/3; Intercept uncommon 10/14; Mark for Death uncommon 6/9; Supply Cache uncommon 2/3, once per recipient per combat; Reinforcements uncommon 8/11.
- Main gained multiplayer and Threshold during development. Integrate native G.party/combatParty seats, full incoming damage rules, recipient queues and pre-turn allied Block. Preserve solo/party save formats and seeded map/Threshold replay; combat/shop RNG remains Math.random. Existing party-wide attacks are ineligible for Intercept redirection; explicit single-target intents are supported and tested.

## Tasks
- [x] Add failing executable VM tests for registry/pool counts and representative card behavior, using real game handlers.
- [x] Add all definitions/upgrades and hooks for choices, history, triggers, retain, retrieval and recipient targeting. Verify every card at base and upgrade, plus timing, caps, cancellation, hand overflow and class restrictions.
- [x] Add dedicated merchant slots and optional Library colorless reward. Verify class rewards and existing saves, IDs and deterministic randomness.
- [x] Run full node suite, syntax/diff checks, independent final review, document decisions/limitations, commit, push feature branch and open PR without merging.

## Review focus
- Choice cancellation must not spend resources or move cards; required payment choices cannot be skipped.
- Preview must not mutate live cards, combat, HP, UID or RNG state.
- Retrieval never reaches divine piles or duplicates physical cards; retained cards expire after one turn.
- Delayed penalties apply before draw, after energy reset; return triggers do not resurrect exhausted cards.
- Per-copy powers and player/recipient caps survive repeated copies and end-turn processing.

## Verification ledger

- Registry and numeric tests observed failing before implementation. Regression tests exposed and verified fixes to cancellation, poison-trigger Block reset, recipient caps, target eligibility, mark consumption, and Dexterity aggregation.
- Full suite: node --test → 66/66. Real-play matrix: 480 combinations. Browser smoke passed with zero runtime exceptions.
- Independent reviews: no blocking findings, integration reviewer independently verified 66/66; Second Opinion text now matches required two selections.
- Rulings: Cheap Shot target means enemy; HP costs follow sac rules; newly merged native party and seeded Threshold systems integrated; strongest-only Mark and per-recipient Supply cap are provisional safeguards.
- Minor deferred: choice-dependent previews may omit benefits until selection; colorless draw cards do not yet populate the newly merged hover draw forecast.
- Delivery: feature branch feat/colorless-card-pool; PR to main, never merge.
