"""Rebuild the knight's transparent rest-pose sprites from the supplied paintings."""
import math
from registry import store, ROOT
import numpy as np
from PIL import Image, ImageDraw, ImageOps
from scipy import ndimage

SOURCE = ROOT / 'art/source/enemies'
DEST = ROOT / 'assets/enemies/cathedralknight'
DEST.mkdir(exist_ok=True)
sheet = Image.open(SOURCE / 'cathedral-knight-parts-sheet.png').convert('RGB')
reference = Image.open(SOURCE / 'cathedral-knight-reference.png').crop((592,432,862,842))
rgb = np.asarray(sheet).astype(float)
distance = np.max(abs(rgb - np.median(rgb[:,0], axis=0)), axis=2)
components, _ = ndimage.label(ndimage.binary_closing(distance > 17,iterations=2))
sprites = {}
# A seed inside each part selects its connected silhouette, even when bounds overlap.
for name, seed in dict(spear=(62,185), halo=(374,31), head=(198,55), cape=(556,110),
    torso=(199,157), far_upper=(322,142), near_upper=(403,147), far_lower=(296,220),
    near_lower=(372,227), belt=(183,252), tabard=(282,417), ribbon=(321,405),
    far_thigh=(148,334), near_thigh=(224,332), far_boot=(135,419), near_boot=(221,426)).items():
    x,y=seed
    nearby=components[y*2-12:y*2+13,x*2-12:x*2+13];label=np.bincount(nearby[nearby>0]).argmax()
    assert label, name
    mask=components==label
    # Fill enclosed armour highlights while retaining open negative spaces.
    holes=ndimage.binary_fill_holes(mask) & ~mask
    hl,_=ndimage.label(holes)
    small=np.bincount(hl.ravel())<260
    mask |= small[hl] & holes
    alpha=Image.fromarray((mask*255).astype('uint8'))
    part=sheet.convert('RGBA');part.putalpha(alpha);part=part.crop(alpha.getbbox())
    if name.endswith('_lower'):part=part.crop((0,0,part.width,round(part.height*.63)))
    sprites[name]=part
# Trace the two distinct, closed gauntlets already painted around the spear.
grips={
 'far_grip':[(157,99),(177,86),(183,75),(192,70),(200,59),(213,54),(223,49),(231,57),(243,52),(256,57),(261,67),(260,82),(251,91),(252,102),(243,111),(238,125),(222,136),(211,137),(200,128),(191,119),(177,134),(165,134),(154,123)],
 'near_grip':[(24,276),(35,279),(44,279),(53,284),(65,284),(76,289),(86,296),(98,302),(111,315),(105,326),(107,344),(102,357),(95,361),(91,351),(86,367),(79,375),(72,372),(73,351),(66,338),(64,354),(57,372),(51,376),(46,369),(47,349),(43,342),(43,327),(35,320),(31,306)]}
for name, polygon in grips.items():
    mask=Image.new('L',reference.size);ImageDraw.Draw(mask).polygon(polygon,fill=255)
    part=reference.convert('RGBA');part.putalpha(mask);sprites[name]=ImageOps.mirror(part.crop(mask.getbbox()))
rig=dict(name='Fallen Cathedral Knight',template='humanoid',size=[500,530],
         bones={'root':dict(pivot=[286,482])},layers=[])
def layer(name,center,width,bone='root',motion=None,pivot=None,angle=0):
    part=sprites[name];factor=2*width/part.width
    part=part.resize((round(part.width*factor),round(part.height*factor)),Image.Resampling.LANCZOS)
    part=part.rotate(-angle,Image.Resampling.BICUBIC,expand=True)
    w,h=part.width/2,part.height/2
    part.save(DEST/(name+'.webp'),quality=93)
    if motion:
        rig['bones'][name]=dict(parent=bone,pivot=pivot,motion=motion)
        bone=name
    rig['layers'].append(dict(file=name,bone=bone,rect=[center[0]-w/2,center[1]-h/2,w,h]))
def segment(name,start,end,anchors,bone):
    # Orient the painted joint-to-joint vector onto the authored skeleton.
    part=sprites[name];w,h=part.size
    (ax,ay),(bx,by)=anchors
    dx,dy=end[0]-start[0],end[1]-start[1]
    vx,vy=(bx-ax)*w,(by-ay)*h
    scale=math.hypot(dx,dy)/math.hypot(vx,vy)
    theta=math.atan2(dy,dx)-math.atan2(vy,vx)
    ox,oy=(.5-ax)*w*scale,(.5-ay)*h*scale
    center=[start[0]+ox*math.cos(theta)-oy*math.sin(theta),start[1]+ox*math.sin(theta)+oy*math.cos(theta)]
    layer(name,center,w*scale,bone,angle=math.degrees(theta))
layer('cape',[347,317],209,motion='sway',pivot=[298,197])
layer('halo',[273,123],104,motion='hover',pivot=[273,123])
layer('far_boot',[247,433],61);layer('far_thigh',[262,351],47)
layer('near_boot',[307,432],60);layer('near_thigh',[315,351],45)
layer('ribbon',[311,374],31,motion='sway2',pivot=[311,287])
layer('tabard',[271,374],52,motion='sway',pivot=[279,285])
layer('belt',[283,293],84);layer('torso',[279,227],105)
layer('head',[298,147],140,motion='nod',pivot=[266,183])
rig['bones']['spear']=dict(parent='root',pivot=[231,270])
# Shaft landmarks come from the extracted image; both sockets lie on the shaft.
segment('spear',[129,38],[329,501],[(.64,0),(.54,1)],'spear')
arms=[]
for side,a,b,c,bend in [('far',[252,204],[252,251],[209,225],-1),('near',[302,207],[311,282],[248,314],-1)]:
    upper,lower,hand=[side+'_'+suffix for suffix in ['upper','lower','grip']]
    rig['bones'][upper]=dict(parent='root',pivot=a)
    rig['bones'][lower]=dict(parent=upper,pivot=b)
    rig['bones'][hand]=dict(parent='spear',pivot=c)
    segment(upper,a,b,[(.53,.20),(.43,.90)],upper)
    segment(lower,b,c,[(.68,.13),(.23,.91)],lower)
    layer(hand,c,27 if side=='far' else 25,hand)
    arms.append(dict(upper=upper,lower=lower,socket=c,bend=bend))
rig['spear']=dict(bone='spear',arms=arms)
# Draw haft over the forearms and below the fingers.
layers=rig['layers'];spear=next(l for l in layers if l['file']=='spear')
layers.remove(spear);hands=[l for l in layers if l['file'].endswith('_grip')]
for hand in hands:layers.remove(hand)
layers.extend([spear,*hands])
store('cathedralknight',rig)
