export const taskIcons=['target','idea','book','phone','mail','work','health','sport','rest','people','calendar','home'] as const;
export type TaskIcon=typeof taskIcons[number];
export type PersonalTask={id:string;title:string;details:string;icon:TaskIcon;done:boolean;updated_at:string};
export function newTask():PersonalTask{return {id:crypto.randomUUID(),title:'',details:'',icon:'target',done:false,updated_at:new Date().toISOString()};}
export function validateTask(task:PersonalTask):string|null {
 if(!task.title.trim()||task.title.length>150)return 'Donne un titre à ton action (150 caractères maximum).';
 if(task.details.length>2000)return 'Limite les précisions à 2 000 caractères.';
 if(!taskIcons.includes(task.icon))return 'Choisis une icône dans la liste.';
 return null;
}
export function demoTasks():PersonalTask[]{return [{...newTask(),title:'Noter trois idées pour mon projet',icon:'idea',details:'Prendre dix minutes au calme pour les écrire.'},{...newTask(),title:'Contacter une personne pour en discuter',icon:'phone'},{...newTask(),title:'Prendre un moment pour moi',icon:'rest',done:true}];}
