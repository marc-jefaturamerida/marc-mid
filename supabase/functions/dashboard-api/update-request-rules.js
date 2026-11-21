// Jefatura Mid Marc V2.7.1 · Reglas de solicitudes, aisladas del cálculo de comisiones.
export const UPDATE_MAX_FIELDS=500;
export const UPDATE_RECORD_KEY=/^[A-Za-z0-9_-]{4,150}$/;
export function updateFieldNames(values){
 const list=Array.isArray(values)?values:Object.keys(values||{});
 if(!list.length||list.length>UPDATE_MAX_FIELDS)throw Error('Selecciona entre 1 y 500 campos del registro.');
 const unique=[];
 for(const name of list){
  if(typeof name!=='string'||!name.trim()||name.length>160||/[<>\x00-\x1f]/.test(name))throw Error('Nombre de columna inválido.');
  if(!unique.includes(name.trim()))unique.push(name.trim());
 }
 return unique;
}
export function normalizeRequestFields(values){return Object.fromEntries(updateFieldNames(values).map(name=>[name,true]));}
export function normalizeRequestedValues(fields,values){
 const selected=updateFieldNames(fields),out={};
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Indica los valores actualizados.');
 for(const name of selected){
  if(!Object.hasOwn(values,name))throw Error('Falta el valor del campo: '+name);
  const value=String(values[name]??'');
  if(value.length>400)throw Error('El valor de '+name+' es demasiado largo.');
  out[name]=value;
 }
 return out;
}
export function requestBelongsToRecord(item,row,getKey){return !!item&&item.status==='pending'&&!item.deleted_at&&item.record_key===getKey(row);}
export function pendingUpdateCount(items){return items.filter(x=>x.status==='pending'&&!x.deleted_at).length;}
export function shouldShowUpdateReminder(day,pending){return [1,2,3].includes(day)&&pending>0;}
