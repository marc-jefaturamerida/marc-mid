// Jefatura Mid Marc V2.7.1 · Gestión por cuenta de solicitudes de corrección de registros.
import {shouldShowUpdateReminder,updateFieldNames,normalizeRequestedValues} from './update-request-rules.js';
const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDay=value=>{const d=new Date(value);return Number.isNaN(d.valueOf())?'':`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const fmt=value=>{if(!value)return '—';const date=new Date(value);return Number.isNaN(date.valueOf())?'—':date.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'});};
const listNames=value=>Object.keys(typeof value==='string'?JSON.parse(value):value||{});
const commentsOf=value=>Array.isArray(value)?value:[];
export function initUpdates({cloud,getRow,getFields,getKey,applyAndSync,afterChange,openPage}){
 let rows=[],trash=[],current=null,currentRow=null,mode='',initialReminderChecked=false;
 const active=()=>rows.filter(r=>r.status==='pending'&&!r.deleted_at);
 const pendingByKey=new Map();
 function syncMap(){pendingByKey.clear();for(const r of active())pendingByKey.set(r.record_key,r);}
 function pendingForRow(row){return row?pendingByKey.get(getKey(row))||null:null;}
 function report(message,error=false){$('updatesStatus').textContent=message;$('updatesStatus').style.color=error?'#a33939':'';}
 function errShow(error){report(error?.message||String(error),true);$('updModalStatus').textContent=error?.message||String(error);}
 function requireCloud(){if(!cloud?.user?.id){cloud?.openLogin?.();throw Error('Inicia sesión para gestionar solicitudes.');}}
 function show(modal){$('updModal').hidden=false;$('updModal').querySelectorAll('[data-upd-panel]').forEach(x=>x.hidden=x.dataset.updPanel!==modal);$('updModalStatus').textContent='';}
 function close(){$('updModal').hidden=true;current=null;currentRow=null;mode='';}
 function getCurrentFields(row){return getFields(row).filter(f=>f.name);}
 function fieldPicker(fields,selected){return fields.map(f=>`<label class="upd-check"><input type="checkbox" value="${escape(f.name)}" data-upd-field ${selected.includes(f.name)?'checked':''}><span><b>${escape(f.name)}</b><small>${escape(f.value||'Vacío')}</small></span></label>`).join('');}
 function openRequest(row,existing=null,editing=false){
  try{requireCloud();}catch(error){report(error.message,true);return;}
  if(!row&&!existing){report('Este registro no está disponible en el XLS. Importa el archivo que lo contiene.',true);return;}
  currentRow=row;current=existing;mode=editing?'edit':'create';
  const fields=row?getCurrentFields(row):(existing?.available_fields||[]).map(name=>({name,value:''})),selected=existing?listNames(existing.requested_fields):[];
  $('updModalHeading').textContent=editing?'Editar solicitud · '+((row?.folio||existing?.folio)||'Sin folio'):
    existing?'Agregar campos a la solicitud · '+((row?.folio||existing?.folio)||'Sin folio'):'Solicitar actualización · '+((row?.folio||existing?.folio)||'Sin folio');
  $('updEditorContext').textContent=[row?.module||existing?.module,row?.executive||existing?.executive,row?.fecha||existing?.record_date].filter(Boolean).join(' · ');
  $('updEditorFields').innerHTML=fieldPicker(fields,selected);
  $('updEditorComment').value='';
  $('updEditorHint').textContent=editing?'Los campos seleccionados sustituirán la lista anterior. Los comentarios previos permanecen.':existing?'Los campos nuevos se agregarán a la solicitud pendiente.':'Selecciona todos los campos que deban corregirse, sin capturar todavía nuevos valores.';
  show('editor');
 }
 function openForRow(row){openRequest(row,pendingForRow(row));}
 function selectedFields(){return [...$('updEditorFields').querySelectorAll('[data-upd-field]:checked')].map(x=>x.value);}
 async function saveRequest(){
  const fields=selectedFields(),comment=$('updEditorComment').value.trim();
  try{
   requireCloud();updateFieldNames(fields);
   $('updEditorSave').disabled=true;
   if(mode==='edit')await cloud.changeUpdate({action:'edit',id:current.id,revision:Number(current.revision),fields,comment});
   else await cloud.createUpdate({recordKey:getKey(currentRow),folio:currentRow.folio||'',module:currentRow.module||'',executive:currentRow.executive||'',recordDate:currentRow.fecha||'',fields,availableFields:getCurrentFields(currentRow).map(x=>x.name),comment});
   close();await refresh();afterChange?.();
  }catch(error){errShow(error);}finally{$('updEditorSave').disabled=false;}
 }
 function updateOptions(id,values,placeholder){
  const node=$(id),before=node.value;
  const list=[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  node.innerHTML=`<option value="">${escape(placeholder)}</option>`+list.map(x=>`<option value="${escape(x)}">${escape(x)}</option>`).join('');
  node.value=list.includes(before)?before:'';
 }
 function filtered(){
  const folio=$('updFilterFolio').value.trim().toLocaleLowerCase(),module=$('updFilterModule').value,executive=$('updFilterExecutive').value,status=$('updFilterState').value,
   from=$('updFilterFrom').value,to=$('updFilterTo').value,query=$('updFilterSearch').value.trim().toLocaleLowerCase();
  const pool=status==='trash'?trash:rows;
  return pool.filter(r=>{
   const day=localDay(r.created_at),haystack=[r.folio,r.module,r.executive,r.record_date,...listNames(r.requested_fields),...commentsOf(r.comments).map(c=>c.text)].join(' ').toLocaleLowerCase();
   return (!folio||String(r.folio).toLocaleLowerCase().includes(folio))&&(!module||r.module===module)&&(!executive||r.executive===executive)&&
    (!status||status==='trash'||r.status===status)&&(!from||day>=from)&&(!to||day<=to)&&(!query||haystack.includes(query));
  });
 }
 function render(){
  const count=active().length,visible=filtered();
  $('updatesCount').textContent=count+' solicitud(es) pendiente(s) · '+rows.filter(r=>r.status==='resolved').length+' resuelta(s)';
  $('updRows').innerHTML=visible.length?visible.map(r=>`<tr data-upd-id="${r.id}" tabindex="0" role="button" aria-label="Ver solicitud ${escape(r.folio)}">
   <td data-label="Folio"><b>${escape(r.folio||'Sin folio')}</b></td><td data-label="Módulo">${escape(r.module||'—')}</td><td data-label="Ejecutivo">${escape(r.executive||'—')}</td>
   <td data-label="Campos">${listNames(r.requested_fields).map(escape).join(', ')}</td><td data-label="Fecha de creación">${fmt(r.created_at)}</td>
   <td data-label="Estado"><span class="upd-state ${r.deleted_at?'upd-deleted':r.status==='pending'?'upd-pending':'upd-resolved'}">${r.deleted_at?'Papelera':r.status==='pending'?'Pendiente de actualizar':'Actualizada'}</span></td>
   <td data-label="Acción"><button class="btn small" type="button" data-upd-detail="${r.id}">Ver detalle</button></td></tr>`).join(''):'<tr><td colspan="7">No hay solicitudes que coincidan con los filtros.</td></tr>';
  $('updatesVisibleCount').textContent=visible.length+' de '+(statusPoolSize())+' solicitud(es)';
 }
 function statusPoolSize(){return $('updFilterState').value==='trash'?trash.length:rows.length;}
 async function refresh(checkReminder=false){
  if(!cloud?.user?.id){rows=[];trash=[];syncMap();render();report('Inicia sesión para consultar las solicitudes privadas de tu cuenta.');return;}
  try{
   const [a,b]=await Promise.all([cloud.listUpdates(false),cloud.listUpdates(true)]);
   rows=a;trash=b;syncMap();
   updateOptions('updFilterModule',[...rows,...trash].map(r=>r.module),'Todos los módulos');
   updateOptions('updFilterExecutive',[...rows,...trash].map(r=>r.executive),'Todos los ejecutivos');
   render();report('Datos de solicitudes sincronizados con PostgreSQL.');afterChange?.();
   if(checkReminder&&!initialReminderChecked){initialReminderChecked=true;showReminder();}
  }catch(error){report('No se pudieron consultar las solicitudes: '+(error.message||error),true);}
 }
 function showReminder(){
  const count=active().length;if(!shouldShowUpdateReminder(new Date().getDay(),count))return;
  $('updReminderText').textContent=`Hay ${count} solicitud(es) de actualización sin resolver. Revisa la página Administración → Actualizaciones.`;
  $('updReminder').hidden=false;
 }
 function detailsHTML(r){
  return `<div class="upd-details-grid">${[['Folio',r.folio],['Módulo',r.module],['Ejecutivo',r.executive],['Fecha del registro',r.record_date],['Creación',fmt(r.created_at)],['Última modificación',fmt(r.updated_at)],['Estado',r.deleted_at?'En papelera':r.status==='pending'?'Pendiente de actualizar':'Actualizada'],['Fecha de resolución',fmt(r.resolved_at)]].map(([k,v])=>`<div><small>${escape(k)}</small><b>${escape(v||'—')}</b></div>`).join('')}</div>
   <h3>Campos solicitados</h3><div class="upd-field-tags">${listNames(r.requested_fields).map(name=>`<span>${escape(name)}</span>`).join('')}</div>
   <h3>Comentarios e historial</h3><div class="upd-notes">${commentsOf(r.comments).map(c=>`<p><small>${fmt(c.createdAt)}</small><span>${escape(c.text)}</span></p>`).join('')||'<p>Sin comentarios.</p>'}</div>
   ${r.status==='resolved'?`<h3>Valores aplicados</h3><div class="upd-details-grid">${Object.entries(r.applied_values||{}).map(([k,v])=>`<div><small>${escape(k)}</small><b>${escape(v)}</b></div>`).join('')}</div>`:''}`;
 }
 function detail(r){current=r;currentRow=getRow(r.record_key);mode='detail';$('updModalHeading').textContent='Solicitud #'+r.id+' · '+(r.folio||'Sin folio');$('updDetailBody').innerHTML=detailsHTML(r);
  $('updDetailActions').innerHTML=r.deleted_at?`<button class="btn primary" type="button" data-upd-action="restore">Restaurar solicitud</button>`:
   r.status==='pending'?`<button class="btn" type="button" data-upd-action="edit">Editar</button><button class="btn danger" type="button" data-upd-action="delete">Eliminar</button><button class="btn primary" type="button" data-upd-action="resolve">Ya se actualizó</button>`:
   `<button class="btn danger" type="button" data-upd-action="delete">Enviar a papelera</button>`;
  show('detail');
 }
 function resolveEditor(){
  if(!currentRow){$('updModalStatus').textContent='El registro ya no está cargado. Importa el XLS que contiene el folio para aplicar la corrección.';return;}
  const available=new Map(getCurrentFields(currentRow).map(f=>[f.name,f]));
  const fields=listNames(current.requested_fields);if(fields.some(name=>!available.has(name))){$('updModalStatus').textContent='Faltan campos del XLS original. Importa el archivo completo antes de resolver.';return;}
  $('updResolveFields').innerHTML=fields.map(name=>{
   const data=available.get(name);
   const choices=data.choices;
   if(choices?.length){const all=choices.includes(data.value)?choices:[data.value,...choices].filter(Boolean);return `<label><span>${escape(name)}</span><select data-upd-value="${escape(name)}">${all.map(x=>`<option value="${escape(x)}" ${x===data.value?'selected':''}>${escape(x)}${!choices.includes(x)?' · histórico':''}</option>`).join('')}</select></label>`;}
   return `<label><span>${escape(name)}</span><input data-upd-value="${escape(name)}" type="text" maxlength="400" value="${escape(data.value||'')}"></label>`;
  }).join('');
  $('updResolveInfo').textContent='Introduce los valores definitivos de los campos seleccionados. Se guardarán como correcciones del registro sin modificar el XLS original.';
  mode='resolve';show('resolve');
 }
 async function confirmResolve(){
  try{
   requireCloud();if(!currentRow)throw Error('El registro original no está cargado.');
   const values=Object.fromEntries([...$('updResolveFields').querySelectorAll('[data-upd-value]')].map(x=>[x.dataset.updValue,x.value]));
   normalizeRequestedValues(current.requested_fields,values);
   $('updResolveSave').disabled=true;
   // La solicitud no cambia de estado hasta confirmar las correcciones en la configuración remota.
   await applyAndSync(currentRow,values);
   await cloud.changeUpdate({action:'resolve',id:current.id,revision:Number(current.revision),appliedValues:values});
   close();await refresh();afterChange?.();
  }catch(error){errShow(error);}finally{$('updResolveSave').disabled=false;}
 }
 async function action(name){
  if(!current)return;
  if(name==='edit'){
   openRequest(currentRow,current,true);return;
  }
  if(name==='resolve'){resolveEditor();return;}
  if(name==='delete'&&!confirm('¿Enviar esta solicitud a la papelera? Podrás restaurarla.'))return;
  try{requireCloud();
   if(name==='delete')await cloud.trashUpdate(current.id,Number(current.revision));
   else if(name==='restore')await cloud.restoreUpdate(current.id,Number(current.revision));
   close();await refresh();
  }catch(error){errShow(error);}
 }
 $('updModalClose').addEventListener('click',close);
 $('updModal').addEventListener('click',e=>{if(e.target===$('updModal'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('updModal').hidden)close();});
 $('updEditorSave').addEventListener('click',()=>{void saveRequest();});
 $('updResolveSave').addEventListener('click',()=>{void confirmResolve();});
 $('updDetailActions').addEventListener('click',e=>{const btn=e.target.closest('[data-upd-action]');if(btn)void action(btn.dataset.updAction);});
 $('updRows').addEventListener('click',e=>{const entry=e.target.closest('[data-upd-id]');if(entry)detail([...rows,...trash].find(r=>String(r.id)===entry.dataset.updId));});
 $('updRows').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.matches('[data-upd-id]')){e.preventDefault();detail([...rows,...trash].find(r=>String(r.id)===e.target.dataset.updId));}});
 for(const id of ['updFilterFolio','updFilterModule','updFilterExecutive','updFilterState','updFilterFrom','updFilterTo','updFilterSearch'])$(id).addEventListener(['updFilterFolio','updFilterSearch'].includes(id)?'input':'change',render);
 $('updResetFilters').addEventListener('click',()=>{for(const id of ['updFilterFolio','updFilterModule','updFilterExecutive','updFilterFrom','updFilterTo','updFilterSearch'])$(id).value='';$('updFilterState').value='pending';render();});
 $('updatesRefresh').addEventListener('click',()=>{void refresh();});
 $('updReminderClose').addEventListener('click',()=>{$('updReminder').hidden=true;});
 $('updReminderGo').addEventListener('click',()=>{$('updReminder').hidden=true;openPage('updates');});
 render();return {refresh,render,openForRow,pendingForRow};
}
