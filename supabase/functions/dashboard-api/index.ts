/** Single origin-checked endpoint; no service key or DB connection is sent to the browser. */
import files from './handlers/files.js';
import incidents from './handlers/incidents.js';
import settings from './handlers/settings.js';
import sync from './handlers/sync.js';
import visits from './handlers/visits.js';
import updates from './handlers/updates.js';
import audit from './handlers/audit.js';
import reset from './handlers/reset.js';
import health from './handlers/health.js';
import {send} from './_shared.js';
const routes: Record<string,(request: Request)=>Promise<Response>|Response>={files,incidents,settings,sync,visits,updates,audit,reset,health};
Deno.serve(async request=>{
 const origin=request.headers.get('origin');
 const allowed=(Deno.env.get('DASHBOARD_ALLOWED_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean);
 const headers: Record<string,string>={'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':'Authorization,Content-Type,apikey,Accept',
    'Access-Control-Max-Age':'3600'};
 if(origin&&allowed.includes(origin))headers['Access-Control-Allow-Origin']=origin;
 if(origin&&!allowed.includes(origin))return send({error:'Origen no permitido.'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 const path=new URL(request.url).pathname;
 const action=path.split('/').filter(Boolean).at(-1);
 const handler=routes[action];
 if(!handler)return new Response(JSON.stringify({error:'Ruta no encontrada.'}),{status:404,headers:{...headers,'Content-Type':'application/json'}});
 try{
  const response=await handler(request);
  const responseHeaders=new Headers(response.headers);
  for(const [k,v] of Object.entries(headers))responseHeaders.set(k,v);
  return new Response(response.body,{status:response.status,headers:responseHeaders});
 }catch(error){
  console.error('Edge API error:',error);
  return new Response(JSON.stringify({error:'No fue posible contactar la base de datos.'}),{status:500,headers:{...headers,'Content-Type':'application/json'}});
 }
});
