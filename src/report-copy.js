/** Jefatura Mid Marc V3.0.1 · Reportes de portapapeles (sin alterar los cálculos). */
const value=v=>String(v??'').replace(/[\r\n\t]+/g,' ').trim();
const object=v=>{if(typeof v==='string'){try{return JSON.parse(v)||{};}catch{return {};}}return v&&typeof v==='object'&&!Array.isArray(v)?v:{};};
const stamp=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?value(v):d.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'});};
const date=v=>{const text=value(v);const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(text);return m?`${m[3]}/${m[2]}/${m[1]}`:text||'—';};
export function formatIncidentReport(r){
 if(!r)return '';
 const notes=Array.isArray(r.comments)?r.comments:[];
 return [
 'REPORTE DE INCIDENCIA',
 `Folio: ${value(r.folio)||'—'}`,
 `Módulo: ${value(r.module)||'—'}`,
 `Ejecutivo: ${value(r.executive)||'—'}`,
 `Incidencia: ${r.active?'Activa':'Inactiva'}`,
 `Seguimiento: ${r.resolved?'Resuelta':'Pendiente'}`,
 `Fecha de creación: ${stamp(r.created_at)}`,
 `Última modificación: ${stamp(r.updated_at)}`,
 `Fecha de resolución: ${stamp(r.resolved_at)}`,
 'Historial de comentarios:',
 ... (notes.length?notes.map(n=>`- ${stamp(n.createdAt)}: ${value(n.text)}`):['- Sin comentarios'])
 ].join('\n');
}
export function formatUpdateReport(r){
 if(!r)return '';
 const fields=object(r.requested_fields);
 const requested=Object.keys(fields);
 const comments=Array.isArray(r.comments)?r.comments:[];
 const applied=Object.entries(object(r.applied_values));
 return [
 'SOLICITUD DE ACTUALIZACIÓN',
 `Folio: ${value(r.folio)||'—'}`,
 `Módulo: ${value(r.module)||'—'}`,
 `Ejecutivo: ${value(r.executive)||'—'}`,
 `Fecha del registro: ${date(r.record_date)}`,
 `Fecha de creación: ${stamp(r.created_at)}`,
 `Última modificación: ${stamp(r.updated_at)}`,
 `Estado: ${r.deleted_at?'En papelera':r.status==='resolved'?'Actualizada':'Pendiente de actualizar'}`,
 `Fecha de resolución: ${stamp(r.resolved_at)}`,
 'Campos solicitados:',
 ...(requested.length?requested.map(f=>`- ${value(f)}`):['- Sin campos registrados']),
 'Comentarios:',
 ...(comments.length?comments.map(c=>`- ${stamp(c.createdAt)}: ${value(c.text)}`):['- Sin comentarios']),
 ...(applied.length?['Valores aplicados:',...applied.map(([key,val])=>`- ${value(key)}: ${value(val)}`)]:[])
 ].join('\n');
}
/** Las filas deben llegar filtradas por el motor de la página y por payable().
 * El módulo se repite como encabezado una sola vez; cada renglón es Fecha, Folio.
 */
export function formatCommissionableFolios(rows){
 const modules=new Map(),dedup=new Set();
 for(const r of Array.isArray(rows)?rows:[]){
  const folio=value(r.folio),module=value(r.module)||'Sin módulo',day=date(r.fecha);
  if(!folio)continue;
  const key=JSON.stringify([module,day,folio]);if(dedup.has(key))continue;dedup.add(key);
  if(!modules.has(module))modules.set(module,[]);
  modules.get(module).push({date:day,iso:value(r.fecha),folio});
 }
 return [...modules.entries()].sort((a,b)=>a[0].localeCompare(b[0],'es')).map(([module,entries])=>{
  entries.sort((a,b)=>a.iso.localeCompare(b.iso)||a.folio.localeCompare(b.folio,'es',{numeric:true}));
  return [module,...entries.map(e=>`${e.date}, ${e.folio}`)].join('\n');
 }).join('\n\n');
}
