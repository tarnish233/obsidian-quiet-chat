export interface Settings {
 enabled:boolean; hideRibbon:boolean; hideStatus:boolean; hideHeader:boolean;
 systemFonts:boolean; radius:number; width:number;
 fontSize:number; lineHeight:number; paragraphSpacing:number; listSpacing:number; listIndent:number; listLevelGap:number;
 headingScale:number; headingTop:number; headingBottom:number;
}
export const DEFAULTS:Settings={enabled:true,hideRibbon:false,hideStatus:true,hideHeader:true,systemFonts:true,radius:18,width:780,fontSize:16,lineHeight:1.6,paragraphSpacing:0.8,listSpacing:0.2,listIndent:30,listLevelGap:0,headingScale:1,headingTop:16,headingBottom:16};
export const RANGES = {
 radius:[0,28,1], width:[560,1100,20], fontSize:[12,24,1],
 lineHeight:[1.2,2.4,0.05], paragraphSpacing:[0,2,0.1], listSpacing:[0,1,0.05], listIndent:[16,64,1], listLevelGap:[0,32,1],
 headingScale:[0.75,1.5,0.05], headingTop:[0,48,1], headingBottom:[0,48,1]
} as const;
export function normalize(value:unknown):Settings {
 const result={...DEFAULTS};
 if(!value || typeof value!=='object') return result;
 const data=value as Record<string,unknown>;
 for(const key of ['enabled','hideRibbon','hideStatus','hideHeader','systemFonts'] as const)
  if(typeof data[key]==='boolean') result[key]=data[key];
 for(const key of Object.keys(RANGES) as (keyof typeof RANGES)[]) {
  const [min,max,step]=RANGES[key], v=data[key];
  if(typeof v==='number' && Number.isFinite(v)) result[key]=Number(Math.max(min,Math.min(max,Math.round(v/step)*step)).toFixed(2));
 }
 return result;
}
