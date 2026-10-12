import {computeLayout} from './layout.ts';
import type {TemplateConfig,LayoutId,RenderOptions,Rect,Sticker,Cell,Geometry,Panel} from './types.ts';
export const stickerFiles=['01-silk-bow.png','02-tin-rocket.png','03-silver-heart-locket.png','04-pearls.png','05-iridescent-sparkle.png','06-white-daisy.png','07-cherries.png','08-pink-tulip-bouquet.png','09-cream-film-camera.png','10-film-negatives.png','11-disco-ball.png','12-champagne-coupe.png','13-lipstick-kiss.png','14-blue-butterfly.png','15-perfume-bottle.png','16-wax-sealed-envelope.png','17-blank-instant-photo-frame.png','18-cherry-blossoms.png','19-satin-scrunchie.png','20-gold-star-charm.png'];
let cached:Promise<Record<string,any>>|undefined;
export async function preloadAssets(base=''):Promise<Record<string,any>> {
 if(cached)return cached;
 cached=(async()=>{
  if(typeof document!=='undefined'){
   // Fonts come from the app's @font-face rules (src/styles/fonts.css); just make sure they're loaded.
   await Promise.all(['16px "Instrument Serif"','italic 16px "Instrument Serif"','16px "DM Sans"','16px "Caveat"','16px "Courier New"'].map(f=>document.fonts.load(f)));
   await document.fonts.ready;
  }
  const entries=await Promise.all(stickerFiles.map(async file=>{
   const img=new Image();img.crossOrigin='anonymous';img.src=`${base}/stickers/${file}`;await img.decode();return [file,img];
  }));return Object.fromEntries(entries);
 })();
 try{return await cached}catch(e){cached=undefined;throw e}
}
function fill(ctx:any,r:Rect,color:string){ctx.fillStyle=color;ctx.fillRect(r.x,r.y,r.width,r.height)}
function stroke(ctx:any,r:Rect,color:string,width=.004){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.strokeRect(r.x,r.y,r.width,r.height)}
function text(ctx:any,s:string,x:number,y:number,max:number,size:number,font:string,color:string,italic=false){
 ctx.save();ctx.translate(x,y);const m=ctx.getTransform(),scale=Math.hypot(m.a,m.b);ctx.scale(1/scale,1/scale);
 ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
 if(ctx.letterSpacing&&ctx.letterSpacing!=='0px')ctx.letterSpacing=`${parseFloat(ctx.letterSpacing)*scale}px`;
 let f=size*scale;ctx.font=`${italic?'italic ':''}${f}px "${font}"`;
 if(ctx.measureText(s).width>max*scale){f*=max*scale/ctx.measureText(s).width;ctx.font=`${italic?'italic ':''}${f}px "${font}"`}
 const width=ctx.measureText(s).width/scale;ctx.fillText(s,0,0);ctx.restore();return width;
}
function crop(ctx:any,img:any,r:Rect){
 if(!img){fill(ctx,r,'#DED6D1');ctx.save();ctx.strokeStyle='#C1B2A9';ctx.lineWidth=.006;ctx.strokeRect(r.x+.04,r.y+.04,r.width-.08,r.height-.08);text(ctx,'your moment',r.x+r.width/2,r.y+r.height/2,r.width*.75,.095,'Instrument Serif','#897B73',true);ctx.restore();return}
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
 const factor=Math.max(r.width/iw,r.height/ih),sw=r.width/factor,sh=r.height/factor;
 ctx.drawImage(img,(iw-sw)/2,(ih-sh)/2,sw,sh,r.x,r.y,r.width,r.height);
}
function grain(ctx:any,p:Panel){
 // Deterministic reflected speckles. Every mark has its mirror partner.
 let seed=347;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 ctx.fillStyle='rgba(63,49,37,.045)';
 for(let i=0;i<700;i++){const x=rnd()*p.rect.width/2,y=rnd()*p.rect.height,s=.0015+rnd()*.002;ctx.fillRect(p.rect.x+x,y,s,s);ctx.fillRect(p.rect.x+p.rect.width-x-s,y,s,s)}
}
function background(ctx:any,t:TemplateConfig,p:Panel){
 const r=p.rect;fill(ctx,r,t.background);
 if(t.decorations.card.includes('grain'))grain(ctx,p);
 if(t.decorations.card.includes('polka')){
  const spacing=.16,rad=.013;ctx.fillStyle='#F4A7B9';
  const nx=Math.ceil(r.width/spacing/2),ny=Math.ceil(r.height/spacing/2);
  ctx.save();ctx.beginPath();ctx.rect(r.x,0,r.width,r.height);ctx.clip();
  for(let xx=-nx;xx<=nx;xx++)for(let yy=-ny;yy<=ny;yy++){ctx.beginPath();ctx.arc(r.x+r.width/2+xx*spacing,r.height/2+yy*spacing,rad,0,Math.PI*2);ctx.fill()}ctx.restore();
 }
 if(t.decorations.card.includes('gingham')){
  const spacing=.18,band=.075;ctx.save();ctx.beginPath();ctx.rect(r.x,0,r.width,r.height);ctx.clip();ctx.fillStyle='rgba(244,167,185,.35)';
  for(let k=-Math.ceil(r.width/spacing);k<=Math.ceil(r.width/spacing);k++)ctx.fillRect(r.x+r.width/2+k*spacing-band/2,0,band,r.height);
  for(let k=-Math.ceil(r.height/spacing);k<=Math.ceil(r.height/spacing);k++)ctx.fillRect(r.x,r.height/2+k*spacing-band/2,r.width,band);ctx.restore();
 }
 if(t.decorations.card.includes('hairline'))stroke(ctx,{x:r.x+.035,y:.035,width:r.width-.07,height:r.height-.07},'#E6DEDF',.003);
 if(t.decorations.card.includes('double-border'))for(const inset of [.035,.055])stroke(ctx,{x:r.x+inset,y:inset,width:r.width-2*inset,height:r.height-2*inset},'#BD8A98',.003);
}
function stamp(ctx:any,r:Rect){
 fill(ctx,r,'#FFFFFF');const step=.09,rad=.016;ctx.fillStyle='#FFFFFF';
 const nx=Math.ceil(r.width/step),ny=Math.ceil(r.height/step);
 for(let i=0;i<=nx;i++)for(const y of [r.y,r.y+r.height]){ctx.beginPath();ctx.arc(r.x+i*r.width/nx,y,rad,0,Math.PI*2);ctx.fill()}
 for(let i=0;i<=ny;i++)for(const x of [r.x,r.x+r.width]){ctx.beginPath();ctx.arc(x,r.y+i*r.height/ny,rad,0,Math.PI*2);ctx.fill()}
}
function favoriteCircle(ctx:any,r:Rect){
 ctx.save();ctx.strokeStyle='#C8102E';ctx.lineWidth=.012;ctx.beginPath();
 // Deterministic gently wobbly oval, no random offsets between renders.
 for(let i=0;i<=120;i++){const a=i/120*Math.PI*2,f=1+.013*Math.cos(8*a);const x=r.x+r.width/2+Math.cos(a)*(r.width/2+.014)*f,y=r.y+r.height/2+Math.sin(a)*(r.height/2+.015)*f;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
 ctx.closePath();ctx.stroke();ctx.restore();
}
function cell(ctx:any,t:TemplateConfig,c:Cell,g:Geometry,img:any,o:RenderOptions){
 const d=t.decorations.cell,r=c.frame,p=c.photo;
 if(d.includes('rebate'))fill(ctx,r,'#211D1B');
 else if(d.includes('stamp'))stamp(ctx,r);
 else if(d.includes('sprockets'))fill(ctx,r,t.background);else if(d.length)fill(ctx,r,'#FFFFFF');
 if(d.includes('slide')){stroke(ctx,r,'#D8D5D1',.004);ctx.save();ctx.beginPath();ctx.roundRect(p.x,p.y,p.width,p.height,.025);ctx.clip();crop(ctx,img,p);ctx.restore()}
 else crop(ctx,img,p);
 if(d.includes('mount-label'))text(ctx,`memory ${c.shotIndex+1}`,r.x+r.width/2,p.y+p.height+t.frame.bottom/2,r.width*.75,.068,'Caveat','#716964');
 if(d.includes('frame-number'))text(ctx,String(c.shotIndex+1).padStart(2,'0'),r.x+r.width/2,p.y+p.height+t.frame.bottom/2,r.width*.8,.046,'Courier New','#FAF1DE');
 if(d.includes('last-caption')&&c.row===g.rows-1&&o.caption)text(ctx,o.caption,r.x+r.width/2,p.y+p.height+t.frame.bottom*.52,r.width*.86,.09,'Caveat',t.ink);
 if(d.includes('sprockets')){
  ctx.fillStyle='#E0C6A6';const count=Math.max(3,Math.floor(p.height/.11));
  for(let i=0;i<count;i++)for(const x of [r.x-.045,r.x+r.width+.023]){const y=p.y+(i+.5)*p.height/count-.026;ctx.beginPath();ctx.roundRect(x,y,.022,.052,.008);ctx.fill()}
 }
 if(d.includes('negative-number')){
  const y=r.y+r.height/2;
  text(ctx,String(c.shotIndex+1),r.x-.094,y,.07,.052,'Courier New','#E8893C');text(ctx,`${c.shotIndex+1}A`,r.x+r.width+.094,y,.07,.052,'Courier New','#E8893C');
 }
 if(d.includes('edge-text')){
  for(const side of [-1,1]){ctx.save();ctx.translate(side<0?r.x-.135:r.x+r.width+.135,p.y+p.height/2);ctx.rotate(side*Math.PI/2);text(ctx,o.hideDate||!o.date?'LIL BOOTH 400':`LIL BOOTH 400 · ${o.date}`,0,0,p.height*.8,.027,'Courier New','#E8893C');ctx.restore()}
 }
 if(d.includes('favorite')){
  // Mirror the chosen row's circle across columns to preserve the mandated symmetry.
  const chosen=g.cells.find(c=>c.shotIndex===(o.favorite??0))||g.cells[0];
  if(c.row===chosen.row)favoriteCircle(ctx,p);
 }
}
function cardText(ctx:any,t:TemplateConfig,p:Panel,o:RenderOptions){
 const d=t.decorations.card,cap=o.caption||'',date=o.hideDate?'':(o.date||''),mid=p.rect.x+p.rect.width/2,f=p.footer;
 if(d.includes('masthead'))text(ctx,'lil booth',mid,p.header.y+.265,p.header.width,.55,'Instrument Serif',t.ink);
 if(d.includes('issue'))text(ctx,`ISSUE${date?' '+date:''}${cap?' · '+cap.toUpperCase():''}`,mid,p.header.y+.575,p.header.width,.063,'DM Sans',t.ink);
 if(d.includes('ribbon')&&cap){
  const w=Math.min(p.rect.width-.22,1.75),y=f.y+.05,h=.23;
  ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.moveTo(mid-w/2,y);ctx.lineTo(mid+w/2,y);ctx.lineTo(mid+w/2-.055,y+h/2);ctx.lineTo(mid+w/2,y+h);ctx.lineTo(mid-w/2,y+h);ctx.lineTo(mid-w/2+.055,y+h/2);ctx.closePath();ctx.fill();
 }
 if(cap&&(d.includes('caption')||d.includes('serif-caption')||d.includes('sign-off'))){
  const s=d.includes('sign-off')?`love, ${cap}`:cap;
  const serif=t.group==='open',y=f.y+Math.min(.17,f.height*.40);const tw=text(ctx,s,mid-(d.includes('sign-off')?.025:0),y,f.width*.86,serif?.14:.095,serif?'Instrument Serif':'Courier New',t.ink,serif);
  if(d.includes('sign-off')){const x=mid+tw/2+.02;ctx.save();ctx.strokeStyle=t.ink;ctx.lineWidth=.003;ctx.beginPath();ctx.moveTo(x,y+.025);ctx.bezierCurveTo(x-.065,y-.013,x-.025,y-.06,x,y-.024);ctx.bezierCurveTo(x+.025,y-.06,x+.065,y-.013,x,y+.025);ctx.stroke();ctx.restore();}
 }
 if(date&&(d.includes('date')||d.includes('caps-date'))){
  const caps=d.includes('caps-date');const y=(d.includes('masthead')||d.includes('last-caption')||t.id==='instant-frames')?f.y+f.height/2:f.y+f.height*.78;
  ctx.save();if(caps)ctx.letterSpacing='.007px';text(ctx,caps?date.toUpperCase():date,mid,y,f.width*.8,.047,caps?'DM Sans':'Courier New',t.ink);ctx.restore();
 }
}
export function defaultStickerPlacements(t:TemplateConfig,g:Geometry,assets:Record<string,any>={}):Sticker[]{
 return g.panels.flatMap(p=>t.stickers.map(s=>{
  const im=assets[s.asset],w=s.width*p.rect.width,h=w*(im?(im.naturalHeight||im.height)/(im.naturalWidth||im.width):1),a=s.rotation*Math.PI/180;
  const hw=(Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*h)/2,hh=(Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*h)/2;
  const x=Math.max(hw+.01,Math.min(p.rect.width-hw-.01,s.x*p.rect.width)),y=Math.max(hh+.01,Math.min(p.rect.height-hh-.01,s.y*p.rect.height));
  return {...s,id:`${p.index}:${s.id}`,x:(p.rect.x+x)/g.width,y:y/g.height,width:w/g.width};
 }));
}
export function stickerRect(s:Sticker,g:Geometry,assets:Record<string,any>):Rect{
 const im=assets[s.asset],w=s.width*g.width,h=w*(im?(im.naturalHeight||im.height)/(im.naturalWidth||im.width):1);return{x:s.x*g.width-w/2,y:s.y*g.height-h/2,width:w,height:h};
}
function drawSticker(ctx:any,s:Sticker,g:Geometry,assets:Record<string,any>,isDefault:boolean){
 const im=assets[s.asset];if(!im)throw new Error('Sticker not preloaded: '+s.asset);
 const r=stickerRect(s,g,assets);ctx.save();
 if(isDefault){
  // Protect the middle 60% of every photo, including from sticker shadows.
  ctx.beginPath();ctx.rect(0,0,g.width,g.height);
  for(const c of g.cells)ctx.rect(c.photo.x+c.photo.width*.2,c.photo.y+c.photo.height*.2,c.photo.width*.6,c.photo.height*.6);
  ctx.clip('evenodd');
 }
 ctx.translate(s.x*g.width,s.y*g.height);ctx.rotate(s.rotation*Math.PI/180);if(s.mirrored)ctx.scale(-1,1);
 ctx.shadowColor='rgba(0,0,0,.18)';const pixelScale=Math.hypot(ctx.getTransform().a,ctx.getTransform().b);ctx.shadowOffsetY=.01*pixelScale;ctx.shadowBlur=.02*pixelScale;ctx.drawImage(im,-r.width/2,-r.height/2,r.width,r.height);ctx.restore();
}
export async function renderCard(t:TemplateConfig,id:LayoutId,photos:any[]=[],options:RenderOptions={}):Promise<any>{
 const g=computeLayout(t,id,options.differentShots),long=(options.longSide??1800)*(options.retina?2:1);
 const scale=long/Math.max(g.width,g.height),w=Math.round(g.width*scale),h=Math.round(g.height*scale);
 const factory=options.factory||((w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c});
 const canvas=factory(w,h),ctx=canvas.getContext('2d');
 const assets=options.assets||await preloadAssets();
 ctx.scale(w/g.width,h/g.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 for(const p of g.panels){background(ctx,t,p);for(const c of p.cells)cell(ctx,t,c,g,photos[c.shotIndex],options);cardText(ctx,t,p,options)}
 if(g.cutX!==undefined){fill(ctx,{x:g.cutX-.03,y:0,width:.06,height:g.height},t.background);ctx.strokeStyle=t.id==='film-negative'?'#B9A28C':'#B6AAA4';ctx.lineWidth=.003;ctx.setLineDash([.025,.025]);ctx.beginPath();ctx.moveTo(g.cutX,.02);ctx.lineTo(g.cutX,g.height-.02);ctx.stroke();ctx.setLineDash([])}
 if(options.defaults!==false)for(const s of defaultStickerPlacements(t,g,assets))drawSticker(ctx,s,g,assets,true);
 for(const s of options.stickers||[])drawSticker(ctx,s,g,assets,!!s.masked);
 return canvas;
}
