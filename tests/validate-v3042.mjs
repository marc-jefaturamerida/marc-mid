import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('src/legacy-app.js'),html=read('index.html'),src=read('src/start-app.js'),boot=read('src/supabase-boot.js');
// Regresión: la navegación usa registryActiveAt dentro de legacy-app.
// Node --check no detecta identificadores globales sin importar; esta aserción lo comprueba.
assert.match(app,/import\s*\{[^}]*\bregistryActiveAt\b[^}]*\}\s*from\s*['"]\.\/team-registry\.js['"]/s,'registryActiveAt debe importarse antes de evaluar los perfiles activos');
assert(app.includes("home:value?.layoutVersion===4&&DEFAULT_PAGE_ORDER.includes(value?.home)?value.home:'daily'"),'Comparativa diaria es el inicio y las opciones antiguas se migran');
assert(app.includes("el('goalAuditFill').addEventListener"),'Captura masiva disponible');
assert(app.includes("querySelectorAll('input[data-audit-metric]:not([readonly])')"),'No sobrescribe objetivos previamente guardados');
for(const id of ['goalAuditBulkRecords','goalAuditBulkSales','goalAuditFill'])assert(html.includes('id="'+id+'"'),id);
assert(app.includes("document.querySelector('.app-navigation').addEventListener('click'"),'Navegación por delegación');
assert(src.includes("import('./supabase-boot.js')")&&src.includes("import('./cloud-boot.js')"),'Modos duales');
assert(boot.includes("Authorization:'Bearer '+session.access_token"));
assert(boot.includes('getSession()'),'Sesión de Supabase Auth');
assert(read('src/visits.js').includes("window.APP_CLOUD?.provider==='supabase'"),'Visitas consumen Edge API');
for(const endpoint of ['files','settings','sync','incidents','visits','updates','audit','reset','health'])assert(existsSync(new URL('../supabase/functions/dashboard-api/handlers/'+endpoint+'.js',import.meta.url)));
const edge=read('supabase/functions/dashboard-api/index.ts'),shared=read('supabase/functions/dashboard-api/_shared.js');
assert(edge.includes('DASHBOARD_ALLOWED_ORIGINS')&&edge.includes("origin&&!allowed.includes(origin)"),'Origin restriction');
assert(shared.includes('auth.getUser(token)')&&shared.includes("DASHBOARD_DATABASE_URL"),'Supabase Auth JWT y credenciales SQL privadas');
const migration=read('supabase/migrations/20261120050000_dashboard_complete.sql');
for(const table of ['dashboard_reports','dashboard_settings','dashboard_visits','dashboard_incidents','dashboard_audit_events','dashboard_update_requests'])assert(migration.includes(table),table);
assert(migration.includes('ENABLE ROW LEVEL SECURITY')&&migration.includes('REVOKE ALL'));
console.log('V3.0.4.2: navegación, metas en lote, backend dual, SQL y autenticación protegida OK');


// Hotfix: selector XLS nativo independiente de sesión, lista temporal visible y errores trazables.
assert.match(html,/id="chooseXls"[^>]*for="xlsInput"/,'El botón debe activar el selector nativo');
assert.match(html,/class="file-picker-input" id="xlsInput"/,'File input visible para el navegador');
assert(!app.includes("el('chooseXls').addEventListener('click',()=>el('xlsInput').click())"),'No usar activación programática redundante');
assert(app.includes('const displayed=temporary?archive.tempReports:archive.reports;'),'Mostrar XLS temporales en lista');
assert(app.includes('const selected=[...event.target.files||[]];'),'Conservar selección durante cargas asíncronas');
