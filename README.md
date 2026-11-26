# SlaytheSlay

A roguelike deckbuilder in the style of Slay the Spire, built as a single web page. Working title in game: **Hollow Ascent**.

Climb 13 floors, build your deck one card at a time, and topple the Hollow King. The hero is **The Aetherwright**, an aether-punk gunslinger with painted art and a 2D mesh rig.

## Play

Open `index.html` through any static web server (the hero rig loads its art from `assets/`, which browsers block over `file://`):

```
python3 -m http.server
```

then visit `http://localhost:8000`.

## What's in it

- Branching 13-floor map: fights, elites, rest sites, shops, events, treasure and a boss
- 25 cards with upgrades, 7 relics, Strength, Vulnerable, Weak and Poison
- Side-view combat stage with a painted backdrop for each third of the climb: sunlit ruins (floors 1 to 4), the great aether tree (5 to 9) and the storm-sealed gate (10 to 13, also the title art)
- Fanned hand, drag-to-play, a targeting arrow for attacks, card flight, lunges, hit flashes, screen shake and death dissolves
- The Aetherwright rendered as painted art on a WebGL mesh: breathing, cape and braid sway, pose swaps for attack, cast, power and hurt
- Run saves to the browser's local storage when you're on the map

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole game: markup, styles and script |
| `assets/` | Cut-out hero poses used in game (WebP with transparency) |
| `art/source/concept/` | Character concept, model and expression sheets |
| `art/source/hero/` | Original generated hero poses and the parts sheet |
| `tools/` | Python scripts used to cut the hero poses out of their backgrounds |

## Art pipeline

1. Generate a full-body pose facing right on a plain background, using the concept sheets as reference.
2. Cut it out with the scripts in `tools/` (flat-color keying, or an AI matte via `rembg` for busy backgrounds).
3. Save it to `assets/` as WebP, about 760 px tall, and add it to `PIMG` in `index.html`.

Next up: painted enemies in the same style, then layered backgrounds and card illustrations.
