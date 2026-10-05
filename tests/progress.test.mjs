import test from 'node:test';
import assert from 'node:assert/strict';
import {parisDay,periodHistory,metricChange,averageValues} from '../lib/progress.ts';
const row=(day,score=4)=>({day,notes_count:2,decisions_count:0,tables_count:0,skills_count:1,actions_done:0,actions_total:2,values:score===null?[]:[{id:'a',name:'A',score,color:'#000'}]});
test('le jour suit Paris même avant minuit UTC',()=>{assert.equal(parisDay(new Date('2026-10-05T22:30:00Z')),'2026-10-06');});
test('la période inclut exactement 7 jours calendaires et aucun point futur',()=>{const result=periodHistory(['2026-09-28','2026-09-29','2026-10-05','2026-10-06'].map(d=>row(d)),7,'2026-10-05');assert.deepEqual(result.map(r=>r.day),['2026-09-29','2026-10-05']);});
test('aucune tendance inventée avec un seul point ou une valeur absente',()=>{assert.equal(metricChange([row('2026-10-05')],'average'),null);assert.equal(metricChange([row('2026-10-04',null),row('2026-10-05')],'average'),null);assert.equal(averageValues([]),null);});
test('les écarts suivent les vrais points sans insérer de jours manquants',()=>{const rows=periodHistory([row('2026-10-05',7),row('2026-10-01',4)],30,'2026-10-05');assert.equal(rows.length,2);assert.equal(metricChange(rows,'average'),3);rows[1].notes_count=1;assert.equal(metricChange(rows,'notes_count'),-1);});
