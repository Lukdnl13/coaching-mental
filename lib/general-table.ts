export type TableSide = 'for' | 'against';
export type TableCriterion = {id: string; name: string; side?: TableSide; children: {id: string; name: string}[]};
// Older saved criteria appear in Pour without changing their names or children.
export const criterionSide = (criterion: TableCriterion): TableSide => criterion.side ?? 'for';
export function moveToColumn(criteria: TableCriterion[], id: string, side: TableSide): TableCriterion[] {
  const criterion = criteria.find(c => c.id === id);
  if (!criterion || criterionSide(criterion) === side) return criteria;
  return [...criteria.filter(c => c.id !== id), {...criterion, side}];
}
export type GeneralTable = {id: string; title: string; criteria: TableCriterion[]; updated_at: string};
export const newGeneralTable = (): GeneralTable => ({id: crypto.randomUUID(), title: '', criteria: [], updated_at: new Date().toISOString()});

// A criterion moves with its children. A child can also move to another criterion.
export function moveTableRow(criteria: TableCriterion[], source: string, target: string): TableCriterion[] {
  if (source === target) return criteria;
  const from = criteria.findIndex(c => c.id === source || c.children.some(s => s.id === source));
  const to = criteria.findIndex(c => c.id === target || c.children.some(s => s.id === target));
  if (from < 0 || to < 0) return criteria;
  const result = criteria.map(c => ({...c, children: [...c.children]}));
  if (criteria[from].id === source) {
    if (from === to) return criteria;
    const [criterion] = result.splice(from, 1);
    if (criterionSide(criterion) !== criterionSide(criteria[to])) criterion.side = criterionSide(criteria[to]);
    result.splice(to, 0, criterion);
  } else {
    if (from !== to && result[to].children.length >= 50) return criteria;
    const index = result[from].children.findIndex(s => s.id === source);
    const targetIndex = result[to].children.findIndex(s => s.id === target);
    const [child] = result[from].children.splice(index, 1);
    result[to].children.splice(targetIndex < 0 ? result[to].children.length : targetIndex, 0, child);
  }
  return result;
}

export function tableValidation(table: GeneralTable): string | null {
  if (!table.title.trim()) return 'Donne un titre à ton tableau.';
  if (table.title.length > 200 || table.criteria.length > 100) return 'Ce tableau dépasse la taille autorisée.';
  if (table.criteria.some(c => c.side !== undefined && c.side !== 'for' && c.side !== 'against')) return 'Choisis une colonne valide pour chaque critère.';
  if (table.criteria.some(c => !c.name.trim() || c.name.length > 150 || c.children.length > 50 || c.children.some(s => !s.name.trim() || s.name.length > 150))) return 'Nomme chaque critère et sous-critère avant d’enregistrer.';
  return null;
}
