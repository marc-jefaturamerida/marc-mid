/** Jefatura Mid Marc · diagnóstico no destructivo previo a importar. */
const norm=v=>String(v??'').trim().normalize('NFKC').toUpperCase().replace(/\s+/g,'');
export function analyzeImportPreview(data,existing=[]){
 const seen=new Set(),before=new Set();
 for(const report of existing)for(const row of report?.rows||[]){
  if(!Array.isArray(row))continue;
  const headers=report.headers||[],get=k=>row[headers.findIndex(h=>norm(h)===norm(k))];
  const id=norm(get('Folio'));if(id)before.add(id+'|'+norm(get('Fecha')));
 }
 let duplicatesInside=0,duplicatesInHistory=0,missingDate=0,missingFolio=0,missingCode=0;
 for(const r of data.rows||[]){
  const key=norm(r.folio)+'|'+norm(r.fecha);
  if(!r.fecha)missingDate++;if(!r.folio)missingFolio++;if(!r.code)missingCode++;
  if(r.folio&&seen.has(key))duplicatesInside++;seen.add(key);
  if(r.folio&&before.has(key))duplicatesInHistory++;
 }
 return {total:data.rows.length,duplicatesInside,duplicatesInHistory,missingDate,missingFolio,missingCode,optionalMissing:data.missingOptional||[],preview:data.rows.slice(0,8).map(r=>({folio:r.folio,fecha:r.fecha,module:r.module,executive:r.executive,code:r.code}))};
}
