# Colorless card pool v0.2

Implemented from the user's 2026-11-27 specification, continuing ChatGPT conversation `6b09283d-69a8-83ea-afab-9c16f42e4051`. The retrieved original discussion omits its card tables; the explicit 40 definitions in the implementation request govern this change.

## Delivery

All **34 universal cards and six cooperative concepts**, each with its upgrade, are registered in `COLORLESS` and merged into `K`. There are no omitted cards. Final rarity counts: **13 common, 18 uncommon, nine rare** (including the cooperative assignments below). Existing neutral type icons and card faces are reused. No artwork or dependencies were added.

| Universal rarity | Cards |
| --- | --- |
| Common (12) | Exploit Opening, Counterweight, Cheap Shot, Brace, Reconsider, Preparation, Diversion, Recover, Feint, Follow Through, Improvised Defense, Hesitation |
| Uncommon (13) | Calculated Risk, Last Resort, Break Formation, Delayed Gratification, Second Opinion, Battle Rhythm, Holdfast, Read the Room, Salvage, Unfinished Business, Broken Pattern, Patience, The Long Game |
| Rare (9) | Dead Weight, Borrowed Tomorrow, Against All Odds, Contingency, Burn the Bridge, Reinvention, Final Word, Accept the Cost, Second Wind |

## Acquisition

Standard combat and elite rewards retain their existing class-only pools, including divine eligibility. Merchants retain five class slots and add two distinct colorless slots: common/uncommon and uncommon/rare. Colorless prices use existing rarity pricing. Every colorless card can appear at the merchant. Forgotten Library offers an explicit optional colorless study choice alongside its existing class-card choice. No elite replacement lottery or additional random event type was introduced.

## Provisional cooperative decisions

| Card | Rarity | Base → upgrade | Safeguard / solo behavior |
| --- | --- | --- | --- |
| Cover | Common | 7 → 10 Block | Self or living ally; self in solo |
| Rally | Uncommon | 2 → 3 extra draw next turn | Ordinary recipient draw; self in solo |
| Intercept | Uncommon | 10 → 14 Block | Exhaust; protect selected living ally's next single-target attack action; all hits redirect together; solo Block |
| Mark for Death | Uncommon | +6 → +9 damage | Next Attack card's first hit; strongest mark replaces weaker marks, no additive stacking |
| Supply Cache | Uncommon | +2 → +3 Energy next turn | Exhaust; **one application per recipient per combat**, shared recipient flag prevents different providers bypassing cap |
| Reinforcements | Uncommon | 8 → 11 Block per living member | Exhaust; self in solo |

Costs remain 1 except Reinforcements (2). Target selectors use stable member IDs, skip dead members, and resolve before payment. Future party adapters supply `C.playerId`, `C.party` members (`id`, `hp`, `state`, optional `n` and `receiveAttack`). The recipient's combat state owns its next-turn queue and Supply Cache cap. A party integration should provide `receiveAttack` for its full class-aware damage rules. No live multiplayer service or party UI exists on current main; this PR supplies tested routing interfaces and all six solo behaviors, not networked play.

## Rules and ambiguities resolved

- Cheap Shot means **the selected enemy has already lost HP to an Attack card this turn**. Block-only hits, Poison, Skills and prior turns do not qualify. The abbreviated request did not specify the subject; interpreting it as player damage would leave it practically unusable during main's solo player turns.
- Brace checks Block before gaining its combined 5+3 / 6+4. Last Resort+ deals 10 / 20, with a strict below-30% threshold. Broken Pattern checks the immediately preceding Attack, Skill, Power sequence in the current turn.
- Preparation Exhausts; Dead Weight is rare; Holdfast triggers once per turn per physical copy; Second Wind triggers once per combat per player, checking empty hand **before** end-turn discard.
- Second Opinion chooses one / two available top-five cards before resolving; the unchosen cards stay in their original order. It never reshuffles to create a five-card selection. Selections can be canceled without payment. Hesitation allows Done after zero or one selections, retaining at most one / two cards for one end-turn discard only.
- Recover only moves an eligible ordinary discard, never Recover (including upgrades/copies), divine/progression cards, temporary Sanctum cards, Exhausted cards or Power cards outside discard. Unfinished Business returns its original physical discard once per copy, never recreates or retrieves an Exhausted card.
- The Long Game first triggers three player turns after being played, then every three turns. Delayed effects are consumed after Energy/Block reset and before ordinary turn draw. Stacked draw penalties floor at zero and cannot bypass their penalty through Divine Draw. Contingency triggers on a crossing from at least 50% to below 50%; playing it while already below does not itself trigger it.
- HP costs use existing `sac()` rules (including Aurel's price), and existing HP-loss behavior floors these costs at 1 HP. Generic draw is ordinary draw, never Divine Draw. No colorless handler grants Anointed, Aether installation access or other exclusive resources.
- Against All Odds counts enemies, not attack hits, and applies Dexterity once to the total. Empty counts grant no Block. Mark is damage before normal Strength/Weak/Vulnerable/Orun modifiers, consumed once across a multi-hit Attack.
- Ten-card hand cap remains in force. A retrieved/selected card that cannot fit goes to its legal discard destination; no duplication or loss. All upgraded text retains the base card's other effects.

## Compatibility, validation and limitations

- Existing `hollow-ascent-v1` save key and deck `{id, up, u}` records are unchanged. Old class-only saves and new upgraded colorless decks load through the existing registry filter. Combat-only queues/caps reset per combat, and the existing game still saves on the map.
- Main has **no persisted seed contract**. This change preserves existing IDs and class reward generation, tests repeated generation with injected deterministic randomness, and prevents preview simulation from consuming RNG or card UIDs. The extra merchant inventory necessarily consumes additional random choices; identical pre-change random streams are not promised.
- `node --test`: 25 passing tests, including 480 full `play()` combinations (40 cards × two upgrade states × Aetherwright/Unsworn/four Oaths), plus numeric handler assertions, choices/cancellation, timing, retention, retrieval, caps, recipient routing, class pools, saves, and preview isolation. Three original tests remain passing.
- `node tools/colorless-smoke.cjs`: real local headless Chrome passed saved-run loading, Choose One, cancellation without Energy loss, two-card ordered selection, seven merchant slots, and purchase, with zero runtime exceptions. It requires locally installed Chrome (or `CHROME_PATH`) and a process environment permitting browser startup.
- Independent read-only review found no additional blocking issues. Its Second Opinion wording finding was corrected to required two-card selection. Minor deferred limitation: choice-dependent pre-play previews may omit benefits (e.g. Dead Weight Block) until choices resolve; the existing preview interface has no resolved-choice model. This is a display limitation, not missing card resolution.
- No blocked solo cards. Live networked multiplayer, party UI, full recipient class damage handling without an adapter, and persisted seeded runs remain outside this PR because those systems do not exist on current main. Provisional values still need playtesting.
