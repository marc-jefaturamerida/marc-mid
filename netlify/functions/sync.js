import { authorize, send, responseError } from '../lib/_shared.js';

// Una única Function para comprobar cambios al regresar después de una ausencia larga.
// No se llama por temporizador: la aplicación evita mantener activa la base de datos.
export default async function handler(request){
  const auth=await authorize(request);if(auth.response)return auth.response;
  if(request.method!=='GET')return send({error:'Método no permitido'},405);
  const {owner,db}=auth;
  try{
    const [settings,reports,incidentsMeta]=await Promise.all([
      db.sql`SELECT setting_key,setting_value FROM dashboard_settings WHERE owner_id=${owner}`,
      db.sql`SELECT id,fingerprint FROM dashboard_reports WHERE owner_id=${owner} ORDER BY id`,
      db.sql`SELECT COUNT(*)::int AS count, MAX(updated_at) AS last_updated FROM dashboard_incidents WHERE owner_id=${owner}`
    ]);
    return send({settings:Object.fromEntries(settings.map(r=>[r.setting_key,r.setting_value])),reports,incidentsMeta:incidentsMeta[0]||{count:0,last_updated:null}});
  }catch(err){console.error('sync:',err);return responseError(err);}
}
