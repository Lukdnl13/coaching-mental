export type Note={id:string;title:string;content:string;category:string;updated_at:string};
export type Criterion={id:string;name:string;weight:number;required:boolean;threshold:number;scores:number[];children:{id:string;name:string;scores:number[]}[]};
export type Decision={id:string;title:string;options:string[];criteria:Criterion[];updated_at:string};
export type ValueItem={id:string;name:string;score:number;color:string;reflection:string;dimensions:{id:string;name:string;score:number}[]};
export type ValueWheel={id:string;items:ValueItem[];updated_at:string};
export const uid=()=>crypto.randomUUID();
export const now=()=>new Date().toISOString();
export function criterionScore(c:Criterion,i:number):number{return c.children.length?c.children.reduce((s,x)=>s+x.scores[i],0)/c.children.length:c.scores[i];}
export function evaluate(d:Decision){
 const sum=d.criteria.reduce((s,c)=>s+c.weight,0);
 const results=d.options.map((name,i)=>({name,score:sum?d.criteria.reduce((s,c)=>s+criterionScore(c,i)*c.weight,0)/sum:0,blocked:d.criteria.filter(c=>c.required&&criterionScore(c,i)<c.threshold).map(c=>c.name)}));
 const eligible=results.filter(r=>!r.blocked.length),best=Math.max(...eligible.map(r=>r.score));
 const winners=sum?results.flatMap((r,i)=>!r.blocked.length&&Math.abs(r.score-best)<0.000001?[i]:[]):[];
 return {results,winners,weight:sum,ready:sum>0&&d.criteria.length>0};
}
export function newCriterion(n=2):Criterion{return {id:uid(),name:'',weight:20,required:false,threshold:3,scores:Array(n).fill(3),children:[]};}
export function newDecision():Decision{return {id:uid(),title:'',options:['Option A','Option B'],criteria:[],updated_at:now()};}
export function defaults():ValueItem[]{return [['Santé',8,'#43a961'],['Famille',6,'#ef7b88'],['Carrière',7,'#eea05c'],['Finance',5,'#e8bb46'],['Apprentissage',7,'#56bfc2'],['Aventure',4,'#73a9dc'],['Contribution',6,'#9c87cd'],['Épanouissement',9,'#d98fba']].map(([name,score,color])=>({id:uid(),name:String(name),score:Number(score),color:String(color),reflection:'',dimensions:name==='Santé'?[{id:uid(),name:'Santé physique',score:8},{id:uid(),name:'Santé mentale',score:9},{id:uid(),name:'Énergie au quotidien',score:7}]:[]}));}
export function demoData(){
 const notes:Note[]=[['Réflexion du jour','Je me sens plus aligné quand je prends du temps pour moi. Une petite pause fait parfois toute la différence.','Personnel'],['Mes objectifs','Développer mes compétences.\nÊtre plus présent.\nTrouver un équilibre qui me ressemble.','Projets'],['Idées business','Application bien-être\nFormation en ligne','Idées'],['Gratitude','Aujourd’hui, je suis reconnaissant pour les personnes qui m’entourent.','Personnel'],['Points à améliorer','Gestion du temps\nMoins de distractions','Personnel']].map(([title,content,category])=>({id:uid(),title,content,category,updated_at:now()}));
 const decision:Decision={id:uid(),title:'Choisir une nouvelle opportunité professionnelle',options:['Poste actuel','Nouveau poste'],criteria:[['Épanouissement',30,3,5,'Sens du travail'],['Rémunération',20,3,5,'Salaire fixe'],['Équilibre de vie',20,2,4,'Temps libre'],['Évolution',20,3,5,'Opportunités'],['Stabilité',10,5,3,'']].map(([name,weight,a,b,child])=>({id:uid(),name:String(name),weight:Number(weight),scores:[Number(a),Number(b)],required:false,threshold:3,children:child?[{id:uid(),name:String(child),scores:[Number(a),Number(b)]}]:[]})),updated_at:now()};
 return {notes,decisions:[decision],wheel:{id:uid(),items:defaults(),updated_at:now()}};
}
