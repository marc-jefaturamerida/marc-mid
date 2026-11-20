import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL||'';
const SUPABASE_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_ANON_KEY||'';
const supabase=SUPABASE_URL&&SUPABASE_KEY?createClient(SUPABASE_URL,SUPABASE_KEY,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
}):null;
async function getUser(){
 if(!supabase)return null;
 const {data,error}=await supabase.auth.getUser();
 if(error)return null;
 return data?.user?{id:data.user.id,email:data.user.email}:null;
}
async function login(email,password){
 if(!supabase)throw Error('Configura primero VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.');
 const {data,error}=await supabase.auth.signInWithPassword({email,password});
 if(error)throw error;
 return data.user;
}
async function logout(){if(!supabase)return;const {error}=await supabase.auth.signOut();if(error)throw error;}
async function refreshSession(){if(!supabase)return;const {error}=await supabase.auth.refreshSession();if(error)throw error;}
async function handleAuthCallback(){
 const params=new URLSearchParams(window.location.search);
 return params.get('type')==='recovery'||params.get('reset')==='1'?{type:'recovery'}:null;
}
async function acceptInvite(_token,password){return updateUser({password});}
async function requestPasswordRecovery(email){
 if(!supabase)throw Error('Supabase sin configurar.');
 const redirectTo=location.origin+location.pathname+'?reset=1';
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;
}
async function updateUser(payload){
 if(!supabase)throw Error('Supabase sin configurar.');
 const {data,error}=await supabase.auth.updateUser(payload);if(error)throw error;
 return data.user;
}
import { rememberSession, readRememberedSession, isRememberedSessionExpired, clearRememberedSession } from './session-lifetime.js';
import { loadCompleteHistory, loadChunkedHistory } from './history-loading.js';

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
  'wmSamsMeridaSupervisorCommissionV24',
  'wmSamsNavOrderV250',
  'wmSamsWeeklyAdminReportV252',
  'wmSamsHistoricalIndividualV253',
  'wmSamsHistoricalModuleV254',
  'wmSamsBaseGoalsV258',
  'wmSamsLeadershipV256',
  'wmSamsRecordEditsV260',
  'wmSamsTeamRegistryV261',
  'wmSamsRemindersV261','wmSamsClipboardSettingsV303'
]);
const PENDING_PREFIX = 'wmSamsCloudPendingV19:';
const SESSION_EXPIRED_FLAG='wmSamsSessionExpiredV249';
const WRITE_DEBOUNCE_MS = 3000;
const MIN_AWAY_MS = 10 * 60 * 1000;
const RETRY_DELAYS_MS = [30000, 120000]; // Dos intentos; después solo manual / regreso / reconexión.
const MAX_BATCH_KEYS = 12;
const MAX_BATCH_BYTES = 1700000;
let user=null, suspended=true,conflictBlocked=false, afterLogin=null, inviteToken='', passwordReset=false;
let sessionExpiredOnBoot=false;
let saveTimer=0, retryTimer=0, flushPromise=null, retryCount=0;
let checking=false, checkingTimer=0, lastWakeCheck=0, awaySince=null;
let revisions=new Map(),pending=new Map(), fileSignatures=new Map(), refresher=null, incidenceVersions=new Map(), incidentsChecked=false;
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
 if(!supabase)throw Error('Supabase no está configurado. Revisa el archivo .env.');
 const request=async()=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw Error('Inicia sesión con Supabase Auth.');
  const headers={Accept:'application/json',apikey:SUPABASE_KEY,
   Authorization:'Bearer '+session.access_token,
   ...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})};
  return fetch(SUPABASE_URL.replace(/\/$/,'')+'/functions/v1/dashboard-api/'+endpoint,
   {...options,headers,cache:'no-store'});
 };
 if(user&&isRememberedSessionExpired(localStorage,user.id)){
  await expireSession();throw Error('Se cumplieron 7 días. Inicia sesión de nuevo.');
 }
 let res=await request();
 if(res.status===401&&user){try{await refreshSession();}catch(_){}res=await request();}
 let data;try{data=await res.json();}catch(_){throw Error(`Supabase devolvió datos no válidos (${res.status}).`);}
 if(!res.ok){const err=Error(data?.error||`Solicitud rechazada (${res.status})`);err.status=res.status;throw err;}
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
  if(!user||suspended||!pending.size||conflictBlocked)return;
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
    const {settings,revisions:remoteRevisions}=await api('settings');
    revisions=new Map(Object.entries(remoteRevisions||{}).map(([k,v])=>[k,Number(v)||0]));
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
  if(!user||!pending.size||conflictBlocked)return;
  if(flushPromise)return flushPromise;
  clearTimeout(saveTimer);saveTimer=0;
  clearTimeout(retryTimer);retryTimer=0;
  if(!navigator.onLine){pendingMessage();return;}
  flushPromise=(async()=>{
    sessionMessage('Guardando en la nube…','pending');
    try{
      while(pending.size){
        const entries=snapshotBatch();
        const expectedRevisions=Object.fromEntries(entries.map(({key})=>[key,revisions.get(key)||0]));
        const result=await api('settings',{method:'PUT',body:JSON.stringify({entries,expectedRevisions})});
        for(const {key,value} of entries){
          if(Number.isInteger(result.revisions?.[key]))revisions.set(key,result.revisions[key]);
          if(pending.get(key)===value)pending.delete(key);
        }
        persistPending();
      }
      retryCount=0;conflictBlocked=false;$('jmResolveConflict').hidden=true;sessionMessage(savedMessage());
    }catch(err){
      pendingMessage();toast('Cambios pendientes: '+escapeMsg(err));
      if(/conflicto|dispositivo|revisión|revision/i.test(escapeMsg(err))){conflictBlocked=true;$('jmResolveConflict').hidden=false;sessionMessage('Conflicto entre dispositivos · exporta respaldo antes de resolver','error');}
      if(navigator.onLine&&!/conflicto|dispositivo|revisión|revision/i.test(escapeMsg(err))&&retryCount<RETRY_DELAYS_MS.length){
        retryTimer=setTimeout(()=>{retryTimer=0;void flush();},RETRY_DELAYS_MS[retryCount++]);
      }
    }
  })();
  try{await flushPromise;}finally{
    flushPromise=null;
    // Si se editó una clave mientras se guardaba el lote, procesar el valor nuevo.
    if(pending.size&&!conflictBlocked&&!retryTimer&&retryCount===0)scheduleSave();
  }
}
function filesSignature(){return JSON.stringify([...fileSignatures].sort(([a],[b])=>a.localeCompare(b)));}
async function fileApi(path){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  try {return await api(path,{signal:controller.signal});}
  catch(error){
    if(controller.signal.aborted)throw Error('La descarga del XLS agotó 20 segundos. Comprueba dashboard-api en Supabase.');
    throw error;
  } finally {clearTimeout(timer);}
}
async function listFiles(){
  if(!user)return [];
  let reports;
  try {
    // V3.0.4.3: manifiesto ligero + ficha + bloques de filas con validación de integridad.
    // Esta ruta evita que un XLS de varias MB bloquee todo el historial.
    reports=await loadChunkedHistory(
      async()=>{
        const result=await fileApi('files?meta=1');
        if(result?.protocol!==2)throw Error('dashboard-api sigue en la versión anterior, sin lectura XLS por bloques.');
        return result.reports;
      },
      async id=>(await fileApi('files?part=info&id='+encodeURIComponent(id))).report,
      (id,offset,limit)=>fileApi('files?part=rows&id='+encodeURIComponent(id)+'&offset='+offset+'&limit='+limit),
      {onProgress:(count,total)=>{
        const node=$('archiveLoadStatus');if(node)node.textContent=`Recuperando historial: ${count} de ${total} XLS completos…`;
      }}
    );
  } catch(chunkError) {
    console.warn('Recuperación XLS por fragmentos:',chunkError);
    // El endpoint clásico se mantiene como alternativa hasta que Supabase
    // publique la nueva Edge Function. Tampoco acepta historias parciales.
    try {
      reports=await loadCompleteHistory(
        (offset,limit)=>fileApi('files?offset='+offset+'&limit='+limit),
        {onProgress:count=>{const node=$('archiveLoadStatus');if(node)node.textContent=`Recuperando historial anterior: ${count} XLS…`;}}
      );
    } catch(legacyError) {
      throw Error('No se pudo recuperar el historial XLS. Lectura por bloques: '+
        (chunkError?.message||String(chunkError))+'; lectura anterior: '+(legacyError?.message||String(legacyError))+'.');
    }
  }
  fileSignatures=new Map(reports.map(r=>[r.id,r.fingerprint]));
  return reports;
}
/**
 * Lista ligera y completa de firmas XLS, sin descargar filas de clientes.
 * GET /files?meta=1 existe en dashboard-api y consulta por owner_id.
 * No es equivalente a tener cargado el historial para los cálculos.
 */
