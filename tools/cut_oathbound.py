# Cut the Oathbound poses out of their flat gray backgrounds.
# Usage: python3 tools/cut_oathbound.py   (run from the repo root)
# Writes assets/oath/<pose>.webp plus green-backed check images in /tmp.
from PIL import Image
import numpy as np
from scipy import ndimage as nd

SRC = 'art/source/oathbound/poses/'
POSES = [('01-idle', 'idle'), ('02-attack', 'attack'), ('03-hurt', 'hurt'),
         ('04-oath-invocation', 'cast'), ('05-oath-sworn', 'power')]


def background(im):
    """Fit a smooth plane to the border pixels so gentle gradients key out too."""
    H, W, _ = im.shape
    ys, xs = np.mgrid[0:H, 0:W]
    m = np.zeros((H, W), bool)
    m[:10] = m[-10:] = True
    m[:, :10] = m[:, -10:] = True
    A = np.c_[xs[m], ys[m], np.ones(m.sum())]
    bg = np.zeros_like(im)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, im[..., c][m], rcond=None)
        bg[..., c] = coef[0] * xs + coef[1] * ys + coef[2]
    return bg


def cut(path, name):
    im = np.array(Image.open(path).convert('RGB')).astype(float)
    H, W, _ = im.shape
    bg = background(im)
    d = np.sqrt(((im - bg) ** 2).sum(-1))
    near = d < 11
    lab, _ = nd.label(near)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    fg = ~np.isin(lab, list(border))

    if name == 'attack':
        # Erase the painted cream swing arc in front of him; the game draws its own arc per oath.
        # Everything in front of his body is arc or background, except the blade itself.
        ys, xs = np.mgrid[0:H, 0:W]
        zone = ((xs > 732) & (ys > 370) & (ys < 775)) | ((xs > 586) & (ys > 629 + (xs - 495) * 33 / 491 + 3) & (ys < 745)) | ((xs > 650) & (ys > 613) & (ys < 597 + (xs - 495) * 65 / 491 - 1))
        poly = Image.new('L', (W, H), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(poly).polygon([(495, 597), (986, 662), (495, 629)], fill=255)
        blade = np.array(poly) > 0
        fg &= ~(zone & ~blade)

    fg = nd.binary_opening(fg, iterations=1)
    holes = nd.binary_fill_holes(fg) & ~fg
    hl, hn = nd.label(holes)
    if hn:
        hs = nd.sum(holes, hl, range(1, hn + 1))
        fg |= np.isin(hl, [i + 1 for i, v in enumerate(hs) if v < 400])
    lab, n = nd.label(fg)
    sz = nd.sum(fg, lab, range(1, n + 1))
    keep = [i + 1 for i, v in enumerate(sz) if v > sz.max() * 0.004]
    fg = np.isin(lab, keep)

    alpha = np.clip((d - 7) / 16, 0, 1)
    alpha = np.where(fg, np.maximum(alpha, nd.binary_erosion(fg, iterations=2)), 0)
    alpha = nd.gaussian_filter(alpha, 0.6) * fg
    # Pull the gray background out of soft edge pixels.
    al = np.clip(alpha, 1e-3, 1)[..., None]
    col = np.clip((im - bg * (1 - al)) / al, 0, 255)
    col = np.where(alpha[..., None] > 0.97, im, col)
    out = Image.fromarray(np.dstack([col, alpha * 255]).astype(np.uint8), 'RGBA')
    bb = out.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    out = out.crop(bb)
    out.save(f'assets/oath/{name}.webp', quality=90, method=6)
    chk = Image.new('RGBA', out.size, (40, 140, 90, 255))
    chk.alpha_composite(out)
    chk.convert('RGB').save(f'/tmp/chk_oath_{name}.jpg', quality=85)
    print(name, 'crop', bb, 'size', out.size)


if __name__ == '__main__':
    for f, n in POSES:
        cut(SRC + f + '.png', n)
