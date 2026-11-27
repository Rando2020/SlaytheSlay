# Oathbound: Fun-first design review v0.5

Status: proposed design, not implemented or approved as production balance. Source: project design discussion and Master Card Library v0.4. The repository README currently documents four combat stances, 76 HP, Pilgrim Star and a 22-card pool; this is a redesign, not a description of current code. Preserve current playable game pending a separate implementation PR.

## Experience thesis
The distinguishing feature is persistent card identity: a mortal card becomes god-aligned, changes name and effects, ascends, and can become dormant and later be reclaimed. The player should enjoy reading intent, sequencing cards, and winning combat before rewards add excitement. Avoid equating session length or compulsive return with fun.

## Design principles
- Slay the Spire: legible threats and choices under pressure; measure balance and player decisions.
- Monster Train: invest in favorite cards and allow exceptional earned combos.
- Hades: runs have a story; make faith and betrayal meaningful without punitive friction.
- Balatro: individually simple effects, surprising combined interactions.
- Dead Cells: responsive feedback; reserve spectacle for important actions.
These are design comparisons from the discussion, not independently verified citations in this upload.

## Proposed changes
| System | Proposal |
|---|---|
| Pledge | Select eligible mortal card at shrine/reward; next play resolves mortal effect then transforms the same instance to T1. |
| Divine Draw | Compare automatic every turn, alternating turns and retrieval-only; all automatic draws replace normal draw slots. v0.6 adds a cycle model to test. |
| Divine laws/prices | Aurel overheal 1:1; Varran converts healing into damage; Orun retaliation and Mora sacrifice damage move to cards/statuses; defer independent penalties unless meaningful. |
| Ascension | T1 through pledge, T2 via elite/shrine choice, T3 via boss/milestone; selected flagship cards may get branching final aspects later. |
| Dormancy | Preserve original card and tier when switching; preview lost access and provide limited mortal release safety valve. |
| Statuses | Anointed, Bloodlust, Resolve, Soulbound use existing status interface. |
| Relics | Exceptions that enable discoveries, not mandatory access to class mechanics. |
| Dual oaths | Defer until single oath core proven; share draw budget. |
| Presentation | Use existing painted idle, attack, hurt, cast and power poses. Fast ordinary actions, short transformative reveals, skippable exaltation. |
| Legacy | Optional card history and end-of-run favorite cards, no new combat clutter. |

## Prototype plan
A: ordinary martial cards. B: pledges, Sanctums, evolution and retrieval. C: add signature statuses, dormancy and switching. Same seeded encounters and comparable starting decks; Aurel and Varran first, then Orun/Mora. Proposed slice: 10 starting cards, 8 neutral rewards, 3 malleable families (18 divine forms for two gods at T1–T3), 6 divine-exclusive cards, 5 relics, 4 normal encounters, 1 elite, 1 boss, 2 shrine events. Target 15–25 minute slice.

## Hypotheses and evaluation
Initial targets, not evidence: median ordinary combat fun >=7/10, first transformation >=8/10, 80% of testers explain pledge/draw after three sworn encounters, at least two plausible plays on half of sampled turns, ordinary permanent healing typically 0–3 HP, 70% identify a favorite evolved card, both oaths viable without rare relics, 60% voluntarily choose replay. Use 12–20 initial qualitative testers; do not claim statistical certainty. Record frustration, pacing and comprehension as well as voluntary replay. No human or automated gameplay was conducted in this review.

## Open decisions
Draw cadence, single-card sanctum incentive, energy/retrieval loops, healing eligibility, deck thinning, ascension reward trade-offs, oath-switch safety, branching final forms. See v0.6 audit before implementation.