async function listFileMetadata(){
  if(!user)throw Error('Inicia sesión para verificar el historial de XLS.');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  try{
    const payload=await api('files?meta=1',{signal:controller.signal});
    if(!payload||!Array.isArray(payload.reports))throw Error('La lista de firmas XLS no tiene el formato esperado.');
    for(const item of payload.reports){
      if(!item||typeof item.id!=='string'||typeof item.fingerprint!=='string')
        throw Error('La respuesta de firmas XLS contiene datos incompletos.');
    }
    return payload.reports;
  }catch(error){
    if(controller.signal.aborted)throw Error('La consulta de firmas XLS agotó el tiempo de espera.');
    throw error;
  }finally{clearTimeout(timer);}
}
async function putFile(report){
  if(!user)throw Error('Inicia sesión para guardar el XLS en la nube.');
  const result=await api('files',{method:'POST',body:JSON.stringify(report)});
  fileSignatures.set(report.id,report.fingerprint);
  toast('XLS guardado en Supabase Database.');
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
async function listIncidents(){if(!user)return [];const data=await api('incidents');const rows=Array.isArray(data.incidents)?data.incidents:[];incidenceVersions=new Map(rows.map(r=>[r.folio_key,Date.parse(r.updated_at||'')||0]));incidentsChecked=true;return rows;}
async function listTrash(){if(!user)return [];const data=await api('incidents?deleted=1');return data.incidents||[];}
async function restoreIncident(folio){if(!user)throw Error('Inicia sesión.');return api('incidents',{method:'POST',body:JSON.stringify({folio,action:'restore'})});}
async function listAudit(){if(!user)return [];const data=await api('audit');return data.events||[];}
async function listUpdates(deleted=false){if(!user)return [];const data=await api('updates'+(deleted?'?deleted=1':''));return data.requests||[];}
async function createUpdate(data){if(!user)throw Error('Inicia sesión para solicitar una actualización.');return (await api('updates',{method:'POST',body:JSON.stringify(data)})).request;}
async function changeUpdate(data){if(!user)throw Error('Inicia sesión.');return (await api('updates',{method:'PUT',body:JSON.stringify(data)})).request;}
async function trashUpdate(id,revision){if(!user)throw Error('Inicia sesión.');return (await api('updates',{method:'DELETE',body:JSON.stringify({id,revision})})).request;}
async function restoreUpdate(id,revision){if(!user)throw Error('Inicia sesión.');return (await api('updates',{method:'POST',body:JSON.stringify({action:'restore',id,revision})})).request;}
async function deleteIncident(folio){if(!user)throw Error('Inicia sesión para eliminar incidencias.');return api('incidents',{method:'DELETE',body:JSON.stringify({folio})});}
async function putIncident(payload){if(!user)throw Error('Inicia sesión para guardar incidencias.');const data=await api('incidents',{method:'PUT',body:JSON.stringify(payload)});if(data.incident?.folio_key){incidenceVersions.set(data.incident.folio_key,Date.parse(data.incident.updated_at||'')||0);incidentsChecked=true;}return data.incident;}
async function expireSession(){
  // Los cambios pendientes ya están en la cola local por cuenta; no se borran.
  // Al volver a iniciar sesión, podrán sincronizarse con el mismo usuario.
  clearRememberedSession(localStorage);
  try{await logout();}catch(_){ /* Supabase cierra la sesión incluso si falla el endpoint. */ }
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
  $('jmResolveConflict').addEventListener('click',()=>{
    if(!conflictBlocked)return;
    if(!confirm('Se detectaron ajustes más recientes en otro dispositivo. PRIMERO exporta un respaldo JSON de tus ajustes si quieres conservarlos. ¿Descartar únicamente tus cambios locales pendientes y recargar desde Supabase?'))return;
    pending.clear();persistPending();conflictBlocked=false;location.reload();
  });
  $('cloudSyncButton').addEventListener('click',async()=>{
    if(!navigator.onLine){toast('No hay conexión. Los cambios pendientes se conservan localmente.');return;}
    await flush();
    if(pending.size){toast(conflictBlocked?'Hay conflicto. Exporta respaldo JSON y usa Resolver conflicto.':'Primero deben guardarse los ajustes pendientes.');return;}
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
  provider:'supabase',api,
  get user(){return user;},
  resetAll:async()=>{if(!user)throw Error("Inicia sesión.");await flush();if(pending.size)throw Error("Sincroniza los cambios pendientes primero.");await api("reset",{method:"POST",body:JSON.stringify({confirmation:"RESTABLECER TODO"})});clearDashboardCache();},
  openLogin,logout:signOut,listFiles,listFileMetadata,putFile,deleteFile,clearFiles,listIncidents,putIncident,deleteIncident,
  registerRefresh:fn=>{refresher=fn;},flush,listTrash,restoreIncident,listAudit,
  listUpdates,createUpdate,changeUpdate,trashUpdate,restoreUpdate,
  get pendingCount(){return pending.size;}
};
setupModal();
try{
  const callback=await handleAuthCallback();
  if(callback?.type==='invite'&&callback.token)inviteToken=callback.token;
  if(callback?.type==='recovery')passwordReset=true;
  // Si el JWT de una hora caducó durante la noche, intenta renovarlo con
  // la sesión válida de Supabase Auth antes de declarar al usuario invitado.
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
    // Conservar solamente la FECHA local si Supabase Auth no responde o cerró
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
    const incidenceMeta=remote.incidentsMeta||{};
    const latestLocal=Math.max(0,...incidenceVersions.values());
    const remoteLatest=Date.parse(incidenceMeta.last_updated||'')||0;
    const changedIncidents=incidentsChecked&&(Number(incidenceMeta.count||0)!==incidenceVersions.size||remoteLatest!==latestLocal);
    if(diverged||remoteFiles!==filesSignature()||changedIncidents){
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
