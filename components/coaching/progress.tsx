'use client';
import {useState} from 'react';
import {CartesianGrid,Line,LineChart,XAxis,YAxis} from 'recharts';
import {ChartContainer,ChartTooltip,ChartTooltipContent} from '@/components/ui/chart';
import {Button} from '@/components/ui/button';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {ArrowRight,ChartNoAxesColumnIncreasing,RefreshCw} from 'lucide-react';
import {averageValues,metricChange,metricValue,periodHistory,type ProgressMetric,type ProgressSnapshot} from '@/lib/progress';

const metrics:Record<ProgressMetric,{label:string;color:string}>={average:{label:'Moyenne des valeurs / 10',color:'#397a4c'},skills_count:{label:'Compétences listées',color:'#537ca4'},actions_done:{label:'Actions du projet pro réalisées',color:'#8b68a0'},notes_count:{label:'Notes conservées',color:'#c18b3f'},decisions_count:{label:'Décisions conservées',color:'#4b9397'},tables_count:{label:'Tableaux conservés',color:'#ab7360'}};
const shortDate=(day:string)=>new Date(day+'T12:00:00Z').toLocaleDateString('fr-FR',{day:'numeric',month:'short',timeZone:'UTC'});
const number=(n:number|null)=>n===null?'—':n.toLocaleString('fr-FR',{maximumFractionDigits:1});
const signed=(n:number|null)=>n===null?'Pas encore de comparaison':`${n>0?'+':''}${number(n)}`;
export function ProgressDashboard({history,current,compact=false,demo=false,connected,error,loading,onOpen,onConnect,onRetry}:{history:ProgressSnapshot[];current:ProgressSnapshot;compact?:boolean;demo?:boolean;connected:boolean;error:string;loading:boolean;onOpen?:()=>void;onConnect:()=>void;onRetry:()=>void}) {
 const [days,setDays]=useState('30'),[selectedMetric,setMetric]=useState<ProgressMetric|null>(null);
 const metric:ProgressMetric=selectedMetric??(current.values.length?'average':current.actions_total?'actions_done':current.skills_count?'skills_count':'notes_count');
 const rows=periodHistory(error?[]:history,Number(days));
 const chart=rows.map(r=>({...r,time:Date.parse(r.day+'T12:00:00Z'),measure:metricValue(r,metric)}));
 const change=metricChange(rows,metric),first=rows[0],last=rows.at(-1);
 const average=averageValues(current.values),percentage=current.actions_total?Math.round(current.actions_done/current.actions_total*100):0;
 return <section className={`progress-dashboard ${compact?'progress-home':''}`} aria-label="Statistiques et évolution">
  <div className="section-heading"><div><span className="eyebrow">TES REPÈRES DANS LE TEMPS</span><h2>Mon évolution</h2></div>{compact&&<Button variant="ghost" onClick={onOpen} aria-label="Voir les statistiques détaillées">Voir le détail <ArrowRight size={16}/></Button>}</div>
  {!connected?<div className="card progress-empty"><ChartNoAxesColumnIncreasing size={32}/><p>Retrouve ici l’évolution de tes valeurs, compétences et actions.</p><Button onClick={onConnect}>Ouvrir mon espace</Button></div>:<>
   <div className="progress-kpis"><div className="card"><span>Moyenne des valeurs</span><strong>{number(average)}<small> / 10</small></strong><p>{current.values.length} valeurs suivies</p></div><div className="card"><span>Mes compétences</span><strong>{current.skills_count}</strong><p>compétences listées</p></div><div className="card"><span>Mon projet pro</span><strong>{current.actions_done}<small> / {current.actions_total}</small></strong><p>actions réalisées</p></div></div>
   <div className="card progress-chart-card"><div className="progress-controls"><Select value={metric} onValueChange={v=>setMetric(v as ProgressMetric)}><SelectTrigger aria-label="Indicateur de la courbe"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(metrics).map(([key,m])=><SelectItem key={key} value={key}>{m.label}</SelectItem>)}</SelectContent></Select><Tabs value={days} onValueChange={setDays}><TabsList aria-label="Période des statistiques"><TabsTrigger value="7">7 j</TabsTrigger><TabsTrigger value="30">30 j</TabsTrigger><TabsTrigger value="90">90 j</TabsTrigger></TabsList></Tabs></div>
    {error?<div className="progress-empty" role="status"><p>{error}</p><Button variant="outline" onClick={onRetry} disabled={loading}><RefreshCw size={16}/> Réessayer</Button></div>:loading&&!history.length?<p className="progress-empty" role="status">Chargement de l’historique…</p>:<>
     <div className="progress-change"><strong>{signed(change)}{change!==null&&metric==='average'?' point(s)':''}</strong><span>{first&&last&&first.day!==last.day?`Du ${shortDate(first.day)} au ${shortDate(last.day)}`:'Le suivi commence avec ton premier enregistrement.'}</span></div>
     {chart.some(r=>r.measure!==null)?<ChartContainer className="progress-chart" config={{measure:metrics[metric]}}><LineChart data={chart} accessibilityLayer margin={{top:18,right:14,bottom:6,left:0}}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="time" type="number" scale="time" domain={chart.length===1?[chart[0].time-43200000,chart[0].time+43200000]:['dataMin','dataMax']} tickFormatter={time=>shortDate(new Date(time).toISOString().slice(0,10))} tickCount={chart.length===1?1:4} minTickGap={30} axisLine={false} tickLine={false}/><YAxis domain={metric==='average'?[0,10]:[0,'auto']} allowDecimals={metric==='average'} width={30} axisLine={false} tickLine={false}/><ChartTooltip content={<ChartTooltipContent labelFormatter={(_,payload)=>payload?.[0]?.payload?.day?shortDate(payload[0].payload.day):''}/>}/><Line dataKey="measure" name={metrics[metric].label} type="linear" stroke={metrics[metric].color} strokeWidth={3} dot={{r:4,strokeWidth:2,fill:'#fffefa'}} activeDot={{r:6}} connectNulls={false} isAnimationActive={false}/></LineChart></ChartContainer>:<div className="progress-empty"><ChartNoAxesColumnIncreasing size={32}/><p>{history.length?'Aucune mesure pour cet indicateur sur cette période.':'Ton premier point apparaîtra après un enregistrement.'}</p></div>}
     {rows.length===1&&<p className="progress-help">Premier point enregistré le {shortDate(rows[0].day)}. La courbe se dessinera avec tes enregistrements des prochains jours.</p>}
     {rows.length>0&&<details className="progress-data"><summary>Voir les chiffres de la courbe</summary><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>{metrics[metric].label}</TableHead></TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.day}><TableCell>{shortDate(r.day)}</TableCell><TableCell>{number(metricValue(r,metric))}</TableCell></TableRow>)}</TableBody></Table></details>}
    </>}
    <p className="progress-help">{demo?'Historique fictif de démonstration. ':''}Un point par jour d’enregistrement : le dernier état sauvegardé de la journée, heure de Paris. Les jours sans modification ne créent pas de point.</p>
    {metric==='average'&&<p className="progress-help">Cette moyenne décrit ta roue ; elle peut aussi varier si tu ajoutes ou retires des valeurs.</p>}
   </div>
   {!compact&&<>
    <section className="card"><h3>Mon plan professionnel aujourd’hui</h3><div className="progress-plan"><progress max={100} value={percentage} aria-label="Part des actions actuellement réalisées"/><strong>{percentage} %</strong></div><p className="progress-help">{current.actions_total?`${current.actions_done} actions réalisées sur ${current.actions_total}. Ce taux reflète les actions actuellement présentes dans ton plan.`:'Ajoute des actions à ton projet professionnel pour suivre leur réalisation.'}</p></section>
    <section className="card"><h3>Mes valeurs, une par une</h3>{!current.values.length?<p className="progress-help">Crée ta roue des valeurs pour suivre chaque dimension.</p>:<div className="progress-values">{current.values.map(v=>{const baseline=rows.length>1?first?.values.find(b=>b.id===v.id):undefined;const latest=last?.values.find(b=>b.id===v.id);const delta=baseline&&latest?Math.round((latest.score-baseline.score)*10)/10:null;return <div key={v.id}><span>{v.name}</span><progress max={10} value={v.score} aria-label={`${v.name} : ${v.score} sur 10`}/><b>{number(v.score)}/10</b><small>{delta===null?'—':`${signed(delta)} pt`}</small></div>})}</div>}<p className="progress-help">Les écarts comparent le premier et le dernier point de la période sélectionnée, pour une même valeur.</p></section>
    <div className="progress-inventory">{[[current.notes_count,'notes conservées'],[current.decisions_count,'décisions conservées'],[current.tables_count,'tableaux conservés']].map(([count,label])=><div className="card" key={label}><strong>{count}</strong><span>{label}</span></div>)}</div>
   </>}
  </>}
 </section>;
}
