/* Acuse de visita de coordinación · v2.2
   Los filtros, la captura y los cálculos son locales. Solo Guardar visita
   envía un acta a PostgreSQL. La configuración personalizable usa el
   sistema existente de preferencias sincronizadas de Netlify.
*/
const source=window.VISIT_SOURCE;
const $=id=>document.getElementById(id);
const clean=s=>String(s??'').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const fmt=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)?s.split('-').reverse().join('/'):clean(s);
const CONFIG_KEY='wmSamsVisitConfigV20';
const H_URL='/assets/visit-header.png';const S_URL='/assets/visit-signature.png';
const originalChecklist=[
 'Módulo limpio','Módulo en buenas condiciones','Módulo sin elementos ajenos a la operación',
 'Puntualidad del personal de módulo','Lectura y confirmación de comunicados de la semana',
 'Personal correctamente uniformado y con gafete visible','Personal con correcto abordaje',
 'Personal da correcta información','Personal hace correcta labor de venta y manejo de objeciones',
 'Revisión aleatoria de tarjetas','Tablets en óptimas condiciones para su uso',
 'Reportería de supervisor puntual y correcta'
].map((label,i)=>({id:'crit_'+(i+1),label,weight:1,enabled:true}));
const DEFAULT={
 title:'ACUSE DE VISITA DE COORDINACIÓN',coordinator:'Azamar del ángel',
 headings:['I. INFORMACIÓN GENERAL','II. CHECKLIST OPERATIVO','III. CHECKLIST ADMINISTRATIVO (REVISIÓN DE FOLIOS)','IV. RESOLUCIÓN DE INCIDENCIAS','V. CUMPLIMIENTO DE COMPROMISOS DE VENTA DIARIA'],
 labels:{module:'Módulo',supervisor:'Supervisor / ejecutivo responsable',commit:'¿Cumplió su compromiso?'},
 points:[0,50,20,20,10],threshold:75,accentColor:'#104c7a',reportFontScale:1,criteria:originalChecklist,
 headerImage:H_URL,signatureImage:S_URL,headerVisible:true,signatureVisible:true,
 noIncidentFullPoints:true,checkRequiresPayable:false,
 commentsVisible:[true,true,true,true,true]
};
function readConfig(){
 try{const v=JSON.parse(localStorage.getItem(CONFIG_KEY)||'null');if(!v||typeof v!=='object')return structuredClone(DEFAULT);
   const r={...structuredClone(DEFAULT),...v};
   if(!Array.isArray(r.criteria)||r.criteria.length>80)r.criteria=structuredClone(originalChecklist);
   r.criteria=r.criteria.filter(x=>x&&typeof x.id==='string'&&typeof x.label==='string').map(x=>({...x,weight:Math.max(.01,Math.min(1000,Number(x.weight)||1)),enabled:x.enabled!==false}));
   if(!Array.isArray(r.headings)||r.headings.length!==5)r.headings=[...DEFAULT.headings];
   if(!Array.isArray(r.points)||r.points.length!==5)r.points=[...DEFAULT.points];
   if(!Array.isArray(r.commentsVisible)||r.commentsVisible.length!==5)r.commentsVisible=[...DEFAULT.commentsVisible];
   r.labels={...DEFAULT.labels,...v.labels};
   if(!/^#[0-9a-f]{6}$/i.test(r.accentColor))r.accentColor=DEFAULT.accentColor;
   r.reportFontScale=Math.max(.6,Math.min(1.3,Number(r.reportFontScale)||1));return r;
 }catch(_){return structuredClone(DEFAULT);}
}
let config=readConfig();
function fresh(){return {id:'vis_'+(Date.now().toString(36))+'_'+Math.random().toString(36).slice(2,11),visitedAt:today(),coordinator:config.coordinator,module:'',supervisor:'',
 sections:{checklist:{},folios:[],incidents:{},comments:{general:'',checklist:'',folios:'',incidents:'',commit:''},commitDate:today(),commitResult:''},
 total:0,settingsSnapshot:null};}
let visit=fresh(),active=false,loadedOnce=false,history=[],dirty=false,openedFromHistory=false,allRows=[],frozenHistory=false;
const commentNames=['general','checklist','folios','incidents','commit'];
const configPoints=i=>Math.max(0,Math.min(500,Number(config.points[i])||0));
const yes=source.isYes, no=source.isNo;
const moduleSame=(r,name)=>source.normalize(r.module)===source.normalize(name);
function currentWeekRows(){const week=source.mondayOf(visit.visitedAt||today());return allRows.filter(r=>r.week===week&&moduleSame(r,visit.module));}
function uniqueRows(rows){const m=new Map();for(const r of rows){const f=clean(r.folio);if(f&&!m.has(source.normalize(f)))m.set(source.normalize(f),r);}return [...m.values()];}
function incidentRows(){
 const rows=uniqueRows(currentWeekRows().filter(r=>r.incidentFlag||isIncidentValue(r.incidentValue)));
 const existing=new Set(rows.map(r=>source.normalize(r.folio)));
 for(const v of visit.sections.incidentEvaluations||[]){if(!existing.has(source.normalize(v.folio))){rows.push({folio:v.folio,executive:v.executive,historyOnly:true});existing.add(source.normalize(v.folio));}}
 return rows;
}
function isIncidentValue(value){const v=source.normalize(value);return !!v&&!['NO','N','0','FALSE','FALSO','SIN INCIDENCIA','NINGUNA','NO APLICA'].includes(v);}
function folioRows(){
 const rows=uniqueRows(currentWeekRows());
 const existing=new Set(rows.map(r=>source.normalize(r.folio)));
 for(const v of visit.sections.folioEvaluations||[]){if(!existing.has(source.normalize(v.folio))){rows.push({folio:v.folio,executive:v.executive||'',historyOnly:true,fecha:visit.visitedAt,module:visit.module,code:'',p0:'',dental:'',appValue:'',hasAppColumn:false});existing.add(source.normalize(v.folio));}}
 return rows;
}
function lastName(r){return clean(r.folio)||'Sin folio';}
function appActive(r){
 // Si XLS tiene columna real de activación, se usa exclusivamente ese valor.
 // Si no, se identifica expresamente la activación por defecto configurada
 // en la tabla original del Dashboard (editable en ese mismo folio).
 return !!clean(r.code)&&(r.hasAppColumn?yes(r.appValue):!r.appOff);
}
function quality(r){
 const validCode=!!clean(r.code),a=appActive(r),p=yes(r.p0),d=yes(r.dental);
 return {code:validCode,app:a,p0:p,dental:d,pct:25*[validCode,a,p,d].filter(Boolean).length};
}
function registrationValid(r){
 const core=!!(clean(r.folio)&&clean(r.fecha)&&clean(r.module)&&clean(r.executive));
 const bad=['CANCELADA','INCOMPLETA','RECHAZO'].includes(source.normalize(r.status));
 return core&&(!config.checkRequiresPayable||!bad);
}
function findFolio(folio){return folioRows().find(r=>source.normalize(r.folio)===source.normalize(folio));}
function score(){
 if(frozenHistory&&!dirty&&Array.isArray(visit.sections.scores))return {parts:visit.sections.scores,total:Number(visit.total)||0,reviewed:(visit.sections.folioEvaluations||[]).length,incidents:(visit.sections.incidentEvaluations||[]).length,resolved:(visit.sections.incidentEvaluations||[]).filter(x=>x.status==='Resuelta').length};
 const checklist=config.criteria.filter(x=>x.enabled);let tally=0,total=0;
 for(const c of checklist){const v=visit.sections.checklist[c.id];if(v==='Cumple'||v==='No cumple'){total+=c.weight;if(v==='Cumple')tally+=c.weight;}}
 const s2=total?configPoints(1)*tally/total:0;
 const selected=visit.sections.folios.filter(f=>!!f);let valid=0,pass=0;
 for(const f of selected){const row=findFolio(f),old=(visit.sections.folioEvaluations||[]).find(x=>x.folio===f);
   if(row&&!row.historyOnly){valid+=2;pass+=Number(registrationValid(row))+Number(quality(row).pct>=config.threshold);}
   else if(old&&!old.missing){valid+=2;pass+=Number(old.registration)+Number(old.approved);}
 }
 const s3=valid?configPoints(2)*pass/valid:0;
 const inc=incidentRows(),resolved=inc.filter(r=>visit.sections.incidents[r.folio]==='Resuelta').length;
 const s4=inc.length?Math.min(configPoints(3),configPoints(3)/3*resolved):(config.noIncidentFullPoints?configPoints(3):0);
 const outcome=visit.sections.commitResult;
 const s5=outcome==='Si'?configPoints(4):outcome==='En ceros'?-configPoints(4):0;
 const result={parts:[0,s2,s3,s4,s5],total:Math.round((s2+s3+s4+s5)*100)/100,reviewed:valid/2,incidents:inc.length,resolved};
 visit.total=result.total;return result;
}
function scoreFmt(n){return (Math.round(n*100)/100).toLocaleString('es-MX',{maximumFractionDigits:2});}
function mark(){dirty=true;frozenHistory=false;updateScores();$('visitCloudInfo').textContent='Visita sin guardar · Solo en este dispositivo';$('visitCloudInfo').style.background='#fff1d9';$('visitCloudInfo').style.color='#8f5818';}
function saved(){dirty=false;$('visitCloudInfo').textContent='Visita guardada en PostgreSQL';$('visitCloudInfo').style.background='';$('visitCloudInfo').style.color='';}
function updateScores(){const sc=score();$('visitTotal').textContent=scoreFmt(sc.total)+' pts';for(let i=1;i<5;i++){const t=$('visitPoints'+i);if(t)t.textContent=scoreFmt(sc.parts[i])+' / '+scoreFmt(configPoints(i));}}
function opts(values,name,value){return `<div class="visit-options">${values.map(v=>`<label><input type="radio" name="${esc(name)}" value="${esc(v)}" ${value===v?'checked':''}>${esc(v)}</label>`).join('')}</div>`;}
function commentField(i){return config.commentsVisible[i]?`<div class="visit-field full"><label for="visitComment${i}">Comentarios sobre ${['información general','operación','revisión de folios','incidencias','compromiso de ventas'][i]}</label><textarea id="visitComment${i}" data-vcomment="${commentNames[i]}" maxlength="1800" placeholder="Observaciones y acuerdos…">${esc(visit.sections.comments[commentNames[i]]||'')}</textarea></div>`:'';}
function cardSection(i,body){return `<details class="visit-step" id="visitStep${i}" ${i<=1?'open':''}><summary>${esc(config.headings[i])}${i?`<span class="visit-score-tag" id="visitPoints${i}">0 / ${configPoints(i)}</span>`:''}</summary><div class="visit-step-body">${body}${commentField(i)}</div></details>`;}
function optionSelect(id,items,value,placeholder){return `<select id="${id}"><option value="">${esc(placeholder)}</option>${items.map(x=>`<option value="${esc(x)}" ${x===value?'selected':''}>${esc(x)}</option>`).join('')}</select>`;}
function render(){
 $('visitPage').style.setProperty('--visit-accent',config.accentColor);
 const modules=[...new Set(allRows.map(r=>clean(r.module)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 const executives=[...new Set(allRows.filter(r=>moduleSame(r,visit.module)).map(r=>clean(r.executive)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 const rows=folioRows(),inci=incidentRows(),sc=score();
 const general=`<div class="visit-grid"><div class="visit-field"><label>Coordinador</label><input readonly value="${esc(config.coordinator)}"></div><div class="visit-field"><label>Fecha de visita</label><input readonly value="${esc(fmt(visit.visitedAt))}"></div>
 <div class="visit-field"><label>${esc(config.labels.module)}</label>${optionSelect('visitModule',modules,visit.module,'Selecciona el módulo')}</div><div class="visit-field"><label>${esc(config.labels.supervisor)}</label>${optionSelect('visitSupervisor',executives,visit.supervisor,'Selecciona un ejecutivo')}</div>
 <div class="visit-field full"><div class="visit-notice">Los módulos y ejecutivos provienen de todos los XLS guardados. Los folios corresponden a la semana actual (lunes a domingo): <b>${fmt(source.mondayOf(visit.visitedAt||today()))} – ${fmt(source.sundayOf(source.mondayOf(visit.visitedAt||today())))}</b>.</div></div></div>`;
 const criteria=config.criteria.filter(c=>c.enabled).map((c,i)=>`<div class="visit-card"><div class="visit-card-head">${i+1}. ${esc(c.label)} <span class="visit-muted">· Peso ${scoreFmt(c.weight)}</span></div>${opts(['Cumple','No cumple'],'visitCriterion_'+c.id,visit.sections.checklist[c.id])}</div>`).join('')||'<p class="visit-muted">Agrega criterios desde Ajustes → Visitas de coordinación.</p>';
 const folios=Array.from({length:Math.min(3,rows.length)},(_,i)=>{
   const value=visit.sections.folios[i]||'',sel=rows.find(r=>r.folio===value),old=(visit.sections.folioEvaluations||[]).find(x=>x.folio===value);
   const q=sel?(sel.historyOnly?{pct:old?.quality||0,code:old?.criteria?.code,app:old?.criteria?.app,p0:old?.criteria?.p0,dental:old?.criteria?.dental}:quality(sel)):null;
   const reg=sel?(sel.historyOnly?!!old?.registration:registrationValid(sel)):false;
   return `<div class="visit-card"><div class="visit-folio-row"><div class="visit-field"><label>Folio ${i+1}</label>${optionSelect('visitFolio'+i,rows.map(r=>r.folio),value,'Selecciona un folio')}</div>${sel?`<b>${q.pct}%</b>`:''}</div>${sel?`<div class="visit-quality-chips"><span class="${reg?'yes':''}">Registro ${reg?'correcto':'incompleto'}</span>${[['code','Código'],['app','APP'],['p0','P0'],['dental','Dental']].map(([k,v])=>`<span class="${q[k]?'yes':''}">${v}: ${q[k]?'Sí':'No'}</span>`).join('')}<span>Calidad ≥ ${config.threshold}%: <b>${q.pct>=config.threshold?'Sí':'No'}</b></span></div><p class="visit-muted">${esc(sel.executive)} · ${sel.hasAppColumn?'APP leída del XLS':'APP: estado predeterminado del Dashboard'}</p>`:''}</div>`;
 }).join('')||'<div class="visit-notice">No se encontraron folios con número en la semana actual de este módulo.</div>';
 const incidents=inci.length?inci.map(r=>`<div class="visit-card"><div class="visit-card-head">Folio: ${esc(r.folio)} <span class="visit-muted">· ${esc(r.executive)}</span></div>${opts(['Resuelta','Pendiente'],'visitIncident_'+r.folio,visit.sections.incidents[r.folio])}</div>`).join(''):'<div class="visit-notice">Sin incidencias registradas esta semana. '+(config.noIncidentFullPoints?'Se asignan los puntos completos de la sección.':'La sección queda con cero puntos.')+'</div>';
 const commit=`<div class="visit-grid"><div class="visit-field"><label>Fecha del compromiso</label><input id="visitCommitDate" type="date" value="${esc(visit.sections.commitDate||today())}"></div><div class="visit-field"><label>${esc(config.labels.commit)}</label>${opts(['Si','No','En ceros'],'visitCommit',visit.sections.commitResult)}</div></div><p class="visit-muted">${scoreFmt(configPoints(4))} pts si cumple · 0 pts si no cumple · −${scoreFmt(configPoints(4))} pts en ceros.</p>`;
 $('visitForm').innerHTML=cardSection(0,general)+cardSection(1,criteria)+cardSection(2,`<p class="visit-muted">Elige hasta tres folios. Registro correcto: folio, fecha, módulo y ejecutivo completos; calidad: código, APP, Plan Cero y Plan Dental (25% cada uno), umbral ≥ ${config.threshold}%.</p>${folios}`)+cardSection(3,`<p class="visit-muted">Incidencias de esta semana del módulo, detectadas por la marca de incidencia del Dashboard o la columna del XLS.</p>${incidents}`)+cardSection(4,commit)+`<div class="visit-summary"><div><div class="muted">PUNTUACIÓN TOTAL</div><div class="total" id="visitTotal">${scoreFmt(sc.total)} pts</div></div><span class="muted">${scoreFmt(config.points.reduce((a,b)=>a+(Number(b)||0),0))} pts máximos · salvo penalización</span></div>`;
 // mantener secciones previamente abiertas, recuperables mediante evento externo
 updateScores();
}
function sourceRefresh(){allRows=source.rows();if(!active)return;render();}
async function request(path,options={}){
 const response=await fetch('/api/visits'+path,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{})},...options});
 const data=await response.json().catch(()=>({error:`Respuesta inesperada (${response.status}).`}));
 if(!response.ok)throw Error(data.error||`Error ${response.status}`);return data;
}
async function refreshHistory(force=false){
 if(!source.isAuthorized())return;
 if(loadedOnce&&!force)return;
 try{const data=await request('');history=data.visits||[];loadedOnce=true;historyRender();}
 catch(e){$('visitHistoryList').textContent='No se pudieron recuperar las visitas: '+e.message;}
}
function historyRender(){
 $('visitHistoryCount').textContent='('+history.length+')';
 $('visitHistoryList').innerHTML=history.length?history.map(x=>`<div class="visit-history-item"><div><strong>${esc(fmt(x.date))} · ${esc(x.module)}</strong><small>${esc(x.supervisor)} · ${scoreFmt(x.score)} pts</small></div><div class="visit-history-actions"><button class="btn small" data-load-visit="${esc(x.id)}">Abrir</button><button class="btn small" data-del-visit="${esc(x.id)}">Eliminar</button></div></div>`).join(''):'<p class="visit-muted">Aún no hay visitas guardadas para esta cuenta.</p>';
}
function snapshot(){
 const x=JSON.parse(JSON.stringify(visit));x.coordinator=config.coordinator;x.total=score().total;
 x.sections.folios=x.sections.folios.filter(Boolean).slice(0,3);
 x.sections.folioEvaluations=x.sections.folios.map(f=>{const r=findFolio(f);if(!r||r.historyOnly)return (visit.sections.folioEvaluations||[]).find(v=>v.folio===f)||{folio:f,missing:true};const q=quality(r);return {folio:f,executive:r.executive,registration:registrationValid(r),quality:q.pct,criteria:q,approved:q.pct>=config.threshold};});
 x.sections.incidentEvaluations=incidentRows().map(r=>({folio:r.folio,executive:r.executive,status:visit.sections.incidents[r.folio]||''}));
 x.sections.scores=score().parts;
 x.settingsSnapshot={headings:[...config.headings],criteria:config.criteria.filter(c=>c.enabled).map(c=>({id:c.id,label:c.label,weight:c.weight})),points:[...config.points],threshold:config.threshold};
 return x;
}
async function saveVisit(){
 if(!source.isAuthorized())return alert('Inicia sesión para guardar visitas.');
 if(!visit.module||!visit.supervisor)return alert('Selecciona el módulo y un supervisor/ejecutivo antes de guardar.');
 if(!navigator.onLine)return alert('Sin conexión. Conserva la página abierta y guarda la visita cuando regrese Internet.');
 const btn=$('visitSave');btn.disabled=true;btn.textContent='Guardando…';
 try{visit.coordinator=config.coordinator;const output=snapshot();await request('',{method:'POST',body:JSON.stringify(output)});visit=output;frozenHistory=true;saved();loadedOnce=false;await refreshHistory(true);}
 catch(e){$('visitCloudInfo').textContent='No se guardó: '+e.message;alert('La visita sigue sin guardarse: '+e.message);}
 finally{btn.disabled=false;btn.textContent='Guardar visita';}
}
async function loadVisit(id){
 if(dirty&&!confirm('Hay una visita sin guardar. ¿Descartar los cambios para abrir otra?'))return;
 try{const data=await request('?id='+encodeURIComponent(id));visit=data.visit;visit.sections??=fresh().sections;
   visit.sections.checklist??={};visit.sections.folios??=[];visit.sections.incidents??={};visit.sections.comments??={};
   visit.visitedAt||=today();visit.sections.commitDate||=today();dirty=false;frozenHistory=true;openedFromHistory=true;
   render();saved();$('visitPage').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){alert('No se pudo abrir la visita: '+e.message);}
}
async function deleteVisit(id){if(!confirm('¿Eliminar permanentemente esta visita del historial de tu cuenta?'))return;
 try{await request('?id='+encodeURIComponent(id),{method:'DELETE'});loadedOnce=false;await refreshHistory(true);if(visit.id===id)newVisit();}
 catch(e){alert('No se pudo eliminar: '+e.message);}
}
function newVisit(){if(dirty&&!confirm('¿Descartar la visita actual sin guardar?'))return;
 visit=fresh();dirty=false;frozenHistory=false;openedFromHistory=false;render();$('visitCloudInfo').textContent='Nueva visita · Pendiente de guardar';}
function handleChange(e){
 const t=e.target;if(!t||!t.id&&!t.name)return;
 if(t.id==='visitModule'){visit.module=t.value;visit.supervisor='';visit.sections.folios=[];visit.sections.incidents={};mark();render();return;}
 if(t.id==='visitSupervisor'){visit.supervisor=t.value;mark();return;}
 if(/^visitFolio[0-2]$/.test(t.id)){
   const i=Number(t.id.slice(-1));if(t.value&&visit.sections.folios.some((f,k)=>k!==i&&f===t.value)){alert('Cada folio solamente puede seleccionarse una vez.');render();return;}
   visit.sections.folios[i]=t.value;mark();const open=[...$('visitForm').querySelectorAll('.visit-step')].map(x=>x.open);render();[...$('visitForm').querySelectorAll('.visit-step')].forEach((x,i)=>x.open=open[i]);return;
 }
 if(t.name?.startsWith('visitCriterion_')){visit.sections.checklist[t.name.slice(15)]=t.value;mark();return;}
 if(t.name?.startsWith('visitIncident_')){visit.sections.incidents[t.name.slice(14)]=t.value;mark();return;}
 if(t.name==='visitCommit'){visit.sections.commitResult=t.value;mark();return;}
 if(t.id==='visitCommitDate'){visit.sections.commitDate=t.value;mark();}
}
function handleInput(e){const key=e.target?.dataset?.vcomment;if(!key)return;visit.sections.comments[key]=e.target.value;mark();}
function configSave(){localStorage.setItem(CONFIG_KEY,JSON.stringify(config));renderSettings();if(active){const open=[...$('visitForm').querySelectorAll('.visit-step')].map(x=>x.open);render();[...$('visitForm').querySelectorAll('.visit-step')].forEach((x,i)=>x.open=open[i]);}}
function renderSettings(){const el=$('visitsSettingsEditor');if(!el)return;
 el.innerHTML=`<div class="visit-settings-grid"><div class="visit-field"><label>Título del acuse</label><input data-vcfg="title" maxlength="160" value="${esc(config.title)}"></div><div class="visit-field"><label>Coordinador</label><input data-vcfg="coordinator" maxlength="100" value="${esc(config.coordinator)}"></div>
 <div class="visit-field"><label>Etiqueta de módulo</label><input data-vlabel="module" value="${esc(config.labels.module)}"></div><div class="visit-field"><label>Etiqueta de supervisor</label><input data-vlabel="supervisor" value="${esc(config.labels.supervisor)}"></div>
 <div class="visit-field"><label>Umbral mínimo de calidad (%)</label><input data-vcfg="threshold" type="number" min="0" max="100" step="1" value="${config.threshold}"></div>
 <div class="visit-field"><label>Etiqueta del compromiso</label><input data-vlabel="commit" value="${esc(config.labels.commit)}"></div></div>
 <div class="visit-settings-grid"><div class="visit-field"><label>Color principal del acuse</label><input data-vcfg="accentColor" type="color" value="${esc(config.accentColor)}"></div><div class="visit-field"><label>Escala inicial de fuente en PDF</label><input data-vcfg="reportFontScale" type="number" min="0.6" max="1.3" step="0.05" value="${config.reportFontScale}"></div></div>
 <p class="visit-config-sub">Secciones, títulos, puntuaciones y comentarios</p>
 ${config.headings.map((h,i)=>`<div class="visit-grid" style="margin:5px 0"><div class="visit-field"><label>Sección ${i+1}</label><input data-vheading="${i}" value="${esc(h)}" maxlength="170"></div><div class="visit-field"><label>Puntos máximos</label><input data-vpoints="${i}" type="number" min="0" max="500" step="0.01" value="${config.points[i]}" ${i===0?'readonly':''}></div></div><label class="visit-options" style="margin:3px 0 8px"><input type="checkbox" data-vcomments="${i}" ${config.commentsVisible[i]?'checked':''}> Mostrar campo de comentarios</label>`).join('')}
 <p class="visit-config-sub">Checklist · Orden, criterio y peso individual</p><p class="visit-settings-help">Los 50 puntos originales se distribuyen según el peso de los criterios respondidos. En blanco: no se evalúa; Cumple: suma su peso; No cumple: cuenta en el denominador.</p>
 <div id="visitCriteriaEditor">${config.criteria.map((c,i)=>`<div class="visit-config-row" data-crit="${esc(c.id)}"><input aria-label="Nombre de criterio" maxlength="190" data-vcriterion="${esc(c.id)}" value="${esc(c.label)}"><input aria-label="Peso" type="number" min="0.01" max="1000" step="0.01" data-vweight="${esc(c.id)}" value="${c.weight}"><button type="button" data-vup="${esc(c.id)}" title="Subir">↑</button><button type="button" data-vdown="${esc(c.id)}" title="Bajar">↓</button><button type="button" data-vremove="${esc(c.id)}" title="Eliminar">×</button></div>`).join('')}</div>
 <div class="settings-row-actions"><button type="button" class="btn small" id="visitAddCriterion">+ Agregar criterio</button><button type="button" class="btn small" id="visitResetConfig">Restaurar plantilla original</button></div>
 <p class="visit-config-sub">Calidad e incidencias</p>
 <label class="visit-options"><input type="checkbox" id="visitNoIncidentFull" ${config.noIncidentFullPoints?'checked':''}> Puntos completos si no hay incidencias</label>
 <label class="visit-options"><input type="checkbox" id="visitCheckPayable" ${config.checkRequiresPayable?'checked':''}> Registro correcto también requiere estatus pagable (no cancelada, incompleta o rechazo)</label>
 <p class="visit-config-sub">Logotipo y firma del coordinador</p><p class="visit-settings-help">Se utilizan inicialmente las imágenes originales del Excel. Puedes sustituirlas por archivos de imagen, que se guardarán como preferencia de tu cuenta. No se captura la firma del supervisor.</p>
 <div class="visit-logo-choices"><div><img src="${esc(config.headerImage)}" alt="Vista previa de logotipo"><label class="visit-field">Logotipo<input type="file" id="visitUploadHeader" accept="image/png,image/jpeg,image/webp"></label><label class="visit-options"><input id="visitHeaderVisible" type="checkbox" ${config.headerVisible?'checked':''}> Incluir encabezado en exportaciones</label></div>
 <div><img src="${esc(config.signatureImage)}" alt="Vista previa de firma"><label class="visit-field">Firma del coordinador<input type="file" id="visitUploadSignature" accept="image/png,image/jpeg,image/webp"></label><label class="visit-options"><input id="visitSignatureVisible" type="checkbox" ${config.signatureVisible?'checked':''}> Incluir firma en exportaciones</label></div></div>
 <div class="settings-row-actions"><button type="button" class="btn small" id="visitResetImages">Restaurar logo y firma del Excel</button></div>`;
}
function configChange(e){const t=e.target;if(!t)return;
 if(t.dataset.vcfg){const field=t.dataset.vcfg;config[field]=field==='threshold'?Math.min(100,Math.max(0,Math.round(Number(t.value)||0))):field==='reportFontScale'?Math.min(1.3,Math.max(.6,Number(t.value)||1)):field==='accentColor'?(/^#[0-9a-f]{6}$/i.test(t.value)?t.value:DEFAULT.accentColor):t.value.slice(0,170);configSave();return;}
 if(t.dataset.vlabel){config.labels[t.dataset.vlabel]=t.value.slice(0,160);configSave();return;}
 if(t.dataset.vheading!==undefined){config.headings[Number(t.dataset.vheading)]=t.value.slice(0,170);configSave();return;}
 if(t.dataset.vpoints!==undefined){const i=Number(t.dataset.vpoints);if(i>0)config.points[i]=Math.max(0,Math.min(500,Number(t.value)||0));configSave();return;}
 if(t.dataset.vcomments!==undefined){config.commentsVisible[Number(t.dataset.vcomments)]=t.checked;configSave();return;}
 if(t.dataset.vcriterion){const c=config.criteria.find(c=>c.id===t.dataset.vcriterion);if(c)c.label=t.value.slice(0,190);configSave();return;}
 if(t.dataset.vweight){const c=config.criteria.find(c=>c.id===t.dataset.vweight);if(c)c.weight=Math.max(.01,Math.min(1000,Number(t.value)||1));configSave();return;}
 if(t.id==='visitNoIncidentFull'){config.noIncidentFullPoints=t.checked;configSave();return;}
 if(t.id==='visitCheckPayable'){config.checkRequiresPayable=t.checked;configSave();return;}
 if(t.id==='visitHeaderVisible'){config.headerVisible=t.checked;configSave();return;}
 if(t.id==='visitSignatureVisible'){config.signatureVisible=t.checked;configSave();}
}
async function imageResize(file,maxW,maxH){
 if(file.size>6_000_000)throw Error('La imagen supera 6 MB.');
 const bmp=await createImageBitmap(file);
 try{const scale=Math.min(1,maxW/bmp.width,maxH/bmp.height);const cnv=document.createElement('canvas');cnv.width=Math.max(1,Math.round(bmp.width*scale));cnv.height=Math.max(1,Math.round(bmp.height*scale));const ctx=cnv.getContext('2d');ctx.drawImage(bmp,0,0,cnv.width,cnv.height);
   let uri=cnv.toDataURL('image/png');if(uri.length>220_000)uri=cnv.toDataURL('image/webp',.78);
   if(uri.length>250_000)throw Error('La imagen procesada es demasiado grande. Utiliza una versión más pequeña.');return uri;
 }finally{bmp.close();}
}
async function settingImageUpload(input){const file=input.files[0];if(!file)return;
 try{const uri=await imageResize(file,input.id==='visitUploadHeader'?1000:900,360);config[input.id==='visitUploadHeader'?'headerImage':'signatureImage']=uri;configSave();}
 catch(err){alert('No se pudo cargar la imagen: '+err.message);}
}
function configClick(e){const t=e.target;
 if(t.id==='visitAddCriterion'){config.criteria.push({id:'crit_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),label:'Nuevo criterio',weight:1,enabled:true});configSave();return;}
 if(t.id==='visitResetConfig'){if(confirm('¿Restaurar títulos, criterios, pesos, puntuaciones e imágenes originales?')){config=structuredClone(DEFAULT);configSave();}return;}
 if(t.id==='visitResetImages'){config.headerImage=H_URL;config.signatureImage=S_URL;configSave();return;}
 let key=t.dataset.vup||t.dataset.vdown||t.dataset.vremove;if(!key)return;
 let i=config.criteria.findIndex(x=>x.id===key);if(i<0)return;
 if(t.dataset.vremove){config.criteria.splice(i,1);for(const it of [visit.sections.checklist])delete it[key];}
 else if(t.dataset.vup&&i>0){[config.criteria[i-1],config.criteria[i]]=[config.criteria[i],config.criteria[i-1]];}
 else if(t.dataset.vdown&&i<config.criteria.length-1){[config.criteria[i],config.criteria[i+1]]=[config.criteria[i+1],config.criteria[i]];}
 configSave();
}
function prepareReportData(){
 const report=snapshot(),cfg=report.settingsSnapshot;const sc=score();return {report,cfg,sc,comments:report.sections.comments,incidents:report.sections.incidentEvaluations||[],folios:report.sections.folioEvaluations||[]};
}
function printTable(heads,rows,widths=[]){return `<table class="visit-print-table"><colgroup>${widths.map(n=>`<col style="width:${n}%">`).join('')}</colgroup><thead><tr>${heads.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${heads.length}">Sin registros</td></tr>`}</tbody></table>`;}
function buildReport(){
 if(!source.isAuthorized())return;
 const {report,sc,comments,incidents,folios}=prepareReportData();
 // Cada apartado conserva una columna fija de comentarios, incluso si está vacía.
 // Mantener ambas columnas en el mismo flujo evita solapamientos al imprimir.
 const head=(i,content)=>{
   const comment=clean(comments[commentNames[i]]||'');
   return `<section class="visit-print-section"><h3><span>${esc(config.headings[i])}</span>${i?`<span class="visit-print-points">${scoreFmt(sc.parts[i])} / ${scoreFmt(configPoints(i))} pts</span>`:''}</h3><div class="visit-print-columns"><div class="visit-print-content">${content}</div><aside class="visit-print-comment"><strong>Comentarios</strong><div class="visit-print-comment-text">${esc(comment)}</div></aside></div></section>`;
 };
 const general=`<div class="visit-print-meta"><div><span>Coordinador:</span> <b>${esc(config.coordinator)}</b></div><div><span>Fecha:</span> <b>${fmt(report.visitedAt)}</b></div><div><span>Módulo:</span> <b>${esc(report.module)}</b></div><div><span>Supervisor:</span> <b>${esc(report.supervisor)}</b></div></div>`;
 const crit=config.criteria.filter(c=>c.enabled).map(c=>[c.label,report.sections.checklist[c.id]||'—',scoreFmt(c.weight)]);
 const c2=printTable(['Criterio','Cumple','Peso'],crit,[74,16,10]);
 const c3=printTable(['Folio','Registro','Calidad','≥ '+config.threshold+'%'],folios.map(f=>[f.folio,f.registration?'Sí':'No',f.quality+'%',f.approved?'Sí':'No']),[43,21,17,19]);
 const c4=printTable(['Folio','Responsable','Resolución'],incidents.map(i=>[i.folio,i.executive,i.status||'Pendiente']),[28,42,30]);
 const c5=printTable(['Fecha de compromiso','Cumplimiento'],[[fmt(report.sections.commitDate),report.sections.commitResult||'Sin evaluar']],[48,52]);
 const imgHead=config.headerVisible?`<img src="${esc(config.headerImage)}" alt="Logotipo">`:'';
 const imgSign=config.signatureVisible?`<img src="${esc(config.signatureImage)}" alt="Firma del coordinador">`:'';
 const html=`<div id="printPage" class="visit-print-page"><div class="visit-print-header">${imgHead}<div class="visit-print-title">${esc(config.title)}</div></div>${head(0,general)}${head(1,c2)}${head(2,c3)}${head(3,c4)}${head(4,c5)}<div class="visit-print-total">PUNTUACIÓN TOTAL: ${scoreFmt(sc.total)} PTS</div><div class="visit-print-signatures"><div><div class="visit-print-sign-space"></div><div class="sig-line">Firma del supervisor</div></div><div>${imgSign||'<div class="visit-print-sign-space"></div>'}<div class="sig-line">Firma del coordinador</div></div></div></div>`;
 const host=$('reportHost');host.innerHTML=html;
 const pg=$('printPage');pg.style.color=config.accentColor;pg.style.setProperty('--visit-accent',config.accentColor);
 pg.style.fontSize=(10*config.reportFontScale)+'px';pg.style.zoom='1';
 // La anchura física coincide con el área útil de una carta vertical (márgenes de 5 mm).
 // Reducir toda la página, nunca solo una columna, mantiene alineados tablas y comentarios.
 const maxHeight=995;
 const height=pg.scrollHeight;
 const ratio=Math.min(1,maxHeight/Math.max(height,1));
 pg.style.zoom=String(Math.max(.15,ratio));
 // Centra el acuse cuando debe reducirse para acomodar comentarios largos.
 pg.style.marginLeft=ratio<1?String((770*(1-ratio))/(2*Math.max(.15,ratio)))+'px':'0px';
 return pg;
}
function image(url){return new Promise((resolve,reject)=>{if(!url){resolve(null);return;}const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('No se pudo cargar una imagen del reporte.'));im.src=url;});}
async function exportPng(){
 if(!source.isAuthorized())return;
 const btn=$('visitPng');btn.disabled=true;btn.textContent='Generando…';
 try{
   const d=prepareReportData(),pageW=816,pageH=1056,margin=18,contentW=pageW-2*margin;
   const cv=document.createElement('canvas');cv.width=1700;cv.height=2200;
   const x=cv.getContext('2d');
   const [logo,sig]=await Promise.all([config.headerVisible?image(config.headerImage):null,config.signatureVisible?image(config.signatureImage):null]);
   const ink='#213d55',navy=config.accentColor,stroke='#c5d5e3',muted='#586f82';
   const font=(size=10,bold=false)=>`${bold?'700 ':''}${size}px Arial,Helvetica,sans-serif`;
   function wrap(value,maxWidth,size=9,bold=false){
     x.font=font(size,bold);const result=[];
     for(const para of String(value??'').split(/\r?\n/)){
       if(!para.trim()){result.push('');continue;}
       let line='';
       for(const word of para.trim().split(/\s+/)){
         const candidate=line?line+' '+word:word;
         if(x.measureText(candidate).width<=maxWidth){line=candidate;continue;}
         if(line){result.push(line);line='';}
         let piece='';
         for(const char of word){if(x.measureText(piece+char).width>maxWidth&&piece){result.push(piece);piece='';}piece+=char;}
         line=piece;
       }
       result.push(line);
     }
     return result.length?result:[''];
   }
   const txt=(s,xx,yy,size=9,bold=false,color=ink,real=false)=>{if(real){x.font=font(size,bold);x.fillStyle=color;x.fillText(String(s),xx,yy);}};
   const lines=(str,xx,yy,maxWidth,size=9,leading=11,bold=false,color=ink,real=false)=>{
     const out=wrap(str,maxWidth,size,bold);if(real)out.forEach((ln,j)=>txt(ln,xx,yy+j*leading+size,size,bold,color,true));return out.length*leading;
   };
   const rect=(xx,yy,w,h,fill,border,real)=>{if(real){if(fill){x.fillStyle=fill;x.fillRect(xx,yy,w,h);}if(border){x.strokeStyle=border;x.lineWidth=.6;x.strokeRect(xx,yy,w,h);}}};
   const leftW=Math.round(contentW*.665),gap=7,rightW=contentW-leftW-gap;
   function drawTable(heads,rows,widths,xx,yy,w,real){
     const cw=widths.map(q=>w*q/100),pads=4;
     const row=(cells,ypos,isHeader)=>{
       const size=isHeader?7.55:8.1,leading=isHeader?9.4:10;
       const content=cells.map((v,j)=>wrap(v,cw[j]-pads*2,size,isHeader));
       const h=Math.max(isHeader?18:17,...content.map(a=>a.length*leading+7));
       rect(xx,ypos,w,h,isHeader?'#e9f1f9':null,stroke,real);
       let colX=xx;
       content.forEach((arr,j)=>{if(j>0&&real){x.strokeStyle=stroke;x.lineWidth=.5;x.beginPath();x.moveTo(colX,ypos);x.lineTo(colX,ypos+h);x.stroke();}
         if(real)arr.forEach((ln,k)=>txt(ln,colX+pads,ypos+5+k*leading+size,size,isHeader,isHeader?navy:ink,true));colX+=cw[j];});
       return h;
     };
     let off=0;off+=row(heads,yy+off,true);
     if(rows.length){rows.forEach(v=>{off+=row(v,yy+off,false);});}
     else off+=row(['Sin registros',...heads.slice(1).map(()=> '')],yy+off,false);
     return off;
   }
   function drawMeta(xx,yy,w,real){
     const pairs=[['Coordinador',config.coordinator],['Fecha',fmt(d.report.visitedAt)],['Módulo',d.report.module],['Supervisor',d.report.supervisor]];
     const cw=w/2,items=pairs.map(([k,v])=>`${k}: ${v||'—'}`),hs=items.map((v)=>wrap(v,cw-10,9.2).length*12);
     const row1=Math.max(hs[0],hs[1],16),row2=Math.max(hs[2],hs[3],16);
     if(real){lines(items[0],xx+4,yy,cw-10,9.2,12,false,ink,true);lines(items[1],xx+cw+3,yy,cw-10,9.2,12,false,ink,true);
       lines(items[2],xx+4,yy+row1+3,cw-10,9.2,12,false,ink,true);lines(items[3],xx+cw+3,yy+row1+3,cw-10,9.2,12,false,ink,true);}
     return row1+row2+9;
   }
   const secData=[
     {kind:'meta'},
     {heads:['Criterio','Cumple','Peso'],rows:config.criteria.filter(c=>c.enabled).map(c=>[c.label,d.report.sections.checklist[c.id]||'—',scoreFmt(c.weight)]),widths:[73,17,10]},
     {heads:['Folio','Registro','Calidad','≥ '+config.threshold+'%'],rows:d.folios.map(f=>[f.folio,f.registration?'Sí':'No',f.quality+'%',f.approved?'Sí':'No']),widths:[39,23,18,20]},
     {heads:['Folio','Responsable','Resolución'],rows:d.incidents.map(i=>[i.folio,i.executive,i.status||'Pendiente']),widths:[26,42,32]},
     {heads:['Fecha compromiso','Cumplimiento'],rows:[[fmt(d.report.sections.commitDate),d.report.sections.commitResult||'Sin evaluar']],widths:[52,48]}
   ];
   function render(real){
     let y=margin;
     const hHeader=60;
     if(logo&&real)x.drawImage(logo,margin,y,250,51);
     const titleX=logo?310:margin+4;
     lines(config.title,titleX,y+10,pageW-margin-titleX,13,15,true,navy,real);
     if(real){x.strokeStyle=navy;x.lineWidth=1.8;x.beginPath();x.moveTo(margin,y+hHeader);x.lineTo(pageW-margin,y+hHeader);x.stroke();}
     y+=hHeader+7;
     secData.forEach((section,i)=>{
       const scoreStr=i?`${scoreFmt(d.sc.parts[i])} / ${scoreFmt(configPoints(i))} pts`:'';
       const headingW=contentW-(i?117:0)-10;
       const titleLines=wrap(config.headings[i],headingW,10.2,true);
       const headingH=Math.max(21,titleLines.length*12+6);
       rect(margin,y,contentW,headingH,'#e8f1fa',null,real);
       titleLines.forEach((ln,j)=>txt(ln,margin+5,y+4+(j+1)*11,10.2,true,navy,real));
       if(i)txt(scoreStr,pageW-margin-111,y+15,9.1,true,navy,real);
       y+=headingH+4;
       const mainH=section.kind==='meta'?drawMeta(margin,y,leftW,real):drawTable(section.heads,section.rows,section.widths,margin,y,leftW,real);
       const comment=clean(d.comments[commentNames[i]]||'');
       const commentLines=wrap(comment,rightW-14,8.5);
       const textH=comment?commentLines.length*10.9+8:0;
       const blockH=Math.max(mainH,43,19+textH);
       const boxX=margin+leftW+gap;
       rect(boxX,y,rightW,blockH,'#f6f9fc',stroke,real);
       txt('COMENTARIOS',boxX+7,y+13,8.5,true,navy,real);
       if(real&&comment)commentLines.forEach((ln,j)=>txt(ln,boxX+7,y+22+j*10.9,8.5,false,ink,true));
       y+=blockH+8;
     });
     y+=4;
     if(real){x.strokeStyle=navy;x.lineWidth=1.3;x.beginPath();x.moveTo(margin,y);x.lineTo(pageW-margin,y);x.stroke();}
     txt('PUNTUACIÓN TOTAL: '+scoreFmt(d.sc.total)+' PTS',pageW-margin-234,y+18,13.5,true,navy,real);
     y+=40;
     if(sig&&real)x.drawImage(sig,510,y-14,175,41);
     if(real){x.strokeStyle='#50677b';x.lineWidth=.8;x.beginPath();x.moveTo(66,y+33);x.lineTo(341,y+33);x.moveTo(464,y+33);x.lineTo(744,y+33);x.stroke();}
     txt('Firma del supervisor',139,y+46,9,false,muted,real);
     txt('Firma del coordinador',565,y+46,9,false,muted,real);
     y+=55;
     return y+margin;
   }
   const rawH=render(false);
   const fit=Math.min(1,(pageH-7)/Math.max(rawH,1));
   x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);
   const outputScale=cv.width/pageW;
   x.save();x.scale(outputScale,outputScale);x.translate((pageW-pageW*fit)/2,3);x.scale(fit,fit);render(true);x.restore();
   const blob=await new Promise(res=>cv.toBlob(res,'image/png'));if(!blob)throw Error('El navegador no pudo generar el PNG.');
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`visita_coordinacion_${visit.visitedAt}_${visit.module.replace(/[^a-z0-9áéíóúñ_-]/gi,'_').slice(0,30)||'modulo'}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(e){alert('No se pudo exportar el PNG: '+e.message);}finally{btn.disabled=false;btn.textContent='PNG';}
}
function setup(){
 $('visitForm').addEventListener('change',handleChange);$('visitForm').addEventListener('input',handleInput);
 $('visitNew').addEventListener('click',newVisit);$('visitSave').addEventListener('click',saveVisit);
 $('visitPdf').addEventListener('click',()=>{buildReport();window.print();});$('visitPng').addEventListener('click',exportPng);
 $('visitRefresh').addEventListener('click',()=>refreshHistory(true));
 $('visitHistoryList').addEventListener('click',e=>{const id=e.target.dataset.loadVisit,del=e.target.dataset.delVisit;if(id)loadVisit(id);if(del)deleteVisit(del);});
 $('visitsSettingsEditor').addEventListener('change',e=>{if(e.target?.type==='file')settingImageUpload(e.target);else configChange(e);});
 $('visitsSettingsEditor').addEventListener('click',configClick);
 renderSettings();sourceRefresh();
}
window.VISITS={
 open(){if(!source.isAuthorized())return;active=true;config=readConfig();renderSettings();sourceRefresh();void refreshHistory();},
 refreshSources:sourceRefresh,buildReport,exportPng
};
setup();
