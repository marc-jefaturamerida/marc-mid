/** V4.1 · Acumulado del mismo día semanal dentro de un rango INCLUSIVO.
 * No modifica cálculos de comisiones: recibe la regla payable del motor existente.
 * Porcentaje Dental/Garantizadas/Regulares sobre ventas comisionables;
 * Programa Cero SOLO sobre las regulares comisionables.
 */
const empty=()=>({sales:0,guaranteed:0,regular:0,dental:0,p0:0});
const iso=/^\d{4}-\d{2}-\d{2}$/;
export const sameName=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleUpperCase('es-MX');
export function weekdayOccurrences(from,to,weekday){
 if(!iso.test(from)||!iso.test(to)||from>to||!Number.isInteger(Number(weekday))||+weekday<0||+weekday>6)return [];
 const parse=s=>{const [y,m,d]=s.split('-').map(Number);const x=new Date(Date.UTC(y,m-1,d));return x.toISOString().slice(0,10)===s?x:null;};
 const a=parse(from),b=parse(to);if(!a||!b)return [];
 const first=new Date(a.getTime());first.setUTCDate(first.getUTCDate()+((Number(weekday)-first.getUTCDay()+7)%7));
 const result=[];for(let t=first.getTime();t<=b.getTime();t+=86400000*7){if(result.length>1500)throw Error('El rango es demasiado largo.');result.push(new Date(t).toISOString().slice(0,10));}
 return result;
}
const values=(item)=>({
 ...item,
 periods:item.periods,
 averages:Object.fromEntries(['sales','guaranteed','regular','dental','p0'].map(k=>[k,item.periods?item[k]/item.periods:0])),
 goalCompletion:item.goal>0&&item.periods>0?100*(item.sales/item.periods)/item.goal:null,
 percentages:{sales:item.sales?100:null,
   guaranteed:item.sales?100*item.guaranteed/item.sales:null,
   regular:item.sales?100*item.regular/item.sales:null,
   dental:item.sales?100*item.dental/item.sales:null,
   p0:item.regular?100*item.p0/item.regular:null}
});
export function analyzeWeekday(rows,{from,to,weekday,modules=[],executives=[],goal=0,payable,isYes,isNo}={}){
 if(typeof payable!=='function'||typeof isYes!=='function'||typeof isNo!=='function')throw Error('Faltan las reglas vigentes de ventas comisionables.');
 const dates=weekdayOccurrences(from,to,weekday),periods=dates.length,dateSet=new Set(dates);
 const mset=new Set(modules.map(sameName)),eset=new Set(executives.map(sameName));
 const modMap=new Map(),execMap=new Map(),totals=empty();let considered=0;
 for(const r of rows||[]){
  if(mset.size&&!mset.has(sameName(r.module)))continue;
  if(eset.size&&!eset.has(sameName(r.executive)))continue;
  // Preparar filas de CERO también para perfiles conocidos que no vendieron
  // ninguno de los días consultados. La plantilla no oculta a esos perfiles.
  const module=String(r.module||'Sin módulo').trim(),exec=String(r.executive||'Sin ejecutivo').trim();
  const modKey=sameName(module),execKey=sameName(exec);
  if(!modMap.has(modKey))modMap.set(modKey,{name:module,periods,...empty()});
  if(!execMap.has(execKey))execMap.set(execKey,{name:exec,periods,...empty()});
  if(!dateSet.has(r.fecha)||!payable(r))continue;
  const regular=isNo(r.guaranteed),guar=isYes(r.guaranteed),dental=isYes(r.dental),p0=regular&&isYes(r.p0);
  for(const stats of [totals,modMap.get(modKey),execMap.get(execKey)]){
   stats.sales++;if(regular)stats.regular++;if(guar)stats.guaranteed++;
   if(dental)stats.dental++;if(p0)stats.p0++;
  }
  considered++;
 }
 const ordered=map=>[...map.values()].map(s=>values({...s,goal:0})).sort((a,b)=>b.sales-a.sales||a.name.localeCompare(b.name,'es'));
 return {from,to,weekday,dates,periods,goal:Number(goal)||0,considered,
   modules:ordered(modMap),executives:ordered(execMap),
   totals:values({name:'TOTAL',periods,goal:Number(goal)||0,...totals}),
   filter:{modules:[...modules],executives:[...executives]}};
}
export function formatDayAnalysisText(data,{title='Análisis del día',includeModules=true,includeExecutives=true,showDates=true,note=''}={}){
 const days=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
 const round=v=>Number.isFinite(v)?v.toFixed(2):'—';
 const line=e=>`${e.name}: Ventas ${e.sales} (prom. ${round(e.averages.sales)}, ${round(e.percentages.sales)}%); Garantizadas ${e.guaranteed} (prom. ${round(e.averages.guaranteed)}, ${round(e.percentages.guaranteed)}%); Regulares ${e.regular} (prom. ${round(e.averages.regular)}, ${round(e.percentages.regular)}%); Dental ${e.dental} (prom. ${round(e.averages.dental)}, ${round(e.percentages.dental)}%); Cero ${e.p0} (prom. ${round(e.averages.p0)}, ${round(e.percentages.p0)}% sobre regulares)`;
 const lines=[title,`Día: ${days[Number(data.weekday)]} · Rango: ${data.from} a ${data.to}`,`Períodos: ${data.periods} · Ventas comisionables: ${data.totals.sales} · Promedio: ${round(data.totals.averages.sales)}`,`Meta conjunta por día: ${data.goal||'Sin asignar'} · Cumplimiento: ${data.totals.goalCompletion===null?'—':round(data.totals.goalCompletion)+'%'}`,
  ...(showDates?[`Fechas incluidas: ${data.dates.join(', ')||'ninguna'}`]:[]),line(data.totals)];
 if(includeModules)lines.push('MÓDULOS',...(data.modules.length?data.modules.map(line):['Sin ventas comisionables']));
 if(includeExecutives)lines.push('EJECUTIVOS',...(data.executives.length?data.executives.map(line):['Sin ventas comisionables']));
 lines.push('Porcentajes: Plan Cero ÷ regulares; demás indicadores ÷ ventas totales. Incluye días sin registros en el promedio.');if(note)lines.push(note);
 return lines.join('\n');
}
