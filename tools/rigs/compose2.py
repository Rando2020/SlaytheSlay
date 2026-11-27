import json,sys
from PIL import Image,ImageOps
def build(lay):
    L=json.load(open(lay));d=L['dir'];out=[]
    for p in L['parts']:
        im=Image.open(f"{d}/{p['img']}.png")
        if p.get('flip'):im=ImageOps.mirror(im)
        if p.get('s',1)!=1:im=im.resize((round(im.width*p['s']),round(im.height*p['s'])),Image.LANCZOS)
        if p.get('r'):im=im.rotate(p['r'],resample=Image.BICUBIC,expand=True);im=im.crop(im.getchannel('A').getbbox())
        x=round(p['cx']-im.width/2);y=round(p['cy']-im.height/2);out.append((p,im,x,y))
    x0=min(o[2] for o in out);y0=min(o[3] for o in out);x1=max(o[2]+o[1].width for o in out);y1=max(o[3]+o[1].height for o in out)
    c=Image.new('RGBA',(x1-x0,y1-y0))
    for p,im,x,y in out:c.alpha_composite(im,(x-x0,y-y0))
    return L,out,(x0,y0,x1-x0,y1-y0),c
if __name__=='__main__':
    L,out,bb,c=build(sys.argv[1])
    ref=Image.open(sys.argv[2]) if len(sys.argv)>2 else None
    H=600;c2=c.resize((round(c.width*H/c.height),H))
    parts=[c2]
    if ref:parts.append(ref.resize((round(ref.width*H/ref.height),H)))
    o=Image.new('RGBA',(sum(p.width for p in parts)+20,H),(60,70,80,255));x=0
    for p in parts:o.alpha_composite(p,(x,0));x+=p.width+20
    o.convert('RGB').save(sys.argv[1].replace('.json','.png'));print(bb)
