import {
  login, logout, getUser, handleAuthCallback, acceptInvite,
  requestPasswordRecovery, updateUser, refreshSession
} from '@netlify/identity';
import { rememberSession, readRememberedSession, isRememberedSessionExpired, clearRememberedSession } from './session-lifetime.js';

// 1.9: sin sondeo continuo. Datos remotos por cuenta; cálculos y UI locales.
// Las ediciones se agrupan y se conservan como pendientes si falla la conexión.
const KEYS = new Set([
  'wmSamsComisionesV1',
  'wmSamsComisionesTarifasV14',
  'wmSamsComisionesMetasEquipoV1',
  'wmSamsComisionesRecuperacionesEquipoV1',
  'wmSamsArchivoSeleccionV9',
  'wmSamsFolioFlagsV9',
  'wmSamsMeridaBonusDinamicaV245',
  'wmSamsComparativaSemanalObjetivosV13',
  'wmSamsComisionesLayoutV5',
  'wmSamsMeridaReportTextsV17',
  'wmSamsTablaVisualV18',
  'wmSamsVisitConfigV20',
  'wmSamsMeridaQualityConfigV22',
  'wmSamsMeridaSupervisorsV22',
  'wmSamsMeridaAchievementGoalsV232',
  'wmSamsMeridaSupervisorCommissionV24'
]);
const PENDING_PREFIX = 'wmSamsCloudPendingV19:';
const SESSION_EXPIRED_FLAG='wmSamsSessionExpiredV249';
const WRITE_DEBOUNCE_MS = 3000;
const MIN_AWAY_MS = 10 * 60 * 1000;
const RETRY_DELAYS_MS = [30000, 120000]; // Dos intentos; después solo manual / regreso / reconexión.
const MAX_BATCH_KEYS = 12;
const MAX_BATCH_BYTES = 1700000;
let user=null, suspended=true, afterLogin=null, inviteToken='', passwordReset=false;
let sessionExpiredOnBoot=false;
let saveTimer=0, retryTimer=0, flushPromise=null, retryCount=0;
let checking=false, checkingTimer=0, lastWakeCheck=0, awaySince=null;
let pending=new Map(), fileSignatures=new Map(), refresher=null;
const $=id=>document.getElementById(id);
const nativeSet=Storage.prototype.setItem;
const nativeRemove=Storage.prototype.removeItem;
const encoder=new TextEncoder();

