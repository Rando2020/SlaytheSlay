import json,sys,os
from PIL import Image,ImageOps
sys.path.insert(0,'.');from compose2 import build
key,lay,S=sys.argv[1],sys.argv[2],float(sys.argv[3])
L,out,(x0,y0,W,H),c=build(lay);mir=L.get('mirror')
D=f'/home/claude/slaytheslay/assets/enemies/{key}';os.makedirs(D,exist_ok=True)
for f in os.listdir(D):os.remove(f'{D}/{f}')
spec=[];names={}
for i,(p,im,x,y) in enumerate(out):
    if mir:im=ImageOps.mirror(im);x=x0+W-(x-x0)-im.width
    n=p['img'];names[n]=names.get(n,0)+1
    fn=n if names[n]==1 else f'{n}_{names[n]}'
    if not os.path.exists(f'{D}/{fn}.webp'):
        im.resize((max(1,round(im.width*S)),max(1,round(im.height*S))),Image.LANCZOS).save(f'{D}/{fn}.webp',quality=90,method=6)
    o=p.get('o','50% 50%')
    if mir:ox,oy=o.split();o=f'{100-float(ox[:-1]):g}% {oy}'
    e=[fn,round((x-x0)/W*100,2),round((y-y0)/H*100,2),round(im.width/W*100,2),p.get('a',''),o]
    g=p.get('g')
    if g:
        gd=L['groups'][g];gx,gy=gd['o'];px=(gx-x0)/W*100;py=(gy-y0)/H*100
        if mir:px=100-px
        if spec and isinstance(spec[-1],dict) and spec[-1]['g']==g:spec[-1]['p'].append(e)
        else:spec.append({'g':g,'a':gd['a'],'o':f'{px:.1f}% {py:.1f}%','p':[e]})
    else:spec.append(e)
if mir:c=ImageOps.mirror(c)
c.save(f'/home/claude/work/{key}_full.png')
print(json.dumps({'ar':round(W/H,3),'p':spec},separators=(',',':')))
