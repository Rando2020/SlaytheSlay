# One-off cutout script used during development. Paths point at the original upload and temp locations; edit them before reuse.
from rembg import remove, new_session
from PIL import Image
import numpy as np,sys
sess=new_session(sys.argv[1])
for f,name in [('57c5f86a','attack'),('30b43041','hurt'),('e36c644d','cast2')]:
    im=Image.open(f'/mnt/user-data/uploads/{f}-image.png').convert('RGBA')
    # flatten source alpha onto black first so model sees the painting
    base=Image.new('RGBA',im.size,(255,255,255,255));base.alpha_composite(im);rgb=base.convert('RGB')
    out=remove(rgb,session=sess,post_process_mask=True)
    out.save(f'/tmp/rb_{name}.png')
    c=Image.new('RGBA',out.size,(40,140,90,255));c.alpha_composite(out);c.convert('RGB').resize((341,512)).save(f'/tmp/chk_{name}.jpg')
    print(name)
