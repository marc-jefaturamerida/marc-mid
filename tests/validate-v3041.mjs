import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadCompleteHistory} from '../src/history-loading.js';

const report=id=>({id,headers:['Módulo','Ejecutivo','Código','Fecha','Folio','Programa Cero','Salud Dental','Garantizada','Estatus'],rows:[[id,'A','C','20/11/2026','F','N','N','N','A']]});
const reports=Array.from({length:13},(_,i)=>report('xls_'+i));
const calls=[];
const recovered=await loadCompleteHistory(async(offset,limit)=>{
  calls.push({offset,limit});
  if(offset===8&&limit>2)throw Error('Lote demasiado grande');
  const slice=reports.slice(offset,offset+limit);
  return {reports:slice,hasMore:offset+slice.length<reports.length,nextOffset:offset+slice.length};
},{pause:async()=>{}});
assert.deepEqual(recovered.map(r=>r.id),reports.map(r=>r.id),'Recupera TODAS las páginas sin perder archivos tras un fallo');
assert(calls.some(c=>c.offset===8&&c.limit===2),'Reduce el tamaño de lote 8 → 4 → 2');

let attempts=0;
await assert.rejects(loadCompleteHistory(async()=>{attempts++;throw Error('Red interrumpida');},{pageSize:1,pause:async()=>{}}),/Falló la descarga/);
assert.equal(attempts,2,'Reintenta una vez tras error de red en página individual');
await assert.rejects(loadCompleteHistory(async()=>({reports:[],hasMore:true,nextOffset:0})),/paginación incompleta/);
await assert.rejects(loadCompleteHistory(async()=>({reports:[{id:'xls_bad'}],hasMore:false})),/Reporte incompleto/);
await assert.rejects(loadCompleteHistory(async()=>{const error=Error('Sesión expirada');error.status=401;throw error;}),/Sesión expirada/);

const code=readFileSync(new URL('../src/legacy-app.js',import.meta.url),'utf8');
const boot=readFileSync(new URL('../src/cloud-boot.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert(code.includes('if(!await ensureArchiveReady())'),'El importador espera a que la descarga de historial termine');
assert(code.includes('if(archiveLoading)return archiveLoading;'),'Una sola descarga para inicio e importación');
assert(code.includes('archive.ready=true; // SOLO después de recuperar todas las páginas.'),'Disponibilidad marcada al terminar la descarga');
assert(code.indexOf('await ensureArchiveReady();',code.indexOf('async function initArchive()'))<code.indexOf('await refreshIncidents(true)',code.indexOf('async function initArchive()')),'Incidencias no bloquean la carga inicial de XLS');
assert(html.includes('id="archiveRetry"')&&html.includes('id="archiveLoadStatus"'),'Reintento visible y estado de descarga');
assert(boot.includes('loadCompleteHistory('),'Descarga paginada robusta');
assert.equal(JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version,'3.0.4.3');
console.log('V3.0.4.3: recuperación por páginas, errores, reintento, carrera al importar y aislamiento de incidencias OK');
