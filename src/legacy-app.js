
(() => {
  'use strict';
  const KEYS=['goal','reg','guar','dental','app','p0','xreg','xguar','xdental','xapp','xp0','inc','recover'];
  const DEFAULT_BASE={goal:10,reg:6,guar:3,dental:5,app:9,p0:2,xreg:0,xguar:0,xdental:0,xapp:0,xp0:0,inc:0,recover:0};
  const DEFAULT_SIM={...DEFAULT_BASE,reg:7,dental:6,app:10,p0:3};
  const storageKey='wmSamsComisionesV1';
  const DEFAULT_TIER=[
    {min:50,label:'50% a menos de 61%',sale:50,dental:50,app:50,p0:140,bonus:300},
    {min:61,label:'61% a menos de 81%',sale:70,dental:70,app:70,p0:230,bonus:450},
    {min:81,label:'81% a menos de 101%',sale:90,dental:90,app:90,p0:290,bonus:650},
    {min:101,label:'101% o más',sale:130,dental:100,app:130,p0:350,bonus:800}
  ];
  const TIER=DEFAULT_TIER.map(rate=>({...rate}));
  const RATES_STORAGE='wmSamsComisionesTarifasV14';
  const RATE_FIELDS=['sale','dental','app','p0','bonus'];
  const RATE_LABELS={sale:'Venta',dental:'Dental',app:'APP',p0:'Programa Cero',bonus:'Bono semanal'};
  function validRateAmount(value){return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1000000&&Math.abs(value*100-Math.round(value*100))<1e-7;}
  function loadCommissionRates(){
    try{
      const saved=JSON.parse(localStorage.getItem(RATES_STORAGE)||'null');
      if(!Array.isArray(saved)||saved.length!==TIER.length)return;
      saved.forEach((row,i)=>{if(row&&typeof row==='object')RATE_FIELDS.forEach(field=>{
        if(validRateAmount(row[field]))TIER[i][field]=row[field];
      });});
    }catch(_){}
  }
  function saveCommissionRates(){
    try{localStorage.setItem(RATES_STORAGE,JSON.stringify(TIER.map(row=>Object.fromEntries(RATE_FIELDS.map(k=>[k,row[k]])))));}catch(_){}
  }
  loadCommissionRates();
  const money=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2});
  const number=new Intl.NumberFormat('es-MX',{maximumFractionDigits:2});
  const esc=v=>String(v).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const mx=v=>money.format(v);
  const pct=v=>`${number.format(v)}%`;
  const round=v=>Math.round((v+Number.EPSILON)*100)/100;
  const el=id=>document.getElementById(id);
  const state={base:{...DEFAULT_BASE},sim:{...DEFAULT_SIM}};


// El mismo parser para XLS-HTML y las mismas reglas base de ventas del Dashboard V21.
const REQUIRED_COLS=['Módulo','Ejecutivo','Código','Programa Cero','Salud Dental','Fecha','Garantizada','Folio','Estatus'];
const XLS_LIMIT=30*1024*1024;
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase();
const isYes=v=>['SI','S','TRUE','VERDADERO','1','ACTIVADA','ACTIVADO'].includes(normalize(v));
const isNo=v=>['NO','N','FALSE','FALSO','0'].includes(normalize(v));
const isNonPayableStatus=v=>['CANCELADA','INCOMPLETA','RECHAZO'].includes(normalize(v));
let simDirty=false;
  const imported={data:null,week:'',executive:'',flags:new Set(),appDisabled:new Set(),recoverManual:0,sourceName:''};
const tableView={columns:[],visible:new Set(),showNoCode:false};
const TABLE_VIEW_STORAGE='wmSamsTablaVisualV18';
// Filtros operativos: sólo en esta pestaña; nunca se envían a PostgreSQL.
const TABLE_FILTERS_SESSION_PREFIX='wmSamsFiltrosLocalesV191:';
function tableFilterSessionKey(){return TABLE_FILTERS_SESSION_PREFIX+String(window.APP_CLOUD?.user?.id||'guest');}
const TABLE_FILTER_CONTROL_IDS=['tableScope','tableFilter','tablePaymentFilter','tableIncFilter','tableAppFilter','tableColumnFilter','tableColumnValue'];

const TEAM_GOALS_STORAGE='wmSamsComisionesMetasEquipoV1';
const TEAM_RECOVERY_STORAGE='wmSamsComisionesRecuperacionesEquipoV1';
const teamGoals=loadTeamStore(TEAM_GOALS_STORAGE),teamRecoveries=loadTeamStore(TEAM_RECOVERY_STORAGE);
let activePage='individual';
function loadTeamStore(key){try{const v=JSON.parse(localStorage.getItem(key)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(_){return {}}}
function teamKey(week,name){return `${week}::${name}`;}
function executiveGoal(week,name){const n=teamGoals[teamKey(week,name)];return Number.isInteger(n)&&n>0?n:qualityConfig.execWeeklyGoal;}
function executiveRecovery(week,name){const n=teamRecoveries[teamKey(week,name)];return Number.isFinite(n)&&n>=0?n:0;}
function setExecutiveGoal(week,name,goal){if(Number.isInteger(goal)&&goal>=1){teamGoals[teamKey(week,name)]=goal;try{localStorage.setItem(TEAM_GOALS_STORAGE,JSON.stringify(teamGoals))}catch(_){}}}
function setExecutiveRecovery(week,name,recover){if(Number.isFinite(recover)&&recover>=0){teamRecoveries[teamKey(week,name)]=recover;try{localStorage.setItem(TEAM_RECOVERY_STORAGE,JSON.stringify(teamRecoveries))}catch(_){}}}

let inputMode='manual';
const fmtDay=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return iso;const [y,m,d]=iso.split('-');return `${d}/${m}/${y}`;};
function isoDate(value){
  const raw=String(value||'').trim();
  let m=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m)return `${m[1]}-${m[2]}-${m[3]}`;
  m=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return '';
}
const dateFromIso=iso=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d,12);};
const dateIso=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
function mondayOf(iso){let d=dateFromIso(iso);const offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset);return dateIso(d);}
function sundayOf(iso){let d=dateFromIso(iso);d.setDate(d.getDate()+6);return dateIso(d);}
const weekLabel=iso=>`${fmtDay(iso)} — ${fmtDay(sundayOf(iso))}`;
function parseXlsHtml(html){
  if(!/<table[\s>]/i.test(html))throw Error('No se encontró una tabla HTML: se requiere XLS exportado como HTML, no XLS binario.');
  const doc=new DOMParser().parseFromString(html,'text/html');
  const tables=[...doc.querySelectorAll('table')];
  const table=tables.sort((a,b)=>b.querySelectorAll('tr').length-a.querySelectorAll('tr').length)[0];
  if(!table)throw Error('El XLS no contiene una tabla utilizable.');
  const trs=[...table.querySelectorAll('tr')];
  let headerAt=trs.findIndex(tr=>tr.querySelectorAll('th').length>=4);
  if(headerAt===-1)headerAt=0;
  const cells=tr=>[...tr.children].filter(e=>/^(TH|TD)$/i.test(e.tagName));
  const headers=cells(trs[headerAt]).map((c,i)=>c.textContent.trim().replace(/\s+/g,' ')||(i===0?'N.º':`Columna ${i+1}`));
  if(headers.length<4)throw Error('Faltan encabezados en la tabla XLS.');
  const missing=REQUIRED_COLS.filter(c=>!headers.some(h=>normalize(c)===normalize(h)));
  if(missing.length)throw Error('Faltan columnas necesarias para la calculadora: '+missing.join(', '));
  const idx=Object.fromEntries(headers.map((v,i)=>[normalize(v),i]));
  const parsed=[];
  for(const tr of trs.slice(headerAt+1)){
    const parts=cells(tr).map(c=>c.textContent.trim().replace(/\s+/g,' '));
    if(!parts.length||parts.every(c=>!c))continue;
    while(parts.length<headers.length)parts.push('');
    const raw=parts.slice(0,headers.length);
    const get=k=>String(raw[idx[normalize(k)]]??'').trim();
    const fecha=isoDate(get('Fecha'));
    const folio=get('Folio');
    parsed.push({i:parsed.length,raw,folio,fecha,week:fecha?mondayOf(fecha):'',executive:get('Ejecutivo'),module:get('Módulo'),code:get('Código'),status:get('Estatus'),guaranteed:get('Garantizada'),dental:get('Salud Dental'),p0:get('Programa Cero'),appField:''});
  }
  if(!parsed.length)throw Error('No se encontraron registros en el XLS.');
  const appColumn=headers.find(h=>['ACT APP','ACTIVACION APP','APP INVEX','ACTIVACION','APP'].includes(normalize(h)))||null;
  if(appColumn)for(const r of parsed)r.appField=r.raw[idx[normalize(appColumn)]]||'';
  const hasDates=parsed.some(r=>r.week);
  if(!hasDates)throw Error('Ningún registro contiene una fecha reconocible.');
  return {headers,rows:parsed,appColumn};
}
function statusBox(text,kind=''){
  el('importStatus').className='import-status '+kind;
  el('importStatus').innerHTML=text;
}
function importActive(){return inputMode==='import'&&!!imported.data;}
function resetToManual(){
  inputMode='manual';document.body.classList.remove('import-mode');
  el('recordsSection').hidden=true;el('printRecordsSection').hidden=true;el('sec-records').hidden=true;
  el('base-goal').readOnly=false;
  for(const k of KEYS)el('base-'+k).readOnly=false;
  el('baseImportCounts').textContent='';
  const tag=document.querySelector('.scenario.base .tag');tag.textContent='Original';
  statusBox(imported.data?'Modo manual activo. Puedes volver a utilizar el XLS seleccionando una semana o ejecutivo.':'Modo manual activo. Importa un XLS para precargar los datos.', '');
  render();
}
function rowsForSelection(){
  if(!imported.data||!imported.week||!imported.executive)return [];
  return imported.data.rows.filter(r=>r.week===imported.week&&r.executive===imported.executive);
}
const hasCode=r=>!!r.code.trim();
const guaranteeType=r=>isYes(r.guaranteed)?'guar':isNo(r.guaranteed)?'reg':null;
const candidate=r=>hasCode(r)&&!!guaranteeType(r);
const autoSkipped=r=>isNonPayableStatus(r.status);
const selectedIncident=r=>imported.flags.has(r.uid||String(r.i));
const appEnabled=r=>hasCode(r)&&!imported.appDisabled.has(r.uid||String(r.i));
const excluded=r=>autoSkipped(r)||selectedIncident(r);
const payable=r=>candidate(r)&&!excluded(r);
function buildImportedCounts(rows,goal,recover=0){
  const next=Object.fromEntries(KEYS.map(k=>[k,0]));
  next.goal=goal;
  for(const r of rows){
    if(selectedIncident(r))next.inc++;
    if(!candidate(r))continue;
    const type=guaranteeType(r);
    next[type]++;
    const isDental=isYes(r.dental),isP0=type==='reg'&&isYes(r.p0);
    if(isDental)next.dental++;
    if(isP0)next.p0++;
    if(appEnabled(r))next.app++;
    if(excluded(r)){
      next[type==='reg'?'xreg':'xguar']++;
      if(isDental)next.xdental++;
      if(isP0)next.xp0++;
      if(appEnabled(r))next.xapp++;
    }
  }
  next.recover=recover;
  return next;
}
function computeImportedBase(){
  const rows=rowsForSelection();
  if(!imported.week||!imported.executive)return;
  const goal=executiveGoal(imported.week,imported.executive);
  imported.recoverManual=executiveRecovery(imported.week,imported.executive);
  const next=buildImportedCounts(rows,goal,imported.recoverManual);
  state.base=next;
  if(!simDirty){state.sim={...next};setForm('sim');}
  const valid=next.reg+next.guar-next.xreg-next.xguar;
  for(const k of KEYS)el('base-'+k).readOnly=!['goal','recover'].includes(k);
  el('baseImportCounts').innerHTML=`<strong>${rows.length}</strong> registros en filtro · <strong>${valid}</strong> ventas comisionables · <strong>${next.app-next.xapp}</strong> APP activas comisionables · <strong>${next.xreg+next.xguar}</strong> ventas descartadas · <strong>${next.inc}</strong> incidencias marcadas`;
  // Derivado del XLS seleccionado: cambiar semana o ejecutivo es navegación local.
  // NO llamar persist(): éste actualiza wmSamsComisionesV1 y disparaba un PUT
  // a PostgreSQL por cada cambio de filtro, incluso al cargar el historial.
  // Las metas y recuperaciones explícitas se guardan mediante sus propios handlers.
  setForm('base');render();
  renderTeam();
}
function chooseWeekAndExecutive(){
  if(!imported.data)return;
  const weeks=[...new Set(imported.data.rows.map(r=>r.week).filter(Boolean))].sort().reverse();
  const thisWeek=mondayOf(dateIso(new Date()));
  if(!weeks.includes(imported.week))imported.week=weeks.find(w=>w<thisWeek)||weeks[0]||'';
  el('weekSelect').innerHTML=weeks.map(w=>`<option value="${esc(w)}">${weekLabel(w)}${w===thisWeek?' · en curso':''}</option>`).join('');
  el('weekSelect').value=imported.week;el('weekSelect').disabled=false;
  chooseExecutive();
  populateTeamModules();
  renderTeam();
}
function chooseExecutive(){
  if(!imported.data)return;
  const names=[...new Set(imported.data.rows.filter(r=>r.week===imported.week).map(r=>r.executive).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  if(!names.includes(imported.executive))imported.executive=names[0]||'';
  el('executiveSelect').innerHTML=names.length?names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join(''):'<option value="">Sin ejecutivos en esta semana</option>';
  el('executiveSelect').value=imported.executive;el('executiveSelect').disabled=!names.length;
  inputMode='import';document.body.classList.add('import-mode');
  document.querySelector('.scenario.base .tag').textContent='Datos XLS';
  el('recordsSection').hidden=false;el('printRecordsSection').hidden=false;el('sec-records').hidden=false;
  simDirty=false;computeImportedBase();state.sim={...state.base};setForm('sim');render();renderRecords();renderTeam();
}
function drawImportMeta(name){
  const total=imported.data.rows.length;
  const thisRows=rowsForSelection();
  const dated=thisRows.filter(r=>r.fecha).length;
  const autoIgnored=thisRows.filter(r=>candidate(r)&&autoSkipped(r)).length;
  statusBox(`Datos activos: <strong>${selectedArchiveReports().length}</strong> archivo(s) · <strong>${number.format(total)}</strong> registros únicos · Semana: <strong>${esc(weekLabel(imported.week))}</strong> · Ejecutivo: <strong>${esc(imported.executive)}</strong>. APP activa por defecto en folios con Código.`, 'success');
  el('importBadges').hidden=false;
  el('importBadges').innerHTML=`<span>${number.format(total)} filas importadas</span><span>${thisRows.length} del ejecutivo/semana</span><span>${dated} fechas válidas</span><span>${autoIgnored} ventas con estatus no pagable</span>`;
}
// V9 · Base local de reportes XLS (IndexedDB) y selección persistente.
const ARCHIVE_DB='wmSamsArchivoComisionesV9', ARCHIVE_STORE='reports';
const ARCHIVE_SELECTION_KEY='wmSamsArchivoSeleccionV9', FOLIO_FLAGS_KEY='wmSamsFolioFlagsV9';
const archive={db:null,reports:[],selection:{mode:'all',ids:[]},ready:false,tempReports:[],temporaryMode:false};
function archiveSelectionRestore(){
  try{const v=JSON.parse(localStorage.getItem(ARCHIVE_SELECTION_KEY)||'null');
    if(v&&['all','selected'].includes(v.mode)&&Array.isArray(v.ids))archive.selection={mode:v.mode,ids:v.ids.filter(x=>typeof x==='string')};
  }catch(_){}
}
function archiveSelectionSave(){try{localStorage.setItem(ARCHIVE_SELECTION_KEY,JSON.stringify(archive.selection));}catch(_){}}
function loadFolioFlags(){try{const o=JSON.parse(localStorage.getItem(FOLIO_FLAGS_KEY)||'{}');
  imported.flags=new Set(Array.isArray(o.incidents)?o.incidents:[]);
  imported.appDisabled=new Set(Array.isArray(o.appsOff)?o.appsOff:[]);
  }catch(_){imported.flags=new Set();imported.appDisabled=new Set();}}
function saveFolioFlags(){if(archive.temporaryMode||!isAuthorized())return;try{localStorage.setItem(FOLIO_FLAGS_KEY,JSON.stringify({incidents:[...imported.flags],appsOff:[...imported.appDisabled]}));}catch(_){}}
function openArchiveDB(){return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('El navegador no permite IndexedDB. Abre la página en un navegador moderno.'));return;}
  const req=indexedDB.open(ARCHIVE_DB,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(ARCHIVE_STORE))db.createObjectStore(ARCHIVE_STORE,{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('No se pudo abrir el almacén local.'));
});}
function archiveDBRequest(type,fn){return new Promise((resolve,reject)=>{
  const tx=archive.db.transaction(ARCHIVE_STORE,type),store=tx.objectStore(ARCHIVE_STORE),req=fn(store);
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Error en IndexedDB'));
  tx.onabort=()=>reject(tx.error||Error('No se pudieron guardar los datos.'));
});}
const archiveGetAll=()=>isAuthorized()?window.APP_CLOUD.listFiles():Promise.resolve([]);
const archivePut=rec=>isAuthorized()?window.APP_CLOUD.putFile(rec):Promise.reject(Error('Inicia sesión antes de guardar en la nube.'));
const archiveDelete=id=>isAuthorized()?window.APP_CLOUD.deleteFile(id):Promise.reject(Error('Acceso restringido.'));
const archiveClear=()=>isAuthorized()?window.APP_CLOUD.clearFiles():Promise.reject(Error('Acceso restringido.'));
function hashString(s){let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return (x>>>0).toString(36);}
function bytesFingerprint(bytes){let x=2166136261;for(const c of bytes){x^=c;x=Math.imul(x,16777619);}return `${bytes.length}-${(x>>>0).toString(36)}`;}
function selectedArchiveReports(){const ids=new Set(archive.selection.ids);return archive.selection.mode==='all'?archive.reports:archive.reports.filter(r=>ids.has(r.id));}
function combinedArchiveData(reports){
  if(!reports.length)return null;
  const headers=[],seen=new Set();
  reports.forEach(rep=>rep.headers.forEach(h=>{const key=normalize(h);if(!seen.has(key)){headers.push(h);seen.add(key);}}));
  const map=new Map();
  for(const report of reports){
    const positions=Object.fromEntries(report.headers.map((h,i)=>[normalize(h),i]));
    const counts=new Map();
    for(const row of report.rows){
      const get=k=>String(row[positions[normalize(k)]]??'').trim();
      const fecha=isoDate(get('Fecha')),folio=get('Folio'),executive=get('Ejecutivo'),module=get('Módulo');
      // Usamos el folio + fecha + ejecutivo + módulo; si falta folio, el contenido sin el consecutivo.
      const basis=folio?['F',normalize(folio),fecha,normalize(executive),normalize(module)].join('|'):
          ['R',...row.slice(1).map(normalize)].join('|');
      const next=(counts.get(basis)||0)+1;counts.set(basis,next);
      const uid=hashString(basis)+'_'+hashString(basis.split('').reverse().join(''))+'_'+next;
      const out={i:0,uid,raw:headers.map(h=>String(row[positions[normalize(h)]]??'').trim()),folio,fecha,
        week:fecha?mondayOf(fecha):'',executive,module,code:get('Código'),status:get('Estatus'),
        guaranteed:get('Garantizada'),dental:get('Salud Dental'),p0:get('Programa Cero'),appField:''};
      map.set(basis+'#'+next,out); // el reporte más reciente prevalece para el mismo folio.
    }
  }
  const rows=[...map.values()];rows.forEach((r,i)=>r.i=i);
  return {headers,rows,appColumn:null};
}
function renderArchiveList(){
  if(!el('archiveList'))return;
  for(const radio of document.querySelectorAll('[name=archiveMode]'))radio.checked=radio.value===archive.selection.mode;
  const idSet=new Set(archive.selection.ids),sel=selectedArchiveReports();
  el('archiveList').innerHTML=archive.reports.length?archive.reports.map(r=>`<div class="archive-item">
    <label class="archive-choice"><input type="checkbox" data-report-id="${esc(r.id)}" ${archive.selection.mode==='all'||idSet.has(r.id)?'checked':''} ${archive.selection.mode==='all'?'disabled':''}>
    <span style="min-width:0"><b title="${esc(r.name)}">${esc(r.name)}</b><small>${r.rows.length} registros · ${new Date(r.addedAt).toLocaleDateString('es-MX')} · ${Math.round((r.size||0)/1024)} KB</small></span></label>
    <button class="btn small" type="button" data-delete-report="${esc(r.id)}" aria-label="Eliminar ${esc(r.name)}">Eliminar</button></div>`).join(''):
    '<div class="archive-empty">No hay XLS guardados. Usa «Cargar XLS» para agregarlos.</div>';
  const n=sel.length,unique=imported.data?.rows.length||0;
  el('archiveActive').textContent=archive.temporaryMode?`Temporal: ${archive.tempReports.length} XLS solo en memoria · ${number.format(unique)} registros únicos. No se guardan en el historial.`:`${archive.selection.mode==='all'?'Acumulado':'Selección'}: ${n} de ${archive.reports.length} archivos · ${number.format(unique)} registros únicos`;
  el('archiveClear').disabled=!archive.reports.length;
}
function refreshArchiveData(forceImportMode=false){
  const files=archive.temporaryMode?archive.tempReports:selectedArchiveReports(),data=combinedArchiveData(files);
  const previousWeek=imported.week,previousExec=imported.executive;
  imported.data=data;imported.sourceName='';
  if(data){
    inputMode='import';document.body.classList.add('import-mode');
    imported.week=previousWeek;imported.executive=previousExec;simDirty=false;
    initializeTableView(data);chooseWeekAndExecutive();renderDaily();
    drawImportMeta('');
    el('recordsDisclosure').open=true;
  }else{
    imported.week='';imported.executive='';
    if(forceImportMode||inputMode==='import')resetToManual();
    el('weekSelect').innerHTML='<option value="">Sin semanas disponibles</option>';el('weekSelect').disabled=true;
    el('executiveSelect').innerHTML='<option value="">Sin ejecutivos disponibles</option>';el('executiveSelect').disabled=true;
    populateTeamModules();renderTeam();renderDaily();
    statusBox(archive.temporaryMode?'Sin archivos temporales en esta sesión.':archive.reports.length?'No hay archivos seleccionados. Activa al menos uno desde Ajustes.':'No hay archivos guardados. Usa «Cargar XLS» para importar.');
  }
  renderArchiveList();
  renderQualitySettings();renderSupervisorSettings();
  renderAccumulated();
  renderWeekly();
  allRecordsView.selectedValues.clear();
  el('allRecordsColumn').value='';el('allRecordsValueSearch').value='';
  populateAllRecordsMainFilters();populateAllRecordsColumns();allRecordsView.page=1;renderAllRecords();
}
async function importXlsFiles(files){
  if(!files?.length)return;
  // Sólo una sesión autorizada puede incorporar datos a IndexedDB.
  // Si no hay sesión, los XLS residen exclusivamente en memoria hasta cerrar o recargar.
  const persistent=isAuthorized();
  if(persistent&&!archive.ready){statusBox('No está disponible el historial en línea. No se pudo guardar el XLS.','error');return;}
  const target=persistent?archive.reports:archive.tempReports;
  let added=0,duplicated=0,failures=[];
  for(const file of [...files]){
    try{
      if(!/\.xls$/i.test(file.name))throw Error('Debe ser XLS exportado como HTML.');
      if(file.size>XLS_LIMIT)throw Error('El archivo supera 30 MB.');
      const buffer=await file.arrayBuffer(),fingerprint=bytesFingerprint(new Uint8Array(buffer));
      if(target.some(r=>r.fingerprint===fingerprint)){duplicated++;continue;}
      let html=new TextDecoder('utf-8').decode(buffer);
      if(!/<table[\s>]/i.test(html))html=new TextDecoder('windows-1252').decode(buffer);
      const data=parseXlsHtml(html);
      const record={id:'xls_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9),
        name:file.name,size:file.size,addedAt:Date.now(),fingerprint,
        headers:data.headers,rows:data.rows.map(r=>r.raw)};
      if(persistent)await archivePut(record);
      target.push(record);added++;
    }catch(err){failures.push(file.name+': '+(err.message||'Error de lectura'));}
  }
  target.sort((a,b)=>a.addedAt-b.addedAt||a.id.localeCompare(b.id));
  if(added||target.length){
    archive.temporaryMode=!persistent;
    // Mantener las marcas de los folios de histórico, pero no persistir cambios temporales.
    loadFolioFlags();
    refreshArchiveData(true);window.VISITS?.refreshSources();
  }
  const stateText=persistent?
    `${added} archivo(s) guardado(s) en el historial · ${duplicated} duplicado(s) omitido(s).`:
    `${added} archivo(s) temporal(es) · ${duplicated} duplicado(s) omitido(s). No se guardan: al recargar o cerrar esta página se perderán.`;
  if(failures.length)statusBox(esc(stateText+' Errores: '+failures.join('; ')),'error');
  else if(added||target.length)statusBox(esc(stateText)+` ${number.format(imported.data?.rows.length||0)} registros únicos en uso.`,'success');
  el('xlsInput').value='';
}

