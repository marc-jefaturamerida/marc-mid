/**
 * MARC V4.0 — Archivo XLS nativo para Supabase.
 * El contenido se almacena en un bucket privado, con un objeto por XLS.
 * PostgreSQL solo almacena metadatos; la seguridad depende de Auth + RLS.
 * NO accede a dashboard_reports ni a datos heredados.
 */
export const XLS_BUCKET = 'marc-xls-private';
export const XLS_TABLE = 'marc_xls_archives';
const PAGE_SIZE = 100;
const MAX_FILES = 500;
const MAX_ARCHIVE_BYTES = 45 * 1024 * 1024;
const utf8 = new TextEncoder();

function failure(label, error) {
  const detail = error?.message || String(error || 'Error desconocido');
  const e = new Error(`${label}: ${detail}`);
  if (error?.code) e.code = error.code;
  if (error?.status) e.status = Number(error.status);
  return e;
}
function reportCheck(report) {
  if (!report || typeof report !== 'object') throw Error('El XLS no tiene un formato válido.');
  if (!/^xls_[a-zA-Z0-9_-]{5,90}$/.test(report.id || '')) throw Error('El identificador XLS es inválido.');
  if (typeof report.name !== 'string' || !report.name || report.name.length > 200) throw Error('El nombre XLS es inválido.');
  if (typeof report.fingerprint !== 'string' || !/^[a-zA-Z0-9_-]{4,120}$/.test(report.fingerprint)) throw Error('La firma XLS es inválida.');
  if (!Array.isArray(report.headers) || report.headers.length < 8 || report.headers.length > 120 || report.headers.some(h=>typeof h !== 'string')) throw Error('Los encabezados del XLS son inválidos.');
  if (!Array.isArray(report.rows) || !report.rows.length || report.rows.length > 50000 || report.rows.some(row=>!Array.isArray(row) || row.length !== report.headers.length || row.some(v=>typeof v!=='string'))) throw Error('Las filas del XLS son inválidas.');
}
async function checksum(text) {
  if (!globalThis.crypto?.subtle) throw Error('Se necesita una conexión HTTPS segura para verificar la integridad XLS.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', utf8.encode(text));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
function format(row) {
  return {id:row.id, name:row.file_name,size:Number(row.file_size)||0,
    fingerprint:row.fingerprint,addedAt:Number(row.added_at)||0,
    rowCount:Number(row.row_count)||0,status:row.state};
}
function duplicate(row) {
  const e=new Error(`Este XLS ya existe en Supabase (${row.file_name}). No se guardó otra copia.`);
  e.status=409;e.storedId=row.id;e.storedName=row.file_name;
  return e;
}
function isExistingObject(error) {
  return String(error?.statusCode||error?.status||'')==='409'||/already exists|duplicate|resource exists/i.test(error?.message||'');
}

export function createSupabaseReportRepository(client, getOwner, {onProgress=()=>{}}={}) {
  const owner=()=>{
    const id=getOwner()?.id;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw Error('Inicia sesión con Supabase para acceder a tus XLS.');
    return id;
  };
  const table=()=>client.from(XLS_TABLE);
  const storage=()=>client.storage.from(XLS_BUCKET);

  async function metadataAll() {
    const uid=owner(), output=[];
    let offset=0;
    for (;;) {
      const {data,error}=await table().select('id,owner_id,file_name,file_size,fingerprint,sha256,storage_path,row_count,added_at,state')
        .eq('owner_id',uid).order('added_at',{ascending:true}).order('id',{ascending:true})
        .range(offset, offset+PAGE_SIZE-1);
      if(error) throw failure('No se pudo consultar el catálogo de XLS (verifica la migración V4 y RLS)', error);
      if (!Array.isArray(data)) throw Error('Supabase devolvió un catálogo XLS inválido.');
      if(data.some(row=>row.owner_id!==uid)) throw Error('La respuesta contiene un archivo de otra cuenta; se detuvo la lectura.');
      output.push(...data);
      if (output.length>MAX_FILES) throw Error(`El catálogo excede el límite de ${MAX_FILES} XLS.`);
      if(data.length<PAGE_SIZE) break;
      offset+=data.length;
    }
    return output;
  }
  async function listFileMetadata() {
    return (await metadataAll()).filter(item=>item.state==='ready').map(format);
  }
  async function listFiles() {
    const items=(await metadataAll()).filter(item=>item.state==='ready');
    const reports=[];
    for (let i=0;i<items.length;i++) {
      const item=items[i];
      onProgress(i, items.length, item.file_name);
      const {data,error}=await storage().download(item.storage_path);
      if(error || !data) throw failure(`No se pudo descargar «${item.file_name}» de Storage`,error);
      let raw, payload;
      try {raw=await data.text();payload=JSON.parse(raw);} catch(e) {throw failure(`El contenido de «${item.file_name}» no es un JSON válido`,e);}
      const actual=await checksum(raw);
      if(actual!==item.sha256)throw Error(`El archivo «${item.file_name}» no coincide con su firma SHA-256. No se utilizará en cálculos.`);
      if(!payload||!Array.isArray(payload.headers)||!Array.isArray(payload.rows)||payload.rows.length!==Number(item.row_count))
        throw Error(`El archivo «${item.file_name}» tiene filas o encabezados incompletos. No se utilizará en cálculos.`);
      const report={id:item.id,name:item.file_name,size:Number(item.file_size),fingerprint:item.fingerprint,
        addedAt:Number(item.added_at),headers:payload.headers,rows:payload.rows};
      reportCheck(report);
      reports.push(report);
    }
    onProgress(items.length,items.length,'');
    return reports;
  }
  async function putFile(report) {
    reportCheck(report);
    const uid=owner();
    const raw=JSON.stringify({headers:report.headers,rows:report.rows});
    const size=utf8.encode(raw).byteLength;
    if(size>MAX_ARCHIVE_BYTES)throw Error('Este XLS procesado supera 45 MB. Divídelo por semanas antes de subirlo.');
    const sha256=await checksum(raw);
    const path=`${uid}/${report.fingerprint}.json`;
    let {data:existing,error:lookupError}=await table().select('id,file_name,fingerprint,sha256,state,storage_path')
      .eq('owner_id',uid).eq('fingerprint',report.fingerprint).maybeSingle();
    if(lookupError)throw failure('No se pudo verificar el duplicado XLS',lookupError);
    if(existing?.sha256&&existing.sha256!==sha256)
      throw Error('Se encontró una colisión entre firmas XLS. No se modificó el archivo almacenado.');
    if(existing?.state==='ready')throw duplicate(existing);
    if(!existing) {
      const insert={id:report.id,owner_id:uid,file_name:report.name,file_size:Math.max(0,Math.floor(report.size)||0),
        fingerprint:report.fingerprint,sha256,storage_path:path,row_count:report.rows.length,
        added_at:Math.floor(Number(report.addedAt)||Date.now()),state:'pending'};
      const {data,error}=await table().insert(insert).select('id,file_name,fingerprint,sha256,state,storage_path').single();
      if(error) {
        // Otra pestaña podría haber insertado el mismo archivo entre SELECT e INSERT.
        if(error.code!=='23505')throw failure('No se pudo registrar la ficha XLS',error);
        const result=await table().select('id,file_name,fingerprint,sha256,state,storage_path')
          .eq('owner_id',uid).eq('fingerprint',report.fingerprint).maybeSingle();
        if(result.error || !result.data) throw failure('No se pudo confirmar el conflicto de XLS',result.error);
        existing=result.data;
        if(existing.sha256!==sha256)throw Error('Conflicto: los contenidos son diferentes; no se guardó el XLS.');
        if(existing.state==='ready')throw duplicate(existing);
      }else existing=data;
    }
    // Una carga fallida queda pending y es reanudable: no marca el XLS como guardado.
    const {error:uploadError}=await storage().upload(existing.storage_path,
      new Blob([raw],{type:'application/json'}),{contentType:'application/json',cacheControl:'0',upsert:false});
    if(uploadError) {
      if(!isExistingObject(uploadError))throw failure('No se pudo subir el contenido del XLS a Storage',uploadError);
      const {data:old,error:downloadError}=await storage().download(existing.storage_path);
      if(downloadError||!old)throw failure('El objeto XLS ya existe pero no se puede verificar',downloadError);
      const oldRaw=await old.text();
      if(await checksum(oldRaw)!==sha256)throw Error('El objeto existente no coincide con el XLS. No se marcó como guardado.');
    }
    const {data:confirmed,error:commitError}=await table().update({state:'ready'})
      .eq('owner_id',uid).eq('id',existing.id).eq('sha256',sha256).select('id').single();
    if(commitError||!confirmed)throw failure('El XLS se subió, pero no pudo confirmarse el catálogo; vuelve a intentar el mismo archivo',commitError);
    return {ok:true,id:existing.id};
  }
  async function deleteFile(id) {
    const uid=owner();
    const {data,error}=await table().select('id,storage_path').eq('owner_id',uid).eq('id',id).maybeSingle();
    if(error)throw failure('No se pudo localizar el XLS',error);
    if(!data)return {ok:true};
    const deleted=await table().delete().eq('owner_id',uid).eq('id',id);
    if(deleted.error)throw failure('No se pudo eliminar el XLS del catálogo',deleted.error);
    const result=await storage().remove([data.storage_path]);
    if(result.error)throw failure('La ficha se eliminó, pero el objeto Storage requiere limpieza manual',result.error);
    return {ok:true};
  }
  async function clearFiles() {
    const all=await metadataAll();
    for(const item of all)await deleteFile(item.id);
    return {ok:true};
  }
  return {listFiles,listFileMetadata,putFile,deleteFile,clearFiles,metadataAll};
}
