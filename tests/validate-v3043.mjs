import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadChunkedHistory} from '../src/history-loading.js';

const app=readFileSync(new URL('../src/legacy-app.js',import.meta.url),'utf8');
const cloud=readFileSync(new URL('../src/supabase-boot.js',import.meta.url),'utf8');
const handler=readFileSync(new URL('../supabase/functions/dashboard-api/handlers/files.js',import.meta.url),'utf8');
const meta=[{id:'xls_saved_a',fingerprint:'abc123',name:'2026-11-18',rowCount:5}];
const rawRows=[['uno', '1'],['dos','2'],['tres','3'],['cuatro','4'],['cinco','5']];
const operations=[];
const result=await loadChunkedHistory(
  async()=>meta,
  async id=>({id,fingerprint:'abc123',name:'2026-11-18',size:100,headers:['Columna','Valor'],rowCount:5,addedAt:123}),
  async (id,offset,limit)=>{
    operations.push([offset,limit]);
    if(limit>2)throw Error('Simulación: lote demasiado grande');
    const rows=rawRows.slice(offset,offset+limit);
    return {id,rows,totalRows:5,nextOffset:offset+rows.length,hasMore:offset+rows.length<5};
  },
  {pageSize:8,pause:async()=>{}}
);
assert.equal(result.length,1);
assert.deepEqual(result[0].rows,rawRows,'Reconstituye todas las filas en orden, sin duplicar registros');
assert(operations.some(([,limit])=>limit>2) && operations.some(([,limit])=>limit<=2), 'Reduce tamaño ante respuesta demasiado grande');
const empty=await loadChunkedHistory(async()=>[],async()=>{throw Error('No debe solicitar ficha');},async()=>{throw Error('No debe descargar filas');});
assert.deepEqual(empty,[],'Una cuenta vacía se confirma sin descargar archivos');
await assert.rejects(loadChunkedHistory(async()=>[...meta,...meta],async()=>null,async()=>null),/repetidos/);
await assert.rejects(loadChunkedHistory(async()=>meta,async id=>({id,fingerprint:'DISTINTA',headers:[],rowCount:5}),async()=>null),/no coincide/);
await assert.rejects(loadChunkedHistory(async()=>meta,async id=>({id,fingerprint:'abc123',headers:[],rowCount:5}),async (id,offset)=>({id,rows:[['x']],totalRows:5,nextOffset:offset+2}),{pageSize:1}),/inconsistente/);
assert(cloud.includes('loadChunkedHistory(')&&cloud.includes("files?part=rows&id=")&&cloud.includes("files?part=info&id="));
assert(handler.includes("part==='info'||part==='rows'")&&handler.includes('jsonb_array_elements(r.rows)')&&handler.includes("protocol:2"));
assert(handler.includes('UNIQUE')===false,'No cambia el esquema; la restricción única pertenece a la migración SQL');
const sql=readFileSync(new URL('../supabase/migrations/20261120050000_dashboard_complete.sql',import.meta.url),'utf8');
assert(sql.includes('UNIQUE (owner_id, fingerprint)'), 'El servidor ya bloquea firmas duplicadas por usuario');
assert(app.includes('pendingRemote?archive.metadata:archive.reports'),'Catálogo visible aun si faltan filas del XLS');
assert(app.includes('if(persistent&&!archive.ready){'),'Evita cálculo con historial parcialmente cargado');
assert(app.includes('markStoredDuplicate(file.name,fingerprint)'),'Un XLS que ya existía se reporta como guardado, no como carga nueva');
assert(app.includes('XLS que YA ESTABAN guardados'),'La leyenda aclara la diferencia entre guardado nuevo y existente');
console.log('V3.0.4.3: fragmentos, recuperación íntegra, catálogos, deduplicación y protección de cálculos OK');
