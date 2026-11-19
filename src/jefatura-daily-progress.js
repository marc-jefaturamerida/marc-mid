/** Avance al corte de una fecha, a partir de ventas comisionables YA validadas.
 * Ventas: progreso acumulado sobre cantidad semanal y esperado lunes-domingo.
 * Dental: penetración entre ventas comisionables (objetivo porcentual fijo).
 * Plan Cero: penetración entre ventas regulares comisionables (objetivo porcentual fijo).
 * Los objetivos en porcentajes no se prorratean: hacerlo deformaría su denominador.
 */
const fmt = new Intl.NumberFormat('es-MX', {maximumFractionDigits:2});
const fmtDay = iso => /^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')) ? `${iso.slice(8,10)}/${iso.slice(5,7)}/${iso.slice(0,4)}` : '—';
const fmtValue = n => Number.isFinite(n) ? `${fmt.format(Number(n.toFixed(2)))}%` : '—';
const fmtGap = n => Number.isFinite(n) ? `${n>0?'+':''}${fmt.format(Number(n.toFixed(2)))}%` : '—';
const validGoal = n => typeof n==='number' && Number.isFinite(n) && n>0;
const monday = iso => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||''))) throw Error('Selecciona una fecha de trabajo válida para el reporte de Jefatura.');
  const d=new Date(iso+'T12:00:00');
  if(Number.isNaN(d.getTime()) || `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`!==iso)throw Error('Fecha de corte inválida.');
  const elapsed=(d.getDay()+6)%7+1;
  d.setDate(d.getDate()-elapsed+1);
  const weekStart=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  d.setDate(d.getDate()+6);
  const weekEnd=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {weekStart,weekEnd,elapsed};
};
const ratio=(numerator,denominator)=>denominator>0?100*numerator/denominator:null;
const metric=(actual,required)=>({actual,required,difference:Number.isFinite(actual)&&Number.isFinite(required)?actual-required:null});
export function jefaturaDailyProgress({date,rows=[],weeklySalesGoal=null,dentalGoalPct=null,p0GoalPct=null}={}) {
  const {weekStart,weekEnd,elapsed}=monday(date);
  const scoped=rows.filter(r=>r && r.fecha>=weekStart && r.fecha<=date && r.payable===true);
  const sales=scoped.length,regular=scoped.filter(r=>r.regular===true).length;
  const dental=scoped.filter(r=>r.dental===true).length;
  const p0=scoped.filter(r=>r.regular===true && r.p0===true).length;
  const saleProgress=validGoal(weeklySalesGoal)?100*sales/weeklySalesGoal:null;
  const requiredSales=validGoal(weeklySalesGoal)?100*elapsed/7:null;
  return {
    date,weekStart,weekEnd,elapsed,counts:{sales,regular,dental,p0},
    sales:metric(saleProgress,requiredSales),
    dental:metric(ratio(dental,sales),validGoal(dentalGoalPct)?dentalGoalPct:null),
    p0:metric(ratio(p0,regular),validGoal(p0GoalPct)?p0GoalPct:null)
  };
}
export function jefaturaProgressInline(snapshot){
  if(!snapshot)return '';
  const {actual,required,difference}=snapshot.sales;
  if(!Number.isFinite(actual)||!Number.isFinite(required))return 'Avance de Jefatura: sin objetivo semanal de ventas configurado para esta semana.';
  return `Hoy avanzamos ${fmtValue(actual)} sobre el objetivo de la jefatura. Deberíamos llevar ${fmtValue(required)}. Tenemos una diferencia de ${fmtGap(difference)}.`;
}
export function jefaturaProgressReport(snapshot){
  if(!snapshot)throw Error('Sin información para el avance de Jefatura.');
  const section=(name,values,note='')=>[
    `*${name}*`,
    `Alcance: ${fmtValue(values.actual)}`,
    `Requerido hoy: ${fmtValue(values.required)}`,
    `Diferencia: ${fmtGap(values.difference)}`,
    ...(note?[note]:[])
  ].join('\n');
  return [
    '*Avance y objetivo de la jefatura*',
    `Semana: ${fmtDay(snapshot.weekStart)} al ${fmtDay(snapshot.weekEnd)}`,
    `Corte: ${fmtDay(snapshot.date)} · ${snapshot.elapsed} de 7 días`,
    section('Ventas',snapshot.sales),
    section('Plan Dental',snapshot.dental),
    section('Plan Cero',snapshot.p0)
  ].join('\n\n');
}
