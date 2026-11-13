/**
 * Seguimiento administrativo semanal, tamaño carta (612 × 792 pt).
 * Una hoja contiene hasta 50 folios completos, en dos tablas de 25.
 * PDF (imprimir) y PNG comparten el mismo dibujo; no hay datos ficticios.
 * No se añaden leyendas, versiones ni avisos después de las firmas.
 */
const WIDTH=612, HEIGHT=792, LEFT=27, RIGHT=585, CONTENT=558;
const C={blue:'#093D75',mid:'#0B5896',ink:'#192F49',muted:'#6C7C91',line:'#DCE4EF',pale:'#F0F5FB',green:'#227553',red:'#B44A44',white:'#FFFFFF',orange:'#F68D49'};
let cachedAssets=null;
let loadingAssets=null;
function imageFrom(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error(`No se pudo cargar el recurso ${url}`));img.src=url;});}
export function preloadWeeklyAdminAssets(){
  if(cachedAssets)return Promise.resolve(cachedAssets);
  if(!loadingAssets)loadingAssets=Promise.all([
    imageFrom('/assets/visit-header.png'),imageFrom('/assets/visit-signature.png')
  ]).then(([header,signature])=>cachedAssets={header,signature}).catch(e=>{loadingAssets=null;throw e;});
  return loadingAssets;
}
export const getCachedWeeklyAdminAssets=()=>cachedAssets;
export const weeklyAdminPrintCss=`
@media print{
  @page{size:letter portrait;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  body>.shell,body>.floating-export,body>.auth-modal,body>.cloud-toast{display:none!important}
  #reportHost.report-host{display:block!important;position:static!important;left:auto!important;top:auto!important;width:8.5in!important;pointer-events:auto!important;z-index:auto!important}
  #printPage.weekly-admin-print{display:block!important;width:8.5in!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}
  #printPage .weekly-admin-paper{display:block!important;width:8.5in!important;height:11in!important;max-width:none!important;margin:0!important;padding:0!important;page-break-inside:avoid!important;break-inside:avoid!important;page-break-after:always!important;break-after:page!important}
  #printPage .weekly-admin-paper:last-child{page-break-after:auto!important;break-after:auto!important}
}`;
export const weeklyAdminPageMarkup=canvases=>`<div id="printPage" class="weekly-admin-print">${canvases.map((canvas,i)=>`<img class="weekly-admin-paper" alt="Seguimiento administrativo semanal, hoja ${i+1} de ${canvases.length}" width="612" height="792" src="${canvas.toDataURL('image/png')}"/>`).join('')}</div>`;

const safe=v=>String(v??'').replace(/\s+/g,' ').trim();
const percentage=v=>Number.isFinite(v)?`${v.toFixed(1)}%`:'—';
function pageChunks(rows){const items=Array.isArray(rows)?rows:[];const pages=[];for(let i=0;i<items.length;i+=50)pages.push(items.slice(i,i+50));return pages.length?pages:[[]];}
export function weeklyAdminPageCount(model){return pageChunks(model.records).length;}

