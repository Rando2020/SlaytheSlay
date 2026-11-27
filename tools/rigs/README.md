# Enemy rig tools

Scripts used to turn a parts sheet into a cut-out rig in `assets/enemies/<rig>/`.

1. `python3 cutsheet.py <parts-sheet.png> <dir>` cuts every part off the sheet (rembg, `isnet-general-use`) into `<dir>/pNN.png` and writes `<dir>_idx.jpg`, a numbered index of the parts.
2. Write a layout in `layouts/`: each part's file, centre (`cx`, `cy`), optional `s` (scale), `r` (rotation), `flip`, idle animation `a` and pivot `o`. Set `"mirror": 1` to flip the whole rig so it faces left.
3. `python3 compose2.py layouts/<name>.json [reference.png]` renders a preview next to the reference art.
4. `python3 export.py <rig> layouts/<name>.json <scale>` writes the part WebPs to `assets/enemies/<rig>/` and prints the spec to paste into `RIGS` in `index.html`.

Layouts here: `scrap` (Scrapclaw, parts dir `sc` with named parts), `tick` (`tk`), `mask` (`vm`), `rj` (Rustjaw), `sp` (Sporeling), `sw` (Stone Warden). Paths in the scripts point at a scratch folder; edit them before reuse.
