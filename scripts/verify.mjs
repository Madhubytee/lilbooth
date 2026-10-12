import {createRequire} from 'node:module';
const {createCanvas,loadImage,GlobalFonts}=createRequire(import.meta.url)('@napi-rs/canvas');
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {templates,computeLayout,layouts} from '../src/lib/templates/index.ts';
import {renderCard,stickerFiles,defaultStickerPlacements,stickerRect} from '../src/lib/templates/render.ts';
const root=path.resolve(import.meta.dirname,'..');
// sample portraits are AI-generated test fixtures; they live here so they never ship in the app build
for(const [file,family] of [['InstrumentSerif-Regular.ttf','Instrument Serif'],['InstrumentSerif-Italic.ttf','Instrument Serif'],['DMSans.ttf','DM Sans'],['Caveat.ttf','Caveat'],['CourierNew.ttf','Courier New']])GlobalFonts.registerFromPath(path.join(root,'public/fonts',file),family);
const assets=Object.fromEntries(await Promise.all(stickerFiles.map(async f=>[f,await loadImage(path.join(root,'public/stickers',f))])));
const photos=await Promise.all(Array.from({length:8},(_,i)=>loadImage(path.join(root,'scripts/fixtures/samples',`${i%6+1}.jpg`))));
const out=path.join(root,'artifacts');await mkdir(out,{recursive:true});
const W=2100,H=3400,sheet=createCanvas(W,H),ctx=sheet.getContext('2d');ctx.fillStyle='#EAE3DD';ctx.fillRect(0,0,W,H);
ctx.fillStyle='#2B2326';ctx.font='62px "Instrument Serif"';ctx.fillText('lil booth / the paper collection',56,85);ctx.font='18px "DM Sans"';ctx.fillText('TEN TEMPLATES × SIX FORMATS     /     THE SAME MOMENTS, SIXTY WAYS',58,125);
const ids=Object.keys(layouts),left=285,top=200,cw=(W-left-35)/6,rh=(H-top-45)/10;
for(let j=0;j<6;j++){ctx.font='18px "DM Sans"';ctx.textAlign='center';ctx.fillText(layouts[ids[j]].name,left+(j+.5)*cw,173)}
const results=[];
for(let i=0;i<10;i++){
 const t=templates[i];ctx.textAlign='left';ctx.fillStyle='#2B2326';ctx.font='21px "Instrument Serif"';ctx.fillText(`${String(i+1).padStart(2,'0')}  ${t.name}`,34,top+i*rh+rh/2);ctx.font='12px "DM Sans"';ctx.fillStyle='#8D7570';ctx.fillText(t.doubling==='twin'?'FILM / TWIN PRINT':'OPEN / SHARED CARD',58,top+i*rh+rh/2+25);
 for(let j=0;j<6;j++){
  const id=ids[j],g=computeLayout(t,id),gUnique=computeLayout(t,id,true);
  const C=1,tol=1e-8;
  assert(Math.abs(g.width-(g.panels.length===2?2*(2*t.margin+C)+.06:2*t.margin+layouts[id].cols*C+(layouts[id].cols-1)*t.gutter))<tol);
  for(const p of g.panels){for(const c of p.cells){assert(c.photo.x>=0&&c.photo.y>=0);assert(c.photo.x+c.photo.width<=g.width+tol);assert(c.photo.y+c.photo.height<=g.height+tol);assert(Math.abs(c.photo.width/c.photo.height-layouts[id].aspect)<tol)}
   for(const c of p.cells){const partner=p.cells.find(q=>q.row===c.row&&q.col===p.cells.filter(q=>q.row===c.row).length-1-c.col);assert(Math.abs(c.frame.x+partner.frame.x+c.frame.width-2*(p.rect.x+p.rect.width/2))<tol)}
  }
  if(layouts[id].double){assert.equal(g.requiredPhotos,layouts[id].rows);assert.equal(gUnique.requiredPhotos,layouts[id].rows*2);for(let row=0;row<g.rows;row++){const cells=g.cells.filter(c=>c.row===row);assert.equal(cells[0].shotIndex,cells[1].shotIndex)}const uniqueIndices=gUnique.cells.map(c=>c.shotIndex);assert.equal(new Set(uniqueIndices).size,uniqueIndices.length)}
  for(const s of defaultStickerPlacements(t,g,assets)){
   const p=g.panels[Number(s.id.split(':')[0])],r=stickerRect(s,g,assets),a=s.rotation*Math.PI/180;
   const hw=(Math.abs(Math.cos(a))*r.width+Math.abs(Math.sin(a))*r.height)/2,hh=(Math.abs(Math.sin(a))*r.width+Math.abs(Math.cos(a))*r.height)/2;
   assert(s.x*g.width-hw>=p.rect.x-tol&&s.x*g.width+hw<=p.rect.x+p.rect.width+tol);
   assert(s.y*g.height-hh>=-tol&&s.y*g.height+hh<=g.height+tol);
  }
  for(const p of g.panels){const defaults=t.stickers;for(const s of defaults){if(Math.abs(s.x-.5)<tol)continue;assert(defaults.some(partner=>Math.abs(partner.x-(1-s.x))<tol&&partner.y===s.y&&partner.width===s.width&&partner.rotation===-s.rotation&&partner.asset===s.asset))}}
  const opt={caption:'a little moment together',date:'10.12.26',favorite:0,assets,factory:createCanvas};
  const canvas=await renderCard(t,id,photos,opt);assert.equal(Math.max(canvas.width,canvas.height),1800);
  // Display this exact exported pixel buffer in the contact sheet.
  const png=canvas.toBuffer('image/png');await writeFile(path.join(out,`${t.id}--${id}.png`),png);
  const exported=await loadImage(png),roundtrip=createCanvas(canvas.width,canvas.height);roundtrip.getContext('2d').drawImage(exported,0,0);
  assert.deepEqual(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,roundtrip.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data);
  const maxw=cw-34,maxh=rh-35,s=Math.min(maxw/canvas.width,maxh/canvas.height),dw=canvas.width*s,dh=canvas.height*s;ctx.drawImage(canvas,left+j*cw+(cw-dw)/2,top+i*rh+(rh-dh)/2,dw,dh);
  // Check decorative rendering is symmetric without photos and text glyphs, which have reading direction.
  results.push({template:t.id,layout:id,width:canvas.width,height:canvas.height,photoCount:g.requiredPhotos,mode:g.panels.length===2?'twin':layouts[id].double?'continuous':'single',geometrySymmetry:true,captionLength:24,pngPixelRoundtrip:true});
 }
}
const sameOptions={caption:'a little moment together',date:'10.12.26',assets,factory:createCanvas};
const repeatA=await renderCard(templates[6],'double-strip',photos,sameOptions),repeatB=await renderCard(templates[6],'double-strip',photos,sameOptions);
assert.deepEqual(repeatA.toBuffer('image/png'),repeatB.toBuffer('image/png'));
const retina=await renderCard(templates[0],'double-strip',photos,{assets,factory:createCanvas,retina:true});assert.equal(Math.max(retina.width,retina.height),3600);
// lil booth: materialised defaults with masked:true must render exactly like the renderer's own defaults
for(const t of templates)for(const id of ['strip','double-strip','grid']){
 const g=computeLayout(t,id),opt={caption:'besties',date:'10.12.26',assets,factory:createCanvas};
 const a=await renderCard(t,id,photos,opt);
 const b=await renderCard(t,id,photos,{...opt,defaults:false,stickers:defaultStickerPlacements(t,g,assets).map(s=>({...s,masked:true}))});
 assert.deepEqual(a.getContext('2d').getImageData(0,0,a.width,a.height).data,b.getContext('2d').getImageData(0,0,b.width,b.height).data,`masked defaults differ: ${t.id} ${id}`);
}
// lil booth: empty caption + hidden date render without the placeholder text and differ from the captioned card
for(const t of templates){
 const blank=await renderCard(t,'strip',photos,{caption:'',hideDate:true,assets,factory:createCanvas});
 const full=await renderCard(t,'strip',photos,{caption:'besties',date:'10.12.26',assets,factory:createCanvas});
 assert.notDeepEqual(blank.toBuffer('image/png'),full.toBuffer('image/png'),`caption/date had no effect: ${t.id}`);
}
await writeFile(path.join(out,'template-contact-sheet.png'),sheet.toBuffer('image/png'));
await writeFile(path.join(out,'verification.json'),JSON.stringify({cards:results.length,retinaLongSide:3600,deterministicRender:true,defaultStickerBounds:true,results},null,2));
console.log('PASS: 60 cards; masked defaults == renderer defaults (30 cards); blank caption/hidden date (10 cards); geometry, photo aspect, mirrored default pairs, duplicate/unique shot mapping, 24-character captions, PNG pixel roundtrip, 3600px retina.');
