/** Only visual organization; no setting keys, sources, or values are modified. */
const GROUPS={
 'Personal y módulos':['settingsTeamRegistryV261','settingsBaseGoalsV258','settingsSupervisors','settingsSupervisor'],
 'Metas y comisiones':['settingsRates','settingsActions','settingsQuality','settingsCommissions','settingsLeadershipGoalsV257'],
 'Reportes y análisis':['settingsLeadershipV256','settingsArchive','settingsExport','settingsFolios','settingsHistory','settingsWeeklyAdminV252'],
 'Apariencia y navegación':['settingsPageOrder','settingsLayout','settingsReports'],
 'Recordatorios y sistema':['settingsTransferV261','settingsAuditV27','settingsReminders']
};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
let previouslyOpen=new Map();
export function settingsCategoryFor(section){
 const id=section.id,heading=(section.querySelector('summary')?.textContent||'').toLowerCase();
 for(const [group,ids] of Object.entries(GROUPS))if(ids.some(part=>id===part||id.startsWith(part)))return group;
 if(/modulo|ejecutivo|supervisor|personal/.test(heading))return 'Personal y módulos';
 if(/comision|tarifa|objetivo|metas|calculo/.test(heading))return 'Metas y comisiones';
 if(/recordatorio|seguridad|respaldo|sincroniz/.test(heading))return 'Recordatorios y sistema';
 if(/apariencia|paginas|seccion|orden|textos/.test(heading))return 'Apariencia y navegación';
 return 'Reportes y análisis';
}
export function searchSettings(query,root=document,category='all'){
 const term=normalize(query),panel=root.getElementById?.('settingsPanel')||root.querySelector('#settingsPanel');
 const finding=!!term||category!=='all';let found=0;
 panel?.classList.toggle('jm-settings-filtering',finding);
 if(!finding){for(const section of root.querySelectorAll('.settings-group')){section.hidden=false;if(previouslyOpen.has(section))section.open=previouslyOpen.get(section);}previouslyOpen.clear();return root.querySelectorAll('.settings-group').length;}
 for(const section of root.querySelectorAll('.settings-group')){
  if(!previouslyOpen.has(section))previouslyOpen.set(section,section.open);
  const summary=section.querySelector('summary')?.textContent||'';
  const yes=(!term||normalize(summary+' '+section.textContent).includes(term)) &&(category==='all'||settingsCategoryFor(section)===category);
  section.hidden=!yes;if(yes){found++;section.open=!!term;}else section.open=false;
 }
 return found;
}
export function initSettingsSearch(){
 const input=document.getElementById('settingsQuickSearch'),category=document.getElementById('settingsCategorySelect'),status=document.getElementById('settingsSearchCount');
 if(!input)return;
 const update=()=>{const count=searchSettings(input.value,document,category?.value||'all');if(status)status.textContent=count+' secciones encontradas';};
 input.addEventListener('input',update);category?.addEventListener('change',update);
}
