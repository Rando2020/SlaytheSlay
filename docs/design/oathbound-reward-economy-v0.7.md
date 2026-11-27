# Oathbound: Reward and Progression Economy v0.7

Status: design proposal, not implementation or measured balance. Builds on [v0.5](oathbound-fun-first-v0.5.md), [v0.6](oathbound-balance-audit-v0.6.md) and Master Card Library v0.4 in the design conversation. Current main README and index.html were inspected. Current game is still stance-based; this is a proposed persistent allegiance redesign. No gameplay code changed.

## Experience goal
Expand (new cards), develop (pledge and ascend), experiment (switch gods and relic discoveries). The player should reliably experience divine transformation without rare loot, while their reward choices determine the build. No devotion currency, kill XP, additional resource meter or grind. Card identity persists within run. Reward choice should be quick and informed.

## Compare models
| Model | Rules | Benefit | Risk |
|---|---|---|---|
| A Pilgrimage | Fixed opportunities at map milestones; minimal random divine progression | Predictable and teachable | Repetitive routes/builds |
| B Providence | Random divine opportunities at combat/event rewards; no guaranteed milestones | Surprise and replay variation | Unlucky 13-floor route can miss core mechanic |
| C Covenant (recommend) | Guaranteed milestone opportunities; variable ordinary card/relic offerings; optional elite T2 | Reliable core, varied builds and routes | Must account for reward budget, prevent duplicate claims |

## Current map constraints
index.html genMap uses 13 floors, four lanes before boss, floor 1 fight, floor 7 chest, floor 12 rest, floor 13 boss. Floors 2–4 do not roll elite; later rolls have elite possibility, not guarantee. README region bands 1–4, 5–9, 10–13. Do not require an elite to reach T3; no final-boss reward that only matters after victory. Existing elite victory grants gold, card choices and relic. Keep these baselines; divine upgrades replace the card choice, not the relic. Milestones are post-node overlays, not replacements for guaranteed treasure/rest or map generation. Route, reward content and prices stay independently testable.

## Covenant cadence
| Floor | Guaranteed opportunity (after resolving node, before advancing) | Optional alternatives |
|---|---|---|
| 1 | First covenant after fight reward; choose Aurel/Varran, select 1 eligible Mortal card to Pledge | Decline and remain Unsworn; initial covenant grant only once per run. |
| 2–3 | No fixed divine reward | Ordinary rewards; first successful pledged play transforms. |
| 4 | One progression choice | New card OR Pledge one eligible Mortal; unclaimed first covenant can be offered instead of Pledge. |
| 5 | Ordinary node | Elite may offer T2 in lieu of card reward. |
| 6 | First reliable T2 opportunity | Ascend one active T1 OR Pledge OR new card OR change oath with one Pledge instead of the other options. |
| 7 | Existing treasure | Relic; no required divine relic. |
| 8 | Ordinary node | Elite may offer T2. |
| 9 | Crossroads | Ascend active T1 OR Pledge OR new card OR change oath with one Pledge instead; returning can restore inventory without taking a new Pledge. |
| 10 | Ordinary node | Elite may offer T2. |
| 11 | Exaltation | Exalt one active T2 OR ascend active T1 OR Pledge OR new card. No instant T0->T3. |
| 12 | Existing rest | Existing rest or ordinary upgrade; no extra ascension in MVP. |
| 13 | Hollow King | Final battle; victory summary and card legacy. |

Floor 1 standard card reward is separate from the one-time introductory covenant. Floors 4/6/9/11 consume one progression reward: if a card reward exists, merge milestone options into it; otherwise standalone choice with ordinary card alternative. Preserve gold/relic/rest/shop/event outcomes, but do not stack an extra elite ascension on milestone floors. Nonmilestone elite: T2 competes with one standard card choice, only when eligible. No random additional Pledges for MVP. First oath may be taken at F4/F6/F9/F11 if previously declined, using that floor's one choice (no catch-up grant); no compulsory oath. If no eligible divine choice, show ordinary reward only. Skip allowed. Optional switching at rare events deferred. These are opportunities, not guaranteed selections or transformations. On-time loyal player who plays pledge, chooses T2 at F6, T3 at F11 can reach T3 without elite or relic; F12 rest means F13 boss is only guaranteed remaining fight. Test whether earlier F10 exalt checkpoint improves payoff (F11 currently preferred for pacing, not locked).