async function initArchive(){
  archiveSelectionRestore();loadFolioFlags();
  try{
    archive.reports=await archiveGetAll();archive.reports.sort((a,b)=>a.addedAt-b.addedAt||a.id.localeCompare(b.id));archive.ready=isAuthorized();
    refreshArchiveData(true);window.VISITS?.refreshSources();
  }catch(err){archive.ready=false;renderArchiveList();statusBox('No se pudo conectar al historial en línea: '+esc(err.message||String(err))+'. Comprueba la conexión, la sesión y Netlify Database.','error');}
}
// Columnas configurables y filtros visuales (no alteran las métricas por sí mismos).
function columnLabel(c){return c.key==='incident'?'Incidencia':c.key==='app'?'APP':c.key==='payment'?'Validación de pago':c.name;}
// Conversión estrictamente visual: los valores del XLS siguen intactos para las comisiones.
function displayXlsValue(raw){
  const value=String(raw??'').trim();
  if(normalize(value)==='S')return 'Colocado';
  if(normalize(value)==='N')return '';
  return value;
}
function getCellText(r,key){
  if(key==='incident')return selectedIncident(r)?'Sí':'No';
  if(key==='app')return appEnabled(r)?'Sí':'No';
  if(key==='payment')return payable(r)?'Comisionable':hasCode(r)?'No pagable':'No se completó la venta';
  if(key.startsWith('raw:'))return String(r.raw[Number(key.slice(4))]??'').trim();
  return '';
}
function initializeTableView(data){
  tableView.columns=[{key:'incident',name:'Incidencia'},{key:'app',name:'APP'},...data.headers.map((h,i)=>({key:'raw:'+i,name:h||'Columna '+(i+1)})),{key:'payment',name:'Validación de pago'}];
  resetTableView();
  el('tableColumnFilter').innerHTML='<option value="">Sin filtro de columna</option>'+tableView.columns.map(c=>`<option value="${esc(c.key)}">${esc(columnLabel(c))}</option>`).join('');
  refreshValueFilter();
  restoreTableView();
}
function saveTableView(){
  // Sólo las columnas elegidas son una preferencia compartida entre dispositivos.
  if(!isAuthorized())return;
  try{localStorage.setItem(TABLE_VIEW_STORAGE,JSON.stringify({
    visible:[...tableView.visible]
  }));}catch(_){}
}
function saveTableFilters(){
  // Buscar, seleccionar o cambiar un filtro no genera solicitudes a Netlify.
  try{sessionStorage.setItem(tableFilterSessionKey(),JSON.stringify({
    showNoCode:tableView.showNoCode,
    controls:Object.fromEntries(TABLE_FILTER_CONTROL_IDS.map(id=>[id,el(id)?.value||'']))
  }));}catch(_){}
}
function restoreTableView(){
  try{
    const shared=JSON.parse(localStorage.getItem(TABLE_VIEW_STORAGE)||'null');
    if(shared&&typeof shared==='object'){
      const keys=new Set(tableView.columns.map(c=>c.key));
      const selected=Array.isArray(shared.visible)?shared.visible.filter(k=>keys.has(k)):[];
      if(selected.length)tableView.visible=new Set(selected);
    }
  }catch(err){console.warn('Preferencias visuales inválidas',err);}
  try{
    // Los filtros son exclusivos de esta pestaña. No se recuperan desde la nube.
    const saved=JSON.parse(sessionStorage.getItem(tableFilterSessionKey())||'null');
    if(saved&&typeof saved==='object'){
      tableView.showNoCode=saved.showNoCode!==false;
      el('showNoCode').checked=tableView.showNoCode;
      if(saved.controls&&typeof saved.controls==='object'){
        for(const id of TABLE_FILTER_CONTROL_IDS){
          const value=saved.controls[id];
          if(typeof value==='string'&&el(id))el(id).value=value;
        }
        refreshValueFilter();
        if(typeof saved.controls.tableColumnValue==='string')el('tableColumnValue').value=saved.controls.tableColumnValue;
      }
    }
  }catch(err){console.warn('Filtros temporales inválidos',err);}
  redrawColumnSettings();
}
function resetTableView(){
  const base=['FOLIO','GARANTIZADA','FECHA','PROGRAMA CERO','SALUD DENTAL'];
  tableView.visible=new Set(tableView.columns.filter(c=>['incident','app','payment'].includes(c.key)||(c.key.startsWith('raw:')&&base.includes(normalize(c.name)))).map(c=>c.key));
  tableView.showNoCode=true;
  for(const [id,value] of [['tableScope','filtered'],['tableFilter',''],['tablePaymentFilter',''],['tableIncFilter',''],['tableAppFilter',''],['tableColumnFilter',''],['tableColumnValue','']]){const elem=el(id);if(elem)elem.value=value;}
  if(el('showNoCode'))el('showNoCode').checked=true;
  redrawColumnSettings();
  refreshValueFilter();
}
function redrawColumnSettings(){
  if(!el('columnChooser'))return;
  el('columnChooser').innerHTML=tableView.columns.map(c=>`<label class="${tableView.visible.has(c.key)?'selected':''}"><input type="checkbox" data-column="${esc(c.key)}" ${tableView.visible.has(c.key)?'checked':''}><span>${esc(columnLabel(c))}</span></label>`).join('');
}
function refreshValueFilter(){
  if(!imported.data)return;
  const key=el('tableColumnFilter').value,sel=el('tableColumnValue');
  const previous=sel.value;
  const values=key?[...new Set(imported.data.rows.map(r=>getCellText(r,key)))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true})):[];
  sel.innerHTML='<option value="">Todos los valores</option>'+values.map(v=>`<option value="${esc(v||'__EMPTY__')}">${esc(key.startsWith('raw:')?displayXlsValue(v)||'(Vacío)':v||'(Vacío)')}</option>`).join('');
  sel.disabled=!key;
  if(values.some(v=>(v||'__EMPTY__')===previous))sel.value=previous;
}
function applyTableFilters(rows){
  let visual=rows;
  if(!tableView.showNoCode)visual=visual.filter(hasCode);
  const payment=el('tablePaymentFilter').value,inc=el('tableIncFilter').value,app=el('tableAppFilter').value;
  if(payment==='payable')visual=visual.filter(payable);
  else if(payment==='notpayable')visual=visual.filter(r=>hasCode(r)&&!payable(r));
  else if(payment==='nocode')visual=visual.filter(r=>!hasCode(r));
  if(inc==='flagged')visual=visual.filter(selectedIncident);
  if(inc==='unflagged')visual=visual.filter(r=>!selectedIncident(r));
  if(app==='on')visual=visual.filter(appEnabled);
  if(app==='off')visual=visual.filter(r=>!appEnabled(r));
  const col=el('tableColumnFilter').value,val=el('tableColumnValue').value;
  if(col&&val)visual=visual.filter(r=>(getCellText(r,col)||'__EMPTY__')===val);
  const search=normalize(el('tableFilter').value);
  if(search)visual=visual.filter(r=>normalize([...r.raw,getCellText(r,'incident'),getCellText(r,'app'),getCellText(r,'payment')].join(' ')).includes(search));
  // Orden estable: todos los registros con código primero; al final, los que no lo tienen.
  return [...visual].sort((a,b)=>Number(hasCode(b))-Number(hasCode(a)) || a.i-b.i);
}
function tableCellMarkup(r,c,forPrint=false){
  if(c.key==='incident')return forPrint?(selectedIncident(r)?'Sí':'No'):`<input type="checkbox" data-incident-id="${esc(r.uid||String(r.i))}" aria-label="Incidencia en folio ${esc(r.folio)}" title="Excluir todos los conceptos del folio" ${selectedIncident(r)?'checked':''}>`;
  if(c.key==='app')return forPrint?(appEnabled(r)?'Sí':'No'):`<input type="checkbox" class="app-check" data-app-id="${esc(r.uid||String(r.i))}" aria-label="APP en folio ${esc(r.folio)}" title="Pagar APP de este folio" ${appEnabled(r)?'checked':''} ${!hasCode(r)?'disabled':''}>`;
  if(c.key==='payment')return forPrint?esc(getCellText(r,c.key)):(payable(r)?'<span class="tiny-pill">Comisionable</span>':hasCode(r)?'<span class="tiny-pill bad">No pagable</span>':'<span class="tiny-pill skip">No se completó la venta</span>');
  const val=displayXlsValue(getCellText(r,c.key));
  return `<span title="${esc(val)}">${esc(val)}</span>`;
}

