"""Pack an authored layout into transparent sprites and a runtime registry entry."""
import argparse
import re
from PIL import Image, ImageOps
from compose2 import build
from registry import ROOT, store

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('key')
parser.add_argument('layout')
parser.add_argument('scale', type=float)
parser.add_argument('--name', required=True)
parser.add_argument('--template', choices=['floating','creature','humanoid','construct'], required=True)
args = parser.parse_args()
if not re.fullmatch(r'[a-z][a-z0-9_-]*',args.key) or args.scale <= 0:
    parser.error('Expected a lowercase rig ID and positive scale.')
layout, parts, (left, top, width, height), _ = build(args.layout)
dest = ROOT / 'assets/enemies' / args.key
dest.mkdir(parents=True, exist_ok=True)
mirror = layout.get('mirror', False)
bones = {'root': {'pivot': [width/2,height*.88]}}
layers = []
for part, image, x, y in parts:
    x, y = x-left, y-top
    pw, ph = image.size
    px, py = [float(v.rstrip('%'))/100 for v in part.get('o','50% 50%').split()]
    if mirror:
        image, x, px = ImageOps.mirror(image), width-x-pw, 1-px
    name = part['img']
    suffix = 1
    while name in bones:
        suffix += 1
        name = f"{part['img']}_{suffix}"
    parent = part.get('g','root')
    if parent not in bones:
        group = layout['groups'][parent]
        gx, gy = group['o']
        bones[parent] = dict(parent='root',pivot=[width-(gx-left) if mirror else gx-left,gy-top],motion=group['a'])
    bones[name] = dict(parent=parent,pivot=[x+px*pw,y+py*ph],motion=part.get('a',''))
    layers.append(dict(file=name,bone=name,rect=[x,y,pw,ph]))
    image.resize((max(1,round(pw*args.scale)),max(1,round(ph*args.scale))),Image.Resampling.LANCZOS).save(dest/(name+'.webp'),quality=93)
store(args.key, dict(name=args.name,template=args.template,size=[width,height],bones=bones,layers=layers))
