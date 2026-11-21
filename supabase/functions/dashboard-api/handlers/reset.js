import {authorize,send,jsonBody,responseError} from '../_shared.js';
export default async function handler(request){
 const auth=await authorize(request);if(auth.response)return auth.response;
 if(request.method!=='POST')return send({error:'Método no permitido'},405);
 const {owner,db}=auth;
 try{const body=await jsonBody(request);if(body.confirmation!=='RESTABLECER TODO')return send({error:'Confirmación inválida'},400);
 // Una sola sentencia atómica; el propietario se obtiene exclusivamente de la sesión.
 await db.sql`WITH a AS (DELETE FROM dashboard_update_requests WHERE owner_id=${owner}), b AS (DELETE FROM dashboard_incidents WHERE owner_id=${owner}), c AS (DELETE FROM dashboard_visits WHERE owner_id=${owner}), d AS (DELETE FROM dashboard_reports WHERE owner_id=${owner}), e AS (DELETE FROM dashboard_settings WHERE owner_id=${owner}), f AS (DELETE FROM dashboard_audit_events WHERE owner_id=${owner}) SELECT 1`;
 return send({ok:true});}catch(e){return responseError(e);}
}
