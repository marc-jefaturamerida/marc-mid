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


// Regresión autenticada: la vista previa NO debe esperar la descarga del historial.
// Simulación aislada del orquestador de XLS sin datos ni credenciales reales.
{
 const {runInNewContext}=await import('node:vm');
 const source=app.slice(app.indexOf('function xlsUploadFeedback('),app.indexOf('/** Verifica el historial entero antes de admitir XLS nuevos',app.indexOf('function xlsUploadFeedback(')));
 const events=[];
 let historyReady;
 const nodes={xlsInput:{value:'selected'},xlsUploadFeedback:{hidden:true,textContent:'',dataset:{}}};
 const archive={ready:false,reports:[],metadata:[],tempReports:[],temporaryMode:false};
 const ctx={
  archive,el:id=>nodes[id]||null,number:new Intl.NumberFormat('es-MX'),XLS_LIMIT:30*1024*1024,
  isAuthorized:()=>true,bytesFingerprint:()=> 'test-fingerprint',
  parseExcelFile:async()=>{events.push('parse');return {headers:['Módulo'],rows:[{raw:['Prueba']}],missingOptional:[]};},
  confirmImportPreview:async(_data,_name,_existing,pending)=>{events.push('preview'+(pending?'-pending':''));return true;},
  ensureArchiveReady:async()=>{events.push('history');await new Promise(resolve=>historyReady=resolve);archive.ready=true;return true;},
  chooseImportArchiveDate:async()=>{events.push('date');return '2026-11-20';},
  archivePut:async()=>{events.push('save');},
  loadFolioFlags:()=>{},renderArchiveList:()=>{},refreshArchiveData:()=>{},refreshIncidents:async()=>{},
  requestGoalAudit:()=>{},window:{VISITS:{refreshSources:()=>{}}},
  statusBox:()=>{},esc:String,imported:{data:null},
  console,Math,Date,Error,Number,String,Set,Array,Promise
 };
 runInNewContext(source+'\nthis.runImport=importXlsFiles;',ctx);
 const file={name:'prueba.xls',size:100,arrayBuffer:async()=>Uint8Array.of(1).buffer};
 const task=ctx.runImport([file]);
 await new Promise(resolve=>setImmediate(resolve));
 assert(events.includes('preview-pending'),'Debe abrir vista previa sin esperar historial de Supabase');
 assert(events.includes('history'),'Tras aprobar vista previa debe verificar historial');
 assert(!events.includes('save'),'No guarda sin verificar historial remoto completo');
 historyReady();await task;
 assert(events.includes('save'),'Guarda después de confirmar historial');
 assert(events.indexOf('preview-pending')<events.indexOf('history')&&events.indexOf('history')<events.indexOf('save'),'Secuencia: vista previa, historial, guardar');
 assert.equal(nodes.xlsUploadFeedback.dataset.kind,'success','El estado final es visible junto a Cargar XLS');
 assert.equal(archive.reports.length,1);
}
assert(html.includes('id="xlsUploadFeedback"'),'Aviso de carga debe ser visible en la barra principal');
assert(app.includes('if(!await ensureArchiveReady())'),'Sigue verificando el historial antes de guardar XLS autenticados');
assert(boot.includes('controller.abort(),20000'),'GET /files tiene tiempo máximo para evitar bloqueo indefinido');
console.log('V3.0.4.3 hotfix XLS con sesión: vista previa antes de historial, sin guardado inseguro: OK');

// Falla de GET /files: jamás hacer POST; el error debe quedar visible fuera de otra sección.
{
 const {runInNewContext}=await import('node:vm');
 const source=app.slice(app.indexOf('function xlsUploadFeedback('),app.indexOf('/** Verifica el historial entero antes de admitir XLS nuevos',app.indexOf('function xlsUploadFeedback(')));
 let writes=0,previewed=false;
 const archive={ready:false,reports:[],metadata:[],tempReports:[],temporaryMode:false};
 const nodes={xlsInput:{value:'selected'},xlsUploadFeedback:{hidden:true,textContent:'',dataset:{}}};
 const ctx={
  archive,el:id=>nodes[id]||null,number:new Intl.NumberFormat('es-MX'),XLS_LIMIT:30*1024*1024,
  isAuthorized:()=>true,bytesFingerprint:()=> 'test-fingerprint-2',
  parseExcelFile:async()=>({headers:['Módulo'],rows:[{raw:['Prueba']}],missingOptional:[]}),
  confirmImportPreview:async()=>{previewed=true;return true;},
  ensureArchiveReady:async()=>false,
  chooseImportArchiveDate:async()=>{throw Error('No debe solicitar fecha cuando el historial falla');},
  archivePut:async()=>{writes++;},
  loadFolioFlags:()=>{},renderArchiveList:()=>{},refreshArchiveData:()=>{},refreshIncidents:async()=>{},
  requestGoalAudit:()=>{},window:{VISITS:{refreshSources:()=>{}}},
  statusBox:()=>{},esc:String,imported:{data:null},
  console,Math,Date,Error,Number,String,Set,Array,Promise
 };
 runInNewContext(source+'\nthis.runImport=importXlsFiles;',ctx);
 await ctx.runImport([{name:'prueba.xls',size:100,arrayBuffer:async()=>Uint8Array.of(1).buffer}]);
 assert(previewed,'La vista previa no queda secuestrada por un GET /files fallido');
 assert.equal(writes,0,'No debe guardar archivos sin verificar historial');
 assert.equal(nodes.xlsUploadFeedback.dataset.kind,'error','Un error debe mostrarse junto al botón');
 assert.match(nodes.xlsUploadFeedback.textContent,/No se completó la carga/);
}
console.log('V3.0.4.3 hotfix XLS con sesión: error visible y cero escrituras si historial falla: OK');

