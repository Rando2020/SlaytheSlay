"""Capture the lab, verify edit persistence, and play an enemy turn in Chromium."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from threading import Thread
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--chromium', help='Optional Chromium executable')
args = parser.parse_args()
dest = ROOT/'tools/rigs/evidence'
server = ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=args.chromium,args=['--no-sandbox','--no-zygote','--disable-gpu'])
    page = browser.new_page(viewport={'width':1180,'height':800},reduced_motion='reduce')
    errors = []
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.on('response',lambda r:errors.append(f'{r.status} {r.url}') if r.status >= 400 else None)
    page.goto(f'http://127.0.0.1:{server.server_port}')
    page.get_by_role('link',name='Enemy Animation Lab').click()
    page.select_option('#enemy','cathedralknight')
    page.select_option('#bone','head')
    page.locator('#angle').fill('4');page.reload()
    page.select_option('#enemy','cathedralknight');page.select_option('#bone','head')
    assert page.locator('#angle').input_value()=='4'
    page.click('#reset');page.select_option('#bone','head')
    assert page.locator('#angle').input_value()=='0'
    page.select_option('#state','attack')
    frames=[]
    for i in range(21):
        page.locator('#timeline').fill(str(i*50))
        frames.append(Image.open(BytesIO(page.locator('.scene').screenshot())).convert('RGB'))
    frames[0].save(dest/'knight-thrust.webp',save_all=True,append_images=frames[1:],duration=40,loop=0,quality=87)
    page.screenshot(path=dest/'lab.png')
    page.get_by_role('link',name='Return to game').click()
    page.wait_for_function('performance.now()>400')
    page.click('[data-a="new"]')
    page.click('[data-a="hero"][data-v="aether"]')
    # Choose the two-Tick encounter on the first floor, through the game UI.
    page.evaluate('Math.random=()=>0.5')
    page.locator('.node.can').first.click()
    page.wait_for_selector('[data-rig="aethertick"]')
    assert page.locator('[data-rig] image').count()==22
    page.click('[data-a="end"]')
    page.wait_for_function("document.querySelector('.hint')?.textContent==='Your turn 2'")
    assert page.locator('#f0 .chip.blk').inner_text()=='4'
    page.screenshot(path=dest/'combat.png')
    assert not errors, errors
    browser.close()
server.server_close()
