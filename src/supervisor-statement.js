/* V2.4.7 · Exportación de estado de comisión del supervisor.
   Modelo único compartido por la vista para imprimir/PDF y la imagen PNG.
   No calcula de nuevo las comisiones: siempre utiliza supervisorCalculator(). */
const money=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2});
const number=new Intl.NumberFormat('es-MX',{maximumFractionDigits:1});
const mx=n=>money.format(Number(n)||0);
const pct=n=>Number.isFinite(n)?number.format(n)+'%':'—';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fix=n=>Math.round((Number(n)||0)*100)/100;
const display=n=>Number.isFinite(n)?number.format(n):'—';
const orderRows=rows=>[...rows].sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||''))||Number(a.i||0)-Number(b.i||0));

export function createSupervisorStatement(c,source){
  if(!c?.ready)return {ready:false};
  const {week,settings,goalFor,eligible,fee,guarantee,hasP0,hasDental,hasApp,incident,marked,fmtDay,dynamicAmount,printed}=source;
  const valid=r=>eligible(r);
  const rosterMap=new Map();
  for(const r of c.src.team){
    const name=String(r.executive||'Sin nombre').trim();
    if(!rosterMap.has(name))rosterMap.set(name,{name,rows:[]});
    rosterMap.get(name).rows.push(r);
  }
  const team=[...rosterMap.values()].map(({name,rows})=>{
    const paid=rows.filter(valid),goal=goalFor(week,name);
    return {cells:[name,display(paid.length),goal>0?display(goal):'—',goal>0?pct(paid.length/goal*100):'—',display(paid.filter(hasDental).length),display(paid.filter(r=>guarantee(r)==='reg'&&hasP0(r)).length),display(paid.filter(hasApp).length),display(rows.filter(incident).length)]};
  }).sort((a,b)=>String(a.cells[0]).localeCompare(String(b.cells[0]),'es'));
  team.push({cells:['TOTAL EQUIPO',display(c.teamValid.length),'—',pct(c.teamCompletion),display(c.teamValid.filter(hasDental).length),display(c.teamP0.length),display(c.teamValid.filter(hasApp).length),display(c.src.team.filter(incident).length)],kind:'total'});
  const factorDefs=[['completion','Cumplimiento'],['purchase','Primera compra'],['p0','Programa Cero'],['app','Activación APP']];
  const factors=factorDefs.map(([k,label])=>({cells:[label,pct(c.q.actual[k]),pct(settings.required[k]),pct(c.q.factors[k])]}));
  factors.push({cells:['CALIDAD TOTAL','—','—',pct(c.q.composite)],kind:'total'});
  factors.push({cells:['ALCANCE GLOBAL','—','—',pct(c.q.global)],kind:'total'});
  const extra=c.additional.find(x=>x.earned>0);
  const bonuses=[
    {cells:[`Bono base · ${settings.baseBonus===null?'sin configurar':mx(settings.baseBonus)} × alcance global${c.completion<100?' × cumplimiento (menor a 100%)':''}`,mx(c.base)]},
    {cells:[`Bono por sobrecumplimiento${extra?' · desde '+pct(extra.threshold):' · no alcanzado'}`,mx(c.extras)]},
    {cells:['TOTAL BONO',mx(c.incentiveBefore)],kind:'total'},
    {cells:[`(−) Descuento P0 del módulo (${pct(c.modulePenalty)})`,'−'+mx(c.incentiveDiscount)]},
    {cells:['BONO NETO',mx(c.incentiveNet)],kind:'total'},
    {cells:['(+) Ventas propias netas',mx(c.ownNet)]},
    {cells:[`(+) Bono por dinámica · ${c.ownDynamicBonusCount} × ${mx(dynamicAmount)}`,mx(c.ownDynamicBonus)]},
    {cells:['A PAGAR',mx(c.total)],kind:'pay'}
  ];
  const own=[
    {cells:['Ventas propias pagables',display(c.ownValid.length)]},
    {cells:['Escalón de ventas propias',c.tier?pct(c.tier.min)+' o más':'Sin escalón']},
    {cells:['Cumplimiento del equipo para tarifas',pct(c.teamCompletion)]},
    ...c.parts.map(x=>({cells:[`${x.name} · ${x.count} × ${mx(x.rate)}`,mx(x.total)]})),
    {cells:['INGRESO BRUTO',mx(c.ownGross)],kind:'total'},
    {cells:[`(−) Descuento P0 (${pct(c.ownP0Penalty)})`,'−'+mx(c.ownP0Discount)]},
    {cells:[`(−) Descuento incidencias (${pct(c.ownIncPenalty)})`,'−'+mx(c.ownIncDiscount)]},
    {cells:['TOTAL VENTAS PROPIAS',mx(c.ownNet)],kind:'total'}
  ];
  const ownList=orderRows(c.src.own),paidOwn=ownList.filter(valid);
  // Los descuentos se calculan sobre el agregado. El último folio absorbe el
  // redondeo de centavos para que la suma del neto por folio sea exactamente c.ownNet.
  let allocated=0;
  const ownFolios=ownList.map(r=>{
    const pay=valid(r),gross=pay?fix(fee(r,c)):0;
    const base=pay&&c.tier?c.tier.sale:0;
    const app=pay&&c.tier&&hasApp(r)?c.tier.app:0;
    const dental=pay&&c.tier&&hasDental(r)?c.tier.dental:0;
    const p0=pay&&c.tier&&guarantee(r)==='reg'&&hasP0(r)?c.tier.p0:0;
    const isLast=pay&&r===paidOwn[paidOwn.length-1];
    const net=pay?(isLast?fix(c.ownNet-allocated):fix(gross*(1-(c.ownP0Penalty+c.ownIncPenalty)/100))):0;
    if(pay)allocated=fix(allocated+net);
    return {cells:[r.fecha?fmtDay(r.fecha):'—',r.folio||'—',guarantee(r)==='guar'?'Garantizada':'Regular',pay?mx(base):'—',pay?mx(app):'—',pay?mx(dental):'—',pay?mx(p0):'—',mx(gross),mx(net),pay&&marked(r)?mx(dynamicAmount):'—'],valid:pay};
  });
  ownFolios.push({cells:[`${ownList.length} registros · ${paidOwn.length} pagables`,'','','','','','',mx(c.ownGross),mx(c.ownNet),mx(c.ownDynamicBonus)],kind:'total'});
  const teamFolios=orderRows(c.src.team).map(r=>({cells:[r.fecha?fmtDay(r.fecha):'—',r.executive||'—',r.folio||'—',guarantee(r)==='guar'?'Garantizada':'Regular',hasApp(r)?'Sí':'No',hasDental(r)?'Sí':'No',hasP0(r)?'Sí':'No',incident(r)?'Sí':'No',valid(r)?'Pagable':'No paga']}));
  const summary=[
    ['AP EQUIPO',display(c.teamValid.length)],
    ['OBJ. EQUIPO',display(c.goal)],
    ['CUMPLIMIENTO',pct(c.completion)],
    ['ALCANCE GLOBAL',pct(c.q.global)],
    ['A PAGAR',mx(c.total)]
  ];
  const weekLabel=source.weekLabel(week);
  const notes=[
    'Cada calidad = alcance ÷ objetivo × 100; mínimo individual configurable (60% inicialmente). Cumplimiento y P0 sin tope; Primera compra y APP topadas al 100%.',
    'Calidad Total = promedio de las cuatro calidades (máximo 100%). Alcance Global = promedio de esas cuatro calidades y Calidad Total (sin tope).',
    `Bono base × Alcance Global × mínimo(1, Cumplimiento/100); sobrecumplimiento: bono único del tramo más alto. Ventas propias ${c.includeSupervisorSales?'incluidas':'excluidas'} en Cumplimiento del módulo.`,
    'Plan Cero e incidencias descuentan antes de sumar la dinámica. El neto por folio distribuye proporcionalmente los descuentos de ventas propias; los centavos se concilian en el último folio.'
  ];
  return {ready:true,name:c.selected.name,module:c.selected.module,weekLabel,week,version:source.version,summary,factors,bonuses,team,teamCount:team.length-1,own,ownFolios,ownCount:ownList.length,teamFolios,teamCountAll:c.src.team.length,notes,printed,
    goal:c.goal,teamValid:c.teamValid.length,completion:c.completion,global:c.q.global,total:c.total,extra:c.extras};
}

