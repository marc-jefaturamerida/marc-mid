/**
 * Informe administrativo de LOGROS SEMANALES (no depende de Calculadora supervisor).
 * Dibuja una hoja carta real (612x792) por cada 50 ventas completadas.
 * PDF y PNG comparten exactamente el mismo lienzo, sin pie posterior a las firmas.
 */
export const WEEKLY_ADMIN_WIDTH=612;
export const WEEKLY_ADMIN_HEIGHT=792;
const W=612,H=792,L=27,R=585,CW=558;
const BLUE='#093D75',INK='#192F49',GRAY='#6C7C91',LIGHT='#DCE4EF',PALE='#F0F5FB',WHITE='#FFFFFF';
export const WEEKLY_ADMIN_STORAGE='wmSamsWeeklyAdminReportV252';
export const WEEKLY_ADMIN_DEFAULTS=Object.freeze({
  title:'SEGUIMIENTO ADMINISTRATIVO SEMANAL',
  subtitlePrefix:'Semana operativa',
  coordinator:'AZAMAR DEL ANGEL',supervisorOverride:'',moduleOverride:'',city:'Mérida',
  identificationTitle:'DATOS DE IDENTIFICACIÓN',goalsTitle:'OBJETIVOS DESIGNADOS Y ALCANCE LOGRADO',
  recordsTitle:'VENTAS COMPLETADAS',opportunitiesTitle:'ÁREAS DE OPORTUNIDAD',
  commentsTitle:'COMENTARIOS Y RESULTADOS DE LA SEMANA',
  planTitle:'PLAN DE TRABAJO PARA LA SIGUIENTE SEMANA',
  handwrittenTitle:'COMENTARIOS, PLAN DE TRABAJO Y FIRMAS',
  coordinatorRole:'COORDINADOR',supervisorRole:'SUPERVISOR(A) · FIRMA',
  showLogos:true,showSignature:true,showTotals:true,showSummary:true,showRecordsGoal:true,
  showIncidentRows:true,showDynamicRows:true,showQuality:true,
  commentsLines:4,planLines:4,mainColor:'#093D75'
});
const FIELDS=Object.keys(WEEKLY_ADMIN_DEFAULTS);
const HEX=/^#[0-9a-fA-F]{6}$/;
const str=x=>String(x??'').replace(/\s+/g,' ').trim();
export function cleanWeeklyAdminSettings(raw){
  const result={...WEEKLY_ADMIN_DEFAULTS};
  if(!raw||typeof raw!=='object')return result;
  for(const key of FIELDS){
    const value=raw[key],fallback=result[key];
    if(typeof fallback==='boolean'){if(typeof value==='boolean')result[key]=value;}
    else if(typeof fallback==='number'){if(Number.isInteger(value)&&value>=2&&value<=8)result[key]=value;}
    else if(key==='mainColor'){if(typeof value==='string'&&HEX.test(value))result[key]=value;}
    else if(typeof value==='string')result[key]=str(value).slice(0,150);
  }
  if(!result.title)result.title=WEEKLY_ADMIN_DEFAULTS.title;
  if(!result.coordinator)result.coordinator=WEEKLY_ADMIN_DEFAULTS.coordinator;
  return result;
}
export function weeklyAdminPageCount(model){return Math.max(1,Math.ceil((model?.records?.length||0)/50));}
let imageCache=null,imageLoad=null;
const imageFrom=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('No se pudo cargar '+url));img.src=url;});
export function preloadWeeklyAdminAssets(){
  if(imageCache)return Promise.resolve(imageCache);
  if(!imageLoad)imageLoad=Promise.all([imageFrom('/assets/visit-header.png'),imageFrom('/assets/visit-signature.png')]).then(([header,signature])=>imageCache={header,signature}).catch(e=>{imageLoad=null;throw e;});
  return imageLoad;
}
export const cachedWeeklyAdminAssets=()=>imageCache;
export const weeklyAdminPrintCss=`
@media print{
  @page{size:letter portrait;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  body>.shell,body>.floating-export,body>.auth-modal,body>.cloud-toast,body>#xlsMondayReminder{display:none!important}
  #reportHost.report-host{display:block!important;position:static!important;left:auto!important;top:auto!important;width:8.5in!important;min-width:0!important;height:auto!important;overflow:visible!important;pointer-events:auto!important;z-index:auto!important}
  #printPage.weekly-admin-print{display:block!important;width:8.5in!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}
  #printPage .weekly-admin-paper{display:block!important;width:8.5in!important;height:11in!important;max-width:none!important;margin:0!important;padding:0!important;page-break-inside:avoid!important;break-inside:avoid!important;page-break-after:always!important;break-after:page!important}
  #printPage .weekly-admin-paper:last-child{page-break-after:auto!important;break-after:auto!important}
}`;
export function weeklyAdminPageMarkup(canvases){
  return `<div id="printPage" class="weekly-admin-print">${canvases.map((canvas,i)=>`<img class="weekly-admin-paper" alt="Seguimiento administrativo semanal, hoja ${i+1} de ${canvases.length}" width="612" height="792" src="${canvas.toDataURL('image/png')}"/>`).join('')}</div>`;
}
const percent=n=>Number.isFinite(n)?`${n.toFixed(1)}%`:'—';
const countText=n=>Number.isFinite(n)?String(n):'—';
/** The rendering model is made from Logros semanales' filtered records and goals. */
export function renderWeeklyAdminSheets(model,assets,{scale=3}={}){
  if(!model?.ready)throw Error(model?.reason||'Selecciona una semana y carga los registros de Logros semanales.');
  if(!assets?.header||!assets?.signature)throw Error('No se encuentran logotipos o firma de Visitas de coordinación.');
  const rows=Array.isArray(model.records)?model.records:[];
  const total=weeklyAdminPageCount(model),pages=[];
  if(!(scale>=1&&scale<=4))throw Error('La escala debe ser de 1 a 4.');
  for(let i=0;i<total;i++){
    const canvas=document.createElement('canvas');canvas.width=W*scale;canvas.height=H*scale;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo crear la imagen del reporte.');
    ctx.scale(scale,scale);ctx.fillStyle=WHITE;ctx.fillRect(0,0,W,H);
    paintPage(ctx,model,rows.slice(i*50,(i+1)*50),i,total,assets);
    pages.push(canvas);
  }
  return pages;
}
function paintPage(ctx,model,records,idx,total,assets){
  const cfg=cleanWeeklyAdminSettings(model.settings),NAVY=cfg.mainColor;
  const rect=(x,y,w,h,color=WHITE,rad=0,stroke=null)=>{
    ctx.beginPath();ctx.roundRect(x,H-y-h,w,h,rad);ctx.fillStyle=color;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.55;ctx.stroke();}
  };
  const line=(x,y,x2,y2,color=LIGHT,width=.55)=>{ctx.beginPath();ctx.moveTo(x,H-y);ctx.lineTo(x2,H-y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  const text=(x,y,raw,size=8,color=INK,bold=false,align='left',maxW=null)=>{
    ctx.font=`${bold?'bold ':''}${size}px Arial, sans-serif`;
    ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';
    const full=str(raw);let content=full;
    if(maxW){while(content.length>1&&ctx.measureText(content).width>maxW)content=content.slice(0,-1);if(content.length<full.length)content=content.slice(0,-1)+'…';}
    ctx.fillText(content,x,H-y);ctx.textAlign='left';
  };
  const heading=(y,label,note='')=>{text(L,y,label,9,NAVY,true,L===R?'center':'left',375);if(note)text(R,y,note,6.5,GRAY,false,'right',180);};
  const yes=v=>v?'Sí':'—';
  const label=(x,y,title,value,width)=>{text(x,y,title,6.3,GRAY,true);text(x,y-12,value,8.8,INK,true,'left',width);};
  // Header + identification: logo is the same original file used by coordination visits.
  rect(0,715,W,77,'#F8FBFE');
  if(cfg.showLogos)ctx.drawImage(assets.header,L,H-731-47,166,47);
  const titleX=cfg.showLogos?208:L;
  text(titleX,765,cfg.title,12.5,NAVY,true,'left',R-titleX);
  text(titleX,748,`${cfg.subtitlePrefix||'Semana operativa'}: ${model.weekLabel}`,8.25,INK,false,'left',R-titleX);
  text(titleX,734,`${model.records.length} ventas completadas · Hoja ${idx+1} de ${total}`,7.0,GRAY);
  line(L,715,R,715,NAVY,1);
  heading(703,cfg.identificationTitle);
  label(L,690,'SUPERVISOR(A)',cfg.supervisorOverride||model.supervisor||'Sin asignación',184);
  label(221,690,'MÓDULO',cfg.moduleOverride||model.module||'Todos los módulos',183);
  label(421,690,'COORDINADOR',cfg.coordinator,159);
  text(L,661,`Jefatura: ${cfg.city}`,7,GRAY,false,'left',180);
  text(221,661,`Objetivo de ventas: ${countText(model.goals?.sales)}`,7,GRAY,false,'left',183);
  text(421,661,`${model.validSales} ventas sin incidencia`,7,GRAY,false,'left',160);
  line(L,655,R,655);
  heading(644,cfg.goalsTitle,'Objetivo semanal vs. alcance real');
  const columns=[{x:L,w:185,name:'INDICADOR'},{x:L+185,w:92,name:'BASE'},{x:L+277,w:79,name:'OBJETIVO'},{x:L+356,w:73,name:'ALCANCE'},{x:L+429,w:65,name:'CALIDAD'},{x:L+494,w:64,name:'ESTADO'}];
  rect(L,611,CW,15,NAVY,3);
  for(const column of columns)text(column.name==='INDICADOR'?column.x+5:column.x+column.w/2,616,column.name,6.25,WHITE,true,column.name==='INDICADOR'?'left':'center');
  const metrics=[...model.metrics];
  if(cfg.showQuality){metrics.push({label:'Calidad Total',base:'Prom. 4',objective:'Máx. 100%',reach:null,quality:model.qualityTotal,below:null,status:'Topada'});metrics.push({label:'Alcance Global',base:'Prom. 5',objective:'Sin tope',reach:null,quality:model.global,below:null,status:'Sin tope'});}
  const rh=9.55;
  metrics.forEach((m,i)=>{
    const y=611-(i+1)*rh,final=i===metrics.length-1;
    rect(L,y,CW,rh,final?'#E7F0FB':i%2?'#FFF':'#F4F8FC');
    const vals=[m.label,m.base,m.objective,percent(m.reach),percent(m.quality),m.status||'—'];
    for(let j=0;j<vals.length;j++){
      const col=columns[j];text(j===0?col.x+5:col.x+col.w/2,y+2.5,vals[j],j===0?6.55:6.4,j===5&&m.below? '#B44A44' :final?NAVY:INK,final,j===0?'left':'center',col.w-7);
    }
    line(L,y,R,y,'#E9EEF5',.25);
  });
  const bottomMetric=611-metrics.length*rh;
  if(cfg.showSummary){
    rect(L,bottomMetric-16,CW,13,'#EEF4FC',3);
    const detail=`Detalle: ${model.regular} regulares · ${model.guaranteed} garantizadas · ${model.dental} Dental · ${model.p0} Cero · ${model.apps} APP · ${model.incidents} incidencias · ${model.dynamic} dinámicas`;
    text(L+7,bottomMetric-12,detail,7.0,NAVY,true,'left',CW-12);
  }
  const recordsHeading=bottomMetric-(cfg.showSummary?29:14);
  heading(recordsHeading,`${cfg.recordsTitle} · ${model.records.length} folios`,`Hoja ${idx+1} / ${total}`);
  text(L,recordsHeading-13.5,'Dental: Plan Dental · Cero: Programa Cero · APP: activada · Inc.: incidencia · Din.: bono por dinámica',6.45,GRAY);
  const tableTop=recordsHeading-21;
  const left=records.slice(0,Math.ceil(records.length/2));
  const right=records.slice(Math.ceil(records.length/2));
  const widths=[38,72,33,29,31,32,37],tableW=widths.reduce((a,b)=>a+b,0),headH=14,rowH=7.45,totalH=10;
  const maxRows=Math.max(left.length,right.length);
  function drawTable(x,items){
    rect(x,tableTop-headH,tableW,headH,NAVY,3);
    let at=x;['Fecha','Folio','Dental','Cero','APP','Inc.','Din.'].forEach((title,i)=>{text(at+widths[i]/2,tableTop-9.5,title,6.3,WHITE,true,'center');at+=widths[i];});
    let y=tableTop-headH;
    for(const [j,r] of items.entries()){
      y-=rowH;rect(x,y,tableW,rowH,j%2===0?'#F5F8FC':WHITE);
      if(cfg.showIncidentRows&&r.incident)rect(x+widths.slice(0,5).reduce((a,b)=>a+b,0),y,widths[5],rowH,'#FEF0E9');
      let colX=x;const values=[r.date,r.folio,yes(r.dental),yes(r.p0),yes(r.app),yes(cfg.showIncidentRows&&r.incident),yes(cfg.showDynamicRows&&r.dynamic)];
      values.forEach((v,i)=>{text(colX+widths[i]/2,y+1.7,v,6.1,i===5&&r.incident?'#B44A44':i===6&&r.dynamic?'#227553':INK,i>4&&v==='Sí','center',widths[i]-2);colX+=widths[i];});
      line(x,y,x+tableW,y,'#E6ECF3',.25);
    }
    y-=totalH;
    if(cfg.showTotals){rect(x,y,tableW,totalH,'#E8F0FA',2);text(x+4,y+2.8,`${items.length} FOLIOS`,6.6,NAVY,true);text(x+tableW-4,y+2.8,`PD ${items.filter(r=>r.dental).length} | P0 ${items.filter(r=>r.p0).length} | APP ${items.filter(r=>r.app).length}`,6.3,NAVY,true,'right');}
    return y;
  }
  drawTable(L,left);drawTable(L+284,right);
  const tableBottom=tableTop-headH-maxRows*rowH-totalH;
  const oppTitleY=tableBottom-6.8;
  heading(oppTitleY,cfg.opportunitiesTitle,'Marcado = alcance menor al requerido');
  const chipsY=oppTitleY-19.5,chipH=14;
  const opp=model.opportunities||[];
  // One row, starting at the RIGHT and going LEFT as requested.
  let chipRight=R;const chipW=[77,77,77,77,86,77,87];
  for(let i=opp.length-1;i>=0;i--){
    const item=opp[i],width=chipW[i]||75,x=chipRight-width;
    rect(x,chipsY,width-4,chipH,'#F4F7FB',3);
    rect(x+5,chipsY+3.4,7,7,WHITE,0,NAVY);
    if(item.below===true){line(x+6.2,chipsY+6.5,x+8.1,chipsY+4.5,NAVY,1.2);line(x+8.1,chipsY+4.5,x+11,chipsY+9.2,NAVY,1.2);}
    text(x+16,chipsY+4.4,item.label,6.6,INK,item.below===true,'left',width-21);
    chipRight=x;
  }
  const writingHeading=chipsY-10.5;
  heading(writingHeading,cfg.handwrittenTitle);
  const topWriting=writingHeading-6.7;
  const bottomWriting=114;
  const gap=7;
  const writingHeight=(topWriting-bottomWriting-gap)/2;
  if(writingHeight<46)throw Error('El formato semanal no cabe en una sola hoja carta con los registros actuales.');
  const planY=bottomWriting,commentY=bottomWriting+writingHeight+gap;
  function box(y,h,labelText,lineCount){
    rect(L,y,CW,h,WHITE,4,LIGHT);
    rect(L+4,y+h-17,215,11,PALE,2);
    text(L+9,y+h-13.8,labelText,6.85,NAVY,true,'left',205);
    const first=y+h-27,last=y+9;
    for(let j=0;j<lineCount;j++){
      const at=lineCount===1?last:first-(first-last)*j/(lineCount-1);
      line(L+9,at,R-9,at,'#C4CFDE',.55);
    }
  }
  box(commentY,writingHeight,cfg.commentsTitle,cfg.commentsLines);
  box(planY,writingHeight,cfg.planTitle,cfg.planLines);
  // The signature sits at the bottom. Nothing is rendered below the signature labels.
  if(cfg.showSignature)ctx.drawImage(assets.signature,L+61,H-70-41,130,41);
  line(L+10,70,L+248,70,'#8798AC',.8);
  line(L+297,70,L+535,70,'#8798AC',.8);
  text(L+129,58,cfg.coordinator,9,NAVY,true,'center',230);
  text(L+129,47,cfg.coordinatorRole,7.2,GRAY,true,'center');
  text(L+416,58,cfg.supervisorOverride||model.supervisor||'SUPERVISOR(A)',8.6,INK,true,'center',230);
  text(L+416,47,cfg.supervisorRole,7.2,GRAY,true,'center');
}
