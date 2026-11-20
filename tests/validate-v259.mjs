import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 BASE_GOALS_KEY,BASE_METRICS,BASE_RATE_DEFAULTS,BASE_QUANTITY_METRICS,
 cleanBaseGoals,upsertBaseGoals,effectiveBaseGoal,headquartersGoal,isBasePercentage
} from '../src/base-goals.js';
import {analyzeLeadership} from '../src/leadership-dashboard.js';
assert.equal(BASE_GOALS_KEY,'wmSamsBaseGoalsV258');
assert.equal(Object.keys(BASE_METRICS).length,9);
assert.deepEqual([...BASE_QUANTITY_METRICS].sort(),['records','sales']);
assert.deepEqual(BASE_RATE_DEFAULTS,{regular:100,guaranteed:100,dental:90,p0:30,apps:90,purchase:90,quality:90});
for(const [key,value] of Object.entries(BASE_RATE_DEFAULTS)){
 assert(isBasePercentage(key));
 assert.equal(effectiveBaseGoal(cleanBaseGoals(null),'module','Nuevo módulo','2026-11-09',key).value,value);
}
// Migración desde versión anterior: preservar solo cantidades; NO interpretar 8 P0 como 8%.
const legacy={version:1,profiles:{'module|PENSIONES':{name:'Pensiones',type:'module',versions:[{from:'2026-11-02',goals:{records:40,sales:20,p0:8,dental:12}}]}}};
const migrated=cleanBaseGoals(legacy);
assert.equal(migrated.version,2);
assert.equal(effectiveBaseGoal(migrated,'module','Pensiones','2026-11-09','sales').value,20);
assert.equal(effectiveBaseGoal(migrated,'module','Pensiones','2026-11-09','records').value,40);
assert.equal(effectiveBaseGoal(migrated,'module','Pensiones','2026-11-09','p0').value,30);
assert.equal(effectiveBaseGoal(migrated,'module','Pensiones','2026-11-09','dental').value,90);
let db=upsertBaseGoals(migrated,{type:'module',name:'Pensiones',from:'2026-11-09',goals:{sales:30,records:50,p0:25,dental:85,purchase:80,quality:95}});
db=upsertBaseGoals(db,{type:'module',name:'Aviación',from:'2026-11-09',goals:{sales:10,records:20,p0:35,dental:90}});
assert.equal(effectiveBaseGoal(db,'module','Pensiones','2026-11-02','sales').value,20);
assert.equal(effectiveBaseGoal(db,'module','Pensiones','2026-11-09','sales').value,30);
assert.equal(effectiveBaseGoal(db,'module','Pensiones','2026-11-09','p0').value,25);
assert.equal(headquartersGoal(db,'2026-11-09','sales',['Pensiones','Aviación']).value,40);
assert.equal(headquartersGoal(db,'2026-11-09','p0',['Pensiones','Aviación']).value,27.5); // (25*30 +35*10)/40
assert.equal(headquartersGoal(db,'2026-11-09','dental',['Pensiones','Aviación']).value,86.25);
assert.throws(()=>upsertBaseGoals(db,{type:'module',name:'Pensiones',from:'2026-11-16',goals:{p0:101}}),/Meta/);
assert.throws(()=>upsertBaseGoals(db,{type:'module',name:'Pensiones',from:'2026-11-16',goals:{sales:1.5}}),/Meta/);
assert.equal(headquartersGoal(db,'2026-11-09','p0',['Pensiones','Aviación','No configurado']).value,null);
db=upsertBaseGoals(db,{type:'headquarters',name:'Jefatura',from:'2026-11-09',goals:{p0:30}});
assert.equal(headquartersGoal(db,'2026-11-09','p0',['Pensiones','Aviación']).value,30);
const rulesFor=()=>key=>({required:{completion:100,purchase:90,p0:30,app:90}[key],minimum:60});
const rows=[
 ...Array.from({length:8},(_,i)=>({fecha:'2026-11-10',module:'Pensiones',executive:'María',valid:true,code:true,regular:true,guaranteed:false,p0:i<3,dental:i<7,app:true})),
 ...Array.from({length:2},()=>({fecha:'2026-11-11',module:'Pensiones',executive:'María',valid:true,code:true,regular:false,guaranteed:true,p0:false,dental:true,app:true}))
];
const report=analyzeLeadership({rows,from:'2026-11-10',to:'2026-11-10',today:'2026-11-10',knownModules:['Pensiones'],
 weeklyGoal:(week,module,metric)=>effectiveBaseGoal(db,'module',module,week,metric),
 headquartersGoal:(week,module,metric)=>headquartersGoal(db,week,metric,['Pensiones']),rulesFor});
const m=report.modules[0];
assert.equal(m.targets.regular.unit,'percent');
assert.equal(m.targets.regular.value,100);
assert.equal(m.targets.regular.actual,100);
assert.equal(m.targets.guaranteed.actual,0);
assert.equal(m.targets.p0.value,25);
assert.equal(m.targets.p0.actual,37.5);
assert.equal(m.targets.p0.progress,150);
assert.equal(m.targets.dental.value,85);
assert.equal(m.targets.dental.actual,87.5);
assert.equal(m.targets.quality.value,95);
assert.equal(m.targets.sales.unit,'count');
assert(Math.abs(m.targets.sales.value-30/7)<0.0001);
assert.equal(report.totalTargets.quality.unit,'percent');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('src/legacy-app.js','utf8'),print=fs.readFileSync('src/leadership-export.js','utf8');
for(const id of ['records','sales','regular','guaranteed','dental','p0','apps','purchase','quality'])assert(html.includes(`data-base-input="${id}"`));
assert(html.includes('grid-template-columns:repeat(5,minmax(0,1fr))'));
assert(html.includes('grid-template-columns:repeat(5,minmax(110px,1fr))'));
assert(app.includes('t.unit===\'percent\'?lPct(t.actual)'));
assert(print.includes("t.unit==='percent'?percentage(t.actual)"));
assert(fs.existsSync('MANUAL_USUARIO_JEFATURA_MID_MARC_V3041.md')); // Manual vigente: las versiones anteriores solo permanecen en el CHANGELOG.
assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).version,'3.0.4.2');
console.log('V2.6.1: percentages, denominators, migration, Jefatura weighted rates, histories, HTML and two-row KPIs: OK');
