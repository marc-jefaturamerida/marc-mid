import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cleanTeamRegistry,registryUpdate,registryRowEligible,registryEntry,registryNames} from '../src/team-registry.js';
import {cleanReminders,reminderOccurrence} from '../src/reminders.js';
import {exportSettings,validateSettingsImport,TRANSFER_KEYS} from '../src/settings-transfer.js';

let catalog=cleanTeamRegistry(null);
catalog=registryUpdate(catalog,'modules',{name:'Aviación',weeklyGoal:25,active:true},'','2026-11-09');
catalog=registryUpdate(catalog,'executives',{name:'Armando',weeklyGoal:10,active:true,module:'Aviación'},'','2026-11-09');
assert.equal(registryEntry(catalog,'modules','AVIACION').weeklyGoal,25);
catalog=registryUpdate(catalog,'executives',{name:'Armando',weeklyGoal:12,active:false,module:'Aviación'},'Armando','2026-11-16');
assert.equal(registryRowEligible(catalog,{module:'Aviación',executive:'Armando',fecha:'2026-11-15'}),true,'No borra históricos anteriores');
assert.equal(registryRowEligible(catalog,{module:'Aviación',executive:'Armando',fecha:'2026-11-16'}),false,'Excluye nuevos registros');
assert(!registryNames(catalog,'executives',{activeOnly:true,detected:['Armando']}).includes('Armando'));
assert.throws(()=>registryUpdate(catalog,'modules',{name:'Aviación',weeklyGoal:-1},'Aviación','2026-11-16'),/meta/i);
const now=new Date(2026,10,16,10,0);
const reminders=cleanReminders([{id:'r1',title:'XLS',body:'Actualizar archivos',when:'2026-11-16T09:00',repeat:'weekly',enabled:true,snooze:15}]);
assert.equal(reminderOccurrence(reminders[0],now),'2026-11-16T09:00');
assert.equal(reminderOccurrence(reminders[0],new Date(2026,10,17,10,0)),'');
assert.equal(reminderOccurrence({...reminders[0],repeat:'daily'},new Date(2026,10,17,10,0)),'2026-11-17T09:00');
const store=new Map([['wmSamsNavOrderV250','{"home":"leadership"}'],['irrelevantToken','my-password']]);
const backup=exportSettings({getItem:k=>store.get(k)??null});
assert.equal(backup.entries.irrelevantToken,undefined);
assert.equal(validateSettingsImport(backup).length,1);
assert.throws(()=>validateSettingsImport({format:'INVEX_SETTINGS',entries:{password:'"pass"'}}),/inválid/);
for(const name of ['wmSamsTeamRegistryV261','wmSamsRemindersV261']){
 assert(TRANSFER_KEYS.includes(name));
 assert(fs.readFileSync('src/cloud-boot.js','utf8').includes(name));
 assert(fs.readFileSync('netlify/functions/settings.js','utf8').includes(name));
}
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('src/legacy-app.js','utf8');
for(const id of ['remindersPage','remForm','remPopup','registryRows','registrySave','navAddSection','settingsImportBtn','settingsExportBtn','incDetailOverlay','incDetailDelete','leaderTargetsCards'])assert(html.includes(`id="${id}"`),id);
for(const source of ['function calculate(', 'function supervisorCalculator(', 'function correctedGlobalQuality('])assert(app.includes(source),source);
assert(/leader-target-cards\{[^}]*215px/.test(html),'El dashboard usa tarjetas de ancho compacto');
assert(app.includes('class=\"target-values\"') && app.includes('class=\"target-origin\"'),'Se conserva objetivo, logrado, avance y origen expandible');
assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).version,'4.1.0');
console.log('V2.6.1: historial preservado, inactivos, objetivos, recordatorios, respaldo, navegación y fichas: OK');
