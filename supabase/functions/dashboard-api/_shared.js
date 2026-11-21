/** Supabase Edge Function adapter for original validated dashboard endpoints.
 * Database credentials are server-side ONLY; each request is authenticated by Supabase Auth.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.10';
import postgres from 'npm:postgres@3.4.7';

let database=null;
function db(){
 const url=Deno.env.get('DASHBOARD_DATABASE_URL');
 if(!url)throw Error('Falta DASHBOARD_DATABASE_URL en los secretos del proyecto Supabase.');
 if(!database)database=postgres(url,{max:1,prepare:false,idle_timeout:10,connect_timeout:12,ssl:'require'});
 return {sql:database};
}
export async function authorize(request){
 const token=(request.headers.get('authorization')||'').match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return {response:send({error:'Inicia sesión con Supabase Auth.'},401)};
 const url=Deno.env.get('SUPABASE_URL');
 const key=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
 if(!url||!key)return {response:send({error:'No está configurada Supabase Auth en el servidor.'},503)};
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.getUser(token);
 if(error||!data?.user?.id)return {response:send({error:'Sesión expirada o no autorizada.'},401)};
 return {owner:String(data.user.id),db:db()};
}
export function send(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function jsonBody(request,limit=5000000){
 const len=Number(request.headers.get('content-length')||0);
 if(len>limit)throw Error('El archivo o la configuración supera el tamaño admitido.');
 const raw=await request.text();
 if(new TextEncoder().encode(raw).byteLength>limit)throw Error('El contenido supera el límite permitido.');
 return JSON.parse(raw);
}
export const responseError=(error)=>{
 console.error('dashboard-api:',error);
 const message=error instanceof Error?error.message:'Solicitud inválida';
 const isInput=/inválid|incorrect|columna|encabezad|fila|límite|tamaño|falt|reporte|archivo|firma|contenido/i.test(message);
 return send({error:isInput?message:'No se pudo completar la operación. Revisa la conexión segura de Supabase Database y los registros de Edge Functions.'},isInput?400:500);
};
