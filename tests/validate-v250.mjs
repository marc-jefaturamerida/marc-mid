import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/legacy-app.js','utf8');
const excerpt=(start,end)=>{
 const p=source.indexOf(start),q=source.indexOf(end,p);
 assert(p>=0&&q>p,`Falta bloque: ${start}`);
 return source.slice(p,q);
};
const ctx=vm.createContext({
 structuredClone,Math,Number,Object,Array,String,JSON,Map,Set,
 supView:{week:'2026-11-09'},localStorage:{getItem:()=>null},SUP_COMMISSION_KEY:'wmSamsMeridaSupervisorCommissionV24',
 DEFAULT_TIER:[{min:50,sale:100,dental:50,app:10,p0:100},{min:80,sale:200,dental:50,app:20,p0:100},{min:100,sale:300,dental:50,app:30,p0:100}],
 hasCode:r=>!!r.code,isNo:v=>v==='No',isYes:v=>v==='Sí',
 appEnabled:r=>r.app===true,
 candidate:r=>!!r.code,
 excluded:r=>r.incident===true||r.bad===true,
 guaranteeType:r=>r.guaranteed==='Sí'?'guar':'reg',
 selectedIncident:r=>r.incident===true,
 dynamicBonusRows:rows=>rows.filter(r=>r.dynamic===true&&!!r.code&&!r.incident&&!r.bad),
 dynamicBonusAmount:()=>50,
 supervisorWeekRows:()=>ctx.fixtures,
 supervisorModuleGoal:()=>10,
 supIncidentRate:n=>[0,0,10,20,30][Math.min(4,n)],
 round:v=>Math.round((v+Number.EPSILON)*100)/100,
});
vm.runInContext(excerpt('const QUALITY_STORAGE_V22=', 'let qualityConfig='),ctx);
vm.runInContext(excerpt('function qualityMetricFactor(', 'function qualityPercentText('),ctx);
vm.runInContext(excerpt('function countQualityRows(', 'function availableWeeks('),ctx);
vm.runInContext(excerpt('const SUP_FACTOR_KEYS=', 'const supView='),ctx);
vm.runInContext(excerpt('function supervisorQuality(', 'function supText('),ctx);
const evalJs=s=>vm.runInContext(s,ctx);
function eq(expr,actual,message){
 const value=evalJs(expr);assert(Math.abs(value-actual)<1e-8,`${message}: ${value} !== ${actual}`);
}
eq('cleanQualityConfig(null).minima.completion',60,'mínimo de dashboard');
eq('normalizeSupervisorCommission(null).minimum.p0',60,'mínimo de supervisor');
eq('qualityMetricFactor(15,30,{minimum:60})',0,'umbral calidad inferior 60%');
eq('qualityMetricFactor(18,30,{minimum:60})',60,'umbral calidad igual a 60%');
eq('qualityMetricFactor(36,30,{minimum:60})',120,'Programa Cero sobre 100%');
eq('correctedGlobalQuality({completion:100,purchase:85,p0:80,app:95}).composite',90,'Calidad Total');
eq('correctedGlobalQuality({completion:100,purchase:85,p0:80,app:95}).global',90,'Alcance Global');
eq('correctedGlobalQuality({completion:150,purchase:90,p0:160,app:100}).global',120,'Alcance Global sin tope');
eq('cleanQualityConfig({minima:{completion:0,p0:20,purchase:0},modules:{A:{minima:{app:0,p0:30}}}}).minima.completion',60,'migrar valor heredado 0');
eq('cleanQualityConfig({minima:{completion:0,p0:20,purchase:0},modules:{A:{minima:{app:0,p0:30}}}}).modules.A.minima.p0',30,'preservar mínimo personalizado');
eq('cleanQualityConfig({minimumRuleVersion:1,minima:{completion:0}}).minima.completion',0,'respetar 0 ingresado tras migración');
eq('normalizeSupervisorCommission({minimum:{completion:0,p0:50}}).minimum.completion',60,'migrar 0 supervisor');
eq('normalizeSupervisorCommission({minimumRuleVersion:1,minimum:{completion:0},includeSupervisorSales:false}).minimum.completion',0,'mínimo de supervisor 0 explícito');
assert.equal(evalJs('normalizeSupervisorCommission(null).includeSupervisorSales'),true);
const team=(n,p0n=3)=>Array.from({length:n},(_,i)=>({code:`T${i}`,guaranteed:'No',p0:i<p0n?'Sí':'No',dental:'Sí',app:true,folio:`T${i}`}));
const own=n=>Array.from({length:n},(_,i)=>({code:`S${i}`,guaranteed:'No',p0:'No',dental:'No',app:false,folio:`S${i}`}));
const selected={module:'Paseo Montejo',name:'Supervisor'};
ctx.fixtures={selected,team:team(8),own:own(2),otherSupervisors:[]};
evalJs('supSettings=normalizeSupervisorCommission({baseBonus:4000,goals:{"Paseo Montejo":10}})');
const result=()=>evalJs('supervisorCalculator()');
let c=result();
assert.equal(c.includeSupervisorSales,true);
assert.equal(c.completionSales,10);
assert.equal(c.completion,100);
assert.equal(c.teamCompletion,80);
assert.equal(c.tier.min,80);
assert.equal(c.q.factors.p0,125);
assert.equal(c.q.composite,100);
assert.equal(c.q.global,105);
assert.equal(c.base,4200);
assert.equal(c.extras,0);
// Switch must change compliance and global, but not the tariff tier.
evalJs('supSettings.includeSupervisorSales=false');
c=result();
assert.equal(c.completion,80);
assert.equal(c.completionSales,8);
assert.equal(c.tier.min,80);
assert.equal(c.q.global,101);
assert.equal(c.base,3232);
// Above 100%: no additional multiplication by the excess.
ctx.fixtures={selected,team:team(10),own:own(2),otherSupervisors:[]};
evalJs('supSettings.includeSupervisorSales=true');
c=result();
assert.equal(c.completion,120);
assert.equal(c.completionMultiplier,1);
assert.equal(c.q.global,104);
assert.equal(c.base,4160);
assert.equal(c.extras,2000);
assert.equal(c.additional.filter(b=>b.earned>0).length,1);
// Editing bonus amounts/thresholds preserved.
evalJs('supSettings.additional=[{threshold:105,amount:700},{threshold:115,amount:1600},{threshold:125,amount:2400}]');
c=result();
assert.equal(c.extras,1600);
assert.equal(c.additional.filter(b=>b.earned>0).length,1);
// Valid own-sales only: an incident and non-payable status must not increase compliance.
ctx.fixtures={selected,team:team(8),own:[...own(1),{...own(1)[0],code:'BAD',incident:true}, {code:'N',bad:true}],otherSupervisors:[]};
evalJs('supSettings.includeSupervisorSales=true');
c=result();
assert.equal(c.completionSales,9);
assert.equal(c.completion,90);
assert.equal(c.ownValid.length,1);
// Nuevo bono fijo se agrega después de los descuentos sin alterar la tarifa ni el bono del módulo.
ctx.fixtures={selected,team:[...team(8),{...team(1)[0],code:'T-DYN',dynamic:true}],own:[{...own(1)[0],dynamic:true},{code:'BAD',dynamic:true,incident:true},{code:'REJ',dynamic:true,bad:true}],otherSupervisors:[]};
evalJs('supSettings.includeSupervisorSales=true');
c=result();
assert.equal(c.ownDynamicBonusCount,1);
assert.equal(c.ownDynamicBonus,50);
assert.equal(c.total,Math.round((c.incentiveNet+c.ownNet+50)*100)/100);
assert.equal(c.ownGross-c.ownP0Discount-c.ownIncDiscount,c.ownNet);
// Prueba del motor de ejecutivos: recuento de dinámica, descuentos, recuperación y tope por ventas.
ctx.KEYS=['goal','reg','guar','dental','app','p0','xreg','xguar','xdental','xapp','xp0','inc','recover'];
ctx.TIER=[{min:50,sale:100,dental:50,app:10,p0:100,bonus:300},{min:100,sale:200,dental:50,app:20,p0:100,bonus:500}];
vm.runInContext(excerpt('  function calculate(d){','  // V14 ·'),ctx);
const paymentD={goal:10,reg:8,guar:0,dental:8,app:8,p0:0,xreg:0,xguar:0,xdental:0,xapp:0,xp0:0,inc:0,recover:100,dynamicBonusCount:2};
ctx.paymentD=paymentD;
const executive=evalJs('calculate(paymentD)');
assert.equal(executive.ok,true);
assert.equal(executive.dynamicBonusCount,2);
assert.equal(executive.dynamicBonus,100);
assert.equal(executive.net,executive.afterPenalty-executive.recover+100);
ctx.paymentD={...paymentD,inc:2,xreg:2,xdental:2,xapp:2,dynamicBonusCount:30};
const capped=evalJs('calculate(paymentD)');
assert.equal(capped.dynamicBonusCount,capped.validSales);
assert.equal(capped.net,Math.round((capped.afterPenalty-capped.recover+capped.dynamicBonus)*100)/100);
// Version stamped uniformly in UI and generated reports.
const html=fs.readFileSync('index.html','utf8');
assert(!html.includes('Versión 2.4.2</footer>'));
assert.equal((html.match(/Versión 3\.0\.4\.1<\/footer>/g)||[]).length,5);
assert(source.includes("APP_VERSION='3.0.4.1'"));
assert(source.includes('write(\'Versión \'+APP_VERSION'));
assert(source.includes('data-sup-include-sales'));
assert(source.includes('data-dynamic-bonus-id'));
assert(source.includes('data-sup-dynamic-bonus-id'));
assert(source.includes('toggleSettings(false)'));
assert(source.includes('DYNAMIC_BONUS_KEY'));
assert(html.includes('id="saveSettingsAndClose"'));
assert(html.includes('id="settingsDynamicBonus"'));
assert(source.includes("el('dynamicBonusAmount').value=dynamicBonusAmount()"));
assert(fs.readFileSync('src/cloud-boot.js','utf8').includes('wmSamsMeridaBonusDinamicaV245'));
assert(fs.readFileSync('netlify/functions/settings.js','utf8').includes('wmSamsMeridaBonusDinamicaV245'));
console.log('OK: cálculos, versiones, mínimos, dinámica en folios, supervisor y sincronización.');

