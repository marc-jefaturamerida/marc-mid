import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 BASE_GOALS_KEY,BASE_METRICS,cleanBaseGoals,upsertBaseGoals,effectiveBaseGoal,
 headquartersGoal,knownBaseProfiles,mondayISO
} from '../src/base-goals.js';
import {analyzeLeadership} from '../src/leadership-dashboard.js';
assert.equal(BASE_GOALS_KEY,'wmSamsBaseGoalsV258');
assert.equal(Object.keys(BASE_METRICS).length,9);
assert.equal(mondayISO('2026-11-15'),'2026-11-09');
let db=cleanBaseGoals(null);
db=upsertBaseGoals(db,{type:'module',name:'Pensiones',from:'2026-11-02',goals:{sales:25,records:40,p0:30}});
db=upsertBaseGoals(db,{type:'module',name:'PENSIÓNES',from:'2026-11-16',goals:{sales:35}});
db=upsertBaseGoals(db,{type:'module',name:'Aviación',from:'2026-11-02',goals:{sales:20,records:35,p0:30}});
db=upsertBaseGoals(db,{type:'module',name:'Paseo Montejo',from:'2026-11-02',goals:{sales:15,records:25,p0:30}});
db=upsertBaseGoals(db,{type:'executive',name:'Leticia',from:'2026-11-02',goals:{sales:10}});
assert.equal(effectiveBaseGoal(db,'module','PENSIONES','2026-11-09','sales').value,25);
assert.equal(effectiveBaseGoal(db,'module','PENSIONES','2026-11-16','sales').value,35);
assert.equal(effectiveBaseGoal(db,'module','Pensiones','2026-11-25','records').value,40);
assert.equal(effectiveBaseGoal(db,'executive','Leticia','2026-11-23','sales').value,10);
assert.equal(effectiveBaseGoal(db,'executive','Leticia','2026-10-26','sales').value,null);
assert.equal(db.profiles['module|PENSIONES'].versions.length,2);
const modules=['Pensiones','Aviación','Paseo Montejo'];
assert.equal(headquartersGoal(db,'2026-11-09','sales',modules).value,60);
assert.equal(headquartersGoal(db,'2026-11-16','sales',modules).value,70);
assert.equal(headquartersGoal(db,'2026-11-09','sales',[...modules,'Cuarto módulo']).value,null);
assert.equal(knownBaseProfiles(db,'module',[...modules,'CUARTO MÓDULO']).length,4);
db=upsertBaseGoals(db,{type:'headquarters',name:'Jefatura',from:'2026-11-16',goals:{sales:90}});
assert.equal(headquartersGoal(db,'2026-11-09','sales',modules).value,60);
assert.equal(headquartersGoal(db,'2026-11-16','sales',modules).value,90);
assert.equal(headquartersGoal(db,'2026-11-16','records',modules).value,100);
const restored=cleanBaseGoals(JSON.parse(JSON.stringify(db)));
assert.deepEqual(restored,db);
assert.throws(()=>upsertBaseGoals(db,{type:'module',name:'Pensiones',from:'2026-11-11',goals:{sales:55}}),/lunes/);
assert.throws(()=>upsertBaseGoals(db,{type:'module',name:'Pensiones',from:'2026-11-16',goals:{sales:-5}}),/Meta/);
const rule=()=>key=>({required:{completion:100,purchase:90,p0:30,app:90}[key],minimum:60});
const row=(fecha,module)=>({fecha,module,executive:'Leticia',valid:true,code:true,regular:true,guaranteed:false,p0:true,dental:true,app:true});
const report=analyzeLeadership({rows:[row('2026-11-09','Pensiones'),row('2026-11-10','Aviación')],
 from:'2026-11-09',to:'2026-11-15',today:'2026-11-12',knownModules:modules,
 weeklyGoal:(week,module,metric)=>effectiveBaseGoal(db,'module',module,week,metric),
 headquartersGoal:(week,_module,metric)=>headquartersGoal(db,week,metric,modules),rulesFor:()=>rule()});
assert(Math.abs(report.total.goal-60)<1e-8);
assert.equal(report.totalGoalSource,'Objetivos base · suma de módulos');
assert.equal(report.modules.length,3);
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('src/legacy-app.js','utf8');
for(const id of ['settingsBaseGoalsV258','baseGoalOverlay','baseGoalEffective','baseGoalSave','histGoalProfile','mhGoalProfile','achGoalProfile','baseGoalAdd'])assert(html.includes(`id="${id}"`),id);
assert(app.includes('initBaseGoals()'));
assert(app.includes('function resolveAnalysisGoal('));
assert(app.includes('weeklyGoal:cachedGoal'));
for(const filepath of ['src/cloud-boot.js','netlify/functions/settings.js'])assert(fs.readFileSync(filepath,'utf8').includes(BASE_GOALS_KEY));
assert(!fs.readFileSync('src/base-goals.js','utf8').includes('commission'));
assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).version,'4.0.0');
console.log('V2.5.8: dynamic profiles, historical effective goals, Jefatura overrides, independent persistence and dashboards: OK');
