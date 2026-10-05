export type ProgressValue = {id:string;name:string;score:number;color:string};
export type ProgressSnapshot = {day:string;notes_count:number;decisions_count:number;tables_count:number;skills_count:number;actions_done:number;actions_total:number;values:ProgressValue[]};
export type ProgressMetric = 'average'|'skills_count'|'actions_done'|'notes_count'|'decisions_count'|'tables_count';
export function parisDay(date=new Date()):string {return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function averageValues(values:ProgressValue[]):number|null {return values.length?Math.round(values.reduce((n,v)=>n+v.score,0)/values.length*10)/10:null;}
export function metricValue(row:ProgressSnapshot,metric:ProgressMetric):number|null {return metric==='average'?averageValues(row.values):row[metric];}
export function periodHistory(history:ProgressSnapshot[],days:number,today=parisDay()):ProgressSnapshot[] {
 const start=new Date(today+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-days+1);
 const min=start.toISOString().slice(0,10);
 return history.filter(s=>s.day>=min&&s.day<=today).sort((a,b)=>a.day.localeCompare(b.day));
}
export function metricChange(rows:ProgressSnapshot[],metric:ProgressMetric):number|null {
 if(rows.length<2)return null;
 const a=metricValue(rows[0],metric),b=metricValue(rows[rows.length-1],metric);
 return a===null||b===null?null:Math.round((b-a)*10)/10;
}
export function demoProgress(current:ProgressSnapshot):ProgressSnapshot[] {
 return [21,14,7,0].map((ago,i)=>{const date=new Date(current.day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-ago);return {...current,day:date.toISOString().slice(0,10),notes_count:Math.max(0,current.notes_count-3+i),skills_count:Math.max(0,current.skills_count-3+i),values:current.values.map(v=>({...v,score:Math.max(0,v.score-(3-i))}))};});
}
