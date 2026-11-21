/** Formato uniforme de las fechas elegidas al importar registros. */
export function dateAsArchiveName(value){
  const text=String(value||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text))throw Error('Selecciona la fecha del archivo.');
  const [year,month,day]=text.split('-').map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day){
    throw Error('La fecha elegida no existe.');
  }
  return text;
}
/** Usar solo al presentar texto exportado, nunca en la lectura del archivo. */
export function exportFriendlyText(value){
  return String(value??'').replace(/\bXLSX?\b/gi,'registros manuales');
}
