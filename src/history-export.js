import {exportFriendlyText} from './import-date.js';
import {HISTORY_METRICS} from './individual-history.js';
const number=new Intl.NumberFormat('es-MX',{maximumFractionDigits:2});
const esc=x=>exportFriendlyText(String(x??'')).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=x=>Number.isFinite(x)?number.format(x)+'%':'—';
const periods={day:'Día',week:'Semana',month:'Mes'};
const metricValue=(r,key)=>key==='quality'?percent(r.quality):key==='global'?percent(r.global):number.format(r[key]||0);

/** El primer folio deja espacio al resumen, la gráfica y los promedios.
 * Las siguientes hojas usan todas las filas configuradas. Ningún folio se omite.
 */
export function historyPageChunks(rows,settings){
 if(!settings.showTable)return [[]];
 const landscape=settings.exportOrientation==='landscape';
 const cap=landscape?Math.min(17,settings.rowsPerPage):settings.rowsPerPage;
 const extras=(settings.showSummary?2:0)+(settings.showAverages?5:0)+(settings.showChart?5:0);
 const first=Math.max(3,cap-extras);
 const chunks=[];let cursor=0;
 chunks.push(rows.slice(0,first));cursor=chunks[0].length;
 while(cursor<rows.length){chunks.push(rows.slice(cursor,cursor+cap));cursor+=cap;}
 return chunks;
}
const chartSvg=(items,metric,color)=>{
 const list=items.slice(-24),labels=new Map(HISTORY_METRICS);
 if(!list.length)return '';
 const W=700,H=105,L=38,R=18,TOP=8,B=19;
 const values=list.map(r=>Number(r[metric])||0),max=Math.max(1,...values);
 const xx=i=>L+(list.length===1?(W-L-R)/2:i*(W-L-R)/(list.length-1));
 const yy=v=>H-B-v/max*(H-TOP-B);
 const path=values.map((v,i)=>(i?'L':'M')+xx(i).toFixed(2)+' '+yy(v).toFixed(2)).join(' ');
 const spots=values.map((v,i)=>`<circle cx="${xx(i).toFixed(2)}" cy="${yy(v).toFixed(2)}" r="2.8" fill="${color}"><title>${esc(list[i].key)} ${number.format(v)}</title></circle>`).join('');
 const ticks=list.map((r,i)=>(i===0||i===list.length-1||i%Math.max(1,Math.ceil(list.length/8))===0)?`<text x="${xx(i)}" y="${H-3}" font-size="9" text-anchor="middle" fill="#5a718b">${esc(r.key.slice(5))}</text>`:'').join('');
 return `<figure class="history-report-chart"><figcaption>Evolución · ${esc(labels.get(metric)||'Ventas')} · últimos ${list.length} períodos</figcaption><svg role="img" aria-label="Evolución histórica" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="#c5d2df"/><path d="${path}" stroke="${color}" stroke-width="2.5" fill="none"/>${spots}${ticks}</svg></figure>`;
};
export const historyPrintCss=`
@page{size:letter portrait;margin:8mm}
.history-report-page{font-family:Arial,sans-serif;color:#172a43;width:100%;max-width:var(--h-page-width,194mm);box-sizing:border-box;break-after:page;page-break-after:always;page-break-inside:avoid}
.history-report-page:last-child{break-after:auto;page-break-after:auto}
.history-report-head{border-bottom:3px solid var(--h-accent);padding:0 0 8px;margin-bottom:9px}
.history-report-head h1{font-size:17px;line-height:1.2;color:var(--h-accent);margin:0 0 4px}
.history-report-head p,.history-report-foot{font-size:9px;color:#536379;margin:4px 0;line-height:1.4}
.history-report-meta{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}
.history-report-meta div,.history-report-stat{border:1px solid #dbe5ed;border-radius:5px;padding:6px;font-size:9px}
.history-report-meta b{display:block;font-size:10px;margin-top:3px}
.history-report-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:7px 0 9px}
.history-report-stat span{display:block;color:#526a81;font-size:9px}.history-report-stat b{display:block;color:var(--h-accent);font-size:12px;margin:3px 0}
.history-report-page h2{background:var(--h-accent);color:#fff;padding:5px 8px;margin:8px 0 0;font-size:10px}
.history-report-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7.4px}
.history-report-table th,.history-report-table td{padding:5px 2px;text-align:right;border-bottom:1px solid #e3e9f0;overflow-wrap:anywhere;word-break:normal}
.history-report-table th{background:#eaf0f7;color:#304965}.history-report-table td:first-child,.history-report-table th:first-child{text-align:left}
.history-report-table tr:nth-child(even) td{background:#f6f9fc}
.history-report-chart{margin:6px 0 0}.history-report-chart figcaption{font-size:9px;font-weight:bold;color:var(--h-accent);margin:0 0 2px}
.history-report-chart svg{display:block;width:100%;height:90px}
.history-report-foot{margin-top:9px;border-top:1px solid #dce3eb;padding-top:6px}
@media print{html,body{background:white!important}.history-report-page{height:auto;box-shadow:none;margin:0;padding:0} .history-report-chart{break-inside:avoid}}
`;
export function historyReportHtml(model){
 const {analysis,kind,name,settings,from,to,module,weekdayText}=model;
 const subjectLabel=model.subjectLabel||'COLABORADOR',attributeLabel=model.attributeLabel||'Módulos',attributeKey=model.attributeKey||'modules';
 const selected=[...settings.metrics],labels=new Map(HISTORY_METRICS),rows=analysis.periods;
 const chunks=historyPageChunks(rows,settings);
 const width=settings.exportOrientation==='landscape'?'263mm':'194mm';
 return chunks.map((items,index)=>`<article class="history-report-page" style="--h-accent:${settings.color};--h-page-width:${width}">
 <header class="history-report-head"><h1>${esc(settings.exportTitle)}</h1><p>${esc(settings.exportSubtitle)} · Página ${index+1} de ${chunks.length}</p></header>
 <div class="history-report-meta"><div>${esc(subjectLabel)}<b>${esc(name)}</b></div><div>PERÍODO<b>${periods[kind]} · ${esc(from||'Inicio')} a ${esc(to||'último dato')}${module?' · '+esc(module):' · Todos los módulos'}</b></div></div>
 ${index===0&&settings.showSummary?`<div class="history-report-kpis">${[['Registros',analysis.summary.counts.records],['Ventas',analysis.summary.counts.sales],['Calidad Total',percent(analysis.summary.quality)],['Alcance Global',percent(analysis.summary.global)]].map(([label,value])=>`<div class="history-report-stat"><span>${label}</span><b>${value}</b></div>`).join('')}</div>`:''}
 ${index===0&&settings.showAverages?`<h2>Promedios históricos · períodos con registros</h2><table class="history-report-table"><thead><tr><th>Promedio</th><th>Períodos</th><th>Registros</th><th>Ventas</th><th>Calidad recalculada</th><th>Global recalculado</th></tr></thead><tbody>${[[weekdayText,analysis.sameWeekday],['Semanal',analysis.weekly],['Mensual',analysis.monthly]].map(([label,r])=>`<tr><td>${esc(label)}</td><td>${r.periods}</td><td>${r.periods?number.format(r.averages.records):'—'}</td><td>${r.periods?number.format(r.averages.sales):'—'}</td><td>${r.periods?percent(r.quality):'—'}</td><td>${r.periods?percent(r.global):'—'}</td></tr>`).join('')}</tbody></table>`:''}
 ${index===0&&settings.showChart?chartSvg(rows,settings.chartMetric,settings.color):''}
 ${settings.showTable?`<h2>Histórico por ${periods[kind].toLowerCase()} · ${rows.length} períodos</h2><table class="history-report-table"><thead><tr><th>${periods[kind]}</th>${settings.showGoalColumn?'<th>Objetivo</th>':''}${selected.map(k=>`<th>${esc(labels.get(k))}</th>`).join('')}${settings.showModuleColumn?`<th>${esc(attributeLabel)}</th>`:''}</tr></thead><tbody>${items.length?items.map(r=>`<tr><td>${esc(r.key)}</td>${settings.showGoalColumn?`<td>${(r.goal===null?'Sin objetivo configurado':number.format(r.goal))}</td>`:''}${selected.map(k=>`<td>${metricValue(r,k)}</td>`).join('')}${settings.showModuleColumn?`<td>${esc((r[attributeKey]||[]).join(', '))}</td>`:''}</tr>`).join(''):`<tr><td colspan="${1+selected.length+(settings.showGoalColumn?1:0)+(settings.showModuleColumn?1:0)}">Sin registros para la selección</td></tr>`}</tbody></table>`:''}
 <p class="history-report-foot">${esc(settings.exportNote)}</p></article>`).join('');
}
export function historyPngPages(model,{scale=2}={}){
 const {analysis,kind,name,settings,module,weekdayText}=model;
 const subjectLabel=model.subjectLabel||'Colaborador',attributeLabel=model.attributeLabel||'Módulos',attributeKey=model.attributeKey||'modules';
 const landscape=settings.exportOrientation==='landscape',W=landscape?1056:816,H=landscape?816:1056;
 const sel=settings.metrics,labels=new Map(HISTORY_METRICS),step=21;
 const chunks=historyPageChunks(analysis.periods,settings);
 const draw=(ctx,title,x,y,size=12,color='#203852',bold=false)=>{ctx.font=`${bold?'700':'400'} ${size}px Arial`;ctx.fillStyle=color;ctx.fillText(exportFriendlyText(String(title)),x,y);};
 const ellipsis=(ctx,txt,width)=>{let s=exportFriendlyText(String(txt));while(s.length&&ctx.measureText(s).width>width)s=s.slice(0,-1);return s.length<String(txt).length?s.slice(0,-1)+'…':s;};
 return chunks.map((items,index)=>{
  const canvas=document.createElement('canvas');canvas.width=W*scale;canvas.height=H*scale;const g=canvas.getContext('2d');g.scale(scale,scale);g.fillStyle='#fff';g.fillRect(0,0,W,H);
  const left=44,right=W-44,content=right-left;let y=48;
  draw(g,ellipsis(g,settings.exportTitle,content),left,y,22,settings.color,true);y+=24;
  draw(g,ellipsis(g,settings.exportSubtitle+' · Página '+(index+1)+' de '+chunks.length,content),left,y,11);y+=13;
  g.strokeStyle=settings.color;g.lineWidth=3;g.beginPath();g.moveTo(left,y);g.lineTo(right,y);g.stroke();y+=22;
  draw(g,ellipsis(g,subjectLabel+': '+name,content),left,y,12,'#132e4d',true);y+=20;
  draw(g,ellipsis(g,`${{day:'Diario',week:'Semanal',month:'Mensual'}[kind]} · ${module||'Todos los módulos'}`,content),left,y,11);y+=24;
  if(index===0&&settings.showSummary){draw(g,ellipsis(g,`Registros: ${analysis.summary.counts.records}   Ventas: ${analysis.summary.counts.sales}   Calidad: ${number.format(analysis.summary.quality)}%   Global: ${number.format(analysis.summary.global)}%`,content),left,y,12,settings.color,true);y+=34;}
  if(index===0&&settings.showAverages){draw(g,'PROMEDIOS HISTÓRICOS',left,y,12,settings.color,true);y+=21;
   for(const [label,r] of [[weekdayText,analysis.sameWeekday],['Semanal',analysis.weekly],['Mensual',analysis.monthly]]){draw(g,ellipsis(g,`${label}: ${r.periods?number.format(r.averages.sales):'—'} ventas / ${r.periods?number.format(r.averages.records):'—'} registros · Calidad ${r.periods?number.format(r.quality)+'%':'—'} · Global ${r.periods?number.format(r.global)+'%':'—'} (${r.periods} períodos)`,content),left,y,10);y+=17;}y+=14;
  }
  if(index===0&&settings.showChart){
   const chart=analysis.periods.slice(-24),metric=settings.chartMetric,max=Math.max(1,...chart.map(x=>Number(x[metric])||0));
   draw(g,`EVOLUCIÓN · ${labels.get(metric)}`,left,y,12,settings.color,true);y+=12;
   const minX=left+10,maxX=right-10,startY=y,chartH=70;
   if(chart.length){g.strokeStyle='#cbd7e2';g.lineWidth=1;g.beginPath();g.moveTo(minX,startY+chartH);g.lineTo(maxX,startY+chartH);g.stroke();
    g.strokeStyle=settings.color;g.lineWidth=2.5;g.beginPath();
    chart.forEach((r,i)=>{const x=minX+(chart.length===1?.5:i/(chart.length-1))*(maxX-minX),point=startY+chartH-(Number(r[metric])||0)/max*chartH;if(i===0)g.moveTo(x,point);else g.lineTo(x,point);});g.stroke();
   }
   y+=chartH+22;
  }
  if(settings.showTable){draw(g,'HISTÓRICO · '+subjectLabel.toUpperCase(),left,y,12,settings.color,true);y+=21;
   const cols=[['Período','key'],...(settings.showGoalColumn?[['Objetivo','goal']]:[]),...sel.map(k=>[labels.get(k),k]),...(settings.showModuleColumn?[[attributeLabel,attributeKey]]:[])];
   const w=content/cols.length;g.fillStyle='#eaf1f8';g.fillRect(left,y-14,content,22);
   cols.forEach(([label],i)=>draw(g,ellipsis(g,label,w-7),left+i*w+3,y,9,'#2e4b68',true));y+=16;
   for(const r of items){if(y+step>H-56)throw new Error('La configuración excede el espacio de la hoja. Reduce las filas por página.');g.strokeStyle='#dee8f0';g.lineWidth=.6;g.beginPath();g.moveTo(left,y+6);g.lineTo(right,y+6);g.stroke();
    cols.forEach(([,key],i)=>{const value=key==='key'?r.key:key==='goal'?(r.goal===null?'Sin objetivo configurado':number.format(r.goal)):key===attributeKey?(r[attributeKey]||[]).join(', '):metricValue(r,key);draw(g,ellipsis(g,value,w-7),left+i*w+3,y,9);});y+=step;
   }
  }
  const words=String(settings.exportNote||'').split(/\s+/),footer=[];let line='';
  g.font='400 9px Arial';for(const word of words){const candidate=line?line+' '+word:word;if(g.measureText(candidate).width>content&&line){footer.push(line);line=word;}else line=candidate;}if(line)footer.push(line);
  footer.slice(0,4).forEach((text,i)=>draw(g,text,left,H-70+i*13,9,'#64788b'));return canvas;
 });
}
