/** INVEX V2.5.7 | Datos puros del Dashboard de Jefatura.
 * Los cálculos son operativos; nunca sustituyen la liquidación de comisiones.
 * No presupone días trabajados ni convierte ausencia de carga en cero producción.
 */
export const LEADERSHIP_KEY='wmSamsLeadershipV256';
export const LEADERSHIP_DEFAULTS=Object.freeze({
 period:'week',includeSupervisors:true,showTrend:true,showPeople:true,showQuality:true,
 showAlerts:true,showActions:true,showModules:true,showProjection:true,showTargets:true,
 minConversion:20,minProjectedCompletion:100,staleDays:2,topPeople:12,
 exportTitle:'Jefatura Mid Marc · Dashboard de Jefatura',exportSubtitle:'Seguimiento consolidado de módulos',
 exportNote:'Estimaciones operativas basadas en registros manuales disponibles; no sustituyen las comisiones oficiales.',
 color:'#003b7a',actions:[],
 // Metas semanales absolutas por módulo y semana; sin tocar metas de comisiones.
 defaultGoals:{},weeklyGoals:{},goalFallback:'existing',
 projectionMode:'linear',weekdayWeights:[1,1,1,1,1,1,1],
 minQualityAlert:60,alertTargets:false,minTargetProgress:60,
 qualityAlertThresholds:{completion:60,purchase:60,p0:60,app:60},
 targetAlertThresholds:{records:60,dental:60,p0:60,apps:60,purchase:60},collapsedSections:{}
});
const positive=(v,d,max)=>Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=max?Number(v):d;
export function cleanLeadershipSettings(x){
 const v=x&&typeof x==='object'&&!Array.isArray(x)?x:{};
 const actions=Array.isArray(v.actions)?v.actions.slice(-250).filter(a=>a&&typeof a==='object'&&typeof a.id==='string'&&a.id.length<120).map(a=>({
   id:a.id,description:String(a.description||'').slice(0,400),module:String(a.module||'').slice(0,120),
   owner:String(a.owner||'').slice(0,100),due:/^\d{4}-\d{2}-\d{2}$/.test(a.due||'')?a.due:'',
   status:['pending','inprogress','done'].includes(a.status)?a.status:'pending',
   created:/^\d{4}-\d{2}-\d{2}$/.test(a.created||'')?a.created:'',
   note:String(a.note||'').slice(0,350)
 })) : [];
 const cleanGoals=source=>{
  const result={};if(!source||typeof source!=='object'||Array.isArray(source))return result;
  for(const [name,values] of Object.entries(source).slice(0,1200)){
   if(name.length>250||!values||typeof values!=='object'||Array.isArray(values))continue;
   const row={};for(const k of ['sales','records','regular','guaranteed','dental','p0','apps','purchase']){
    const n=Number(values[k]);if(values[k]!==''&&values[k]!==null&&values[k]!==undefined&&Number.isFinite(n)&&n>=0&&n<=1000000)row[k]=n;
   }
   if(Object.keys(row).length)result[name]=row;
  }return result;
 };
 const collapsed={};for(const key of ['leaderSummarySection','leaderModulesSection','leaderTargetsSection','leaderPeopleSection','leaderQualitySection','leaderTrendSection','leaderProjectionSection','leaderAlertsSection','leaderActionsSection'])if(v.collapsedSections?.[key]===true)collapsed[key]=true;
 return {...LEADERSHIP_DEFAULTS,
  defaultGoals:cleanGoals(v.defaultGoals),weeklyGoals:cleanGoals(v.weeklyGoals),
  goalFallback:['existing','manual'].includes(v.goalFallback)?v.goalFallback:'existing',
  projectionMode:['linear','weighted'].includes(v.projectionMode)?v.projectionMode:'linear',
  weekdayWeights:Array.isArray(v.weekdayWeights)&&v.weekdayWeights.length===7&&v.weekdayWeights.every(n=>Number.isFinite(Number(n))&&Number(n)>=0&&Number(n)<=20)&&v.weekdayWeights.some(n=>Number(n)>0)?v.weekdayWeights.map(Number):[1,1,1,1,1,1,1],
  minQualityAlert:positive(v.minQualityAlert,60,200),alertTargets:v.alertTargets===true,
  minTargetProgress:positive(v.minTargetProgress,60,300),
  qualityAlertThresholds:Object.fromEntries(['completion','purchase','p0','app'].map(key=>[key,positive(v.qualityAlertThresholds?.[key],positive(v.minQualityAlert,60,200),300)])),
  targetAlertThresholds:Object.fromEntries(['records','dental','p0','apps','purchase'].map(key=>[key,positive(v.targetAlertThresholds?.[key],positive(v.minTargetProgress,60,300),300)])),collapsedSections:collapsed,
  period:['today','week','month','custom'].includes(v.period)?v.period:'week',
  ...Object.fromEntries(['includeSupervisors','showTrend','showPeople','showQuality','showAlerts','showActions','showModules','showProjection','showTargets'].map(k=>[k,typeof v[k]==='boolean'?v[k]:LEADERSHIP_DEFAULTS[k]])),
  minConversion:positive(v.minConversion,20,100),minProjectedCompletion:positive(v.minProjectedCompletion,100,300),
  staleDays:positive(v.staleDays,2,30),topPeople:Math.max(3,Math.min(60,Math.floor(positive(v.topPeople,12,60)))),
  exportTitle:String(v.exportTitle||LEADERSHIP_DEFAULTS.exportTitle).slice(0,150),
  exportSubtitle:String(v.exportSubtitle||LEADERSHIP_DEFAULTS.exportSubtitle).slice(0,220),
  exportNote:String(v.exportNote||LEADERSHIP_DEFAULTS.exportNote).slice(0,500),
  color:/^#[0-9a-f]{6}$/i.test(v.color||'')?v.color:LEADERSHIP_DEFAULTS.color,
  actions
 };
}
const localDate=v=>new Date(Number(v.slice(0,4)),Number(v.slice(5,7))-1,Number(v.slice(8,10)),12);
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const monday=v=>{const d=localDate(v);d.setDate(d.getDate()-(d.getDay()+6)%7);return iso(d);};
const nextDay=v=>{const d=localDate(v);d.setDate(d.getDate()+1);return iso(d);};
const dayDiff=(a,b)=>Math.round((localDate(b)-localDate(a))/86400000);
export function leadershipRange(period,today,from='',to=''){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(today))throw Error('Fecha inválida.');
 if(period==='today')return {from:today,to:today};
 if(period==='week'){const start=monday(today);let end=start;for(let i=0;i<6;i++)end=nextDay(end);return {from:start,to:end};}
 if(period==='month')return {from:today.slice(0,7)+'-01',to:iso(new Date(Number(today.slice(0,4)),Number(today.slice(5,7)),0,12))};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to||dayDiff(from,to)>366)
  throw Error('Selecciona fechas válidas (máximo 367 días) para el período personalizado.');
 return {from,to};
}
const blank=()=>({records:0,sales:0,regular:0,guaranteed:0,p0:0,dental:0,apps:0,purchase:0,incidences:0,missing:0});
const add=(a,b)=>{for(const k of Object.keys(blank()))a[k]+=b[k]||0;return a;};
function tally(rows){
 const c=blank();
 for(const r of rows){c.records++;if(r.incident)c.incidences++;
  if(!r.valid){if(r.code)c.missing++;continue;}
  c.sales++;if(r.regular)c.regular++;else if(r.guaranteed)c.guaranteed++;
  if(r.dental)c.dental++;if(r.regular&&r.p0)c.p0++;if(r.p0||r.dental)c.purchase++;if(r.app)c.apps++;
 }
 return c;
}
function weeklyForRange(module,from,to,weeklyGoal,metric='sales'){
 // Objetivo prorrateado por día natural; ninguna semana incompleta inventa un total.
 let cursor=from,total=0,steps=0,complete=true;const sources=new Set();
 while(cursor<=to&&steps++<368){
  const returned=weeklyGoal(monday(cursor),module,metric);
  const raw=returned&&typeof returned==='object'?returned.value:returned;
  const source=returned&&typeof returned==='object'?returned.source:'Configuración existente';
  const goal=Number(raw);
  if(raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(goal)&&goal>0){total+=goal/7;sources.add(source||'Configuración existente');}else complete=false;
  cursor=nextDay(cursor);
 }
 return {value:complete?total:null,source:complete?[...sources].join(' + '):'Objetivo no configurado'};
}
/** Un porcentaje no se suma ni se prorratea como una cantidad.
 * Para varias semanas se promedia por días naturales incluidos en el período.
 */
