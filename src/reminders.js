/** V2.6.1 · Recordatorios in-app. No notificaciones externas ni procesos en segundo plano. */
export const REMINDERS_KEY='wmSamsRemindersV261';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localStamp=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+[String(d.getHours()).padStart(2,'0'),String(d.getMinutes()).padStart(2,'0')].join(':');
export function cleanReminders(raw){
 if(!Array.isArray(raw))return [];
 return raw.slice(0,200).filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.when==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(x.when)).map(x=>({
  id:x.id.slice(0,80),title:x.title.slice(0,140),body:String(x.body||'').slice(0,1000),when:x.when,
  repeat:['once','daily','weekly','weekdays','monthly'].includes(x.repeat)?x.repeat:'once',enabled:x.enabled!==false,
  snooze:Number.isInteger(x.snooze)&&x.snooze>=1&&x.snooze<=1440?x.snooze:15,
  lastAcknowledged:typeof x.lastAcknowledged==='string'?x.lastAcknowledged:'',snoozeUntil:typeof x.snoozeUntil==='string'?x.snoozeUntil:''
 }));
}
export function reminderOccurrence(item,now=new Date()){
 const start=new Date(item.when),end=new Date(now);if(!item.enabled||Number.isNaN(start.getTime())||end<start)return '';
 const target=new Date(end);target.setHours(start.getHours(),start.getMinutes(),0,0);
 if(target>end)return '';
 const diff=Math.floor((new Date(end.getFullYear(),end.getMonth(),end.getDate())-new Date(start.getFullYear(),start.getMonth(),start.getDate()))/86400000);
 if(item.repeat==='once')return item.when;
 if(item.repeat==='daily')return localStamp(target);
 if(item.repeat==='weekdays'&&target.getDay()>=1&&target.getDay()<=5)return localStamp(target);
 if(item.repeat==='weekly'&&diff%7===0)return localStamp(target);
 if(item.repeat==='monthly'&&target.getDate()===start.getDate())return localStamp(target);
 return '';
}
export function initReminders(){
 let reminders=[];let editingId='',showingId='',showingOccurrence='';
 const label={once:'Único',daily:'Diario',weekly:'Semanal',weekdays:'Lunes a viernes',monthly:'Mensual'};
 function load(){try{reminders=cleanReminders(JSON.parse(localStorage.getItem(REMINDERS_KEY)||'[]'));}catch(_){reminders=[];}render();check();}
 function save(){try{localStorage.setItem(REMINDERS_KEY,JSON.stringify(reminders));$('remStatus').textContent='Recordatorios guardados'+(window.APP_CLOUD?.user?.id?' y pendientes de sincronización.':' en este navegador.');return true;}catch(error){$('remStatus').textContent='Error al guardar: '+error.message;return false;}}
 function render(){
  $('remRows').innerHTML=reminders.length?reminders.slice().sort((a,b)=>a.when.localeCompare(b.when)).map(r=>`<article class="rem-item ${r.enabled?'':'off'}"><small>${esc(label[r.repeat])} · ${esc(r.when.replace('T',' '))} · ${r.enabled?'Activo':'Inactivo'}</small><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p><div class="rem-item-actions"><button class="btn small" data-rem-edit="${esc(r.id)}" type="button">Editar</button><button class="btn small" data-rem-toggle="${esc(r.id)}" type="button">${r.enabled?'Desactivar':'Activar'}</button><button class="btn small danger" data-rem-delete="${esc(r.id)}" type="button">Eliminar</button></div></article>`).join(''):'<p class="settings-help">No has creado recordatorios. Pulsa «Crear recordatorio».</p>';
 }
 function editor(item=null){editingId=item?.id||'';$('remEditorTitle').textContent=item?'Editar recordatorio':'Crear recordatorio';$('remTitle').value=item?.title||'';$('remBody').value=item?.body||'';$('remWhen').value=item?.when||localStamp(new Date());$('remRepeat').value=item?.repeat||'once';$('remSnooze').value=item?.snooze||15;$('remEnabled').checked=item?.enabled!==false;$('remEditorStatus').textContent='';$('remEditor').hidden=false;$('remTitle').focus();}
 const close=()=>{$('remEditor').hidden=true;};
 function check(){
  if(!$('remPopup').hidden||!$('remEditor').hidden)return;
  const now=new Date();
  for(const item of reminders){
   const occurrence=reminderOccurrence(item,now);
   if(!occurrence||item.lastAcknowledged===occurrence||(item.snoozeUntil&&new Date(item.snoozeUntil)>now))continue;
   showingId=item.id;showingOccurrence=occurrence;$('remPopupTitle').textContent=item.title;$('remPopupText').textContent=item.body;$('remLater').textContent=`Posponer ${item.snooze} min`;$('remPopup').hidden=false;return;
  }
 }
 $('remNew').addEventListener('click',()=>editor());
 $('remEditorClose').addEventListener('click',close);$('remCancel').addEventListener('click',close);
 $('remEditor').addEventListener('click',e=>{if(e.target===$('remEditor'))close();});
 $('remForm').addEventListener('submit',e=>{
  e.preventDefault();const title=$('remTitle').value.trim(),body=$('remBody').value.trim(),when=$('remWhen').value,repeat=$('remRepeat').value,snooze=Number($('remSnooze').value);
  if(!title||!body||!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(when)||!Number.isInteger(snooze)||snooze<1||snooze>1440){$('remEditorStatus').textContent='Revisa título, mensaje, fecha, repetición y minutos para posponer.';return;}
  const old=reminders.find(x=>x.id===editingId);
  const item={id:old?.id||'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),title,body,when,repeat,enabled:$('remEnabled').checked,snooze,lastAcknowledged:old?.lastAcknowledged||'',snoozeUntil:''};
  if(old&&old.when!==when||old&&old.repeat!==repeat)item.lastAcknowledged='';
  const before=reminders.slice();if(old)reminders[reminders.indexOf(old)]=item;else reminders.push(item);
  if(!save()){reminders=before;return;}close();render();check();
 });
 $('remRows').addEventListener('click',e=>{
  const edit=e.target.closest('[data-rem-edit]'),toggle=e.target.closest('[data-rem-toggle]'),del=e.target.closest('[data-rem-delete]');
  const id=edit?.dataset.remEdit||toggle?.dataset.remToggle||del?.dataset.remDelete,entry=reminders.find(x=>x.id===id);if(!entry)return;
  if(edit)editor(entry);else if(toggle){entry.enabled=!entry.enabled;if(save()){render();check();}}else if(del&&confirm('¿Eliminar definitivamente el recordatorio «'+entry.title+'»?')){reminders=reminders.filter(x=>x!==entry);save();render();}
 });
 function acknowledge(snooze){const item=reminders.find(x=>x.id===showingId);$('remPopup').hidden=true;if(!item)return;
  if(snooze)item.snoozeUntil=new Date(Date.now()+item.snooze*60000).toISOString();else{item.lastAcknowledged=showingOccurrence;item.snoozeUntil='';}
  showingId='';save();render();if(!snooze)check();
 }
 $('remDone').addEventListener('click',()=>acknowledge(false));$('remLater').addEventListener('click',()=>acknowledge(true));
 window.addEventListener('focus',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
 setInterval(check,30000);
 window.INVEX_REMINDERS={refresh:load,check};load();
}
