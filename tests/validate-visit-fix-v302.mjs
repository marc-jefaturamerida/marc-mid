import assert from 'node:assert/strict';
import {validateVisit} from '../netlify/lib/visit-validation.js';
const base={id:'vis_mi0bfd2343_x29ff234',visitedAt:'2026-11-19',module:'Paseo Montejo',supervisor:'Supervisora',sections:{checklist:{crit_1:'Cumple',crit_2:'No cumple'},folios:['F0000001'],incidents:{'F0000001':'Resuelta'},comments:{general:'Captura válida'}},total:85};
assert.equal(validateVisit(base),true);
assert.equal(validateVisit({...base,sections:{...base.sections,checklist:[],incidents:[]}}),true);
assert.throws(()=>validateVisit({...base,sections:{...base.sections,checklist:Object.fromEntries(Array.from({length:81},(_,i)=>['c'+i,'Cumple']))}}),/criterios/);
assert.throws(()=>validateVisit({...base,sections:{...base.sections,folios:['1','2','3','4']}}),/folios/);
assert.throws(()=>validateVisit({...base,sections:{...base.sections,incidents:Object.fromEntries(Array.from({length:151},(_,i)=>['F'+i,'Resuelta']))}}),/incidencias/);
console.log('OK: aceptación de mapas de checklist e incidencias, límites y errores descriptivos.');
