/** Validación de visitas: el formulario envía checklist e incidencias como mapas de folio/criterio. */
const MAX_TEXT=9000;
const validId=id=>typeof id==='string'&&/^vis_[a-z0-9_-]{10,70}$/i.test(id);
const isoDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'));
const limitText=(v,max=MAX_TEXT)=>typeof v==='string'&&v.length<=max;
const isMap=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function validateSelection(value,max,name){
  if(!isMap(value)&&!Array.isArray(value))throw Error(`El formato de ${name} no es válido.`);
  const length=Array.isArray(value)?value.length:Object.keys(value).length;
  if(length>max)throw Error(`Se superó el límite de ${name}: ${length} de ${max}.`);
}
export function validateVisit(v){
  if(!v||typeof v!=='object'||!validId(v.id)||!isoDate(v.visitedAt))throw Error('Identificador o fecha de visita inválidos.');
  if(!limitText(v.module,150)||!v.module.trim()||!limitText(v.supervisor,150)||!v.supervisor.trim())throw Error('Elige un módulo y un supervisor/ejecutivo.');
  if(!isMap(v.sections))throw Error('Las secciones de la visita son inválidas.');
  validateSelection(v.sections.checklist,80,'criterios');
  if(!Array.isArray(v.sections.folios))throw Error('Los folios deben enviarse como una lista.');
  if(v.sections.folios.length>3)throw Error(`Se superó el límite de folios: ${v.sections.folios.length} de 3.`);
  validateSelection(v.sections.incidents,150,'incidencias');
  if(v.sections.comments!==undefined&&!isMap(v.sections.comments))throw Error('El formato de los comentarios no es válido.');
  if(Object.values(v.sections.comments||{}).some(x=>!limitText(x,8000)))throw Error('Los comentarios superan el límite permitido.');
  if(!Number.isFinite(Number(v.total))||Math.abs(Number(v.total))>10000)throw Error('Puntuación inválida.');
  return true;
}