function sessionMessage(message,kind='normal'){
  const node=$('cloudSessionLabel');if(!node)return;
  node.textContent=message;
  node.style.color=kind==='error'?'#b33939':kind==='pending'?'#925d1b':'';
  node.dataset.state=kind;
}
function savedMessage(){return 'En la nube · '+user.email+' · ahorro activo';}
function pendingMessage(){
  if(!user)return;
  sessionMessage(`Pendiente de guardar (${pending.size}) · ${user.email}`,'pending');
}
function toast(message){
  const node=$('cloudToast');if(!node)return;
  node.textContent=message;node.hidden=false;
  clearTimeout(window.__cloudToastTimeout);
  window.__cloudToastTimeout=setTimeout(()=>node.hidden=true,6500);
}
function escapeMsg(err){return String(err?.message||err||'Error de conexión').slice(0,240);}
function modal(open){$('cloudModal').hidden=!open;if(open)$('cloudEmail').focus();}
function openLogin(callback){
  afterLogin=typeof callback==='function'?callback:null;
  $('cloudAuthError').textContent='';
  $('cloudSubmit').textContent=inviteToken?'Aceptar invitación':passwordReset?'Cambiar contraseña':'Iniciar sesión';
  $('cloudModalTitle').textContent=inviteToken?'Crear contraseña para la invitación':passwordReset?'Nueva contraseña':'Acceso por correo';
  $('cloudEmail').required=!(inviteToken||passwordReset);
  $('cloudEmail').disabled=!!(inviteToken||passwordReset);
  modal(true);
}
async function api(endpoint,options={}){
  const request=()=>fetch('/api/'+endpoint,{
    credentials:'same-origin',cache:'no-store',
    headers:{Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})},
    ...options
  });
  if(user && isRememberedSessionExpired(localStorage,user.id)){
    await expireSession();
    throw Error('Se cumplieron 7 días. Inicia sesión de nuevo.');
  }
  let res=await request();
  // Una sesión con JWT de una hora puede recuperarse mediante nf_refresh.
  // El servidor también intenta renovarla antes de verificar la identidad.
  if(res.status===401 && user){
    try{await refreshSession();}catch(_){ /* La respuesta del servidor confirmará si continúa válida. */ }
    res=await request();
  }
  let data;
  try{data=await res.json();}catch(_){throw Error(`El servidor devolvió un resultado inválido (${res.status}). Comprueba Functions y Database.`);}
  if(!res.ok)throw Error(data?.error||`Solicitud rechazada (${res.status})`);
  return data;
}
function pendingKey(){return PENDING_PREFIX+user.id;}
function restorePending(){
  pending.clear();if(!user)return;
  try{
    const values=JSON.parse(localStorage.getItem(pendingKey())||'{}');
    if(values&&typeof values==='object'&&!Array.isArray(values))for(const [key,value] of Object.entries(values)){
      if(KEYS.has(key)&&typeof value==='string')pending.set(key,value);
    }
  }catch(_){/* Un valor de caché corrupto no impide acceder a la nube. */}
}
function persistPending(){
  if(!user)return;
  try{
    if(pending.size)nativeSet.call(localStorage,pendingKey(),JSON.stringify(Object.fromEntries(pending)));
    else nativeRemove.call(localStorage,pendingKey());
  }catch(err){sessionMessage('No se pudo conservar la cola local de ajustes', 'error');}
}
function scheduleSave(delay=WRITE_DEBOUNCE_MS){
  if(!user||suspended||!pending.size)return;
  clearTimeout(saveTimer);
  pendingMessage();
  if(!navigator.onLine)return;
  saveTimer=setTimeout(()=>{void flush();},delay);
}
function localChange(key,value){
  if(!user||suspended||!KEYS.has(key)||typeof value!=='string')return;
  pending.set(key,value);persistPending();retryCount=0;
  clearTimeout(retryTimer);retryTimer=0;
  scheduleSave();
}
// No interceptar credenciales de Identity ni datos ajenos al Dashboard.
Storage.prototype.setItem=function(key,value){
  const relevant=this===localStorage&&KEYS.has(String(key));
  const before=relevant?nativeGet.call(this,key):null;
  const result=nativeSet.call(this,key,value);
  if(relevant&&before!==String(value))localChange(String(key),String(value));
  return result;
};
const nativeGet=Storage.prototype.getItem;
Storage.prototype.removeItem=function(key){
  const relevant=this===localStorage&&KEYS.has(String(key));
  const existed=relevant&&nativeGet.call(this,key)!==null;
  const result=nativeRemove.call(this,key);
  if(existed)localChange(String(key),'');
  return result;
};
function clearDashboardCache(){
  for(const key of KEYS)nativeRemove.call(localStorage,key);
  nativeRemove.call(localStorage,'wmSamsOpcionesAutorizadasV9'); // Ya no otorga acceso.
}
async function hydrate(){
  suspended=true;
  clearDashboardCache();
  if(user){
    const {settings}=await api('settings');
    for(const [key,value] of Object.entries(settings||{}))if(KEYS.has(key)&&typeof value==='string'&&value.length){
      nativeSet.call(localStorage,key,value);
    }
    // Los cambios locales sin confirmar prevalecen sólo hasta guardarse correctamente.
    for(const [key,value] of pending){
      if(value)nativeSet.call(localStorage,key,value);
      else nativeRemove.call(localStorage,key);
    }
  }
  suspended=false;
}
function snapshotBatch(){
  const result=[];let bytes=2;
  for(const [key,value] of pending){
    const entry={key,value},size=encoder.encode(JSON.stringify(entry)).length+1;
    if(result.length&&(result.length>=MAX_BATCH_KEYS||bytes+size>MAX_BATCH_BYTES))break;
    result.push(entry);bytes+=size;
  }
  return result;
}
async function flush(){
  if(!user||!pending.size)return;
  if(flushPromise)return flushPromise;
  clearTimeout(saveTimer);saveTimer=0;
  clearTimeout(retryTimer);retryTimer=0;
  if(!navigator.onLine){pendingMessage();return;}
  flushPromise=(async()=>{
    sessionMessage('Guardando en la nube…','pending');
    try{
      while(pending.size){
        const entries=snapshotBatch();
        await api('settings',{method:'PUT',body:JSON.stringify({entries})});
        for(const {key,value} of entries){if(pending.get(key)===value)pending.delete(key);}
        persistPending();
      }
      retryCount=0;sessionMessage(savedMessage());
    }catch(err){
      pendingMessage();toast('Cambios pendientes: '+escapeMsg(err));
      if(navigator.onLine&&retryCount<RETRY_DELAYS_MS.length){
        retryTimer=setTimeout(()=>{retryTimer=0;void flush();},RETRY_DELAYS_MS[retryCount++]);
      }
    }
  })();
  try{await flushPromise;}finally{
    flushPromise=null;
    // Si se editó una clave mientras se guardaba el lote, procesar el valor nuevo.
    if(pending.size&&!retryTimer&&retryCount===0)scheduleSave();
  }
}
function filesSignature(){return JSON.stringify([...fileSignatures].sort(([a],[b])=>a.localeCompare(b)));}
async function listFiles(){
  if(!user)return [];
  const reports=[],seen=new Set();
  let offset=0;
  for(let call=0;call<100&&offset<500;call++){
    const data=await api('files?offset='+offset+'&limit=8');
    const batch=Array.isArray(data.reports)?data.reports:[];
    for(const report of batch){if(!seen.has(report.id)){seen.add(report.id);reports.push(report);}}
    if(!data.hasMore||!batch.length)break;
    const next=Number(data.nextOffset);
    offset=Number.isInteger(next)&&next>offset?next:offset+batch.length;
  }
  fileSignatures=new Map(reports.map(r=>[r.id,r.fingerprint]));
  return reports;
}
async function putFile(report){
  if(!user)throw Error('Inicia sesión para guardar el XLS en la nube.');
  const result=await api('files',{method:'POST',body:JSON.stringify(report)});
  fileSignatures.set(report.id,report.fingerprint);
  toast('XLS guardado en Netlify Database.');
  return result;
}
async function deleteFile(id){
  await api('files?id='+encodeURIComponent(id),{method:'DELETE'});
  fileSignatures.delete(id);
}
async function clearFiles(){
  await api('files?all=1',{method:'DELETE'});
  fileSignatures.clear();
}
async function expireSession(){
  // Los cambios pendientes ya están en la cola local por cuenta; no se borran.
  // Al volver a iniciar sesión, podrán sincronizarse con el mismo usuario.
  clearRememberedSession(localStorage);
  try{await logout();}catch(_){ /* Identity limpia sus cookies incluso si falla el endpoint. */ }
  try{sessionStorage.setItem(SESSION_EXPIRED_FLAG,'1');}catch(_){}
  user=null;
  clearDashboardCache();
  location.reload();
}
async function signOut(){
  await flush();
  if(pending.size){
    if(!confirm('Hay ajustes sin guardar. ¿Salir y DESCARTAR esos cambios?'))return;
    pending.clear();persistPending();
  }
  try{await logout();}catch(err){toast('No se pudo cerrar sesión: '+escapeMsg(err));return;}
  clearRememberedSession(localStorage);
  clearDashboardCache();location.reload();
}
function setupModal(){
  $('cloudLoginButton').addEventListener('click',()=>user?signOut():openLogin());
  $('cloudSyncButton').addEventListener('click',async()=>{
    if(!navigator.onLine){toast('No hay conexión. Los cambios pendientes se conservan localmente.');return;}
    await flush();
    if(pending.size){toast('Primero deben guardarse los ajustes pendientes.');return;}
    sessionMessage('Actualizando desde la nube…','pending');
    location.reload(); // Una sola ronda de carga; evita una consulta previa redundante.
  });
  $('cloudCancel').addEventListener('click',()=>{afterLogin=null;modal(false);});
  $('cloudModal').addEventListener('click',event=>{if(event.target===$('cloudModal'))modal(false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('cloudModal').hidden)modal(false);});
  $('cloudRecovery').addEventListener('click',async()=>{
    const email=$('cloudEmail').value.trim();
    if(!email){$('cloudAuthError').textContent='Ingresa primero tu correo electrónico.';return;}
    try{await requestPasswordRecovery(email);toast('Si el correo está registrado, recibirás instrucciones para recuperar el acceso.');modal(false);}
    catch(err){$('cloudAuthError').textContent=escapeMsg(err);}
  });
  $('cloudAuthForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const email=$('cloudEmail').value.trim(),password=$('cloudPassword').value;
    $('cloudSubmit').disabled=true;$('cloudAuthError').textContent='';
    try{
      let loggedIn;
      if(inviteToken)loggedIn=await acceptInvite(inviteToken,password);
      else if(passwordReset)loggedIn=await updateUser({password});
      else loggedIn=await login(email,password);
      // Se inicia el plazo SOLO al acceder con credenciales, nunca por recargar.
      if(loggedIn?.id)rememberSession(localStorage,String(loggedIn.id),Date.now(),true);
      modal(false);location.reload();
    }catch(err){$('cloudAuthError').textContent=escapeMsg(err);}
    finally{$('cloudSubmit').disabled=false;}
  });
}
window.APP_CLOUD={
  get user(){return user;},
  openLogin,logout:signOut,listFiles,putFile,deleteFile,clearFiles,
  registerRefresh:fn=>{refresher=fn;},flush,
  get pendingCount(){return pending.size;}
};
setupModal();
try{
  const callback=await handleAuthCallback();
  if(callback?.type==='invite'&&callback.token)inviteToken=callback.token;
  if(callback?.type==='recovery')passwordReset=true;
  // Si el JWT de una hora caducó durante la noche, intenta renovarlo con
  // la cookie de sesión válida de Identity antes de declarar al usuario invitado.
  try{await refreshSession();}catch(_){ /* getUser decide la autenticación real. */ }
  user=await getUser();
  if(user){
    if(isRememberedSessionExpired(localStorage,user.id)){
      sessionExpiredOnBoot=true;
      clearRememberedSession(localStorage);
      try{await logout();}catch(_){}
      user=null;
    }else{
      if(!readRememberedSession(localStorage)?.userId ||
         readRememberedSession(localStorage)?.userId!==String(user.id))
        rememberSession(localStorage,String(user.id)); // Migración de una sesión previa ya válida.
      restorePending();
    }
  }else{
    // Conservar solamente la FECHA local si Identity no responde o cerró
    // temporalmente la sesión. Nunca otorga acceso a la nube por sí sola.
    // Así un fallo de red no reinicia indebidamente el plazo de siete días.
  }
}catch(err){toast('No se pudo validar la sesión: '+escapeMsg(err));user=null;}
try{await hydrate();}
catch(err){
  sessionMessage('No se pudo recuperar la configuración desde PostgreSQL','error');
  toast('Error al abrir la base de datos: '+escapeMsg(err));
  user=null;clearDashboardCache();suspended=false;
}
if(user){
  $('cloudLoginButton').textContent='Cerrar sesión';$('cloudSyncButton').hidden=false;
  if(pending.size)pendingMessage();else sessionMessage(savedMessage());
}else{
  $('cloudLoginButton').textContent='Ingresar con correo';$('cloudSyncButton').hidden=true;
  sessionMessage('Sin sesión · XLS temporales');
}
await import('./legacy-app.js');
let expiredFromAnotherVisit=false;
try{expiredFromAnotherVisit=sessionStorage.getItem(SESSION_EXPIRED_FLAG)==='1';sessionStorage.removeItem(SESSION_EXPIRED_FLAG);}catch(_){}
if(inviteToken||passwordReset||sessionExpiredOnBoot||expiredFromAnotherVisit){
  openLogin();
  if(sessionExpiredOnBoot||expiredFromAnotherVisit)$('cloudAuthError').textContent='Pasaron 7 días desde el último ingreso. Inicia sesión nuevamente.';
}
if(user&&pending.size)scheduleSave(1500);