const headers={factors:['Indicador','Alcance','Objetivo','% logro'],bonuses:['Concepto','Importe'],team:['Ejecutivo','AP','Objetivo','Cumpl.','Dental','P0','APP','Incid.'],own:['Concepto','Valor'],ownFolios:['Fecha','Folio','Tipo','Base','APP','Dental','P0','Bruto','Neto','Dinámica'],teamFolios:['Fecha','Ejecutivo','Folio','Tipo','APP','Dental','P0','Incid.','Estado']};
const widths={factors:[36,21,21,22],bonuses:[78,22],team:[36,8,10,10,9,8,9,10],own:[78,22],ownFolios:[11,13,12,9,8,9,8,11,11,8],teamFolios:[12,27,13,11,7,7,6,8,9]};
const titleMap={factors:'1 · Indicadores del equipo',bonuses:'2 · Bono y total',team:'Equipo',own:'Ventas propias · tarifas del escalón del equipo',ownFolios:'Folios propios',teamFolios:'Folios del equipo'};
const mkTable=(key,rows)=>`<table class="ss-table ss-${key}"><colgroup>${widths[key].map(w=>`<col style="width:${w}%">`).join('')}</colgroup><thead><tr>${headers[key].map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr class="${row.kind==='pay'?'ss-pay':row.kind==='total'?'ss-total':''}">${row.cells.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const section=(key,rows,title)=>`<section class="ss-section ss-section-${key}" data-report-section="ss-${key}"><h2>${esc(title||titleMap[key])}</h2>${mkTable(key,rows)}</section>`;
export function supervisorStatementHtml(m){
  if(!m.ready)return '<div id="printPage" class="report-page"><p>Selecciona un supervisor e importa XLS para exportar el reporte.</p></div>';
  const p=m.printed;
  return `<div id="printPage" class="report-page supervisor-statement">
    <header class="ss-banner"><div><h1>Estado de comisión · Supervisor</h1><p>Semana ${esc(m.weekLabel)}</p></div><strong>Nómina semanal</strong></header>
    <div class="ss-identities">${[['SUPERVISOR',m.name],['MÓDULO',m.module],['SEMANA',m.weekLabel],['DOCUMENTO','Simulación de comisiones']].map(([k,v])=>`<div class="ss-id"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
    <div class="ss-kpis">${m.summary.map(([label,value],i)=>`<div class="ss-kpi${i===4?' ss-highlight':''}"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('')}</div>
    ${p.search?`<p class="ss-query">Filtro de pantalla: ${esc(p.searchText||'Ninguno')}. Los folios y los cálculos se exportan completos.</p>`:''}
    <div class="ss-columns">${p.team?section('factors',m.factors):''}${p.bonus?section('bonuses',m.bonuses):''}</div>
    ${p.team?section('team',m.team,`Equipo (${m.teamCount} ejecutivos)`):''}
    ${p.own?section('own',m.own):''}
    ${p.recordsOwn?section('ownFolios',m.ownFolios,`Folios propios (${m.ownCount})`):''}
    ${p.recordsTeam?section('teamFolios',m.teamFolios,`Folios del equipo (${m.teamCountAll})`):''}
    <footer class="ss-foot"><ul>${m.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><p>Calculadora de Comisiones · V${esc(m.version)} · ${esc(m.weekLabel)} · ${esc(m.name)}</p></footer>
  </div>`;
}
export const SUPERVISOR_STATEMENT_CSS=`
/* Informe de supervisor V2.4.7 · inspirado en el modelo proporcionado por el usuario */
.report-page.supervisor-statement{width:1120px;max-width:none;padding:26px 32px 28px;color:#1c2b44;font:11px/1.32 Arial,Helvetica,sans-serif;--ss-blue:#324f83;--ss-orange:#ff934f;--ss-border:#dce3ed;--ss-pale:#ecf1f8;--ss-ink:#29446d}
.supervisor-statement .ss-banner{background:var(--ss-blue);color:#fff;border-radius:7px;border-bottom:4px solid var(--ss-orange);padding:16px 20px 13px;display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:12px}
.supervisor-statement .ss-banner h1{font-size:21px;line-height:1.15;color:#fff;margin:0 0 5px;font-weight:800;letter-spacing:-.1px}
.supervisor-statement .ss-banner p{margin:0;color:#e6eef9;font-size:11px}.supervisor-statement .ss-banner>strong{color:var(--ss-orange);font-size:14px;white-space:nowrap}
.supervisor-statement .ss-identities{display:grid;grid-template-columns:1.2fr 1.2fr 1.1fr 1.2fr;gap:7px;margin:0 0 10px}
.supervisor-statement .ss-id{min-width:0;border:1px solid #c9d6e7;border-radius:6px;padding:6px 9px;min-height:46px}
.supervisor-statement .ss-id small{display:block;font-size:8px;color:#8492a6;letter-spacing:.45px}.supervisor-statement .ss-id b{display:block;color:var(--ss-ink);font-size:10px;overflow-wrap:anywhere}
.supervisor-statement .ss-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:0 0 20px}
.supervisor-statement .ss-kpi{background:var(--ss-pale);text-align:center;padding:9px 4px 11px;border-radius:5px;min-width:0;color:var(--ss-blue)}
.supervisor-statement .ss-kpi small{display:block;font-size:8px;font-weight:700;color:#60748d}.supervisor-statement .ss-kpi strong{display:block;font-size:19px;line-height:1.25;color:var(--ss-blue)}
.supervisor-statement .ss-kpi.ss-highlight{background:var(--ss-orange)}.supervisor-statement .ss-kpi.ss-highlight small,.supervisor-statement .ss-kpi.ss-highlight strong{color:#fff}
.supervisor-statement .ss-columns{display:grid;grid-template-columns:1fr 1fr;gap:13px;align-items:start}.supervisor-statement .ss-section{margin:0 0 12px;break-inside:avoid;page-break-inside:avoid}
.supervisor-statement .ss-section h2{margin:0;padding:9px 10px 8px;background:var(--ss-blue);color:#fff;border:0;border-radius:5px 5px 0 0;font-size:12px;line-height:1.2;letter-spacing:0;font-weight:800}
.supervisor-statement .ss-section .ss-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:10px;margin:0}
.supervisor-statement .ss-table thead th{color:var(--ss-blue);background:#e6ebf4;border:0;padding:6px 6px;text-transform:none;font-size:9px;text-align:right;white-space:normal}
.supervisor-statement .ss-table thead th:first-child{text-align:left}
.supervisor-statement .ss-table tbody td{border:0;border-bottom:1px solid var(--ss-border);padding:5px 6px;text-align:right;font-size:10px;color:#2a3b58;white-space:normal;overflow-wrap:anywhere}
.supervisor-statement .ss-table tbody td:first-child{text-align:left}
.supervisor-statement .ss-table tbody tr.ss-total td{background:#f0f3f9;color:#1f365c;font-weight:800}
.supervisor-statement .ss-table tbody tr.ss-pay td{background:var(--ss-orange);color:#fff;font-weight:800;font-size:11px}
.supervisor-statement .ss-table thead{display:table-header-group}.supervisor-statement .ss-table tbody tr{break-inside:avoid;page-break-inside:avoid}
.supervisor-statement .ss-ownFolios tbody td,.supervisor-statement .ss-teamFolios tbody td{font-size:9px;padding:4px 4px}.supervisor-statement .ss-ownFolios thead th,.supervisor-statement .ss-teamFolios thead th{font-size:8px;padding:5px 4px}
.supervisor-statement .ss-foot{border:0;margin:9px 0 0;padding:0;color:#65758d;font-size:9px;break-inside:avoid}
.supervisor-statement .ss-foot ul{padding-left:15px;margin:6px 0 8px}.supervisor-statement .ss-foot li{margin-bottom:3px;line-height:1.35}
.supervisor-statement .ss-foot p{text-align:right;margin:6px 0 0;color:#97a4b5;font-size:9px}
.supervisor-statement .ss-query{color:#63758b;font-size:9px;margin:0 0 12px}
@media print{
  @page{size:A4 portrait;margin:9mm}
  .report-page.supervisor-statement{width:100%!important;padding:0!important;font-size:8px!important;print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}
  .supervisor-statement .ss-banner,.supervisor-statement .ss-section h2,.supervisor-statement .ss-pay td,.supervisor-statement .ss-kpi{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}
  .supervisor-statement .ss-section{break-inside:auto!important;page-break-inside:auto!important}
  .supervisor-statement .ss-columns .ss-section{break-inside:avoid!important;page-break-inside:avoid!important}
  .supervisor-statement .ss-table thead{display:table-header-group}
  .supervisor-statement .ss-table tbody tr{break-inside:avoid!important;page-break-inside:avoid!important}
  .supervisor-statement .ss-section h2{break-after:avoid!important;page-break-after:avoid!important}
  .supervisor-statement .ss-banner{margin-bottom:8px;padding:10px 12px}.supervisor-statement .ss-banner h1{font-size:14px;white-space:nowrap}
  .supervisor-statement .ss-identities{gap:5px;margin-bottom:6px}.supervisor-statement .ss-id{min-height:35px;padding:4px 6px}.supervisor-statement .ss-kpis{gap:5px;margin-bottom:12px}.supervisor-statement .ss-kpi{padding:5px 3px}.supervisor-statement .ss-kpi strong{font-size:16px}
  .supervisor-statement .ss-columns{gap:8px}
  .supervisor-statement .ss-section{margin-bottom:8px}.supervisor-statement .ss-section h2{font-size:9px;padding:5px 6px}
  .supervisor-statement .ss-table thead th{font-size:7px;padding:3px}.supervisor-statement .ss-table tbody td{font-size:7px;padding:3px}
  .supervisor-statement .ss-ownFolios tbody td,.supervisor-statement .ss-teamFolios tbody td{font-size:6.5px;padding:2px}.supervisor-statement .ss-ownFolios thead th,.supervisor-statement .ss-teamFolios thead th{font-size:6.5px;padding:2px}
  .supervisor-statement .ss-foot{font-size:7px}.supervisor-statement .ss-foot p{font-size:7px}
}
`;

/* Pintor vectorial a Canvas, sin librerías ni capturas HTML y con los mismos datos del PDF. */
export function paintSupervisorStatement(ctx,draw,m){
  const W=1120,margin=32,usable=W-margin*2;
  const blue='#324f83',orange='#ff934f',pale='#edf1f8',gray='#dce3ed',ink='#263a5c';
  let y=25;
  const font=(size=11,bold=false)=>`${bold?'bold ':''}${size}px Arial, sans-serif`;
  const rect=(x,z,w,h,c)=>{if(!draw)return;ctx.fillStyle=c;ctx.fillRect(x,z,w,h);};
  const text=(s,x,z,size=11,bold=false,c=ink,align='left')=>{if(!draw)return;ctx.font=font(size,bold);ctx.fillStyle=c;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(String(s??''),x,z);ctx.textAlign='left';};
  function wrap(s,max,size=10,bold=false){
    ctx.font=font(size,bold);const parts=String(s??'').split(/\s+/).filter(Boolean);const lines=[];let line='';
    for(let word of parts){
      let next=line?line+' '+word:word;
      if(ctx.measureText(next).width<=max){line=next;continue;}
      if(line)lines.push(line);
      line=word;
      while(line.length>1&&ctx.measureText(line).width>max){let i=1;while(i<line.length&&ctx.measureText(line.slice(0,i+1)).width<=max)i++;lines.push(line.slice(0,i));line=line.slice(i);}
    }
    if(line)lines.push(line);return lines.length?lines:[''];
  }
  const drawWrap=(s,x,z,max,size=10,bold=false,c=ink,leading=13)=>{const lines=wrap(s,max,size,bold);lines.forEach((line,i)=>text(line,x,z+i*leading,size,bold,c));return lines.length*leading;};
  rect(margin,y,usable,69,blue);rect(margin,y+65,usable,4,orange);
  text('Estado de comisión · Supervisor',margin+17,y+15,21,true,'#fff');text('Semana '+m.weekLabel,margin+17,y+43,11,false,'#e5edf7');text('Nómina semanal',margin+usable-15,y+27,14,true,orange,'right');
  y+=79;const identities=[['SUPERVISOR',m.name],['MÓDULO',m.module],['SEMANA',m.weekLabel],['DOCUMENTO','Simulación de comisiones']];
  const idgap=7,idW=(usable-3*idgap)/4;
  identities.forEach(([label,value],i)=>{const x=margin+i*(idW+idgap);rect(x,y,idW,44,'#edf2f9');text(label,x+8,y+5,9,true,'#6c7d92');const lines=wrap(value,idW-16,10,true).slice(0,2);lines.forEach((line,j)=>text(line,x+8,y+19+j*12,10,true,blue));});
  y+=53;const kpiGap=7,kpiW=(usable-kpiGap*4)/5;
  m.summary.forEach(([label,value],i)=>{const x=margin+i*(kpiW+kpiGap);rect(x,y,kpiW,65,i===4?orange:pale);text(label,x+kpiW/2,y+9,9,true,i===4?'#fff':'#61738b','center');text(value,x+kpiW/2,y+30,18,true,i===4?'#fff':blue,'center');});
  y+=82;
  if(m.printed.search){y+=drawWrap('Filtro de pantalla: '+(m.printed.searchText||'Ninguno')+' (no altera cálculos ni folios exportados)',margin,y,usable,10,false,'#52677d',14)+4;}
  function table(key,rows,x,start,w,sectionTitle){
    let z=start;rect(x,z,w,29,blue);text(sectionTitle,x+10,z+8,12,true,'#fff');z+=29;
    const share=widths[key].map(v=>v/100*w),heads=headers[key];
    rect(x,z,w,26,'#e8edf5');let xx=x;
    heads.forEach((h,i)=>{const a= i===0?'left':'right';const tx=i===0?xx+6:xx+share[i]-6;text(h,tx,z+8,9,true,blue,a);xx+=share[i];});z+=26;
    rows.forEach(row=>{
      const values=row.cells,kind=row.kind;
      const fontSize=(key==='ownFolios'||key==='teamFolios')?9:10;
      const lh=fontSize+4;
      const linearr=values.map((value,i)=>wrap(value,share[i]-12,fontSize,kind==='total'||kind==='pay'));
      const rowH=Math.max(24,Math.max(...linearr.map(a=>a.length))*lh+9);
      rect(x,z,w,rowH,kind==='pay'?orange:kind==='total'?pale:'#fff');
      let xx=x;
      linearr.forEach((ls,i)=>{ls.forEach((s,j)=>text(s,i===0?xx+6:xx+share[i]-6,z+5+j*lh,fontSize,!!kind,kind==='pay'?'#fff':ink,i===0?'left':'right'));xx+=share[i];});
      rect(x,z+rowH-1,w,1,gray);z+=rowH;
    });return z;
  }
  if(m.printed.team||m.printed.bonus){
    const split=12,w=(usable-split)/2;
    const yLeft=m.printed.team?table('factors',m.factors,margin,y,w,titleMap.factors):y;
    const yRight=m.printed.bonus?table('bonuses',m.bonuses,margin+w+split,y,w,titleMap.bonuses):y;
    y=Math.max(yLeft,yRight)+15;
  }
  if(m.printed.team){y=table('team',m.team,margin,y,usable,`Equipo (${m.teamCount} ejecutivos)`)+13;}
  if(m.printed.own){y=table('own',m.own,margin,y,usable,titleMap.own)+13;}
  if(m.printed.recordsOwn){y=table('ownFolios',m.ownFolios,margin,y,usable,`Folios propios (${m.ownCount})`)+13;}
  if(m.printed.recordsTeam){y=table('teamFolios',m.teamFolios,margin,y,usable,`Folios del equipo (${m.teamCountAll})`)+13;}
  y+=5;
  for(const note of m.notes){text('•',margin,y,10,true,'#63748a');y+=drawWrap(note,margin+12,y,usable-18,10,false,'#5b7089',14)+4;}
  y+=12;text(`Calculadora de Comisiones · V${m.version} · ${m.weekLabel} · ${m.name}`,margin+usable,y,10,false,'#96a5b7','right');
  return {width:W,height:Math.ceil(y+34)};
}
