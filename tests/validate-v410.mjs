import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {weekdayOccurrences,analyzeWeekday,formatDayAnalysisText} from '../src/day-analysis.js';
import {findMissingBaseGoals,saveQuickBaseGoals} from '../src/goals-workflow.js';
import {cleanBaseGoals,effectiveBaseGoal} from '../src/base-goals.js';
import {localBrowserMode} from '../src/local-archives.js';
const html=readFileSync('index.html','utf8'),source=readFileSync('src/legacy-app.js','utf8'),pkg=JSON.parse(readFileSync('package.json','utf8'));
assert.equal(pkg.version,'4.1.1');assert(source.includes("APP_VERSION='4.1.1'"));
for(const id of ['dayAnalysisPage','dayFrom','dayTo','dayWeekday','dayGoal','dayModules','dayExecutives','dayModuleRows','dayExecutiveRows','dayPdf','dayPng','dayCopyFloat','daySettingsOpen','goalAuditFill'])assert(html.includes(`id="${id}"`),`Falta ${id}`);
assert(source.includes("dayAnalysis:'Análisis del día'"));
assert(source.includes("dayAnalysis:'analysis'"));
assert.match(source,/const groups=new Map\(\);[\s\S]*?for\(const item of items\)/);
assert.match(source,/const key=item\.type\+'\|'\+normalizeName\(item\.name\)/);
assert(source.includes('const next=saveQuickBaseGoals(baseGoals,goalAuditItems,values)'));
assert.equal(weekdayOccurrences('2026-11-01','2026-11-30',1).length,5);
assert.deepEqual(weekdayOccurrences('2026-11-01','2026-11-15',1),['2026-11-02','2026-11-09']);
assert.deepEqual(weekdayOccurrences('2026-11-17','2026-11-17',1),[]);
assert.deepEqual(weekdayOccurrences('2026-02-30','2026-03-10',1),[]);
const rows=[
 {fecha:'2026-11-02',module:'Paseo Montejo',executive:'Ana',code:'123',status:'',guaranteed:'NO',dental:'SI',p0:'SI',inc:false},
 {fecha:'2026-11-02',module:'Aviación',executive:'Luis',code:'124',status:'',guaranteed:'SI',dental:'NO',p0:'SI',inc:false},
 {fecha:'2026-11-09',module:'Paseo Montejo',executive:'Ana',code:'125',status:'',guaranteed:'NO',dental:'SI',p0:'NO',inc:false},
 {fecha:'2026-11-09',module:'Paseo Montejo',executive:'Ana',code:'126',status:'CANCELADA',guaranteed:'SI',dental:'SI',p0:'NO',inc:false},
 {fecha:'2026-11-09',module:'Paseo Montejo',executive:'Ana',code:'127',status:'',guaranteed:'NO',dental:'SI',p0:'SI',inc:true},
 {fecha:'2026-11-10',module:'Paseo Montejo',executive:'Ana',code:'128',status:'',guaranteed:'SI',dental:'SI',p0:'NO',inc:false},
 {fecha:'2026-11-10',module:'Pensiones',executive:'Beto',code:'129',status:'',guaranteed:'SI',dental:'SI',p0:'NO',inc:false}
];
const yes=v=>String(v).toUpperCase()==='SI',no=v=>String(v).toUpperCase()==='NO';
const payable=r=>!!r.code&&(yes(r.guaranteed)||no(r.guaranteed))&&!['CANCELADA','INCOMPLETA','RECHAZO'].includes(r.status)&&!r.inc;
const r=analyzeWeekday(rows,{from:'2026-11-01',to:'2026-11-30',weekday:1,goal:2,payable,isYes:yes,isNo:no});
assert.equal(r.periods,5);assert.equal(r.totals.sales,3);assert.equal(r.totals.regular,2);assert.equal(r.totals.guaranteed,1);assert.equal(r.totals.dental,2);assert.equal(r.totals.p0,1);
assert.equal(r.totals.averages.sales,.6);assert.equal(r.totals.goalCompletion,30);assert.equal(r.totals.percentages.p0,50);
assert.equal(r.totals.percentages.sales,100);assert.equal(r.modules.length,3);assert.equal(r.modules.find(m=>m.name==='Pensiones').sales,0,'Los módulos sin ventas los lunes deben aparecer con cero');
const and=analyzeWeekday(rows,{from:'2026-11-01',to:'2026-11-30',weekday:1,modules:['Paseo Montejo'],executives:['Luis'],payable,isYes:yes,isNo:no});
assert.equal(and.totals.sales,0,'Los filtros de módulos y ejecutivos deben intersectarse');
assert.match(formatDayAnalysisText(r),/5.*períodos|Períodos: 5/);
let store=cleanBaseGoals(null);
const missing=[{key:'2026-11-02|module|AVIACION',type:'module',name:'Aviación',week:'2026-11-02',missingRecords:true,missingSales:true},{key:'2026-11-09|module|AVIACION',type:'module',name:'Aviación',week:'2026-11-09',missingRecords:true,missingSales:true}];
const values=Object.fromEntries(missing.map(m=>[m.key,{records:'8',sales:'5'}]));
store=saveQuickBaseGoals(store,missing,values);
assert.equal(effectiveBaseGoal(store,'module','Aviación','2026-11-02','records').value,8);
assert.equal(effectiveBaseGoal(store,'module','Aviación','2026-11-09','sales').value,5);
assert(source.includes('await saveLocalXls(record)'), 'Una importación temporal local debe persistirse en IndexedDB');
assert(source.includes('archive.tempReports=await loadLocalXls()'),'Reabrir localhost debe restaurar XLS');
assert(existsSync('src/day-analysis-export.js'));assert(source.includes("downloadPdfCanvases([dayExportCanvas()]"),'PDF una sola página');
assert(source.includes("['dayPng','png']"));
assert.equal(typeof localBrowserMode,'function');
console.log('V4.1: días inclusive con ceros, ventas pagables, filtros múltiples, P0, objetivos agrupados, Storage intacto y exportación vertical: OK');
