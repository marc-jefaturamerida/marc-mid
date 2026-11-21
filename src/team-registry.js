/** INVEX V2.6.1 — catálogo operativo. Persistido como ajuste por propietario en PostgreSQL.
 * No reescribe XLS. Los cambios de activo/inactivo son prospectivos según fecha del registro.
 */
export const TEAM_REGISTRY_KEY='wmSamsTeamRegistryV261';
export const registryNormalize=value=>String(value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toLocaleUpperCase('es-MX');
const uuid=()=>typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():'entity_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
const dateOk=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(new Date(v+'T12:00:00').getTime());
const validName=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=150;
export function cleanTeamRegistry(raw){
 const data={version:1,modules:[],executives:[]};if(!raw||typeof raw!=='object')return data;
 for(const type of ['modules','executives']){
  const entries=Array.isArray(raw[type])?raw[type]:[];const names=new Set();
  for(const item of entries.slice(0,1000)){
   if(!validName(item?.name)||names.has(registryNormalize(item.name)))continue;
   const name=item.name.trim();names.add(registryNormalize(name));
   const aliases=[...new Set((Array.isArray(item.aliases)?item.aliases:[]).filter(validName).map(x=>x.trim()))].filter(x=>registryNormalize(x)!==registryNormalize(name)).slice(0,30);
   const history=(Array.isArray(item.statusHistory)?item.statusHistory:[]).filter(e=>dateOk(e?.from)&&typeof e?.active==='boolean').map(e=>({from:e.from,active:e.active})).sort((a,b)=>a.from.localeCompare(b.from)).slice(-100);
   const weeklyGoal=item.weeklyGoal===''||item.weeklyGoal==null?null:Number(item.weeklyGoal);
   data[type].push({id:typeof item.id==='string'&&/^[\w-]{8,80}$/.test(item.id)?item.id:uuid(),name,aliases,active:item.active!==false,weeklyGoal:Number.isInteger(weeklyGoal)&&weeklyGoal>=1&&weeklyGoal<=1000000?weeklyGoal:null,
    module:type==='executives'&&validName(item.module)?item.module.trim():'',statusHistory:history,goalVersions:Array.isArray(item.goalVersions)?item.goalVersions.filter(v=>dateOk(v?.from)&&(v.goal===null||(Number.isInteger(v.goal)&&v.goal>=1&&v.goal<=1000000))).slice(-300):[],legacyGoal:Number.isInteger(item.legacyGoal)&&item.legacyGoal>0?item.legacyGoal:null});
  }
 }
 return data;
}
export function registryEntry(data,type,name){return (data?.[type]||[]).find(x=>[x.name,...(x.aliases||[])].some(n=>registryNormalize(n)===registryNormalize(name)))||null;}
export function registryActiveAt(entry,date){
 if(!entry)return true;
 // Antes de su primera baja, los datos originales se conservan como históricos.
 if(!dateOk(date)||!(entry.statusHistory||[]).length)return entry.active!==false;
 let active=true;for(const e of entry.statusHistory||[]){if(e.from<=date)active=e.active;else break;}
 return active;
}
/** En la semana de trabajo actual se excluye el perfil completo si hoy figura inactivo.
 * Las semanas históricas siguen respetando las fechas originales de baja/reactivación.
 * Una baja de módulo no cambia el estado de sus ejecutivos: cada estado es independiente,
 * aunque naturalmente no se cuenta la fila de venta de un módulo inactivo esta semana.
 */
export function registryVisibleInWeek(data,type,name,week,today=new Date()){
 const date=localISO(today),currentWeek=mondayLocal(date),entry=registryEntry(data,type,name);
 if(week===currentWeek&&entry?.active===false)return false;
 return registryActiveAt(entry,week);
}
const localISO=(d)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const mondayLocal=(date)=>{const [y,m,d]=date.split('-').map(Number),x=new Date(y,m-1,d,12);x.setDate(x.getDate()-(x.getDay()+6)%7);return localISO(x);};
export function registryRowEligible(data,row,today=new Date()){
 const date=row?.fecha,week=/^\d{4}-\d{2}-\d{2}$/.test(date||'')?mondayLocal(date):'';
 if(week===mondayLocal(localISO(today))){
  if(registryEntry(data,'modules',row.module)?.active===false)return false;
  if(registryEntry(data,'executives',row.executive)?.active===false)return false;
 }
 return registryActiveAt(registryEntry(data,'modules',row.module),date)&&registryActiveAt(registryEntry(data,'executives',row.executive),date);
}
export function registryNames(data,type,{activeOnly=false,detected=[]}={}){
 const out=new Map();for(const x of detected){const n=String(x||'').trim();if(n&&!out.has(registryNormalize(n)))out.set(registryNormalize(n),n);}
 for(const x of data?.[type]||[])if(!activeOnly||x.active!==false)out.set(registryNormalize(x.name),x.name);
 const names=[...out.values()];return (activeOnly?names.filter(name=>registryEntry(data,type,name)?.active!==false):names).sort((a,b)=>a.localeCompare(b,'es'));
}
export function registryUpdate(data,type,edit,originalName='',today){
 if(!['modules','executives'].includes(type)||!validName(edit?.name)||!dateOk(today))throw Error('Tipo, nombre o fecha inválidos.');
 const next=cleanTeamRegistry(data),entries=next[type],old=originalName?registryEntry(next,type,originalName):null;
 const exists=registryEntry(next,type,edit.name);if(exists&&exists!==old)throw Error('Ya existe un registro con ese nombre.');
 const weeklyGoal=edit.weeklyGoal===''||edit.weeklyGoal==null?null:Number(edit.weeklyGoal);
 if(weeklyGoal!==null&&(!Number.isInteger(weeklyGoal)||weeklyGoal<1||weeklyGoal>1000000))throw Error('La meta debe ser una cantidad entera mayor que cero.');
 const wasActive=old?old.active:true,active=edit.active!==false;
 const history=old?[...(old.statusHistory||[])]:[];
 if((old&&wasActive!==active)||(!old&&!active)){
  const found=history.findIndex(x=>x.from===today);if(found>=0)history.splice(found,1);
  history.push({from:today,active});history.sort((a,b)=>a.from.localeCompare(b.from));
 }
 const aliases=[...(old?.aliases||[])];if(old&&registryNormalize(old.name)!==registryNormalize(edit.name))aliases.push(old.name);
 const goalVersions=[...(old?.goalVersions||[])];
 const from=new Date(today+'T12:00:00');from.setDate(from.getDate()-(from.getDay()+6)%7);
 const effective=[from.getFullYear(),String(from.getMonth()+1).padStart(2,'0'),String(from.getDate()).padStart(2,'0')].join('-');
 const legacyGoal=old?.legacyGoal??(old&&!goalVersions.length?old.weeklyGoal:null);
 if((old&&old.weeklyGoal!==weeklyGoal)||(!old&&weeklyGoal!==null)){
   const match=goalVersions.findIndex(x=>x.from===effective);if(match>=0)goalVersions.splice(match,1);
   goalVersions.push({from:effective,goal:weeklyGoal});goalVersions.sort((a,b)=>a.from.localeCompare(b.from));
 }
 const entry={id:old?.id||uuid(),name:edit.name.trim(),aliases:[...new Set(aliases)].slice(-30),active,weeklyGoal,module:type==='executives'?String(edit.module||'').trim():'',statusHistory:history,goalVersions:goalVersions.slice(-300),legacyGoal};
 if(old)entries[entries.indexOf(old)]=entry;else entries.push(entry);
 return next;
}

/** La meta con vigencia tiene prioridad. Este helper nunca modifica la tarifa. */
export function registryGoalAt(entry,week){
 if(!entry)return null;
 const versions=(Array.isArray(entry.goalVersions)?entry.goalVersions:[]).filter(v=>dateOk(v.from)&&(v.goal===null||Number.isInteger(v.goal)&&v.goal>0));
 const effective=versions.sort((a,b)=>b.from.localeCompare(a.from)).find(v=>v.from<=week);
 if(effective)return effective.goal;
 if(versions.length)return entry.legacyGoal??null;
 return entry.weeklyGoal??null;
}
