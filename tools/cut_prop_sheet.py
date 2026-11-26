# Splits a transparent prop sheet into one image per prop. Paths point at the original uploads; edit before reuse.
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage as nd
out=[]
for sheet,tag in [('22793dde','a'),('a4e9af10','b')]:
    full=np.array(Image.open(f'/mnt/user-data/uploads/{sheet}-image.png').convert('RGBA')).astype(float)
    im=full[...,:3];a=full[...,3]/255
    m=a>0.35
    grp=nd.binary_dilation(m,iterations=7)
    lab,n=nd.label(grp)
    for i,sl in enumerate(nd.find_objects(lab)):
        sub=(lab[sl]==i+1)&m[sl]
        if sub.sum()<2500: continue
        al=a[sl]*nd.binary_dilation(sub,iterations=4)
        rgb=im[sl]
        # unmix white from soft edges
        c=rgb
        img=Image.fromarray(np.dstack([c,al*255]).astype(np.uint8),'RGBA')
        bb=img.getchannel('A').point(lambda v:255 if v>25 else 0).getbbox();img=img.crop(bb)
        name=f'{tag}{len([o for o in out if o[0].startswith(tag)]):02d}'
        img.save(f'/tmp/props/{name}.png');out.append((name,img,(sl[1].start,sl[0].start)))
print(len(out))
# contact sheet
th=150;cols=8;rows=(len(out)+cols-1)//cols
cs=Image.new('RGB',(cols*170,rows*185),(40,30,30));dr=ImageDraw.Draw(cs)
for k,(nm,img,_) in enumerate(out):
    t=img.copy();t.thumbnail((160,th));x=(k%cols)*170+5;y=(k//cols)*185+5
    cs.paste(t,(x,y),t);dr.text((x,y+th+8),nm,fill=(255,220,120))
cs.save('/tmp/props_contact.jpg',quality=85)
