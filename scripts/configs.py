import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'src/lib/templates'
def pair(asset,y=.055,width=.15,x=.075,rot=-12):
 return [dict(id='default-left',asset=asset,x=x,y=y,width=width,rotation=rot),dict(id='default-right',asset=asset,x=1-x,y=y,width=width,rotation=-rot,mirrored=True)]
base=dict(margin=.10,gutter=.06,header=.16,footer=.35,frame=dict(side=.012,top=.012,bottom=.012))
configs=[
 ('classic-booth','Classic Booth','film','#FAF8F2','#2B2326',dict(header=.12,footer=.34),['white-frame'],['grain','date','caption'],pair('04-pearls.png',width=.12)),
 ('film-negative','Film Negative','film','#2A1E1A','#F8EAD7',dict(margin=.17,gutter=.11,header=.18,footer=.40,frame=dict(side=.015,top=.018,bottom=.018)),['sprockets','negative-number','edge-text'],['caption','date'],pair('20-gold-star-charm.png',width=.11)),
 ('slide-mount','Slide Mount','film','#EBEBE9','#49423F',dict(header=.15,footer=.31,frame=dict(side=.08,top=.07,bottom=.13)),['slide','mount-label'],['caption','date'],pair('14-blue-butterfly.png',width=.13)),
 ('contact-sheet','Contact Sheet','film','#F6F2E8','#242020',dict(gutter=.045,header=.14,footer=.32,frame=dict(side=.025,top=.025,bottom=.09)),['rebate','frame-number','favorite'],['grain','caption','date'],pair('10-film-negatives.png',width=.115)),
 ('instant-frames','Instant Frames','film','#F3E9E5','#423936',dict(gutter=.09,header=.16,footer=.16,frame=dict(side=.045,top=.045,bottom=.19)),['instant','last-caption'],['date'],pair('19-satin-scrunchie.png',width=.125)),
 ('clean-white','Clean White','open','#FFFFFF','#2B2326',dict(margin=.14,header=.19,footer=.46),['white-frame'],['hairline','serif-caption','caps-date'],pair('04-pearls.png',y=.045,width=.13)),
 ('blush-polka','Blush Polka','open','#FDE8ED','#6D3949',dict(margin=.12,header=.19,footer=.44,frame=dict(side=.04,top=.04,bottom=.04)),['white-frame'],['polka','serif-caption','caps-date'],[dict(id='default-top',asset='01-silk-bow.png',x=.5,y=.052,width=.18,rotation=0)]+pair('07-cherries.png',y=.962,x=.06,width=.13)),
 ('gingham','Gingham','open','#FFFFFF','#684550',dict(margin=.12,header=.18,footer=.47,frame=dict(side=.035,top=.035,bottom=.035)),['white-frame'],['gingham','ribbon','caption','caps-date'],pair('08-pink-tulip-bouquet.png',y=.065,width=.13)),
 ('love-letter','Love Letter','open','#FFF9EF','#895562',dict(margin=.14,gutter=.09,header=.20,footer=.48,frame=dict(side=.045,top=.045,bottom=.045)),['stamp'],['double-border','sign-off','caps-date'],[dict(id='default-top',asset='16-wax-sealed-envelope.png',x=.5,y=.04,width=.15,rotation=0)]+pair('18-cherry-blossoms.png',y=.966,x=.065,width=.125)),
 ('magazine','Magazine','open','#FFFFFF','#2B2326',dict(margin=.10,gutter=.045,header=.70,footer=.23,frame=dict(side=0,top=0,bottom=0)),[],['masthead','issue','caps-date'],pair('13-lipstick-kiss.png',y=.977,x=.08,width=.12))
]
ids=[]
for id,name,group,bg,ink,over,cell,card,stickers in configs:
 d=dict(base);d.update(over);d.update(id=id,name=name,group=group,doubling='twin' if group=='film' else 'continuous',background=bg,ink=ink,decorations=dict(cell=cell,card=card),stickers=stickers)
 (root/(id+'.ts')).write_text("import type {TemplateConfig} from './types.ts';\nconst config:TemplateConfig="+json.dumps(d,indent=2)+";\nexport default config;\n")
 ids.append(id)
(root/'index.ts').write_text('\n'.join(f"import t{i} from './{id}.ts';" for i,id in enumerate(ids))+f"\nexport const templates=[{','.join('t'+str(i) for i in range(10))}];\nexport const templateById=Object.fromEntries(templates.map(t=>[t.id,t]));\nexport {{computeLayout,layouts}} from './layout.ts';\nexport {{renderCard,preloadAssets,stickerFiles}} from './render.ts';\nexport type * from './types.ts';\n")
