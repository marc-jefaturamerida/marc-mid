import {authorize,send,jsonBody,responseError} from '../_shared.js';

import {validateVisit} from '../visit-validation.js';

const validId=id=>typeof id==='string'&&/^vis_[a-z0-9_-]{10,70}$/i.test(id);
export default async function handler(request){
  const auth=await authorize(request);if(auth.response)return auth.response;
  const {owner,db}=auth;
  try{
    const url=new URL(request.url);
    if(request.method==='GET'){
      const id=url.searchParams.get('id');
      if(id){
        if(!validId(id))return send({error:'Identificador inválido.'},400);
        const rows=await db.sql`SELECT id, content FROM dashboard_visits WHERE owner_id=${owner} AND id=${id} LIMIT 1`;
        return rows.length?send({visit:rows[0].content}):send({error:'Visita no encontrada.'},404);
      }
      // Solo metadatos: no repetir los comentarios largos en el listado.
      const rows=await db.sql`SELECT id, visited_at, module_name, supervisor_name, total_score,updated_at FROM dashboard_visits
        WHERE owner_id=${owner} ORDER BY visited_at DESC,updated_at DESC LIMIT 100`;
      return send({visits:rows.map(v=>({id:v.id,date:String(v.visited_at).slice(0,10),module:v.module_name,supervisor:v.supervisor_name,score:Number(v.total_score),updatedAt:String(v.updated_at)}))});
    }
    if(request.method==='POST'){
      const visit=await jsonBody(request,240_000);validateVisit(visit);
      // La fecha se guarda en ISO local para preservar el día de visita.
      const payload=JSON.stringify(visit);
      const score=Number(visit.total);
      await db.sql`INSERT INTO dashboard_visits (owner_id,id,visited_at,module_name,supervisor_name,content,total_score)
        VALUES (${owner},${visit.id},${visit.visitedAt}::date,${visit.module},${visit.supervisor},${payload}::jsonb,${score})
        ON CONFLICT(owner_id,id) DO UPDATE SET
          visited_at=EXCLUDED.visited_at,module_name=EXCLUDED.module_name,supervisor_name=EXCLUDED.supervisor_name,
          content=EXCLUDED.content,total_score=EXCLUDED.total_score,updated_at=now()`;
      return send({ok:true,id:visit.id});
    }
    if(request.method==='DELETE'){
      const id=url.searchParams.get('id');if(!validId(id))return send({error:'Identificador inválido.'},400);
      await db.sql`DELETE FROM dashboard_visits WHERE owner_id=${owner} AND id=${id}`;
      return send({ok:true});
    }
    return send({error:'Método no permitido.'},405);
  }catch(e){console.error('visits:',e);return responseError(e);}
}
