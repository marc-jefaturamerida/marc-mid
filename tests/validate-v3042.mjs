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
console.log('V3.0.4.3: navegación, metas en lote, backend dual, SQL y autenticación protegida OK');


// Hotfix: selector XLS nativo independiente de sesión, lista temporal visible y errores trazables.
assert.match(html,/id="chooseXls"[^>]*for="xlsInput"/,'El botón debe activar el selector nativo');
assert.match(html,/class="file-picker-input" id="xlsInput"/,'File input visible para el navegador');
assert(!app.includes("el('chooseXls').addEventListener('click',()=>el('xlsInput').click())"),'No usar activación programática redundante');
assert(app.includes('const displayed=temporary?archive.tempReports:(pendingRemote?archive.metadata:archive.reports);'),'Mostrar XLS temporales y metadatos pendientes');
assert(app.includes('const selected=[...event.target.files||[]];'),'Conservar selección durante cargas asíncronas');


// V3.0.4.4: el servidor, y no un GET del historial, verifica duplicados
// atomicamente mediante UNIQUE(owner_id,fingerprint). No se muestran cálculos
// si hay un XLS antiguo que no pudo recuperarse completamente.
{
 const {runInNewContext}=await import('node:vm');
 const source=app.slice(app.indexOf('function xlsUploadFeedback('),app.indexOf('/** Verifica el historial entero antes de admitir XLS nuevos',app.indexOf('function xlsUploadFeedback(')));
 function context({ready=false,duplicates=[],postError=null}={}){
  const events=[],statuses=[];
  const archive={ready,reports:[],metadata:duplicates,tempReports:[],temporaryMode:false,selection:{mode:'all',ids:[]}};
  const nodes={xlsInput:{value:'selected'},xlsUploadFeedback:{hidden:true,textContent:'',dataset:{}}};
  const ctx={archive,el:id=>nodes[id]||null,number:new Intl.NumberFormat('es-MX'),XLS_LIMIT:30*1024*1024,
   isAuthorized:()=>true,bytesFingerprint:()=> 'test-fingerprint',
   parseExcelFile:async()=>{events.push('parse');return {headers:['Módulo'],rows:[{raw:['Prueba']}],missingOptional:[]};},
   confirmImportPreview:async()=>{events.push('preview');return true;},
   ensureArchiveReady:async()=>{events.push('history');throw Error('No deberia consultar el historial');},
   chooseImportArchiveDate:async()=>{events.push('date');return '2026-11-20';},
   archivePut:async()=>{events.push('post');if(postError)throw postError;},
   loadFolioFlags:()=>{},renderArchiveList:()=>{},refreshArchiveData:()=>{},refreshIncidents:async()=>{},
   requestGoalAudit:()=>{},window:{VISITS:{refreshSources:()=>{}}},
   statusBox:x=>statuses.push(x),esc:String,imported:{data:null},
   console:{error:()=>{},warn:()=>{},log:()=>{}},Math,Date,Error,Number,String,Set,Array,Promise
  };
  runInNewContext(source+'\nthis.runImport=importXlsFiles;',ctx);
  return {ctx,archive,nodes,events,statuses};
 }
 const file={name:'prueba.xls',size:100,arrayBuffer:async()=>Uint8Array.of(1).buffer};
 const normal=context();await normal.ctx.runImport([file]);
 assert.deepEqual(normal.events,['parse','preview','date','post'],'El XLS debe guardarse sin depender de una consulta de historial fallida');
 assert.equal(normal.archive.reports.length,0,'Si el historial anterior es incompleto, no participa en calculos');
 assert.equal(normal.archive.metadata.length,1,'El nuevo XLS se agrega a la lista de pendientes');
 assert.equal(normal.nodes.xlsUploadFeedback.dataset.kind,'success','Se informa guardado confirmado');
 const conflict=Error('Archivo duplicado');conflict.status=409;conflict.storedId='xls_servidor';conflict.storedName='guardado.xls';
 const existed=context({postError:conflict});await existed.ctx.runImport([file]);
 assert(existed.events.includes('post'),'Duplicados remotos verificados por DB, sin depender de GET de catalogo');
 assert.equal(existed.archive.reports.length,0,'No se crea archivo duplicado en memoria');
 assert.equal(existed.archive.metadata[0].id,'xls_servidor','El conflicto identifica el XLS que ya existe');
 assert.match(existed.nodes.xlsUploadFeedback.textContent,/YA ESTABAN guardados|YA ESTÁ GUARDADO/);
 const already=context({duplicates:[{id:'xls_antes',fingerprint:'test-fingerprint'}],postError:conflict});
 await already.ctx.runImport([file]);
 assert(already.events.includes('post'),'Un catalogo no confirmado nunca sustituye la verificacion atomica del servidor');
 assert.equal(already.archive.reports.length,0,'El servidor impide duplicados y no se alteran calculos');
 const broken=context({postError:Object.assign(Error('Database failure'),{status:500})});
 await broken.ctx.runImport([file]);
 assert.equal(broken.archive.metadata.length,0,'Fallo POST nunca es marcado como guardado');
 assert.match(broken.nodes.xlsUploadFeedback.textContent,/Database failure/,'El error de base de datos se muestra');
 assert(!broken.events.includes('history'),'La carga no espera la descarga completa');
}
assert(html.includes('id="xlsUploadFeedback"'));
assert(boot.includes('loadChunkedHistory('));
console.log('V3.0.4.4: archivo nuevo, duplicado remoto, catalogo parcial y error POST con pruebas de estado OK');
