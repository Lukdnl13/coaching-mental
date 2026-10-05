'use client';
import {Fragment, useRef, useState, type PointerEvent} from 'react';
import {ArrowDown, ArrowLeft, ArrowUp, Check, GripVertical, Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {moveTableRow, type GeneralTable} from '@/lib/general-table';

export function GeneralTableEditor({value, onChange, onSave, onBack, busy, confirmRemove}: {
  value: GeneralTable; onChange: (v: GeneralTable) => void; onSave: () => void; onBack: () => void; busy: boolean;
  confirmRemove: (run: () => void) => void;
}) {
  const dragging = useRef<{id: string; target: string | null} | null>(null);
  const [drag, setDrag] = useState<{id: string; target: string | null} | null>(null);
  const [announcement, setAnnouncement] = useState('');
  function move(id: string, target: string) {
    const criteria = moveTableRow(value.criteria, id, target);
    onChange({...value, criteria});
    setAnnouncement(criteria === value.criteria ? 'Déplacement impossible.' : 'Ordre du tableau modifié.');
  }
  function endDrag(e: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const current = dragging.current;
    dragging.current = null; setDrag(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!cancelled && current?.target) move(current.id, current.target);
  }
  function controls(id: string, name: string, siblings: {id: string}[], index: number, remove: () => void) {
    return <div className="table-row-actions">
      <Button type="button" variant="ghost" size="icon" className="table-grip" aria-label={`Glisser ${name || 'la ligne'}`} title="Glisser pour déplacer"
        onPointerDown={e => {if (e.button !== 0 || busy) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dragging.current = {id, target: null}; setDrag(dragging.current);}}
        onPointerMove={e => {if (!dragging.current) return; const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-table-row]'); const target = row?.getAttribute('data-table-row') || null; dragging.current = {id, target}; setDrag(dragging.current); if(e.clientY < 100) window.scrollBy(0,-14); else if(e.clientY > window.innerHeight-110) window.scrollBy(0,14);}}
        onPointerUp={e => endDrag(e)} onPointerCancel={e => endDrag(e,true)} onLostPointerCapture={() => {dragging.current=null;setDrag(null)}}><GripVertical size={17}/></Button>
      <Button type="button" variant="ghost" size="icon" disabled={index === 0 || busy} aria-label={`Monter ${name || 'la ligne'}`} onClick={() => move(id, siblings[index-1].id)}><ArrowUp size={16}/></Button>
      <Button type="button" variant="ghost" size="icon" disabled={index === siblings.length-1 || busy} aria-label={`Descendre ${name || 'la ligne'}`} onClick={() => move(id, siblings[index+1].id)}><ArrowDown size={16}/></Button>
      <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Supprimer ${name || 'la ligne'}`} onClick={() => confirmRemove(remove)}><Trash2 size={16}/></Button>
    </div>;
  }
  return <div className="general-editor" aria-busy={busy}>
    <div className="section-heading"><Button variant="ghost" onClick={onBack} disabled={busy}><ArrowLeft size={17}/> Mes tableaux</Button><Button onClick={onSave} disabled={busy}><Check size={17}/> Enregistrer</Button></div>
    <div className="card question-card"><label htmlFor="general-title">Titre du tableau</label><Input id="general-title" placeholder="Ex. Ce qui compte dans mon quotidien" maxLength={200} value={value.title} disabled={busy} onChange={e => onChange({...value,title:e.target.value})}/></div>
    <p className="table-instructions">Glisse la poignée pour déplacer une ligne. Dépose un sous-critère sur un critère pour le rattacher. Tu peux aussi utiliser les flèches.</p>
    <div className="general-matrix"><Table><TableHeader><TableRow><TableHead>Critères et sous-critères</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader><TableBody>
      {value.criteria.map((c, i) => <Fragment key={c.id}>
        <TableRow data-table-row={c.id} className={`general-parent ${drag?.id === c.id?'is-dragging':''} ${drag?.target === c.id?'drop-target':''}`}>
          <TableCell><div className="general-name"><span className="table-number">{i+1}</span><Input aria-label={`Critère ${i+1}`} placeholder="Nom du critère" maxLength={150} value={c.name} disabled={busy} onChange={e => onChange({...value,criteria:value.criteria.map(x => x.id===c.id?{...x,name:e.target.value}:x)})}/></div>
          <Button variant="ghost" size="sm" className="add-subcriterion" disabled={busy || c.children.length>=50} onClick={() => onChange({...value,criteria:value.criteria.map(x => x.id===c.id?{...x,children:[...x.children,{id:crypto.randomUUID(),name:''}]}:x)})}><Plus size={14}/> Sous-critère</Button></TableCell>
          <TableCell>{controls(c.id,c.name,value.criteria,i,() => onChange({...value,criteria:value.criteria.filter(x => x.id!==c.id)}))}</TableCell>
        </TableRow>
        {c.children.map((s,j) => <TableRow key={s.id} data-table-row={s.id} className={`general-child ${drag?.id===s.id?'is-dragging':''} ${drag?.target===s.id?'drop-target':''}`}>
          <TableCell><div className="general-name"><span className="table-number">↳</span><Input aria-label={`Sous-critère ${j+1} de ${c.name || `critère ${i+1}`}`} placeholder="Nom du sous-critère" value={s.name} maxLength={150} disabled={busy} onChange={e => onChange({...value,criteria:value.criteria.map(x => x.id===c.id?{...x,children:x.children.map(child => child.id===s.id?{...child,name:e.target.value}:child)}:x)})}/></div></TableCell>
          <TableCell>{controls(s.id,s.name,c.children,j,() => onChange({...value,criteria:value.criteria.map(x => x.id===c.id?{...x,children:x.children.filter(child => child.id!==s.id)}:x)}))}</TableCell>
        </TableRow>)}
      </Fragment>)}
      {!value.criteria.length && <TableRow><TableCell colSpan={2} className="general-empty">Ajoute ton premier critère, puis ses sous-critères.</TableCell></TableRow>}
    </TableBody></Table></div>
    <Button className="add-table-criterion" variant="outline" disabled={busy || value.criteria.length>=100} onClick={() => onChange({...value,criteria:[...value.criteria,{id:crypto.randomUUID(),name:'',children:[]}]})}><Plus size={17}/> Ajouter un critère</Button>
    <p className="sr-only" role="status">{announcement}</p>
  </div>;
}
