/** V2.5.4 · Histórico consolidado por módulo, sin base ni copias adicionales.
 * Reutiliza el motor de cuatro calidades, promedios y objetivos de V2.5.3.
 */
import {HISTORY_DEFAULTS,cleanHistorySettings,analyzeHistory} from './individual-history.js';
export const MODULE_HISTORY_KEY='wmSamsHistoricalModuleV254';
export const MODULE_HISTORY_DEFAULTS=Object.freeze({
 ...HISTORY_DEFAULTS,
 exportTitle:'Análisis histórico por módulo',
 exportSubtitle:'Consolidado por módulo · registros manuales disponibles',
 exportNote:'Los promedios utilizan períodos con registros. Calidad Total y Alcance Global se recalculan con cantidades y objetivos; los períodos sin datos no se promedian.',
 showModuleColumn:false,includeSupervisors:true
});
export function cleanModuleHistorySettings(settings){
 const raw=settings&&typeof settings==='object'&&!Array.isArray(settings)?settings:{};
 const merged=cleanHistorySettings({...MODULE_HISTORY_DEFAULTS,...raw});
 return {...merged,includeSupervisors:typeof raw.includeSupervisors==='boolean'?raw.includeSupervisors:true};
}
export const moduleKey=v=>String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toUpperCase();
export function moduleNames(rows){
 const unique=new Map();
 for(const row of rows||[]){const raw=String(row.module||'').trim(),key=moduleKey(raw);if(key&&!unique.has(key))unique.set(key,raw);}
 return [...unique.values()].sort((a,b)=>a.localeCompare(b,'es'));
}
export function analyzeModuleHistory({rows,module,kind='day',weekday='all',from='',to='',weeklyGoal,settings,rules,includeSupervisors=true}){
 const filtered=(rows||[]).filter(row=>moduleKey(row.module)===moduleKey(module)&&(includeSupervisors||!row.supervisor));
 return analyzeHistory({rows:filtered,name:module,kind,weekday,from,to,module:'',weeklyGoal,settings,rules});
}
/** Retorna un objetivo comprobable, o 0 cuando no existe dato para esa semana.
 * Prioridad: meta de Logros semanales > objetivo fijo del módulo > objetivo
 * del supervisor > metas semanales de los promotores registrados esa semana.
 */
export function resolveModuleWeeklyGoal({week,module,achievementGoals={},configuredGoal=0,supervisorGoal=0,rows=[],getExecutiveGoal,isSupervisor=()=>false}){
 const key=moduleKey(module),saved=achievementGoals[JSON.stringify([week,module])];
 let goal=Number(saved?.sales);
 if(Number.isFinite(goal)&&goal>0)return goal;
 goal=Number(configuredGoal);if(Number.isFinite(goal)&&goal>0)return goal;
 goal=Number(supervisorGoal);if(Number.isFinite(goal)&&goal>0)return goal;
 const names=new Map();
 for(const r of rows){
  if(moduleKey(r.module)!==key||r.week!==week||isSupervisor(r))continue;
  const name=String(r.executive||'').trim();if(name&&!names.has(moduleKey(name)))names.set(moduleKey(name),name);
 }
 return [...names.values()].reduce((sum,name)=>sum+Math.max(0,Number(getExecutiveGoal?.(week,name))||0),0);
}
