"""Create QA coordinate-grid previews ONLY (not meteorological forecasts)."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from worldfile import WorldFile
OUT=ROOT/'tests/v7-screenshots'
OUT.mkdir(parents=True,exist_ok=True)
for region in ['europe','levant']:
    image=Image.open(ROOT/'site/images/maps'/f'{region}-base.webp').convert('RGB')
    image.thumbnail((1000,1400),Image.Resampling.LANCZOS)
    W,H=image.size;orig={'europe':(4500,5625),'levant':(3240,4050)}[region]
    fx=W/orig[0];fy=H/orig[1]
    wf=WorldFile.read(ROOT/'tools/georef'/f'{region}.pgw')
    d=ImageDraw.Draw(image,'RGBA')
    west,north,east,south=wf.verify(region,*orig)
    for lo in range(-10,61,5):
        if west<lo<east:
            x,_=wf.lonlat_to_image(lo,40)
            xx=int(x*fx)
            d.line((xx,0,xx,H),fill=(91,225,245,105),width=2)
            d.text((xx+3,8),f'{lo}E',fill=(245,255,255,255),stroke_width=2,stroke_fill=(4,17,28,220))
    for la in range(10,66,5):
        if south<la<north:
            _,y=wf.lonlat_to_image(36,la)
            yy=int(y*fy)
            d.line((0,yy,W,yy),fill=(91,225,245,105),width=2)
            d.text((6,yy+4),f'{la}N',fill=(245,255,255,255),stroke_width=2,stroke_fill=(4,17,28,220))
    towns={'europe':[('Paris',2.35,48.86),('Jerusalem',35.22,31.77)],'levant':[('Jerusalem',35.22,31.77),('Damascus',36.29,33.51),('Amman',35.93,31.95)]}[region]
    for name,lon,lat in towns:
        x,y=wf.lonlat_to_image(lon,lat)
        xx=int(x*fx);yy=int(y*fy)
        d.ellipse((xx-5,yy-5,xx+5,yy+5),fill=(255,225,90,255),outline=(11,29,42,255),width=2)
        d.text((xx+9,yy-13),name,fill=(255,255,255,255),stroke_width=2,stroke_fill=(4,17,28,240))
    d.rounded_rectangle((7,H-40,min(W-8,480),H-7),radius=9,fill=(2,20,35,220))
    d.text((17,H-32),'COORDINATE ALIGNMENT ONLY — NOT WEATHER DATA',fill=(220,244,255,255))
    image.save(OUT/f'{region}-coordinate-check.jpg',quality=90,optimize=True)
    print(region,W,H,OUT/f'{region}-coordinate-check.jpg')