// Diseño de estado de comisión: mismo modelo de datos para PNG y PDF.
const statement=fs.readFileSync('src/supervisor-statement.js','utf8');
assert(source.includes("from './supervisor-statement.js'"));
assert(source.includes('supervisorStatementHtml(model)'));
assert(source.includes('paintSupervisorStatement(ctx,true,supModel)'));
for(const term of ['Estado de comisión · Supervisor','Nómina semanal','ALCANCE GLOBAL','Bono por dinámica','Folios propios','ss-pay','@page{size:A4 portrait'])assert(statement.includes(term),`No aparece elemento de diseño: ${term}`);
assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).version,'3.0.4.1');
console.log('OK: plantilla de supervisor y motores de exportación vinculados a los mismos cálculos.');

// Contrato real de la exportación: una sola fuente de cifras para PDF y PNG.
const {createSupervisorStatement,supervisorStatementHtml,paintSupervisorStatement}=await import('../src/supervisor-statement.js');
const cExport=result();
const renderModel=createSupervisorStatement(cExport,{
 week:'2026-11-09',weekLabel:()=> '09/11/2026 — 15/11/2026',version:'2.5.0',
 settings:evalJs('supSettings'),goalFor:()=>10,fmtDay:s=>s||'—',
 eligible:r=>!!r.code&&!r.incident&&!r.bad,
 fee:(r,c)=>!r.code||r.incident||r.bad?0:c.tier.sale+(r.app?c.tier.app:0)+(r.dental==='Sí'?c.tier.dental:0)+(r.p0==='Sí'?c.tier.p0:0),
 guarantee:r=>r.guaranteed==='Sí'?'guar':'reg',hasP0:r=>r.p0==='Sí',hasDental:r=>r.dental==='Sí',
 hasApp:r=>r.app===true,incident:r=>r.incident===true,marked:r=>r.dynamic===true,
 dynamicAmount:50,printed:{team:true,bonus:true,own:true,recordsOwn:true,recordsTeam:false,search:false}
});
assert.equal(renderModel.total,cExport.total);
assert.equal(renderModel.teamValid,cExport.teamValid.length);
assert.equal(renderModel.global,cExport.q.global);
assert.equal(renderModel.ownFolios.at(-1).cells[9],new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cExport.ownDynamicBonus));
assert(supervisorStatementHtml(renderModel).includes('A PAGAR'));
assert(supervisorStatementHtml(renderModel).includes('ss-ownFolios'));
assert(!supervisorStatementHtml(renderModel).includes('ss-teamFolios'));
const ctxFake={font:'',measureText:t=>({width:String(t).length*6})};
const canvasSize=paintSupervisorStatement(ctxFake,false,renderModel);
assert.equal(canvasSize.width,1120);
assert(canvasSize.height>450);
console.log('OK: las cifras del estado coinciden con el cálculo; reporte y PNG comparten el modelo.');

