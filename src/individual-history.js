/** INVEX 2.5.3 · Motor histórico independiente del DOM.
 * El origen son únicamente los XLS disponibles. Objetivos mensuales: sumatoria
 * del objetivo semanal vigente cada día calendario / 7.
 */
export const HISTORY_KEY='wmSamsHistoricalIndividualV253';
export const HISTORY_METRICS=Object.freeze([
 ['records','Registros'],['sales','Ventas'],['regular','Regulares'],['guaranteed','Garantizadas'],
 ['p0','Programa Cero'],['dental','Plan Dental'],['apps','Activaciones APP'],
 ['quality','Calidad Total'],['global','Alcance Global']
]);
export const HISTORY_DEFAULTS=Object.freeze({
 metrics:HISTORY_METRICS.map(x=>x[0]),chartMetric:'sales',showChart:true,showSummary:true,
 showAverages:true,showTable:true,showGoalColumn:true,showModuleColumn:true,
 exportTitle:'Análisis histórico individual',exportSubtitle:'Histórico basado en registros manuales disponibles',
 exportNote:'Los promedios usan exclusivamente períodos con registros. Calidad Total y Alcance Global se recalculan con totales y objetivos, no promediando porcentajes.',
 color:'#003b7a',rowsPerPage:23,exportOrientation:'portrait',
 defaultPeriod:'day',defaultWeekday:'today',periodGoals:{}, goalMultiplier:1
});
export function cleanHistorySettings(v){
 const src=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const known=new Set(HISTORY_METRICS.map(x=>x[0]));
 const metrics=Array.isArray(src.metrics)?[...new Set(src.metrics.filter(x=>known.has(x)))]:HISTORY_DEFAULTS.metrics;
 const goals={};
 if(src.periodGoals&&typeof src.periodGoals==='object')for(const [k,x] of Object.entries(src.periodGoals)){
   if(k.length<240&&Object.keys(goals).length<8000&&Number.isFinite(Number(x))&&Number(x)>0&&Number(x)<100000)goals[k]=Number(x);
 }
 const safeText=(s,f,max=240)=>typeof s==='string'?s.slice(0,max):f;
 return {
  ...HISTORY_DEFAULTS,...src,metrics:metrics.length?metrics:[...HISTORY_DEFAULTS.metrics],periodGoals:goals,
  chartMetric:known.has(src.chartMetric)?src.chartMetric:'sales',
  ...Object.fromEntries(['showChart','showSummary','showAverages','showTable','showGoalColumn','showModuleColumn'].map(k=>[k,typeof src[k]==='boolean'?src[k]:HISTORY_DEFAULTS[k]])),
  exportTitle:safeText(src.exportTitle,HISTORY_DEFAULTS.exportTitle),exportSubtitle:safeText(src.exportSubtitle,HISTORY_DEFAULTS.exportSubtitle),exportNote:safeText(src.exportNote,HISTORY_DEFAULTS.exportNote,600),
  color:/^#[0-9a-f]{6}$/i.test(src.color||'')?src.color:HISTORY_DEFAULTS.color,
  rowsPerPage:[15,20,23,28,35].includes(Number(src.rowsPerPage))?Number(src.rowsPerPage):23,
  exportOrientation:['portrait','landscape'].includes(src.exportOrientation)?src.exportOrientation:'portrait',
  defaultPeriod:['day','week','month'].includes(src.defaultPeriod)?src.defaultPeriod:'day',
  defaultWeekday:['today','all','0','1','2','3','4','5','6'].includes(src.defaultWeekday)?src.defaultWeekday:'today',
  goalMultiplier:Number.isFinite(Number(src.goalMultiplier))&&Number(src.goalMultiplier)>0&&Number(src.goalMultiplier)<=10?Number(src.goalMultiplier):1
 };
}
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const date=ymd=>{const [y,m,d]=ymd.split('-').map(Number);return new Date(y,m-1,d,12);};
export const monday=ymd=>{const d=date(ymd);d.setDate(d.getDate()-(d.getDay()+6)%7);return iso(d);};
export const periodKey=(ymd,kind)=>kind==='day'?ymd:kind==='week'?monday(ymd):ymd.slice(0,7);
export const overrideKey=(name,kind,period)=>`${String(name).trim().toLocaleUpperCase('es-MX')}|${kind}|${period}`;
const blank=()=>({records:0,sales:0,regular:0,guaranteed:0,p0:0,dental:0,apps:0,purchase:0});
function tally(rows){
 const c=blank();
 for(const r of rows){
  c.records++;
  if(!r.code)continue;
  c.sales++;
  const regular=r.regular===true;
  if(regular)c.regular++;else if(r.guaranteed===true)c.guaranteed++;
  if(r.dental===true)c.dental++;
  if(regular&&r.p0===true)c.p0++;
  if(r.p0===true||r.dental===true)c.purchase++;
  if(r.app===true)c.apps++;
 }
 return c;
}
function plus(a,b){const r={...a};for(const k of Object.keys(blank()))r[k]=(r[k]||0)+(b[k]||0);return r;}
export function qualityFor(c,goal,rules){
 const ratio=(n,d)=>d>0?n*100/d:0;
 const actual={completion:ratio(c.sales,goal),purchase:ratio(c.purchase,c.sales),p0:ratio(c.p0,c.regular),app:ratio(c.apps,c.sales)};
 const factors={};
 for(const key of ['completion','purchase','p0','app']){
  const rule=rules[key],value=rule.required>0?actual[key]*100/rule.required:0;
  const cutoff=Number.isFinite(rule.minimum)?rule.minimum:60;
  factors[key]=value<cutoff?0:(key==='purchase'||key==='app'?Math.min(100,value):value);
 }
 const sum=Object.values(factors).reduce((a,b)=>a+b,0);
 const quality=Math.min(100,sum/4);
 return {actual,factors,quality,global:(sum+quality)/5};
}
function basicGoal(name,kind,key,weeklyGoal,settings){
 const factor=settings.goalMultiplier;
 const weekly=week=>Math.max(0,Number(weeklyGoal(week,name))||0)*factor;
 if(kind==='week')return weekly(key);
 if(kind==='day')return weekly(monday(key))/7;
 const [year,month]=key.split('-').map(Number),end=new Date(year,month,0).getDate();let result=0;
 for(let d=1;d<=end;d++)result+=weekly(monday(`${key}-${String(d).padStart(2,'0')}`))/7;
 return result;
}
export function makePeriods(rows,name,kind,weeklyGoal,settings,rules){
 const groups=new Map();
 for(const r of rows){if(!/^\d{4}-\d{2}-\d{2}$/.test(r.fecha))continue;const key=periodKey(r.fecha,kind);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 return [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,group])=>{
  const c=tally(group),override=settings.periodGoals[overrideKey(name,kind,key)];
  const goal=override||basicGoal(name,kind,key,weeklyGoal,settings);
  const q=qualityFor(c,goal,rules);
  return {key,kind,rows:group.length,modules:[...new Set(group.map(r=>r.module).filter(Boolean))],executives:[...new Set(group.map(r=>r.executive).filter(Boolean))],...c,goal,...q};
 });
}
export function summarizePeriods(periods,rules){
 const counter=periods.reduce((a,p)=>plus(a,p),blank());
 const goal=periods.reduce((sum,p)=>sum+p.goal,0),n=periods.length;
 const quality=qualityFor(counter,goal,rules);
 const averages=Object.fromEntries(Object.entries(counter).map(([k,v])=>[k,n?v/n:0]));
 return {periods:n,counts:counter,goal,...quality,averages};
}
/** Recibe todas las filas historicas de un colaborador, sin limitarse al módulo actual. */
export function analyzeHistory({rows,name,kind='day',weekday='all',from='',to='',module='',weeklyGoal,settings,rules}){
 const chosen=(rows||[]).filter(r=>r.fecha&&(!from||r.fecha>=from)&&(!to||r.fecha<=to)&&(!module||r.module===module));
 const periods=makePeriods(chosen,name,kind,weeklyGoal,settings,rules);
 const days=makePeriods(chosen,name,'day',weeklyGoal,settings,rules);
 const weeks=makePeriods(chosen,name,'week',weeklyGoal,settings,rules);
 const months=makePeriods(chosen,name,'month',weeklyGoal,settings,rules);
 const weekdayDays=weekday==='all'?days:days.filter(p=>date(p.key).getDay()===Number(weekday));
 return {periods,days,weeks,months,filteredRows:chosen.length,summary:summarizePeriods(periods,rules),
   sameWeekday:summarizePeriods(weekdayDays,rules),weekly:summarizePeriods(weeks,rules),monthly:summarizePeriods(months,rules)};
}
