# The Threshold

## Run lifecycle

Character selection -> Threshold -> optional required card choice -> Act I map. New runs store a 32-bit seed and use independent deterministic RNG streams for map generation, offering sampling and blessing outcomes. Exactly three distinct eligible registry definitions are sampled without replacement, with weights. The remainder of the existing game continues using its existing random sources; full combat/reward seed replay is not implemented.

The existing map-checkpoint save stores `G.threshold` (version, offers, selected, applied, pending, combatRemaining, merchantRemaining). Offer IDs are persisted before presenting the screen. Once a blessing is selected, any required target/card options and random transform outcomes are saved before displaying the follow-up. A valid resolution commits the effect and map checkpoint together. Selection and resolution reject mismatched, duplicate, or out-of-phase actions. Existing saves without a Threshold are not granted retroactive rewards. Starting a genuinely new run generates a new seed; deliberately abandoning a run is not prevented. As before, browser storage must be available. Reloading mid-combat or mid-shop resumes the preceding map checkpoint, not an exact encounter snapshot.

## Registry

`BLESSINGS` is the single source of definitions: id, name, description, flavor, icon, rarity, benefit, optional sacrifice, unlock, class restrictions, positive selection weight, duration, eligibility. `BLESSING_HANDLERS` dispatches supported effect types. Additional definitions with existing effect types require no UI edits. Future effect types require a handler and, for interactive effects, a resolution path. Unlock and class restriction filtering are implemented; the current pool is base unlocked, with no persistent profile progression or sacrifices applied. Offer count is currently three; a future profile upgrade can parameterize that count in initThreshold.

| ID | Benefit | Availability |
| --- | --- | --- |
| second-breath | +8 maximum and current HP | Active |
| fortune | +100 gold | Active |
| knowledge | Choose 1 of 3 eligible uncommon class cards | Active |
| purification | Remove 1 starting card | Active |
| tempered | Upgrade 1 eligible starting card | Active |
| fallen | Random common neutral relic via gainRelic | Active |
| first-light | +1 Energy on turn 1 of next 3 completed combats | Active |
| traveler | 2 random potions | Registered, disabled until potion system exists |
| unwritten | Choose 1 of 3 colorless cards | Registered, disabled until colorless pool exists |
| reforged | Transform 1 starting card into eligible random common/uncommon class card | Active |
| merchant | 30% off first merchant's cards, relic and removal, rounded to nearest gold | Active |
| sheltered | +8 Block on turn 1 of next 3 completed combats | Active |

Oathbound removal preserves its eight-ordinary-card guard. Transform results avoid divine/dormant and sanctifiable cards and cannot reproduce the original card ID. Upgrades use existing eligibility rules. Merchant duration expires when leaving the first shop, even if nothing was purchased. Combat duration decrements on victory, consistent with map checkpoint semantics.

## Visuals

Existing painted gate art is reused as an interim environment, with gold-bordered offering panels, runtime text, iconography, staggered reveals, hover/focus states, responsive stacking and reduced-motion support. Dedicated sanctuary art, individually painted offering relics and more elaborate selection/ambient FX remain a follow-up.

## Testing

Run `node --test tests/*.test.cjs`. The Threshold logic harness uses actual card definitions, pools, heroes, relic metadata and the run/Threshold functions from index.html with stubbed presentation, storage and common relic application. It samples 100 seeds per class and tests every generated option, invalid selections, reloads before and after application, temporary counters, and merchant pricing. This is not browser end-to-end or full gameplay testing. Balance values remain provisional.
