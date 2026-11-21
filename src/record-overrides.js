/* V2.6.0 · Ediciones administrativas no destructivas, independientes de los XLS. */
export const RECORD_EDITS_KEY='wmSamsRecordEditsV260';
const FIELD_MAP={folio:'Folio',fecha:'Fecha',executive:'Ejecutivo',module:'Módulo',code:'Código',status:'Estatus',guaranteed:'Garantizada',dental:'Salud Dental',p0:'Programa Cero'};
export const EDITABLE_RECORD_FIELDS=Object.freeze({...FIELD_MAP});
export function cleanRecordEdits(raw){
 const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
 for(const [uid,entry] of Object.entries(raw).slice(0,10000)){
  if(!/^[\w-]{4,150}$/.test(uid)||!entry||typeof entry!=='object')continue;
  const fields={};for(const [key,value] of Object.entries(entry.fields||{})){
   if(Object.hasOwn(FIELD_MAP,key)&&typeof value==='string'&&value.length<=400)fields[key]=value.trim();
  }
  const rawFields={};
  if(entry.rawFields&&typeof entry.rawFields==='object'&&!Array.isArray(entry.rawFields))for(const [header,value] of Object.entries(entry.rawFields).slice(0,500)){
   if(header&&header.length<=160&&typeof value==='string'&&value.length<=400)rawFields[header]=value;
  }
  if(Object.keys(fields).length||Object.keys(rawFields).length||entry.deleted===true)out[uid]={fields,rawFields,deleted:entry.deleted===true,description:String(entry.description||'').slice(0,240)};
 }
 return out;
}
export function overlayRecord(record,headers,entry,canonicalize){
 if(!entry||entry.deleted)return entry?.deleted?null:record;
 const copy={...record,raw:[...record.raw]};
 const KEY_BY_CANONICAL={'Folio':'folio','Fecha':'fecha','Módulo':'module','Ejecutivo':'executive','Código':'code','Estatus':'status','Garantizada':'guaranteed','Salud Dental':'dental','Programa Cero':'p0'};
 for(const [header,value] of Object.entries(entry.rawFields||{})){
  const index=headers.findIndex(h=>h===header);
  if(index<0)continue;
  copy.raw[index]=value;
  const key=KEY_BY_CANONICAL[canonicalize(headers[index])];
  if(key)copy[key]=value;
 }
 for(const [key,value] of Object.entries(entry.fields||{})){
  if(!Object.hasOwn(FIELD_MAP,key))continue;
  const index=headers.findIndex(h=>canonicalize(h)===FIELD_MAP[key]);
  if(index>=0)copy.raw[index]=value;
  if(key==='fecha'){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(value))continue;
  }
  copy[key]=value;
 }
 return copy;
}
export function validateRecordFields(fields){
 const out={};for(const [key,value] of Object.entries(fields||{})){
  if(!Object.hasOwn(FIELD_MAP,key))continue;
  const text=String(value??'').trim();
  if(text.length>400)throw Error('Campo demasiado largo: '+key);
  if(key==='fecha'&&text&&!/^\d{4}-\d{2}-\d{2}$/.test(text))throw Error('Fecha inválida.');
  out[key]=text;
 }
 return out;
}

// Los encabezados no estándar también pueden corregirse sin alterar el XLS original.
export function validateRawRecordFields(values,headers){
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Valores de actualización inválidos.');
 const out={};const allowed=new Set((headers||[]).map(String));
 for(const [name,value] of Object.entries(values)){
  if(!allowed.has(name))throw Error('El campo no existe en el XLS original: '+name);
  const v=String(value??'');
  if(v.length>400)throw Error('Valor demasiado largo para '+name);
  out[name]=v;
 }
 if(!Object.keys(out).length)throw Error('Debes indicar algún campo actualizado.');
 return out;
}
