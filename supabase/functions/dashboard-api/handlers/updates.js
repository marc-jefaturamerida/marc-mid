import {authorize,send,jsonBody,responseError} from '../_shared.js';
import {normalizeRequestFields,normalizeRequestedValues,updateFieldNames} from '../update-request-rules.js';
const limit=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const idValue=value=>{const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null;};
const revisionValue=value=>Number.isSafeInteger(value)&&value>0?value:null;
const requestKey=value=>{const s=String(value??'');return /^[A-Za-z0-9_-]{4,150}$/.test(s)?s:'';};
const cleanComment=value=>{const text=limit(value,2000);if(typeof value==='string'&&value.trim().length>2000)throw Error('Comentario demasiado largo.');return text;};
const note=(comment)=>JSON.stringify(comment?[{text:comment,createdAt:new Date().toISOString()}]:[]);
async function audit(db,owner,recordKey,operation,details={}){
 try{await db.sql`INSERT INTO dashboard_audit_events(owner_id,actor_id,entity_type,entity_key,operation,details)
 VALUES (${owner},${owner},'update_request',${recordKey},${operation},${JSON.stringify(details)}::jsonb)`;}
 catch(error){console.warn('updates audit:',error?.message);}
}
export default async function handler(request){
 const auth=await authorize(request);if(auth.response)return auth.response;
 const {owner,db}=auth;
 try{
  if(request.method==='GET'){
   const trashed=new URL(request.url).searchParams.get('deleted')==='1';
   const rows=await db.sql`SELECT * FROM dashboard_update_requests
    WHERE owner_id=${owner} AND (deleted_at IS NOT NULL)=${trashed}
    ORDER BY created_at DESC LIMIT 10000`;
   return send({requests:rows});
  }
  if(request.method==='POST'){
   const body=await jsonBody(request,280000);
   if(body.action==='restore'){
    const id=idValue(body.id),rev=revisionValue(body.revision);
    if(!id||!rev)return send({error:'Identificador o revisión inválidos.'},400);
    // Index parcial impide tener dos pendientes para el mismo registro después de restaurar.
    const found=await db.sql`UPDATE dashboard_update_requests SET deleted_at=NULL,revision=revision+1,updated_at=NOW()
       WHERE owner_id=${owner} AND id=${id} AND revision=${rev} AND deleted_at IS NOT NULL RETURNING *`;
    if(!found.length)return send({error:'La solicitud cambió en otro dispositivo. Actualiza el listado.'},409);
    await audit(db,owner,found[0].record_key,'restore',{id});return send({request:found[0]});
   }
   const key=requestKey(body.recordKey),folio=limit(body.folio,160),module=limit(body.module,160),executive=limit(body.executive,160),recordDate=limit(body.recordDate,32);
   if(!key)return send({error:'El registro no tiene un identificador válido.'},400);
   const fields=JSON.stringify(normalizeRequestFields(body.fields)),availableFields=JSON.stringify(body.availableFields?updateFieldNames(body.availableFields):Object.keys(JSON.parse(fields))),comment=cleanComment(body.comment),comments=note(comment);
   // La combinación de índice parcial y UPSERT preserva una sola solicitud pendiente por registro.
   const rows=await db.sql`INSERT INTO dashboard_update_requests
    (owner_id,record_key,folio,module,executive,record_date,available_fields,requested_fields,comments)
    VALUES (${owner},${key},${folio},${module},${executive},${recordDate},${availableFields}::jsonb,${fields}::jsonb,${comments}::jsonb)
    ON CONFLICT (owner_id,record_key) WHERE status='pending' AND deleted_at IS NULL
    DO UPDATE SET requested_fields=dashboard_update_requests.requested_fields || EXCLUDED.requested_fields,
      comments=dashboard_update_requests.comments || EXCLUDED.comments,
      available_fields=CASE WHEN jsonb_array_length(dashboard_update_requests.available_fields)=0 THEN EXCLUDED.available_fields ELSE dashboard_update_requests.available_fields END,
      updated_at=NOW(),revision=dashboard_update_requests.revision+1
    RETURNING *`;
   await audit(db,owner,key,'request',{id:rows[0].id,fields:Object.keys(rows[0].requested_fields)});
   return send({request:rows[0]});
  }
  const body=await jsonBody(request,280000),id=idValue(body.id),rev=revisionValue(body.revision);
  if(!id||!rev)return send({error:'Identificador o revisión inválidos.'},400);
  if(request.method==='DELETE'){
   const rows=await db.sql`UPDATE dashboard_update_requests SET deleted_at=NOW(),revision=revision+1,updated_at=NOW()
      WHERE owner_id=${owner} AND id=${id} AND revision=${rev} AND deleted_at IS NULL RETURNING *`;
   if(!rows.length)return send({error:'La solicitud cambió en otro dispositivo. Actualiza el listado.'},409);
   await audit(db,owner,rows[0].record_key,'trash',{id});return send({request:rows[0]});
  }
  if(request.method==='PUT'){
   if(body.action==='edit'){
    const fields=JSON.stringify(normalizeRequestFields(body.fields)),comment=cleanComment(body.comment),comments=note(comment);
    const rows=await db.sql`UPDATE dashboard_update_requests SET requested_fields=${fields}::jsonb,
      comments=comments || ${comments}::jsonb,revision=revision+1,updated_at=NOW()
      WHERE owner_id=${owner} AND id=${id} AND revision=${rev} AND status='pending' AND deleted_at IS NULL RETURNING *`;
    if(!rows.length)return send({error:'No se pudo editar: esta solicitud cambió o ya está resuelta.'},409);
    await audit(db,owner,rows[0].record_key,'edit',{id,fields:Object.keys(rows[0].requested_fields)});return send({request:rows[0]});
   }
   if(body.action==='resolve'){
    const found=await db.sql`SELECT * FROM dashboard_update_requests WHERE owner_id=${owner} AND id=${id} AND revision=${rev} AND deleted_at IS NULL AND status='pending'`;
    if(!found.length)return send({error:'Esta solicitud cambió. Recarga antes de resolver.'},409);
    const values=JSON.stringify(normalizeRequestedValues(found[0].requested_fields,body.appliedValues));
    const rows=await db.sql`UPDATE dashboard_update_requests SET status='resolved',resolved_at=NOW(),
       applied_values=${values}::jsonb,revision=revision+1,updated_at=NOW()
       WHERE owner_id=${owner} AND id=${id} AND revision=${rev} AND status='pending' AND deleted_at IS NULL RETURNING *`;
    if(!rows.length)return send({error:'Otro dispositivo cambió la solicitud. Vuelve a consultarla.'},409);
    await audit(db,owner,rows[0].record_key,'resolve',{id,fields:Object.keys(JSON.parse(values))});return send({request:rows[0]});
   }
  }
  return send({error:'Método no permitido.'},405);
 }catch(error){
  if(error?.code==='23505')return send({error:'Ya existe una solicitud pendiente para este registro. Actualiza la lista.'},409);
  if(/selecciona|campo|columna|valor|comentario|identificador|inválid|falta|demasiado/i.test(String(error?.message)))return send({error:error.message},400);
  console.error('updates:',error);return responseError(error);
 }
}
