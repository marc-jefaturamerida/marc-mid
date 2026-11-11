import { authorize, send, jsonBody, responseError } from '../lib/_shared.js';

const ALLOWED = new Set([
 'wmSamsComisionesV1',
 'wmSamsComisionesTarifasV14',
 'wmSamsComisionesMetasEquipoV1',
 'wmSamsComisionesRecuperacionesEquipoV1',
 'wmSamsArchivoSeleccionV9',
 'wmSamsFolioFlagsV9',
 'wmSamsComparativaSemanalObjetivosV13',
 'wmSamsComisionesLayoutV5',
 'wmSamsMeridaReportTextsV17',
 'wmSamsTablaVisualV18',
 'wmSamsVisitConfigV20'
]);
const MAX_ENTRIES=12;
const MAX_TOTAL_BYTES=2_200_000;
function validateEntries(body){
  const entries=Array.isArray(body?.entries)?body.entries:
    typeof body?.key==='string'?[{key:body.key,value:body.value}]:null;
  if(!entries||!entries.length||entries.length>MAX_ENTRIES)throw Error('Cantidad de ajustes inválida.');
  const seen=new Set();
  for(const item of entries){
    if(!item||!ALLOWED.has(item.key)||typeof item.value!=='string'||item.value.length>1_000_000||seen.has(item.key))
      throw Error('Campo de ajustes inválido o duplicado.');
    seen.add(item.key);
  }
  if(new TextEncoder().encode(JSON.stringify(entries)).length>MAX_TOTAL_BYTES)throw Error('El lote de ajustes supera el límite permitido.');
  return entries;
}
export default async function handler(request){
  const auth=await authorize(request);if(auth.response)return auth.response;
  const {owner,db}=auth;
  try{
    if(request.method==='GET'){
      const rows=await db.sql`SELECT setting_key, setting_value, revision, updated_at FROM dashboard_settings WHERE owner_id=${owner}`;
      return send({settings:Object.fromEntries(rows.map(r=>[r.setting_key,r.setting_value])),
        revisions:Object.fromEntries(rows.map(r=>[r.setting_key,Number(r.revision)]))});
    }
    if(request.method==='PUT'){
      const body=await jsonBody(request,2_600_000);
      const entries=validateEntries(body);
      // Un único INSERT parametrizado con JSONB para todas las claves modificadas.
      // Evita reescrituras y aumentos de revisión si el valor ya existe idéntico.
      const payload=JSON.stringify(entries.map(({key,value})=>({setting_key:key,setting_value:value})));
      const rows=await db.sql`
        INSERT INTO dashboard_settings (owner_id,setting_key,setting_value)
        SELECT ${owner}, input.setting_key, input.setting_value
        FROM jsonb_to_recordset(${payload}::jsonb) AS input(setting_key text,setting_value text)
        ON CONFLICT (owner_id,setting_key) DO UPDATE SET
          setting_value=EXCLUDED.setting_value,
          revision=dashboard_settings.revision+1,
          updated_at=now()
        WHERE dashboard_settings.setting_value IS DISTINCT FROM EXCLUDED.setting_value
        RETURNING setting_key,revision`;
      return send({ok:true,written:rows.length,received:entries.length});
    }
    return send({error:'Método no permitido'},405);
  }catch(err){console.error('settings:',err);return responseError(err);}
}