// Sin intervalos: solo una lectura tras ausentarse >= 10 minutos, o sincronización manual.
async function checkRemoteOnReturn(){
  if(!user||checking||document.hidden||pending.size||flushPromise||!navigator.onLine)return;
  const now=Date.now();
  if(now-lastWakeCheck<MIN_AWAY_MS)return;
  lastWakeCheck=now;checking=true;
  try{
    const remote=await api('sync');
    const diverged=[...KEYS].some(key=>String(remote.settings?.[key]??'')!==String(nativeGet.call(localStorage,key)??''));
    const remoteFiles=JSON.stringify((remote.reports||[]).map(r=>[r.id,r.fingerprint]).sort(([a],[b])=>a.localeCompare(b)));
    if(diverged||remoteFiles!==filesSignature()){
      toast('Se detectaron cambios en la nube. Actualizando…');
      location.reload();return;
    }
    sessionMessage(savedMessage());
  }catch(err){sessionMessage('No se pudo comprobar la nube · '+escapeMsg(err),'error');}
  finally{checking=false;}
}
function returnFromAway(){
  if(user && isRememberedSessionExpired(localStorage,user.id)){void expireSession();return;}
  if(awaySince===null)return;
  const duration=Date.now()-awaySince;
  awaySince=null;
  if(duration>=MIN_AWAY_MS){
    if(pending.size){void flush();return;}
    clearTimeout(checkingTimer);
    checkingTimer=setTimeout(()=>{checkingTimer=0;void checkRemoteOnReturn();},1200);
  }
}
window.addEventListener('blur',()=>{if(awaySince===null)awaySince=Date.now();});
window.addEventListener('focus',returnFromAway);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(awaySince===null)awaySince=Date.now();}
  else returnFromAway();
});
window.addEventListener('online',()=>{
  if(!user)return;
  if(pending.size){retryCount=0;void flush();}
  else if(awaySince!==null)returnFromAway();
});
window.addEventListener('offline',()=>{if(user)sessionMessage('Sin conexión · los cambios se conservarán en este dispositivo','pending');});
