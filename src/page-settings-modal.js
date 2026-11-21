/** Jefatura Mid Marc V3.0 — ajustes contextuales por página.
 * Reutiliza los editores originales (mismos IDs, validaciones y guardado).
 * No clona formularios, no introduce una segunda fuente de configuración.
 */
export const PAGE_SETTING_GROUPS=Object.freeze({
  leadership:['settingsLeadershipV256','settingsBaseGoalsV258'],
  achievements:['settingsWeeklyAdminV252','settingsBaseGoalsV258'],
  supervisor:['settingsSupervisorCommissionV24','settingsSupervisorsV22','settingsQualityV22'],
  individual:['settingsRates','settingsQualityV22','settingsDynamicBonus','settingsFolios','settingsSections','settingsReportTexts','settingsExport'],
  team:['settingsRates','settingsQualityV22','settingsBaseGoalsV258','settingsReportTexts'],
  daily:['settingsBaseGoalsV258','settingsQualityV22','settingsReportTexts'],
  accumulated:['settingsBaseGoalsV258','settingsQualityV22','settingsReportTexts'],
  weekly:['settingsBaseGoalsV258','settingsQualityV22','settingsReportTexts'],
  allrecords:['settingsFolios','settingsReportTexts'],
  history:['settingsHistoryV253'],
  moduleHistory:['settingsModuleHistoryV254'],
  visits:['settingsVisits'],
  incidents:['settingsAuditV27','settingsReportTexts'],
  updates:[],
  reminders:[]
});
const PAGE_LABELS={
 leadership:'Dashboard de Jefatura',achievements:'Logros semanales',supervisor:'Calculadora de supervisor',
 individual:'Calculadora individual',team:'Comparativo de ejecutivos',daily:'Comparativa diaria',
 accumulated:'Acumulado general',weekly:'Comparativa semanal',allrecords:'Registros XLS',
 history:'Histórico individual',moduleHistory:'Histórico por módulo',visits:'Visitas de coordinación',
 incidents:'Incidencias',updates:'Actualizaciones',reminders:'Recordatorios'
};
// Los grupos con guardado explícito se confirman al pulsar «Guardar y volver».
const SAVE_BUTTON={
 settingsLeadershipV256:'lsSave',settingsWeeklyAdminV252:'weeklyAdminSave',
 settingsSupervisorCommissionV24:'supSaveSettings',settingsDynamicBonus:'saveDynamicBonus',
 settingsHistoryV253:'hsSave',settingsModuleHistoryV254:'msSave'
};
const ERROR_STATUS={
 settingsLeadershipV256:'lsStatus',settingsWeeklyAdminV252:'weeklyAdminSettingsStatus',
 settingsSupervisorCommissionV24:'supSettingsStatus',settingsDynamicBonus:'dynamicBonusStatus',
 settingsHistoryV253:'hsStatus',settingsModuleHistoryV254:'msStatus'
};
const NATIVE_SAVE_IDS=new Set(Object.values(SAVE_BUTTON));
function isError(id){
 const node=document.getElementById(ERROR_STATUS[id]);
 if(!node)return false;
 const txt=(node.textContent||'').toLowerCase();
 if(id==='settingsSupervisorCommissionV24')return node.style.color!==''&&node.style.color!=='inherit';
 if(id==='settingsDynamicBonus'&&document.getElementById('supSettingsStatus')?.style.color)return true;
 return /^(error|revisa|no se pudo|el campo|selecciona entre|monto inv[aá]lido|corrige)/.test(txt);
}
export function createPageSettingsModal({getActivePage}={}){
 const id=key=>document.getElementById(key);
 const overlay=id('jmPageSettingsOverlay'),body=id('jmPageSettingsBody'),title=id('jmPageSettingsTitle');
 const btnSave=id('jmPageSettingsSave'),btnCancel=id('jmPageSettingsCancel'),btnClose=id('jmPageSettingsClose');
 if(!overlay||!body||!btnSave)throw Error('Falta la ventana de ajustes contextuales.');
 const locations=[];let currentPage=null,opener=null,batchSaving=false,reportOriginalPage=null;
 const dirty=new Set();
 const active=()=>!overlay.hidden;
 const restore=()=>{
   const reportPage=id('reportTextPage');
   if(reportOriginalPage!==null&&reportPage){
     reportPage.value=reportOriginalPage;
     reportPage.dispatchEvent(new Event('change',{bubbles:true}));
     reportPage.closest('.field')?.removeAttribute('hidden');
     id('reportTextTitle')?.closest('.field')?.removeAttribute('hidden');
     id('resetAllReportTexts')?.removeAttribute('hidden');
     reportOriginalPage=null;
   }
   for(const {node,marker,open,hidden} of locations){node.open=open;node.hidden=hidden;marker.parentNode?.insertBefore(node,marker);marker.remove();}
   locations.length=0;
 };
 const close=()=>{
   if(!active())return;
   overlay.hidden=true;restore();body.replaceChildren();dirty.clear();currentPage=null;
   document.body.classList.remove('jm-page-settings-open');
   if(opener?.isConnected)opener.focus();opener=null;
 };
 const open=(requestedPage,focusGroup)=>{
   if(active())close();
   // Mantener la pantalla de origen; nunca cambiar a Ajustes generales.
   currentPage=requestedPage||getActivePage?.()||'leadership';
   const groups=PAGE_SETTING_GROUPS[currentPage]||[];
   opener=document.activeElement;
   title.textContent='Configuración · '+(PAGE_LABELS[currentPage]||currentPage);
   body.replaceChildren();dirty.clear();
   for(const groupId of groups){
     const node=id(groupId);if(!node)continue;
     const marker=document.createComment('ubicación original de '+groupId);
     node.before(marker);locations.push({node,marker,open:node.open,hidden:node.hidden});
     body.appendChild(node);
     node.hidden=false;
     node.open=groupId===(focusGroup||groups[0]);
   }
   if(!locations.length){
     const note=document.createElement('p');note.className='jm-context-empty';
     note.textContent='Esta página no tiene ajustes exclusivos adicionales. Sus filtros y acciones de gestión permanecen disponibles desde la propia página.';
     body.appendChild(note);
   }
   // La edición de textos de reportes utiliza su selector existente, pero por defecto
   // debe cargar la página desde la que se abrió la ventana.
   const reportPage=id('reportTextPage');
   if(body.contains(reportPage)&&[...reportPage.options].some(o=>o.value===currentPage)){
     reportOriginalPage=reportPage.value;
     reportPage.value=currentPage;reportPage.dispatchEvent(new Event('change',{bubbles:true}));
     // En esta ventana se editan textos exclusivamente de la página actual.
     reportPage.closest('.field')?.setAttribute('hidden','');
     id('reportTextTitle')?.closest('.field')?.setAttribute('hidden','');
     id('resetAllReportTexts')?.setAttribute('hidden','');
   }
   overlay.hidden=false;document.body.classList.add('jm-page-settings-open');
   btnSave.focus();
 };
 const saveAndClose=()=>{
   // Los editores sin botón propio guardan mediante sus controles existentes.
   // Confirmar todos los cambios ANTES de cerrar (nunca después del primero).
   batchSaving=true;
   try{
     for(const groupId of [...dirty]){
       const saveId=SAVE_BUTTON[groupId],save=saveId&&id(saveId);
       if(!save)continue;
       save.click();
       if(isError(groupId)){
         const problem=id(ERROR_STATUS[groupId]);problem?.scrollIntoView({block:'nearest'});
         problem?.setAttribute('role','alert');return;
       }
     }
   }finally{batchSaving=false;}
   close();
 };
 // No interferir con los eventos existentes de guardar, validar o sincronizar.
 body.addEventListener('input',event=>{
   const group=event.target.closest('details.settings-group');if(group)dirty.add(group.id);
 });
 body.addEventListener('change',event=>{
   const group=event.target.closest('details.settings-group');if(group)dirty.add(group.id);
 });
 body.addEventListener('click',event=>{
   const button=event.target.closest('button');if(!button||!NATIVE_SAVE_IDS.has(button.id))return;
   const group=button.closest('details.settings-group');
   // El botón original ejecuta su lógica antes de este listener delegado.
   if(group&&!isError(group.id)){
     dirty.delete(group.id);
     // Un guardado propio cierra la ventana, salvo en el guardado múltiple.
     if(!batchSaving)close();
   }
 });
 btnSave.addEventListener('click',saveAndClose);
 btnCancel.addEventListener('click',close);btnClose.addEventListener('click',close);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 document.addEventListener('keydown',e=>{
   if(!active()||e.key!=='Escape')return;
   if(!id('baseGoalOverlay')?.hidden)return;
   e.preventDefault();close();
 });
 // Guardar objetivos en el editor secundario debe devolver al usuario a su página.
 id('baseGoalSave')?.addEventListener('click',()=>{
   if(active()&&id('baseGoalOverlay')?.hidden&&id('baseGoalStatus')?.textContent?.startsWith('Objetivos guardados'))close();
 });
 return {open,close,isOpen:active,get page(){return currentPage;}};
}
