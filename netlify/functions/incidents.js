import {authorize,send,jsonBody,responseError} from '../lib/_shared.js';

const normalizeFolio=value=>String(value??'').trim().normalize('NFKC').toUpperCase().replace(/[\s\-]+/g,'');
const limitText=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';

export default async function handler(request){
  const auth=await authorize(request);if(auth.response)return auth.response;
  const {owner,db}=auth;
  try{
    if(request.method==='GET'){
      // No depende de dashboard_reports. También muestra incidencias sin XLS activo.
      const rows=await db.sql`
        SELECT folio_key,folio,module,executive,active,resolved,comments,created_at,updated_at,resolved_at
        FROM dashboard_incidents WHERE owner_id=${owner}
        ORDER BY updated_at DESC LIMIT 10000`;
      return send({incidents:rows});
    }
    if(request.method!=='PUT')return send({error:'Método no permitido'},405);
    const body=await jsonBody(request,16000);
    const folio=limitText(body?.folio,100),folioKey=normalizeFolio(folio);
    if(!folioKey||folioKey.length>100||!/^[A-Z0-9._\/]+$/.test(folioKey))
      return send({error:'Folio inválido. Indica un folio alfanumérico válido.'},400);
    if(typeof body.active!=='boolean'||typeof body.resolved!=='boolean')
      return send({error:'Indica correctamente los estados de incidencia y resolución.'},400);
    const module=limitText(body.module,160),executive=limitText(body.executive,160),replaceMetadata=body.replaceMetadata===true;
    const comment=limitText(body.comment,2000);
    const newComments=JSON.stringify(comment?[{text:comment,createdAt:new Date().toISOString()}]:[]);
    const rows=await db.sql`
      INSERT INTO dashboard_incidents
        (owner_id,folio_key,folio,module,executive,active,resolved,comments,resolved_at)
      VALUES
        (${owner},${folioKey},${folio},${module},${executive},${body.active},${body.resolved},${newComments}::jsonb,
         CASE WHEN ${body.resolved} THEN NOW() ELSE NULL END)
      ON CONFLICT(owner_id,folio_key) DO UPDATE SET
        folio=EXCLUDED.folio,
        module=CASE WHEN ${replaceMetadata} OR EXCLUDED.module<>'' THEN EXCLUDED.module ELSE dashboard_incidents.module END,
        executive=CASE WHEN ${replaceMetadata} OR EXCLUDED.executive<>'' THEN EXCLUDED.executive ELSE dashboard_incidents.executive END,
        active=EXCLUDED.active,
        resolved=EXCLUDED.resolved,
        comments=dashboard_incidents.comments || EXCLUDED.comments,
        resolved_at=CASE WHEN EXCLUDED.resolved AND NOT dashboard_incidents.resolved
            THEN NOW() WHEN NOT EXCLUDED.resolved THEN NULL ELSE dashboard_incidents.resolved_at END,
        updated_at=NOW()
      RETURNING folio_key,folio,module,executive,active,resolved,comments,created_at,updated_at,resolved_at`;
    return send({incident:rows[0]});
  }catch(error){console.error('incidents:',error);return responseError(error);}
}