## Reward content and probabilities (prototype)
Ordinary card screen 3 distinct eligible cards, seeded, sampled without replacement by card definition. Each slot initial rarity weights normal 70/25/5 Common/Uncommon/Rare; elite 50/40/10; renormalize over eligible rarity buckets. Active-god exclusive cards initially 25% target among eligible slots; ensure at least one neutral option when possible; no forced divine slot and no off-oath cards without explicit relic. Starter cards not normal rewards. No duplicate offers in same screen, but owned copies can be offered. Rarity independent of divine tier. Relic candidate weights if tier support added: normal treasure/elite 60/30/9/1 Common/Uncommon/Rare/Legendary, renormalize over eligible unowned relics; no Twin Covenant in two-god MVP. Current game relic rarity system not assumed to implement these weights. Preserve existing gold/merchant prices until prototype data. No gold cost or currency for Pledge/Ascend.

## Prevent progression exploits
- One persistent card instance, one god, one tier and zone; Pledge targets unpledged eligible T0. Reserve normal-deck headroom immediately (count pending pledges), require at least 8 ordinary cards after all pending pledges and any removal in prototype. Card additions release headroom. Upgrade never copies or resets usage flags. Switching cancels unfulfilled pledges from old god (preview; no automatic refund); fulfilled divine cards become dormant at earned tier. Returning does not regrant first covenant.
- Every node/reward opportunity keyed by run, floor/node and reward type; claim atomically and persist choice before advance. Reload cannot reroll offers or reclaim; shop/removal/rest cannot bypass deck minimum. Seed offerings and persist pending reward and consumed IDs; current map-only saves need explicit design for reward save/reload. No gameplay code changes in this PR.
- Ascend active T1->T2 or T2->T3 only where permitted; no inactive or pending targets. Conventional upgrade of malleable card does not stack an unbudgeted stat bonus onto authored evolution; transformation replaces old effect and preview warns about lost ordinary upgrade. Defer conventional upgrades on evolved cards.
- Model D from v0.6 remains preferred experiment, not proven: one shared auto slot replacing normal draw, drawn cards return spent, refresh after actual ordinary shuffle at next turn start. Broad sanctum can supply distinct draws; singleton can't replay immediately by default. Do not award an upgrade for merely adding divine cards or force minimum Sanctum size. Compare against every-turn, alternating, retrieval-only. Explicit Recall obeys eligibility. Healing/Offering allowances survive transformation and retrieval.
- No special loyalty multiplier or free repeat switch progression. Loyalty retains access and investments; switch spends one progression choice and loses active access, can start new branch. Return to existing god restores old tiers but still uses choice. No HP punishment on top. Rare transfer/dormant-access relics later, not required.

## Illustrative reward screens
Early after F1: select Aurel (Anointed, overheal) or Varran (Bloodlust, converted healing) or Unsworn. Preview Lay on Hands -> Healing Grace/Blood Benediction; Pledge selection locks one card, transforms on next successful play. At F4: new card (Cleave, Shield of Faith, Vigilance) vs Pledge Judgment -> Divine Verdict/Execution. At elite/F6: keep gold and relic, choose card reward or Ascend Healing Grace -> Divine Mercy (1E: 5 Block, first-play heal 2, 1 Anointed), or other milestone choices if F6. F9 switch preview: locked cards and tiers, accessible deck count before/after, new Pledge preview, retained inactive cards. F11: Divine Mercy -> Hand of Salvation (1E: 7 Block, first-play heal 2, 2 Anointed) vs ordinary card vs other eligible advancement. No automatic branching T3 in MVP. Skip optional. Display final cost, exact effects, rarity, tier, source, next location, and healing/energy restrictions. No forced animations; short skippable reveals.

## Three hand-authored progression traces (not simulation or measured outcomes)
Assume proposed 10 ordinary starter cards, active pledges played in next combat before next relevant upgrade, no rare relics, no removals. Normal additions listed explicitly; other route rewards skipped or noncard. All milestones apply independent of node type. Counts shown after pledge transformation; no actual gameplay or HP outcomes inferred.
| Floor | Loyal Aurel | Aggressive Varran | Switch Aurel -> Varran |
|---|---|---|---|
| 1 | Acquire Reprisal; pledge Lay on Hands | Acquire Penance; pledge Judgment | Acquire Reprisal; pledge Lay on Hands |
| 2–3 | Play pledge -> Healing Grace; acquire Shield of Faith | Play pledge -> Execution; acquire Cleave | Play pledge -> Healing Grace; acquire Shield of Faith |
| 4 | Pledge Judgment | Pledge Lay on Hands | Pledge Reprisal |
| 5 | Play -> Divine Verdict | Play -> Blood Benediction | Play -> Righteous Blade |
| 6 | Healing Grace -> Divine Mercy | Execution -> Merciless Verdict | Divine Mercy (from Grace) |
| 7 | Ordinary relic | Ordinary relic | Ordinary relic |
| 8 | Acquire Sacred Ward | Acquire Warmonger | Acquire Cleave |
| 9 | Divine Verdict -> Solar Judgment | Pledge Penance | Switch to Varran, pledge Judgment; Grace branch and Righteous Blade dormant |
| 10 | Test build | Play pledge -> Blood Tribute | Play -> Execution; if elite, choose T2 Merciless Verdict |
| 11 | Exalt Mercy -> Hand of Salvation | Exalt Merciless Verdict -> Godbreaker | If F10 elite T2, Exalt Godbreaker; otherwise ascend Execution to T2 |
| 12–13 | Rest, boss | Rest, boss | Rest, boss |
| Final inventory | 11 ordinary, 2 active (T3,T2), 0 dormant | 10 ordinary, 3 active (T3,T1,T1), 0 dormant | 10 ordinary, 1 active (T2 or T3), 2 dormant (T2,T1) |
Switch trace intentionally sacrifices a T2 and T1 for new offensive access. Earlier F6 switch yields a more reliable T3 route using F9 T2 and F11 T3; late switching is high-risk, not guaranteed equal power. Floor 10 elite is optional; no invented results. Example card reward content assumes eligible pool draws; no claims these exact rewards are guaranteed.

