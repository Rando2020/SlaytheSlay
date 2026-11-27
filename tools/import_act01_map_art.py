"""Import verified original Act I artwork and extract 18 runtime sprites.
Run from repository root: python tools/import_act01_map_art.py path/to/hollow_ascent_act01_art.zip
Requires Pillow.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageDraw

SOURCES = {
    'act01_verdant_remnants_map_background.png': '40406600a30a2d17ac0f8c4a661260c4ebd2c12fd97b0923b6d4615af82f853d',
    'encounter_icons_atlas.png': 'e6c00cffd954a1649bc297aec6f6965a34e0cf3de688e64fcfd4499bc3ebb571',
    'encounter_node_frames_atlas.png': 'a7ec5f0e2b046d9453f0bc7987fae7a9738b085b92e8e4abd665b1ae2ea79a04',
    'map_vfx_atlas.png': '45e636445bfbf347cbbc9d2fabe0d4d0d22efec9b94986afcd14edb262b2dc77',
    'map_hud_atlas.png': '176031b824c20dba5c42500d3c3860bc8960abcb9af8df4ba62d13f2f6b84ed6',
}
ICONS = 'combat elite unknown rest merchant treasure boss shrine forge companion hazard act_exit'.split()
FRAMES = 'locked available hovered selected completed dangerous'.split()

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('zip', type=Path)
    p.add_argument('--output', type=Path, default=Path('assets/maps/act01'))
    a = p.parse_args()
    root = a.output
    with ZipFile(a.zip) as z:
        data = {}
        for name, expected in SOURCES.items():
            members = [m for m in z.namelist() if Path(m).name == name]
            if len(members) != 1:
                raise ValueError(f'Expected one source: {name}')
            raw = z.read(members[0])
            if hashlib.sha256(raw).hexdigest() != expected:
                raise ValueError(f'Source checksum mismatch: {name}')
            with Image.open(io.BytesIO(raw)) as image:
                image.verify()
            data[name] = raw
    for name, raw in data.items():
        path = root / 'source' / name
        if path.exists() and path.read_bytes() != raw:
            raise ValueError(f'Refusing to overwrite different source: {path}')
    for name, raw in data.items():
        path = root / 'source' / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
    registry = {'version': 1, 'region': 'verdant_remnants', 'background': 'source/act01_verdant_remnants_map_background.png', 'icons': {}, 'frames': {}, 'review_pending': ['map_vfx_atlas.png','map_hud_atlas.png']}
    for kind, names, atlas, cols, cell in [
        ('icons', ICONS, 'encounter_icons_atlas.png', 4, 362),
        ('frames', FRAMES, 'encounter_node_frames_atlas.png', 3, 512),
    ]:
        image = Image.open(io.BytesIO(data[atlas])).convert('RGBA')
        assert image.size == (cols*cell, len(names)//cols*cell)
        for index, name in enumerate(names):
            x, y = index%cols*cell, index//cols*cell
            sprite = image.crop((x,y,x+cell,y+cell))
            alpha = sprite.getchannel('A')
            if kind == 'icons':
                alpha = alpha.point(lambda v: 0 if v <= 8 else v)
                sprite.putalpha(alpha)
                bounds = alpha.point(lambda v: 255 if v > 32 else 0).getbbox()
                sprite = sprite.crop(bounds)
                sprite.thumbnail((224,224), Image.Resampling.LANCZOS)
                canvas = Image.new('RGBA',(256,256))
                canvas.paste(sprite,((256-sprite.width)//2,(256-sprite.height)//2))
                sprite = canvas
            else:
                # Clear conservative inner aperture without removing ring geometry.
                ImageDraw.Draw(alpha).ellipse((130,115,380,365), fill=0)
                sprite.putalpha(alpha)
                sprite = sprite.resize((256,256), Image.Resampling.LANCZOS)
                assert sprite.getpixel((128,128))[3] == 0
            rel = f'runtime/{kind}/{name}.png'
            path = root / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            sprite.save(path)
            registry[kind][name] = {'path':rel,'size':[256,256],'anchor':[0.5,0.5]}
    (root/'runtime_manifest.json').write_text(json.dumps(registry,indent=2)+'\n',encoding='utf-8')
    print('Verified 5 sources; extracted 12 icons and 6 frames. HUD/VFX require manual review.')

if __name__ == '__main__':
    main()
