import {authorize,send,responseError} from '../_shared.js';
export default async function handler(request){
 const auth=await authorize(request);if(auth.response)return auth.response;
 if(request.method!=='GET')return send({error:'Método no permitido'},405);
 try{const rows=await auth.db.sql`SELECT id,entity_type,entity_key,operation,details,created_at FROM dashboard_audit_events WHERE owner_id=${auth.owner} ORDER BY created_at DESC LIMIT 200`;return send({events:rows});}
 catch(err){console.error('audit',err);return responseError(err);}
}