/** Scale 1 = 612×792 px. Scale 3 provides sharp PNG and browser PDF. */
export function renderWeeklyAdminSheets(model,assets,{scale=3}={}){
  if(!model?.ready)throw Error(model?.reason||'Selecciona un supervisor y una semana con datos.');
  if(!assets?.header||!assets?.signature)throw Error('Faltan los logotipos o la firma original de coordinación.');
  const chunks=pageChunks(model.records);
  return chunks.map((chunk,index)=>{
    const canvas=document.createElement('canvas');canvas.width=Math.round(WIDTH*scale);canvas.height=Math.round(HEIGHT*scale);
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo crear el lienzo del reporte.');
    ctx.scale(scale,scale);ctx.fillStyle=C.white;ctx.fillRect(0,0,WIDTH,HEIGHT);
    paintSheet(ctx,model,chunk,index,chunks.length,assets);
    return canvas;
  });
}
function paintSheet(ctx,model,records,pageIndex,pageCount,assets){
  // Coordenadas equivalentes a la hoja carta real; y se mide desde abajo.
  const rect=(x,y,w,h,fill=C.white,r=0,stroke=null)=>{
    ctx.beginPath();ctx.roundRect(x,HEIGHT-y-h,w,h,r);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke();}
  };
  const line=(x,y,x2,y2,color=C.line,thick=.65)=>{ctx.beginPath();ctx.moveTo(x,HEIGHT-y);ctx.lineTo(x2,HEIGHT-y2);ctx.lineWidth=thick;ctx.strokeStyle=color;ctx.stroke();};
  const text=(x,y,str,size=8,color=C.ink,bold=false,align='left',narrow=false,maxWidth=null)=>{
    ctx.font=`${bold?'700 ':'400 '}${size}px ${narrow?'"Arial Narrow", ':''}Arial, sans-serif`;
    ctx.textBaseline='alphabetic';ctx.fillStyle=color;ctx.textAlign=align;
    let s=safe(str);
    if(maxWidth){while(s.length>1&&ctx.measureText(s).width>maxWidth)s=s.slice(0,-1);if(s!==safe(str))s=s.slice(0,-1)+'…';}
    ctx.fillText(s,x,HEIGHT-y);ctx.textAlign='left';
  };
  const rule=y=>line(LEFT,y,RIGHT,y);
  const heading=(y,title,right='')=>{text(LEFT,y,title,9.1,C.blue,true);if(right)text(RIGHT,y,right,6.8,C.muted,false,'right');};
  function drawImage(img,x,y,w,h){ctx.drawImage(img,x,HEIGHT-y-h,w,h);}
  function label(x,y,title,value,maxWidth){text(x,y,title,6.4,C.muted,true);text(x,y-12,value,8.8,C.ink,true,'left',true,maxWidth);}
  rect(0,715,WIDTH,77,'#F8FBFE');drawImage(assets.header,LEFT,731,166,47);
  text(210,765,'SEGUIMIENTO ADMINISTRATIVO SEMANAL',12.5,C.blue,true);
  text(210,748,'Semana operativa: '+model.weekLabel,8.5,C.ink);
  const folioCount=model.records.length;
  text(210,734,`Ventas completadas: ${folioCount} · Hoja ${pageIndex+1} de ${pageCount}`,7.15,C.muted);
  line(LEFT,715,RIGHT,715,C.mid,1.0);
  heading(703,'DATOS DE IDENTIFICACIÓN');
  label(LEFT,690,'SUPERVISOR(A)',model.supervisor,187);
  label(221,690,'MÓDULO',model.module,186);
  label(421,690,'COORDINADOR','AZAMAR DEL ANGEL',162);
  text(LEFT,661,'Jefatura: Mérida',7.1,C.muted);
  text(221,661,`Objetivo semanal: ${model.goal||'Sin definir'} ventas`,7.1,C.muted);
  text(421,661,`${model.validSales} ventas válidas`,7.1,C.muted);
  rule(655);

  heading(644,'OBJETIVOS DESIGNADOS Y ALCANCE LOGRADO','Mín. individual editable · Calidad según configuración');
  const cols=[{x:LEFT,w:204,label:'INDICADOR'},{x:LEFT+204,w:77,label:'BASE'},{x:LEFT+281,w:66,label:'OBJETIVO'},{x:LEFT+347,w:70,label:'ALCANCE'},{x:LEFT+417,w:65,label:'CALIDAD'},{x:LEFT+482,w:74,label:'ESTADO'}];
  rect(LEFT,615,CONTENT,15,C.blue,3);
  for(const cc of cols)text(cc.label==='INDICADOR'?cc.x+5:cc.x+cc.w/2,620,cc.label,6.65,C.white,true,cc.label==='INDICADOR'?'left':'center');
  const metrics=[...model.metrics,
    {label:'Calidad Total',base:'Prom. 4',objective:'—',reach:'—',quality:percentage(model.qualityTotal),status:'Máx. 100%'},
    {label:'ALCANCE GLOBAL',base:'Prom. 5',objective:'—',reach:'—',quality:percentage(model.global),status:'Sin tope'}];
  const rowHeight=11.4;
  metrics.forEach((metric,i)=>{
    const y=615-(i+1)*rowHeight;
    rect(LEFT,y,CONTENT,rowHeight,i===metrics.length-1?'#E7F0FB':i%2===0?'#F5F8FC':C.white);
    const values=[metric.label,metric.base,metric.objective,metric.reach,metric.quality,metric.status];
    values.forEach((value,k)=>{
      const col=cols[k],end=i===metrics.length-1;
      text(k===0?col.x+6:col.x+col.w/2,y+3.1,value,k===0?7.15:6.9,(k===5&&metric.below)?C.red:end?C.blue:C.ink,end,k===0?'left':'center',false,k===0?198:col.w-3);
    });
    line(LEFT,y,RIGHT,y,'#EDF1F6',.3);
  });
  rect(LEFT,531,CONTENT,14,'#EEF4FC',3);
  const summary=`Detalle: ${model.regular} regulares · ${model.guaranteed} garantizadas · ${model.dental} Dental · ${model.p0} Cero · ${model.apps} APP · ${model.incidents} incidencias · ${model.dynamic} dinámicas`;
  text(LEFT+7,535.2,summary,7.0,C.blue,true,'left',true,CONTENT-13);

  heading(520,'VENTAS COMPLETADAS',`2 tablas · ${model.records.length} folios en la semana`);
  text(LEFT,508.5,'Dental = Plan Dental · Cero = Plan Cero · APP = Activación · Inc. = Incidencia · Din. = Bono por dinámica',6.65,C.muted,false,'left',true);
  const tableTop=502,headH=15,rowH=8.3,totalH=11, widths=[37,69,32,28,31,35,40],tableW=widths.reduce((a,b)=>a+b,0);
  function table(x,data){
    rect(x,tableTop-headH,tableW,headH,C.blue,3);
    let xx=x;['Fecha','Folio','Dental','Cero','APP','Inc.','Din.'].forEach((h,i)=>{text(xx+widths[i]/2,tableTop-10.2,h,6.7,C.white,true,'center',true);xx+=widths[i];});
    let y=tableTop-headH;
    for(let row=0;row<25;row++){
      y-=rowH;const r=data[row];rect(x,y,tableW,rowH,row%2===0?'#F6F8FC':'#fff');
      if(r){
        if(r.incident)rect(x+sum(widths.slice(0,5)),y,widths[5],rowH,'#FEF0E9');
        const values=[r.date,r.folio,r.dental?'Sí':'—',r.p0?'Sí':'—',r.app?'Sí':'—',r.incident?'Sí':'—',r.dynamic?'Sí':'—'];
        let cx=x;values.forEach((v,i)=>{
          text(cx+widths[i]/2,y+2.1,v,6.5,i===5&&r.incident?C.red:i===6&&r.dynamic?C.green:C.ink,i>4&&v==='Sí','center',i!==1,widths[i]-2);
          cx+=widths[i];
        });
      }
      line(x,y,x+tableW,y,'#E6ECF3',.25);
    }
    y-=totalH;rect(x,y,tableW,totalH,'#E8F0FA',2);
    text(x+5,y+3,`${data.length} FOLIOS`,6.6,C.blue,true,'left',true);
    text(x+tableW-5,y+3,`PD ${data.filter(r=>r.dental).length} · P0 ${data.filter(r=>r.p0).length} · APP ${data.filter(r=>r.app).length}`,6.6,C.blue,true,'right',true);
    return y;
  }
  const sum=arr=>arr.reduce((a,b)=>a+b,0);
  table(LEFT,records.slice(0,25));table(LEFT+284,records.slice(25,50));

  heading(266,'ÁREAS DE OPORTUNIDAD','Casilla marcada cuando el alcance no llega al objetivo');
  const opportunities=[{label:'CALIDAD',below:model.qualityTotal<model.qualityObjective},{label:'APP',below:model.metrics[3].below},{label:'P. CERO',below:model.metrics[2].below},{label:'1A COMPRA',below:model.metrics[1].below},{label:'VENTAS',below:model.metrics[0].below}];
  const chipW=[101,88,99,128,111];let at=RIGHT;
  for(let i=0;i<opportunities.length;i++){
    const entry=opportunities[i],width=chipW[i],x=at-width;
    rect(x,245,width-5,15,'#F4F7FB',3);
    rect(x+6,249.5,7.5,7.5,C.white,0,C.blue);
    if(entry.below){line(x+7.5,253,x+9.4,251.2,C.mid,1.2);line(x+9.4,251.2,x+12.4,256,C.mid,1.2);}
    text(x+18,250.4,entry.label,7.0,C.ink,entry.below,'left',true);
    at=x;
  }

  // Bloque unificado: escritura manuscrita + firmas. NO más contenido debajo.
  heading(236,'COMENTARIOS, PLAN DE TRABAJO Y FIRMAS');
  function writingBox(y,labelText){
    rect(LEFT,y,CONTENT,55,C.white,4,C.line);
    rect(LEFT+4,y+40,186,11,C.pale,2);
    text(LEFT+9,y+43.4,labelText,6.9,C.blue,true,'left',true);
    for(let i=0;i<3;i++)line(LEFT+9,y+31-i*10,RIGHT-9,y+31-i*10,'#CBD5E2',.5);
  }
  writingBox(174,'COMENTARIOS Y RESULTADOS DE LA SEMANA');
  writingBox(114,'PLAN DE TRABAJO PARA LA SIGUIENTE SEMANA');
  // La firma de coordinación es la imagen original de Visitas de coordinador.
  const signatureX=LEFT+61;drawImage(assets.signature,signatureX,70,130,41);
  line(LEFT+10,70,LEFT+248,70,'#8798AC',.8);
  line(LEFT+297,70,LEFT+535,70,'#8798AC',.8);
  text(LEFT+129,58,'AZAMAR DEL ANGEL',9.3,C.blue,true,'center',true);
  text(LEFT+129,47,'COORDINADOR',7.3,C.muted,true,'center');
  text(LEFT+416,58,model.supervisor,8.6,C.ink,true,'center',true,228);
  text(LEFT+416,47,'SUPERVISOR(A) · FIRMA',7.3,C.muted,true,'center');
}