## Relic philosophy
MVP common/unc exceptions: Saint's Circlet (1 opening Anointed), Bloodstone (first Bloodlust consumed each turn +2 damage), Pilgrim's Seal (1 HP after fight), Ancient Testament (opening extra Divine Draw; separate explicit effect respects availability), Ring of Remembrance (turn 3 explicit draw). Later rare: Crown of Thorns, Key to Forgotten, Divine Inheritance, Saint's Legacy; Legendary Twin Covenant uses shared auto slot. No rare relic required for T1/T2/T3. Keep v0.6 restrictions; avoid automatically buffing all evolved cards. Relic exclusivity by implemented gods and effects, no nonfunctional rewards.

## Acceptance and playtests (proposed)
| ID | Test | Expected |
|---|---|---|
| R01 | 13-floor route without elites | F1 first covenant, F4 choice, F6 T2, F9 choice, F11 T3 opportunity when eligible; F7 chest/F12 rest/F13 boss preserved |
| R02 | F6 elite milestone | One progression choice, gold/relic retained; no extra elite ascension |
| R03 | F4 shop/event | Post-node milestone once, normal alternative available |
| R04 | Decline first oath and all divine choices | Valid Unsworn run; no dead rewards |
| R05 | Reload pending/claimed reward | Same offerings; no duplicate payout or reroll |
| R06 | 9 normal cards and one pending pledge | Further pledge/removal that drops below 8 blocked before confirmation |
| R07 | Switch/return | Original tier and identity preserved, no fresh first oath; old pending pledge cancellation previewed |
| R08 | No eligible T2 at F11 | Offer T1->T2/pledge/new card instead; no fake T3 |
| R09 | Rare relic absent | Timely loyal path can reach T3, no mandatory elite |
| R10 | Same seed and reward configuration | Same card offers and rarity eligibility; no duplicate definitions in reward screen |
| R11 | Early vs late switch | Early F6 can reach T3 via F9/F11; late F9 requires extra elite for T3, preview consequence |
| R12 | Attempt to pledge conventionally upgraded mortal | Preview authored form replacing old numerical upgrade; no double scaling |

Measure actual first transformation floor, time to T2/T3, eligible milestone coverage, pledge/ascend/new card/skip rates, elite route selection, switch regret, ordinary/active/dormant sizes, divine access per fight, HP recovered, time spent on reward screens, fun rating and favorite card recall. Provisional targets: 100% routes expose milestones; 90% of players who accept first Pledge and reach F4 have transformed by then (if route provides combat; monitor map seeds, do not guarantee without battle); at least 80% of loyal testers who intentionally pursue T3 and reach F12 obtain it; median routine reward decision <=20s, milestone <=45s; no rare-relic dependency, no universally dominant singleton strategy. Human playtest comparisons between A/B/C with fixed encounter/reward seeds and same reward budgets; avoid equating more time spent with fun. No tests or simulations executed.

## Open questions and next steps
F11 T3 may leave only boss as guaranteed fight; compare F10 versus F11. Milestone overlays after noncombat nodes add a reward relative to baseline; evaluate opportunity frequency/total power against Aether and avoid changing its economy. First pledge can remain pending on noncombat routes; test guaranteed combat placement versus moving first divine reveal to reward screen if necessary. Eight-card floor and rarity weights provisional. No dual oath or branching Exalted aspects in MVP. Implement later in separate PR after design review. Next design task: emergent build diversity and legal combat sequences, followed by enemy encounter design; use v0.6 guardrails and v0.7 economy, no new cards unless an existing gap justifies it.
