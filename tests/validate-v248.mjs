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
assert.equal((html.match(/Versión 2\.4\.8<\/footer>/g)||[]).length,5);
assert(source.includes("APP_VERSION='2.4.8'"));
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
assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).version,'2.4.8');
console.log('OK: plantilla de supervisor y motores de exportación vinculados a los mismos cálculos.');

// Contrato real de la exportación: una sola fuente de cifras para PDF y PNG.
const {createSupervisorStatement,supervisorStatementHtml,paintSupervisorStatement}=await import('../src/supervisor-statement.js');
const cExport=result();
const renderModel=createSupervisorStatement(cExport,{
 week:'2026-11-09',weekLabel:()=> '09/11/2026 — 15/11/2026',version:'2.4.8',
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
assert(sample.includes('_12/11/2026 vs. 11/11/2026_'));
assert.equal((sample.match(/```/g)||[]).length,2);
const table=sample.split('```')[1].trim().split('\n');
assert.equal(table.length,7);
assert.equal(new Set(table.map(x=>x.length)).size,1,'Todas las líneas comparten exactamente el mismo ancho');
assert(table[0].includes('20')&&table[0].includes('(+2)'));
assert(table[2].includes('10')&&table[2].includes('(-3)'));
assert(table[4].includes('(0)'));
assert(table[6].includes('92.5%')&&table[6].includes('(+5.25 pp)'));
assert(sample.includes('Garantizadas')&&sample.includes('Programa Cero')&&sample.includes('Plan Dental'));
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
