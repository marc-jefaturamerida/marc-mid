import {Buffer} from 'node:buffer';
import { authorize, send, jsonBody, responseError } from '../_shared.js';

const VALID_HEAD = ['MÓDULO','EJECUTIVO','CÓDIGO','FECHA','FOLIO','PROGRAMA CERO','SALUD DENTAL','GARANTIZADA','ESTATUS'];
function norm(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase(); }
function checkReport(r) {
  if (!r || typeof r !== 'object') throw new Error('Reporte inválido.');
  if (typeof r.id !== 'string' || !/^xls_[\w-]{5,90}$/.test(r.id)) throw new Error('Identificador de reporte incorrecto.');
  if (typeof r.name !== 'string' || r.name.length > 200 || !(/\.(xls|xlsx|csv|tsv)$/i.test(r.name) || /^\d{4}-\d{2}-\d{2}$/.test(r.name))) throw new Error('Nombre inválido: utiliza la fecha seleccionada o un nombre de archivo anterior válido.');
  if (typeof r.fingerprint !== 'string' || !/^[\w-]{4,120}$/.test(r.fingerprint)) throw new Error('Firma de archivo inválida.');
  if (!Array.isArray(r.headers) || r.headers.length < 8 || r.headers.length > 120 || r.headers.some(v=>typeof v!=='string'||v.length>150)) throw new Error('Encabezados inválidos.');
  const keys = new Set(r.headers.map(norm));
  for (const required of VALID_HEAD) if (!keys.has(norm(required))) throw new Error(`Falta la columna ${required}`);
  if (!Array.isArray(r.rows) || !r.rows.length || r.rows.length > 50000 || r.rows.some(row=>!Array.isArray(row)||row.length!==r.headers.length||row.some(cell=>typeof cell!=='string'||cell.length>3000))) throw new Error('Filas inválidas.');
  if (!Number.isFinite(Number(r.addedAt))) throw new Error('Fecha de registro inválida.');
}
export default async function handler(request) {
  const auth=await authorize(request); if(auth.response) return auth.response;
  const {owner,db}=auth;
  try {
    if(request.method==='GET') {
      if(new URL(request.url).searchParams.get('meta')==='1') {
        const meta=await db.sql`SELECT id, fingerprint FROM dashboard_reports WHERE owner_id=${owner} ORDER BY id`;
        return send({reports:meta});
      }
      // Hasta 8 XLS por consulta; se limita el tamaño serializado a ~4 MB
      // para no agotar el máximo de respuesta de Netlify Functions.
      const url=new URL(request.url);
      const offset=Math.max(0,Math.min(500,Math.floor(Number(url.searchParams.get('offset')||0))));
      const limit=Math.max(1,Math.min(8,Math.floor(Number(url.searchParams.get('limit')||1))));
      const rows=await db.sql`SELECT id, file_name, file_size, fingerprint, headers, rows, added_at
        FROM dashboard_reports WHERE owner_id=${owner} ORDER BY added_at ASC, id ASC
        LIMIT ${limit} OFFSET ${offset}`;
      const reports=[];
      let totalBytes=100;
      for(const row of rows){
        const report={id:row.id,name:row.file_name,size:row.file_size,fingerprint:row.fingerprint,
          headers:row.headers,rows:row.rows,addedAt:Number(row.added_at)};
        const size=Buffer.byteLength(JSON.stringify(report),'utf8');
        if(reports.length&&totalBytes+size>4_000_000)break;
        reports.push(report);totalBytes+=size;
      }
      const nextOffset=offset+reports.length;
      const hasMore=reports.length<rows.length||rows.length===limit;
      return send({reports,nextOffset,hasMore});
    }
    if(request.method==='POST') {
      const r=await jsonBody(request,5_000_000);checkReport(r);
      const rows=await db.sql`INSERT INTO dashboard_reports
        (owner_id,id,file_name,file_size,fingerprint,headers,rows,added_at)
        VALUES (${owner},${r.id},${r.name},${Math.max(0,Math.round(Number(r.size)||0))},${r.fingerprint},${JSON.stringify(r.headers)}::jsonb,${JSON.stringify(r.rows)}::jsonb,${Math.floor(Number(r.addedAt))})
        ON CONFLICT (owner_id,fingerprint) DO NOTHING RETURNING id`;
      if(!rows.length) return send({error:'Este mismo XLS ya está almacenado en la cuenta.'},409);
      return send({ok:true,id:rows[0].id},201);
    }
    if(request.method==='DELETE') {
      const url=new URL(request.url);
      if(url.searchParams.get('all')==='1') {
        await db.sql`DELETE FROM dashboard_reports WHERE owner_id=${owner}`;
        return send({ok:true});
      }
      const id=url.searchParams.get('id')||'';
      if(!/^xls_[\w-]{5,90}$/.test(id)) return send({error:'ID inválido.'},400);
      await db.sql`DELETE FROM dashboard_reports WHERE owner_id=${owner} AND id=${id}`;
      return send({ok:true});
    }
    return send({error:'Método no permitido'},405);
  }catch(e){console.error('files:',e);return responseError(e);}
}