function rateForRange(module,from,to,weeklyGoal,metric){
 let cursor=from,sum=0,days=0,complete=true,steps=0;const sources=new Set();
 while(cursor<=to&&steps++<368){
  const result=weeklyGoal(monday(cursor),module,metric);
  const raw=result&&typeof result==='object'?result.value:result;
  const value=Number(raw);
  if(raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(value)&&value>=0&&value<=100){sum+=value;sources.add(result?.source||'Configuración anterior');}
  else complete=false;
  cursor=nextDay(cursor);days++;
 }
 return {value:complete&&days?sum/days:null,source:complete?[...sources].join(' + '):'Porcentaje no configurado'};
}
const PERCENT_TARGETS=new Set(['regular','guaranteed','dental','p0','apps','purchase','quality']);
function metricRate(counts,key,quality){
 if(key==='quality')return Number.isFinite(quality)?quality:null;
 const numerator=counts[key];
 const denominator=key==='p0'?counts.regular:counts.sales;
 return denominator>0?100*numerator/denominator:null;
}
function reportTargets(counts,quality,module,from,to,weeklyGoal,quantityGoal){
 const result={};
 for(const metric of LEADERSHIP_METRICS){
  if(!PERCENT_TARGETS.has(metric)){
   const r=metric==='sales'?quantityGoal:weeklyForRange(module,from,to,weeklyGoal,metric);
   result[metric]={...r,unit:'count',actual:counts[metric],progress:r.value>0?pct(counts[metric],r.value):null};
  }else{
   const r=rateForRange(module,from,to,weeklyGoal,metric),actual=metricRate(counts,metric,quality);
   result[metric]={...r,unit:'percent',actual,progress:r.value>0&&actual!==null?pct(actual,r.value):null};
  }
 }
 return result;
}
function periodRules(module,from,to,weeklyGoal,rulesFor){
 return key=>{
  const previous=rulesFor(module)(key),metric={purchase:'purchase',p0:'p0',app:'apps'}[key];
  if(!metric)return previous;
  const configured=rateForRange(module,from,to,weeklyGoal,metric).value;
  return configured>0?{...previous,required:configured}:previous;
 };
}
export const LEADERSHIP_METRIC_LABELS=Object.freeze({sales:'Ventas',records:'Trámites',regular:'Regulares',guaranteed:'Garantizadas',dental:'Plan Dental',p0:'Programa Cero',apps:'APP',purchase:'Primera compra',quality:'Calidad Total'});
export const LEADERSHIP_METRICS=Object.keys(LEADERSHIP_METRIC_LABELS);
export const leadershipModuleKey=value=>String(value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toUpperCase();
export const leadershipWeeklyKey=(week,module)=>JSON.stringify([week,leadershipModuleKey(module)]);
export function leadershipTargetGoal(prefs,week,module,metric,existingGoal){
 const weekly=prefs.weeklyGoals?.[leadershipWeeklyKey(week,module)];
 if(weekly&&Object.hasOwn(weekly,metric))return {value:weekly[metric],source:'Meta de Jefatura · semana'};
 const defaults=prefs.defaultGoals?.[leadershipModuleKey(module)];
 if(defaults&&Object.hasOwn(defaults,metric))return {value:defaults[metric],source:'Meta de Jefatura · módulo'};
 if(metric==='sales'&&prefs.goalFallback!=='manual'){
  const legacy=existingGoal(week,module),value=legacy&&typeof legacy==='object'?legacy.value:legacy;
  if(value!==null&&value!==undefined&&Number.isFinite(Number(value))&&Number(value)>0)return {value:Number(value),source:(legacy&&typeof legacy==='object'?legacy.source:'Configuración existente')};
 }
 return {value:null,source:'Sin objetivo definido'};
}
export function projectWeeklySales({salesToDate,weekStart,today,mode='linear',weights=[1,1,1,1,1,1,1]}){
 const elapsed=Math.min(7,Math.max(0,dayDiff(weekStart,today)+1));
 if(!elapsed)return null;
 const effective=mode==='weighted'?weights:[1,1,1,1,1,1,1];
 const observed=effective.slice(0,elapsed).reduce((a,b)=>a+b,0),full=effective.reduce((a,b)=>a+b,0);
 return observed>0&&full>0?salesToDate*full/observed:null;
}
const pct=(a,b)=>b>0?a*100/b:null;
const normalize=v=>String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toUpperCase();
const compatible=(a,b)=>normalize(a)===normalize(b);
function evaluate(rows,goal,rules){
 const c=tally(rows),actual={completion:goal!==null?pct(c.sales,goal):null,
   purchase:pct(c.purchase,c.sales)??0,p0:pct(c.p0,c.regular)??0,app:pct(c.apps,c.sales)??0};
 const factors={};
 for(const k of ['completion','purchase','p0','app']){
  const rule=rules(k),required=Number(rule?.required),minimum=Number.isFinite(rule?.minimum)?rule.minimum:60;
  const value=actual[k]===null||!(required>0)?null:actual[k]/required*100;
  factors[k]=value===null?null:value<minimum?0:(k==='purchase'||k==='app'?Math.min(100,value):value);
 }
 const valid=Object.values(factors).every(Number.isFinite),sum=valid?Object.values(factors).reduce((a,b)=>a+b,0):null;
 return {counts:c,goal,completion:actual.completion,conversion:pct(c.sales,c.records),actual,factors,
  quality:valid?Math.min(100,sum/4):null,global:valid?(sum+Math.min(100,sum/4))/5:null};
}
/** rows: {fecha,module,executive,valid,code,regular,guaranteed,p0,dental,app,incident,supervisor}.
 * weeklyGoal(week,module), rulesFor(module)(key) y permanentIncidents son inyectados por la aplicación.
 */
export function analyzeLeadership({rows=[],from,to,today,weeklyGoal,rulesFor,permanentIncidents=[],includeSupervisors=true,
 minConversion=20,minProjectedCompletion=100,staleDays=2,actions=[],knownModules=[],
 projectionMode='linear',weekdayWeights=[1,1,1,1,1,1,1],minQualityAlert=60,alertTargets=false,minTargetProgress=60,qualityAlertThresholds=null,targetAlertThresholds=null,headquartersGoal=null}){
 const selected=[],byModule=new Map(),latestByModule=new Map();
 const allModules=new Map();
 for(const r of rows){
  const name=String(r.module||'').trim(),key=normalize(name);
  if(name&&!allModules.has(key))allModules.set(key,name);
  if(r.fecha&&(!latestByModule.has(key)||r.fecha>latestByModule.get(key)))latestByModule.set(key,r.fecha);
  if(r.fecha>=from&&r.fecha<=to&&(includeSupervisors||!r.supervisor)){
    selected.push(r);if(!byModule.has(key))byModule.set(key,[]);byModule.get(key).push(r);
  }
 }
 for(const m of knownModules){const name=String(m||'').trim();if(name&&!allModules.has(normalize(name)))allModules.set(normalize(name),name);}
 // Historical modules with no records in the selected period are still shown as such.
 const modules=[...allModules.values()].map(module=>{
  const subset=byModule.get(normalize(module))||[];
  const goalInfo=weeklyForRange(module,from,to,weeklyGoal);
  const goal=goalInfo.value;
  const calc=evaluate(subset,goal,periodRules(module,from,to,weeklyGoal,rulesFor));
  const targets=reportTargets(calc.counts,calc.quality,module,from,to,weeklyGoal,goalInfo);
  const maxDate=latestByModule.get(normalize(module))||null;
  const linked=permanentIncidents.filter(x=>compatible(x.module,module)&&x.active===true&&!x.resolved);
  const salesToDate=tally(subset.filter(r=>r.fecha<=today)).sales;
  const projected=from===monday(today)&&dayDiff(from,to)===6&&today>=from&&today<=to&&goal!==null
   ?projectWeeklySales({salesToDate,weekStart:from,today,mode:projectionMode,weights:weekdayWeights}):null;
  const daysRemaining=from===monday(today)&&today<=to?dayDiff(today,to):null;
  const dailyNeeded=goal!==null&&daysRemaining>0?Math.max(0,Math.ceil((goal-salesToDate)/daysRemaining)):null;
  const freshness=maxDate!==null?dayDiff(maxDate,today):null;
  return {name:module,...calc,goalSource:goalInfo.source,targets,salesToDate,lastDate:maxDate,stale:freshness!==null&&freshness>staleDays,
   projected,projectedCompletion:projected!==null&&goal>0?pct(projected,goal):null,
   daysRemaining,dailyNeeded,pendingIncidents:linked.length};
 }).sort((a,b)=>b.counts.sales-a.counts.sales||a.name.localeCompare(b.name,'es'));
 const byExecutive=new Map();
 for(const r of selected){if(!r.executive)continue;const key=normalize(r.executive);if(!byExecutive.has(key))byExecutive.set(key,{name:r.executive,rows:[],modules:new Set(),supervisor:false});const e=byExecutive.get(key);e.rows.push(r);e.modules.add(r.module);e.supervisor=e.supervisor||r.supervisor;}
 const people=[...byExecutive.values()].map(x=>{
  const counts=tally(x.rows);return {name:x.name,modules:[...x.modules].filter(Boolean),supervisor:x.supervisor,
    counts,conversion:pct(counts.sales,counts.records),contribution:null};
 }).sort((a,b)=>b.counts.sales-a.counts.sales||a.name.localeCompare(b.name,'es'));
 const totalGoalInfo=typeof headquartersGoal==='function'?weeklyForRange('Jefatura',from,to,headquartersGoal):null;
 const allGoal=totalGoalInfo?.value!==null&&totalGoalInfo?.value!==undefined?totalGoalInfo.value:(modules.every(m=>m.goal!==null)?modules.reduce((sum,m)=>sum+m.goal,0):null);
 const groupGoal=(week,module,metric)=>typeof headquartersGoal==='function'?headquartersGoal(week,module,metric):weeklyGoal(week,module,metric);
 const total=evaluate(selected,allGoal,periodRules('Jefatura',from,to,groupGoal,rulesFor));
 const totalTargets=reportTargets(total.counts,total.quality,'Jefatura',from,to,groupGoal,totalGoalInfo||{value:allGoal,source:'Suma de módulos'});
 for(const p of people)p.contribution=pct(p.counts.sales,total.counts.sales);
 const alerts=[];
 const addAlert=(level,category,module,message)=>alerts.push({level,category,module,message});
 for(const m of modules){
  if(m.goal===null)addAlert('info','objetivo',m.name,'Sin objetivo de ventas verificado para el período.');
  if(m.projectedCompletion!==null&&m.projectedCompletion<minProjectedCompletion)
   addAlert('high','proyección',m.name,`Proyección ${m.projectedCompletion.toFixed(1)}% del objetivo semanal.`);
  if(m.counts.records>0&&m.conversion!==null&&m.conversion<minConversion)
   addAlert('medium','conversión',m.name,`Conversión ${m.conversion.toFixed(1)}%, inferior al umbral ${minConversion}%.`);
  for(const k of ['completion','purchase','p0','app'])if(m.counts.records>0&&m.goal!==null&&m.factors[k]!==null&&m.factors[k]<(qualityAlertThresholds?.[k]??minQualityAlert))
   addAlert('medium','calidad',m.name,`Calidad de ${({completion:'Cumplimiento',purchase:'Primera compra',p0:'Programa Cero',app:'APP'})[k]}: ${m.factors[k].toFixed(1)}%.`);
  if(alertTargets&&m.counts.records>0&&to<=today){for(const key of ['records','dental','p0','apps','purchase']){
   const t=m.targets[key];if(t.progress!==null&&t.progress<(targetAlertThresholds?.[key]??minTargetProgress))addAlert('medium','objetivo',m.name,`${LEADERSHIP_METRIC_LABELS[key]}: ${t.progress.toFixed(1)}% de la meta operativa (mínimo ${targetAlertThresholds?.[key]??minTargetProgress}%).`);
  }}
  if(m.pendingIncidents)addAlert('medium','incidencias',m.name,`${m.pendingIncidents} incidencia(s) activa(s) sin resolver.`);
  if(m.counts.records===0)addAlert('info','datos',m.name,'No hay registros en el período; verificar si la carga está completa antes de evaluar productividad.');
  if(m.stale)addAlert('info','actualización',m.name,`Último registro disponible: ${m.lastDate}. Revisar actualización, sin asumir ausencia de ventas.`);
 }
 alerts.sort((a,b)=>({high:0,medium:1,info:2}[a.level]-{high:0,medium:1,info:2}[b.level]));
 const days=new Map();for(const r of selected){if(!days.has(r.fecha))days.set(r.fecha,[]);days.get(r.fecha).push(r);}
 const trend=[...days.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,rs])=>({date,...tally(rs)}));
 const pendingActions=actions.filter(a=>a.status!=='done');
 return {from,to,today,modules,people,selectedRows:selected.length,total,totalTargets,alerts,trend,
   totalGoalSource:totalGoalInfo?.value!==null&&totalGoalInfo?.value!==undefined?totalGoalInfo.source:'Suma de módulos',pendingActions,overdueActions:pendingActions.filter(a=>a.due&&a.due<today),
   incidents:permanentIncidents.filter(x=>x.active===true&&!x.resolved).length,
   withGoal:modules.filter(m=>m.goal!==null).length};
}