// Recuperación segura cuando GET /files responde pero el cliente no puede validar
// su contenido: usar solamente firmas verificadas, nunca asumir historial vacío.
{
 const {runInNewContext}=await import('node:vm');
 const source=app.slice(app.indexOf('function xlsUploadFeedback('),app.indexOf('/** Verifica el historial entero antes de admitir XLS nuevos',app.indexOf('function xlsUploadFeedback(')));
 const makeContext=(meta,fail=false)=>{
  const events=[];
  const archive={ready:false,reports:[],metadata:[],tempReports:[],temporaryMode:false,lastError:'El formato de los reportes no es válido'};
  const nodes={xlsInput:{value:'selected'},xlsUploadFeedback:{hidden:true,textContent:'',dataset:{}},archiveLoadStatus:{textContent:''},archiveRetry:{hidden:false}};
  const ctx={
   archive,el:id=>nodes[id]||null,number:new Intl.NumberFormat('es-MX'),XLS_LIMIT:30*1024*1024,
   isAuthorized:()=>true,bytesFingerprint:()=> 'archivo-firma-123',
   parseExcelFile:async()=>({headers:['Módulo'],rows:[{raw:['Prueba']}],missingOptional:[]}),
   confirmImportPreview:async()=>true,ensureArchiveReady:async()=>false,
   chooseImportArchiveDate:async()=> '2026-11-20',
   archivePut:async()=>{events.push('post');},
   loadFolioFlags:()=>{},renderArchiveList:()=>{},refreshArchiveData:()=>{},refreshIncidents:async()=>{},
   requestGoalAudit:()=>{},window:{APP_CLOUD:{provider:'supabase',listFileMetadata:async()=>{
     events.push('meta');if(fail)throw Error('Error en la API metadata');return meta;
   }},VISITS:{refreshSources:()=>{}}},
   statusBox:()=>{},esc:String,imported:{data:null},console,
   Math,Date,Error,Number,String,Set,Array,Promise
  };
  runInNewContext(source+'\nthis.runImport=importXlsFiles;',ctx);
  return {ctx,archive,nodes,events};
 };
 const file={name:'prueba.xls',size:100,arrayBuffer:async()=>Uint8Array.of(1).buffer};
 const empty=makeContext([]);
 await empty.ctx.runImport([file]);
 assert.deepEqual(empty.events,['meta','post'],'Una cuenta sin historial verificado puede importar su primer XLS');
 assert.equal(empty.archive.ready,true,'El catálogo vacío confirmado permite inicializar el historial');
 assert.equal(empty.archive.reports.length,1);
 const duplicate=makeContext([{id:'xls_valid_1',fingerprint:'archivo-firma-123'}]);
 await duplicate.ctx.runImport([file]);
 assert.deepEqual(duplicate.events,['meta'],'Un duplicado remoto no hace POST');
 assert.match(duplicate.nodes.xlsUploadFeedback.textContent,/YA ESTÁ GUARDADO/,'El usuario sabe que el XLS existe en la nube');
 const existing=makeContext([{id:'xls_valid_1',fingerprint:'otro-archivo-firma'}]);
 await existing.ctx.runImport([file]);
 assert.deepEqual(existing.events,['meta','post'],'El catálogo verificado autoriza guardar XLS NUEVOS aunque otro esté pendiente de lectura');
 assert.equal(existing.archive.ready,false,'No presenta sumatorias parciales como completas');
 assert.equal(existing.archive.reports.length,0,'No incorpora filas aisladas a los cálculos');
 assert.equal(existing.archive.metadata.length,2,'Conserva ambos XLS en el catálogo de la cuenta');
 const failure=makeContext([],true);
 await failure.ctx.runImport([file]);
 assert.deepEqual(failure.events,['meta'],'Fallo de metadatos no autoriza escrituras');
 assert.match(failure.nodes.xlsUploadFeedback.textContent,/Error en la API metadata/);
 assert(boot.includes("api('files?meta=1'"),'El adaptador Supabase debe consultar los metadatos autenticados');
 assert(boot.includes('listFiles,listFileMetadata,putFile'),'La API expone listFileMetadata');
 console.log('Hotfix historial meta: cuenta vacía, duplicados, historial previo y fallo de conexión: OK');
}
