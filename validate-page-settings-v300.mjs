import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PAGE_SETTING_GROUPS,createPageSettingsModal} from '../src/page-settings-modal.js';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const legacy=readFileSync(new URL('../src/legacy-app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/assets/jm-page-settings-v300.css',import.meta.url),'utf8');
const pages=['individual','team','daily','accumulated','weekly','visits','allrecords','achievements','supervisor','incidents','updates','reminders','history','moduleHistory','leadership'];
for(const page of pages)assert.ok(Object.hasOwn(PAGE_SETTING_GROUPS,page),'Falta definición para '+page);
for(const [page,groups] of Object.entries(PAGE_SETTING_GROUPS)){
  assert.ok(Array.isArray(groups),'Debe ser una lista: '+page);
  for(const id of groups)assert.ok(html.includes(`id="${id}"`),'Editor inexistente '+page+': '+id);
}
assert.ok(PAGE_SETTING_GROUPS.leadership.includes('settingsLeadershipV256'));
assert.ok(PAGE_SETTING_GROUPS.achievements.includes('settingsWeeklyAdminV252'));
assert.ok(PAGE_SETTING_GROUPS.supervisor.includes('settingsSupervisorCommissionV24'));
for(const id of ['jmPageSettingsOverlay','jmPageSettingsBody','jmPageSettingsSave','jmPageSettingsCancel','jmPageSettingsClose']){
 assert.ok(html.includes(`id="${id}"`),'Falta control modal '+id);
}
assert.ok(css.includes('max-height:min(95dvh,950px)'));
assert.ok(legacy.includes("hide();pageSettingsController?.open(activePage);"),'El botón Configuración debe abrir ajustes contextuales');
assert.ok(!legacy.includes("updates:'settingsPageOrder'"),'Actualizaciones no debe llevar a navegación general');
assert.ok(legacy.includes('pageSettingsController=createPageSettingsModal('));
assert.ok(legacy.includes('pageSettingsController?.close();\n  activePage='),'Debe regresar y conservar navegación al cambiar página');
for(const id of ['histOpenSettings','mhOpenSettings','leadershipSettingsOpen'])assert.ok(legacy.includes(`el('${id}').addEventListener('click',()=>pageSettingsController?.open(`),id+' debe abrir la ventana contextual');
assert.equal(typeof createPageSettingsModal,'function');
console.log('V3.0 ajustes por página: 15 destinos, editores reales, guardado, navegación y modal móvil OK.');
