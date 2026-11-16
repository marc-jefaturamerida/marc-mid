/** Respaldos de CONFIGURACIÓN V2.6.1: no incluye XLS, incidencias ni credenciales. */
export const TRANSFER_KEYS=Object.freeze([
 'wmSamsComisionesV1','wmSamsComisionesTarifasV14','wmSamsComisionesMetasEquipoV1',
 'wmSamsComisionesRecuperacionesEquipoV1','wmSamsArchivoSeleccionV9','wmSamsFolioFlagsV9',
 'wmSamsMeridaBonusDinamicaV245','wmSamsComparativaSemanalObjetivosV13','wmSamsComisionesLayoutV5',
 'wmSamsMeridaReportTextsV17','wmSamsTablaVisualV18','wmSamsVisitConfigV20',
 'wmSamsMeridaQualityConfigV22','wmSamsMeridaSupervisorsV22','wmSamsMeridaAchievementGoalsV232',
 'wmSamsMeridaSupervisorCommissionV24','wmSamsNavOrderV250','wmSamsWeeklyAdminReportV252',
 'wmSamsHistoricalIndividualV253','wmSamsHistoricalModuleV254','wmSamsBaseGoalsV258',
 'wmSamsLeadershipV256','wmSamsRecordEditsV260','wmSamsTeamRegistryV261','wmSamsRemindersV261'
]);
const allowed=new Set(TRANSFER_KEYS);
export function exportSettings(store=localStorage){const entries={};for(const key of TRANSFER_KEYS){const value=store.getItem(key);if(value!==null&&value!=='')entries[key]=value;}return {format:'INVEX_SETTINGS',version:'2.7.0',exportedAt:new Date().toISOString(),entries};}
export function validateSettingsImport(data){
 if(data?.format!=='INVEX_SETTINGS'||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw Error('El archivo no es un respaldo válido de configuraciones INVEX.');
 const found=Object.entries(data.entries);if(found.length>TRANSFER_KEYS.length)throw Error('El archivo contiene más campos de los permitidos.');
 const output=[];
 for(const [key,value] of found){if(!allowed.has(key)||typeof value!=='string'||value.length>1000000)throw Error('El respaldo contiene claves o valores inválidos.');
  try{JSON.parse(value);}catch(_){throw Error('JSON inválido en '+key+'.');}
  output.push([key,value]);
 }
 if(!output.length)throw Error('El respaldo no contiene configuraciones.');
 return output;
}
export function initSettingsTransfer(){
 const $=id=>document.getElementById(id),status=$('settingsTransferStatus');if(!status)return;
 $('settingsExportBtn').addEventListener('click',()=>{
  const result=exportSettings(),blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Jefatura_Mid_Marc_configuraciones_v27_'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent=Object.keys(result.entries).length+' categorías exportadas. No incluye XLS, incidencias, contraseñas ni tokens.';
 });
 $('settingsImportBtn').addEventListener('click',()=>$('settingsImportFile').click());
 $('settingsImportFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{
   if(!window.APP_CLOUD?.user?.id)throw Error('Inicia sesión para importar y sincronizar una configuración sin perderla al recargar.');
   if(file.size>2200000)throw Error('El archivo supera los 2.2 MB.');
   const entries=validateSettingsImport(JSON.parse(await file.text()));
   if(!confirm('¿Reemplazar las '+entries.length+' categorías del respaldo? No se borrarán archivos XLS ni incidencias.'))return;
   for(const [key,value] of entries)localStorage.setItem(key,value);
   status.textContent='Aplicando '+entries.length+' categorías; sincronizando…';
   await window.APP_CLOUD.flush();
   if(window.APP_CLOUD.pendingCount)throw Error('Los datos están pendientes de sincronizar. Usa «Sincronizar» antes de recargar.');
   status.textContent='Configuración importada y sincronizada. Recargando la aplicación…';
   window.location.reload();
  }catch(error){status.textContent='No se completó la importación: '+(error.message||error);}
 });
}
