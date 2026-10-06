export type CareerCategory = {id: string; name: string; color?: string};
export const careerColors=['#5b8c62','#527fa8','#b68a38','#9670b1','#bd7180','#489797','#bd7951','#748851'];
export function careerCategoryColor(category?:CareerCategory):string {
  if(!category||category.id==='uncategorized')return '#879182';
  if(category.color&&/^#[0-9a-f]{6}$/i.test(category.color))return category.color;
  // Stable fallback for categories saved before colors were introduced.
  const index=Array.from(category.id).reduce((hash,c)=>(hash*31+c.charCodeAt(0))>>>0,0)%careerColors.length;
  return careerColors[index];
}
export type CareerSkill = {id: string; name: string; category_id: string | null};
export type CareerPlan = {goal: string; skill_ids: string[]; actions: {id: string; title: string; done: boolean}[]};
export type CareerWorkspace = {id: string; categories: CareerCategory[]; skills: CareerSkill[]; plan: CareerPlan; updated_at: string};
export function newCareerWorkspace(): CareerWorkspace {
  return {id:crypto.randomUUID(), categories:['Qualités personnelles','Organisation et méthode','Créativité','Compétences techniques'].map((name,i)=>({id:crypto.randomUUID(),name,color:careerColors[i]})), skills:[], plan:{goal:'',skill_ids:[],actions:[]}, updated_at:new Date().toISOString()};
}
export function removeCareerCategory(value: CareerWorkspace, id: string): CareerWorkspace {
  return {...value,categories:value.categories.filter(c=>c.id!==id),skills:value.skills.map(s=>s.category_id===id?{...s,category_id:null}:s)};
}
export function removeCareerSkill(value: CareerWorkspace, id: string): CareerWorkspace {
  return {...value,skills:value.skills.filter(s=>s.id!==id),plan:{...value.plan,skill_ids:value.plan.skill_ids.filter(s=>s!==id)}};
}
export function validateCareer(value: CareerWorkspace): string | null {
  if(value.categories.length>30 || value.skills.length>300 || value.plan.actions.length>100) return 'La limite est de 30 catégories, 300 compétences et 100 actions.';
  if(value.categories.some(c=>!c.name.trim()||c.name.length>80)) return 'Nomme chaque catégorie (80 caractères maximum).';
  if(value.categories.some(c=>c.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(c.color))) return 'Choisis une couleur valide pour chaque catégorie.';
  if(new Set(value.categories.map(c=>c.name.trim().toLocaleLowerCase('fr'))).size!==value.categories.length) return 'Utilise un nom différent pour chaque catégorie.';
  if(value.skills.some(s=>!s.name.trim()||s.name.length>150)) return 'Nomme chaque compétence ou qualité (150 caractères maximum).';
  if(value.skills.some(s=>s.category_id!==null&&!value.categories.some(c=>c.id===s.category_id))) return 'Une catégorie est introuvable. Reclasse la compétence concernée.';
  if(value.plan.goal.length>5000 || value.plan.actions.some(a=>!a.title.trim()||a.title.length>500)) return 'Nomme chaque action (500 caractères maximum) et limite ton objectif à 5 000 caractères.';
  if(value.plan.skill_ids.some(id=>!value.skills.some(s=>s.id===id))) return 'Un point d’appui du projet est introuvable.';
  return null;
}
export function demoCareer(): CareerWorkspace {
  const value=newCareerWorkspace();
  value.skills=[['Créativité',2],['Investissement à 100 %',0],['Sérieux',0],['Organisation',1]].map(([name,index])=>({id:crypto.randomUUID(),name:String(name),category_id:value.categories[Number(index)].id}));
  value.plan={goal:'Explorer un projet professionnel qui me permet de créer, de m’investir et de travailler avec méthode.',skill_ids:[value.skills[0].id,value.skills[3].id],actions:[{id:crypto.randomUUID(),title:'Identifier deux pistes de métiers qui mobilisent mes points forts.',done:false},{id:crypto.randomUUID(),title:'Échanger avec une personne qui exerce l’un de ces métiers.',done:false}]};
  return value;
}