// V2.4.8 · Texto monoespaciado para WhatsApp; todos los indicadores reales por módulo.
const {buildDailyWhatsAppReport,DAILY_WHATSAPP_LABELS}=await import('../src/daily-whatsapp-report.js');
const sample=buildDailyWhatsAppReport({
 currentDate:'2026-11-12',previousDate:'2026-11-11',todayIso:'2026-11-12',
 current:{records:20,sales:15,reg:10,guar:2,p0:4,dental:8},
 previous:{records:18,sales:12,reg:13,guar:0,p0:4,dental:7},
 currentQuality:92.5,previousQuality:87.25
});
assert.equal(DAILY_WHATSAPP_LABELS.length,6);
assert(sample.startsWith('*Reporte general de hoy versus ayer.*'));
assert(!sample.includes('_12/11/2026 vs. 11/11/2026_')); // fechas sin repetirse
assert.equal((sample.match(/```/g)||[]).length,2);
const table=sample.split('```')[1].trim().split('\n');
assert.equal(table.length,6);
assert(table.every(x=>/^.{8}\S.{2,}\(/.test(x)),'Columnas alineadas en WhatsApp');
assert(table[0].includes('20')&&table[0].includes('(+2)'));
assert(table[2].includes('10')&&table[2].includes('(-3)'));
assert(table[4].includes('(0)'));
assert(sample.split('```')[2].includes('Calidad  92.5%  (+5.25 pp)')); // calidad separada del monoespaciado
assert(sample.includes('Garant.')&&sample.includes('P. Cero')&&sample.includes('Dental'));
const other=buildDailyWhatsAppReport({
 currentDate:'2026-11-09',previousDate:'2026-11-05',todayIso:'2026-11-12',
 current:{records:0,sales:0,reg:0,guar:0,p0:0,dental:0},
 previous:{records:0,sales:0,reg:0,guar:0,p0:0,dental:0},
 currentQuality:null,previousQuality:null
});
assert(other.startsWith('*Reporte general del 09/11/2026 versus 05/11/2026.*'));
assert(other.includes('Calidad')&&other.includes('—'));
assert.throws(()=>buildDailyWhatsAppReport({currentDate:'2026-11-12',previousDate:'2026-11-12',current:{},previous:{},todayIso:'2026-11-12'}),/distintas/);
assert(html.includes('id="dailyCopyWhatsApp"'));
assert(html.includes('class="daily-copy-whatsapp"'));
assert(source.includes("el('dailyCopyWhatsApp').addEventListener('click',copyDailyWhatsApp)"));
assert(source.includes("const {totals}=dailyGroups('module',dates)"));
assert(source.includes("qualityResult(totals.currentRows,'module','TOTAL','daily').global"));
assert(source.includes("filterPageSupervisors(imported.data.rows,'daily')"));
console.log('OK: WhatsApp, siete indicadores, signos, fechas, ancho fijo y datos de la tabla por módulo.');

// V2.5.0 · Vigencia por navegador/usuario, sin guardado de credenciales.
const policy=await import('../src/session-lifetime.js');
const store=new Map();
const storage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const started=Date.UTC(2026,10,13);
const original=policy.rememberSession(storage,'usuario-A',started);
assert.equal(original.expiresAt,started+7*86400000);
assert.equal(policy.rememberSession(storage,'usuario-A',started+86400000).expiresAt,original.expiresAt,'reabrir no amplía vigencia');
assert.equal(policy.isRememberedSessionExpired(storage,'usuario-A',started+6*86400000),false);
assert.equal(policy.isRememberedSessionExpired(storage,'usuario-A',original.expiresAt),true);
assert.equal(policy.isRememberedSessionExpired(storage,'usuario-B',original.expiresAt),false);
assert.equal(policy.rememberSession(storage,'usuario-A',started+86400000,true).expiresAt,started+8*86400000,'login con credenciales renueva la fecha');
assert.equal(policy.rememberSession(storage,'usuario-B',started+2*86400000).userId,'usuario-B','no reutiliza marca entre cuentas');
policy.clearRememberedSession(storage);
assert.equal(policy.readRememberedSession(storage),null,'salir borra marca');
const cloud=fs.readFileSync('src/cloud-boot.js','utf8');
const server=fs.readFileSync('netlify/lib/_shared.js','utf8');
assert(cloud.includes('await refreshSession()'),'restaurar sesión en el navegador');
assert(server.includes('await refreshSession()'),'renovación en endpoints protegidos');
assert(cloud.includes('isRememberedSessionExpired(localStorage,user.id)'),'vencimiento a los 7 días');
assert(cloud.includes('clearRememberedSession(localStorage)'),'salida limpia');
assert(!cloud.includes('localStorage.setItem(\'nf_refresh\''),'no almacena tokens manualmente');
console.log('OK: siete días, renovación autenticada en cliente/servidor y salida de sesión.');

// V2.5.0 · Incidencias independientes de los XLS y navegación personalizable.
const migration=fs.readFileSync('netlify/database/migrations/20261113180000_create_incidents.sql','utf8');
const incidenceApi=fs.readFileSync('netlify/functions/incidents.js','utf8');
const redirects=fs.readFileSync('netlify.toml','utf8');
assert(migration.includes('CREATE TABLE IF NOT EXISTS dashboard_incidents'));
assert(migration.includes('PRIMARY KEY(owner_id,folio_key)'));
assert(!migration.includes('REFERENCES dashboard_reports'),'incidencias sin dependencia del historial XLS');
assert(incidenceApi.includes('WHERE owner_id=${owner}'),'aislamiento de cuenta');
assert(incidenceApi.includes('dashboard_incidents.comments || EXCLUDED.comments'),'comentarios acumulativos');
assert(incidenceApi.includes('ON CONFLICT(owner_id,folio_key)'),'una incidencia por folio');
assert(redirects.includes('from = "/api/incidents"'));
assert(source.includes('incidentRecords.get(key)'),'reconciliación por folio');
assert(source.includes('await migrateLegacyIncidents()'),'migración marcas previas');
assert(source.includes('initMondayReminder()'),'recordatorio de lunes');
assert(source.includes('switchPage(pageNavigation.home)'),'página principal configurable');
assert(source.includes("DEFAULT_PAGE_ORDER=['leadership'"),'Dashboard de Jefatura como inicio predeterminado');
assert(html.includes('id="incidencePage"')&&html.includes('id="incComment"')&&html.includes('id="incResolved"'));
assert(html.includes('id="floatingExport"')&&html.includes('id="pageOrderList"'));
assert(!html.includes('Versión 2.4.9</footer>'),'pies actualizados');
assert(cloud.includes('wmSamsNavOrderV250'),'sincronización de orden de páginas');
console.log('OK: incidencias independientes, comentarios históricos, sincronización, menú flotante y recordatorio de lunes.');

// Comportamiento de la reconciliación: mismo folio en otro XLS, incluso con UID distinto.
const ctxInc=vm.createContext({String,Set,Map,Array,Object,JSON,DEFAULT_PAGE_ORDER:['leadership','daily','individual','team','incidents'],
 incidentRecords:new Map(),imported:{flags:new Set(['antiguo'])},GROUP_DEFAULT:['analysis','commissions','administration','settings'],DEFAULT_GROUP_MAP:{leadership:'analysis',daily:'analysis',individual:'commissions',team:'analysis',incidents:'administration'}});
vm.runInContext(excerpt('function validNavSettings(', 'let pageNavigation='),ctxInc);
vm.runInContext(excerpt('const normalizeIncidentFolio=', 'let incidentLoaded='),ctxInc);
vm.runInContext(excerpt('const selectedIncident=', 'const appEnabled='),ctxInc);
assert.equal(vm.runInContext('normalizeIncidentFolio(" 2063-7784 ")',ctxInc),'20637784');
assert.equal(vm.runInContext('validNavSettings(null).home',ctxInc),'leadership');
assert.equal(vm.runInContext('validNavSettings({order:["incidents","incidents","xxx"],home:"xxx"}).order.length',ctxInc),5);
ctxInc.incidentRecords.set('20637784',{folio_key:'20637784',active:true});
ctxInc.row={folio:'2063-7784',uid:'nuevo-identificador'};
assert.equal(vm.runInContext('selectedIncident(row)',ctxInc),true,'folio nuevo hereda marca permanente');
ctxInc.incidentRecords.set('20637784',{folio_key:'20637784',active:false});
ctxInc.row.uid='antiguo';
assert.equal(vm.runInContext('selectedIncident(row)',ctxInc),false,'desactivación permanente prevalece sobre marca XLS previa');
ctxInc.row={folio:'otro',uid:'antiguo'};
assert.equal(vm.runInContext('selectedIncident(row)',ctxInc),true,'marcas antiguas permanecen mientras se migran');
console.log('OK: folio histórico se reconoce en XLS nuevos, desactivación estable y preferencias por defecto.');

const syncFunction=fs.readFileSync('netlify/functions/sync.js','utf8');
assert(syncFunction.includes('FROM dashboard_incidents WHERE owner_id=${owner}'));
assert(cloud.includes('changedIncidents')&&cloud.includes('incidenceVersions'),'incidencias sincronizadas al volver de inactividad');
assert(!migration.includes('DROP TABLE'),'migración no destructiva');
console.log('OK: revisión remota de cambios entre dispositivos sin borrar datos previos.');
