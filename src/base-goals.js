/** INVEX V2.5.9. Objetivos semanales para ANÁLISIS; nunca para pago de comisiones.
 * Cantidades: records (trámites), sales (ventas). Los otros objetivos son porcentajes.
 * Al cargar perfiles de la V2.5.8, las antiguas cantidades de complementos NO se
 * reinterpretan como porcentajes; se aplican los nuevos porcentajes predeterminados.
 */
export const BASE_GOALS_KEY='wmSamsBaseGoalsV258'; // Mantener clave para migración y Netlify.
export const BASE_METRICS=Object.freeze({records:'Trámites',sales:'Ventas totales',regular:'Ventas regulares',guaranteed:'Ventas garantizadas',dental:'Plan Dental',p0:'Programa Cero',apps:'Activaciones APP',purchase:'Primera compra',quality:'Calidad Total'});
export const BASE_QUANTITY_METRICS=Object.freeze(['records','sales']);
export const BASE_RATE_DEFAULTS=Object.freeze({regular:100,guaranteed:100,dental:90,p0:30,apps:90,purchase:90,quality:90});
export const BASE_TYPES=Object.freeze({module:'Módulo',executive:'Ejecutivo',headquarters:'Jefatura'});
export const isBasePercentage=k=>Object.hasOwn(BASE_RATE_DEFAULTS,k);
export const normalizeName=v=>String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLocaleUpperCase('es-MX');
export const baseProfileKey=(type,name)=>type==='headquarters'?'headquarters|JEFATURA':`${type}|${normalizeName(name)}`;
const isoDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(new Date(`${v}T12:00:00`).getTime());
export function mondayISO(iso){if(!isoDate(iso))return '';const d=new Date(`${iso}T12:00:00`);d.setDate(d.getDate()-(d.getDay()+6)%7);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
const validGoal=(k,value)=>Number.isFinite(value)&&value>=0&&(isBasePercentage(k)?value<=100:(Number.isSafeInteger(value)&&value<=1000000));
export function cleanBaseGoals(raw){
 const out={version:2,profiles:{}};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
 const previousSchema=Number(raw.version)!==2;
 for(const [key,p] of Object.entries(raw.profiles||{})){
  if(Object.keys(out.profiles).length>=1000||!p||!BASE_TYPES[p.type]||typeof p.name!=='string'||p.name.length>150||key!==baseProfileKey(p.type,p.name))continue;
  const versionMap=new Map();
  for(const v of (Array.isArray(p.versions)?p.versions:[])){
   const from=mondayISO(v?.from);if(from!==v?.from)continue;
   const goals={};for(const k of Object.keys(BASE_METRICS)){
    // V1: metas de P0, Dental, regulares, etc. eran CANTIDADES.
    if(previousSchema&&isBasePercentage(k))continue;
    const rawValue=v.goals?.[k];if(rawValue===''||rawValue===null||rawValue===undefined)continue;
    const value=Number(rawValue);if(validGoal(k,value))goals[k]=value;
   }
   if(Object.keys(goals).length)versionMap.set(from,{from,goals});
  }
  const versions=[...versionMap.values()].sort((a,b)=>a.from.localeCompare(b.from)).slice(-500);
  if(versions.length)out.profiles[key]={type:p.type,name:p.name.trim(),versions};
 }
 return out;
}
export function upsertBaseGoals(store,{type,name,from,goals}){
 if(!BASE_TYPES[type])throw Error('Tipo de perfil no válido.');
 const cleanName=type==='headquarters'?'Jefatura':String(name||'').trim();if(!cleanName||cleanName.length>150)throw Error('Nombre de perfil inválido.');
 const monday=mondayISO(from);if(monday!==from)throw Error('La vigencia debe comenzar un lunes válido.');
 const cleaned={};for(const [key,raw] of Object.entries(goals||{})){
  if(!Object.hasOwn(BASE_METRICS,key)||raw===null||raw==='')continue;
  const value=Number(raw);if(!validGoal(key,value))throw Error(`Meta inválida para ${BASE_METRICS[key]}: ${isBasePercentage(key)?'0 a 100%':'cantidad entera de 0 a 1,000,000'}.`);
  cleaned[key]=value;
 }
 if(!Object.keys(cleaned).length)throw Error('Ingresa al menos un objetivo.');
 const state=cleanBaseGoals(store),key=baseProfileKey(type,cleanName);
 const previous=state.profiles[key]||{type,name:cleanName,versions:[]};
 const versions=previous.versions.filter(v=>v.from!==from);versions.push({from,goals:cleaned});versions.sort((a,b)=>a.from.localeCompare(b.from));
 state.profiles[key]={type,name:previous.name,versions};return state;
}
/** Meta efectiva con valor predeterminado porcentual sin crear registros invisibles. */
export function effectiveBaseGoal(store,type,name,week,metric){
 if(!Object.hasOwn(BASE_METRICS,metric))return {value:null,source:'Indicador desconocido'};
 const current=mondayISO(week);if(!current)return {value:null,source:'Fecha no válida'};
 const p=store?.profiles?.[baseProfileKey(type,name)];
 if(p)for(let i=p.versions.length-1;i>=0;i--){const v=p.versions[i];if(v.from<=current&&Object.hasOwn(v.goals,metric))return {value:v.goals[metric],source:`Objetivos base · ${p.name} · vigente desde ${v.from}`,unit:isBasePercentage(metric)?'percent':'count'};}
 if(isBasePercentage(metric))return {value:BASE_RATE_DEFAULTS[metric],source:'Objetivo porcentual predeterminado',unit:'percent'};
 return {value:null,source:p?'Sin objetivo base vigente':'Sin objetivo base',unit:'count'};
}
/** Cantidades: suma de módulos. Porcentajes: promedio ponderado por meta de ventas.
 * Una meta propia de Jefatura tiene preferencia. No se suman porcentajes.
 */
export function headquartersGoal(store,week,metric,moduleNames=[]){
 if(!Object.hasOwn(BASE_METRICS,metric))return {value:null,source:'Indicador desconocido'};
 const key=baseProfileKey('headquarters','Jefatura'),profile=store?.profiles?.[key],current=mondayISO(week);
 if(profile&&current)for(let i=profile.versions.length-1;i>=0;i--){const v=profile.versions[i];if(v.from<=current&&Object.hasOwn(v.goals,metric))return {value:v.goals[metric],source:`Objetivos base · Jefatura · vigente desde ${v.from}`,unit:isBasePercentage(metric)?'percent':'count'};}
 const names=[...new Map(moduleNames.filter(Boolean).map(n=>[normalizeName(n),n])).values()];
 if(!names.length)return isBasePercentage(metric)?{value:BASE_RATE_DEFAULTS[metric],source:'Objetivo porcentual predeterminado',unit:'percent'}:{value:null,source:'Sin módulos configurados',unit:'count'};
 const resolved=names.map(name=>effectiveBaseGoal(store,'module',name,week,metric));
 if(resolved.some(g=>g.value===null))return {value:null,source:'Consolidado incompleto: faltan metas de módulos',unit:isBasePercentage(metric)?'percent':'count'};
 if(!isBasePercentage(metric))return {value:resolved.reduce((sum,g)=>sum+g.value,0),source:'Objetivos base · suma de módulos',unit:'count'};
 const weights=names.map(name=>effectiveBaseGoal(store,'module',name,week,'sales').value);
 if(weights.some(n=>n===null)){
  // Si todas las tasas coinciden, su consolidado es exacto sin necesidad de pesos.
  if(resolved.every(g=>g.value===resolved[0].value))return {value:resolved[0].value,source:'Objetivos base · mismo porcentaje en todos los módulos',unit:'percent'};
  return {value:null,source:'Porcentaje consolidado: faltan metas de ventas de módulos',unit:'percent'};
 }
 const total=weights.reduce((a,b)=>a+b,0);
 return {value:total>0?resolved.reduce((sum,g,i)=>sum+g.value*weights[i],0)/total:resolved.reduce((sum,g)=>sum+g.value,0)/resolved.length,
  source:'Objetivos base · promedio porcentual ponderado por metas de ventas',unit:'percent'};
}
export function knownBaseProfiles(store,type,detected=[]){
 const map=new Map();for(const n of detected){const name=String(n||'').trim(),key=normalizeName(name);if(key&&!map.has(key))map.set(key,name);}
 for(const p of Object.values(store?.profiles||{}))if(p.type===type&&!map.has(normalizeName(p.name)))map.set(normalizeName(p.name),p.name);
 return [...map.values()].sort((a,b)=>a.localeCompare(b,'es'));
}
