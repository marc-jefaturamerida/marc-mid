/** V3.0.4 · Detección y captura de metas pendientes sin alterar comisiones.
 * Un objetivo base de cantidad debe ser entero y >0; los ceros son pendientes.
 */
import {effectiveBaseGoal, upsertBaseGoals, baseProfileKey, mondayISO, normalizeName} from './base-goals.js';
import {registryEntry,registryActiveAt,registryGoalAt} from './team-registry.js';

const validName=v=>typeof v==='string'&&v.trim().length>0;
export const positiveQuantity=value=>Number.isInteger(Number(value))&&Number(value)>0&&Number(value)<=1000000&&value!==''&&value!==null&&value!==undefined;
function addScope(scope,type,name,week,registry,date){
 if(!['module','executive'].includes(type)||!validName(name)||!mondayISO(week))return;
 const entry=registryEntry(registry,type==='module'?'modules':'executives',name);
 if(!registryActiveAt(entry,date||week))return;
 // Si el módulo se dio de baja, no solicitar en la semana actual objetivos
 // para ejecutivos que dependan de ese módulo; no modifica metas históricas.
 if(type==='executive'&&entry?.module&&!registryActiveAt(registryEntry(registry,'modules',entry.module),date||week))return;
 const key=[week,type,normalizeName(name)].join('|');
 if(!scope.has(key))scope.set(key,{key,type,name:name.trim(),week});
}
/**
 * kind=start: catálogo activo en semana actual; kind=import: solo perfiles de XLS recién cargados.
 * rows: filas normalizadas {module,executive,week,fecha} sin modificar XLS original.
 * fallbackSales: metas antiguas reales, nunca el default de una calculadora.
 */
export function findMissingBaseGoals({store,registry,kind='start',todayWeek,knownModules=[],knownExecutives=[],rows=[],fallbackSales=()=>null,todayDate=todayWeek}){
 const scope=new Map();
 if(kind==='start'){
  for(const name of knownModules)addScope(scope,'module',name,todayWeek,registry,todayDate);
  for(const name of knownExecutives)addScope(scope,'executive',name,todayWeek,registry,todayDate);
 }
 for(const row of rows||[]){
  if(kind==='start'&&row.week!==todayWeek)continue;
  const week=row.week,date=row.fecha||week;
  addScope(scope,'module',row.module,week,registry,date);
  addScope(scope,'executive',row.executive,week,registry,date);
 }
 const missing=[];
 for(const item of scope.values()){
  const records=effectiveBaseGoal(store,item.type,item.name,item.week,'records').value;
  const baseSales=effectiveBaseGoal(store,item.type,item.name,item.week,'sales').value;
  const fallback=baseSales===null?fallbackSales(item.type,item.name,item.week):null;
  const sales=baseSales===null&&positiveQuantity(fallback)?Number(fallback):baseSales;
  const missingRecords=!positiveQuantity(records),missingSales=!positiveQuantity(sales);
  if(missingRecords||missingSales)missing.push({...item,records,sales,missingRecords,missingSales});
 }
 return missing.sort((a,b)=>a.week.localeCompare(b.week)||a.type.localeCompare(b.type)||a.name.localeCompare(b.name,'es'));
}
/** Solo las cantidades pendientes; no pisa otras metas ni las tasas de la vigencia. */
export function saveQuickBaseGoals(store,items,values){
 let state=store;
 if(!items.length)return state;
 for(const item of items){
  const input=values[item.key]||{};
  const changes={};
  for(const metric of ['records','sales']){
   if(!item['missing'+metric[0].toUpperCase()+metric.slice(1)])continue;
   const raw=input[metric];
   if(!positiveQuantity(raw))throw Error(`Ingresa ${metric==='records'?'trámites':'ventas'} mayor que cero para ${item.name} (${item.week}).`);
   changes[metric]=Number(raw);
  }
  const old=state?.profiles?.[baseProfileKey(item.type,item.name)]?.versions?.find(v=>v.from===item.week);
  state=upsertBaseGoals(state,{type:item.type,name:item.name,from:item.week,goals:{...(old?.goals||{}),...changes}});
 }
 return state;
}

/** Extrae las fechas y perfiles de los archivos ya normalizados por el importador. */
export function recordsForGoalReview(reports,parseDate){
 const rows=[];
 for(const report of reports||[]){
  const columns=Object.fromEntries((report.headers||[]).map((h,i)=>[normalizeName(h),i]));
  const field=(record,key)=>String(record[columns[normalizeName(key)]]??'').trim();
  if(!Object.hasOwn(columns,'FECHA'))continue;
  for(const record of report.rows||[]){
   const fecha=parseDate(field(record,'Fecha'));
   const week=mondayISO(fecha);
   if(!week)continue;
   rows.push({fecha,week,module:field(record,'Módulo'),executive:field(record,'Ejecutivo')});
  }
 }
 return rows;
}
