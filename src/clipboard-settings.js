export const CLIPBOARD_KEY='wmSamsClipboardSettingsV303';
export const REPORTS={daily:['Comparativo diario','Regist.|Ventas|Regul.|Garant.|P. Cero|Dental|Calidad|Hoy avanzamos'],progress:['Avance y objetivo','Semana|Corte|Ventas|Plan Dental|Plan Cero'],incident:['Incidencia','Folio|Módulo|Ejecutivo|Incidencia|Seguimiento|Fecha de creación|Última modificación|Fecha de resolución|Historial de comentarios'],update:['Actualización','Folio|Módulo|Ejecutivo|Fecha del registro|Fecha de creación|Última modificación|Estado|Fecha de resolución|Campos solicitados|Comentarios|Valores aplicados'],folios:['Folios comisionables','']};
const read=()=>{try{return JSON.parse(localStorage.getItem(CLIPBOARD_KEY)||'{}')||{}}catch{return {}}};
export function customizeClipboard(id,text,settings=read()){
 const p=settings[id];if(!p)return text;
 let lines=text.split('\n'), titleIndex=id==='daily'?lines.findIndex(l=>l.startsWith('*Reporte')):id==='folios'?-1:0;
 if(titleIndex>=0&&p.title)lines[titleIndex]=lines[titleIndex].startsWith('*')?'*'+p.title+'*':p.title;
 const keys=REPORTS[id][1].split('|').filter(Boolean), blocks=new Map();
 const match=l=>keys.find(k=>{const s=l.replace(/^\*/,'');return s===k||s===k+'*'||s.startsWith(k+':')||s.startsWith(k+' ');});
 let current=null;const output=[];let inserted=false;
 for(const line of lines){const k=match(line);if(k){current=k;if(!blocks.has(k))blocks.set(k,[]);blocks.get(k).push(line);if(!inserted){output.push(null);inserted=true;}}else if(current&&((id==='progress'&&/^(Alcance|Requerido hoy|Diferencia):/.test(line))||((id==='incident'||id==='update')&&line.startsWith('- '))))blocks.get(current).push(line);else{current=null;output.push(line);}}
 // Preserve code fences and section separators when reordering daily metrics.
 if(id==='daily'){
 const start=lines.indexOf('```'),end=lines.lastIndexOf('```');
 if(start>=0&&end>start){const original=lines.slice(start+1,end), order=[...new Set([...(p.order||[]),...keys])];const reordered=order.flatMap(k=>original.filter(l=>match(l)===k));lines.splice(start+1,end-start-1,...reordered,...original.filter(l=>!match(l)));}
 return decorate(lines.filter(l=>!p.hidden?.includes(match(l))).map(l=>{const k=match(l);return k?rename(l,k,p):l;}).map(l=>p.deltas===false?l.replace(/\s+\([+-]?\d[^)]*\)$/,''):l).join('\n'),p);
 }
 const ordered=[...new Set([...(p.order||[]),...keys])].filter(k=>blocks.has(k)&&!p.hidden?.includes(k));
 const body=output.flatMap(l=>l===null?ordered.flatMap(k=>blocks.get(k).map(x=>rename(x,k,p)).filter(x=>p.deltas!==false||!x.startsWith('Diferencia:')).map(x=>p.counts===false?x.replace(/\s+\([^)]*(?:ventas|requeridas)\)/g,''):x)): [l]).join('\n');
 return decorate((id==='folios'&&p.title?p.title+'\n\n':'')+body,p);
}
function rename(line,k,p){const label=p.labels?.[k];return label&&line.replace(/^\*/,'').startsWith(k)?line.replace(k,label):line;}
function decorate(text,p){return [p.prefix,text,p.suffix].filter(Boolean).join('\n\n').replace(p.bold===false?/\*/g:/(?!)/g,'').replace(p.mono===false?/```\n?/g:/(?!)/g,'').trim();}
export function initClipboardSettings(){
 const host=document.getElementById('clipboardEditor');if(!host)return;
 const select=document.createElement('select');for(const [id,[label]] of Object.entries(REPORTS))select.add(new Option(label,id));host.append(select);
 const body=document.createElement('div');host.append(body);
 function render(){const id=select.value,p=read()[id]||{},keys=REPORTS[id][1].split('|').filter(Boolean);body.replaceChildren();
 const controls={};for(const [key,label] of Object.entries({title:'Encabezado personalizado',prefix:'Texto inicial',suffix:'Texto final'})){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.value=p[key]||'';input.maxLength=1000;l.append(input);body.append(l);controls[key]=input;}
 for(const [key,label] of Object.entries({bold:'Negritas WhatsApp',mono:'Bloque monoespaciado',deltas:'Diferencias',counts:'Cantidades junto a porcentajes'})){const l=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.checked=p[key]!==false;l.append(input,document.createTextNode(label));body.append(l);controls[key]=input;}
 const list=document.createElement('div');body.append(list);for(const k of [...new Set([...(p.order||[]),...keys])].filter(k=>keys.includes(k))){const row=document.createElement('div');row.dataset.key=k;row.style.cssText='display:flex;gap:6px;align-items:center;margin:6px 0';const check=document.createElement('input');check.type='checkbox';check.checked=!p.hidden?.includes(k);check.title=k;const input=document.createElement('input');input.value=p.labels?.[k]||'';input.placeholder=k;input.setAttribute('aria-label',k);const up=document.createElement('button');up.type='button';up.textContent='↑';up.onclick=()=>{if(row.previousElementSibling)list.insertBefore(row,row.previousElementSibling);};row.append(check,input,up);list.append(row);}
 const save=document.createElement('button');save.type='button';save.textContent='Guardar reporte';save.className='btn';const reset=document.createElement('button');reset.type='button';reset.className='btn';reset.textContent='Restaurar plantilla';const preview=document.createElement('pre');preview.style.whiteSpace='pre-wrap';
 save.onclick=()=>{const all=read(),next={labels:{},hidden:[],order:[]};for(const [k,v] of Object.entries(controls))next[k]=v.type==='checkbox'?v.checked:v.value;for(const row of list.children){const [check,input]=row.children,k=row.dataset.key;next.order.push(k);if(!check.checked)next.hidden.push(k);if(input.value)next.labels[k]=input.value;}all[id]=next;localStorage.setItem(CLIPBOARD_KEY,JSON.stringify(all));preview.textContent='Vista previa (ejemplo):\n'+customizeClipboard(id,[REPORTS[id][0],...keys.map(k=>k+': 10')].join('\n'),all);};reset.onclick=()=>{const all=read();delete all[id];localStorage.setItem(CLIPBOARD_KEY,JSON.stringify(all));render();};body.append(save,reset,preview);}
 select.onchange=render;render();
}
