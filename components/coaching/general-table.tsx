'use client';
import {useRef, useState, type PointerEvent} from 'react';
import {ArrowDown, ArrowLeft, ArrowLeftRight, ArrowUp, Check, GripVertical, Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {criterionSide, moveTableRow, moveToColumn, type TableSide, type GeneralTable} from '@/lib/general-table';

export function GeneralTableEditor({value, onChange, onSave, onBack, busy, confirmRemove}: {
  value: GeneralTable; onChange: (v: GeneralTable) => void; onSave: () => void; onBack: () => void; busy: boolean;
  confirmRemove: (run: () => void) => void;
}) {
  const dragging = useRef<{id: string; target: string | null} | null>(null);
  const [drag, setDrag] = useState<{id: string; target: string | null} | null>(null);
  const [announcement, setAnnouncement] = useState('');
  function move(id: string, target: string) {
    const criteria = target === 'column:for' || target === 'column:against' ? moveToColumn(value.criteria, id, target === 'column:for' ? 'for' : 'against') : moveTableRow(value.criteria, id, target);
    onChange({...value, criteria});
    setAnnouncement(criteria === value.criteria ? 'Pour déplacer un sous-critère, dépose-le sur un critère.' : 'Ordre du tableau modifié.');
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
        onPointerMove={e => {if (!dragging.current) return; const element = document.elementFromPoint(e.clientX, e.clientY); const row = element?.closest('[data-table-row]'); const column = element?.closest('[data-table-column]'); const target = row?.getAttribute('data-table-row') || (column ? `column:${column.getAttribute('data-table-column')}` : null); dragging.current = {id, target}; setDrag(dragging.current); if(e.clientY < 100) window.scrollBy(0,-14); else if(e.clientY > window.innerHeight-110) window.scrollBy(0,14);}}
        onPointerUp={e => endDrag(e)} onPointerCancel={e => endDrag(e,true)} onLostPointerCapture={() => {dragging.current=null;setDrag(null)}}><GripVertical size={17}/></Button>
      <Button type="button" variant="ghost" size="icon" disabled={index === 0 || busy} aria-label={`Monter ${name || 'la ligne'}`} onClick={() => move(id, siblings[index-1].id)}><ArrowUp size={16}/></Button>
      <Button type="button" variant="ghost" size="icon" disabled={index === siblings.length-1 || busy} aria-label={`Descendre ${name || 'la ligne'}`} onClick={() => move(id, siblings[index+1].id)}><ArrowDown size={16}/></Button>
      <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Supprimer ${name || 'la ligne'}`} onClick={() => confirmRemove(remove)}><Trash2 size={16}/></Button>
    </div>;
  }
  return <div className="general-editor" aria-busy={busy}>
    <div className="section-heading"><Button variant="ghost" onClick={onBack} disabled={busy}><ArrowLeft size={17}/> Mes tableaux</Button><Button onClick={onSave} disabled={busy}><Check size={17}/> Enregistrer</Button></div>
    <div className="card question-card"><label htmlFor="general-title">Titre du tableau</label><Input id="general-title" placeholder="Ex. Ce qui compte dans mon quotidien" maxLength={200} value={value.title} disabled={busy} onChange={e => onChange({...value,title:e.target.value})}/></div>
    <p className="table-instructions">Classe tes critères dans Pour ou Contre. Glisse un critère avec ses sous-critères, ou utilise le bouton « Changer de colonne ».</p>
    <div className="criteria-board"><Table aria-label="Tableau Pour et Contre"><TableHeader><TableRow>
      <TableHead className="column-for"><strong>Pour</strong><span>Obligatoire</span></TableHead>
      <TableHead className="column-against"><strong>Contre</strong><span>Rédhibitoire</span></TableHead>
    </TableRow></TableHeader><TableBody><TableRow>
      {(['for','against'] as TableSide[]).map(side => {
        const criteria=value.criteria.filter(c => criterionSide(c)===side);
        const columnName=side==='for'?'Pour':'Contre';
        return <TableCell key={side} data-table-column={side} className={`criteria-column column-${side} ${drag?.target===`column:${side}`?'drop-target':''}`}>
          <p className="column-description">{side==='for'?'Ce qui doit être présent.':'Ce que tu ne peux pas accepter.'}</p>
          <div className="column-criteria">
            {criteria.map((c,i) => <article key={c.id} className="criterion-group">
              <div data-table-row={c.id} className={`general-parent ${drag?.id===c.id?'is-dragging':''} ${drag?.target===c.id?'drop-target':''}`}>
                <Input aria-label={`Critère ${columnName} ${i+1}`} placeholder="Nom du critère" maxLength={150} value={c.name} disabled={busy} onChange={e => onChange({...value,criteria:value.criteria.map(x => x.id===c.id?{...x,name:e.target.value}:x)})}/>
                {controls(c.id,c.name,criteria,i,() => onChange({...value,criteria:value.criteria.filter(x => x.id!==c.id)}))}
                <Button type="button" className="change-column" variant="ghost" size="sm" disabled={busy} aria-label={`Changer de colonne : ${c.name || 'critère'} vers ${side==='for'?'Contre':'Pour'}`} onClick={() => move(c.id,`column:${side==='for'?'against':'for'}`)}><ArrowLeftRight size={14}/> Vers {side==='for'?'Contre':'Pour'}</Button>
              </div>
              {c.children.map((child,j) => <div key={child.id} data-table-row={child.id} className={`general-child ${drag?.id===child.id?'is-dragging':''} ${drag?.target===child.id?'drop-target':''}`}>
                <div className="general-name"><span aria-hidden="true">↳</span><Input aria-label={`Sous-critère ${j+1} de ${c.name || `critère ${columnName} ${i+1}`}`} placeholder="Sous-critère" maxLength={150} value={child.name} disabled={busy} onChange={e => onChange({...value,criteria:value.criteria.map(x => x.id===c.id?{...x,children:x.children.map(ch => ch.id===child.id?{...ch,name:e.target.value}:ch)}:x)})}/></div>
                {controls(child.id,child.name,c.children,j,() => onChange({...value,criteria:value.criteria.map(x => x.id===c.id?{...x,children:x.children.filter(ch => ch.id!==child.id)}:x)}))}
              </div>)}
              <Button variant="ghost" size="sm" className="add-subcriterion" disabled={busy || c.children.length>=50} onClick={() => onChange({...value,criteria:value.criteria.map(x => x.id===c.id?{...x,children:[...x.children,{id:crypto.randomUUID(),name:''}]}:x)})}><Plus size={14}/> Sous-critère</Button>
            </article>)}
            {!criteria.length&&<p className="column-empty">Ajoute ou glisse un critère ici.</p>}
          </div>
          <Button className="add-table-criterion" variant="outline" disabled={busy || value.criteria.length>=100} aria-label={`Ajouter un critère ${columnName}`} onClick={() => onChange({...value,criteria:[...value.criteria,{id:crypto.randomUUID(),name:'',side,children:[]}]})}><Plus size={16}/> Ajouter un critère</Button>
        </TableCell>;
      })}
    </TableRow></TableBody></Table></div>
    <p className="sr-only" role="status">{announcement}</p>
  </div>;
}
