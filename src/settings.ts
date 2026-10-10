export interface Settings {
 enabled:boolean; hideRibbon:boolean; hideStatus:boolean; hideHeader:boolean;
 systemFonts:boolean; radius:number; width:number;
}
export const DEFAULTS:Settings={enabled:true,hideRibbon:false,hideStatus:true,hideHeader:true,systemFonts:true,radius:18,width:780};
export function normalize(value:unknown):Settings {
 const result={...DEFAULTS};
 if(!value || typeof value!=='object') return result;
 const data=value as Record<string,unknown>;
 for(const key of ['enabled','hideRibbon','hideStatus','hideHeader','systemFonts'] as const)
  if(typeof data[key]==='boolean') result[key]=data[key];
 for(const [key,min,max] of [['radius',0,28],['width',560,1100]] as const)
  if(typeof data[key]==='number' && Number.isFinite(data[key])) result[key]=Math.max(min,Math.min(max,Math.round(data[key])));
 return result;
}
