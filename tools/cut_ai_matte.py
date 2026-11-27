# One-off cutout script used during development. Paths point at the original upload and temp locations; edit them before reuse.
from PIL import Image
import numpy as np
from scipy import ndimage as nd
out={}
for f,name in [('57c5f86a','attack'),('30b43041','hurt'),('e36c644d','cast2')]:
    src=Image.open(f'/mnt/user-data/uploads/{f}-image.png').convert('RGBA')
    wb=Image.new('RGBA',src.size,(255,255,255,255));wb.alpha_composite(src);w=np.array(wb.convert('RGB')).astype(float)
    rb=np.array(Image.open(f'/tmp/rb_{name}.png')).astype(float);a=rb[...,3]/255
    sat=w.max(-1)-w.min(-1);lum=w.mean(-1)
    sm=(sat<22)&(lum>70)&(lum<190)&(a>.3)
    lab,n=nd.label(sm);sz=nd.sum(sm,lab,range(1,n+1))
    big=np.isin(lab,[i+1 for i,v in enumerate(sz) if v>1800])
    big=nd.binary_dilation(big,iterations=3)
    a=np.where(big,0,a)
    # keep largest component of the figure plus anything big
    m=a>.5;lab,n=nd.label(m);sz=nd.sum(m,lab,range(1,n+1))
    keep=np.isin(lab,[i+1 for i,v in enumerate(sz) if v>max(sz)*0.02])
    keep=nd.binary_dilation(keep,iterations=2)
    a=np.where(keep,a,0)
    # colour: use the white-flattened painting, un-mixed from white at soft edges is unnecessary; use original rgb where source opaque
    rgb=np.array(src)[...,:3].astype(float)
    if name=='hurt':
        H,W=a.shape;yy,xx=np.mgrid[0:H,0:W];L=rgb.mean(-1);S=rgb.max(-1)-rgb.min(-1)
        dark=(L<62)&(S<34)&(xx>W*.6)&(yy<H*.44)
        lab,n=nd.label(dark);sz=nd.sum(dark,lab,range(1,n+1));dark=np.isin(lab,[i+1 for i,v in enumerate(sz) if v>800])
        a=np.where(nd.binary_dilation(dark,iterations=1),0,a)
    o=np.dstack([rgb,np.clip(a,0,1)*255]).astype(np.uint8)
    im=Image.fromarray(o,'RGBA')
    bb=im.getchannel('A').point(lambda v:255 if v>30 else 0).getbbox();im=im.crop(bb)
    im.save(f'assets/heroes/aether/{name}.webp',quality=90,method=6)
    c=Image.new('RGBA',im.size,(40,140,90,255));c.alpha_composite(im);out[name]=c.convert('RGB')
    print(name,im.size)
W=sum(i.width for i in out.values());c=Image.new('RGB',(W,max(i.height for i in out.values())));x=0
for i in out.values():c.paste(i,(x,0));x+=i.width
c.resize((max(1,W*512//c.height),512)).save('/tmp/chk_all.jpg')
