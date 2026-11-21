const VISIBLE_SELECTORS='table,.report-kpi,.day-kpi,.summary-card,.metric-card,.report-note,p,li,.empty,.muted';
const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const escText=value=>String(value??'').replace(/\s+/g,' ').trim();
function isVisible(node){
  if(!node||node.hidden)return false;
  const style=node.ownerDocument?.defaultView?.getComputedStyle?.(node);
  return !!style && style.display!=='none' && style.visibility!=='hidden' && style.opacity!=='0';
}
function visibleText(node){return escText(node?.textContent||'');}
function columnLetter(index){
  let n=index+1,out='';
  while(n>0){const mod=(n-1)%26;out=LETTERS[mod]+out;n=Math.floor((n-1)/26);} 
  return out;
}
function uniquePush(list,item,keyFn=x=>JSON.stringify(x)){
  const key=keyFn(item);if(!key)return;
  if(!list.some(entry=>keyFn(entry)===key))list.push(item);
}
function extractSummary(root){
  const selectors=['.day-kpi','.report-kpi','.summary-card','.metric-card','.kpi','.card'];
  const items=[];
  for(const selector of selectors){
    for(const node of root.querySelectorAll(selector)){
      if(!isVisible(node))continue;
      const label=visibleText(node.querySelector('.rlabel,.label,span,legend,.eyebrow'));
      const value=visibleText(node.querySelector('.rval,b,strong,.value,h3,h4'));
      const help=visibleText(node.querySelector('.report-note,small,p'));
      if(!label && !value)continue;
      uniquePush(items,{label:label||'Dato',value:value||help||'—',detail:help&&help!==value?help:''},x=>`${x.label}|${x.value}`);
      if(items.length>=16)return items;
    }
    if(items.length>=6)break;
  }
  return items;
}
function extractTable(table,index){
  if(!isVisible(table))return null;
  const title=visibleText(table.closest('section,article,div')?.querySelector('h2,h3,h4,legend,.day-section-title h3,.section-title'))||`Tabla ${index+1}`;
  let headers=[...table.querySelectorAll('thead tr:first-child th')].map(node=>visibleText(node));
  const bodyRows=[...table.querySelectorAll('tbody tr')];
  const allRows=[];
  if(!headers.length){
    const first=[...table.querySelectorAll('tr')][0];
    if(first){
      const headCells=[...first.children].map(node=>visibleText(node));
      const looksLikeHeader=first.querySelector('th')||headCells.every(text=>text && text.length<32);
      if(looksLikeHeader)headers=headCells;
    }
  }
  const rowsSource=bodyRows.length?bodyRows:[...table.querySelectorAll('tr')].slice(headers.length?1:0);
  for(const row of rowsSource){
    if(!isVisible(row))continue;
    const cells=[...row.children].map(cell=>visibleText(cell));
    if(cells.some(Boolean))allRows.push(cells);
  }
  if(!headers.length && allRows.length)headers=allRows.shift().map((_,i)=>`Columna ${i+1}`);
  if(!headers.length && !allRows.length)return null;
  return {title,headers,rows:allRows.slice(0,260)};
}
function extractTables(root){
  const tables=[];
  for(const [index,table] of [...root.querySelectorAll('table')].entries()){
    const info=extractTable(table,index);
    if(info)tables.push(info);
  }
  if(tables.length)return tables;
  const lines=[];
  for(const node of root.querySelectorAll('p,li,.muted,.empty,.day-message,.cloud-session-label')){
    if(!isVisible(node))continue;
    const text=visibleText(node);
    if(text)uniquePush(lines,text,x=>x);
  }
  if(lines.length)return [{title:'Detalle visible',headers:['Contenido'],rows:lines.map(line=>[line])}];
  return [];
}
export function buildSheetsCaptureModel(root,{pageName='',title='',subtitle='',context='',note=''}={}){
  if(!root)throw new Error('No hay contenido visible para exportar.');
  const heading=title||visibleText(root.querySelector('h1,h2'))||pageName||'Reporte';
  const sub=subtitle||visibleText(root.querySelector('p'))||'';
  const summary=extractSummary(root);
  const tables=extractTables(root);
  const notes=[];
  if(context)notes.push(context);
  if(note)notes.push(note);
  return {pageName,heading,subtitle:sub,summary,tables,notes};
}
function makeRows(model){
  const rows=[];
  const push=(kind,cells)=>rows.push({kind,cells:cells.map(value=>String(value??''))});
  push('title',[model.heading]);
  if(model.pageName)push('subtitle',[model.pageName]);
  if(model.subtitle)push('meta',[model.subtitle]);
  push('meta',[`Generado: ${new Date().toLocaleString('es-MX')}`]);
  if(model.summary?.length){
    push('blank',['']);
    push('section',['Resumen ejecutivo']);
    push('header',['Indicador','Valor','Detalle']);
    model.summary.forEach(item=>push('data',[item.label,item.value,item.detail||'']));
  }
  for(const table of model.tables||[]){
    push('blank',['']);
    push('section',[table.title||'Tabla']);
    push('header',table.headers.length?table.headers:['Columna 1']);
    for(const row of table.rows||[])push('data',row);
  }
  if(model.notes?.length){
    push('blank',['']);
    push('section',['Notas']);
    model.notes.forEach(note=>push('data',[note]));
  }
  return rows;
}
function estimateColumnWidths(ctx,rows,colCount){
  const widths=Array(colCount).fill(110);
  ctx.font='12px Arial';
  rows.forEach(row=>{
    row.cells.forEach((cell,index)=>{
      const text=escText(cell)||' ';
      const estimate=Math.min(320,Math.max(90,ctx.measureText(text.slice(0,90)).width+20));
      widths[index]=Math.max(widths[index],estimate);
    });
  });
  return widths;
}
function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){
  const content=escText(text)||' ';
  const words=content.split(' '); let line='',count=0,currentY=y;
  for(const word of words){
    const attempt=line?`${line} ${word}`:word;
    if(ctx.measureText(attempt).width<=maxWidth)line=attempt;
    else{
      ctx.fillText(line||word,x,currentY);count++;currentY+=lineHeight;
      if(count>=maxLines){
        const shortened=(line||word).slice(0,Math.max(1,Math.min((line||word).length,40)))+(content.length>(line||word).length?'…':'');
        ctx.fillText(shortened,x,y+(maxLines-1)*lineHeight);return maxLines;
      }
      line=word;
    }
  }
  ctx.fillText(line,x,currentY);return count+1;
}
export function paintSheetsCapture(model,{scale=2}={}){
  const rows=makeRows(model);
  const colCount=Math.max(4,...rows.map(row=>row.cells.length||1));
  const probe=document.createElement('canvas').getContext('2d');
  const widths=estimateColumnWidths(probe,rows,colCount);
  const rowNumWidth=44,topHeight=30,defaultHeight=28;
  const totalWidth=rowNumWidth+widths.reduce((sum,value)=>sum+value,0);
  const heights=rows.map(row=>{
    if(row.kind==='title')return 34;
    if(row.kind==='subtitle')return 26;
    if(row.kind==='section')return 28;
    if(row.kind==='blank')return 12;
    if(row.kind==='meta')return 24;
    const lines=Math.max(...row.cells.map(cell=>Math.ceil((escText(cell).length||1)/24)));
    return Math.max(defaultHeight,Math.min(72,14*lines+12));
  });
  const totalHeight=topHeight+heights.reduce((sum,value)=>sum+value,0)+10;
  const canvas=document.createElement('canvas');
  canvas.width=Math.round(totalWidth*scale);
  canvas.height=Math.round(totalHeight*scale);
  const ctx=canvas.getContext('2d');
  ctx.scale(scale,scale);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,totalWidth,totalHeight);
  ctx.fillStyle='#f1f3f4';ctx.fillRect(0,0,totalWidth,topHeight);
  ctx.strokeStyle='#d0d7de';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,topHeight+.5);ctx.lineTo(totalWidth,topHeight+.5);ctx.stroke();
  ctx.fillStyle='#5f6368';ctx.font='bold 12px Arial';ctx.textBaseline='middle';
  let x=rowNumWidth;
  for(let i=0;i<colCount;i++){
    ctx.strokeStyle='#d0d7de';ctx.strokeRect(x+.5,.5,widths[i],topHeight-1);
    ctx.fillText(columnLetter(i),x+widths[i]/2-ctx.measureText(columnLetter(i)).width/2,topHeight/2+1);
    x+=widths[i];
  }
  ctx.strokeRect(.5,.5,rowNumWidth,topHeight-1);
  let y=topHeight;
  rows.forEach((row,index)=>{
    const rowHeight=heights[index];
    const rowNumber=String(index+1);
    ctx.fillStyle='#f8f9fa';ctx.fillRect(0,y,rowNumWidth,rowHeight);
    ctx.strokeStyle='#dfe3e8';ctx.strokeRect(.5,y+.5,rowNumWidth,rowHeight);
    ctx.fillStyle='#5f6368';ctx.font='11px Arial';ctx.textBaseline='middle';
    ctx.fillText(rowNumber,rowNumWidth-8-ctx.measureText(rowNumber).width,y+rowHeight/2);
    let cx=rowNumWidth;
    const merged=row.cells.length===1;
    for(let col=0;col<colCount;col++){
      const cellWidth=widths[col];
      const cellText=row.cells[col]??(merged && col===0?row.cells[0]:'');
      const spanWidth=merged && col===0 ? widths.reduce((sum,value)=>sum+value,0) : cellWidth;
      if(merged && col>0)continue;
      if(row.kind==='title'){ctx.fillStyle='#e8f0fe';ctx.fillRect(cx,y,spanWidth,rowHeight);}
      else if(row.kind==='subtitle'){ctx.fillStyle='#eef3fd';ctx.fillRect(cx,y,spanWidth,rowHeight);}
      else if(row.kind==='section'){ctx.fillStyle='#e6f4ea';ctx.fillRect(cx,y,spanWidth,rowHeight);}
      else if(row.kind==='header'){ctx.fillStyle='#d9eadf';ctx.fillRect(cx,y,cellWidth,rowHeight);}
      else if(row.kind==='blank'){ctx.fillStyle='#ffffff';ctx.fillRect(cx,y,spanWidth,rowHeight);}
      else if(index%2===0 && row.kind==='data'){ctx.fillStyle='#fcfdff';ctx.fillRect(cx,y,cellWidth,rowHeight);}
      ctx.strokeStyle='#dfe3e8';ctx.strokeRect(cx+.5,y+.5,merged?spanWidth:cellWidth,rowHeight);
      ctx.textBaseline='top';
      if(row.kind==='title'){ctx.fillStyle='#174ea6';ctx.font='bold 18px Arial';drawWrapped(ctx,cellText,cx+10,y+8,spanWidth-16,19,2);}
      else if(row.kind==='subtitle'){ctx.fillStyle='#1a73e8';ctx.font='bold 12px Arial';drawWrapped(ctx,cellText,cx+10,y+6,spanWidth-16,15,2);}
      else if(row.kind==='section'){ctx.fillStyle='#137333';ctx.font='bold 12px Arial';drawWrapped(ctx,cellText,cx+10,y+7,spanWidth-16,15,2);}
      else if(row.kind==='header'){ctx.fillStyle='#202124';ctx.font='bold 11px Arial';drawWrapped(ctx,cellText,cx+8,y+7,cellWidth-14,14,2);}
      else if(row.kind==='meta'){ctx.fillStyle='#5f6368';ctx.font='11px Arial';drawWrapped(ctx,cellText,cx+10,y+6,spanWidth-16,14,2);}
      else {ctx.fillStyle='#202124';ctx.font='11px Arial';drawWrapped(ctx,cellText,cx+8,y+7,(merged?spanWidth:cellWidth)-14,14,4);}
      cx+=merged?spanWidth:cellWidth;
    }
    y+=rowHeight;
  });
  return canvas;
}
