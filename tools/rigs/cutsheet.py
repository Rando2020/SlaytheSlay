import sys,os
from rembg import remove,new_session
from PIL import Image,ImageDraw
import numpy as np
from scipy import ndimage as nd
src,tag=sys.argv[1],sys.argv[2];os.makedirs(tag,exist_ok=True)
im=Image.open(src).convert('RGB')
out=remove(im,session=new_session('isnet-general-use'),post_process_mask=True);A=np.array(out)
a=A[...,3]>30;lab,n=nd.label(nd.binary_dilation(a,iterations=2));objs=nd.find_objects(lab)
c=Image.new('RGBA',out.size,(40,140,90,255));c.alpha_composite(out);d=ImageDraw.Draw(c);k=0
for i,sl in enumerate(objs):
    m=lab[sl]==i+1
    if m.sum()<600:continue
    cr=A[sl].copy();cr[...,3]=np.where(m,cr[...,3],0);p=Image.fromarray(cr,'RGBA');bb=p.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    if not bb:continue
    p=p.crop(bb);p.save(f'{tag}/p{k:02d}.png');x,y=sl[1].start+bb[0],sl[0].start+bb[1]
    d.rectangle([x,y,x+p.width,y+p.height],outline=(255,255,0));d.text((x+4,y+4),str(k),fill=(255,255,255));print(k,x,y,p.size);k+=1
c.convert('RGB').save(f'{tag}_idx.jpg')
