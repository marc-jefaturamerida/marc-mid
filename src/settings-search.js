/** Búsqueda compacta V4.1.1: opera el menú de Ajustes, nunca cambia valores ni oculta formularios. */
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function searchSettings(query,root=document){
 const nav=root.getElementById?.('settingsSectionsNav')||root.querySelector?.('#settingsSectionsNav');
 if(!nav)return 0;
 const term=normalize(query);let matches=0;
 for(const section of nav.querySelectorAll('.settings-menu-category')){
  let found=0;
  for(const button of section.querySelectorAll('[data-settings-group]')){
   const target=root.getElementById?.(button.dataset.settingsGroup)||root.querySelector?.('#'+button.dataset.settingsGroup);
   const title=button.textContent||'';
   const sectionTitle=(target?.querySelector('summary')?.textContent||'')+' '+(section.querySelector('summary')?.textContent||'');
   const yes=!term||normalize(title+' '+sectionTitle+' '+(target?.textContent||'')).includes(term);
   button.hidden=!yes;
   if(yes){found++;matches++;}
  }
  section.hidden=found===0;
  if(term&&found)section.open=true;
 }
 return matches;
}
export function initSettingsSearch(){
 const input=document.getElementById('settingsQuickSearch'),status=document.getElementById('settingsSearchCount');if(!input)return;
 const update=()=>{const count=searchSettings(input.value,document);status.textContent=input.value.trim()?count+' apartado(s) encontrados':'Busca por nombre o función en el menú de ajustes.';};
 input.addEventListener('input',update);
 document.addEventListener('settings-navigation-ready',update);
 update();
}
