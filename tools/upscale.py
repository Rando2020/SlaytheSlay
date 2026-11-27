# AI upscale with Real-ESRGAN x4plus (CPU), tiled with overlap.
# Usage: python3 tools/upscale.py MODEL.pth IN.png OUT.webp [target_width]
# RGBA inputs: colour goes through the model, alpha is resized with Lanczos.
import sys, numpy as np, torch
from PIL import Image
from spandrel import ModelLoader

def upscale(model, img, tile=256, pad=16):
    x = torch.from_numpy(np.asarray(img, dtype=np.float32) / 255).permute(2, 0, 1)[None]
    _, _, H, W = x.shape; s = model.scale
    out = torch.zeros(1, 3, H * s, W * s)
    for y0 in range(0, H, tile):
        for x0 in range(0, W, tile):
            y1, x1 = min(y0 + tile, H), min(x0 + tile, W)
            ya, xa, yb, xb = max(0, y0 - pad), max(0, x0 - pad), min(H, y1 + pad), min(W, x1 + pad)
            with torch.no_grad():
                o = model(x[:, :, ya:yb, xa:xb])
            out[:, :, y0 * s:y1 * s, x0 * s:x1 * s] = o[:, :, (y0 - ya) * s:(y0 - ya + y1 - y0) * s, (x0 - xa) * s:(x0 - xa + x1 - x0) * s]
    a = (out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8)
    return Image.fromarray(a)

if __name__ == '__main__':
    torch.set_num_threads(max(1, torch.get_num_threads()))
    model = ModelLoader().load_from_file(sys.argv[1]).eval()
    src = Image.open(sys.argv[2]); tw = int(sys.argv[4]) if len(sys.argv) > 4 else None
    rgba = src.mode in ('RGBA', 'LA') or 'transparency' in src.info
    big = upscale(model, src.convert('RGB'))
    if rgba:
        al = src.convert('RGBA').getchannel('A').resize(big.size, Image.LANCZOS)
        big = big.convert('RGBA'); big.putalpha(al)
    if tw and big.width != tw:
        big = big.resize((tw, round(big.height * tw / big.width)), Image.LANCZOS)
    big.save(sys.argv[3], quality=90, method=6)
    print(sys.argv[3], big.size)
