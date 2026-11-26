# One-off cutout script used during development. Paths point at the original upload and temp locations; edit them before reuse.
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage as nd
# idle: already transparent
a=Image.open('/mnt/user-data/uploads/650efeae-image.png').convert('RGBA')
# cast: key flat dark background via border flood fill
im=np.array(Image.open('/mnt/user-data/uploads/5b60b543-image.png').convert('RGB')).astype(float)
H,W,_=im.shape
# estimate smooth background by heavy blur of border-ish bg (use median filter of whole image rows edges)
bg=np.median(np.concatenate([im[:8].reshape(-1,3),im[-8:].reshape(-1,3),im[:,:8].reshape(-1,3),im[:,-8:].reshape(-1,3)]),axis=0)
d=np.sqrt(((im-bg)**2).sum(-1))
yy=np.arange(H)[:,None]*np.ones((1,W))
sat=im.max(-1)-im.min(-1);lum=im.mean(-1)
shadow=((yy>H*0.84)&(sat<12)&(lum<bg.mean()+3))|((yy>H*0.88)&(sat<20)&(lum<bg.mean()+2))
near=(d<12)|shadow
lab,n=nd.label(near)
border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
bgmask=np.isin(lab,list(border))
fg=~bgmask
fg=nd.binary_closing(fg,iterations=2)
holes=nd.binary_fill_holes(fg)&~fg;hl,hn=nd.label(holes);hs=nd.sum(holes,hl,range(1,hn+1));small=[i+1 for i,v in enumerate(hs) if v<2500];fg=fg|np.isin(hl,small)
lab2,n2=nd.label(fg);sz=nd.sum(fg,lab2,range(1,n2+1));keep=[int(np.argmax(sz))+1];fg=np.isin(lab2,keep)
alpha=np.clip((d-6)/14,0,1)            # soft ramp by distance
alpha=np.where(shadow,0,alpha)
xx=np.arange(W)[None,:]*np.ones((H,1))
alpha=np.where((xx<W*0.55)&(yy>H*0.945),0,alpha)
alpha=np.where(fg,np.maximum(alpha,nd.binary_erosion(fg,iterations=2)),0)
alpha=ndimage_blur=nd.gaussian_filter(alpha,0.6)
# decontaminate: unpremultiply bg out of edge pixels
al=np.clip(alpha,1e-3,1)[...,None]
col=np.clip((im-bg*(1-al))/al,0,255)
col=np.where(alpha[...,None]>0.98,im,col)
out=np.dstack([col,alpha*255]).astype(np.uint8)
b=Image.fromarray(out,'RGBA')
def norm(img,name,h=None):
    bb=img.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    img=img.crop(bb)
    img.save(f'/home/claude/slaytheslay/assets/{name}.webp',quality=90,method=6);img.save(f'/tmp/{name}.png')
    print(name,img.size)
    return img
i1=norm(a,'hero_idle');b2=np.array(b);hh,ww=b2.shape[:2]
bb=Image.fromarray(b2).getchannel('A').point(lambda v:255 if v>20 else 0).getbbox();x0,y0,x1,y1=bb
cut=y0+(y1-y0)*0.957;b2[int(cut):,:int(x0+(x1-x0)*0.55),3]=0
i2=norm(Image.fromarray(b2,'RGBA'),'hero_cast')
for n,i in [('idle',i1),('cast',i2)]:
    c=Image.new('RGBA',i.size,(40,140,90,255));c.alpha_composite(i);c.convert('RGB').save(f'/tmp/chk_{n}.jpg')