// V2.1 · Vista de todos los XLS activos. Filtros de consulta: exclusivamente en memoria.
const allRecordsView={page:1,pageSize:100,selectedValues:new Set()};
const ALL_RECORDS_FILTER_IDS=['allRecordsSearch','allRecordsFrom','allRecordsTo','allRecordsPay','allRecordsInc','allRecordsApp','allRecordsCode','allRecordsGuaranteed','allRecordsP0','allRecordsDental'];
const allRecordsFilterValue=id=>el(id)?.value||'';
function allRecordsColumns(){
  const pinned=new Set(['incident','app']);
  return tableView.columns.filter(c=>pinned.has(c.key)||tableView.visible.has(c.key));
}
function setAllRecordsOptions(select,values,placeholder){
  if(!select)return;
  const old=select.value;
  select.innerHTML=`<option value="">${esc(placeholder)}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  select.value=values.includes(old)?old:'';
}
function populateAllRecordsMainFilters(){
  const rows=imported.data?.rows||[];
  const modules=[...new Set(rows.map(r=>r.module).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  setAllRecordsOptions(el('allRecordsModule'),modules,'Todos los módulos');
  const selectedModule=allRecordsFilterValue('allRecordsModule');
  const executives=[...new Set(rows.filter(r=>!selectedModule||r.module===selectedModule).map(r=>r.executive).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  setAllRecordsOptions(el('allRecordsExecutive'),executives,'Todos los ejecutivos');
}
function populateAllRecordsColumns(){
  const select=el('allRecordsColumn');if(!select)return;
  const previous=select.value;
  select.innerHTML='<option value="">Sin columna adicional</option>'+tableView.columns.filter(c=>c.key.startsWith('raw:')).map(c=>`<option value="${esc(c.key)}">${esc(c.name)}</option>`).join('');
  select.value=tableView.columns.some(c=>c.key===previous)?previous:'';
  if(select.value!==previous)allRecordsView.selectedValues.clear();
  renderAllRecordsValueChoices();
}
function renderAllRecordsValueChoices(){
  const key=allRecordsFilterValue('allRecordsColumn'),host=el('allRecordsValues'),search=normalize(allRecordsFilterValue('allRecordsValueSearch'));
  el('allRecordsValueSearch').disabled=!key;
  if(!key){host.innerHTML='<span class="muted">Selecciona una columna para elegir uno o varios valores.</span>';return;}
  const source=imported.data?.rows||[];
  const values=[...new Set(source.map(r=>getCellText(r,key)))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  const show=values.filter(v=>!search||normalize(v||'(vacío)').includes(search)).slice(0,150);
  host.innerHTML=show.map(v=>`<label><input type="checkbox" data-record-value="${esc(v)}" ${allRecordsView.selectedValues.has(v)?'checked':''}><span>${esc(displayXlsValue(v)||'(Vacío)')}</span></label>`).join('')||'<span class="muted">No hay valores coincidentes.</span>';
  if(values.length>150){host.insertAdjacentHTML('beforeend',`<span class="muted">${show.length} de ${values.length} valores. Usa la búsqueda para encontrar otros.</span>`);}
}
function getAllRecordsFiltered(){
  let rows=imported.data?.rows||[];
  const module=allRecordsFilterValue('allRecordsModule'),exec=allRecordsFilterValue('allRecordsExecutive');
  const from=allRecordsFilterValue('allRecordsFrom'),to=allRecordsFilterValue('allRecordsTo');
  const pay=allRecordsFilterValue('allRecordsPay'),inc=allRecordsFilterValue('allRecordsInc'),app=allRecordsFilterValue('allRecordsApp');
  const code=allRecordsFilterValue('allRecordsCode'),guar=allRecordsFilterValue('allRecordsGuaranteed'),p0=allRecordsFilterValue('allRecordsP0'),dental=allRecordsFilterValue('allRecordsDental');
  const col=allRecordsFilterValue('allRecordsColumn'),chosen=allRecordsView.selectedValues;
  const q=normalize(allRecordsFilterValue('allRecordsSearch'));
  if(module)rows=rows.filter(r=>r.module===module);
  if(exec)rows=rows.filter(r=>r.executive===exec);
  if(from)rows=rows.filter(r=>r.fecha&&r.fecha>=from);
  if(to)rows=rows.filter(r=>r.fecha&&r.fecha<=to);
  if(pay==='payable')rows=rows.filter(payable);
  if(pay==='notpayable')rows=rows.filter(r=>hasCode(r)&&!payable(r));
  if(pay==='nocode')rows=rows.filter(r=>!hasCode(r));
  if(inc==='yes')rows=rows.filter(selectedIncident);
  if(inc==='no')rows=rows.filter(r=>!selectedIncident(r));
  if(app==='yes')rows=rows.filter(appEnabled);
  if(app==='no')rows=rows.filter(r=>!appEnabled(r));
  if(code==='yes')rows=rows.filter(hasCode);
  if(code==='no')rows=rows.filter(r=>!hasCode(r));
  if(guar==='yes')rows=rows.filter(r=>isYes(r.guaranteed));
  if(guar==='no')rows=rows.filter(r=>isNo(r.guaranteed));
  if(p0==='yes')rows=rows.filter(r=>isYes(r.p0));
  if(p0==='no')rows=rows.filter(r=>isNo(r.p0));
  if(dental==='yes')rows=rows.filter(r=>isYes(r.dental));
  if(dental==='no')rows=rows.filter(r=>isNo(r.dental));
  if(col&&chosen.size)rows=rows.filter(r=>chosen.has(getCellText(r,col)));
  if(q)rows=rows.filter(r=>normalize([...r.raw,getCellText(r,'incident'),getCellText(r,'app'),getCellText(r,'payment')].join(' ')).includes(q));
  return [...rows].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')||b.i-a.i);
}
function allRecordsActiveFilterCount(){return ALL_RECORDS_FILTER_IDS.filter(id=>allRecordsFilterValue(id)).length+(allRecordsFilterValue('allRecordsColumn')&&allRecordsView.selectedValues.size?1:0);}
function renderAllRecords(){
  const data=imported.data,host=el('allRecordsBody');if(!host)return;
  const rows=getAllRecordsFiltered(),cols=allRecordsColumns(),total=data?.rows.length||0,count=rows.length;
  const pages=Math.max(1,Math.ceil(count/allRecordsView.pageSize));allRecordsView.page=Math.min(Math.max(1,allRecordsView.page),pages);
  const start=(allRecordsView.page-1)*allRecordsView.pageSize,visible=rows.slice(start,start+allRecordsView.pageSize);
  el('allRecordsCount').textContent=`${number.format(count)} / ${number.format(total)} registros`;
  el('allRecordsActiveFilters').textContent=allRecordsActiveFilterCount()?`${allRecordsActiveFilterCount()} filtro(s) activo(s)`:'Ningún filtro adicional';
  el('allRecordsSummary').innerHTML=`<span>${number.format(count)} visibles</span><span>${rows.filter(hasCode).length} con código</span><span>${rows.filter(selectedIncident).length} incidencias</span><span>${rows.filter(appEnabled).length} APP activas</span>`;
  el('allRecordsHead').innerHTML='<tr>'+cols.map(c=>`<th>${esc(columnLabel(c))}</th>`).join('')+'</tr>';
  host.innerHTML=visible.length?visible.map(r=>{
    const classes=[selectedIncident(r)?'flagged':'',excluded(r)?'unpayable':'',!appEnabled(r)?'app-disabled':''].filter(Boolean).join(' ');
    return `<tr class="${classes}">`+cols.map(c=>`<td>${tableCellMarkup(r,c)}</td>`).join('')+'</tr>';
  }).join(''):`<tr><td class="empty-table" colspan="${Math.max(1,cols.length)}">${total?'No hay registros que coincidan con estos filtros.':'No hay XLS cargados. Usa «Cargar XLS».'}</td></tr>`;
  el('allRecordsPageStatus').textContent=count?`Filas ${number.format(start+1)}–${number.format(Math.min(start+allRecordsView.pageSize,count))} de ${number.format(count)} · Página ${allRecordsView.page} de ${pages}`:`0 registros · Página 1 de 1`;
  el('allRecordsPrev').disabled=allRecordsView.page<=1;
  el('allRecordsNext').disabled=allRecordsView.page>=pages;
}
function resetAllRecordsAdvanced(){
  for(const id of ALL_RECORDS_FILTER_IDS){const control=el(id);if(control)control.value='';}
  el('allRecordsColumn').value='';el('allRecordsValueSearch').value='';allRecordsView.selectedValues.clear();allRecordsView.page=1;
  renderAllRecordsValueChoices();renderAllRecords();
}
function applyFolioValidationChange(target){
  const id=target.dataset.incidentId??target.dataset.appId;if(id===undefined)return false;
  if(target.matches('input[data-incident-id]')){if(target.checked)imported.flags.add(id);else imported.flags.delete(id);}
  else if(target.matches('input[data-app-id]')){if(target.checked)imported.appDisabled.delete(id);else imported.appDisabled.add(id);}
  else return false;
  saveFolioFlags();
  if(importActive()){computeImportedBase();renderRecords();renderTeam();}
  drawImportMeta(imported.sourceName||'Reporte.xls');
  renderAllRecords();
  return true;
}
function initAllRecordsPage(){
  el('allRecordsModule').addEventListener('change',()=>{populateAllRecordsMainFilters();allRecordsView.page=1;renderAllRecords();});
  el('allRecordsExecutive').addEventListener('change',()=>{allRecordsView.page=1;renderAllRecords();});
  for(const id of ALL_RECORDS_FILTER_IDS){
    el(id).addEventListener(id==='allRecordsSearch'?'input':'change',()=>{allRecordsView.page=1;renderAllRecords();});
  }
  el('allRecordsColumn').addEventListener('change',()=>{allRecordsView.selectedValues.clear();el('allRecordsValueSearch').value='';allRecordsView.page=1;renderAllRecordsValueChoices();renderAllRecords();});
  el('allRecordsValueSearch').addEventListener('input',renderAllRecordsValueChoices);
  el('allRecordsValues').addEventListener('change',e=>{
    if(!e.target.matches('input[data-record-value]'))return;
    const value=e.target.dataset.recordValue;if(e.target.checked)allRecordsView.selectedValues.add(value);else allRecordsView.selectedValues.delete(value);
    allRecordsView.page=1;renderAllRecords();
  });
  el('allRecordsReset').addEventListener('click',resetAllRecordsAdvanced);
  el('allRecordsPageSize').addEventListener('change',e=>{allRecordsView.pageSize=Number(e.target.value)||100;allRecordsView.page=1;renderAllRecords();});
  el('allRecordsPrev').addEventListener('click',()=>{allRecordsView.page--;renderAllRecords();});
  el('allRecordsNext').addEventListener('click',()=>{allRecordsView.page++;renderAllRecords();});
  el('allRecordsTable').addEventListener('change',e=>applyFolioValidationChange(e.target));
}
function renderRecords(){
  if(!imported.data)return;
  const current=rowsForSelection();
  const origin=el('tableScope').value==='all'?imported.data.rows:current;
  const visible=applyTableFilters(origin);
  const cols=tableView.columns.filter(c=>tableView.visible.has(c.key));
  const flaggedCurrent=current.filter(selectedIncident).length;
  const nonPay=current.filter(r=>candidate(r)&&excluded(r)).length;
  const activeApps=current.filter(r=>payable(r)&&appEnabled(r)).length;
  el('recordsCount').textContent=`${current.length} registros del ejecutivo`;
  el('recordCounters').innerHTML=`<span>${visible.length} filas visibles</span><span>${current.filter(hasCode).length} con Código (selección)</span><span>${activeApps} APP válidas</span><span>${flaggedCurrent} incidencias marcadas</span><span>${nonPay} ventas no pagables</span>`;
  el('recordsHead').innerHTML='<tr>'+cols.map(c=>`<th>${esc(columnLabel(c))}</th>`).join('')+'</tr>';
  el('recordsBody').innerHTML=visible.length?visible.map(r=>{
    const classes=[selectedIncident(r)?'flagged':'',excluded(r)?'unpayable':'',!appEnabled(r)?'app-disabled':''].filter(Boolean).join(' ');
    return `<tr class="${classes}">`+cols.map(c=>`<td>${tableCellMarkup(r,c)}</td>`).join('')+'</tr>';
  }).join(''):`<tr><td colspan="${Math.max(1,cols.length)}" class="empty-table">No hay filas que coincidan con los filtros.</td></tr>`;
  // La impresión siempre corresponde al ejecutivo/semana, aunque en pantalla se active el alcance «Todo el archivo».
  const printRows=applyTableFilters(current);
  el('printRecordSummary').textContent=`${printRows.length} filas visibles · ${flaggedCurrent} incidencias marcadas · ${activeApps} APP válidas`;
  el('printRecordsHead').innerHTML='<tr>'+cols.map(c=>`<th>${esc(columnLabel(c))}</th>`).join('')+'</tr>';
  el('printRecordRows').innerHTML=printRows.length?printRows.map(r=>'<tr>'+cols.map(c=>`<td>${tableCellMarkup(r,c,true)}</td>`).join('')+'</tr>').join(''):`<tr><td colspan="${Math.max(1,cols.length)}">Sin folios visibles con los filtros actuales.</td></tr>`;
  el('printContext').textContent=`Reporte XLS · Semana ${weekLabel(imported.week)} · Ejecutivo: ${imported.executive} · Meta ${state.base.goal} · ${printRows.length} filas impresas`;
}
function updateImport(){if(!imported.data)return;chooseExecutive();drawImportMeta(imported.sourceName||'Reporte.xls');}


// V7: agrupación de toda la semana por ejecutivo; usa exactamente el motor y exclusiones individuales.
function teamEntries(){
  if(!imported.data||!imported.week)return [];
  const byExecutive=new Map();
  for(const r of imported.data.rows){
    if(r.week!==imported.week||!r.executive)continue;
    let entry=byExecutive.get(r.executive);
    if(!entry){entry={name:r.executive,modules:new Set(),rows:[]};byExecutive.set(r.executive,entry)}
    entry.modules.add(r.module||'Sin módulo');entry.rows.push(r);
  }
  return [...byExecutive.values()].map(e=>{
    e.module=[...e.modules].join(', ');
    e.goal=executiveGoal(imported.week,e.name);
    e.adjustment=executiveRecovery(imported.week,e.name);
    e.inputs=buildImportedCounts(e.rows,e.goal,e.adjustment);
    e.result=calculate(e.inputs);
    return e;
  });
}
function populateTeamModules(){
  const sel=el('teamModule');if(!sel||!imported.data)return;
  const previous=sel.value;
  const mods=[...new Set(imported.data.rows.filter(r=>r.week===imported.week).map(r=>r.module).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  sel.innerHTML='<option value="">Todos los módulos</option>'+mods.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');
  sel.value=mods.includes(previous)?previous:'';
}
function filteredTeamEntries(){
  const term=normalize(el('teamSearch').value),module=el('teamModule').value,sort=el('teamSort').value;
  const list=teamEntries().filter(e=>(!module||e.modules.has(module))&&(!term||normalize(e.name+' '+e.module).includes(term)));
  const cmpName=(a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'});
  if(sort==='name')list.sort(cmpName);
  else if(sort==='sales')list.sort((a,b)=>(b.result.ok?b.result.validSales:-1)-(a.result.ok?a.result.validSales:-1)||cmpName(a,b));
  else if(sort==='completion')list.sort((a,b)=>(b.result.ok?b.result.completion:-1)-(a.result.ok?a.result.completion:-1)||cmpName(a,b));
  else list.sort((a,b)=>(b.result.ok?b.result.net:-1e10)-(a.result.ok?a.result.net:-1e10)||cmpName(a,b));
  return list;
}
function briefTier(r){if(!r.ok)return 'Revisar';if(!r.tier)return 'Sin pago';return r.tier.min===101?'101%+':r.tier.min===81?'81–100%':r.tier.min===61?'61–80%':'50–60%';}
function renderTeam(){
  if(!el('teamRows'))return;
  if(!imported.data){el('teamSummary').innerHTML='';el('teamRows').innerHTML='<tr><td class="team-empty" colspan="13">Importa un archivo XLS para visualizar a todos los ejecutivos.</td></tr>';el('teamTotals').innerHTML='';return;}
  el('teamPeriod').textContent=weekLabel(imported.week);
  const group=filteredTeamEntries(),all=teamEntries();
  const totals={reg:0,guar:0,sales:0,app:0,p0:0,dental:0,commission:0,goal:0,inc:0,invalid:0};
  for(const e of group){const r=e.result;if(!r.ok){totals.invalid++;continue;}
    totals.reg+=r.validReg;totals.guar+=r.validGuar;totals.sales+=r.validSales;totals.app+=r.validApp;totals.p0+=r.validP0;totals.dental+=r.validDental;totals.commission+=r.net;totals.goal+=r.goal;totals.inc+=r.inc;
  }
  const teamCompletion=totals.goal?100*totals.sales/totals.goal:0;
  const cards=[['Ejecutivos visibles',String(group.length),`${all.length} en la semana`],['Ventas comisionables',String(totals.sales),`${totals.reg} regulares · ${totals.guar} garantizadas`],['Cumplimiento conjunto',totals.goal?pct(teamCompletion):'—',`Objetivo conjunto: ${totals.goal} ventas`],['Comisiones estimadas',mx(round(totals.commission)),totals.invalid?`${totals.invalid} ejecutivos por revisar`:'Después de descuentos registrados']];
  el('teamSummary').innerHTML=cards.map(([label,value,desc])=>`<div class="team-kpi"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(desc)}</small></div>`).join('');
  el('teamHelp').textContent='Metas individuales: '+qualityConfig.execWeeklyGoal+' ventas por defecto (editable en Ajustes); edita cada meta directamente en la tabla. APP activa por venta con código, excepto las desmarcadas. Para marcar incidencias o ajustar recuperaciones, entra a «Detalle» del ejecutivo. Los datos se calculan sobre '+weekLabel(imported.week)+'.';
  el('teamRows').innerHTML=group.length?group.map(e=>{
    const r=e.result,good=r.ok,completion=good?pct(r.completion):'—';
    const completionBar=good?Math.min(100,Math.max(0,r.completion)):0;
    return `<tr><td><div class="executive-name">${esc(e.name)}</div><div class="executive-module">${esc(e.module)}</div></td>
      <td><input class="goal-mini" type="number" min="1" step="1" value="${e.goal}" data-team-goal="${esc(e.name)}" aria-label="Meta semanal de ${esc(e.name)}" title="Objetivo semanal editable" /></td>
      <td><span class="progress-value">${completion}</span><span class="progress-meter"><i style="width:${completionBar}%"></i></span></td>
      <td>${good?r.validReg:'—'}</td><td>${good?r.validGuar:'—'}</td><td><strong>${good?r.validSales:'—'}</strong></td>
      <td>${good?r.validApp:'—'}</td><td>${good?r.validP0:'—'}</td><td>${good?r.validDental:'—'}</td><td class="inc-count">${e.inputs.inc||'—'}</td>
      <td><span class="tier-chip ${!r.tier?'none':''}">${briefTier(r)}</span></td>
      <td class="money-val ${good&&r.net<0?'neg':''}">${good?mx(r.net):'Revisar'}</td>
      <td><button class="btn small" type="button" data-open-exec="${esc(e.name)}" title="Revisar folios, APP e incidencias">Ver folios</button></td></tr>`;
  }).join(''):'<tr><td class="team-empty" colspan="13">No hay ejecutivos que coincidan con estos filtros.</td></tr>';
  el('teamTotals').innerHTML=`<tr><td><strong>TOTAL · ${group.length} ejecutivos</strong></td><td>${totals.goal}</td><td>${totals.goal?pct(teamCompletion):'—'}</td><td>${totals.reg}</td><td>${totals.guar}</td><td>${totals.sales}</td><td>${totals.app}</td><td>${totals.p0}</td><td>${totals.dental}</td><td>${totals.inc}</td><td>—</td><td>${mx(round(totals.commission))}</td><td></td></tr>`;
}


// V2.2 · Configuración de calidad operativa; independiente de las comisiones.
const QUALITY_STORAGE_V22='wmSamsMeridaQualityConfigV22';
const SUPERVISORS_STORAGE_V22='wmSamsMeridaSupervisorsV22';
const QUALITY_FACTORS=['completion','purchase','p0','app'];
const QUALITY_FACTOR_LABELS={completion:'Cumplimiento',purchase:'Primera compra (P0 o Dental)',p0:'Programa Cero',app:'Activación APP'};
const QUALITY_DEFAULTS={execWeeklyGoal:10,minimum:60,targets:{completion:100,purchase:90,p0:30,app:90},weights:{completion:25,purchase:25,p0:25,app:25},modules:{}};
function storedJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function cleanQualityConfig(saved){
  const result=structuredClone(QUALITY_DEFAULTS);
  if(!saved||typeof saved!=='object')return result;
  if(Number.isFinite(Number(saved.execWeeklyGoal))&&Number(saved.execWeeklyGoal)>0)result.execWeeklyGoal=Number(saved.execWeeklyGoal);
  if(Number.isFinite(Number(saved.minimum))&&Number(saved.minimum)>=0&&Number(saved.minimum)<=100)result.minimum=Number(saved.minimum);
  for(const kind of ['targets','weights'])for(const key of QUALITY_FACTORS){
    const val=Number(saved[kind]?.[key]);if(saved[kind]?.[key]!==undefined&&Number.isFinite(val)&&val>=0&&val<=1000)result[kind][key]=val;
  }
  if(saved.modules&&typeof saved.modules==='object')for(const [module,opts] of Object.entries(saved.modules)){
    if(!module||!opts||typeof opts!=='object')continue;
    const item={weeklySales:0,weeklyRecords:0,targets:{},weights:{}};
    for(const key of ['weeklySales','weeklyRecords'])if(Number.isFinite(Number(opts[key]))&&Number(opts[key])>=0)item[key]=Number(opts[key]);
    for(const key of QUALITY_FACTORS){
      const val=opts.targets?.[key];if(val!==undefined&&val!==''&&Number.isFinite(Number(val))&&Number(val)>0)item.targets[key]=Number(val);
      const weight=opts.weights?.[key];if(weight!==undefined&&weight!==''&&Number.isFinite(Number(weight))&&Number(weight)>=0)item.weights[key]=Number(weight);
    }
    result.modules[module]=item;
  }
  return result;
}
let qualityConfig=cleanQualityConfig(storedJson(QUALITY_STORAGE_V22));
let supervisorConfig=storedJson(SUPERVISORS_STORAGE_V22)||{};
if(!supervisorConfig||typeof supervisorConfig!=='object'||Array.isArray(supervisorConfig))supervisorConfig={};
function saveQualityConfig(){localStorage.setItem(QUALITY_STORAGE_V22,JSON.stringify(qualityConfig));renderQualityPages();}
function saveSupervisorConfig(){localStorage.setItem(SUPERVISORS_STORAGE_V22,JSON.stringify(supervisorConfig));renderQualityPages();}
function moduleQualityOptions(module){return qualityConfig.modules[module]||{weeklySales:0,weeklyRecords:0,targets:{},weights:{}};}
function qualityTarget(key,module,groupBy){return groupBy==='module'?(moduleQualityOptions(module).targets?.[key]||qualityConfig.targets[key]):qualityConfig.targets[key];}
function qualityMetricFactor(actual,target,{cap=false}={}){
  if(!Number.isFinite(actual)||!Number.isFinite(target)||target<=0)return null;
  const normalized=actual/target*100;
  return normalized<qualityConfig.minimum?0:(cap?Math.min(100,normalized):normalized);
}
function qualityPercentText(value){return Number.isFinite(value)?pct(value):'—';}
function countQualityRows(rows){
  const salesRows=rows.filter(r=>hasCode(r));
  const regular=salesRows.filter(r=>isNo(r.guaranteed));
  const purchase=salesRows.filter(r=>isYes(r.p0)||isYes(r.dental)).length;
  const p0=regular.filter(r=>isYes(r.p0)).length;
  const apps=salesRows.filter(appEnabled).length;
  return {sales:salesRows.length,regular:regular.length,purchase,p0,apps};
}
function availableWeeks(rows){
  const weeks=[...new Set(rows.map(r=>r.fecha?mondayOf(r.fecha):'').filter(Boolean))];
  return weeks.length?weeks:[''];
}
function qualityWeeklyGoal(rows,name,groupBy,granularity){
  if(name==='TOTAL'){
    const names=[...new Set(rows.map(r=>String(r[groupBy]||'').trim()).filter(Boolean))];
    return names.reduce((sum,member)=>sum+qualityWeeklyGoal(groupRowsFor(rows,groupBy,member),member,groupBy,granularity),0);
  }
  const weeks=granularity==='daily'?[rows[0]?.fecha?mondayOf(rows[0].fecha):''] : availableWeeks(rows);
  if(groupBy==='executive'){
    return weeks.reduce((sum,week)=>sum+(week?executiveGoal(week,name):qualityConfig.execWeeklyGoal),0)*(granularity==='daily'?1/7:1);
  }
  const cfg=moduleQualityOptions(name);
  if(cfg.weeklySales>0)return cfg.weeklySales*weeks.length*(granularity==='daily'?1/7:1);
  return weeks.reduce((sum,week)=>{
    const names=[...new Set(rows.filter(r=>!week||r.week===week).map(r=>r.executive).filter(Boolean))];
    return sum+names.reduce((v,person)=>v+(week?executiveGoal(week,person):qualityConfig.execWeeklyGoal),0);
  },0)*(granularity==='daily'?1/7:1);
}
function qualityResult(rows,groupBy,name,granularity='weekly',goalOverride=null){
  const counters=countQualityRows(rows);
  if(!rows.length)return {goal:0,actual:{},factors:{},global:null,counters};
  const goal=goalOverride!==null?goalOverride:qualityWeeklyGoal(rows,name,groupBy,granularity);
  const actual={completion:goal>0?100*counters.sales/goal:NaN,purchase:counters.sales>0?100*counters.purchase/counters.sales:NaN,p0:counters.regular>0?100*counters.p0/counters.regular:NaN,app:counters.sales>0?100*counters.apps/counters.sales:NaN};
  const factors={};let weighted=0,weightTotal=0;
  for(const key of QUALITY_FACTORS){
    const target=qualityTarget(key,name,groupBy);
    const value=qualityMetricFactor(Number.isFinite(actual[key])?actual[key]:0,target,{cap:key==='purchase'||key==='app'})??0;
    factors[key]=value;
    const weight=groupBy==='module'?(moduleQualityOptions(name).weights?.[key]??qualityConfig.weights[key]):qualityConfig.weights[key];weighted+=value*weight;weightTotal+=weight;
  }
  return {goal,actual,factors,global:weightTotal>0?weighted/weightTotal:null,counters};
}
function groupRowsFor(rows,groupBy,name){return name==='TOTAL'?rows:rows.filter(r=>(String(r[groupBy]||'').trim()||(groupBy==='module'?'Sin módulo':'Sin ejecutivo'))===name);}
function supervisorRow(row){return (supervisorConfig[String(row.module||'').trim()]||[]).includes(String(row.executive||'').trim());}
function filterPageSupervisors(rows,page){const id={daily:'includeSupervisorsDaily',accumulated:'includeSupervisorsAccumulated',weekly:'includeSupervisorsWeekly'}[page];return !id||el(id)?.checked!==false?rows:rows.filter(r=>!supervisorRow(r));}
function knownExecutivesByModule(){
  const out=new Map();
  // El historial remoto conserva cada XLS como filas crudas; convertirlo localmente
  // sin llamadas adicionales para obtener módulo y ejecutivo de TODOS los archivos.
  const dataSets=[imported.data,combinedArchiveData(archive.reports)].filter(Boolean);
  for(const data of dataSets)for(const r of data.rows||[]){const module=String(r.module||'').trim(),person=String(r.executive||'').trim();if(!module||!person)continue;if(!out.has(module))out.set(module,new Set());out.get(module).add(person);}
  for(const module of [...Object.keys(supervisorConfig),...Object.keys(qualityConfig.modules)])if(!out.has(module))out.set(module,new Set());
  return [...out.entries()].sort((a,b)=>a[0].localeCompare(b[0],'es')).map(([module,names])=>({module,names:[...names].sort((a,b)=>a.localeCompare(b,'es'))}));
}
function qualitySettingsInput(label,key,value,type='global'){return `<label>${esc(label)}<input type="number" min="0" max="100000" step="0.1" data-quality-kind="${type}" data-quality-key="${key}" value="${Number(value)||0}"></label>`;}
function renderQualitySettings(){
  const host=el('qualityGlobalInputs');if(!host)return;
  host.innerHTML=[qualitySettingsInput('Meta semanal por ejecutivo (predeterminada)','execWeeklyGoal',qualityConfig.execWeeklyGoal),qualitySettingsInput('Mínimo para puntuar un factor (%)','minimum',qualityConfig.minimum),...QUALITY_FACTORS.flatMap(key=>[
    qualitySettingsInput(`Objetivo ${QUALITY_FACTOR_LABELS[key]} (%)`,key,qualityConfig.targets[key],'target'),
    qualitySettingsInput(`Ponderación ${QUALITY_FACTOR_LABELS[key]} (%)`,key,qualityConfig.weights[key],'weight')])].join('');
  const modules=knownExecutivesByModule();
  el('qualityModuleInputs').innerHTML=modules.length?modules.map(({module})=>{
    const data=moduleQualityOptions(module),targets=data.targets||{},weights=data.weights||{};
    return `<details class="module-goal-card"><summary>${esc(module)}</summary><div class="module-goal-grid">
      ${qualitySettingsInput('Meta semanal de ventas','weeklySales',data.weeklySales||0,'module') .replace('data-quality-kind="module"',`data-quality-kind="module" data-quality-module="${esc(module)}"`)}
      ${qualitySettingsInput('Meta semanal de trámites','weeklyRecords',data.weeklyRecords||0,'module').replace('data-quality-kind="module"',`data-quality-kind="module" data-quality-module="${esc(module)}"`)}
      ${QUALITY_FACTORS.map(key=>`<label>Objetivo ${esc(QUALITY_FACTOR_LABELS[key])} (%) · vacío = global<input type="number" min="0.1" max="1000" step="0.1" data-quality-kind="module-target" data-quality-key="${key}" data-quality-module="${esc(module)}" placeholder="Global (${qualityConfig.targets[key]}%)" value="${targets[key]??''}"></label><label>Peso de ${esc(QUALITY_FACTOR_LABELS[key])} · vacío = global<input type="number" min="0" max="1000" step="0.1" data-quality-kind="module-weight" data-quality-key="${key}" data-quality-module="${esc(module)}" placeholder="Global (${qualityConfig.weights[key]})" value="${weights[key]??''}"></label>`).join('')}
    </div></details>`;
  }).join(''):'<p class="settings-help">Importa un XLS para identificar los módulos disponibles.</p>';
}
function renderSupervisorSettings(){
  const host=el('supervisorManager');if(!host)return;
  const modules=knownExecutivesByModule();
  host.innerHTML=modules.length?modules.map(({module,names})=>`<div class="module-goal-card"><strong>${esc(module)}</strong><div class="supervisor-choice-row">${names.length?names.map(name=>`<label><input type="checkbox" data-supervisor-module="${esc(module)}" data-supervisor-name="${esc(name)}" ${(supervisorConfig[module]||[]).includes(name)?'checked':''}/> ${esc(name)}</label>`).join(''):'<span class="muted">Sin ejecutivos en los XLS activos.</span>'}</div></div>`).join(''):'<p class="settings-help">Importa XLS para asociar supervisores a sus módulos.</p>';
}
function renderQualityPages(){if(el('dailyPage'))renderDaily();if(el('accumulatedPage'))renderAccumulated();if(el('weeklyPage'))renderWeekly();}
function initQualitySettings(){
  renderQualitySettings();renderSupervisorSettings();
  el('qualityGlobalInputs').addEventListener('change',e=>{
    const x=e.target;if(!x.matches('[data-quality-kind]'))return;
    const n=Number(x.value),kind=x.dataset.qualityKind,key=x.dataset.qualityKey;
    if(!Number.isFinite(n)||n<0||(kind==='target'&&n<=0)||(kind==='global'&&key==='execWeeklyGoal'&&n<=0)||(kind==='global'&&key==='minimum'&&n>100)) {alert('Ingresa un número válido mayor o igual a cero.');renderQualitySettings();return;}
    if(kind==='global')qualityConfig[key]=n;else qualityConfig[kind==='target'?'targets':'weights'][key]=n;
    saveQualityConfig();el('qualitySaveStatus').textContent='Objetivos actualizados; guardado en la nube pendiente de confirmación.';
  });
  el('qualityModuleInputs').addEventListener('change',e=>{
    const x=e.target;if(!x.matches('[data-quality-kind]'))return;
    const module=x.dataset.qualityModule,key=x.dataset.qualityKey,kind=x.dataset.qualityKind;
    const n=Number(x.value);if(x.value!==''&&(!Number.isFinite(n)||n<0||(kind==='module-target'&&n<=0))){alert('Ingresa un objetivo válido.');return;}
    qualityConfig.modules[module]??={weeklySales:0,weeklyRecords:0,targets:{},weights:{}};
    const target=qualityConfig.modules[module];
    if(kind==='module-target'){if(x.value==='')delete target.targets[key];else target.targets[key]=n;}
    else if(kind==='module-weight'){target.weights??={};if(x.value==='')delete target.weights[key];else target.weights[key]=n;}
    else target[key]=n;
    saveQualityConfig();el('qualitySaveStatus').textContent='Objetivo del módulo actualizado.';
  });
  el('supervisorManager').addEventListener('change',e=>{
    const x=e.target;if(!x.matches('input[data-supervisor-module]'))return;
    const module=x.dataset.supervisorModule,name=x.dataset.supervisorName;
    const names=new Set(supervisorConfig[module]||[]);if(x.checked)names.add(name);else names.delete(name);
    supervisorConfig[module]=[...names];saveSupervisorConfig();el('supervisorSaveStatus').textContent='Asignaciones actualizadas.';
  });
  el('qualityReset').addEventListener('click',()=>{if(!confirm('¿Restaurar metas y factores globales y de todos los módulos?'))return;qualityConfig=cleanQualityConfig(null);saveQualityConfig();renderQualitySettings();});
  for(const id of ['includeSupervisorsDaily','includeSupervisorsAccumulated','includeSupervisorsWeekly'])el(id)?.addEventListener('change',renderQualityPages);
}

// V8 · Comparación del último día del XLS contra el calendario inmediatamente anterior.
const DAILY_METRICS=['records','sales','reg','guar','p0','dental'];
const emptyDaily=()=>({records:0,sales:0,reg:0,guar:0,p0:0,dental:0});
function dailyDates(){
  if(!imported.data){
    el('dailyCurrentDate').disabled=true;el('dailyPreviousDate').disabled=true;
    return null;
  }
  const dates=imported.data.rows.map(r=>r.fecha).filter(Boolean);
  if(!dates.length)return null;
  const latestAvailable=dates.reduce((a,b)=>a>b?a:b);
  const previousDate=dateFromIso(latestAvailable);previousDate.setDate(previousDate.getDate()-1);
  const autoPrevious=dateIso(previousDate);
  const custom=el('dailyDateMode').value==='custom';
  const currentInput=el('dailyCurrentDate'),previousInput=el('dailyPreviousDate');
  currentInput.disabled=!custom;previousInput.disabled=!custom;
  if(!custom){currentInput.value=latestAvailable;previousInput.value=autoPrevious;}
  else{
    if(!currentInput.value)currentInput.value=latestAvailable;
    if(!previousInput.value)previousInput.value=autoPrevious;
  }
  return {latest:currentInput.value,previous:previousInput.value};
}
function addDailyMetric(metrics,row){
  metrics.records++;
  if(!hasCode(row))return;
  metrics.sales++;
  if(isYes(row.guaranteed))metrics.guar++;
  else if(isNo(row.guaranteed))metrics.reg++;
  if(isNo(row.guaranteed)&&isYes(row.p0))metrics.p0++;
  if(isYes(row.dental))metrics.dental++;
}
function dailyGroups(groupBy,dates){
  const groups=new Map();
  for(const row of filterPageSupervisors(imported.data.rows,'daily')){
    if(row.fecha!==dates.latest&&row.fecha!==dates.previous)continue;
    const name=String(row[groupBy]||'').trim()||(groupBy==='module'?'Sin módulo':'Sin ejecutivo');
    if(!groups.has(name))groups.set(name,{name,current:emptyDaily(),previous:emptyDaily(),currentRows:[],previousRows:[]});
    const data=groups.get(name);
    addDailyMetric(row.fecha===dates.latest?data.current:data.previous,row);
    (row.fecha===dates.latest?data.currentRows:data.previousRows).push(row);
  }
  const entries=[...groups.values()].sort((a,b)=>b.current.records-a.current.records||a.name.localeCompare(b.name,'es',{sensitivity:'base'}));
  const totals={name:'TOTAL',current:emptyDaily(),previous:emptyDaily(),currentRows:[],previousRows:[]};
  for(const g of entries){for(const metric of DAILY_METRICS){totals.current[metric]+=g.current[metric];totals.previous[metric]+=g.previous[metric];}totals.currentRows.push(...g.currentRows);totals.previousRows.push(...g.previousRows);}
  return {entries,totals};
}
function dailyDeltaMarkup(current,previous){
  const delta=current-previous;
  const cls=delta>0?'up':delta<0?'down':'same';
  const text=delta>0?'▲ +'+delta:delta<0?'▼ '+delta:'— 0';
  return `<span class="daily-diff ${cls}" title="Día comparado: ${previous}; diferencia: ${delta>0?'+':''}${delta}">${text}</span>`;
}
function dailyRowMarkup(g,isTotal=false,groupBy='module'){
  const quality=qualityResult(g.currentRows,groupBy,g.name,'daily').global;
  const before=qualityResult(g.previousRows,groupBy,g.name,'daily').global;
  return `<tr${isTotal?' class="daily-total-row"':''}><td><span class="daily-entity" title="${esc(g.name)}">${esc(g.name)}</span></td>${DAILY_METRICS.map(k=>`<td data-daily-metric="${k}"><span class="daily-val">${g.current[k]}</span>${dailyDeltaMarkup(g.current[k],g.previous[k])}</td>`).join('')}<td><span class="daily-val">${qualityPercentText(quality)}</span><span class="daily-diff same">Anterior: ${qualityPercentText(before)}</span></td></tr>`;
}
function renderDaily(){
  if(!el('dailyModuleRows'))return;
  if(!imported.data){
    el('dailyPeriod').textContent='Importa un archivo XLS';
    el('dailyModulesCount').textContent='—';el('dailyExecutivesCount').textContent='—';
    el('dailyCurrentDate').disabled=true;el('dailyPreviousDate').disabled=true;
    el('dailyModuleTotal').innerHTML='';el('dailyExecutiveTotal').innerHTML='';
    el('dailyDataNotice').textContent='';
    const empty='<tr><td colspan="8" class="daily-empty">Importa un XLS para mostrar resultados.</td></tr>';
    el('dailyModuleRows').innerHTML=empty;el('dailyExecutiveRows').innerHTML=empty;
    return;
  }
  const dates=dailyDates();
  if(!dates)return;
  el('dailyPeriod').textContent=`${fmtDay(dates.latest)} vs. ${fmtDay(dates.previous)}`;
  const previousRows=filterPageSupervisors(imported.data.rows,'daily').filter(r=>r.fecha===dates.previous).length;
  el('dailyDataNotice').textContent=previousRows?`${el('dailyDateMode').value==='auto'?'Comparación automática':'Comparación personalizada'} · ${previousRows} registros en el día comparado.`:'El día comparado no tiene registros en los XLS activos: variación frente a cero.';
  for(const [key,field,rowsId,totalId,countId] of [
    ['module','módulos','dailyModuleRows','dailyModuleTotal','dailyModulesCount'],
    ['executive','ejecutivos','dailyExecutiveRows','dailyExecutiveTotal','dailyExecutivesCount']
  ]){
    const {entries,totals}=dailyGroups(key,dates);
    el(rowsId).innerHTML=entries.length?entries.map(g=>dailyRowMarkup(g,false,key)).join(''):'<tr><td colspan="8" class="daily-empty">Sin registros en estas fechas.</td></tr>';
    el(totalId).innerHTML=entries.length?dailyRowMarkup(totals,true,key):'';
    el(countId).textContent=`${entries.length} ${field}`;
  }
}


// V12 · Acumulados independientes de la selección activa. Solo XLS persistidos.
function accumulatedRows(){
  const consolidated=combinedArchiveData(archive.reports);
  if(!consolidated)return [];
  const from=el('accumulatedFrom').value,to=el('accumulatedTo').value;
  // Sin fechas: incluir todos los registros históricos, incluso sin fecha válida.
  // Con cualquier límite: solo pueden evaluarse registros con fecha válida.
  return filterPageSupervisors(consolidated.rows,'accumulated').filter(r=>(!from&&!to)||(!!r.fecha&&(!from||r.fecha>=from)&&(!to||r.fecha<=to)));
}
function accumulatedGroups(rows,groupBy){
  const groups=new Map();
  for(const row of rows){
    const name=String(row[groupBy]||'').trim()||(groupBy==='module'?'Sin módulo':'Sin ejecutivo');
    if(!groups.has(name))groups.set(name,{name,metrics:emptyDaily(),rows:[]});
    addDailyMetric(groups.get(name).metrics,row);
    groups.get(name).rows.push(row);
  }
  const entries=[...groups.values()].sort((a,b)=>b.metrics.records-a.metrics.records||a.name.localeCompare(b.name,'es',{sensitivity:'base'}));
  const totals={name:'TOTAL',metrics:emptyDaily(),rows:[]};
  for(const group of entries){for(const key of DAILY_METRICS)totals.metrics[key]+=group.metrics[key];totals.rows.push(...group.rows);}
  return {entries,totals};
}
function accumulatedRowMarkup(group,isTotal=false,groupBy='module'){
  const q=qualityResult(group.rows,groupBy,group.name,'accumulated').global;
  return `<tr${isTotal?' class="daily-total-row"':''}><td><span class="daily-entity" title="${esc(group.name)}">${esc(group.name)}</span></td>${DAILY_METRICS.map(key=>`<td><span class="daily-val">${number.format(group.metrics[key])}</span></td>`).join('')}<td><span class="daily-val">${qualityPercentText(q)}</span></td></tr>`;
}
function accumulatedPeriodText(){
  const start=el('accumulatedFrom').value,end=el('accumulatedTo').value;
  if(start&&end)return `${fmtDay(start)} – ${fmtDay(end)}`;
  if(start)return `Desde ${fmtDay(start)}`;
  if(end)return `Hasta ${fmtDay(end)}`;
  return 'Histórico completo';
}
function renderAccumulated(){
  if(!el('accumulatedPage')||!isAuthorized())return;
  const start=el('accumulatedFrom').value,end=el('accumulatedTo').value;
  const invalid=start&&end&&start>end;
  const rows=invalid?[]:accumulatedRows();
  el('accumulatedPeriod').textContent=accumulatedPeriodText();
  el('accumulatedPeriodLabel').textContent=start||end?'Rango personalizado':'Todos los registros guardados';
  el('accumulatedDataNotice').textContent=invalid?
    'La fecha inicial no puede ser posterior a la fecha final. Corrige el intervalo.':
    `${archive.reports.length} XLS guardados · ${number.format(rows.length)} registros únicos en el periodo · Fuente: historial remoto completo (sin archivos temporales).`;
  for(const [groupBy,rowsId,totalId,countId,label] of [
    ['module','accumulatedModuleRows','accumulatedModuleTotal','accumulatedModulesCount','módulos'],
    ['executive','accumulatedExecutiveRows','accumulatedExecutiveTotal','accumulatedExecutivesCount','ejecutivos']]){
    const {entries,totals}=accumulatedGroups(rows,groupBy);
    el(rowsId).innerHTML=entries.length?entries.map(g=>accumulatedRowMarkup(g,false,groupBy)).join(''):
      `<tr><td colspan="8" class="daily-empty">${invalid?'Revisa el rango de fechas.':archive.reports.length?'Sin registros en el periodo.':'No hay XLS guardados en tu cuenta.'}</td></tr>`;
    el(totalId).innerHTML=entries.length?accumulatedRowMarkup(totals,true,groupBy):'';
    el(countId).textContent=`${entries.length} ${label}`;
  }
}

// Comparativa semanal protegida: dos semanas completas (lunes a domingo).
// Se trabaja sobre todos los XLS guardados, sin alterar la selección del resto de páginas.
const WEEKLY_GOALS_KEY='wmSamsComparativaSemanalObjetivosV13';
const WEEKLY_LABELS={records:'Registros',sales:'Ventas totales',reg:'Ventas regulares',guar:'Ventas garantizadas',p0:'Programa Cero',dental:'Plan Dental'};
const weeklyGoals=loadTeamStore(WEEKLY_GOALS_KEY);
function weekShift(start,days){const d=dateFromIso(start);d.setDate(d.getDate()+days);return dateIso(d);}
function defaultWeeklyDates(){const current=mondayOf(dateIso(new Date()));return {primary:weekShift(current,-7),previous:weekShift(current,-14)};}
function initializeWeeklyDates(){
  const {primary,previous}=defaultWeeklyDates();
  if(!el('weeklyPrimaryDate').value)el('weeklyPrimaryDate').value=primary;
  if(!el('weeklyPreviousDate').value)el('weeklyPreviousDate').value=previous;
}
function weeklySelection(){
  initializeWeeklyDates();
  const a=mondayOf(el('weeklyPrimaryDate').value),b=mondayOf(el('weeklyPreviousDate').value);
  return {primary:a,previous:b};
}
function hasWeeklyGoalOverride(week,key){
  return Object.prototype.hasOwnProperty.call(weeklyGoals[week]||{},key);
}
function weeklyGoalFor(week,key,primaryWeek,metrics){
  if(hasWeeklyGoalOverride(week,key))return weeklyGoals[week][key];
  // Cada semana usa el total logrado en su propia tabla como objetivo base de Plan Cero (regulares) y Dental (ventas).
  if(key==='p0'||key==='dental'){
    const totals=metrics||weeklyGroups(week).totals.metrics;
    return Number(totals[key==='p0'?'reg':'sales'])||0;
  }
  if(['sales','records'].includes(key)){
    const rows=weeklyGroups(week).rows;const names=[...new Set(rows.map(r=>r.module).filter(Boolean))];
    const configured=names.reduce((sum,name)=>sum+(Number(moduleQualityOptions(name)[key==='sales'?'weeklySales':'weeklyRecords'])||0),0);
    if(configured>0)return configured;
  }
  // Sin objetivos capturados, regulares y garantizadas comienzan en cero.
  if(key==='reg'||key==='guar')return 0;
  // Registros y ventas requieren captura manual. La segunda semana conserva
  // la herencia opcional de estas dos metas hasta que se edite individualmente.
  return primaryWeek&&week!==primaryWeek?weeklyGoalFor(primaryWeek,key):0;
}
function weeklyGoalInput(week,key,primaryWeek,metrics){
  const val=weeklyGoalFor(week,key,primaryWeek,metrics);
  const saved=hasWeeklyGoalOverride(week,key);
  const automatic=key==='p0'||key==='dental';
  const blankManual=(key==='records'||key==='sales')&&!saved&&val===0;
  const label=`Objetivo de ${WEEKLY_LABELS[key]} para ${weekLabel(week)}`;
  const origin=automatic?(saved?'Meta manual; borra el valor para volver al objetivo automático':key==='p0'?'Automático: total de ventas regulares de esta semana':'Automático: total de ventas de esta semana'):'Meta editable';
  const status=automatic?`<span class="weekly-goal-auto${saved?' manual':''}">${saved?'Manual':key==='p0'?'Auto total':'Auto total'}</span>`:'';
  return `<td><div class="weekly-goal-control"><input class="weekly-goal-input" type="number" inputmode="decimal" min="0" step="${automatic?'0.01':'1'}" value="${blankManual?'':val}" placeholder="${blankManual?'Ingresar':''}" data-weekly-week="${esc(week)}" data-weekly-metric="${key}" aria-label="${esc(label)}" title="${esc(origin)}. ${esc(label)}" />${status}</div></td>`;
}
function weeklyGoalExport(week,key,primaryWeek,metrics){
  const val=weeklyGoalFor(week,key,primaryWeek,metrics);
  return (key==='records'||key==='sales')&&!hasWeeklyGoalOverride(week,key)&&val===0?'':val;
}
function weeklyGroups(week){
  const data=combinedArchiveData(archive.reports);
  const validRows=filterPageSupervisors(data?.rows||[],'weekly').filter(r=>r.fecha&&r.fecha>=week&&r.fecha<=sundayOf(week));
  const {entries,totals}=accumulatedGroups(validRows,'module');
  return {entries,totals,rows:validRows};
}
function weeklyGlobalQuality(week,primaryWeek,data){
  // El objetivo de ventas capturado en la tabla semanal tiene prioridad para
  // Cumplimiento; los demás factores usan los objetivos y pesos de Ajustes.
  const salesGoal=weeklyGoalFor(week,'sales',primaryWeek,data.totals.metrics);
  return qualityResult(data.rows,'module','TOTAL','weekly',salesGoal>0?salesGoal:null).global;
}
function weeklyPercent(actual,target){return target>0?pct(100*actual/target):'—';}
function weeklyPanelMarkup(week,primaryWeek){
  const data=weeklyGroups(week);
  const qualityFor=g=>qualityResult(g.rows,'module',g.name,'weekly').global;
  const overall=weeklyGlobalQuality(week,primaryWeek,data);
  const rowMarkup=g=>`<tr><td><span class="daily-entity" title="${esc(g.name)}">${esc(g.name)}</span></td>${DAILY_METRICS.map(k=>`<td>${number.format(g.metrics[k])}</td>`).join('')}<td class="quality-global">${qualityPercentText(qualityFor(g))}</td></tr>`;
  const inputRow=`<tr class="goal-row"><td>OBJETIVOS</td>${DAILY_METRICS.map(k=>weeklyGoalInput(week,k,primaryWeek,data.totals.metrics)).join('')}<td>—</td></tr>`;
  const totalRow=`<tr class="weekly-total"><td>TOTAL ACUMULADO</td>${DAILY_METRICS.map(k=>`<td>${number.format(data.totals.metrics[k])}</td>`).join('')}<td class="quality-global">${qualityPercentText(overall)}</td></tr>`;
  const progressRow=`<tr class="weekly-progress"><td>CUMPLIMIENTO</td>${DAILY_METRICS.map(k=>{const goal=weeklyGoalFor(week,k,primaryWeek,data.totals.metrics);return `<td class="${goal?'':'no-goal'}">${weeklyPercent(data.totals.metrics[k],goal)}</td>`;}).join('')}<td>—</td></tr>`;
  const factorRow=`<tr class="weekly-quality"><td>CALIDAD DE FACTORES</td>${DAILY_METRICS.map(k=>{const goal=weeklyGoalFor(week,k,primaryWeek,data.totals.metrics);const ratio=qualityMetricFactor(goal>0?100*data.totals.metrics[k]/goal:NaN,100,{cap:!['sales','p0'].includes(k)});return `<td>${qualityPercentText(ratio)}</td>`;}).join('')}<td>—</td></tr>`;
  const globalRow=`<tr class="weekly-quality"><td>ALCANCE GLOBAL</td>${DAILY_METRICS.map(()=>'<td>—</td>').join('')}<td class="quality-global">${qualityPercentText(overall)}</td></tr>`;
  return {data,body:inputRow+(data.entries.length?data.entries.map(rowMarkup).join(''):'<tr><td colspan="8" class="daily-empty">Sin registros para esta semana.</td></tr>'),footer:totalRow+progressRow+factorRow+globalRow};
}

function weeklyVarianceData(){
  const {primary,previous}=weeklySelection();
  const main=weeklyGroups(primary),older=weeklyGroups(previous);
  return {primary,previous,main,older};
}
function renderWeekly(){
  if(!el('weeklyPage')||!isAuthorized())return;
  const {primary,previous,main,older}=weeklyVarianceData();
  el('weeklyPrimaryDate').value=primary;el('weeklyPreviousDate').value=previous;
  el('weeklyPrimaryLabel').textContent=weekLabel(primary);el('weeklyPreviousLabel').textContent=weekLabel(previous);
  el('weeklyPrimaryTitle').textContent=`Fecha de comparación 1 · ${weekLabel(primary)}`;
  el('weeklyPreviousTitle').textContent=`Fecha de comparación 2 · ${weekLabel(previous)}`;
  el('weeklyPeriod').textContent=`${weekLabel(primary)} vs. ${weekLabel(previous)}`;
  el('weeklyVarianceContext').textContent=`${weekLabel(primary)} frente a ${weekLabel(previous)}`;
  for(const [side,week] of [['Primary',primary],['Previous',previous]]){
    const panel=weeklyPanelMarkup(week,primary);
    el('weekly'+side+'Rows').innerHTML=panel.body;
    el('weekly'+side+'Footer').innerHTML=panel.footer;
    el('weekly'+side+'Modules').textContent=`${panel.data.entries.length} módulos`;
  }
  el('weeklyVarianceGrid').innerHTML=DAILY_METRICS.map(k=>{
    const current=main.totals.metrics[k],before=older.totals.metrics[k],delta=current-before;
    const cls=delta>0?'up':delta<0?'down':'same';
    const arrow=delta>0?'▲ +':delta<0?'▼ ':'— ';
    const ratio=before>0?`${delta>0?'+':''}${pct(100*delta/before)} vs. anterior`:delta>0?'Sin base previa':'Sin variación porcentual';
    return `<div class="weekly-variance-card"><div class="label">${WEEKLY_LABELS[k]}</div><strong class="value">${number.format(current)}</strong><span class="delta ${cls}">${arrow}${number.format(delta)}</span><div class="secondary">${esc(ratio)}</div></div>`;
  }).join('');
}
for(const id of ['weeklyPrimaryDate','weeklyPreviousDate'])el(id).addEventListener('change',()=>{
  const input=el(id);if(input.value){input.value=mondayOf(input.value);renderWeekly();}
});
el('weeklyPage').addEventListener('change',event=>{
  const input=event.target.closest('input[data-weekly-week][data-weekly-metric]');if(!input)return;
  const week=input.dataset.weeklyWeek,key=input.dataset.weeklyMetric;
  // Vaciar un objetivo restaura su valor predeterminado (o automático en P0/Dental).
  if(input.value.trim()===''){
    if(weeklyGoals[week])delete weeklyGoals[week][key];
  }else{
    const n=Number(input.value),decimal=key==='p0'||key==='dental';
    if(!Number.isFinite(n)||n<0||n>1000000||(!decimal&&!Number.isSafeInteger(n))||(decimal&&Math.abs(n*100-Math.round(n*100))>1e-7)){
      alert(decimal?'Ingresa una meta de 0 o más, con máximo dos decimales.':'Ingresa una meta entera igual o mayor que cero.');renderWeekly();return;
    }
    (weeklyGoals[week]??={})[key]=n;
  }
  try{localStorage.setItem(WEEKLY_GOALS_KEY,JSON.stringify(weeklyGoals));}catch(_){}
  renderWeekly();
});

function refreshAuthorizedPages(){
  const auth=isAuthorized();
  for(const tab of document.querySelectorAll('[data-page-tab="accumulated"],[data-page-tab="weekly"],[data-page-tab="visits"]'))tab.hidden=!auth;
  if(!auth&&['accumulated','weekly','visits'].includes(activePage))switchPage('individual');
  if(auth&&activePage==='accumulated')renderAccumulated();
  if(auth&&activePage==='weekly')renderWeekly();
  if(auth&&activePage==='visits')window.VISITS?.refreshSources();
}

function switchPage(page){
  activePage=['individual','team','daily','accumulated','weekly','visits','allrecords'].includes(page)&&!(['accumulated','weekly','visits'].includes(page)&&!isAuthorized())?page:'individual';
  document.body.dataset.page=activePage;
  el('teamPage').hidden=activePage!=='team';
  el('dailyPage').hidden=activePage!=='daily';
  el('accumulatedPage').hidden=activePage!=='accumulated';
  el('weeklyPage').hidden=activePage!=='weekly';
  el('visitPage').hidden=activePage!=='visits';
  el('allRecordsPage').hidden=activePage!=='allrecords';
  for(const b of document.querySelectorAll('[data-page-tab]')){const yes=b.dataset.pageTab===activePage;b.classList.toggle('active',yes);b.setAttribute('aria-selected',String(yes));}
  if(activePage==='team')renderTeam();
  if(activePage==='daily')renderDaily();
  if(activePage==='accumulated')renderAccumulated();
  if(activePage==='weekly')renderWeekly();
  if(activePage==='visits')window.VISITS?.open();
  if(activePage==='allrecords')renderAllRecords();
  if(el('settingsPanel').open){el('settingsPanel').open=false;el('toggleSettings').setAttribute('aria-expanded','false');}
}
for(const b of document.querySelectorAll('[data-page-tab]'))b.addEventListener('click',()=>switchPage(b.dataset.pageTab));
el('dailyDateMode').addEventListener('change',()=>{renderDaily();});
for(const id of ['dailyCurrentDate','dailyPreviousDate'])el(id).addEventListener('change',()=>renderDaily());
for(const id of ['accumulatedFrom','accumulatedTo'])el(id).addEventListener('change',renderAccumulated);
el('accumulatedClearDates').addEventListener('click',()=>{el('accumulatedFrom').value='';el('accumulatedTo').value='';renderAccumulated();});
for(const id of ['teamModule','teamSort'])el(id).addEventListener('change',renderTeam);
el('teamSearch').addEventListener('input',renderTeam);
el('teamTable').addEventListener('change',e=>{
  if(!e.target.matches('input[data-team-goal]'))return;
  const n=Number(e.target.value),person=e.target.dataset.teamGoal;
  if(!Number.isInteger(n)||n<1){alert('La meta semanal debe ser un número entero mayor o igual a 1.');e.target.value=executiveGoal(imported.week,person);return;}
  setExecutiveGoal(imported.week,person,n);
  if(imported.executive===person&&importActive()){computeImportedBase();renderRecords();}
  renderTeam();
});
el('teamTable').addEventListener('click',e=>{
  const button=e.target.closest('[data-open-exec]');if(!button||!imported.data)return;
  imported.executive=button.dataset.openExec;
  chooseExecutive();drawImportMeta(imported.sourceName||'Reporte.xls');
  switchPage('individual');el('sec-records').open=true;el('recordsDisclosure').open=true;
  el('sec-records').scrollIntoView({block:'start',behavior:'smooth'});
});

  function calculate(d){
    const errors=[],warnings=[];
    for(const k of KEYS){
      if(!Number.isFinite(d[k]))errors.push(`El valor de ${k} debe ser numérico.`);
      if(d[k]<0)errors.push(`El valor de ${k} no puede ser negativo.`);
      if(k!=='recover'&&!Number.isInteger(d[k]))errors.push(`Los conteos deben ser números enteros (${k}).`);
    }
    if(d.goal<1)errors.push('La meta semanal debe ser al menos 1.');
    if(d.xreg>d.reg)errors.push('Las regulares excluidas no pueden superar las registradas.');
    if(d.xguar>d.guar)errors.push('Las garantizadas excluidas no pueden superar las registradas.');
    if(d.xdental>d.dental)errors.push('Dental en excluidos no puede superar Dental registrado.');
    if(d.xapp>d.app)errors.push('APP en excluidos no puede superar APP registrado.');
    if(d.xp0>d.p0)errors.push('P0 en excluidos no puede superar P0 registrado.');
    const validReg=d.reg-d.xreg,validGuar=d.guar-d.xguar,validSales=validReg+validGuar;
    const validDental=d.dental-d.xdental,validApp=d.app-d.xapp,validP0=d.p0-d.xp0;
    const excludedSales=d.xreg+d.xguar;
    if(d.xdental>excludedSales)errors.push('Hay más planes dentales excluidos que folios excluidos.');
    if(d.xapp>excludedSales)errors.push('Hay más activaciones excluidas que folios excluidos.');
    if(d.xp0>d.xreg)errors.push('Hay más programas cero excluidos que folios regulares excluidos.');
    if(validDental>validSales)errors.push('El Plan Dental comisionable supera los folios comisionables.');
    if(validApp>validSales)errors.push('Las activaciones APP comisionables superan los folios comisionables.');
    if(validP0>validReg)errors.push('Los programas cero comisionables superan las aprobaciones regulares comisionables.');
    if(validP0<0||validApp<0||validSales<0||validDental<0||validReg<0||validGuar<0)errors.push('Corrige los valores excluidos.');
    if(d.inc>0&&excludedSales===0)warnings.push('Registraste incidencias, pero no folios excluidos. Si una incidencia afectó un folio, indica su exclusión y los complementos asociados.');
    if(validApp<validSales)warnings.push('Hay menos APP comisionables que ventas comisionables. Se está omitiendo el concepto APP en los folios desmarcados.');
    if(errors.length)return {ok:false,errors,warnings};
    const completion=validSales/d.goal*100;
    const tier=[...TIER].reverse().find(x=>completion>=x.min)||null;
    const p0rate=validReg>0?100*validP0/validReg:null;
    const p0Penalty=validReg>0&&validP0*100<validReg*30?15:0;
    const incPenalty=d.inc>=4?30:d.inc===3?20:d.inc===2?10:0;
    const penalty=p0Penalty+incPenalty;
    const salePay=round(validSales*(tier?.sale||0));
    const dentalPay=round(validDental*(tier?.dental||0));
    const appPay=round(validApp*(tier?.app||0));
    const p0Pay=round(validP0*(tier?.p0||0));
    const gross=round(salePay+dentalPay+appPay+p0Pay);
    const bonus=d.inc===0?(tier?.bonus||0):0;
    const beforePenalty=round(gross+bonus);
    const p0Discount=round(beforePenalty*p0Penalty/100);
    const incidenceDiscount=round(beforePenalty*incPenalty/100);
    const discounts=round(beforePenalty*penalty/100);
    const afterPenalty=round(beforePenalty-discounts);
    const net=round(afterPenalty-d.recover);
    const nextTarget=TIER.find(x=>x.min>completion);
    const needed=nextTarget?Math.max(0,Math.ceil(nextTarget.min*d.goal/100-1e-10)-validSales):0;
    return {ok:true,warnings,validReg,validGuar,validSales,validDental,validApp,validP0,excludedSales,completion,tier,p0rate,p0Penalty,incPenalty,penalty,salePay,dentalPay,appPay,p0Pay,gross,bonus,beforePenalty,p0Discount,incidenceDiscount,discounts,afterPenalty,recover:d.recover,net,nextTarget,needed,inc:d.inc,goal:d.goal};
  }
  // V14 · Edición autorizada de importes por escalón (sin cambiar umbrales ni penalizaciones).
  function renderCommissionRateEditor(){
    el('rateEditorRows').innerHTML=TIER.map((tier,i)=>`<tr><th scope="row">${esc(tier.label)}</th>${RATE_FIELDS.map(key=>`<td><input type="number" inputmode="decimal" min="0" max="1000000" step="0.01" value="${tier[key]}" data-rate-index="${i}" data-rate-key="${key}" aria-label="${RATE_LABELS[key]} · ${esc(tier.label)}" /></td>`).join('')}</tr>`).join('');
  }
  function syncPublicTariff(){
    document.querySelectorAll('.rate-table tbody tr[data-tier]').forEach(row=>{
      const tier=TIER.find(t=>t.min===Number(row.dataset.tier));
      if(!tier)return;
      RATE_FIELDS.forEach((field,j)=>{const cell=row.cells[j+1];if(cell)cell.textContent=mx(tier[field]);});
    });
  }
  function refreshAfterRateChange(){
    syncPublicTariff();render();
    if(activePage==='team')renderTeam();
    if(activePage==='individual'&&importActive())renderRecords();
  }
  renderCommissionRateEditor();syncPublicTariff();
  el('rateEditorRows').addEventListener('change',event=>{
    const input=event.target.closest('[data-rate-index][data-rate-key]');if(!input)return;
    if(!isAuthorized()){renderCommissionRateEditor();return;}
    const index=Number(input.dataset.rateIndex),field=input.dataset.rateKey,value=Number(input.value);
    if(!Number.isInteger(index)||index<0||index>=TIER.length||!RATE_FIELDS.includes(field)||input.value.trim()===''||!validRateAmount(value)){
      el('rateEditorStatus').textContent='Importe no válido: utiliza un valor de 0 a 1,000,000 con máximo dos decimales.';
      renderCommissionRateEditor();return;
    }
    TIER[index][field]=value;saveCommissionRates();refreshAfterRateChange();
    el('rateEditorStatus').textContent=`Tarifa actualizada: ${RATE_LABELS[field]}, escalón ${TIER[index].label} = ${mx(value)}.`;
  });
  el('restoreDefaultRates').addEventListener('click',()=>{
    if(!isAuthorized())return;
    if(!confirm('¿Restaurar todas las tarifas originales del esquema de comisiones?'))return;
    DEFAULT_TIER.forEach((row,i)=>RATE_FIELDS.forEach(field=>{TIER[i][field]=row[field];}));
    saveCommissionRates();renderCommissionRateEditor();refreshAfterRateChange();
    el('rateEditorStatus').textContent='Tarifas originales restauradas.';
  });
  window.CALC_ENGINE={calculate,tiers:TIER};

  function setForm(which){for(const k of KEYS){const input=document.querySelector(`[data-scenario="${which}"] [data-field="${k}"]`);input.value=state[which][k];}}
  function syncForm(which){const d={};for(const k of KEYS){const input=document.querySelector(`[data-scenario="${which}"] [data-field="${k}"]`);d[k]=input.value===''?NaN:Number(input.value);}state[which]=d;}
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(_){}}
  function restore(){try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&saved.base&&saved.sim){for(const s of ['base','sim'])for(const k of KEYS){if(Number.isFinite(saved[s][k]))state[s][k]=saved[s][k];}}}catch(_){}}
  function update(which){setForm(which);render();persist();}
  // V2.1: el desglose utiliza exclusivamente los conteos comisionables y las
  // tarifas del escalón aplicado. Es solo presentación: no modifica calculate().
  const PAYMENT_CONCEPTS=[
    ['Ventas','salePay','validSales','sale'],
    ['Plan Dental','dentalPay','validDental','dental'],
    ['Activación APP','appPay','validApp','app'],
    ['Plan Cero','p0Pay','validP0','p0'],
    ['Bono semanal','bonus',null,'bonus']
  ];
  function paymentConcepts(r){
    if(!r.ok)return [];
    return PAYMENT_CONCEPTS.map(([label,totalKey,qtyKey,rateKey])=>({
      label,totalKey,quantity:qtyKey?r[qtyKey]:(r.inc===0&&r.tier?1:0),
      rate:r.tier?.[rateKey]||0,total:r[totalKey]
    }));
  }
  function paymentBreakdownHtml(r){
    if(!r.ok)return '';
    const items=paymentConcepts(r);
    return `<div class="commission-detail"><div class="commission-detail-title">Pago por concepto <span>cantidad × tarifa unitaria</span></div><div class="concept-pay-list">${items.map(item=>`<div class="concept-pay-row"><span class="concept-name">${esc(item.label)}</span><span class="concept-amount"><strong>${mx(item.total)}</strong> <small>(${number.format(item.quantity)} × ${mx(item.rate)})</small></span></div>`).join('')}</div><div class="commission-detail-foot">Antes de descuentos: <b>${mx(r.beforePenalty)}</b> · Descuentos: <b>−${mx(r.discounts)}</b>${r.recover?` · Recuperación: <b>−${mx(r.recover)}</b>`:''}</div></div>`;
  }
  function htmlSummary(r){
    if(!r.ok){return `<div class="hero-line"><strong>Corrige los datos</strong><span class="pill alert">Sin cálculo</span></div><div class="scenario-flag">Verifica las cantidades de folios y sus complementos.</div>`;}
    const bad=r.inc>=4?' · DVL':r.inc>0?' · Sin bono':'';
    return `<div class="hero-line"><strong>Cumplimiento semanal</strong><b>${esc(pct(r.completion))}</b></div>
      <div class="bar"><span style="width:${Math.min(100,Math.max(0,r.completion))}%"></span></div>
      <div class="minirow"><span><strong>${r.validSales}</strong> ventas aptas de ${r.goal}</span><span>${r.excludedSales} excluidas</span></div>
      <div class="minirow" style="margin-top:9px"><span>Escalón <strong>${r.tier?esc(r.tier.label):'Sin pago (<50%)'}</strong></span><span class="pill ${r.penalty>0?'warning':''}">−${r.penalty}%${bad}</span></div>
      <div class="minirow" style="margin-top:9px"><span>Programa Cero</span><strong>${r.p0rate===null?'Exento (0 regulares)':pct(r.p0rate)}${r.p0Penalty?' · −15%':''}</strong></div>
      ${paymentBreakdownHtml(r)}
      <div class="payline"><span class="unit">Comisión neta de la semana</span><span class="net ${r.net<0?'negative':''}">${mx(r.net)}</span></div>
      <div class="scenario-flag">${r.nextTarget?`Para llegar al escalón de ${r.nextTarget.min}%: faltan <strong>${r.needed} venta(s) válida(s)</strong>.`:'Escalón máximo alcanzado.'}</div>`;
  }
  function messagesHtml(r){return [...r.errors||[],...r.warnings||[]].map((m,i)=>`<div class="message ${i<(r.errors||[]).length?'error':''}">${esc(m)}</div>`).join('');}
  function asNum(v){return Number.isFinite(v)?v:null;}
  function render(){
    const a=calculate(state.base),b=calculate(state.sim);
    for(const [key,r] of [['base',a],['sim',b]]){
      el(key+'Summary').innerHTML=htmlSummary(r);
      el(key+'Messages').innerHTML=messagesHtml(key==='base'&&importActive()?{...r,warnings:(r.warnings||[]).filter(m=>!m.includes('Hay menos APP')&&!m.includes('Registraste incidencias, pero no folios excluidos'))}:r);
      el(key+'Total').textContent=r.ok?mx(r.net):'—';
      el(key+'Overview').textContent=r.ok?`${pct(r.completion)} de meta · ${r.validSales} folios válidos · ${r.tier?.label||'Sin escalón'}`:'Datos por corregir';
    }
    const valid=a.ok&&b.ok;
    const delta=valid?round(b.net-a.net):null;
    el('deltaTotal').textContent=valid?(delta>0?'+':'')+mx(delta):'—';
    el('deltaTotal').classList.toggle('negative',valid&&delta<0);
    el('deltaOverview').textContent=valid?(delta===0?'Sin diferencia entre escenarios':delta>0?'La simulación genera una comisión mayor':'La simulación genera una comisión menor'):'Revisa los errores de los escenarios';
    const positives=valid?Math.max(0,a.net,b.net):0;
    const total=valid&&positives>0?Math.max(0,a.net)+Math.max(0,b.net):0;
    el('trackBase').style.width=total?`${Math.max(0,a.net)/total*100}%`:'50%';
    el('trackSim').style.width=total?`${Math.max(0,b.net)/total*100}%`:'50%';
    el('nextTier').disabled=!b.ok||!b.nextTarget;
    el('plusDental').disabled=!b.ok||b.validDental>=b.validSales;
    el('plusP0').disabled=!b.ok||b.validP0>=b.validReg;
    if(b.ok)el('nextTier').textContent=b.nextTarget?`Llegar a ${b.nextTarget.min}% (+${b.needed})`:'Escalón máximo';
    else el('nextTier').textContent='Llegar al siguiente escalón';
    const rows=[
      ['Objetivo semanal','goal','num'],['Ventas válidas','validSales','num'],['Regulares válidas','validReg','num'],['Garantizadas válidas','validGuar','num'],['Cumplimiento','completion','pct'],
      ['Programa Cero / regulares','p0rate','pctExempt'],['Escalón','tier','tier'],
      ['Ventas: comisión','salePay','money'],['Plan Dental: comisión','dentalPay','money'],['ACT APP: comisión','appPay','money'],['Programa Cero: comisión','p0Pay','money'],
      ['Subtotal de conceptos','gross','money','subtotal'],['Bono por calidad','bonus','money'],['Base para descuentos','beforePenalty','money','subtotal'],
      ['Descuento P0','p0Discount','negMoney'],['Descuento por incidencias','incidenceDiscount','negMoney'],['Descuento total combinado','discounts','negMoney','subtotal'],
      ['Neto después de porcentajes','afterPenalty','money','subtotal'],['Folios pagados antes: recuperación','recover','negMoney'],['TOTAL NETO SEMANAL','net','money','final']
    ];
    const renderValue=(r,k,t)=>{
      if(!r.ok)return '—';
      if(t==='tier')return r.tier?esc(r.tier.label):'Sin pago';
      const v=r[k];if(t==='money'){
        const part=paymentConcepts(r).find(p=>p.totalKey===k);
        return part?`${mx(v)}<small class="rate-inline">(${number.format(part.quantity)} × ${mx(part.rate)})</small>`:mx(v);
      }if(t==='negMoney')return v?`−${mx(v)}`:mx(0);if(t==='pct')return pct(v);if(t==='pctExempt')return v===null?'Exento':pct(v);return number.format(v);
    };
    const diff=(key,type)=>{
      if(!valid||type==='tier'||type==='pctExempt')return '—';
      const val=round(b[key]-a[key]);
      if(type==='pct')return (val>0?'+':'')+number.format(val)+' pp';
      if(type==='num')return val>0?'+'+number.format(val):number.format(val);
      if(val===0)return mx(0);
      const effective=type==='negMoney'?-val:val;
      return (effective>0?'+':'')+mx(effective);
    };
    el('comparisonRows').innerHTML=rows.map(([label,key,type,rowClass])=>{
      let deltaV=valid&&type!=='pctExempt'&&type!=='tier'?(b[key]-a[key])*(type==='negMoney'?-1:1):0;
      return `<tr class="${rowClass||''}"><td>${esc(label)}</td><td>${renderValue(a,key,type)}</td><td>${renderValue(b,key,type)}</td><td class="${deltaV>0?'positive':deltaV<0?'negative':''}">${diff(key,type)}</td></tr>`;
    }).join('');
    const selectedBase=a.ok&&a.tier?a.tier.min:null;
    const selectedSim=b.ok&&b.tier?b.tier.min:null;
    document.querySelectorAll('.rate-table tbody tr').forEach(tr=>{
      const min=Number(tr.dataset.tier),base=min===selectedBase,sim=min===selectedSim;
      tr.classList.toggle('tier-base',base&&!sim);tr.classList.toggle('tier-sim',sim&&!base);tr.classList.toggle('tier-both',base&&sim);
      const first=tr.querySelector('td:first-child');
      if(first){if(!first.dataset.original)first.dataset.original=first.textContent;first.innerHTML=esc(first.dataset.original)+(base?'<span class="tier-label">BASE</span>':'')+(sim?'<span class="tier-label sim-label">SIM</span>':'');}
    });
    el('tierOverview').textContent='Base: '+(a.ok?(a.tier?a.tier.label:'Sin escalón'):'Datos inválidos')+' · Simulación: '+(b.ok?(b.tier?b.tier.label:'Sin escalón'):'Datos inválidos');
    el('comparisonNote').textContent=valid?
      `Base: descuento P0 ${a.p0Penalty}% + incidencias ${a.incPenalty}% = ${a.penalty}%. Simulación: P0 ${b.p0Penalty}% + incidencias ${b.incPenalty}% = ${b.penalty}%. Cada descuento se calcula sobre conceptos + bono. Los folios anteriormente pagados se recuperan al final.`:
      'Corrige los datos señalados para obtener un comparativo válido.';
  }
  for(const which of ['base','sim']){
    document.querySelector(`[data-scenario="${which}"]`).addEventListener('input',e=>{if(e.target.matches('input[data-field]')){if(which==='base'&&importActive()){
      if(e.target.dataset.field==='goal'){
        setExecutiveGoal(imported.week,imported.executive,Number(e.target.value));computeImportedBase();if(!simDirty){state.sim.goal=state.base.goal;setForm('sim');render();}renderRecords();
      }else if(e.target.dataset.field==='recover'){
        imported.recoverManual=e.target.value===''?NaN:Number(e.target.value);
        setExecutiveRecovery(imported.week,imported.executive,imported.recoverManual);
        computeImportedBase();renderRecords();
      }
      return;
    }if(which==='sim')simDirty=true;syncForm(which);render();persist();}});
  }
  el('copySim').addEventListener('click',()=>{state.sim={...state.base};simDirty=false;update('sim');});
  el('example').addEventListener('click',()=>{resetToManual();simDirty=false;state.base={...DEFAULT_BASE};state.sim={...DEFAULT_SIM};setForm('base');setForm('sim');render();persist();});
  el('clear').addEventListener('click',()=>{resetToManual();simDirty=false;for(const s of ['base','sim'])state[s]=Object.fromEntries(KEYS.map(k=>[k,k==='goal'?10:0]));setForm('base');setForm('sim');render();persist();});
  el('plusReg').addEventListener('click',()=>{simDirty=true;if(!calculate(state.sim).ok)return;state.sim.reg+=1;state.sim.app+=1;update('sim');});
  el('plusGuar').addEventListener('click',()=>{simDirty=true;if(!calculate(state.sim).ok)return;state.sim.guar+=1;state.sim.app+=1;update('sim');});
  el('plusDental').addEventListener('click',()=>{simDirty=true;const r=calculate(state.sim);if(!r.ok||r.validDental>=r.validSales)return;state.sim.dental+=1;update('sim');});
  el('plusP0').addEventListener('click',()=>{simDirty=true;const r=calculate(state.sim);if(!r.ok||r.validP0>=r.validReg)return;state.sim.p0+=1;update('sim');});
  el('nextTier').addEventListener('click',()=>{simDirty=true;const r=calculate(state.sim);if(!r.ok||!r.nextTarget)return;state.sim.reg+=r.needed;state.sim.app+=r.needed;update('sim');});
  el('print').addEventListener('click',()=>{refreshAuthorizedPages();buildReport();window.print();});
  el('export').addEventListener('click',()=>{
    if(activePage==='allrecords'){
      const columns=allRecordsColumns(),rows=getAllRecordsFiltered();
      const records=[columns.map(columnLabel),...rows.map(r=>columns.map(c=>c.key.startsWith('raw:')?displayXlsValue(getCellText(r,c.key)):getCellText(r,c.key)))];
      const csv='\ufeff'+records.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`registros_xls_${dateIso(new Date())}.csv`);return;
    }
    if(activePage==='weekly'){
      if(!isAuthorized()){alert('Inicia sesión para consultar la comparativa semanal.');return;}
      const {primary,previous,main,older}=weeklyVarianceData();
      const lines=[['Sección','Semana','Módulo','Registros','Ventas totales','Regulares','Garantizadas','Programa Cero','Plan Dental','Calidad global']];
      for(const [week,data] of [[primary,main],[previous,older]]){
        lines.push(['OBJETIVOS',week,'TOTAL',...DAILY_METRICS.map(k=>weeklyGoalExport(week,k,primary,data.totals.metrics)),'']);
        for(const item of data.entries)lines.push(['MÓDULO',week,item.name,...DAILY_METRICS.map(k=>item.metrics[k]),qualityPercentText(qualityResult(item.rows,'module',item.name,'weekly').global)]);
        lines.push(['TOTAL',week,'TOTAL',...DAILY_METRICS.map(k=>data.totals.metrics[k]),qualityPercentText(weeklyGlobalQuality(week,primary,data))]);
        lines.push(['CUMPLIMIENTO %',week,'TOTAL',...DAILY_METRICS.map(k=>{const goal=weeklyGoalFor(week,k,primary,data.totals.metrics);return goal?round(100*data.totals.metrics[k]/goal):'';}),'']);
        lines.push(['CALIDAD DE FACTORES %',week,'TOTAL',...DAILY_METRICS.map(k=>{const goal=weeklyGoalFor(week,k,primary,data.totals.metrics);return qualityMetricFactor(goal?100*data.totals.metrics[k]/goal:NaN,100,{cap:!['sales','p0'].includes(k)})??'';}),'']);
        lines.push(['ALCANCE GLOBAL %',week,'TOTAL',...DAILY_METRICS.map(()=>'') ,weeklyGlobalQuality(week,primary,data)??'']);
      }
      lines.push(['VARIACIÓN',`${primary} vs ${previous}`,'TOTAL',...DAILY_METRICS.map(k=>main.totals.metrics[k]-older.totals.metrics[k]),'']);
      const csv='\ufeff'+lines.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`comparativa_semanal_${primary}_vs_${previous}.csv`);return;
    }
    if(activePage==='daily'&&imported.data){
      const dates=dailyDates();const lines=[['Agrupación','Nombre','Fecha principal','Fecha anterior',...DAILY_METRICS.map(k=>WEEKLY_LABELS[k]||k),'Calidad principal %','Calidad anterior %']];
      for(const [key,label] of [['module','Módulo'],['executive','Ejecutivo']]){
        const {entries,totals}=dailyGroups(key,dates);
        for(const item of [...entries,totals])lines.push([label,item.name,dates.latest,dates.previous,...DAILY_METRICS.map(k=>item.current[k]),qualityResult(item.currentRows,key,item.name,'daily').global??'',qualityResult(item.previousRows,key,item.name,'daily').global??'']);
      }
      const csv='\ufeff'+lines.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`comparativa_diaria_${dates.latest}.csv`);return;
    }
    if(activePage==='accumulated'){
      if(!isAuthorized()){alert('Inicia sesión para consultar el acumulado.');return;}
      const invalid=el('accumulatedFrom').value&&el('accumulatedTo').value&&el('accumulatedFrom').value>el('accumulatedTo').value;
      const rows=invalid?[]:accumulatedRows();
      const lines=[['Agrupación','Nombre','Registros','Ventas totales','Regulares','Garantizadas','Programa Cero','Plan Dental','Calidad']];
      for(const [groupBy,label] of [['module','Módulo'],['executive','Ejecutivo']]){
        const {entries,totals}=accumulatedGroups(rows,groupBy);
        for(const g of [...entries,totals])lines.push([label,g.name,...DAILY_METRICS.map(k=>g.metrics[k]),qualityResult(g.rows,groupBy,g.name,'accumulated').global??'']);
      }
      const csv='\ufeff'+lines.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`acumulado_general_${el('accumulatedFrom').value||'todo'}_${el('accumulatedTo').value||'todo'}.csv`);return;
    }
    if(activePage==='team'&&imported.data){
      const items=filteredTeamEntries();
      const lines=[['Ejecutivo','Módulo','Semana','Meta','Cumplimiento %','Ventas regulares','Ventas garantizadas','Ventas totales','APP','Programa Cero','Plan Dental','Incidencias','Escalón','Comisión estimada MXN'],...items.map(e=>{const r=e.result;return [e.name,e.module,weekLabel(imported.week),e.goal,r.ok?r.completion:'',r.ok?r.validReg:'',r.ok?r.validGuar:'',r.ok?r.validSales:'',r.ok?r.validApp:'',r.ok?r.validP0:'',r.ok?r.validDental:'',e.inputs.inc,briefTier(r),r.ok?r.net:'Revisar']})];
      const csv='\ufeff'+lines.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`comparativo_ejecutivos_${imported.week}.csv`);return;
    }
    const a=calculate(state.base),b=calculate(state.sim);
    if(!a.ok||!b.ok){alert('Corrige los datos antes de exportar.');return;}
    const rows=[['Concepto','Base','Simulación','Diferencia']];
    const measures=[['Meta semanal','goal'],['Ventas regulares válidas','validReg'],['Ventas garantizadas válidas','validGuar'],['Ventas válidas','validSales'],['Cumplimiento %','completion'],['Programa Cero %','p0rate'],['Comisión por ventas','salePay'],['Comisión dental','dentalPay'],['Comisión APP','appPay'],['Comisión P0','p0Pay'],['Subtotal','gross'],['Bono','bonus'],['Penalización P0 %','p0Penalty'],['Penalización incidencias %','incPenalty'],['Descuento total','discounts'],['Descuento previo','recover'],['NETO','net']];
    for(const [label,key] of measures){const x=asNum(a[key]),y=asNum(b[key]);rows.push([label,x===null?'Exento':x,y===null?'Exento':y,x===null||y===null?'':round(y-x)]);}
    rows.push([],['DETALLE DE PAGO','Escenario base','Simulación','Diferencia']);
    for(const [label,totalKey] of PAYMENT_CONCEPTS){
      const basePart=paymentConcepts(a).find(p=>p.totalKey===totalKey);
      const simPart=paymentConcepts(b).find(p=>p.totalKey===totalKey);
      const describe=p=>`${mx(p.total)} (${number.format(p.quantity)} x ${mx(p.rate)})`;
      rows.push([label,describe(basePart),describe(simPart),round(simPart.total-basePart.total)]);
    }
    for(const key of KEYS)rows.push(['Dato capturado: '+key,state.base[key],state.sim[key],round(state.sim[key]-state.base[key])]);
    if(importActive()) {
      const allView=el('tableScope').value==='all',columnView=tableView.columns.filter(c=>tableView.visible.has(c.key));
      const currentView=applyTableFilters(allView?imported.data.rows:rowsForSelection());
      rows.push([],['Semana del cálculo',weekLabel(imported.week)],['Ejecutivo del cálculo',imported.executive],['Vista exportada',allView?'Archivo completo':'Semana y ejecutivo'],[],columnView.map(columnLabel));
      for(const r of currentView)rows.push(columnView.map(c=>c.key.startsWith('raw:')?displayXlsValue(getCellText(r,c.key)):getCellText(r,c.key)));
    }
    const csv='\ufeff'+rows.map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='comparativo_comisiones_wm_sams.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

// El botón «Cargar XLS» queda libre; la selección de semana y ejecutivo también.
el('xlsInput').addEventListener('change',e=>importXlsFiles(e.target.files));
el('manualMode').addEventListener('click',resetToManual);
el('weekSelect').addEventListener('change',e=>{
  imported.week=e.target.value;imported.executive='';chooseExecutive();populateTeamModules();renderTeam();drawImportMeta(imported.sourceName||'Reporte.xls');
});
el('executiveSelect').addEventListener('change',e=>{
  imported.executive=e.target.value;chooseExecutive();drawImportMeta(imported.sourceName||'Reporte.xls');
});
el('recordsTable').addEventListener('change',e=>applyFolioValidationChange(e.target));
for(const id of ['tableScope','tablePaymentFilter','tableIncFilter','tableAppFilter','tableColumnValue'])el(id).addEventListener('change',()=>{saveTableFilters();renderRecords();});
el('tableFilter').addEventListener('input',()=>{saveTableFilters();renderRecords();});
el('tableColumnFilter').addEventListener('change',()=>{refreshValueFilter();saveTableFilters();renderRecords();});
el('showNoCode').addEventListener('change',e=>{tableView.showNoCode=e.target.checked;saveTableFilters();renderRecords();});
el('columnChooser').addEventListener('change',e=>{
  if(!e.target.matches('input[data-column]'))return;
  if(e.target.checked)tableView.visible.add(e.target.dataset.column);
  else if(tableView.visible.size>1)tableView.visible.delete(e.target.dataset.column);
  else e.target.checked=true;
  redrawColumnSettings();saveTableView();renderRecords();renderAllRecords();
});
el('resetTableSettings').addEventListener('click',()=>{resetTableView();saveTableFilters();saveTableView();renderRecords();renderAllRecords();});



  // 1.8 · Sesión real de correo validada por Netlify Identity y las Functions.
  function isAuthorized(){return Boolean(window.APP_CLOUD?.user?.id);}
  function requireOptions(fn){
    if(isAuthorized())return fn();
    window.APP_CLOUD?.openLogin(fn);
  }
  const settingsDialog=el('settingsPanel');
  function toggleSettings(force){
    settingsDialog.open=typeof force==='boolean'?force:!settingsDialog.open;
    el('toggleSettings').setAttribute('aria-expanded',String(settingsDialog.open));
    if(settingsDialog.open)settingsDialog.scrollIntoView({behavior:'smooth',block:'start'});
    else el('toggleSettings').focus();
  }
  settingsDialog.addEventListener('toggle',()=>{if(settingsDialog.open&&!isAuthorized())settingsDialog.open=false;});
  el('toggleSettings').addEventListener('click',()=>requireOptions(()=>toggleSettings()));
  el('closeSettings').addEventListener('click',()=>toggleSettings(false));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&settingsDialog.open)toggleSettings(false);
  });
  // La carga de XLS no requiere contraseña. Solo los Ajustes permanecen protegidos.
  el('chooseXls').addEventListener('click',()=>el('xlsInput').click());
  el('archiveList').addEventListener('change',e=>{
    if(!e.target.matches('input[data-report-id]'))return;
    const ids=new Set(archive.selection.ids);
    e.target.checked?ids.add(e.target.dataset.reportId):ids.delete(e.target.dataset.reportId);
    archive.selection.mode='selected';archive.selection.ids=[...ids];archive.temporaryMode=false;loadFolioFlags();archiveSelectionSave();refreshArchiveData(true);
  });
  for(const radio of document.querySelectorAll('[name=archiveMode]'))radio.addEventListener('change',e=>{
    archive.temporaryMode=false;loadFolioFlags();archive.selection.mode=e.target.value;
    if(e.target.value==='selected'&&!archive.selection.ids.length)archive.selection.ids=archive.reports.map(r=>r.id);
    archiveSelectionSave();refreshArchiveData(true);
  });
  el('archiveList').addEventListener('click',async e=>{
    const button=e.target.closest('[data-delete-report]');if(!button)return;
    const record=archive.reports.find(r=>r.id===button.dataset.deleteReport);
    if(!record||!confirm(`¿Eliminar el XLS guardado «${record.name}»? Esta acción no se puede deshacer.`))return;
    try{await archiveDelete(record.id);archive.reports=archive.reports.filter(r=>r.id!==record.id);
      archive.selection.ids=archive.selection.ids.filter(x=>x!==record.id);archiveSelectionSave();refreshArchiveData(true);
    }catch(err){alert('No se pudo eliminar: '+err.message);}
  });
  el('archiveClear').addEventListener('click',async()=>{
    if(!archive.reports.length||!confirm('¿Borrar TODOS los XLS guardados en tu cuenta? No podrás recuperarlos desde la aplicación.'))return;
    try{await archiveClear();archive.reports=[];archive.selection={mode:'all',ids:[]};archiveSelectionSave();refreshArchiveData(true);}
    catch(err){alert('No se pudo vaciar el historial: '+err.message);}
  });
  // V4: diseño persistente, orden de secciones, impresión e imagen comparten la misma plantilla.
  const LAYOUT_STORAGE='wmSamsComisionesLayoutV5';
  const SECTION_LABELS={summary:'Resumen global',scenarios:'Escenarios base y simulación',tariff:'Tarifario y reglas aplicadas',comparison:'Desglose comparativo',records:'Tabla de folios'};
  const SECTION_IDS=Object.keys(SECTION_LABELS);
  const DEFAULT_REPORT=['summary','scenarios','tariff','comparison','records'];
  const THEME_COLORS={blue:['Azul corporativo','#184d86','#112f56'],graphite:['Grafito','#465161','#283440'],emerald:['Verde esmeralda','#107c61','#155943'],violet:['Violeta','#674cb2','#403271'],terracotta:['Terracota','#b0633e','#7b422d']};
  const uiLayout={order:[...SECTION_IDS],printed:[...DEFAULT_REPORT],closed:['comparison'],theme:'blue',scale:3};
  function saveLayout(){try{localStorage.setItem(LAYOUT_STORAGE,JSON.stringify(uiLayout));}catch(_){}}
  function loadLayout(){
    try{
      const x=JSON.parse(localStorage.getItem(LAYOUT_STORAGE)||'null');if(!x)return;
      if(Array.isArray(x.order)){const valid=x.order.filter(z=>SECTION_IDS.includes(z));uiLayout.order=[...new Set([...valid,...SECTION_IDS])];}
      if(Array.isArray(x.printed))uiLayout.printed=[...new Set(x.printed.filter(z=>SECTION_IDS.includes(z)))];
      if(Array.isArray(x.closed))uiLayout.closed=[...new Set(x.closed.filter(z=>SECTION_IDS.includes(z)))];
      if(THEME_COLORS[x.theme])uiLayout.theme=x.theme;
      if([1,2,3,4].includes(Number(x.scale)))uiLayout.scale=Number(x.scale);
    }catch(_){}
  }
  function applyTheme(){
    document.body.dataset.theme=uiLayout.theme;
    el('themeChoices').innerHTML=Object.entries(THEME_COLORS).map(([key,values])=>`<button class="theme-choice ${key===uiLayout.theme?'selected':''}" type="button" data-theme-choice="${key}" aria-pressed="${key===uiLayout.theme}" style="--swatch:${values[1]}"><span class="theme-swatch"></span>${values[0]}</button>`).join('');
  }
  function renderSectionOrder(){
    el('sectionOrder').innerHTML=uiLayout.order.map((key,i)=>`<div class="order-row" data-order-row="${key}"><div class="order-name">${SECTION_LABELS[key]}</div><div class="order-tools"><button data-move="up" data-key="${key}" ${i===0?'disabled':''} title="Subir ${SECTION_LABELS[key]}" type="button" aria-label="Subir ${SECTION_LABELS[key]}">↑</button><button data-move="down" data-key="${key}" ${i===uiLayout.order.length-1?'disabled':''} title="Bajar ${SECTION_LABELS[key]}" type="button" aria-label="Bajar ${SECTION_LABELS[key]}">↓</button></div><label class="order-print"><input type="checkbox" data-print-key="${key}" ${uiLayout.printed.includes(key)?'checked':''}> Imprimir</label></div>`).join('');
  }
  function applySectionOrder(){
    const parent=el('sectionsContainer');uiLayout.order.forEach(key=>parent.append(el('sec-'+key)));
    renderSectionOrder();
  }
  function closeAllSections(isClosed){
    for(const k of SECTION_IDS){const e=el('sec-'+k);e.open=!isClosed;}
    for(const e of document.querySelectorAll('#scenarios > .scenario-fold'))e.open=!isClosed;
    uiLayout.closed=isClosed?[...SECTION_IDS]:[];saveLayout();
  }
  function setUpLayout(){
    loadLayout();uiLayout.closed=[...new Set([...uiLayout.closed,'comparison'])];applyTheme();applySectionOrder();
    el('imageScale').value=String(uiLayout.scale);
    for(const k of SECTION_IDS){
      const node=el('sec-'+k);node.open=!uiLayout.closed.includes(k);
      node.addEventListener('toggle',()=>{const closed=new Set(uiLayout.closed);node.open?closed.delete(k):closed.add(k);uiLayout.closed=[...closed];saveLayout();});
    }
    el('themeChoices').addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(!b)return;uiLayout.theme=b.dataset.themeChoice;applyTheme();saveLayout();});
    el('sectionOrder').addEventListener('click',e=>{
      const b=e.target.closest('button[data-move]');if(!b)return;
      const i=uiLayout.order.indexOf(b.dataset.key),delta=b.dataset.move==='up'?-1:1;
      if(i<0||i+delta<0||i+delta>=uiLayout.order.length)return;
      [uiLayout.order[i],uiLayout.order[i+delta]]=[uiLayout.order[i+delta],uiLayout.order[i]];
      applySectionOrder();saveLayout();
    });
    el('sectionOrder').addEventListener('change',e=>{const k=e.target.dataset.printKey;if(!k)return;const selected=new Set(uiLayout.printed);e.target.checked?selected.add(k):selected.delete(k);uiLayout.printed=SECTION_IDS.filter(x=>selected.has(x));saveLayout();});
    el('expandAllSections').addEventListener('click',()=>closeAllSections(false));
    el('collapseAllSections').addEventListener('click',()=>closeAllSections(true));
    el('resetLayout').addEventListener('click',()=>{uiLayout.order=[...SECTION_IDS];uiLayout.printed=[...DEFAULT_REPORT];uiLayout.closed=[];applySectionOrder();closeAllSections(false);saveLayout();});
    el('resetPrintVisibility').addEventListener('click',()=>{uiLayout.printed=[...DEFAULT_REPORT];renderSectionOrder();saveLayout();});
    el('imageScale').addEventListener('change',e=>{uiLayout.scale=[1,2,3,4].includes(Number(e.target.value))?Number(e.target.value):3;saveLayout();});
    el('previewReport').addEventListener('click',()=>{buildReport();window.print();});
  }
  // Versión 2.2: textos comunes a PDF y PNG. El título es global y el resto es por página.
  const REPORT_TEXT_STORAGE='wmSamsMeridaReportTextsV17';
  const REPORT_TEXT_DEFAULTS={
    individual:{subtitle:'Calculadora individual',description:'Comisiones simuladas: pueden existir variaciones respecto al monto final a pagar.',footer:'Lee los importes del escenario base y de la simulación. El desglose muestra tarifas, bono, incidencias, descuentos y pago neto estimado; los folios no comisionables no generan pago.'},
    team:{subtitle:'Comparativo de ejecutivos',description:'Comisiones simuladas: pueden existir variaciones respecto al monto final a pagar.',footer:'Cada fila corresponde a un ejecutivo. Compara su meta, ventas comisionables, nivel de cumplimiento y comisión estimada. Las incidencias y ajustes pueden modificar el importe final.'},
    daily:{subtitle:'Comparativa diaria',description:'Actividad operativa del XLS · Totales y variación entre fechas seleccionadas.',footer:'Cada cifra presenta el resultado del día principal y su variación frente al día comparado. Calidad es el promedio ponderado de Cumplimiento, Primera compra, Programa Cero y APP con objetivos configurables; se puede excluir a supervisores desde el filtro superior.'},
    accumulated:{subtitle:'Acumulado general',description:'Resultados consolidados del historial XLS guardado.',footer:'Totales sobre todos los XLS históricos deduplicados. La Calidad utiliza las metas semanales configuradas acumuladas por las semanas con registros y los cuatro factores de calidad. Se puede excluir a supervisores desde el filtro superior.'},
    weekly:{subtitle:'Comparativa semanal',description:'Objetivos, resultados y cumplimiento por semana completa de lunes a domingo.',footer:'OBJETIVOS define metas por semana; CUMPLIMIENTO = resultado / objetivo; CALIDAD DE FACTORES aplica el umbral y los topes configurados a cada indicador; ALCANCE GLOBAL = calidad ponderada de Cumplimiento, Primera compra, Programa Cero y APP. Los supervisores se incluyen según la casilla superior.'},
    allrecords:{subtitle:'Consulta de registros XLS',description:'Vista íntegra de los registros cargados, con filtros operativos combinados.',footer:'Se muestran las filas de los XLS activos que cumplen todos los filtros seleccionados. La columna Incidencia excluye pagos del folio; APP refleja la activación habilitada en el Dashboard. Filtrar no altera los cálculos.'}
  };
  const REPORT_TITLE_DEFAULT='Reporte de avances merida';
  const reportTextState={title:REPORT_TITLE_DEFAULT,pages:{}};
  function loadReportTexts(){
    try{const data=JSON.parse(localStorage.getItem(REPORT_TEXT_STORAGE)||'null');if(!data||typeof data!=='object')return;
      if(typeof data.title==='string')reportTextState.title=data.title.slice(0,140);
      for(const page of Object.keys(REPORT_TEXT_DEFAULTS)){
        const fields=data.pages?.[page];if(!fields||typeof fields!=='object')continue;
        reportTextState.pages[page]={};
        for(const key of ['subtitle','description','footer'])if(typeof fields[key]==='string')reportTextState.pages[page][key]=fields[key].slice(0,key==='footer'?1200:key==='description'?700:160);
      }
    }catch(_){}
  }
  function saveReportTexts(){try{localStorage.setItem(REPORT_TEXT_STORAGE,JSON.stringify(reportTextState));}catch(_){} }
  function reportTextFor(page=activePage){
    return {title:reportTextState.title, ...REPORT_TEXT_DEFAULTS[page]||REPORT_TEXT_DEFAULTS.individual,...reportTextState.pages[page]};
  }
  function reportHeaderMarkup(page,meta,brand="WM / Sam's<br>MARC · Ejecutivos"){
    const content=reportTextFor(page);
    return `<div class="report-heading"><div><h1>${esc(content.title)}</h1><p class="report-subtitle">${esc(content.subtitle)}</p><p class="report-disclaimer">${esc(content.description)}</p><p class="report-meta">${meta}</p></div><div class="report-brand">${brand}</div></div>`;
  }
  function reportFootMarkup(page){
    return `<footer class="report-foot"><div class="report-footnote"><strong>NOTA PARA LEER EL REPORTE</strong><p>${esc(reportTextFor(page).footer)}</p></div><div class="report-foot-version">Versión 2.2</div></footer>`;
  }
  function initReportTextEditor(){
    loadReportTexts();
    const fieldIds={title:'reportTextTitle',subtitle:'reportTextSubtitle',description:'reportTextDescription',footer:'reportTextFootnote'};
    const pageInput=el('reportTextPage');
    function display(){const values=reportTextFor(pageInput.value);for(const [key,id] of Object.entries(fieldIds))el(id).value=values[key]??'';el('reportTextStatus').textContent='Los cambios de textos se guardan automáticamente.';}
    pageInput.addEventListener('change',display);
    for(const [key,id] of Object.entries(fieldIds))el(id).addEventListener('input',e=>{
      const value=e.target.value;
      if(key==='title')reportTextState.title=value;
      else{const page=pageInput.value;reportTextState.pages[page]??={};reportTextState.pages[page][key]=value;}
      saveReportTexts();el('reportTextStatus').textContent='Textos guardados en este navegador.';
    });
    el('resetReportTextPage').addEventListener('click',()=>{delete reportTextState.pages[pageInput.value];saveReportTexts();display();});
    el('resetAllReportTexts').addEventListener('click',()=>{reportTextState.title=REPORT_TITLE_DEFAULT;reportTextState.pages={};saveReportTexts();display();});
    display();
  }
  initReportTextEditor();

  // Estilo reutilizado literalmente por la impresión y el archivo PNG.
  const REPORT_CSS=`

