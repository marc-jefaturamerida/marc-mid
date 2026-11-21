import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {createSupabaseReportRepository,XLS_BUCKET,XLS_TABLE} from '../src/supabase-reports.js';
if(!globalThis.crypto) globalThis.crypto=webcrypto;

const USER='11111111-1111-4111-8111-111111111111';
function fakeSupabase(){
 const rows=[],objects=new Map();let failUpload=false;
 class Query {
  constructor(){this.filters=[];this.op='select';this.args=null;this.picks='*';this.slice=null;this.one=false;}
  select(columns){this.picks=columns;return this;}
  eq(key,value){this.filters.push([key,value]);return this;}
  order(){return this;}
  range(first,last){this.slice=[first,last];return this;}
  insert(data){this.op='insert';this.args=data;return this;}
  update(data){this.op='update';this.args=data;return this;}
  delete(){this.op='delete';return this;}
  maybeSingle(){this.one=true;return this;}
  single(){this.one=true;return this;}
  then(resolve,reject){return Promise.resolve().then(()=>this.exec()).then(resolve,reject);}
  exec(){
   let found=rows.filter(r=>this.filters.every(([k,v])=>r[k]===v));
   if(this.op==='insert'){
    const v=this.args;
    if(rows.some(r=>r.owner_id===v.owner_id&&(r.id===v.id||r.fingerprint===v.fingerprint)))return {data:null,error:{code:'23505',message:'duplicate'}};
    rows.push({...v});found=[{...v}];
   }else if(this.op==='update') {
    for(const r of found)Object.assign(r,this.args);
   }else if(this.op==='delete') {
    for(const r of found)rows.splice(rows.indexOf(r),1);
   }else {
    found=found.slice().sort((a,b)=>(a.added_at-b.added_at)||a.id.localeCompare(b.id));
    if(this.slice)found=found.slice(this.slice[0],this.slice[1]+1);
   }
   return {data:this.one?(found[0]||null):found,error:this.one&&this.op==='insert'&&!found.length?{message:'empty'}:null};
  }
 }
 const api={
  from(name){assert.equal(name,XLS_TABLE);return new Query();},
  storage:{from(name){assert.equal(name,XLS_BUCKET);return {
   async upload(path,blob){if(failUpload)return {error:{message:'Network unavailable'}};
    if(objects.has(path))return {error:{statusCode:'409',message:'Already Exists'}};
    objects.set(path,await blob.text());return {data:{path},error:null};},
   async download(path){return objects.has(path)?{data:new Blob([objects.get(path)],{type:'application/json'}),error:null}:{data:null,error:{message:'Object not found'}};},
   async remove(paths){for(const path of paths)objects.delete(path);return {data:[],error:null};}
  };}}
 };
 return {api,rows,objects,setFailUpload:x=>{failUpload=x;}};
}
const expected=['Módulo','Ejecutivo','Código','Fecha','Folio','Programa Cero','Salud Dental','Garantizada','Estatus'];
const make=(n)=>({id:'xls_test_'+n,name:'2026-11-20',size:1000,fingerprint:'hash-'+n,addedAt:Date.now()+n,headers:expected,rows:[['Paseo Montejo','Ejecutivo','XYZ','20/11/2026','ABC','S','N','N','A']]});
const db=fakeSupabase(),repo=createSupabaseReportRepository(db.api,()=>({id:USER}));
assert.deepEqual(await repo.listFiles(),[]);
assert.equal((await repo.putFile(make(1))).ok,true);
const saved=await repo.listFiles();
assert.equal(saved.length,1);
assert.deepEqual(saved[0].rows,make(1).rows);
assert.equal((await repo.listFileMetadata()).length,1);
await assert.rejects(()=>repo.putFile(make(1)),e=>e.status===409&&!!e.storedId);
assert.equal(db.rows.length,1,'No se inserta un duplicado');
// Error durante carga: queda pendiente en catálogo (no se considera guardado).
db.setFailUpload(true);
await assert.rejects(()=>repo.putFile(make(2)),/No se pudo subir/);
assert.equal(db.rows.find(r=>r.fingerprint==='hash-2').state,'pending');
assert.equal((await repo.listFiles()).length,1,'Un objeto pendiente nunca entra a los cálculos');
db.setFailUpload(false);
await repo.putFile(make(2));
assert.equal((await repo.listFiles()).length,2,'Recupera cargas interrumpidas');
// Integridad: una manipulación en el objeto se detecta antes de calcular.
const path=db.rows.find(r=>r.fingerprint==='hash-1').storage_path;
db.objects.set(path,JSON.stringify({headers:expected,rows:[]}));
await assert.rejects(()=>repo.listFiles(),/SHA-256/);
// Restaurar contenido para probar eliminación segura.
const original=JSON.stringify({headers:expected,rows:make(1).rows});db.objects.set(path,original);
assert.equal((await repo.listFiles()).length,2);
await repo.deleteFile('xls_test_1');
assert.equal(db.rows.length,1);
await repo.clearFiles();
assert.equal(db.rows.length,0);
assert.equal(db.objects.size,0);
// Revisión estática de privilegios y de preservación del historial anterior.
const sql=readFileSync(new URL('../supabase/migrations/20261121000000_marc_native_xls_storage.sql',import.meta.url),'utf8');
for(const text of ['ENABLE ROW LEVEL SECURITY','CREATE POLICY marc_xls_select_self','auth.uid()','marc-xls-private','CREATE POLICY marc_xls_objects_insert_self'])assert(sql.includes(text),text);
assert(!/DELETE\s+FROM\s+(?:public\.)?dashboard_reports|TRUNCATE|DROP TABLE\s+dashboard_reports/i.test(sql),'No modifica o borra XLS históricos');
const boot=readFileSync(new URL('../src/supabase-boot.js',import.meta.url),'utf8');
assert(boot.includes('createSupabaseReportRepository'));
assert(!boot.includes("api('files'"),'Las nuevas importaciones no pasan por la Edge Function anterior');
console.log('V4.1.0: Storage privado, catálogo RLS, integridad SHA256, duplicados, reanudación, limpieza y aislamiento: OK');
