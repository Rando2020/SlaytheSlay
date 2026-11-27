import argparse,json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
NAMES=['misty_sanctuary_among_ruins.png','dark_fantasy_encounter_icon_set.png','a_clean_graphic_design_sprite_sheet_on_a_transpare.png','a_high_resolution_png_style_spritesheet_asset_shee.png','a_clean_png_asset_sheet_on_a_transparent_checkerbo.png']
def main():
 p=argparse.ArgumentParser(description='Audit original map images; only extract uniformly gridded icon/frame sheets with real alpha.');p.add_argument('source',type=Path);p.add_argument('--output',type=Path,default=Path('output/map-assets'));a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True);report=[]
 for name in NAMES:
  file=a.source/name
  if not file.is_file():report.append({'source':name,'status':'missing; dimensions and alpha cannot be inspected'});continue
  im=Image.open(file);alpha=im.getchannel('A') if 'A' in im.getbands() else None
  stats={'source':name,'dimensions':im.size,'mode':im.mode,'alpha_extrema':alpha.getextrema() if alpha else None};report.append(stats)
  if name==NAMES[0]:stats['status']='Environment; opaque background is acceptable';continue
  if alpha is None or alpha.getextrema()[0]==255:stats['status']='BLOCKED: baked opaque background; no automatic checkerboard removal';continue
  if name not in NAMES[1:3]:stats['status']='Real alpha detected. Irregular effects/HUD require measured individual crop rectangles; no guessed grid.';continue
  cols,rows=(4,3) if name==NAMES[1] else (3,2)
  if im.width%cols or im.height%rows:stats['status']='BLOCKED: dimensions not divisible by requested grid; measure actual bounds';continue
  cw,ch=im.width//cols,im.height//rows;stats['cell_dimensions']=[cw,ch];stats['sprites']=[];contact=Image.new('RGB',(cols*160,rows*100),'#182426');draw=ImageDraw.Draw(contact)
  for i in range(cols*rows):
   box=((i%cols)*cw,(i//cols)*ch,(i%cols+1)*cw,(i//cols+1)*ch);cell=im.crop(box).convert('RGBA');bbox=cell.getchannel('A').getbbox()
   if not bbox:continue
   # Frames retain original opening/geometry; do not normalize each silhouette independently.
   crop=cell if name==NAMES[2] else cell.crop(bbox);sprite=Image.new('RGBA',(256,256));fit=ImageOps.contain(crop,(224,224),Image.Resampling.LANCZOS);sprite.alpha_composite(fit,((256-fit.width)//2,(256-fit.height)//2));out=a.output/(file.stem+'-'+str(i)+'.png');sprite.save(out)
   stats['sprites'].append({'index':i,'atlas':box,'trim':bbox,'normalized':[256,256],'anchor':[.5,.5],'output':out.name})
   x=(i%cols)*160;y=(i//cols)*100
   for j,size in enumerate([40,48]):
    small=sprite.resize((size,size),Image.Resampling.LANCZOS);contact.paste(small,(x+j*75+10,y+10),small);draw.text((x+j*75+10,y+65),str(size)+' px',fill='white')
  contact.save(a.output/(file.stem+'-40-48px.png'));stats['status']='Extracted candidates. Inspect contact sheet for readability, baked checker patterns inside alpha and aligned frame geometry before promotion.'
 (a.output/'audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':main()
