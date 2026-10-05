'use client';
import {useState, type FormEvent} from 'react';
import {BriefcaseBusiness, Check, Plus, Trash2, FolderOpen, Target} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {removeCareerCategory, removeCareerSkill, type CareerWorkspace} from '@/lib/career';
import {toast} from 'sonner';

export function CareerSection({value,onChange,onSave,onCreate,busy,dirty,confirm}:{
  value:CareerWorkspace|null; onChange:(v:CareerWorkspace)=>void; onSave:()=>void; onCreate:()=>void; busy:boolean; dirty:boolean;
  confirm:(title:string,description:string,run:()=>void)=>void;
}) {
  const [tab,setTab]=useState('skills'),[skillName,setSkillName]=useState(''),[categoryId,setCategoryId]=useState('uncategorized'),[categoryName,setCategoryName]=useState(''),[actionTitle,setActionTitle]=useState('');
  function addSkill(e:FormEvent) {
    e.preventDefault(); if(!value||!skillName.trim()||value.skills.length>=300)return;
    onChange({...value,skills:[...value.skills,{id:crypto.randomUUID(),name:skillName.trim(),category_id:value.categories.some(c=>c.id===categoryId)?categoryId:null}]});setSkillName('');
  }
  function addCategory(e:FormEvent) {
    e.preventDefault();if(!value||!categoryName.trim()||value.categories.length>=30)return;
    if(value.categories.some(c=>c.name.trim().toLocaleLowerCase('fr')===categoryName.trim().toLocaleLowerCase('fr'))){toast.error('Cette catégorie existe déjà.');return;}
    onChange({...value,categories:[...value.categories,{id:crypto.randomUUID(),name:categoryName.trim()}]});setCategoryName('');
  }
  function categorySelect(selected:string,onSelect:(id:string)=>void,label:string) {
    return <Select value={selected} onValueChange={onSelect} disabled={busy}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="uncategorized">À classer</SelectItem>{value?.categories.map(c=><SelectItem key={c.id} value={c.id}>{c.name||'Catégorie sans nom'}</SelectItem>)}</SelectContent></Select>;
  }
  if(!value)return <div className="page-content"><div className="empty-state"><BriefcaseBusiness size={36}/><h2>Mes compétences, mon projet.</h2><p>Liste ce que tu sais faire et tes qualités, regroupe-les par catégorie, puis construis ton plan d’action.</p><Button disabled={busy} onClick={onCreate}>Créer mon espace compétences</Button></div></div>;
  const completed=value.plan.actions.filter(a=>a.done).length;
  return <div className="page-content career-page"><div className="section-heading career-heading"><div><span className="eyebrow">DE MES ATOUTS À MON PROJET</span><h2>Compétences et projet pro</h2><p className="career-save-state" role="status">{dirty?'Modifications à enregistrer':'Enregistré'}</p></div><Button onClick={onSave} disabled={busy||!dirty}><Check size={17}/> Enregistrer</Button></div>
    <Tabs value={tab} onValueChange={setTab}><TabsList className="category-tabs career-tabs"><TabsTrigger value="skills">Mes compétences</TabsTrigger><TabsTrigger value="plan">Mon plan professionnel</TabsTrigger></TabsList></Tabs>
    <fieldset disabled={busy} className="career-fields">
    {tab==='skills'?<>
      <form className="card career-add" onSubmit={addSkill}><h3>Ajouter une compétence ou une qualité</h3><label htmlFor="career-new-skill">Nom<Input id="career-new-skill" value={skillName} onChange={e=>setSkillName(e.target.value)} maxLength={150} placeholder="Ex. Créativité, sérieux, organisation…" required/></label><div className="career-add-bottom"><div><span className="career-field-label">Catégorie</span>{categorySelect(categoryId,id=>setCategoryId(id),'Catégorie de la nouvelle compétence')}</div><Button type="submit" disabled={!skillName.trim()||value.skills.length>=300}><Plus size={17}/> Ajouter</Button></div></form>
      <section className="card career-categories"><h3><FolderOpen size={19}/> Mes catégories</h3><p>Tu peux renommer les catégories et en créer selon tes besoins.</p><div className="career-category-list">{value.categories.map((c,i)=><div className="inline-field" key={c.id}><Input aria-label={`Nom de la catégorie ${i+1}`} value={c.name} maxLength={80} onChange={e=>onChange({...value,categories:value.categories.map(x=>x.id===c.id?{...x,name:e.target.value}:x)})}/><Button type="button" variant="ghost" size="icon" aria-label={`Supprimer la catégorie ${c.name}`} onClick={()=>confirm('Supprimer cette catégorie ?','Ses compétences seront conservées dans « À classer ».',()=>{onChange(removeCareerCategory(value,c.id));if(categoryId===c.id)setCategoryId('uncategorized')})}><Trash2 size={16}/></Button></div>)}</div><form className="inline-field" onSubmit={addCategory}><Input aria-label="Nouvelle catégorie" placeholder="Nouvelle catégorie" value={categoryName} onChange={e=>setCategoryName(e.target.value)} maxLength={80} required/><Button type="submit" variant="outline" disabled={!categoryName.trim()||value.categories.length>=30}><Plus size={17}/> Ajouter</Button></form></section>
      <div className="section-heading compact"><h3>Mes atouts regroupés</h3><span className="muted">{value.skills.length} au total</span></div>
      {!value.skills.length&&<p className="career-empty">Commence par noter une compétence ou une qualité. Tu pourras la classer ensuite.</p>}
      <div className="career-groups">{[{id:'uncategorized',name:'À classer'},...value.categories].map(category=>{
        const skills=value.skills.filter(s=>(s.category_id||'uncategorized')===category.id);if(!skills.length)return null;
        return <section className="card career-group" key={category.id}><h3>{category.name||'Catégorie sans nom'} <span>{skills.length}</span></h3>{skills.map(skill=><div className="career-skill" key={skill.id}><div className="inline-field"><Input aria-label={`Nom de la compétence ${skill.name}`} value={skill.name} maxLength={150} onChange={e=>onChange({...value,skills:value.skills.map(s=>s.id===skill.id?{...s,name:e.target.value}:s)})}/><Button variant="ghost" size="icon" aria-label={`Supprimer la compétence ${skill.name}`} onClick={()=>confirm('Supprimer cette compétence ?','Elle sera aussi retirée des points d’appui de ton projet. Tes actions seront conservées.',()=>onChange(removeCareerSkill(value,skill.id)))}><Trash2 size={16}/></Button></div>{categorySelect(skill.category_id||'uncategorized',id=>onChange({...value,skills:value.skills.map(s=>s.id===skill.id?{...s,category_id:id==='uncategorized'?null:id}:s)}),`Catégorie de ${skill.name}`)}</div>)}</section>;
      })}</div><Button className="career-next" variant="outline" onClick={()=>setTab('plan')}><Target size={17}/> Construire mon plan professionnel</Button>
    </>:<>
      <section className="card career-goal"><label htmlFor="career-goal">1. Mon objectif professionnel</label><p>Quelle activité veux-tu explorer ou quel projet souhaites-tu construire ?</p><Textarea id="career-goal" value={value.plan.goal} onChange={e=>onChange({...value,plan:{...value.plan,goal:e.target.value}})} placeholder="Ex. Trouver une activité dans laquelle je peux créer, organiser et m’investir pleinement…" maxLength={5000}/></section>
      <section className="card"><h3>2. Les compétences sur lesquelles m’appuyer</h3><p className="career-help">Sélectionne les atouts utiles à ce projet dans ta liste.</p>{!value.skills.length?<Button variant="outline" onClick={()=>setTab('skills')}>Ajouter mes premières compétences</Button>:<div className="career-supports">{value.skills.map(skill=><label key={skill.id} className="career-checkbox"><Checkbox checked={value.plan.skill_ids.includes(skill.id)} onCheckedChange={checked=>onChange({...value,plan:{...value.plan,skill_ids:checked===true?[...value.plan.skill_ids.filter(id=>id!==skill.id),skill.id]:value.plan.skill_ids.filter(id=>id!==skill.id)}})}/><span>{skill.name||'Compétence sans nom'}<small>{value.categories.find(c=>c.id===skill.category_id)?.name||'À classer'}</small></span></label>)}</div>}</section>
      <section className="card"><div className="section-heading compact"><h3>3. Mes prochaines actions</h3><span className="muted">{completed}/{value.plan.actions.length} réalisées</span></div><p className="career-help">Une action concrète à la fois : explorer un métier, échanger avec un professionnel, réaliser un premier essai…</p><div className="career-actions">{value.plan.actions.map((action,i)=><div className={`career-action ${action.done?'done':''}`} key={action.id}><Checkbox aria-label={`Marquer l’action ${i+1} comme ${action.done?'à faire':'réalisée'}`} checked={action.done} onCheckedChange={done=>onChange({...value,plan:{...value.plan,actions:value.plan.actions.map(a=>a.id===action.id?{...a,done:done===true}:a)}})}/><Textarea aria-label={`Action ${i+1}`} maxLength={500} value={action.title} onChange={e=>onChange({...value,plan:{...value.plan,actions:value.plan.actions.map(a=>a.id===action.id?{...a,title:e.target.value}:a)}})}/><Button variant="ghost" size="icon" aria-label={`Supprimer l’action ${i+1}`} onClick={()=>confirm('Supprimer cette action ?','Cette action sera retirée du plan après enregistrement.',()=>onChange({...value,plan:{...value.plan,actions:value.plan.actions.filter(a=>a.id!==action.id)}}))}><Trash2 size={16}/></Button></div>)}</div><form className="career-action-add" onSubmit={e=>{e.preventDefault();if(!actionTitle.trim()||value.plan.actions.length>=100)return;onChange({...value,plan:{...value.plan,actions:[...value.plan.actions,{id:crypto.randomUUID(),title:actionTitle.trim(),done:false}]}});setActionTitle('')}}><Input aria-label="Nouvelle action" placeholder="Ma prochaine action concrète…" value={actionTitle} maxLength={500} onChange={e=>setActionTitle(e.target.value)} required/><Button type="submit" variant="outline" disabled={!actionTitle.trim()||value.plan.actions.length>=100}><Plus size={16}/> Ajouter l’action</Button></form></section>
    </>}
    </fieldset>
  </div>;
}