.report-page .report-daily-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:15px;align-items:start}
.report-page .report-daily-grid h3{font-size:13px;margin:0 0 8px;color:var(--rdeep)}
.report-page .report-daily-grid .daily-report-table{table-layout:fixed;min-width:0;font-size:8px}
.report-page .report-daily-grid .daily-report-table th{font-size:8px;padding:6px 3px;white-space:normal;overflow-wrap:anywhere;text-align:center}
.report-page .report-daily-grid .daily-report-table th:first-child,.report-page .report-daily-grid .daily-report-table td:first-child{text-align:left;width:25%}
.report-page .report-daily-grid .daily-report-table td{font-size:9px;text-align:center;white-space:normal;overflow-wrap:anywhere;padding:5px 3px}
.report-page .report-daily-grid .daily-report-table tbody tr:nth-child(even){background:#eff4fa}
.report-page .report-daily-grid .daily-report-table tfoot td{font-weight:800;background:var(--rpale)}
.report-page{font:12px/1.4 Arial,Helvetica,sans-serif;color:#273243;background:#fff;box-sizing:border-box;padding:25px 30px 32px;width:1120px;--raccent:#184d86;--rdeep:#112f56;--rpale:#eef5fb;--rline:#d9e3ec;}
.report-page *{box-sizing:border-box}.report-heading{border-bottom:3px solid var(--raccent);padding-bottom:13px;margin-bottom:17px;display:flex;justify-content:space-between;gap:18px;align-items:flex-end}
.report-heading h1{font-size:25px;letter-spacing:-.7px;margin:0 0 4px;color:var(--rdeep);overflow-wrap:anywhere}.report-page .report-subtitle{font-size:15px;font-weight:800;margin:5px 0 6px;color:var(--raccent)}.report-disclaimer{font-size:11px;font-weight:bold;color:var(--rdeep);margin:5px 0}.report-meta{font-size:10px;color:#526477;margin:6px 0 0;line-height:1.5;max-width:700px}.report-brand{text-align:right;text-transform:uppercase;letter-spacing:1.1px;font-size:10px;font-weight:800;color:var(--raccent)}
.report-section{margin:0 0 16px;break-inside:avoid}.report-section h2{font-size:15px;margin:0 0 10px;padding-bottom:5px;border-bottom:1px solid var(--rline);color:var(--rdeep);letter-spacing:-.2px}
.report-page .report-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.report-page .report-kpi{padding:14px 15px;border:1px solid var(--rline);border-radius:9px;background:var(--rpale)}
.report-page .report-kpi .rlabel{font-size:10px;font-weight:bold;text-transform:uppercase;color:#526477;letter-spacing:.4px}.report-page .report-kpi .rval{font-size:25px;font-weight:850;letter-spacing:-.6px;margin-top:6px;color:var(--rdeep)}
.report-page .report-scenario-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.report-page .report-scenario{border:1px solid var(--rline);border-radius:9px;padding:11px 13px}.report-page .report-scenario strong{font-size:13px;color:var(--rdeep)}.report-page .report-scenario .report-net{color:var(--raccent);font-size:23px;font-weight:850;margin-top:6px}.report-page .report-scenario .small-rows{display:grid;grid-template-columns:1fr 1fr;gap:5px 12px;margin-top:9px}.report-page .report-scenario .small-rows span{color:#53687c}.report-page .report-scenario .small-rows b{color:var(--rdeep);font-weight:800}
.report-page .commission-detail{margin-top:12px;padding:9px 10px;background:#f5f9fe;border:1px solid var(--rline);border-radius:7px}.report-page .commission-detail-title{font-size:10px;font-weight:800;color:var(--rdeep);margin-bottom:7px}.report-page .commission-detail-title span{font-size:9px;font-weight:400;color:#64758a}.report-page .concept-pay-row{display:flex;justify-content:space-between;gap:8px;align-items:baseline;border-bottom:1px solid #e0e9f2;padding:5px 1px;font-size:10px}.report-page .concept-pay-row:last-child{border-bottom:0}.report-page .concept-amount{white-space:nowrap;color:var(--rdeep);text-align:right}.report-page .concept-amount strong{font-size:11px}.report-page .concept-amount small{font-size:9px;color:#53687c}.report-page .commission-detail-foot{font-size:9px;color:#566879;margin-top:7px;line-height:1.45}.report-page .rate-inline{display:block;color:#587087;font-size:8px;font-weight:400;margin-top:2px}
.report-page .report-rules{display:grid;grid-template-columns:1.23fr .77fr;gap:17px}.report-page .report-rules h3{font-size:12px;color:var(--rdeep);margin:0 0 7px}.report-page .report-rules ul{padding-left:17px;margin:0;font-size:10px;line-height:1.38;color:#394b60}.report-page .report-rules li{margin-bottom:5px}.report-page .report-rules .tier-overview{font-size:10px;margin:0 0 7px;color:#49647e}.report-page .rate-caption{font-size:9px;color:#66788b}
.report-page table{width:100%;border-collapse:collapse;table-layout:auto;min-width:0;font-size:10px}.report-page table th{color:#52677d;background:#f2f6fa;font-size:9px;letter-spacing:.2px;font-weight:800;text-transform:uppercase;border-bottom:1px solid var(--rline);text-align:right;padding:7px 8px}.report-page table td{padding:6px 8px;border-bottom:1px solid #e9eef2;text-align:right;color:#314151}.report-page table th:first-child,.report-page table td:first-child{text-align:left}.report-page tr.subtotal td{font-weight:bold}.report-page tr.final td{background:var(--rpale);color:var(--rdeep);font-weight:850}.report-page td.positive{color:#0b7c54;font-weight:800}.report-page td.negative{color:#bf3d42;font-weight:800}
.report-page .rate-table th,.report-page .rate-table td{text-align:center;padding:7px 5px}.report-page .rate-table th:first-child,.report-page .rate-table td:first-child{text-align:left}.report-page .rate-table .tier-base td{background:var(--rpale)}.report-page .rate-table .tier-sim td{background:#e1f3ed}.report-page .rate-table .tier-both td{background:#d5eee3;font-weight:bold}.report-page .tier-label{font-size:8px;margin-left:3px;padding:1px 4px;background:#dceafb;border-radius:3px;color:#184d86}.report-page .tier-label.sim-label{background:#d5f4e8;color:#166d50}
.report-page .report-note{margin:8px 0 0;font-size:10px;color:#596d81}.report-page .report-input-info{border:1px solid var(--rline);border-radius:9px;padding:10px 13px;font-size:11px}.report-page .report-input-info p{margin:2px 0 5px}
.report-page .report-section-records{break-inside:auto}.report-page .report-section-records table{table-layout:fixed}.report-page .report-section-records table th,.report-page .report-section-records table td{padding:5px 6px;text-align:left;white-space:normal;overflow-wrap:anywhere;font-size:9px}.report-page .report-section-records table thead{display:table-header-group}.report-page .report-section-records table tr{break-inside:avoid}.report-page .record-export-table tbody tr:nth-child(odd) td{background:#fff}.report-page .record-export-table tbody tr:nth-child(even) td{background:#edf3fa}.report-page .report-foot{border-top:1px solid var(--rline);padding-top:15px;margin-top:72px;font-size:10px;color:#566879;text-align:left;break-inside:avoid;page-break-inside:avoid;clear:both}.report-page .report-footnote{line-height:1.55}.report-page .report-footnote strong{display:block;color:var(--rdeep);font-size:9px;letter-spacing:.65px;margin-bottom:5px}.report-page .report-footnote p{margin:0;overflow-wrap:anywhere;white-space:pre-wrap}.report-page .report-foot-version{text-align:right;margin-top:18px;font-size:9px;color:#778698}
@media print{.report-page{padding:0!important;width:100%!important}.report-page .report-section-records{break-before:page;page-break-before:always}.report-page .report-section{break-inside:auto}.report-page .report-section:not(.report-section-records):not(.report-section-comparison){break-inside:avoid;page-break-inside:avoid}.report-page .report-section-records:first-of-type{break-before:auto;page-break-before:auto}}
.report-page .report-section-allrecords{break-inside:auto;page-break-inside:auto}.report-page .report-section-allrecords table{table-layout:fixed}.report-page .report-section-allrecords th,.report-page .report-section-allrecords td{font-size:8px;padding:5px 6px;text-align:left;white-space:normal;overflow-wrap:anywhere}.report-page .report-section-allrecords thead{display:table-header-group}.report-page .report-section-allrecords tr{break-inside:avoid;page-break-inside:avoid}
@media print{.report-page .report-section.report-section-allrecords{break-inside:auto!important;page-break-inside:auto!important;}.report-page .report-section-allrecords table{break-inside:auto!important;page-break-inside:auto!important;}}
`;
  function buildTeamReport(){
    const entries=filteredTeamEntries();
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    let valid=entries.filter(e=>e.result.ok);
    const sums=valid.reduce((v,e)=>{const r=e.result;v.sales+=r.validSales;v.goal+=r.goal;v.net+=r.net;return v},{sales:0,goal:0,net:0});
    const tr=entries.map(e=>{const r=e.result;return `<tr><td>${esc(e.name)}</td><td>${esc(e.module)}</td><td>${e.goal}</td><td>${r.ok?pct(r.completion):'—'}</td><td>${r.ok?r.validReg:'—'}</td><td>${r.ok?r.validGuar:'—'}</td><td>${r.ok?r.validSales:'—'}</td><td>${r.ok?r.validApp:'—'}</td><td>${r.ok?r.validP0:'—'}</td><td>${r.ok?r.validDental:'—'}</td><td>${r.inc||0}</td><td>${briefTier(r)}</td><td>${r.ok?mx(r.net):'Revisar'}</td></tr>`}).join('');
    const headers=['Ejecutivo','Módulo','Meta','Cumpl.','Reg.','Gar.','Ventas','APP','P0','Dental','Inc.','Escalón','Comisión'];
    const html=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:#edf4fc">${reportHeaderMarkup("team",`Semana: ${esc(weekLabel(imported.week))} · Calculo manual desde google forms · ${entries.length} ejecutivos visibles · ${new Date().toLocaleString('es-MX')}`)}
      <section class="report-section report-section-team-summary" data-report-section="team-summary"><h2>Resumen del equipo</h2><div class="report-kpis"><div class="report-kpi"><div class="rlabel">Ejecutivos</div><div class="rval">${entries.length}</div></div><div class="report-kpi"><div class="rlabel">Ventas válidas</div><div class="rval">${sums.sales}</div></div><div class="report-kpi"><div class="rlabel">Comisiones estimadas</div><div class="rval">${mx(round(sums.net))}</div></div></div></section>
      <section class="report-section report-section-team" data-report-section="team"><h2>Comparativo por ejecutivo</h2><table class="team-export-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${tr||'<tr><td colspan="13">Sin registros para los filtros seleccionados.</td></tr>'}</tbody></table><p class="report-note">Metas individuales editables. APP considerada por cada venta válida, excepto desactivaciones manuales. Incidencias, estatus no pagables, descuentos y penalización de Programa Cero aplicados por ejecutivo. Los objetivos se presuponen en 10 salvo modificación.</p></section>${reportFootMarkup("team")}</div>`;
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style>${html}`;
    return el('printPage');
  }
  function buildDailyEmptyReport(){
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style><div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep}">${reportHeaderMarkup("daily","Calculo manual desde google forms")}<p>Importa un reporte XLS para generar la comparativa.</p>${reportFootMarkup("daily")}</div>`;
    return el('printPage');
  }
  function buildDailyReport(){
    renderDaily();
    const dates=dailyDates();
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    const metricHeaders=['Registros','Ventas','Regul.','Garant.','P. Cero','Dental','Calidad'];
    function dailyPrintTable(groupBy,label){
      const {entries,totals}=dailyGroups(groupBy,dates);
      const cells=g=>`<tr${g.name==='TOTAL'?' class="daily-total-row"':''}><td>${esc(g.name)}</td>${DAILY_METRICS.map(k=>{const delta=g.current[k]-g.previous[k];return `<td>${g.current[k]} (${delta>0?'+':''}${delta})</td>`;}).join('')}<td>${qualityPercentText(qualityResult(g.currentRows,groupBy,g.name,'daily').global)}</td></tr>`;
      return `<div><h3>${label} · ${entries.length}</h3><table class="daily-report-table"><thead><tr><th>${groupBy==='module'?'Módulo':'Ejecutivo'}</th>${metricHeaders.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${entries.map(cells).join('')||'<tr><td colspan="8">Sin registros</td></tr>'}</tbody><tfoot>${entries.length?cells(totals):''}</tfoot></table></div>`;
    }
    const html=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:#edf4fc">${reportHeaderMarkup("daily",`${fmtDay(dates.latest)} vs ${fmtDay(dates.previous)} · Calculo manual desde google forms · ${new Date().toLocaleString('es-MX')}`)}<section class="report-section report-section-daily" data-report-section="daily"><h2>Por módulo y ejecutivo · cifras y variaciones</h2><div class="report-daily-grid">${dailyPrintTable('module','Módulos')}${dailyPrintTable('executive','Ejecutivos')}</div></section>${reportFootMarkup("daily")}</div>`;
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style>${html}`;
    return el('printPage');
  }

  function buildAccumulatedReport(){
    if(!isAuthorized())return buildDailyEmptyReport();
    renderAccumulated();
    const rows=el('accumulatedFrom').value&&el('accumulatedTo').value&&el('accumulatedFrom').value>el('accumulatedTo').value?[]:accumulatedRows();
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    const headers=['Registros','Ventas','Regul.','Garant.','P. Cero','Dental','Calidad'];
    const table=(groupBy,label)=>{
      const {entries,totals}=accumulatedGroups(rows,groupBy);
      const cells=group=>`<tr${group.name==='TOTAL'?' class="daily-total-row"':''}><td>${esc(group.name)}</td>${DAILY_METRICS.map(key=>`<td>${group.metrics[key]}</td>`).join('')}<td>${qualityPercentText(qualityResult(group.rows,groupBy,group.name,'accumulated').global)}</td></tr>`;
      return `<div><h3>${label} · ${entries.length}</h3><table class="daily-report-table"><thead><tr><th>${groupBy==='module'?'Módulo':'Ejecutivo'}</th>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${entries.map(cells).join('')||'<tr><td colspan="8">Sin registros en el periodo</td></tr>'}</tbody><tfoot>${entries.length?cells(totals):''}</tfoot></table></div>`;
    };
    const html=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:#edf4fc">${reportHeaderMarkup("accumulated",`${esc(accumulatedPeriodText())} · ${archive.reports.length} archivos históricos · ${rows.length} registros · Calculo manual desde google forms · ${new Date().toLocaleString('es-MX')}`)}<section class="report-section report-section-daily" data-report-section="daily"><h2>Acumulados por módulo y ejecutivo</h2><div class="report-daily-grid">${table('module','Módulos')}${table('executive','Ejecutivos')}</div><p class="report-note">Datos únicos de todos los XLS guardados en tu cuenta. Se incluyen los registros del periodo indicado. Ventas = registros con código; Programa Cero = ventas regulares con P0; Dental = ventas con PD. Sin comparación ni variaciones diarias.</p></section>${reportFootMarkup("accumulated")}</div>`;
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style>${html}`;
    return el('printPage');
  }

  function buildWeeklyReport(){
    if(!isAuthorized())return buildDailyEmptyReport();
    renderWeekly();
    const {primary,previous,main,older}=weeklyVarianceData();
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    const metricHeaders=['Registros','Ventas','Regul.','Garant.','P. Cero','Dental','Calidad'];
    const variation=`<table class="daily-report-table"><thead><tr><th>Indicador</th><th>Principal</th><th>Anterior</th><th>Diferencia</th></tr></thead><tbody>${DAILY_METRICS.map(k=>{const d=main.totals.metrics[k]-older.totals.metrics[k];return `<tr><td>${WEEKLY_LABELS[k]}</td><td>${main.totals.metrics[k]}</td><td>${older.totals.metrics[k]}</td><td>${d>0?'+':''}${d}</td></tr>`;}).join('')}</tbody></table>`;
    const table=(week,data,title)=>{
      const goals=DAILY_METRICS.map(k=>weeklyGoalFor(week,k,primary,data.totals.metrics));
      const global=weeklyGlobalQuality(week,primary,data);
      const goalRow=`<tr class="goal-row"><td>OBJETIVOS</td>${DAILY_METRICS.map(k=>{const v=weeklyGoalExport(week,k,primary,data.totals.metrics);return `<td>${v===''?'—':number.format(v)}</td>`;}).join('')}<td>—</td></tr>`;
      const body=data.entries.map(g=>`<tr><td>${esc(g.name)}</td>${DAILY_METRICS.map(k=>`<td>${g.metrics[k]}</td>`).join('')}<td>${qualityPercentText(qualityResult(g.rows,'module',g.name,'weekly').global)}</td></tr>`).join('')||'<tr><td colspan="8">Sin registros</td></tr>';
      const sum=`<tr class="daily-total-row"><td>TOTAL</td>${DAILY_METRICS.map(k=>`<td>${data.totals.metrics[k]}</td>`).join('')}<td>${qualityPercentText(global)}</td></tr>`;
      const achievement=`<tr class="daily-total-row"><td>CUMPLIMIENTO</td>${DAILY_METRICS.map((k,i)=>`<td>${goals[i]?weeklyPercent(data.totals.metrics[k],goals[i]):'—'}</td>`).join('')}<td>—</td></tr>`;
      const factors=`<tr class="daily-total-row"><td>CALIDAD FACTORES</td>${DAILY_METRICS.map((k,i)=>`<td>${qualityPercentText(qualityMetricFactor(goals[i]>0?100*data.totals.metrics[k]/goals[i]:NaN,100,{cap:!['sales','p0'].includes(k)}))}</td>`).join('')}<td>—</td></tr>`;
      const overall=`<tr class="daily-total-row"><td>ALCANCE GLOBAL</td>${DAILY_METRICS.map(()=>'<td>—</td>').join('')}<td>${qualityPercentText(global)}</td></tr>`;
      return `<div><h3>${title} · ${weekLabel(week)}</h3><table class="daily-report-table"><thead><tr><th>Módulo</th>${metricHeaders.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${goalRow}${body}</tbody><tfoot>${sum}${achievement}${factors}${overall}</tfoot></table></div>`;
    };

    const html=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:#edf4fc">${reportHeaderMarkup("weekly",`${weekLabel(primary)} vs ${weekLabel(previous)} · Calculo manual desde google forms · ${new Date().toLocaleString('es-MX')}`)}<section class="report-section" data-report-section="weekly-variance"><h2>Variación de resultados</h2>${variation}</section><section class="report-section report-section-daily" data-report-section="daily"><h2>Resultados y objetivos por módulo</h2><div class="report-daily-grid">${table(primary,main,'Fecha de comparación 1')}${table(previous,older,'Fecha de comparación 2')}</div><p class="report-note">Registros y ventas: objetivos de captura manual. Regulares y garantizadas: cero por defecto. Plan Cero: objetivo igual a todas las ventas regulares logradas; Dental: objetivo igual a todas las ventas totales logradas en cada semana. Las metas automáticas se pueden modificar. Calidad: objetivos y factores configurables; Alcance global: promedio ponderado de cuatro factores.</p></section>${reportFootMarkup("weekly")}</div>`;
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style>${html}`;
    return el('printPage');
  }

  function buildAllRecordsReport(){
    const rows=getAllRecordsFiltered(),cols=allRecordsColumns();
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    const module=allRecordsFilterValue('allRecordsModule')||'Todos',person=allRecordsFilterValue('allRecordsExecutive')||'Todos';
    const details=`Módulo: ${esc(module)} · Ejecutivo: ${esc(person)} · ${number.format(rows.length)} registros · Calculo manual desde google forms · ${new Date().toLocaleString('es-MX')}`;
    const head=cols.map(c=>`<th>${esc(columnLabel(c))}</th>`).join('');
    const body=rows.map(r=>'<tr>'+cols.map(c=>`<td>${tableCellMarkup(r,c,true)}</td>`).join('')+'</tr>').join('');
    const html=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:#edf4fc">
      ${reportHeaderMarkup('allrecords',details)}
      <section class="report-section report-section-allrecords" data-report-section="allrecords"><h2>Registros XLS · ${number.format(rows.length)} filas</h2>
      <p class="report-note">Las columnas coinciden con la configuración de la tabla de la calculadora. Los filtros pueden combinarse; Incidencia y APP reflejan las casillas seleccionadas.</p>
      <table class="record-export-table"><thead><tr>${head}</tr></thead><tbody>${body||`<tr><td colspan="${Math.max(1,cols.length)}">Sin registros coincidentes.</td></tr>`}</tbody></table>
      </section>${reportFootMarkup('allrecords')}</div>`;
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style>${html}`;
    return el('printPage');
  }

  function buildReport(){
    if(activePage==='visits')return window.VISITS?.buildReport();
    if(activePage==='allrecords')return buildAllRecordsReport();
    if(activePage==='weekly')return buildWeeklyReport();
    if(activePage==='accumulated')return buildAccumulatedReport();
    if(activePage==='daily')return imported.data?buildDailyReport():buildDailyEmptyReport();
    if(activePage==='team'&&imported.data)return buildTeamReport();
    if(importActive())renderRecords();
    const [themeName,accent,deep]=THEME_COLORS[uiLayout.theme];
    const a=calculate(state.base),b=calculate(state.sim);
    const canMoney=r=>r.ok?mx(r.net):'—';
    const difference=a.ok&&b.ok?mx(b.net-a.net):'—';
    const sectionHtml={};
    sectionHtml.import=`<div class="report-input-info"><p><strong>Origen:</strong> Calculo manual desde google forms</p>${importActive()?`<p><strong>Semana:</strong> ${esc(weekLabel(imported.week))} · <strong>Ejecutivo:</strong> ${esc(imported.executive)}</p>`:''}<p><strong>Meta individual:</strong> ${esc(String(state.base.goal))}</p></div>`;
    sectionHtml.summary=`<div class="report-kpis"><div class="report-kpi"><div class="rlabel">Escenario base</div><div class="rval">${canMoney(a)}</div><div class="report-note">${a.ok?esc(pct(a.completion))+' cumplimiento':'Revisar datos'}</div></div><div class="report-kpi"><div class="rlabel">Escenario simulado</div><div class="rval">${canMoney(b)}</div><div class="report-note">${b.ok?esc(pct(b.completion))+' cumplimiento':'Revisar datos'}</div></div><div class="report-kpi"><div class="rlabel">Diferencia</div><div class="rval">${difference}</div><div class="report-note">Simulación menos base</div></div></div>`;
    const scenarioHtml=(name,r)=>`<div class="report-scenario"><strong>${name}</strong><div class="report-net">${canMoney(r)}</div>${r.ok?`<div class="small-rows"><span>Meta: <b>${r.goal}</b></span><span>Ventas válidas: <b>${r.validSales}</b></span><span>Regulares: <b>${r.validReg}</b></span><span>Garantizadas: <b>${r.validGuar}</b></span><span>Dental: <b>${r.validDental}</b></span><span>APP: <b>${r.validApp}</b></span><span>Programa Cero: <b>${r.validP0}</b></span><span>Incidencias: <b>${r.inc}</b></span><span>Cumplimiento: <b>${pct(r.completion)}</b></span><span>Escalón: <b>${r.tier?esc(r.tier.label):'Sin pago'}</b></span><span>Penalización: <b>${r.penalty}%</b></span><span>Bono: <b>${mx(r.bonus)}</b></span></div>${paymentBreakdownHtml(r)}`:'<p>Los datos requieren revisión.</p>'}</div>`;
    sectionHtml.scenarios=`<div class="report-scenario-grid">${scenarioHtml('Escenario base',a)}${scenarioHtml('Simulación',b)}</div>`;
    const notes=document.querySelector('.section-card[aria-label="Reglas y tarifas"] .notes');
    sectionHtml.tariff=`<div class="report-rules"><div><h3>Importes por escalón</h3><div class="tier-overview">${esc(el('tierOverview').textContent)}</div>${document.querySelector('.rate-table').outerHTML}<div class="rate-caption">Bono semanal único, sujeto a cero incidencias.</div></div><div><h3>Reglas aplicadas</h3>${notes?notes.outerHTML:''}</div></div>`;
    sectionHtml.comparison=`${el('comparisonTable').outerHTML}<p class="report-note">${esc(el('comparisonNote').textContent)}</p>`;
    if(importActive()){
      const cols=tableView.columns.filter(c=>tableView.visible.has(c.key));
      const filtered=applyTableFilters(rowsForSelection());
      sectionHtml.records=`<p class="report-note">${filtered.length} registros en la tabla filtrada. Las casillas de incidencia/APP aparecen como Sí o No en el reporte.</p><table class="record-export-table"><thead><tr>${cols.map(c=>`<th>${esc(columnLabel(c))}</th>`).join('')}</tr></thead><tbody>${filtered.length?filtered.map(r=>`<tr>${cols.map(c=>`<td>${tableCellMarkup(r,c,true)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${cols.length||1}">Sin folios visibles según los filtros aplicados.</td></tr>`}</tbody></table>`;
    }
    const sections=uiLayout.order.filter(k=>uiLayout.printed.includes(k)&&(k!=='records'||importActive())).map(k=>`<section class="report-section report-section-${k}" data-report-section="${k}"><h2>${SECTION_LABELS[k]}</h2>${sectionHtml[k]||''}</section>`).join('');
    const info=importActive()?`Calculo manual desde google forms · Semana ${esc(weekLabel(imported.week))} · ${esc(imported.executive)} · Objetivo: ${state.base.goal}`:`Calculo manual desde google forms · Captura manual · Objetivo: ${state.base.goal}`;
    const report=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:${uiLayout.theme==='blue'?'#eef5fb':uiLayout.theme==='graphite'?'#eef0f3':uiLayout.theme==='emerald'?'#e8f6f0':uiLayout.theme==='violet'?'#f0ecfc':'#fcf1e7'}">${reportHeaderMarkup("individual",`${info}<br>Reporte generado: ${new Date().toLocaleString('es-MX')}`,`WM / Sam's<br>MARC · Ejecutivos<br>${themeName}`)}${sections||'<p>No hay secciones activadas para el reporte. Selecciona alguna en Ajustes.</p>'}${reportFootMarkup("individual")}</div>`;
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style>${report}`;
    return el('printPage');
  }
  function saveBlob(blob,fileName){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);}
  // PNG puro con Canvas: funciona offline y evita que SVG foreignObject contamine el lienzo.
  // Toma todas las secciones, filas, columnas y orden desde el mismo reporte que usa la impresión.
  function paintReportCanvas(ctx,draw){
    const report=el('printPage');
    const sections=[...report.querySelectorAll('[data-report-section]')];
    const width=1120,margin=34,content=width-margin*2;
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    const pale={blue:'#eef5fb',graphite:'#eef0f3',emerald:'#e8f6f0',violet:'#f0ecfc',terracotta:'#fcf1e7'}[uiLayout.theme];
    let y=34;
    const font=(size=12,bold=false)=>`${bold?'bold ':''}${size}px Arial, sans-serif`;
    function rect(x,yy,w,h,fill,stroke){if(!draw)return;ctx.fillStyle=fill||'#fff';ctx.fillRect(x,yy,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.strokeRect(x+.5,yy+.5,w-1,h-1);}}
    function line(x,yy,w,color='#d9e3ec'){if(!draw)return;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x,yy+.5);ctx.lineTo(x+w,yy+.5);ctx.stroke();}
    function write(t,x,yy,size=12,bold=false,color='#273243'){if(!draw)return;ctx.font=font(size,bold);ctx.fillStyle=color;ctx.textBaseline='top';ctx.fillText(String(t||''),x,yy);}
    function fit(t,maxWidth,size=11,bold=false){
      ctx.font=font(size,bold);let value=String(t??'').replace(/\s+/g,' ').trim();
      if(ctx.measureText(value).width<=maxWidth)return value;
      while(value.length&&ctx.measureText(value+'…').width>maxWidth)value=value.slice(0,-1);
      return value+'…';
    }
    function wrap(t,maxWidth,size=11,bold=false,maxLines=999){
      ctx.font=font(size,bold);const blocks=String(t??'').split(/\n/);let lines=[];
      for(const block of blocks){let words=block.split(/\s+/).filter(Boolean),lineText='';
        for(const word of words){const attempt=lineText?lineText+' '+word:word;
          if(ctx.measureText(attempt).width<=maxWidth)lineText=attempt;
          else{if(lineText)lines.push(lineText);lineText=word;
            while(ctx.measureText(lineText).width>maxWidth&&lineText.length>1){
              let cut=lineText.length-1;while(cut>1&&ctx.measureText(lineText.slice(0,cut)).width>maxWidth)cut--;
              lines.push(lineText.slice(0,cut));lineText=lineText.slice(cut);
            }
          }
        }
        lines.push(lineText);
      }
      if(lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=fit(lines[maxLines-1]+'…',maxWidth,size,bold);}
      return lines.length?lines:[''];
    }
    function paragraph(t,x,yy,maxWidth,size=11,row=16,color='#50637a',maxLines=999){const lines=wrap(t,maxWidth,size,false,maxLines);for(let i=0;i<lines.length;i++)write(lines[i],x,yy+i*row,size,false,color);return yy+lines.length*row;}
    function heading(text){y+=16;write(text,margin,y,16,true,deep);y+=29;line(margin,y,content);y+=11;}
    function tableAt(node,x,yy,w,{fontSize=10,rowMin=28,widths=null,highlightTiers=false,striped=false}={}){
      if(!node)return yy;
      const headers=[...node.querySelectorAll('thead tr:first-child th')].map(z=>z.textContent.trim());
      const cols=headers.length;if(!cols)return yy;
      const shares=widths&&widths.length===cols?widths:Array(cols).fill(1/cols);
      const weights=shares.reduce((v,n)=>v+n,0),cWidths=shares.map(v=>w*v/weights);
      const rows=[...node.querySelectorAll('tbody tr'),...(node.classList.contains('daily-report-table')?[...node.querySelectorAll('tfoot tr')]:[])];
      const totalRows=[headers,...rows.map(r=>[...r.querySelectorAll('td')].map(c=>c.textContent.trim()))];
      for(let ri=0;ri<totalRows.length;ri++){
        const values=[...totalRows[ri]],rowNode=rows[ri-1];const head=ri===0;
        if(highlightTiers&&rowNode&&rowNode.querySelector('td')){const cell=rowNode.querySelector('td');values[0]=cell.dataset.original||values[0];if(rowNode.classList.contains('tier-both'))values[0]+=' · BASE / SIM';else if(rowNode.classList.contains('tier-base'))values[0]+=' · BASE';else if(rowNode.classList.contains('tier-sim'))values[0]+=' · SIM';}
        const maxLineCounts=values.map((v,i)=>wrap(v,cWidths[i]-12,fontSize,head,ri>0?3:2).length);
        const rowHeight=Math.max(rowMin,Math.max(...maxLineCounts)*Math.max(fontSize+2,12)+8);
        let background=head?'#eff3f8':(rowNode?.classList.contains('final')||rowNode?.classList.contains('daily-total-row')?pale:(striped&&ri%2===0?'#edf3fa':'#fff'));
        if(highlightTiers&&rowNode){if(rowNode.classList.contains('tier-both'))background='#def0e7';else if(rowNode.classList.contains('tier-sim'))background='#e3f3ec';else if(rowNode.classList.contains('tier-base'))background=pale;}
        rect(x,yy,w,rowHeight,background);let xx=x;
        for(let ci=0;ci<cols;ci++){
          const cw=cWidths[ci];const maxL=wrap(values[ci]||'',cw-12,fontSize,head,ri>0?3:2);
          for(let li=0;li<maxL.length;li++)write(maxL[li],xx+6,yy+6+li*Math.max(fontSize+2,12),fontSize,head||rowNode?.classList.contains('final'),head?'#52677d':'#273243');
          xx+=cw;
        }
        line(x,yy+rowHeight,w,'#e6ebf1');yy+=rowHeight;
      }
      return yy;
    }
    // PDF y PNG usan los mismos textos editables, sin rasterizar el PDF.
    const reportTexts=reportTextFor(activePage);
    const titleLines=wrap(reportTexts.title,720,25,true);
    for(const titleLine of titleLines){write(titleLine,margin,y,25,true,deep);y+=31;}
    write('WM / SAM’S  ·  MARC  ·  EJECUTIVOS',775,34,10,true,accent);
    y+=8;
    y=paragraph(reportTexts.subtitle,margin,y,content,16,21,accent)+6;
    y=paragraph(reportTexts.description,margin,y,content,12,18,deep)+8;
    const selection=activePage==='allrecords'?`${getAllRecordsFiltered().length} registros · Módulo ${allRecordsFilterValue('allRecordsModule')||'Todos'} · Ejecutivo ${allRecordsFilterValue('allRecordsExecutive')||'Todos'}`:activePage==='weekly'?`${weekLabel(weeklySelection().primary)} vs. ${weekLabel(weeklySelection().previous)} · Calculo manual desde google forms`:activePage==='accumulated'?`${accumulatedPeriodText()} · ${archive.reports.length} XLS guardados · Calculo manual desde google forms`:activePage==='daily'&&imported.data?`Día principal ${fmtDay(dailyDates().latest)} · Día comparado ${fmtDay(dailyDates().previous)} · Calculo manual desde google forms`:activePage==='team'&&imported.data?`Semana ${weekLabel(imported.week)} · ${filteredTeamEntries().length} ejecutivos · Calculo manual desde google forms`:importActive()?`Semana ${weekLabel(imported.week)} · ${imported.executive} · Objetivo ${state.base.goal}`:`Modo manual · Objetivo ${state.base.goal}`;
    y=paragraph(selection,margin,y,content,10,15)+6;
    line(margin,y,content,accent);y+=9;
    for(const section of sections){
      const key=section.dataset.reportSection;heading(key==='allrecords'?'Registros XLS filtrados':key==='weekly-variance'?'Variación de resultados':SECTION_LABELS[key]||(key==='daily'?'Por módulo y ejecutivo':key==='team'?'Comparativo por ejecutivo':'Resumen del equipo'));
      if(key==='weekly-variance'){
        y=tableAt(section.querySelector('.daily-report-table'),margin,y,content,{fontSize:11,rowMin:29,widths:[2.8,1,1,1],striped:true})+9;
      }
      else if(key==='daily'){
        const tables=[...section.querySelectorAll('.daily-report-table')];
        const gap=18,panelW=(content-gap)/2,startY=y;
        let endY=startY;
        for(let i=0;i<tables.length;i++){
          const x=margin+i*(panelW+gap);
          write(i===0?'POR MÓDULO':'POR EJECUTIVO',x,startY,13,true,deep);
          const end=tableAt(tables[i],x,startY+24,panelW,{fontSize:8,rowMin:25,widths:[2.45,1,1,1,1,1,1,1.1],striped:true});
          endY=Math.max(endY,end);
        }
        y=endY+8;
        const note=section.querySelector('.report-note');if(note)y=paragraph(note.textContent,margin,y,content,10,15)+5;
      }
      else if(key==='team-summary'){
        const cards=[...section.querySelectorAll('.report-kpi')],gap=12,cardW=(content-gap*2)/3;
        cards.forEach((card,i)=>{const x=margin+i*(cardW+gap);rect(x,y,cardW,88,pale,'#d8e3ec');write(card.querySelector('.rlabel')?.textContent||'',x+12,y+12,10,true,'#526477');write(fit(card.querySelector('.rval')?.textContent||'',cardW-25,20,true),x+12,y+36,20,true,deep);});y+=98;
      }
      else if(key==='team'){
        y=tableAt(section.querySelector('.team-export-table'),margin,y,content,{fontSize:9,rowMin:29,widths:[2.2,1.05,.5,.75,.55,.55,.65,.5,.45,.55,.43,.9,1.05],striped:true});
        const note=section.querySelector('.report-note');if(note){y+=8;y=paragraph(note.textContent,margin,y,content,10,15)+8;}
      }
      else if(key==='import'){
        const infos=[...section.querySelectorAll('.report-input-info p')];
        for(const item of infos)y=paragraph(item.textContent.trim(),margin+8,y+3,content-16,11,16)+2;
      }
      else if(key==='summary'){
        const cards=[...section.querySelectorAll('.report-kpi')],gap=12,cardW=(content-gap*2)/3;
        cards.forEach((card,i)=>{const x=margin+i*(cardW+gap);rect(x,y,cardW,108,pale,'#d8e3ec');write(card.querySelector('.rlabel')?.textContent||'',x+12,y+13,10,true,'#526477');write(fit(card.querySelector('.rval')?.textContent||'',cardW-26,22,true),x+12,y+36,22,true,deep);write(card.querySelector('.report-note')?.textContent||'',x+12,y+76,10,false,'#526477');});
        y+=114;
      }
      else if(key==='scenarios'){
        const cards=[...section.querySelectorAll('.report-scenario')],gap=14,cardW=(content-gap)/2;
        // Crece con los conceptos: no recortar ninguno en el PNG.
        const metricsCount=Math.max(...cards.map(c=>c.querySelectorAll('.small-rows span').length),0);
        const detailStart=76+Math.ceil(metricsCount/2)*23+7;
        const height=detailStart+30+5*22+65;
        cards.forEach((card,i)=>{
          const x=margin+i*(cardW+gap);rect(x,y,cardW,height,'#fff','#d8e3ec');
          write(card.querySelector('strong')?.textContent||'',x+12,y+12,13,true,deep);
          write(card.querySelector('.report-net')?.textContent||'',x+12,y+35,23,true,accent);
          const metrics=[...card.querySelectorAll('.small-rows span')];metrics.forEach((m,k)=>{
            const cx=x+12+(k%2)*((cardW-24)/2),cy=y+76+Math.floor(k/2)*23;
            write(fit(m.textContent.trim(),(cardW-34)/2,10),cx,cy,10,false,'#465c75');
          });
          const detail=card.querySelector('.commission-detail');
          if(detail){
            const dy=y+detailStart;
            line(x+12,dy,cardW-24);
            write('PAGO POR CONCEPTO · CANTIDAD × TARIFA',x+12,dy+9,10,true,deep);
            const entries=[...detail.querySelectorAll('.concept-pay-row')];
            entries.forEach((entry,j)=>{
              const yy=dy+30+j*22;
              const label=entry.querySelector('.concept-name')?.textContent||'';
              const amount=entry.querySelector('.concept-amount')?.textContent?.replace(/\s+/g,' ').trim()||'';
              write(label,x+12,yy,10,false,'#465c75');
              write(fit(amount,cardW-159,10,true),x+150,yy,10,true,deep);
            });
            line(x+12,dy+30+entries.length*22,cardW-24);
            const foot=detail.querySelector('.commission-detail-foot')?.textContent?.replace(/\s+/g,' ').trim()||'';
            paragraph(foot,x+12,dy+38+entries.length*22,cardW-24,10,14,'#53687c',2);
          }
        });y+=height+8;
      }
      else if(key==='tariff'){
        const table=section.querySelector('.rate-table');
        const notes=[...section.querySelectorAll('.notes li')];const tableWidth=665,gap=20,notesX=margin+tableWidth+gap;
        const startY=y;
        write('Importes por escalón',margin,y,12,true,deep);
        write('Reglas aplicadas',notesX,y,12,true,deep);y+=21;
        const tableEnd=tableAt(table,margin,y,tableWidth,{fontSize:10,rowMin:31,widths:[2.6,1,1,1,1,1],highlightTiers:true});
        let notesY=y;for(const note of notes){notesY=paragraph('• '+note.textContent.trim(),notesX,notesY,content-tableWidth-gap-4,10,14)+6;}
        y=Math.max(tableEnd,notesY)+8;
      }
      else if(key==='comparison'){
        const table=section.querySelector('#comparisonTable');
        y=tableAt(table,margin,y,content,{fontSize:11,rowMin:28,widths:[2.25,1,1,1]});
        const note=section.querySelector('.report-note');if(note){y+=8;y=paragraph(note.textContent,margin,y,content,10,14)+5;}
      }
      else if(key==='records'||key==='allrecords'){
        const note=section.querySelector('.report-note');if(note){y=paragraph(note.textContent,margin,y,content,10,15)+8;}
        const table=section.querySelector('.record-export-table');
        if(table){const heads=[...table.querySelectorAll('thead th')].map(z=>normalize(z.textContent));const weights=heads.map(h=>h==='INCIDENCIA'?8:h==='APP'?6:h==='CODIGO'?18:h==='VALIDACION DE PAGO'?14:h==='PRODUCTO'?13:h==='FECHA'?11:h==='ESTATUS'?11:h==='GARANTIZADA'?12:12);
          y=tableAt(table,margin,y,content,{fontSize:9,rowMin:26,widths:weights,striped:true});
        }
      }
      y+=6;
    }
    // Dejar un espacio significativo para separar el contenido de la nota de interpretación.
    y+=70;line(margin,y,content);y+=16;
    write('NOTA PARA LEER EL REPORTE',margin,y,10,true,deep);y+=20;
    y=paragraph(reportTexts.footer,margin,y,content,11,17,'#4b5c70')+19;
    write('Versión 2.2',margin+content-84,y,10,false,'#6b7b8e');y+=32;
    return Math.ceil(y);
  }
  function exportPng(){
    if(activePage==='visits')return window.VISITS?.exportPng();
    const button=el('exportImage'),before=button.textContent;
    button.disabled=true;button.textContent='Generando imagen…';
    try{
      buildReport();
      const probe=document.createElement('canvas').getContext('2d');const w=1120,h=paintReportCanvas(probe,false);
      // Escala máxima compatible sin superar límites habituales de tamaño/memoria de Canvas.
      const scale=Math.min(uiLayout.scale,24000/Math.max(w,h),Math.sqrt(90000000/(w*h)));
      if(scale<.75)throw Error('El reporte es demasiado extenso para generar un PNG legible. Reduce la cantidad de filas o utiliza Imprimir / PDF, que conserva el texto vectorial.');
      const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo iniciar el lienzo PNG.');
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      paintReportCanvas(ctx,true);
      canvas.toBlob(blob=>{
        button.disabled=false;button.textContent=before;
        if(blob)saveBlob(blob,activePage==='allrecords'?`registros_xls_${dateIso(new Date())}.png`:activePage==='weekly'?`comparativa_semanal_${weeklySelection().primary}_vs_${weeklySelection().previous}.png`:activePage==='accumulated'?`acumulado_general_${el('accumulatedFrom').value||'todo'}_${el('accumulatedTo').value||'todo'}.png`:activePage==='daily'?`comparativa_diaria_${imported.data?dailyDates().latest:'sin_datos'}.png`:activePage==='team'?`comisiones_equipo_${imported.week}.png`:`comisiones_simuladas_${importActive()?imported.week:'manual'}.png`);
        else alert('No se pudo guardar la imagen PNG. Prueba un periodo con menos folios.');
      },'image/png');
    }catch(err){button.disabled=false;button.textContent=before;alert('No se pudo generar el PNG: '+err.message);}
  }
  setUpLayout();
  el('exportImage').addEventListener('click',exportPng);
  window.addEventListener('beforeprint',buildReport);
  window.CALC_REPORT={buildReport,layout:uiLayout};

  initAllRecordsPage();initQualitySettings();
  restore();setForm('base');setForm('sim');render();initializeWeeklyDates();refreshAuthorizedPages();initArchive();
  window.APP_CLOUD?.registerRefresh(async()=>{
    if(!isAuthorized())return;
    archive.reports=await archiveGetAll();archive.temporaryMode=false;
    archiveSelectionRestore();loadFolioFlags();loadCommissionRates();
    refreshArchiveData(true);refreshAuthorizedPages();render();window.VISITS?.refreshSources();
  });
  // Solo lectura: acuse consulta TODOS los XLS del historial, sin aplicar filtros visuales.
  window.VISIT_SOURCE={
    isAuthorized,
    rows(){
      const data=combinedArchiveData(archive.reports);
      if(!data)return [];
      const indexes=Object.fromEntries(data.headers.map((h,i)=>[normalize(h),i]));
      const find=(row,terms)=>{
        const key=terms.find(t=>Object.hasOwn(indexes,normalize(t)));
        return key?String(row.raw[indexes[normalize(key)]]??'').trim():'';
      };
      return data.rows.map(r=>({...r,
        incidentFlag:imported.flags.has(r.uid||String(r.i)),
        appOff:imported.appDisabled.has(r.uid||String(r.i)),
        incidentValue:find(r,['Incidencia','Incidencias']),
        appValue:find(r,['Act APP','Activacion App','App Invex','Activacion','APP']),
        hasAppColumn:['Act APP','Activacion App','App Invex','Activacion','APP'].some(k=>Object.hasOwn(indexes,normalize(k)))
      }));
    },
    mondayOf, sundayOf, isoDate, isYes, isNo, normalize,
    getWeek(){return mondayOf(dateIso(new Date()));}
  };
  import('./visits.js').catch(err=>console.error('No se pudo abrir visitas:',err));
  window.addEventListener('focus',refreshAuthorizedPages);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAuthorizedPages();});
})();
