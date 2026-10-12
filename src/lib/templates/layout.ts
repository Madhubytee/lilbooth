import type {LayoutId,TemplateConfig,Geometry,Panel} from './types.ts';
export const layouts:Record<LayoutId,{name:string;cols:number;rows:number;double:boolean;aspect:number}>= {
 strip:{name:'Strip',cols:1,rows:4,double:false,aspect:4/3},trio:{name:'Trio',cols:1,rows:3,double:false,aspect:4/3},
 'double-strip':{name:'Double strip',cols:2,rows:4,double:true,aspect:4/3},'double-trio':{name:'Double trio',cols:2,rows:3,double:true,aspect:4/3},
 grid:{name:'Grid',cols:2,rows:2,double:false,aspect:1},'big-grid':{name:'Big grid',cols:2,rows:3,double:false,aspect:1}
};
export function computeLayout(t:TemplateConfig,id:LayoutId,differentShots=false):Geometry {
 const l=layouts[id];if(!l)throw new Error('Unknown layout: '+id);
 const C=1,m=t.margin*C,g=t.gutter*C,pw=C-2*t.frame.side*C;
 const ch=pw/l.aspect+(t.frame.top+t.frame.bottom)*C;
 const twin=l.double&&t.doubling==='twin',cols=twin?1:l.cols;
 const w=2*m+cols*C+(cols-1)*g,h=2*m+t.header*C+l.rows*ch+(l.rows-1)*g+t.footer*C;
 const cutGap=0.06*C,totalWidth=twin?2*w+cutGap:w;
 const panels:Panel[]=Array.from({length:twin?2:1},(_,p)=>{
  const x=p*(w+cutGap);const cells=[];
  for(let row=0;row<l.rows;row++)for(let col=0;col<cols;col++){
   const xx=x+m+col*(C+g),yy=m+t.header+row*(ch+g);
   const globalCol=twin?p:col;
   const shotIndex=l.double?(differentShots?globalCol*l.rows+row:row):row*l.cols+col;
   cells.push({index:p*l.rows*cols+row*cols+col,row,col,shotIndex,panel:p,
    frame:{x:xx,y:yy,width:C,height:ch},photo:{x:xx+t.frame.side,y:yy+t.frame.top,width:pw,height:pw/l.aspect}});
  }
  return {index:p,rect:{x,y:0,width:w,height:h},header:{x:x+m,y:m,width:w-2*m,height:t.header},
   footer:{x:x+m,y:h-m-t.footer,width:w-2*m,height:t.footer},cells,
   anchors:{topCenter:{x:x+w/2,y:m/2},bottomCenter:{x:x+w/2,y:h-m/2},leftTop:{x:x+m/2,y:m/2},rightTop:{x:x+w-m/2,y:m/2}}};
 });
 return {width:totalWidth,height:h,cellWidth:C,panels,cells:panels.flatMap(p=>p.cells),cutX:twin?w+cutGap/2:undefined,
 requiredPhotos:l.double&&!differentShots?l.rows:l.cols*l.rows,columns:l.cols,rows:l.rows};
}
