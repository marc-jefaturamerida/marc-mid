import { authorize, send, jsonBody, responseError } from '../lib/_shared.js';

const ALLOWED = new Set([
 'wmSamsComisionesV1',
 'wmSamsComisionesTarifasV14',
 'wmSamsComisionesMetasEquipoV1',
 'wmSamsComisionesRecuperacionesEquipoV1',
 'wmSamsArchivoSeleccionV9',
 'wmSamsFolioFlagsV9',
 'wmSamsMeridaBonusDinamicaV245',
 'wmSamsComparativaSemanalObjetivosV13',
 'wmSamsComisionesLayoutV5',
 'wmSamsMeridaReportTextsV17',
 'wmSamsTablaVisualV18',
 'wmSamsVisitConfigV20',
 'wmSamsMeridaQualityConfigV22',
 'wmSamsMeridaSupervisorsV22',
 'wmSamsMeridaAchievementGoalsV232',
  'wmSamsMeridaSupervisorCommissionV24',
  'wmSamsNavOrderV250',
  'wmSamsWeeklyAdminReportV252',
  'wmSamsHistoricalIndividualV253',
  'wmSamsHistoricalModuleV254',
  'wmSamsBaseGoalsV258',
  'wmSamsLeadershipV256',
  'wmSamsRecordEditsV260',
  'wmSamsTeamRegistryV261',
  'wmSamsRemindersV261','wmSamsClipboardSettingsV303'
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
      const expected=body.expectedRevisions;
      if(!expected||typeof expected!=='object'||Array.isArray(expected)||entries.some(e=>!Number.isSafeInteger(expected[e.key])||expected[e.key]<0))
        return send({error:'Faltan revisiones de sincronización; recarga antes de editar.'},409);
      const previous=await db.sql`SELECT setting_key, revision, setting_value FROM dashboard_settings WHERE owner_id=${owner}`;
      const current=new Map(previous.map(r=>[r.setting_key,r]));
      const conflicts=entries.filter(e=>(Number(current.get(e.key)?.revision||0)!==Number(expected[e.key]))).map(e=>e.key);
      if(conflicts.length)return send({error:'Otro dispositivo modificó ajustes. Tus cambios locales se conservaron; sincroniza o exporta un respaldo antes de resolver el conflicto.',conflicts},409);
      // Una clave no puede sobrescribir una revisión más nueva: comparación atómica por UPDATE/INSERT.
      const revisions={};let written=0;
      for(const {key,value} of entries){
        const existing=current.get(key);
        if(existing?.setting_value===value){revisions[key]=Number(existing.revision);continue;}
        const rows=existing?
          await db.sql`UPDATE dashboard_settings SET setting_value=${value},revision=revision+1,updated_at=NOW()
            WHERE owner_id=${owner} AND setting_key=${key} AND revision=${expected[key]} RETURNING revision`:
          await db.sql`INSERT INTO dashboard_settings(owner_id,setting_key,setting_value) VALUES (${owner},${key},${value})
            ON CONFLICT (owner_id,setting_key) DO NOTHING RETURNING revision`;
        if(!rows.length)return send({error:'Conflicto de actualización concurrente; no se sobrescribieron datos más recientes.',conflicts:[key],revisions},409);
        revisions[key]=Number(rows[0].revision);written++;
      }
      if(written){try{
        const details=JSON.stringify({keys:entries.map(e=>e.key),written});
        await db.sql`INSERT INTO dashboard_audit_events(owner_id,actor_id,entity_type,entity_key,operation,details)
          VALUES (${owner},${owner},'settings','account','update',${details}::jsonb)`;
      }catch(error){console.warn('settings audit unavailable:',error?.message);}}
      return send({ok:true,written,received:entries.length,revisions});

    }
    return send({error:'Método no permitido'},405);
  }catch(err){console.error('settings:',err);return responseError(err);}
}
