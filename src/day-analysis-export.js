/** V4.1 · Una sola hoja carta VERTICAL para PDF y PNG. Sin librerías externas.
 * Ambas exportaciones usan exactamente el mismo Canvas.
 */
const fmt=n=>Number.isFinite(n)?n.toLocaleString('es-MX',{maximumFractionDigits:2}):'—';
const pct=n=>n===null||!Number.isFinite(n)?'—':fmt(n)+'%';
const cut=(ctx,value,maxWidth)=>{let s=String(value||'');if(ctx.measureText(s).width<=maxWidth)return s;while(s&&ctx.measureText(s+'…').width>maxWidth)s=s.slice(0,-1);return s+'…';};
export function paintDayAnalysisSheet(result,prefs={}){
 if(!result||!result.totals)throw Error('No hay datos válidos para exportar.');
 const canvas=document.createElement('canvas'),scale=2,width=816,height=1056;canvas.width=width*scale;canvas.height=height*scale;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('El navegador no permite dibujar el informe.');
 ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
 const left=34,right=782,content=right-left;let y=40;
 const text=(value,x,yy,size=12,bold=false,color='#263c52')=>{ctx.fillStyle=color;ctx.font=`${bold?'700':'400'} ${size}px Arial,sans-serif`;ctx.fillText(value,x,yy);};
 const bar=(yy,h,color)=>{ctx.fillStyle=color;ctx.fillRect(left,yy,content,h);};
 ctx.fillStyle='#003B7A';ctx.fillRect(0,0,width,10);
 text(cut(ctx,prefs.title||'Análisis del día',600),left,y,23,true,'#003B7A');text('JEFATURA MID MARC',right-160,y,11,true,'#005DAA');y+=25;
 const days=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
 text(`${days[Number(result.weekday)]} · ${result.from} al ${result.to} · ${result.periods} períodos`,left,y,12,true);y+=18;
 if(prefs.showDates!==false){ctx.font='10px Arial';text(cut(ctx,'Fechas: '+(result.dates.join(', ')||'sin fechas'),content),left,y,10);y+=16;}
 text('Solo ventas comisionables. Plan Cero: porcentaje sobre ventas regulares.',left,y,10,false,'#4e6277');y+=24;
 bar(y,73,'#edf4fc');
 const cards=[['VENTAS',fmt(result.totals.sales)],['PROMEDIO/DÍA',fmt(result.totals.averages.sales)],['META DIARIA',result.goal?fmt(result.goal):'—'],['CUMPLIMIENTO',pct(result.totals.goalCompletion)]];
 cards.forEach(([label,val],i)=>{const x=left+15+i*182;text(label,x,y+21,10,true,'#4b6780');text(val,x,y+51,22,true,'#003B7A');});y+=96;
 const totalRows=((prefs.showModules===false)?0:result.modules.length)+((prefs.showExecutives===false)?0:result.executives.length);
 if(totalRows>64)throw Error('El reporte excede 64 perfiles. Reduce la selección para obtener una hoja vertical legible.');
 const gap=20,sectionTitle=24,tableHead=33;
 const used=(prefs.showModules===false?0:sectionTitle+tableHead)+(prefs.showExecutives===false?0:sectionTitle+tableHead);
 const available=height-100-y-used-35;
 const rowHeight=Math.min(31,Math.max(12,available/Math.max(1,totalRows)));
 if(totalRows>0&&rowHeight<12)throw Error('Demasiados perfiles para una sola hoja carta; reduce los filtros.');
 const cols=[left+10,left+272,left+365,left+458,left+551,left+645];
 const colNames=['Perfil','Ventas','Garant.','Regulares','Dental','P. Cero'];
 const table=(heading,rows)=>{
  y+=7;text(heading,left,y+13,15,true,'#003B7A');y+=22;
  bar(y,tableHead,'#e5eff8');colNames.forEach((c,i)=>text(c,cols[i],y+21,i===0?10:9,true,'#284967'));y+=tableHead;
  if(!rows.length){text('Sin ventas comisionables',cols[0],y+18,11);y+=28;return;}
  const size=Math.max(8,Math.min(11,rowHeight*.42));
  rows.forEach((item,index)=>{
   if(index%2===0)bar(y,rowHeight,'#f2f6fb');
   ctx.font=`700 ${size}px Arial`;text(cut(ctx,item.name,248),cols[0],y+rowHeight*.65,size,true);
   const k=['sales','guaranteed','regular','dental','p0'];
   k.forEach((metric,i)=>{
    const x=cols[i+1],p=item.percentages[metric];
    if(rowHeight>=24){text(fmt(item[metric]),x,y+12,10,true);text(`μ ${fmt(item.averages[metric])} · ${pct(p)}`,x,y+24,7,false,'#546b82');}
    else text(`${fmt(item[metric])} / ${pct(p)}`,x,y+rowHeight*.7,7.6,true);
   });
   y+=rowHeight;
  });
 };
 if(prefs.showModules!==false)table('Resultados por módulos',result.modules);
 if(prefs.showExecutives!==false)table('Resultados por ejecutivos',result.executives);
 if(y>height-55)throw Error('El informe no cabe en una hoja vertical. Reduce los filtros.');
 ctx.fillStyle='#e0e9f1';ctx.fillRect(left,height-66,content,1);
 text(cut(ctx,prefs.note||'Porcentajes calculados sobre ventas comisionables.',content),left,height-47,10,false,'#516782');
 text('Una página · Carta vertical · Acumulados y promedios por día',left,height-30,9,false,'#74869b');
 return canvas;
}
