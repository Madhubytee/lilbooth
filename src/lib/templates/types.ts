export type LayoutId = 'strip'|'trio'|'double-strip'|'double-trio'|'grid'|'big-grid';
export type TemplateId = 'classic-booth'|'film-negative'|'slide-mount'|'contact-sheet'|'instant-frames'|'clean-white'|'blush-polka'|'gingham'|'love-letter'|'magazine';
export interface Sticker { id:string; asset:string; x:number; y:number; width:number; rotation:number; mirrored?:boolean;
 /** template default that hasn't been moved yet: keeps the face-protection mask */
 masked?:boolean; }
export interface TemplateConfig {
 id:TemplateId; name:string; group:'film'|'open'; doubling:'twin'|'continuous';
 background:string; ink:string; margin:number; gutter:number; header:number; footer:number;
 frame:{side:number;top:number;bottom:number};
 decorations:{cell:string[];card:string[]}; stickers:Sticker[];
}
export interface Rect {x:number;y:number;width:number;height:number}
export interface Cell {index:number;row:number;col:number;shotIndex:number;panel:number;frame:Rect;photo:Rect}
export interface Panel {index:number;rect:Rect;header:Rect;footer:Rect;cells:Cell[];anchors:{topCenter:{x:number;y:number};bottomCenter:{x:number;y:number};leftTop:{x:number;y:number};rightTop:{x:number;y:number}}}
export interface Geometry {width:number;height:number;cellWidth:number;panels:Panel[];cells:Cell[];cutX?:number;requiredPhotos:number;columns:number;rows:number}
export interface RenderOptions {caption?:string;date?:string;hideDate?:boolean;favorite?:number;differentShots?:boolean;longSide?:number;retina?:boolean;stickers?:Sticker[];defaults?:boolean;assets?:Record<string,any>;factory?:(w:number,h:number)=>any}
