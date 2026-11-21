/** V2.5.7 | Carta PDF y páginas PNG del Dashboard de Jefatura. */
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const fmt=new Intl.NumberFormat('es-MX',{maximumFractionDigits:1});
const count=n=>fmt.format(Number(n)||0);
const percentage=n=>Number.isFinite(n)?fmt.format(n)+'%':'—';
const banner=(name,meta,color)=>`<header class="leader-report-banner"><h1>${esc(name)}</h1><p>${esc(meta)}</p></header>`;
const htmlTable=(headers,rows)=>`<table class="leader-export-table"><thead><tr>${headers.map(t=>`<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">Sin datos disponibles</td></tr>`}</tbody></table>`;
export const LEADERSHIP_PRINT_CSS=`
@page{size:letter portrait;margin:10mm}
.leader-report{font:10px Arial,sans-serif;color:#1c3450;background:#fff;max-width:195mm;margin:0 auto;--ldr:#003b7a}
.leader-report-banner{border-bottom:3px solid var(--ldr);padding:3px 0 8px;margin-bottom:10px}
.leader-report-banner h1{font-size:21px;color:var(--ldr);margin:0 0 3px}.leader-report-banner p{font-size:10px;color:#536b82;margin:0}
.leader-report h2{font-size:12px;background:var(--ldr);padding:6px 8px;color:#fff;margin:13px 0 5px;break-after:avoid}
.leader-report-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}
.leader-report-kpis div{border:1px solid #d1deeb;border-radius:5px;padding:8px;font-size:9px}
.leader-report-kpis b{display:block;font-size:15px;color:var(--ldr);margin-top:4px}
.leader-export-table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:8px}
.leader-export-table th,.leader-export-table td{border-bottom:1px solid #dfe8f1;padding:6px 4px;text-align:right;overflow-wrap:anywhere;word-break:normal}
.leader-export-table th{background:#edf3fa;color:#345777}.leader-export-table th:first-child,.leader-export-table td:first-child{text-align:left}
.leader-export-table tr{break-inside:avoid;page-break-inside:avoid}.leader-export-table tr:nth-child(even) td{background:#f6f9fc}
.leader-report-note{font-size:8px;color:#64748b;border-top:1px solid #d1deeb;padding-top:7px;line-height:1.4;margin-top:13px}
.leader-report-block{break-inside:auto}.leader-report-small{font-size:9px;line-height:1.5;margin:4px 0}
@media print{.leader-report{max-width:none;width:100%;margin:0;padding:0}.leader-report-banner{break-inside:avoid}}
`;
function tables(model){
 const {data,settings}=model;
 const {total,modules,people,alerts,trend}=data,sections=[];
 if(settings.showModules)sections.push(['Módulos',htmlTable(['Módulo','Registros','Ventas','Objetivo','Cumpl.','Calidad','Global'],modules.map(m=>[m.name,m.counts.records,m.counts.sales,m.goal===null?'—':count(m.goal),percentage(m.completion),percentage(m.quality),percentage(m.global)]))]);
 if(settings.showTargets)sections.push(['Objetivos operativos y origen',htmlTable(['Módulo','Indicador','Real','Meta','% logro','Origen'],modules.flatMap(m=>Object.entries(m.targets||{}).map(([key,t])=>[m.name,({sales:'Ventas',records:'Trámites',regular:'Regulares',guaranteed:'Garantizadas',dental:'Plan Dental',p0:'Programa Cero',apps:'APP',purchase:'Primera compra',quality:'Calidad Total'})[key]||key,t.unit==='percent'?percentage(t.actual):count(t.actual),t.value===null?'—':(t.unit==='percent'?percentage(t.value):count(t.value)),percentage(t.progress),t.source])))]);
 if(settings.showPeople)sections.push(['Productividad',htmlTable(['Colaborador','Módulos','Registros','Ventas','Conversión','Aporte'],people.slice(0,settings.topPeople).map(p=>[p.name,p.modules.join(' / '),p.counts.records,p.counts.sales,percentage(p.conversion),percentage(p.contribution)]))]);
 if(settings.showQuality)sections.push(['Calidad y Alcance Global',htmlTable(['Factor','Alcance real','Calidad'],[['Cumplimiento',total.actual.completion,total.factors.completion],['Primera compra',total.actual.purchase,total.factors.purchase],['Programa Cero',total.actual.p0,total.factors.p0],['APP',total.actual.app,total.factors.app],['Calidad Total',total.quality,total.quality],['Alcance Global',total.global,total.global]].map(row=>[row[0],percentage(row[1]),percentage(row[2])]))]);
 if(settings.showTrend)sections.push(['Tendencia',htmlTable(['Fecha','Registros','Ventas','P0','Dental','APP'],trend.map(t=>[t.date,t.records,t.sales,t.p0,t.dental,t.apps]))]);
 if(settings.showProjection)sections.push(['Proyección semanal · '+(settings.projectionMode==='weighted'?'ponderada':'lineal'),htmlTable(['Módulo','Proyección','% meta','Ventas por día necesarias','Origen de meta'],modules.map(m=>[m.name,m.projected===null?'No aplica':count(m.projected),percentage(m.projectedCompletion),m.dailyNeeded===null?'—':m.dailyNeeded,m.goalSource||'—']))]);
 if(settings.showAlerts)sections.push(['Alertas de seguimiento',htmlTable(['Prioridad','Módulo','Motivo'],alerts.map(a=>[a.level==='high'?'Alta':a.level==='medium'?'Media':'Informativa',a.module,a.message]))]);
 if(settings.showActions)sections.push(['Compromisos',htmlTable(['Compromiso','Módulo','Responsable','Límite','Estado','Seguimiento'],settings.actions.map(a=>[a.description,a.module||'Jefatura',a.owner,a.due,({pending:'Pendiente',inprogress:'En curso',done:'Concluido'})[a.status],a.note||'']))]);
 return sections;
}
export function leadershipReportHtml(model){
 const {data,settings}=model;
 const kpis=[['Registros',data.total.counts.records],['Ventas válidas',data.total.counts.sales],['Objetivo jefatura',data.total.goal===null?'—':count(data.total.goal)],['Cumplimiento',percentage(data.total.completion)],['Calidad Total',percentage(data.total.quality)],['Alcance Global',percentage(data.total.global)]];
 const heading=`${settings.exportSubtitle} · ${data.from} a ${data.to} · ${data.modules.length} módulos`;
 const blocks=tables(model).map(([name,markup])=>`<section class="leader-report-block"><h2>${esc(name)}</h2>${markup}</section>`).join('');
 return `<article class="leader-report" style="--ldr:${settings.color}">${banner(settings.exportTitle,heading,settings.color)}<div class="leader-report-kpis">${kpis.map(([name,value])=>`<div>${name}<b>${esc(value)}</b></div>`).join('')}</div>${blocks}<p class="leader-report-note">${esc(settings.exportNote)}</p></article>`;
}
/** PNG carta a 2x. Las tablas se dividen por hojas, sin recortar filas. */
export function leadershipPngPages(model,{scale=2}={}){
 const {data,settings}=model,W=816,H=1056,rows=[],sections=tables(model);
 const metrics=[`Registros: ${data.total.counts.records}`,`Ventas: ${data.total.counts.sales}`,`Meta: ${data.total.goal===null?'—':count(data.total.goal)}`,`Cumplimiento: ${percentage(data.total.completion)}`,`Calidad: ${percentage(data.total.quality)}`,`Global: ${percentage(data.total.global)}`];
 rows.push({kind:'top',title:settings.exportTitle,sub:`${settings.exportSubtitle} · ${data.from} a ${data.to}`});
 rows.push({kind:'metrics',value:metrics.join('    ')});
 for(const [title,markup] of sections){
  // Parse only our own generated table to preserve the exact rows in the PDF.
  const tmp=document.createElement('div');tmp.innerHTML=markup;
  const trs=[...tmp.querySelectorAll('tbody tr')];
  rows.push({kind:'head',value:title});
  const names=[...tmp.querySelectorAll('thead th')].map(h=>h.textContent||'');
  rows.push({kind:'colhead',cells:names});
  for(const tr of trs){const cells=[...tr.querySelectorAll('td')].map(c=>c.textContent||'');rows.push({kind:'row',cells});}
 }
 rows.push({kind:'note',value:settings.exportNote});
 const pages=[],heightBy={top:75,metrics:42,head:37,colhead:26,row:24,note:46},MAX_Y=H-55;
 let current=[],yy=43,lastHeading=null,lastColumns=null;
 for(let i=0;i<rows.length;i++){
  const r=rows[i],h=heightBy[r.kind]||25;
  const keepTogether=r.kind==='head'?h+heightBy.colhead+heightBy.row:h;
  if(yy+keepTogether>MAX_Y&&current.length){
   pages.push(current);current=[];yy=43;
   // En las páginas siguientes de una tabla larga, repetir su título y cabeceras.
   if(r.kind==='row'&&lastHeading&&lastColumns){
    current.push(lastHeading,lastColumns);yy+=heightBy.head+heightBy.colhead;
   }
  }
  if(r.kind==='head'){lastHeading=r;lastColumns=null;}
  if(r.kind==='colhead')lastColumns=r;
  current.push(r);yy+=h;
 }
 if(current.length)pages.push(current);
 const draw=(ctx,text,x,y,size=11,color='#24425e',bold=false,maxWidth=W-100)=>{
  ctx.font=`${bold?'bold ':''}${size}px Arial`;ctx.fillStyle=color;
  let string=String(text??'');while(string.length&&ctx.measureText(string).width>maxWidth)string=string.slice(0,-1);
  if(string!==String(text??''))string=string.slice(0,-1)+'…';ctx.fillText(string,x,y);
 };
 return pages.map((entries,i)=>{
  const canvas=document.createElement('canvas');canvas.width=W*scale;canvas.height=H*scale;
  const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='white';ctx.fillRect(0,0,W,H);
  let y=43;for(const r of entries){
   if(r.kind==='top'){draw(ctx,r.title,46,y,23,settings.color,true);y+=30;draw(ctx,r.sub,46,y,11);y+=20;ctx.fillStyle=settings.color;ctx.fillRect(45,y,726,3);y+=22;}
   else if(r.kind==='metrics'){draw(ctx,r.value,46,y,12,settings.color,true);y+=42;}
   else if(r.kind==='head'){ctx.fillStyle=settings.color;ctx.fillRect(45,y-13,726,24);draw(ctx,r.value,54,y+3,12,'#fff',true);y+=37;}
   else if(r.kind==='colhead'){ctx.fillStyle='#e8f0f8';ctx.fillRect(45,y-14,726,24);
    const names=r.cells||[];const firstWidth=250,otherWidth=names.length>1?474/(names.length-1):0;
    draw(ctx,names[0]||'',52,y,9,settings.color,true,firstWidth);
    for(let j=1;j<names.length;j++)draw(ctx,names[j],302+(j-1)*otherWidth,y,8,settings.color,true,otherWidth-7);y+=26;}
   else if(r.kind==='row'){ctx.fillStyle='#f3f7fc';if(Math.floor(y/24)%2===0)ctx.fillRect(46,y-13,724,22);
    const cells=r.cells||[],firstWidth=250;draw(ctx,cells[0]||'',52,y,10,'#263c55',true,firstWidth);
    const n=cells.length-1,fieldWidth=n?474/n:0;
    for(let j=1;j<cells.length;j++)draw(ctx,cells[j],302+(j-1)*fieldWidth,y,9,'#3b536d',false,fieldWidth-7);
    y+=24;}
   else if(r.kind==='note'){draw(ctx,r.value,46,y,9,'#687b90');y+=46;}
  }
  draw(ctx,`INVEX · MARC   |   ${i+1} / ${pages.length}`,46,H-24,9,'#64748b');
  return canvas;
 });
}
