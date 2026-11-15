import {MODULE_HISTORY_KEY,MODULE_HISTORY_DEFAULTS,cleanModuleHistorySettings,moduleNames,analyzeModuleHistory,resolveModuleWeeklyGoal,moduleKey} from './module-history.js';
import {HISTORY_KEY,HISTORY_METRICS,HISTORY_DEFAULTS,cleanHistorySettings,analyzeHistory,overrideKey} from './individual-history.js';
import {historyReportHtml,historyPrintCss,historyPngPages} from './history-export.js';
import {createSupervisorStatement,supervisorStatementHtml,SUPERVISOR_STATEMENT_CSS,paintSupervisorStatement} from './supervisor-statement.js';
import {buildDailyWhatsAppReport} from './daily-whatsapp-report.js';
import { dateAsArchiveName, exportFriendlyText } from './import-date.js';
import {WEEKLY_ADMIN_DEFAULTS,WEEKLY_ADMIN_STORAGE,cleanWeeklyAdminSettings,preloadWeeklyAdminAssets,cachedWeeklyAdminAssets,renderWeeklyAdminSheets,weeklyAdminPageMarkup,weeklyAdminPrintCss} from './weekly-admin-report.js';

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
  const APP_VERSION='2.5.5';
const DYNAMIC_BONUS_KEY='wmSamsMeridaBonusDinamicaV245';
function loadDynamicBonus(){
  try{const config=JSON.parse(localStorage.getItem(DYNAMIC_BONUS_KEY)||'null');
    if(config&&validRateAmount(config.amount))return {amount:config.amount};
  }catch(_){}
  return {amount:0};
}
let dynamicBonusConfig=loadDynamicBonus();
function dynamicBonusAmount(){return validRateAmount(dynamicBonusConfig.amount)?dynamicBonusConfig.amount:0;}

  const el=id=>document.getElementById(id);
  const state={base:{...DEFAULT_BASE},sim:{...DEFAULT_SIM}};


// Importador compatible con XLS HTML (incluidos exportes de Forms), XLS binario,
// XLSX y archivos delimitados. Todos se normalizan al esquema histórico del Dashboard.
const XLS_REQUIRED_CORE=['Módulo','Ejecutivo','Fecha'];
const XLS_STANDARD_COLUMNS=['Módulo','Ejecutivo','Código','Programa Cero','Salud Dental','Fecha','Garantizada','Folio','Estatus'];
const XLS_LIMIT=30*1024*1024;
const XLS_HEADER_ALIASES={
  'Módulo':['Módulo','Modulo','Módulo de venta','Módulo de ventas','Nombre del módulo','Sucursal','Punto de venta'],
  'Ejecutivo':['Ejecutivo','Nombre ejecutivo','Nombre del ejecutivo','Ejecutivo de ventas','Promotor','Nombre promotor','Vendedor','Asesor','Colaborador'],
  'Código':['Código','Codigo','Código de barras','Codigo de barras','Código tarjeta','Codigo tarjeta','Código de tarjeta','Código de barras (Ref)','Codigo de barras (Ref)','Barcode'],
  'Programa Cero':['Programa Cero','Plan Cero','P0','Programa 0','Plan 0'],
  'Salud Dental':['Salud Dental','Plan Dental','Dental','P. Dental','PD'],
  'Fecha':['Fecha','Fecha de registro','Fecha del trámite','Fecha de trámite','Fecha de la solicitud','Fecha de solicitud','Fecha del registro','Fecha captura','Fecha de captura','Fecha de operación','Marca temporal','Timestamp'],
  'Garantizada':['Garantizada','Es garantizada','Venta garantizada','Tarjeta garantizada','¿Garantizada?','Garantía','Garantia'],
  'Folio':['Folio','Folio de solicitud','Folio de la solicitud','Folio del trámite','Folio de trámite','Folio solicitud','Número de folio','No. de folio','N° de folio','N.º de folio','ID de solicitud'],
  'Estatus':['Estatus','Estatus del trámite','Estado del trámite','Estado del proceso','Resultado del trámite','Resultado de trámite','Resultado del proceso','Status'],
  'Act APP':['Act APP','Activación APP','Activacion APP','APP Invex','Activación de APP','Activacion de APP','APP']
};
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase();
const XLS_CANONICAL_BY_ALIAS=new Map(Object.entries(XLS_HEADER_ALIASES).flatMap(([canonical,aliases])=>aliases.map(alias=>[normalize(alias),canonical])));
const isYes=v=>['SI','S','TRUE','VERDADERO','1','ACTIVADA','ACTIVADO'].includes(normalize(v));
const isNo=v=>['NO','N','FALSE','FALSO','0'].includes(normalize(v));
const isNonPayableStatus=v=>['CANCELADA','INCOMPLETA','RECHAZO'].includes(normalize(v));
let simDirty=false;
  const imported={data:null,week:'',executive:'',flags:new Set(),appDisabled:new Set(),dynamicBonuses:new Set(),recoverManual:0,sourceName:''};
const tableView={columns:[],visible:new Set(),showNoCode:false};
const TABLE_VIEW_STORAGE='wmSamsTablaVisualV18';
// Filtros operativos: sólo en esta pestaña; nunca se envían a PostgreSQL.
const TABLE_FILTERS_SESSION_PREFIX='wmSamsFiltrosLocalesV191:';
function tableFilterSessionKey(){return TABLE_FILTERS_SESSION_PREFIX+String(window.APP_CLOUD?.user?.id||'guest');}
const TABLE_FILTER_CONTROL_IDS=['tableScope','tableFilter','tablePaymentFilter','tableIncFilter','tableAppFilter','tableColumnFilter','tableColumnValue'];

const TEAM_GOALS_STORAGE='wmSamsComisionesMetasEquipoV1';
const TEAM_RECOVERY_STORAGE='wmSamsComisionesRecuperacionesEquipoV1';
const teamGoals=loadTeamStore(TEAM_GOALS_STORAGE),teamRecoveries=loadTeamStore(TEAM_RECOVERY_STORAGE);
// Las preferencias de navegación se sincronizan mediante dashboard_settings.
// Plantilla exclusiva de Logros semanales. Se sincroniza por cuenta, independiente de otros reportes.
function readWeeklyAdminPrefs(){try{return cleanWeeklyAdminSettings(JSON.parse(localStorage.getItem(WEEKLY_ADMIN_STORAGE)||'null'));}catch(_){return cleanWeeklyAdminSettings(null);}}
let weeklyAdminPrefs=readWeeklyAdminPrefs();
const PAGE_NAV_KEY='wmSamsNavOrderV250';
const DEFAULT_PAGE_ORDER=['daily','history','moduleHistory','individual','team','supervisor','incidents','allrecords','achievements','accumulated','weekly','visits'];
const GROUP_LABELS={analysis:'Análisis y resultados',commissions:'Comisiones',administration:'Administración',settings:'Configuración'};
const GROUP_DEFAULT=['analysis','commissions','administration','settings'];
const DEFAULT_GROUP_MAP={daily:'analysis',history:'analysis',moduleHistory:'analysis',team:'analysis',achievements:'analysis',accumulated:'analysis',weekly:'analysis',individual:'commissions',supervisor:'commissions',allrecords:'administration',incidents:'administration',visits:'administration'};
const PAGE_LABELS={daily:'Comparativa diaria',individual:'Calculadora individual',team:'Comparativo de ejecutivos',supervisor:'Calculadora supervisor',incidents:'Gestión de incidencias',allrecords:'Registros manuales',achievements:'Logros semanales',accumulated:'Acumulado general',weekly:'Comparativa semanal',visits:'Visitas de coordinación',history:'Histórico individual',moduleHistory:'Histórico por módulo'};
function validNavSettings(value){
  const arr=Array.isArray(value?.order)?value.order:[],unique=[...new Set(arr.filter(k=>DEFAULT_PAGE_ORDER.includes(k)))];
  const order=[...unique,...DEFAULT_PAGE_ORDER.filter(k=>!unique.includes(k))];
  const rawGroups=Array.isArray(value?.groupOrder)?value.groupOrder:[];
  const groupOrder=[...new Set(rawGroups.filter(g=>GROUP_DEFAULT.includes(g))),...GROUP_DEFAULT.filter(g=>!rawGroups.includes(g))];
  const groupBy={...DEFAULT_GROUP_MAP};
  if(value?.groupBy&&typeof value.groupBy==='object')for(const page of DEFAULT_PAGE_ORDER){
    if(['analysis','commissions','administration'].includes(value.groupBy[page]))groupBy[page]=value.groupBy[page];
  }
  return {order,groupOrder,groupBy,home:DEFAULT_PAGE_ORDER.includes(value?.home)?value.home:'daily'};
}
function loadNavSettings(){try{return validNavSettings(JSON.parse(localStorage.getItem(PAGE_NAV_KEY)||'null'));}catch(_){return validNavSettings(null);}}
let pageNavigation=loadNavSettings();
let activePage=pageNavigation.home;
let activeGroup=pageNavigation.groupBy[activePage]||'analysis';
let firstCloudNavigation=true;
function readHistoryPrefs(){try{return cleanHistorySettings(JSON.parse(localStorage.getItem(HISTORY_KEY)||'null'));}catch(_){return cleanHistorySettings(null);}}
let historyPrefs=readHistoryPrefs();
const historyView={page:1,pageSize:50,result:null};
function readModuleHistoryPrefs(){try{return cleanModuleHistorySettings(JSON.parse(localStorage.getItem(MODULE_HISTORY_KEY)||'null'));}catch(_){return cleanModuleHistorySettings(null);}}
let moduleHistoryPrefs=readModuleHistoryPrefs();
const moduleHistoryView={page:1,pageSize:50,result:null};
const incidentRecords=new Map();
const normalizeIncidentFolio=value=>String(value??'').trim().normalize('NFKC').toUpperCase().replace(/[\s\-]+/g,'');
const incidentFolioKey=row=>normalizeIncidentFolio(row?.folio);
let incidentLoaded=false, incidentLoading=false, incidentPageIndex=1;

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
  let m=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if(m)return `${m[1]}-${m[2]}-${m[3]}`;
  m=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:$|[T\s])/);
  if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  m=raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if(m)return `${m[1]}-${m[2]}-${m[3]}`;
  // Fecha de Excel cuando la hoja entrega el número de serie sin formato.
  if(/^\d{5}(?:\.\d+)?$/.test(raw)){
    const serial=Number(raw);
    if(serial>20000&&serial<100000)return new Date(Date.UTC(1899,11,30)+Math.floor(serial)*86400000).toISOString().slice(0,10);
  }
  return '';
}
const dateFromIso=iso=>{const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d,12);};
const dateIso=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
function mondayOf(iso){let d=dateFromIso(iso);const offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset);return dateIso(d);}
function sundayOf(iso){let d=dateFromIso(iso);d.setDate(d.getDate()+6);return dateIso(d);}
const weekLabel=iso=>`${fmtDay(iso)} — ${fmtDay(sundayOf(iso))}`;

function xlsCanonicalHeader(name){return XLS_CANONICAL_BY_ALIAS.get(normalize(name))||String(name??'').trim();}
function xlsHeaderScore(row){
  const values=row.map(v=>xlsCanonicalHeader(v));
  const available=new Set(values.filter(v=>XLS_STANDARD_COLUMNS.includes(v)));
  return XLS_REQUIRED_CORE.filter(k=>available.has(k)).length*10+available.size;
}
function xlsRowsToData(rows,sourceLabel='archivo'){
  // Nunca asumir que la primera fila o la hoja más grande contiene encabezados.
  const candidates=rows.slice(0,Math.min(rows.length,60));
  let headerAt=-1,best=-1;
  for(let i=0;i<candidates.length;i++){
    const score=xlsHeaderScore(candidates[i]);
    if(score>best){best=score;headerAt=i;}
  }
  if(headerAt<0||best<30){
    const found=(candidates[0]||[]).map(v=>String(v||'').trim()).filter(Boolean).slice(0,15);
    throw Error(`No se identificó una tabla de trámites en ${sourceLabel}. Se requieren Módulo, Ejecutivo y Fecha. ${found.length?'Primeras columnas encontradas: '+found.join(', '):'No se encontraron encabezados.'}`);
  }
  const original=rows[headerAt].map((v,i)=>String(v??'').trim().replace(/\s+/g,' ')||(i===0?'N.º':`Columna ${i+1}`));
  const headers=[],used=new Set();
  for(let i=0;i<original.length;i++){
    const candidate=xlsCanonicalHeader(original[i]);
    let header=candidate||`Columna ${i+1}`,suffix=2;
    while(used.has(normalize(header)))header=`${candidate} (${suffix++})`;
    headers.push(header);used.add(normalize(header));
  }
  const absent=XLS_REQUIRED_CORE.filter(k=>!used.has(normalize(k)));
  if(absent.length)throw Error('Faltan columnas principales: '+absent.join(', '));
  const optionalMissing=XLS_STANDARD_COLUMNS.filter(k=>!used.has(normalize(k)));
  for(const k of optionalMissing)headers.push(k);
  const idx=Object.fromEntries(headers.map((v,i)=>[normalize(v),i]));
  const parsed=[];
  for(const row of rows.slice(headerAt+1)){
    if(!Array.isArray(row))continue;
    const raw=headers.map((_,i)=>i<original.length?String(row[i]??'').trim():'');
    if(raw.every(v=>!v))continue;
    const get=k=>String(raw[idx[normalize(k)]]??'').trim();
    // Omitir encabezados repetidos cuando se exportan varias páginas en el mismo archivo.
    if(xlsHeaderScore(raw)>=best&&normalize(get('Ejecutivo'))==='EJECUTIVO')continue;
    const fecha=isoDate(get('Fecha'));
    const folio=get('Folio'),executive=get('Ejecutivo'),module=get('Módulo');
    if(!fecha&&!folio&&!executive&&!module)continue;
    // Resúmenes y totales no son trámites individuales.
    if(!executive&&!folio&&!get('Código'))continue;
    parsed.push({i:parsed.length,raw,folio,fecha,week:fecha?mondayOf(fecha):'',executive,module,
      code:get('Código'),status:get('Estatus'),guaranteed:get('Garantizada'),dental:get('Salud Dental'),p0:get('Programa Cero'),appField:get('Act APP')});
  }
  if(!parsed.length)throw Error('No se encontraron trámites individuales debajo de los encabezados.');
  if(!parsed.some(r=>r.week))throw Error('No se reconocieron fechas. Se admiten AAAA-MM-DD, DD/MM/AAAA y fechas numéricas de Excel.');
  const appColumn=headers.find(h=>xlsCanonicalHeader(h)==='Act APP')||null;
  return {headers,rows:parsed,appColumn,missingOptional:optionalMissing};
}
function parseXlsHtml(html){
  if(!/<table[\s>]/i.test(html))throw Error('Este archivo no contiene una tabla HTML de Excel.');
  const doc=new DOMParser().parseFromString(html,'text/html');
  const tables=[...doc.querySelectorAll('table')];
  if(!tables.length)throw Error('No se encontraron tablas en el archivo HTML.');
  const cells=tr=>[...tr.children].filter(e=>/^(TH|TD)$/i.test(e.tagName));
  const toRows=table=>[...table.querySelectorAll('tr')].map(tr=>cells(tr).map(c=>c.textContent.trim().replace(/\s+/g,' ')));
  // Preferir la tabla de trámites que tenga los encabezados correctos, no la más larga.
  const ranked=tables.map(t=>({rows:toRows(t)})).map(t=>({...t,score:Math.max(0,...t.rows.slice(0,60).map(xlsHeaderScore))}));
  ranked.sort((a,b)=>b.score-a.score||b.rows.length-a.rows.length);
  return xlsRowsToData(ranked[0].rows,'XLS HTML');
}
function excelTextFromBuffer(bytes){
  let enc='utf-8';
  if(bytes[0]===0xFF&&bytes[1]===0xFE)enc='utf-16le';
  else if(bytes[0]===0xFE&&bytes[1]===0xFF)enc='utf-16be';
  else if(bytes[0]===0&&bytes[1]===0x3C)enc='utf-16be';
  else if(bytes[0]===0x3C&&bytes[1]===0)enc='utf-16le';
  else{
    const sample=new TextDecoder('windows-1252').decode(bytes.slice(0,4096));
    const charset=sample.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1];
    if(charset)enc=/^(utf-8|utf8)$/i.test(charset)?'utf-8':/^(iso-8859-1|latin1|windows-1252)$/i.test(charset)?'windows-1252':charset;
    else try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);}
    catch(_){enc='windows-1252';}
  }
  try{return new TextDecoder(enc).decode(bytes);}catch(_){return new TextDecoder('utf-8').decode(bytes);}
}
function parseDelimitedXls(text){
  const lines=text.replace(/^\uFEFF/,'').replace(/^sep=[,;\t]\r?\n/i,'').trim();
  const samples=lines.split(/\r?\n/).slice(0,6);
  const delimiter=['\t',';',','].sort((a,b)=>samples.reduce((s,x)=>s+(x.split(b).length-1),0)-samples.reduce((s,x)=>s+(x.split(a).length-1),0))[0];
  const result=[];let row=[],val='',quoted=false;
  for(let i=0;i<lines.length;i++){
    const c=lines[i];
    if(c==='"'){
      if(quoted&&lines[i+1]==='"'){val+='"';i++;}
      else quoted=!quoted;
    }else if(c===delimiter&&!quoted){row.push(val);val='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&lines[i+1]==='\n')i++;row.push(val);result.push(row);row=[];val='';}
    else val+=c;
  }
  if(val||row.length){row.push(val);result.push(row);}
  return xlsRowsToData(result,'reporte delimitado');
}
async function loadExcelReader(){
  try{return await import('xlsx');}
  catch(_){throw Error('No se pudo cargar el lector de Excel binario. Comprueba que el nuevo despliegue instaló SheetJS (npm run build).');}
}
async function parseExcelFile(buffer,filename){
  const bytes=new Uint8Array(buffer),name=String(filename||'');
  const zipped=bytes[0]===0x50&&bytes[1]===0x4B;
  const ole=bytes[0]===0xD0&&bytes[1]===0xCF&&bytes[2]===0x11&&bytes[3]===0xE0;
  if(zipped||ole||/\.xlsx$/i.test(name)){
    // Lectura local en el navegador; no se transmite el contenido a ningún servicio.
    // Versión actualizada de SheetJS (la versión antigua de npm es vulnerable).
    const XLSX=await loadExcelReader();
    const wb=XLSX.read(bytes,{type:'array',cellDates:false,dense:true});
    const candidates=wb.SheetNames.map(sheetName=>({sheetName,rows:XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:'',raw:false,blankrows:false})}));
    candidates.sort((a,b)=>Math.max(0,...b.rows.slice(0,60).map(xlsHeaderScore))-Math.max(0,...a.rows.slice(0,60).map(xlsHeaderScore)));
    if(!candidates.length)throw Error('El libro Excel no contiene hojas.');
    return xlsRowsToData(candidates[0].rows,`hoja «${candidates[0].sheetName}»`);
  }
  const text=excelTextFromBuffer(bytes);
  if((/<Workbook[\s>]/i.test(text)||/xmlns:ss=/i.test(text))&&/<(?:\?xml|Workbook|Worksheet)/i.test(text)){
    const XLSX=await loadExcelReader();
    const wb=XLSX.read(bytes,{type:'array'});
    const candidates=wb.SheetNames.map(sheetName=>({sheetName,rows:XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:'',raw:false,blankrows:false})}));
    candidates.sort((a,b)=>Math.max(0,...b.rows.slice(0,60).map(xlsHeaderScore))-Math.max(0,...a.rows.slice(0,60).map(xlsHeaderScore)));
    if(!candidates.length)throw Error('El libro XML no contiene hojas.');
    return xlsRowsToData(candidates[0].rows,`hoja «${candidates[0].sheetName}»`);
  }
  if(/<table[\s>]/i.test(text))return parseXlsHtml(text);
  if(/\t|;|,/.test(text.slice(0,1500)))return parseDelimitedXls(text);
  throw Error('Formato no reconocido. Se admiten XLS HTML, XLS binario, XLSX, XML de Excel y CSV/TSV.');
}
function statusBox(text,kind=''){
  el('importStatus').className='import-status '+kind;
  el('importStatus').innerHTML=text;
}
function importActive(){return inputMode==='import'&&!!imported.data;}
function resetToManual(){
  inputMode='manual';document.body.classList.remove('import-mode');
  state.base.dynamicBonusCount=0;state.sim.dynamicBonusCount=0;
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
const selectedIncident=r=>{const key=incidentFolioKey(r);const permanent=key&&incidentRecords.get(key);return permanent?permanent.active===true:imported.flags.has(r.uid||String(r.i));};
const appEnabled=r=>hasCode(r)&&!imported.appDisabled.has(r.uid||String(r.i));
const dynamicBonusMarked=r=>imported.dynamicBonuses.has(r.uid||String(r.i));
const dynamicBonusPayable=r=>payable(r)&&dynamicBonusMarked(r);
const dynamicBonusRows=rows=>rows.filter(dynamicBonusPayable);
const dynamicBonusForRows=rows=>round(dynamicBonusRows(rows).length*dynamicBonusAmount());
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
  next.dynamicBonusCount=dynamicBonusRows(rows).length;
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
  else state.sim.dynamicBonusCount=next.dynamicBonusCount;
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
  imported.dynamicBonuses=new Set(Array.isArray(o.dynamicBonuses)?o.dynamicBonuses:[]);
  }catch(_){imported.flags=new Set();imported.appDisabled=new Set();imported.dynamicBonuses=new Set();}}
function saveFolioFlags(){if(archive.temporaryMode||!isAuthorized())return;try{localStorage.setItem(FOLIO_FLAGS_KEY,JSON.stringify({incidents:[...imported.flags],appsOff:[...imported.appDisabled],dynamicBonuses:[...imported.dynamicBonuses]}));}catch(_){}}

function incidentLocalDate(value){if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function incidentArray(){return [...incidentRecords.values()].sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));}
function incidentStatus(message,error=false){const node=el('incListStatus');if(node){node.textContent=message;node.style.color=error?'#b33939':'';}}
function updateIncidentMap(record){if(record?.folio_key)incidentRecords.set(record.folio_key,record);}
function incidentSaveData(row,active,comment='',resolved=false){return {folio:row.folio,module:row.module||'',executive:row.executive||'',active,resolved,comment};}
function syncIncidentDisplays(){
  if(importActive()){computeImportedBase();renderRecords();}
  renderTeam();renderDaily();renderAccumulated();renderWeekly();renderAllRecords();renderAchievements();renderSupervisorCalculator();
  renderIncidencePage();renderHistory();populateModuleFilters();renderModuleHistory();
}
// Migración conservadora de casillas previas. No borra marcas sin folio y nunca
// revive una incidencia desactivada explícitamente en la nueva base.
async function migrateLegacyIncidents(){
  if(!isAuthorized()||!imported.flags.size||!archive.reports.length)return;
  const historic=combinedArchiveData(archive.reports);
  if(!historic)return;
  const candidates=new Map();
  for(const row of historic.rows){
    if(!imported.flags.has(row.uid||String(row.i)))continue;
    const key=incidentFolioKey(row);if(!key)continue;
    if(!candidates.has(key))candidates.set(key,row);
  }
  let migrated=0;
  for(const [key,row] of candidates){
    try{
      if(!incidentRecords.has(key)){
        const record=await window.APP_CLOUD.putIncident(incidentSaveData(row,true,'Migrada desde las casillas de la versión anterior.'));
        updateIncidentMap(record);migrated++;
      }
      // Al quedar vinculada por folio, el indicador antiguo ya no es necesario.
      for(const entry of historic.rows)if(incidentFolioKey(entry)===key)imported.flags.delete(entry.uid||String(entry.i));
    }catch(error){console.warn('No se pudo migrar la incidencia '+key,error);}
  }
  if(migrated||candidates.size)saveFolioFlags();
}
async function refreshIncidents(migrate=false){
  if(!isAuthorized()){
    incidentLoaded=false;incidentRecords.clear();renderIncidencePage();return;
  }
  if(incidentLoading)return;
  incidentLoading=true;incidentStatus('Consultando incidencias permanentes…');
  try{
    const rows=await window.APP_CLOUD.listIncidents();
    incidentRecords.clear();rows.forEach(updateIncidentMap);incidentLoaded=true;
    if(migrate)await migrateLegacyIncidents();
    syncIncidentDisplays();
    incidentStatus(`${incidentRecords.size} folio(s) conservados en la base independiente de Netlify.`);
  }catch(error){incidentStatus('No se pudo consultar PostgreSQL: '+(error.message||error),true);}
  finally{incidentLoading=false;}
}
async function saveIncidentFromRow(uid,active){
  const row=imported.data?.rows.find(r=>(r.uid||String(r.i))===uid);
  if(!row)throw Error('No se encontró el registro en el XLS activo.');
  if(!incidentFolioKey(row))throw Error('Este registro no tiene folio. No puede guardarse en la base permanente.');
  if(!isAuthorized())throw Error('Inicia sesión para conservar incidencias aunque cambien los XLS.');
  const current=incidentRecords.get(incidentFolioKey(row));
  const result=await window.APP_CLOUD.putIncident(incidentSaveData(row,active,'',current?.resolved===true));
  updateIncidentMap(result);
  imported.flags.delete(uid);saveFolioFlags();syncIncidentDisplays();
  incidentStatus('Folio '+row.folio+' guardado en PostgreSQL.');
}
function renderIncidencePage(){
  const stats=el('incStats'),list=el('incRows');if(!stats||!list)return;
  const rows=incidentArray(),active=rows.filter(r=>r.active),pending=active.filter(r=>!r.resolved),resolved=rows.filter(r=>r.resolved);
  stats.innerHTML=[['Total histórico',rows.length],['Activas',active.length],['Activas sin resolver',pending.length],['Resueltas',resolved.length]].map(([name,count])=>`<div class="inc-stat"><span>${esc(name)}</span><b>${number.format(count)}</b></div>`).join('');
  const search=normalize(el('incSearch').value),filter=el('incFilter').value;
  const found=rows.filter(r=>{
    const matches=!search||normalize([r.folio,r.module,r.executive,...(Array.isArray(r.comments)?r.comments.map(c=>c.text):[])].join(' ')).includes(search);
    const status=filter==='all'||(filter==='active'&&r.active)||(filter==='pending'&&r.active&&!r.resolved)||(filter==='resolved'&&r.resolved)||(filter==='inactive'&&!r.active);
    return matches&&status;
  });
  const locked=!isAuthorized();el('incSave').disabled=locked;el('incRefresh').disabled=locked;
  const pages=Math.max(1,Math.ceil(found.length/50));incidentPageIndex=Math.min(Math.max(1,incidentPageIndex),pages);
  el('incPrev').disabled=incidentPageIndex===1;el('incNext').disabled=incidentPageIndex===pages;el('incPageText').textContent=`Página ${incidentPageIndex} de ${pages}`;
  const visible=found.slice((incidentPageIndex-1)*50,incidentPageIndex*50);
  list.innerHTML=visible.map(r=>{
    const comments=Array.isArray(r.comments)?r.comments:[];
    const commentsText=comments.slice(-2).map(c=>`<div>${esc(c.text||'')}<small class="inc-muted"> · ${esc(incidentLocalDate(c.createdAt))}</small></div>`).join('')||'<span class="inc-muted">Sin comentarios</span>';
    return `<tr><td><b>${esc(r.folio)}</b></td><td>${esc(r.module||'—')}<div class="inc-muted">${esc(r.executive||'—')}</div></td><td><span class="inc-tag ${r.active?'warn':'good'}">${r.active?'Activa':'Inactiva'}</span></td><td><span class="inc-tag ${r.resolved?'good':'warn'}">${r.resolved?'Resuelta':'Pendiente'}</span></td><td><div class="inc-comments">${commentsText}</div>${comments.length>2?`<small class="inc-muted">${comments.length} comentarios en total</small>`:''}</td><td>${esc(incidentLocalDate(r.updated_at))}</td><td><button type="button" data-edit-incident="${esc(r.folio_key)}">Ver / editar</button></td></tr>`;
  }).join('')||`<tr><td colspan="7">${locked?'Inicia sesión para consultar incidencias permanentes.':'No hay incidencias para estos filtros.'}</td></tr>`;
  if(!incidentLoading)incidentStatus(locked?'Inicia sesión para guardar y consultar incidencias en PostgreSQL.':`${found.length} de ${rows.length} registros mostrados. Los folios existen aunque no estén en ningún XLS.`);
}
function resetIncidentForm(){
  for(const id of ['incFolio','incModule','incExecutive','incComment'])el(id).value='';
  el('incFolio').readOnly=false;el('incActive').checked=true;el('incResolved').checked=false;el('incHistory').innerHTML='';
  el('incFormTitle').textContent='Registrar o actualizar incidencia';el('incFormStatus').textContent='Nueva incidencia por folio.';
}
function editIncident(key){
  const record=incidentRecords.get(key);if(!record)return;
  el('incFolio').value=record.folio;el('incFolio').readOnly=true;
  el('incModule').value=record.module||'';el('incExecutive').value=record.executive||'';
  el('incComment').value='';el('incActive').checked=record.active;el('incResolved').checked=record.resolved;
  el('incFormTitle').textContent='Editar folio '+record.folio;
  el('incFormStatus').textContent=`${(record.comments||[]).length} comentario(s) conservados · alta: ${incidentLocalDate(record.created_at)} · resuelta: ${incidentLocalDate(record.resolved_at)}. Escribe uno nuevo para agregarlo al historial.`;
  el('incHistory').innerHTML='<strong>Historial de comentarios</strong>'+((record.comments||[]).map(c=>`<div class="inc-history-item">${esc(incidentLocalDate(c.createdAt))}: ${esc(c.text||'')}</div>`).join('')||'<p>Sin comentarios anteriores.</p>');
  el('incFolio').scrollIntoView({behavior:'smooth',block:'center'});
}
async function saveIncidentForm(){
  const data={folio:el('incFolio').value.trim(),module:el('incModule').value.trim(),executive:el('incExecutive').value.trim(),comment:el('incComment').value.trim(),active:el('incActive').checked,resolved:el('incResolved').checked,replaceMetadata:true};
  const status=el('incFormStatus');
  if(!isAuthorized()){status.textContent='Inicia sesión para guardar incidencias en la nube.';return;}
  if(!data.folio){status.textContent='El folio es obligatorio.';return;}
  const btn=el('incSave');btn.disabled=true;status.textContent='Guardando en PostgreSQL…';
  try{updateIncidentMap(await window.APP_CLOUD.putIncident(data));status.textContent='Incidencia guardada y sincronizada. Reaparecerá si vuelves a importar este folio.';el('incComment').value='';syncIncidentDisplays();}
  catch(error){status.textContent='No se pudo guardar: '+(error.message||error);}
  finally{btn.disabled=false;}
}
function exportIncidentCsv(){
  const csv=[['Folio','Módulo','Ejecutivo','Incidencia activa','Resuelta','Fecha alta','Fecha resolución','Último cambio','Comentarios'],...incidentArray().map(r=>[r.folio,r.module,r.executive,r.active?'Sí':'No',r.resolved?'Sí':'No',r.created_at,r.resolved_at||'',r.updated_at,(r.comments||[]).map(c=>`${incidentLocalDate(c.createdAt)}: ${c.text}`).join(' | ')])];
  const val=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const blob=new Blob(['\ufeff'+csv.map(row=>row.map(val).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='incidencias_permanentes_'+dateIso(new Date())+'.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function initIncidences(){
  el('incSave').addEventListener('click',()=>{void saveIncidentForm();});
  el('incClear').addEventListener('click',resetIncidentForm);
  el('incRefresh').addEventListener('click',()=>{void refreshIncidents(false);});
  el('incSearch').addEventListener('input',()=>{incidentPageIndex=1;renderIncidencePage();});
  el('incFilter').addEventListener('change',()=>{incidentPageIndex=1;renderIncidencePage();});
  el('incPrev').addEventListener('click',()=>{incidentPageIndex--;renderIncidencePage();});
  el('incNext').addEventListener('click',()=>{incidentPageIndex++;renderIncidencePage();});
  el('incRows').addEventListener('click',event=>{const btn=event.target.closest('[data-edit-incident]');if(btn)editIncident(btn.dataset.editIncident);});
  el('incExportCsv').addEventListener('click',exportIncidentCsv);
  renderIncidencePage();
}
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
  achievementsView.page=1;achievementsView.chosen.clear();populateAchFilters();renderAchievements();
  populateSupervisorCalculatorFilters();renderSupervisorCalculator();renderSupervisorCalculatorSettings();
  populateHistoryFilters();renderHistory();populateModuleFilters();renderModuleHistory();
}
function chooseImportArchiveDate(fileName){
  const dialog=el('importDateDialog'),form=el('importDateForm'),date=el('importDateValue');
  const filename=el('importDateFile'),error=el('importDateError');
  filename.textContent='Archivo seleccionado: '+fileName;
  date.value='';error.textContent='';dialog.hidden=false;
  date.focus();
  return new Promise(resolve=>{
    const finish=value=>{
      dialog.hidden=true;
      form.removeEventListener('submit',submit);
      el('importDateCancel').removeEventListener('click',cancel);
      dialog.removeEventListener('keydown',escapeKey);
      resolve(value);
    };
    const submit=event=>{
      event.preventDefault();
      try{finish(dateAsArchiveName(date.value));}
      catch(e){error.textContent=e.message;date.focus();}
    };
    const cancel=()=>finish(null);
    const escapeKey=event=>{if(event.key==='Escape'){event.preventDefault();cancel();}};
    form.addEventListener('submit',submit);
    el('importDateCancel').addEventListener('click',cancel);
    dialog.addEventListener('keydown',escapeKey);
  });
}
async function importXlsFiles(files){
  if(!files?.length)return;
  // Sólo una sesión autorizada puede incorporar datos a IndexedDB.
  // Si no hay sesión, los XLS residen exclusivamente en memoria hasta cerrar o recargar.
  const persistent=isAuthorized();
  if(persistent&&!archive.ready){statusBox('No está disponible el historial en línea. No se pudo guardar el XLS.','error');return;}
  const target=persistent?archive.reports:archive.tempReports;
  let added=0,duplicated=0,cancelled=0,failures=[],warnings=[];
  for(const file of [...files]){
    try{
      if(!/\.(xls|xlsx|csv|tsv)$/i.test(file.name))throw Error('Selecciona un archivo XLS, XLSX, CSV o TSV.');
      if(file.size>XLS_LIMIT)throw Error('El archivo supera 30 MB.');
      const buffer=await file.arrayBuffer(),fingerprint=bytesFingerprint(new Uint8Array(buffer));
      if(target.some(r=>r.fingerprint===fingerprint)){duplicated++;continue;}
      const displayName=await chooseImportArchiveDate(file.name);
      if(displayName===null){cancelled++;continue;}
      const data=await parseExcelFile(buffer,file.name);
      if(data.missingOptional?.length)warnings.push(`${file.name}: faltan ${data.missingOptional.join(', ')} (se dejan vacíos)`);
      const record={id:'xls_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9),
        name:displayName,size:file.size,addedAt:Date.now(),fingerprint,
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
    if(persistent)await refreshIncidents(true);
  }
  const stateText=persistent?
    `${added} archivo(s) guardado(s) en el historial · ${duplicated} duplicado(s) omitido(s).`:
    `${added} archivo(s) temporal(es) · ${duplicated} duplicado(s) omitido(s). No se guardan: al recargar o cerrar esta página se perderán.`;
  const resultText=cancelled?stateText+` ${cancelled} archivo(s) cancelado(s) sin importar.`:stateText;
  if(failures.length)statusBox(esc(resultText+' Errores: '+failures.join('; ')),'error');
  else if(added||target.length)statusBox(esc(resultText)+` ${number.format(imported.data?.rows.length||0)} registros únicos en uso.`+(warnings.length?` <span class="muted">Avisos: ${esc(warnings.join('; '))}.</span>`:''),'success');
  el('xlsInput').value='';
}

async function initArchive(){
  archiveSelectionRestore();loadFolioFlags();
  try{
    archive.reports=await archiveGetAll();archive.reports.sort((a,b)=>a.addedAt-b.addedAt||a.id.localeCompare(b.id));archive.ready=isAuthorized();
    refreshArchiveData(true);window.VISITS?.refreshSources();
    await refreshIncidents(true);
  }catch(err){archive.ready=false;renderArchiveList();statusBox('No se pudo conectar al historial en línea: '+esc(err.message||String(err))+'. Comprueba la conexión, la sesión y Netlify Database.','error');}
  finally{if(!incidentLoaded)await refreshIncidents(true);}
}
// Columnas configurables y filtros visuales (no alteran las métricas por sí mismos).
function columnLabel(c){return c.key==='dynamicBonus'?'Bono adicional':c.key==='incident'?'Incidencia':c.key==='app'?'APP':c.key==='payment'?'Validación de pago':c.name;}
// Conversión estrictamente visual: los valores del XLS siguen intactos para las comisiones.
function displayXlsValue(raw){
  const value=String(raw??'').trim();
  if(normalize(value)==='S')return 'Colocado';
  if(normalize(value)==='N')return '';
  return value;
}
function getCellText(r,key){
  if(key==='dynamicBonus')return dynamicBonusMarked(r)?`Sí (${mx(dynamicBonusPayable(r)?dynamicBonusAmount():0)})`:'No';
  if(key==='incident')return selectedIncident(r)?'Sí':'No';
  if(key==='app')return appEnabled(r)?'Sí':'No';
  if(key==='payment')return payable(r)?'Comisionable':hasCode(r)?'No pagable':'No se completó la venta';
  if(key.startsWith('raw:'))return String(r.raw[Number(key.slice(4))]??'').trim();
  return '';
}
function initializeTableView(data){
  tableView.columns=[{key:'incident',name:'Incidencia'},{key:'app',name:'APP'},{key:'dynamicBonus',name:'Bono adicional'},...data.headers.map((h,i)=>({key:'raw:'+i,name:h||'Columna '+(i+1)})),{key:'payment',name:'Validación de pago'}];
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
  // Nueva columna obligatoria incluso cuando los ajustes visuales vienen de V2.4.5.
  tableView.visible.add('dynamicBonus');
  redrawColumnSettings();
}
function resetTableView(){
  const base=['FOLIO','GARANTIZADA','FECHA','PROGRAMA CERO','SALUD DENTAL'];
  tableView.visible=new Set(tableView.columns.filter(c=>['incident','app','dynamicBonus','payment'].includes(c.key)||(c.key.startsWith('raw:')&&base.includes(normalize(c.name)))).map(c=>c.key));
  tableView.showNoCode=true;
  for(const [id,value] of [['tableScope','filtered'],['tableFilter',''],['tablePaymentFilter',''],['tableIncFilter',''],['tableAppFilter',''],['tableColumnFilter',''],['tableColumnValue','']]){const elem=el(id);if(elem)elem.value=value;}
  if(el('showNoCode'))el('showNoCode').checked=true;
  redrawColumnSettings();
  refreshValueFilter();
}
function redrawColumnSettings(){
  if(!el('columnChooser'))return;
  el('columnChooser').innerHTML=tableView.columns.map(c=>`<label class="${tableView.visible.has(c.key)?'selected':''}"><input type="checkbox" data-column="${esc(c.key)}" ${tableView.visible.has(c.key)?'checked':''} ${c.key==='dynamicBonus'?'disabled':''}><span>${esc(columnLabel(c))}</span></label>`).join('');
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
  if(search)visual=visual.filter(r=>normalize([...r.raw,getCellText(r,'incident'),getCellText(r,'app'),getCellText(r,'dynamicBonus'),getCellText(r,'payment')].join(' ')).includes(search));
  // Orden estable: todos los registros con código primero; al final, los que no lo tienen.
  return [...visual].sort((a,b)=>Number(hasCode(b))-Number(hasCode(a)) || a.i-b.i);
}
function tableCellMarkup(r,c,forPrint=false){
  if(c.key==='dynamicBonus')return forPrint?esc(getCellText(r,c.key)):`<label class="dynamic-bonus-cell"><input type="checkbox" data-dynamic-bonus-id="${esc(r.uid||String(r.i))}" aria-label="Bono adicional en folio ${esc(r.folio)}" title="Bono por dinámica: ${mx(dynamicBonusAmount())} por venta válida" ${dynamicBonusMarked(r)?'checked':''} ${!payable(r)?'disabled':''}><span>${dynamicBonusMarked(r)&&payable(r)?mx(dynamicBonusAmount()):''}</span></label>`;
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
  const pinned=new Set(['incident','app','dynamicBonus']);
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
  if(q)rows=rows.filter(r=>normalize([...r.raw,getCellText(r,'incident'),getCellText(r,'app'),getCellText(r,'dynamicBonus'),getCellText(r,'payment')].join(' ')).includes(q));
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
  const id=target.dataset.incidentId??target.dataset.appId??target.dataset.dynamicBonusId;if(id===undefined)return false;
  if(target.matches('input[data-incident-id]')){target.disabled=true;void saveIncidentFromRow(id,target.checked).catch(error=>{alert(error.message||error);syncIncidentDisplays();});return true;}
  else if(target.matches('input[data-app-id]')){if(target.checked)imported.appDisabled.delete(id);else imported.appDisabled.add(id);}
  else if(target.matches('input[data-dynamic-bonus-id]')){if(target.checked)imported.dynamicBonuses.add(id);else imported.dynamicBonuses.delete(id);}
  else return false;
  saveFolioFlags();
  if(importActive()){computeImportedBase();renderRecords();renderTeam();}
  drawImportMeta(imported.sourceName||'Reporte.xls');
  renderAllRecords();
  renderAchievements();renderSupervisorCalculator();
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
  el('printContext').textContent=`Registros manuales · Semana ${weekLabel(imported.week)} · Ejecutivo: ${imported.executive} · Meta ${state.base.goal} · ${printRows.length} filas impresas`;
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


// V2.2.3 · Porcentajes requeridos y límites individuales de calidad.
// Cinco factores aportan al compuesto; "Calidad" evalúa el compuesto contra su
// propio porcentaje requerido, sin añadirse a su propio promedio (sin circularidad).
const QUALITY_STORAGE_V22='wmSamsMeridaQualityConfigV22';
const SUPERVISORS_STORAGE_V22='wmSamsMeridaSupervisorsV22';
const QUALITY_FACTORS=['completion','p0','dental','app','purchase'];
const QUALITY_RULE_KEYS=[...QUALITY_FACTORS,'quality'];
const QUALITY_FACTOR_LABELS={completion:'Cumplimiento',p0:'Plan Cero',dental:'Plan Dental',app:'Activación por APP',purchase:'Primera compra (P0 o Dental)',quality:'Calidad'};
const QUALITY_DEFAULTS={execWeeklyGoal:10,
  targets:{completion:100,p0:30,dental:95,app:90,purchase:90,quality:90},
  minima:{completion:60,p0:60,dental:60,app:60,purchase:60,quality:0},
  maxima:{completion:null,p0:null,dental:100,app:100,purchase:100,quality:100},
  weights:{completion:20,p0:20,dental:20,app:20,purchase:20},modules:{},minimumRuleVersion:1};
function storedJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function validQualityNumber(value,{positive=false}={}){return typeof value==='number'&&Number.isFinite(value)&&(positive?value>0:value>=0)&&value<=100000;}
function cleanQualityConfig(saved){
  const result=structuredClone(QUALITY_DEFAULTS);
  if(!saved||typeof saved!=='object'||Array.isArray(saved))return result;
  // Configuraciones antiguas guardaban ceros por defecto: migrarlos a 60%.
  // Desde esta revisión un 0 guardado expresamente se respeta (mínimo editable).
  const previousZeroDefaults=saved.minimumRuleVersion!==1;
  if(validQualityNumber(Number(saved.execWeeklyGoal),{positive:true}))result.execWeeklyGoal=Number(saved.execWeeklyGoal);
  for(const kind of ['targets','minima','maxima','weights'])for(const key of (kind==='weights'?QUALITY_FACTORS:QUALITY_RULE_KEYS)){
    const original=saved[kind]?.[key];
    if(original===undefined)continue;
    if(kind==='maxima'&&(original===null||original==='')){result.maxima[key]=null;continue;}
    const val=Number(original);
    if(kind==='minima'&&key!=='quality'&&previousZeroDefaults&&val===0)continue;
    if(validQualityNumber(val,{positive:kind==='targets'}))result[kind][key]=val;
  }
  // Conserva ponderaciones antiguas únicamente para compatibilidad de datos:
  // no participan en Calidad Total ni en Alcance Global.
  if(saved.weights?.dental===undefined&&saved.weights&&typeof saved.weights==='object')result.weights.dental=25;
  if(saved.modules&&typeof saved.modules==='object'&&!Array.isArray(saved.modules))for(const [module,opts] of Object.entries(saved.modules)){
    if(!module||!opts||typeof opts!=='object'||Array.isArray(opts))continue;
    const item={weeklySales:0,weeklyRecords:0,targets:{},minima:{},maxima:{},weights:{}};
    for(const k of ['weeklySales','weeklyRecords'])if(validQualityNumber(Number(opts[k])))item[k]=Number(opts[k]);
    for(const kind of ['targets','minima','maxima','weights'])for(const key of (kind==='weights'?QUALITY_FACTORS:QUALITY_RULE_KEYS)){
      const original=opts[kind]?.[key];
      if(original===undefined||original==='')continue;
      if(kind==='maxima'&&original===null){item.maxima[key]=null;continue;}
      const val=Number(original);
      if(kind==='minima'&&key!=='quality'&&previousZeroDefaults&&val===0)continue;
      if(validQualityNumber(val,{positive:kind==='targets'}))item[kind][key]=val;
    }
    result.modules[module]=item;
  }
  return result;
}
let qualityConfig=cleanQualityConfig(storedJson(QUALITY_STORAGE_V22));
let supervisorConfig=storedJson(SUPERVISORS_STORAGE_V22)||{};
if(!supervisorConfig||typeof supervisorConfig!=='object'||Array.isArray(supervisorConfig))supervisorConfig={};
function saveQualityConfig(){localStorage.setItem(QUALITY_STORAGE_V22,JSON.stringify(qualityConfig));renderQualityPages();}
function saveSupervisorConfig(){localStorage.setItem(SUPERVISORS_STORAGE_V22,JSON.stringify(supervisorConfig));renderQualityPages();populateSupervisorCalculatorFilters();renderSupervisorCalculator();renderSupervisorCalculatorSettings();}
function moduleQualityOptions(module){return qualityConfig.modules[module]||{weeklySales:0,weeklyRecords:0,targets:{},minima:{},maxima:{},weights:{}};}
function qualityRule(key,module,groupBy){
  const cfg=groupBy==='module'?moduleQualityOptions(module):null;
  const own=kind=>cfg&&Object.prototype.hasOwnProperty.call(cfg[kind]||{},key)?cfg[kind][key]:qualityConfig[kind][key];
  return {required:own('targets'),minimum:own('minima'),maximum:own('maxima')};
}
function qualityTarget(key,module,groupBy){return qualityRule(key,module,groupBy).required;}
function qualityMetricFactor(actual,target,{minimum=0,maximum=null}={}){
  if(!Number.isFinite(actual)||!Number.isFinite(target)||target<=0)return null;
  const normalized=Math.max(0,(actual/target)*100);
  if(normalized<minimum)return 0;
  return maximum===null?normalized:Math.min(maximum,normalized);
}
// V2.4.3: cuatro calidades, Calidad Total topada y Alcance Global sin tope.
const GLOBAL_FOUR_FACTORS=['completion','purchase','p0','app'];
function correctedGlobalQuality(factors){
  const values=GLOBAL_FOUR_FACTORS.map(k=>factors[k]);
  if(!values.every(Number.isFinite))return {composite:null,global:null};
  const composite=Math.min(100,values.reduce((sum,v)=>sum+v,0)/4);
  return {composite,global:(values.reduce((sum,v)=>sum+v,0)+composite)/5};
}
function qualityPercentText(value){return Number.isFinite(value)?pct(value):'—';}
function countQualityRows(rows){
  const salesRows=rows.filter(r=>hasCode(r));
  const regular=salesRows.filter(r=>isNo(r.guaranteed));
  const purchase=salesRows.filter(r=>isYes(r.p0)||isYes(r.dental)).length;
  const p0=regular.filter(r=>isYes(r.p0)).length;
  const apps=salesRows.filter(appEnabled).length;
  const dental=salesRows.filter(r=>isYes(r.dental)).length;
  return {sales:salesRows.length,regular:regular.length,purchase,p0,apps,dental};
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
  if(!rows.length)return {goal:0,actual:{},factors:{},composite:null,global:null,counters};
  const goal=goalOverride!==null?goalOverride:qualityWeeklyGoal(rows,name,groupBy,granularity);
  const actual={completion:goal>0?100*counters.sales/goal:0,
    p0:counters.regular>0?100*counters.p0/counters.regular:0,
    dental:counters.sales>0?100*counters.dental/counters.sales:0,
    app:counters.sales>0?100*counters.apps/counters.sales:0,
    purchase:counters.sales>0?100*counters.purchase/counters.sales:0};
  const factors={};
  for(const key of QUALITY_FACTORS){
    const rule=qualityRule(key,name,groupBy);
    const value=qualityMetricFactor(actual[key],rule.required,{minimum:rule.minimum,maximum:(key==='completion'||key==='p0'?null:rule.maximum)})??0;
    factors[key]=key==='purchase'||key==='app'?Math.min(100,value):value;
  }
  const {composite,global}=correctedGlobalQuality(factors);
  factors.quality=composite;actual.quality=composite;
  return {goal,actual,factors,composite,global,counters};
}

// V2.5.3: histórico individual sobre todos los XLS disponibles, sin snapshot adicional.
const HISTORY_LABEL_MAP=new Map(HISTORY_METRICS);
const historyFormat=n=>number.format(Number.isFinite(n)?n:0);
const historyMetricValue=(p,k)=>k==='quality'?pct(p.quality):k==='global'?pct(p.global):historyFormat(p[k]);
const historyWeekdays=['Domingos','Lunes','Martes','Miércoles','Jueves','Viernes','Sábados'];
function historyData(){
  const available=archive.temporaryMode?archive.tempReports:archive.reports;
  const data=available.length?combinedArchiveData(available):imported.data;
  return data?.rows||[];
}
function historyNames(){
  const names=new Map();
  for(const r of historyData()){const raw=String(r.executive||'').trim(),key=normalize(raw);if(raw&&!names.has(key))names.set(key,raw);}
  return [...names.values()].sort((a,b)=>a.localeCompare(b,'es'));
}
function populateHistoryFilters(){
  const selection=el('histExecutive');if(!selection)return;
  const existing=selection.value,names=historyNames();
  selection.innerHTML=names.length?names.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''):'<option value="">Sin colaboradores en los XLS</option>';
  const preserved=names.find(x=>normalize(x)===normalize(existing));selection.value=preserved||names[0]||'';
  const current=selection.value,module=el('histModule'),before=module.value;
  const modules=[...new Set(historyData().filter(r=>normalize(r.executive)===normalize(current)).map(r=>r.module).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  module.innerHTML='<option value="">Todos los módulos</option>'+modules.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');module.value=modules.includes(before)?before:'';
}
function historyCurrentRows(){
  const name=el('histExecutive').value;
  return historyData().filter(r=>normalize(r.executive)===normalize(name)).map(r=>({
    fecha:r.fecha,module:r.module,executive:r.executive,code:hasCode(r),
    regular:isNo(r.guaranteed),guaranteed:isYes(r.guaranteed),
    dental:isYes(r.dental),p0:isYes(r.p0),app:appEnabled(r)
  }));
}
function historyRules(){
  return Object.fromEntries(['completion','purchase','p0','app'].map(k=>[k,qualityRule(k,'','executive')]));
}
function historyAnalyze(){
 const name=el('histExecutive').value,kind=el('histPeriod').value;
 if(!name)return null;
 const source=historyData(),records=historyCurrentRows();
 const byWeek=new Map();
 for(const row of source)if(normalize(row.executive)===normalize(name)&&row.week&&!byWeek.has(row.week))byWeek.set(row.week,row.executive);
 // Si el nombre figura con distinta capitalización en un XLS antiguo,
 // recuperar la meta semanal guardada con la grafía de esa misma semana.
 const goalFor=(week)=>executiveGoal(week,byWeek.get(week)||name);
 return analyzeHistory({rows:records,name,kind,module:el('histModule').value,
    weekday:el('histWeekday').value,from:el('histFrom').value,to:el('histTo').value,
    weeklyGoal:goalFor,settings:historyPrefs,rules:historyRules()});
}
function historyWeekdayLabel(){const value=el('histWeekday').value;return value==='all'?'Todos los días con registros':historyWeekdays[Number(value)]||'Día seleccionado';}
function historyGoalForm(p){
 const name=el('histExecutive').value,kind=el('histPeriod').value;
 const key=overrideKey(name,kind,p.key),edited=Object.hasOwn(historyPrefs.periodGoals,key);
 return `<input type="number" data-history-goal="${esc(p.key)}" step="0.01" min="0.01" max="99999" value="${p.goal.toFixed(2)}" title="Objetivo ${edited?'personalizado':'automático'}; vacía el campo para restaurarlo" aria-label="Objetivo ${esc(p.key)}"><small>${edited?' Editado':' Auto'}</small>`;
}
function historyGraph(data){
 const host=el('histChart'),list=data.periods.slice(-24),key=historyPrefs.chartMetric;
 if(!list.length){host.textContent='No hay períodos con registros para dibujar la evolución.';return;}
 const values=list.map(p=>key==='quality'?p.quality:key==='global'?p.global:p[key]);
 const max=Math.max(1,...values),min=0,W=940,H=220,top=20,bottom=32,L=48,R=20;
 const x=i=>L+(list.length===1?(W-L-R)/2:i*(W-L-R)/(list.length-1)),y=v=>H-bottom-(v-min)/(max-min)*(H-top-bottom);
 const circles=values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${historyPrefs.color}"><title>${esc(list[i].key)} · ${historyMetricValue(list[i],key)}</title></circle>`).join('');
 const line=values.map((v,i)=>`${i?'L':'M'} ${x(i)} ${y(v)}`).join(' ');
 const labels=list.map((p,i)=>(i===0||i===list.length-1||i%Math.max(1,Math.ceil(list.length/9))===0)?`<text x="${x(i)}" y="${H-9}" text-anchor="middle" font-size="10" fill="#536b82">${esc(p.key.slice(5))}</text>`:'').join('');
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de ${esc(HISTORY_LABEL_MAP.get(key))} en los últimos ${list.length} períodos"><line x1="${L}" y1="${H-bottom}" x2="${W-R}" y2="${H-bottom}" stroke="#bdcddd"/><line x1="${L}" y1="${top}" x2="${L}" y2="${H-bottom}" stroke="#bdcddd"/><text x="4" y="${top+8}" font-size="11" fill="#536b82">${historyFormat(max)}</text><text x="23" y="${H-bottom}" font-size="11" fill="#536b82">0</text><path d="${line}" fill="none" stroke="${historyPrefs.color}" stroke-width="3" stroke-linejoin="round"/>${circles}${labels}</svg>`;
 el('histChartCaption').textContent=`${HISTORY_LABEL_MAP.get(key)} · ${list.length} períodos recientes${data.periods.length>24?' de '+data.periods.length:''}`;
}
function renderHistory(){
 if(!el('historyPage'))return;
 const results=historyAnalyze();historyView.result=results;
 const name=el('histExecutive').value,kind=el('histPeriod').value;
 const nameText={day:'día',week:'semana',month:'mes'}[kind];
 el('histNotice').textContent=!name?'No hay colaboradores; importa o sincroniza los XLS para consultar el histórico.':results?.periods.length?`${results.filteredRows} registros del colaborador · ${results.periods.length} períodos por ${nameText} · Datos históricos de todos los XLS disponibles; sin duplicados.`:'Sin registros disponibles para los filtros seleccionados.';
 for(const [node,visible] of [['histSummary',historyPrefs.showSummary],['histAverages',historyPrefs.showAverages],['histChartPanel',historyPrefs.showChart]])el(node).hidden=!visible;
 el('histTableHead').closest('.history-detail').hidden=!historyPrefs.showTable;
 if(!results)return;
 const summary=results.summary;
 el('histSummary').innerHTML=historyPrefs.metrics.map(k=>`<div class="history-kpi"><span>${esc(HISTORY_LABEL_MAP.get(k))}</span><b>${k==='quality'?(summary.periods?pct(summary.quality):'—'):k==='global'?(summary.periods?pct(summary.global):'—'):historyFormat(summary.counts[k])}</b><small>${k==='quality'||k==='global'?'Recalculado con objetivos':'Acumulado del período'}</small></div>`).join('')+`<div class="history-kpi"><span>Objetivo acumulado</span><b>${historyFormat(summary.goal)}</b><small>${summary.periods} períodos con datos</small></div>`;
 const averageCards=[['Promedio de '+historyWeekdayLabel(),results.sameWeekday],['Promedio por semana',results.weekly],['Promedio por mes',results.monthly]];
 const avrText=(c,k)=>!c.periods?'—':k==='quality'?pct(c.quality):k==='global'?pct(c.global):historyFormat(c.averages[k]);
 el('histAverages').innerHTML=averageCards.map(([label,c])=>`<article class="history-average"><strong>${esc(label)}</strong><b>${c.periods?historyFormat(c.averages.sales):'—'} ventas</b><small>${c.periods} períodos con registros · Calidad ${c.periods?pct(c.quality):'—'} · Global ${c.periods?pct(c.global):'—'}</small><div class="history-average-metrics">${historyPrefs.metrics.map(k=>`<div style="display:flex;justify-content:space-between;gap:7px;padding-top:5px;font-size:11px"><span>${esc(HISTORY_LABEL_MAP.get(k))}</span><b style="font-size:11px;margin:0">${avrText(c,k)}</b></div>`).join('')}</div></article>`).join('');
 if(historyPrefs.showChart)historyGraph(results);
 const metrics=historyPrefs.metrics,periods=[...results.periods].reverse();
 const pages=Math.max(1,Math.ceil(periods.length/historyView.pageSize));historyView.page=Math.max(1,Math.min(historyView.page,pages));
 const start=(historyView.page-1)*historyView.pageSize,visible=periods.slice(start,start+historyView.pageSize);
 el('histTableHead').innerHTML='<tr><th>'+({day:'Día',week:'Semana',month:'Mes'}[kind])+'</th>'+(historyPrefs.showGoalColumn?'<th>Objetivo editable</th>':'')+metrics.map(k=>`<th>${esc(HISTORY_LABEL_MAP.get(k))}</th>`).join('')+(historyPrefs.showModuleColumn?'<th>Módulos</th>':'')+'</tr>';
 const colspan=1+metrics.length+(historyPrefs.showGoalColumn?1:0)+(historyPrefs.showModuleColumn?1:0);
 el('histTableBody').innerHTML=visible.length?visible.map(p=>`<tr><td><b>${esc(p.key)}</b></td>${historyPrefs.showGoalColumn?`<td>${historyGoalForm(p)}</td>`:''}${metrics.map(k=>`<td>${historyMetricValue(p,k)}</td>`).join('')}${historyPrefs.showModuleColumn?`<td>${esc(p.modules.join(', '))}</td>`:''}</tr>`).join(''):`<tr><td colspan="${colspan}">Sin períodos con registros.</td></tr>`;
 el('histRowsSummary').textContent=`${results.periods.length} períodos · ${historyFormat(summary.counts.sales)} ventas · Objetivo ${historyFormat(summary.goal)}`;
 el('histPageStatus').textContent=`${historyView.page} de ${pages}`;
 el('histPrev').disabled=historyView.page<=1;el('histNext').disabled=historyView.page>=pages;
}
function historyReportModel(){
 if(!historyView.result?.periods.length||!el('histExecutive').value)throw Error('Selecciona un colaborador y un período con registros para exportar.');
 return {analysis:historyView.result,kind:el('histPeriod').value,name:el('histExecutive').value,
 from:el('histFrom').value,to:el('histTo').value,module:el('histModule').value,weekdayText:historyWeekdayLabel(),settings:{...historyPrefs,exportTitle:exportFriendlyText(historyPrefs.exportTitle),exportSubtitle:exportFriendlyText(historyPrefs.exportSubtitle),exportNote:exportFriendlyText(historyPrefs.exportNote)}};
}
function buildHistoryReport(){
 const model=historyReportModel(),orientation=model.settings.exportOrientation;
 const css=historyPrintCss.replace('letter portrait',`letter ${orientation}`);
 el('reportHost').innerHTML=`<style id="reportCss">${css}</style><div id="printPage" style="width:100%;max-width:194mm">${historyReportHtml(model)}</div>`;
 return el('printPage');
}
async function exportHistoryPng(){
 const button=el('exportImage'),old=button.textContent;button.disabled=true;button.textContent='Generando PNG histórico…';
 try{
  const model=historyReportModel(),pages=historyPngPages(model,{scale:Math.min(3,uiLayout.scale)});
  for(let i=0;i<pages.length;i++){
   const blob=await new Promise(resolve=>pages[i].toBlob(resolve,'image/png'));
   if(!blob)throw Error('No se pudo crear la imagen '+(i+1));
   saveBlob(blob,`historico_${model.kind}_${model.name.replace(/[^a-z0-9]+/gi,'_').slice(0,40)}_${i+1}_de_${pages.length}.png`);
  }
  el('histNotice').textContent=`Exportación PNG lista: ${pages.length} hoja(s).`;
 }catch(error){alert('Error al exportar histórico: '+error.message);}finally{button.disabled=false;button.textContent=old;}
}
function refreshHistorySettingsEditor(){
 if(!el('hsTitle'))return;
 for(const [id,value] of [['hsTitle',historyPrefs.exportTitle],['hsSubtitle',historyPrefs.exportSubtitle],['hsPeriod',historyPrefs.defaultPeriod],['hsWeekday',historyPrefs.defaultWeekday],['hsChartMetric',historyPrefs.chartMetric],['hsMultiplier',historyPrefs.goalMultiplier],['hsColor',historyPrefs.color],['hsRows',historyPrefs.rowsPerPage],['hsOrientation',historyPrefs.exportOrientation],['hsNote',historyPrefs.exportNote]])el(id).value=value;
 for(const [id,key] of [['hsShowChart','showChart'],['hsShowSummary','showSummary'],['hsShowAverages','showAverages'],['hsShowTable','showTable'],['hsShowGoal','showGoalColumn'],['hsShowModule','showModuleColumn']])el(id).checked=historyPrefs[key];
 el('hsMetricChoices').innerHTML=HISTORY_METRICS.map(([k,label])=>`<label><input type="checkbox" data-history-metric="${k}" ${historyPrefs.metrics.includes(k)?'checked':''}> ${esc(label)}</label>`).join('');
}
function commitHistorySettings(){
 const checked=[...el('hsMetricChoices').querySelectorAll('[data-history-metric]:checked')].map(x=>x.dataset.historyMetric);
 if(!checked.length){el('hsStatus').textContent='Selecciona al menos un indicador.';return false;}
 const next=cleanHistorySettings({...historyPrefs,metrics:checked,exportTitle:el('hsTitle').value,exportSubtitle:el('hsSubtitle').value,defaultPeriod:el('hsPeriod').value,
 defaultWeekday:el('hsWeekday').value,chartMetric:el('hsChartMetric').value,goalMultiplier:Number(el('hsMultiplier').value),color:el('hsColor').value,
 rowsPerPage:Number(el('hsRows').value),exportOrientation:el('hsOrientation').value,exportNote:el('hsNote').value,
 showChart:el('hsShowChart').checked,showSummary:el('hsShowSummary').checked,showAverages:el('hsShowAverages').checked,
 showTable:el('hsShowTable').checked,showGoalColumn:el('hsShowGoal').checked,showModuleColumn:el('hsShowModule').checked});
 const oldMultiplier=historyPrefs.goalMultiplier;historyPrefs=next;
 localStorage.setItem(HISTORY_KEY,JSON.stringify(historyPrefs));
 el('hsStatus').textContent='Configuración guardada'+(isAuthorized()?' · sincronización en cola.':'. En modo temporal no se sincroniza.');
 if(oldMultiplier!==next.goalMultiplier||historyView.result)renderHistory();
 return true;
}
function initHistory(){
 el('hsChartMetric').innerHTML=HISTORY_METRICS.map(([k,label])=>`<option value="${k}">${esc(label)}</option>`).join('');
 refreshHistorySettingsEditor();
 el('histPeriod').value=historyPrefs.defaultPeriod;
 el('histWeekday').value=historyPrefs.defaultWeekday==='today'?String(new Date().getDay()):historyPrefs.defaultWeekday;
 for(const id of ['histPeriod','histModule','histFrom','histTo','histWeekday'])el(id).addEventListener('change',()=>{historyView.page=1;renderHistory();});
 el('histExecutive').addEventListener('change',()=>{el('histModule').value='';populateHistoryFilters();historyView.page=1;renderHistory();});
 el('histResetFilters').addEventListener('click',()=>{el('histModule').value='';el('histFrom').value='';el('histTo').value='';el('histWeekday').value='all';historyView.page=1;renderHistory();});
 el('histOpenSettings').addEventListener('click',()=>{if(!el('settingsPanel').open)el('toggleSettings').click();el('settingsSectionsNav').querySelector('[data-settings-group="settingsHistoryV253"]')?.click();});
 el('histPrev').addEventListener('click',()=>{historyView.page--;renderHistory();});
 el('histNext').addEventListener('click',()=>{historyView.page++;renderHistory();});
 el('histTableBody').addEventListener('change',event=>{
  const input=event.target.closest('[data-history-goal]');if(!input)return;
  const raw=input.value.trim(),amount=Number(raw),key=overrideKey(el('histExecutive').value,el('histPeriod').value,input.dataset.historyGoal);
  if(raw&&(!Number.isFinite(amount)||amount<=0||amount>=100000)){alert('El objetivo debe ser mayor a cero y menor de 100,000, o estar vacío para usar el automático.');renderHistory();return;}
  if(raw)historyPrefs.periodGoals[key]=amount;else delete historyPrefs.periodGoals[key];
  localStorage.setItem(HISTORY_KEY,JSON.stringify(historyPrefs));renderHistory();
 });
 el('hsSave').addEventListener('click',commitHistorySettings);
 el('hsReset').addEventListener('click',()=>{const goals=historyPrefs.periodGoals;historyPrefs=cleanHistorySettings({...HISTORY_DEFAULTS,periodGoals:goals});refreshHistorySettingsEditor();commitHistorySettings();});
 el('hsClearGoals').addEventListener('click',()=>{if(!confirm('¿Restaurar todos los objetivos diarios, semanales y mensuales personalizados?'))return;historyPrefs.periodGoals={};localStorage.setItem(HISTORY_KEY,JSON.stringify(historyPrefs));el('hsStatus').textContent='Objetivos históricos personalizados restaurados.';renderHistory();});
 populateHistoryFilters();renderHistory();
}



// V2.5.4 · mismo motor histórico, ahora consolidado por módulo.
function populateModuleFilters(){
 const control=el('mhExecutive');if(!control)return;
 const before=control.value,modules=moduleNames(historyData());
 control.innerHTML=modules.length?modules.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join(''):'<option value="">Sin módulos en los XLS</option>';
 control.value=modules.find(m=>moduleKey(m)===moduleKey(before))||modules[0]||'';
}
function moduleHistoryRows(){
 return historyData().map(r=>({fecha:r.fecha,week:r.week,module:r.module,executive:r.executive,
   supervisor:supervisorRow(r),code:hasCode(r),regular:isNo(r.guaranteed),
   guaranteed:isYes(r.guaranteed),dental:isYes(r.dental),p0:isYes(r.p0),app:appEnabled(r)}));
}
function moduleHistoryAnalyze(){
 const module=el('mhExecutive').value;if(!module)return null;
 const rows=moduleHistoryRows(),raw=historyData();
 const actualName=moduleNames(raw).find(m=>moduleKey(m)===moduleKey(module))||module;
 const weeklyGoal=(week)=>resolveModuleWeeklyGoal({week,module:actualName,achievementGoals:achievementGoalStore,
   configuredGoal:moduleQualityOptions(actualName).weeklySales,
   supervisorGoal:supSettings.goals[actualName],rows:raw,getExecutiveGoal:executiveGoal,isSupervisor:supervisorRow});
 const rules=Object.fromEntries(['completion','purchase','p0','app'].map(k=>[k,qualityRule(k,actualName,'module')]));
 return analyzeModuleHistory({rows,module:actualName,kind:el('mhPeriod').value,weekday:el('mhWeekday').value,
   from:el('mhFrom').value,to:el('mhTo').value,weeklyGoal,
   includeSupervisors:moduleHistoryPrefs.includeSupervisors,settings:moduleHistoryPrefs,rules});
}
function moduleWeekdayLabel(){const value=el('mhWeekday').value;return value==='all'?'Todos los días con registros':historyWeekdays[Number(value)]||'Día seleccionado';}
function moduleGoalForm(p){
 const name=el('mhExecutive').value,kind=el('mhPeriod').value;
 const key=overrideKey(name,kind,p.key),edited=Object.hasOwn(moduleHistoryPrefs.periodGoals,key);
 return `<input type="number" data-module-goal="${esc(p.key)}" step="0.01" min="0.01" max="99999" value="${p.goal.toFixed(2)}" title="Objetivo ${edited?'personalizado':'automático'}; vacía el campo para restaurarlo" aria-label="Objetivo ${esc(p.key)}"><small>${edited?' Editado':' Auto'}</small>`;
}
function moduleGraph(data){
 const host=el('mhChart'),list=data.periods.slice(-24),key=moduleHistoryPrefs.chartMetric;
 if(!list.length){host.textContent='No hay períodos con registros para dibujar la evolución.';return;}
 const values=list.map(p=>key==='quality'?p.quality:key==='global'?p.global:p[key]);
 const max=Math.max(1,...values),min=0,W=940,H=220,top=20,bottom=32,L=48,R=20;
 const x=i=>L+(list.length===1?(W-L-R)/2:i*(W-L-R)/(list.length-1)),y=v=>H-bottom-(v-min)/(max-min)*(H-top-bottom);
 const circles=values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${moduleHistoryPrefs.color}"><title>${esc(list[i].key)} · ${historyMetricValue(list[i],key)}</title></circle>`).join('');
 const line=values.map((v,i)=>`${i?'L':'M'} ${x(i)} ${y(v)}`).join(' ');
 const labels=list.map((p,i)=>(i===0||i===list.length-1||i%Math.max(1,Math.ceil(list.length/9))===0)?`<text x="${x(i)}" y="${H-9}" text-anchor="middle" font-size="10" fill="#536b82">${esc(p.key.slice(5))}</text>`:'').join('');
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de ${esc(HISTORY_LABEL_MAP.get(key))} en los últimos ${list.length} períodos"><line x1="${L}" y1="${H-bottom}" x2="${W-R}" y2="${H-bottom}" stroke="#bdcddd"/><line x1="${L}" y1="${top}" x2="${L}" y2="${H-bottom}" stroke="#bdcddd"/><text x="4" y="${top+8}" font-size="11" fill="#536b82">${historyFormat(max)}</text><text x="23" y="${H-bottom}" font-size="11" fill="#536b82">0</text><path d="${line}" fill="none" stroke="${moduleHistoryPrefs.color}" stroke-width="3" stroke-linejoin="round"/>${circles}${labels}</svg>`;
 el('mhChartCaption').textContent=`${HISTORY_LABEL_MAP.get(key)} · ${list.length} períodos recientes${data.periods.length>24?' de '+data.periods.length:''}`;
}
function renderModuleHistory(){
 if(!el('moduleHistoryPage'))return;
 const results=moduleHistoryAnalyze();moduleHistoryView.result=results;
 const name=el('mhExecutive').value,kind=el('mhPeriod').value;
 const nameText={day:'día',week:'semana',month:'mes'}[kind];
 el('mhNotice').textContent=!name?'No hay módulos; importa o sincroniza los XLS para consultar el histórico.':results?.periods.length?`${results.filteredRows} registros del módulo · ${results.periods.length} períodos por ${nameText} · Datos históricos de todos los XLS disponibles; sin duplicados.`:'Sin registros disponibles para los filtros seleccionados.';
 if(results?.periods.some(p=>!p.goal))el('mhNotice').textContent+=' Hay períodos sin meta semanal registrada: configura sus objetivos para calcular correctamente Cumplimiento y Alcance Global.';
 for(const [node,visible] of [['mhSummary',moduleHistoryPrefs.showSummary],['mhAverages',moduleHistoryPrefs.showAverages],['mhChartPanel',moduleHistoryPrefs.showChart]])el(node).hidden=!visible;
 el('mhTableHead').closest('.history-detail').hidden=!moduleHistoryPrefs.showTable;
 if(!results)return;
 const summary=results.summary;
 el('mhSummary').innerHTML=moduleHistoryPrefs.metrics.map(k=>`<div class="history-kpi"><span>${esc(HISTORY_LABEL_MAP.get(k))}</span><b>${k==='quality'?(summary.periods?pct(summary.quality):'—'):k==='global'?(summary.periods?pct(summary.global):'—'):historyFormat(summary.counts[k])}</b><small>${k==='quality'||k==='global'?'Recalculado con objetivos':'Acumulado del período'}</small></div>`).join('')+`<div class="history-kpi"><span>Objetivo acumulado del módulo</span><b>${historyFormat(summary.goal)}</b><small>${summary.periods} períodos con datos</small></div>`;
 const averageCards=[['Promedio de '+moduleWeekdayLabel(),results.sameWeekday],['Promedio por semana',results.weekly],['Promedio por mes',results.monthly]];
 const avrText=(c,k)=>!c.periods?'—':k==='quality'?pct(c.quality):k==='global'?pct(c.global):historyFormat(c.averages[k]);
 el('mhAverages').innerHTML=averageCards.map(([label,c])=>`<article class="history-average"><strong>${esc(label)}</strong><b>${c.periods?historyFormat(c.averages.sales):'—'} ventas</b><small>${c.periods} períodos con registros · Calidad ${c.periods?pct(c.quality):'—'} · Global ${c.periods?pct(c.global):'—'}</small><div class="history-average-metrics">${moduleHistoryPrefs.metrics.map(k=>`<div style="display:flex;justify-content:space-between;gap:7px;padding-top:5px;font-size:11px"><span>${esc(HISTORY_LABEL_MAP.get(k))}</span><b style="font-size:11px;margin:0">${avrText(c,k)}</b></div>`).join('')}</div></article>`).join('');
 if(moduleHistoryPrefs.showChart)moduleGraph(results);
 const metrics=moduleHistoryPrefs.metrics,periods=[...results.periods].reverse();
 const pages=Math.max(1,Math.ceil(periods.length/moduleHistoryView.pageSize));moduleHistoryView.page=Math.max(1,Math.min(moduleHistoryView.page,pages));
 const start=(moduleHistoryView.page-1)*moduleHistoryView.pageSize,visible=periods.slice(start,start+moduleHistoryView.pageSize);
 el('mhTableHead').innerHTML='<tr><th>'+({day:'Día',week:'Semana',month:'Mes'}[kind])+'</th>'+(moduleHistoryPrefs.showGoalColumn?'<th>Objetivo editable</th>':'')+metrics.map(k=>`<th>${esc(HISTORY_LABEL_MAP.get(k))}</th>`).join('')+(moduleHistoryPrefs.showModuleColumn?'<th>Ejecutivos</th>':'')+'</tr>';
 const colspan=1+metrics.length+(moduleHistoryPrefs.showGoalColumn?1:0)+(moduleHistoryPrefs.showModuleColumn?1:0);
 el('mhTableBody').innerHTML=visible.length?visible.map(p=>`<tr><td><b>${esc(p.key)}</b></td>${moduleHistoryPrefs.showGoalColumn?`<td>${moduleGoalForm(p)}</td>`:''}${metrics.map(k=>`<td>${historyMetricValue(p,k)}</td>`).join('')}${moduleHistoryPrefs.showModuleColumn?`<td>${esc(p.executives.join(', '))}</td>`:''}</tr>`).join(''):`<tr><td colspan="${colspan}">Sin períodos con registros.</td></tr>`;
 el('mhRowsSummary').textContent=`${results.periods.length} períodos · ${historyFormat(summary.counts.sales)} ventas · Objetivo ${historyFormat(summary.goal)}`;
 el('mhPageStatus').textContent=`${moduleHistoryView.page} de ${pages}`;
 el('mhPrev').disabled=moduleHistoryView.page<=1;el('mhNext').disabled=moduleHistoryView.page>=pages;
}
function moduleReportModel(){
 if(!moduleHistoryView.result?.periods.length||!el('mhExecutive').value)throw Error('Selecciona un módulo y un período con registros para exportar.');
 return {analysis:moduleHistoryView.result,kind:el('mhPeriod').value,name:el('mhExecutive').value,
 from:el('mhFrom').value,to:el('mhTo').value,module:el('mhExecutive').value,weekdayText:moduleWeekdayLabel(),settings:{...moduleHistoryPrefs,exportTitle:exportFriendlyText(moduleHistoryPrefs.exportTitle),exportSubtitle:exportFriendlyText(moduleHistoryPrefs.exportSubtitle),exportNote:exportFriendlyText(moduleHistoryPrefs.exportNote)},subjectLabel:'MÓDULO',attributeLabel:'Ejecutivos',attributeKey:'executives'};
}
function buildModuleHistoryReport(){
 const model=moduleReportModel(),orientation=model.settings.exportOrientation;
 const css=historyPrintCss.replace('letter portrait',`letter ${orientation}`);
 el('reportHost').innerHTML=`<style id="reportCss">${css}</style><div id="printPage" style="width:100%;max-width:${orientation==='landscape'?'263':'194'}mm">${historyReportHtml(model)}</div>`;
 return el('printPage');
}
async function exportModuleHistoryPng(){
 const button=el('exportImage'),old=button.textContent;button.disabled=true;button.textContent='Generando PNG histórico…';
 try{
  const model=moduleReportModel(),pages=historyPngPages(model,{scale:Math.min(3,uiLayout.scale)});
  for(let i=0;i<pages.length;i++){
   const blob=await new Promise(resolve=>pages[i].toBlob(resolve,'image/png'));
   if(!blob)throw Error('No se pudo crear la imagen '+(i+1));
   saveBlob(blob,`historico_modulo_${model.kind}_${model.name.replace(/[^a-z0-9]+/gi,'_').slice(0,40)}_${i+1}_de_${pages.length}.png`);
  }
  el('mhNotice').textContent=`Exportación PNG lista: ${pages.length} hoja(s).`;
 }catch(error){alert('Error al exportar histórico: '+error.message);}finally{button.disabled=false;button.textContent=old;}
}
function refreshModuleHistorySettingsEditor(){
 if(!el('msTitle'))return;
 for(const [id,value] of [['msTitle',moduleHistoryPrefs.exportTitle],['msSubtitle',moduleHistoryPrefs.exportSubtitle],['msPeriod',moduleHistoryPrefs.defaultPeriod],['msWeekday',moduleHistoryPrefs.defaultWeekday],['msChartMetric',moduleHistoryPrefs.chartMetric],['msMultiplier',moduleHistoryPrefs.goalMultiplier],['msColor',moduleHistoryPrefs.color],['msRows',moduleHistoryPrefs.rowsPerPage],['msOrientation',moduleHistoryPrefs.exportOrientation],['msNote',moduleHistoryPrefs.exportNote]])el(id).value=value;
 for(const [id,key] of [['msShowChart','showChart'],['msShowSummary','showSummary'],['msShowAverages','showAverages'],['msShowTable','showTable'],['msShowGoal','showGoalColumn'],['msShowModule','showModuleColumn']])el(id).checked=moduleHistoryPrefs[key];
 el('msMetricChoices').innerHTML=HISTORY_METRICS.map(([k,label])=>`<label><input type="checkbox" data-module-metric="${k}" ${moduleHistoryPrefs.metrics.includes(k)?'checked':''}> ${esc(label)}</label>`).join('');
}
function commitModuleHistorySettings(){
 const checked=[...el('msMetricChoices').querySelectorAll('[data-module-metric]:checked')].map(x=>x.dataset.moduleMetric);
 if(!checked.length){el('msStatus').textContent='Selecciona al menos un indicador.';return false;}
 const next=cleanModuleHistorySettings({...moduleHistoryPrefs,metrics:checked,exportTitle:el('msTitle').value,exportSubtitle:el('msSubtitle').value,defaultPeriod:el('msPeriod').value,
 defaultWeekday:el('msWeekday').value,chartMetric:el('msChartMetric').value,goalMultiplier:Number(el('msMultiplier').value),color:el('msColor').value,
 rowsPerPage:Number(el('msRows').value),exportOrientation:el('msOrientation').value,exportNote:el('msNote').value,
 showChart:el('msShowChart').checked,showSummary:el('msShowSummary').checked,showAverages:el('msShowAverages').checked,
 showTable:el('msShowTable').checked,showGoalColumn:el('msShowGoal').checked,showModuleColumn:el('msShowModule').checked});
 const oldMultiplier=moduleHistoryPrefs.goalMultiplier;moduleHistoryPrefs=next;
 localStorage.setItem(MODULE_HISTORY_KEY,JSON.stringify(moduleHistoryPrefs));
 el('msStatus').textContent='Configuración guardada'+(isAuthorized()?' · sincronización en cola.':'. En modo temporal no se sincroniza.');
 if(oldMultiplier!==next.goalMultiplier||moduleHistoryView.result)renderModuleHistory();
 return true;
}
function initModuleHistory(){
 el('msChartMetric').innerHTML=HISTORY_METRICS.map(([k,label])=>`<option value="${k}">${esc(label)}</option>`).join('');
 refreshModuleHistorySettingsEditor();
 el('mhPeriod').value=moduleHistoryPrefs.defaultPeriod;
 el('mhWeekday').value=moduleHistoryPrefs.defaultWeekday==='today'?String(new Date().getDay()):moduleHistoryPrefs.defaultWeekday;
 for(const id of ['mhPeriod','mhFrom','mhTo','mhWeekday'])el(id).addEventListener('change',()=>{moduleHistoryView.page=1;renderModuleHistory();});
 el('mhExecutive').addEventListener('change',()=>{populateModuleFilters();moduleHistoryView.page=1;renderModuleHistory();});
 el('mhResetFilters').addEventListener('click',()=>{el('mhFrom').value='';el('mhTo').value='';el('mhWeekday').value='all';moduleHistoryView.page=1;renderModuleHistory();});
 el('mhOpenSettings').addEventListener('click',()=>{if(!el('settingsPanel').open)el('toggleSettings').click();el('settingsSectionsNav').querySelector('[data-settings-group="settingsModuleHistoryV254"]')?.click();});
 el('mhPrev').addEventListener('click',()=>{moduleHistoryView.page--;renderModuleHistory();});
 el('mhNext').addEventListener('click',()=>{moduleHistoryView.page++;renderModuleHistory();});
 el('mhTableBody').addEventListener('change',event=>{
  const input=event.target.closest('[data-module-goal]');if(!input)return;
  const raw=input.value.trim(),amount=Number(raw),key=overrideKey(el('mhExecutive').value,el('mhPeriod').value,input.dataset.moduleGoal);
  if(raw&&(!Number.isFinite(amount)||amount<=0||amount>=100000)){alert('El objetivo debe ser mayor a cero y menor de 100,000, o estar vacío para usar el automático.');renderModuleHistory();return;}
  if(raw)moduleHistoryPrefs.periodGoals[key]=amount;else delete moduleHistoryPrefs.periodGoals[key];
  localStorage.setItem(MODULE_HISTORY_KEY,JSON.stringify(moduleHistoryPrefs));renderModuleHistory();
 });
 el('mhIncludeSupervisors').value=moduleHistoryPrefs.includeSupervisors?'yes':'no';
 el('mhIncludeSupervisors').addEventListener('change',()=>{moduleHistoryPrefs.includeSupervisors=el('mhIncludeSupervisors').value==='yes';localStorage.setItem(MODULE_HISTORY_KEY,JSON.stringify(moduleHistoryPrefs));moduleHistoryView.page=1;renderModuleHistory();});
 el('msSave').addEventListener('click',commitModuleHistorySettings);
 el('msReset').addEventListener('click',()=>{const goals=moduleHistoryPrefs.periodGoals;moduleHistoryPrefs=cleanModuleHistorySettings({...MODULE_HISTORY_DEFAULTS,periodGoals:goals});refreshModuleHistorySettingsEditor();commitModuleHistorySettings();});
 el('msClearGoals').addEventListener('click',()=>{if(!confirm('¿Restaurar todos los objetivos diarios, semanales y mensuales personalizados?'))return;moduleHistoryPrefs.periodGoals={};localStorage.setItem(MODULE_HISTORY_KEY,JSON.stringify(moduleHistoryPrefs));el('msStatus').textContent='Objetivos históricos personalizados restaurados.';renderModuleHistory();});
 populateModuleFilters();renderModuleHistory();
}


// V2.3.3 · Metas mixtas: Registros y Ventas en unidades; Dental, P0, Compra y APP en porcentaje requerido.
const achievementsView={page:1,pageSize:100,chosen:new Set()};
const ACH_GOALS_STORAGE='wmSamsMeridaAchievementGoalsV232';
const ACH_GOAL_INPUTS={records:'achGoalRecords',sales:'achGoalSales',dental:'achGoalDental',p0:'achGoalP0',purchase:'achGoalPurchase',app:'achGoalApp'};
const ACH_QUANTITY_GOALS=new Set(['records','sales']);
const ACH_PERCENT_GOALS=new Set(['dental','p0','purchase','app']);
const ACH_GOAL_LABELS={records:'Registros · cantidad',sales:'Ventas (Cumplimiento) · cantidad',dental:'Plan Dental · % requerido',p0:'Plan Cero · % requerido',purchase:'Primera compra · % requerido',app:'Activaciones APP · % requerido'};
const achGoalText=(key,value)=>value===null||value===undefined?'Sin objetivo':ACH_PERCENT_GOALS.has(key)?`${number.format(value)}%`:number.format(value);
const ACH_PRINT_DEFAULTS={filters:false,goals:true,percentages:true,quantities:true,records:true};
const ACH_PRINT_STORAGE='wmSamsMeridaAchievementPrintLocalV232';
let achievementGoalStore=storedJson(ACH_GOALS_STORAGE)||{};
if(!achievementGoalStore||typeof achievementGoalStore!=='object'||Array.isArray(achievementGoalStore))achievementGoalStore={};
// La V2.3.3 guardaba seis objetivos como CANTIDADES. Convertir esos valores a
// porcentajes sin permiso daría resultados incorrectos. Conservar sólo las metas
// de Registros y Ventas. Las cuatro nuevas metas porcentuales empiezan vacías.
// La migración permanece en memoria hasta pulsar Guardar, sin consumir créditos.
if(achievementGoalStore.__schema!==2){
  achievementGoalStore=Object.fromEntries(Object.entries(achievementGoalStore).filter(([k])=>k.startsWith('[')).map(([scope,old])=>[
    scope,{records:old?.records??null,sales:old?.sales??null,dental:null,p0:null,purchase:null,app:null}
  ]));
  achievementGoalStore.__schema=2;
}
let achievementPrintStore=storedJson(ACH_PRINT_STORAGE)||{};
const achGoalScope=()=>JSON.stringify([achValue('achWeek'),achValue('achModule')||'*']);
function achParseGoal(input,key){
  if(input===null||input===undefined||String(input).trim()==='')return null;
  const v=Number(String(input).trim());
  if(!Number.isFinite(v)||v<=0)return null;
  if(ACH_QUANTITY_GOALS.has(key))return Number.isSafeInteger(v)&&v<=1000000?v:null;
  return v<=100?v:null;
}
function achReadGoals(){
  const obj=achievementGoalStore[achGoalScope()]||{};
  return Object.fromEntries(Object.keys(ACH_GOAL_INPUTS).map(k=>[k,achParseGoal(obj[k],k)]));
}
function achShowGoals(){
  const goals=achReadGoals();
  for(const [key,id] of Object.entries(ACH_GOAL_INPUTS))el(id).value=goals[key]??'';
  el('achGoalsStatus').textContent=Object.values(goals).some(Number.isFinite)?'Objetivos cargados para esta semana y módulo.':'Sin objetivos guardados para esta semana y módulo.';
}
function achDraftGoals(){
  const goals={};
  for(const [key,id] of Object.entries(ACH_GOAL_INPUTS))goals[key]=achParseGoal(el(id).value,key);
  achievementGoalStore[achGoalScope()]=goals;
  el('achGoalsStatus').textContent='Cambios locales. Pulsa Guardar objetivos para conservarlos.';
  renderAchievements();
}
function achSaveGoals(){
  const invalid=Object.entries(ACH_GOAL_INPUTS).filter(([key,id])=>el(id).value.trim()&&!achParseGoal(el(id).value,key));
  if(invalid.length){el('achGoalsStatus').textContent='Registros y Ventas requieren enteros positivos; los demás, porcentajes mayores a 0 y hasta 100.';el(invalid[0][1]).focus();return;}
  achievementGoalStore[achGoalScope()]=Object.fromEntries(Object.entries(ACH_GOAL_INPUTS).map(([k,id])=>[k,achParseGoal(el(id).value,k)]));
  localStorage.setItem(ACH_GOALS_STORAGE,JSON.stringify(achievementGoalStore)); // Una escritura al confirmar, sincronizable con login.
  el('achGoalsStatus').textContent=window.APP_CLOUD?.user?'Guardado localmente · sincronización pendiente de confirmar en la nube.':'Objetivos guardados en este dispositivo.';
  renderAchievements();
}
function achPrintEnabled(key){return el('achievementsPage')?.querySelector(`[data-ach-print="${key}"]`)?.checked!==false;}
function achPrintFilters(){
  const pairs=[['Semana',achValue('achWeek')?weekLabel(achValue('achWeek')):'Sin seleccionar'],['Módulo',achValue('achModule')||'Todos los módulos'],['Supervisores',el('achIncludeSupervisors').checked?'Incluidos':'Excluidos'],['Búsqueda',achValue('achSearch')||'Ninguna']];
  for(const id of ACH_ADDITIONAL){const node=el(id);if(node?.value)pairs.push([node.closest('.field')?.querySelector('label')?.textContent||id,node.selectedOptions?.[0]?.textContent||node.value]);}
  if(achValue('achColumn')&&achievementsView.chosen.size)pairs.push(['Columna de registros manuales',`${el('achColumn').selectedOptions[0].textContent}: ${[...achievementsView.chosen].join(', ')}`]);
  return pairs;
}
function achTargetQuality(alcancePct,requeridoPct,key,module){
  const rule=qualityRule(key,module,'module');
  return requeridoPct?qualityMetricFactor(alcancePct,requeridoPct,{minimum:rule.minimum,maximum:(key==='completion'||key==='p0'?null:rule.maximum)}):null;
}

const ACH_ADDITIONAL=['achExec','achPayment','achIncident','achApp','achCode','achGuarantee','achP0','achDental'];
const achValue=id=>el(id)?.value||'';
function achBaseRows(){
  const week=achValue('achWeek'),module=achValue('achModule');
  return (imported.data?.rows||[]).filter(r=>(!week||r.week===week)&&(!module||r.module===module));
}
function achRowsForMetric(){
  const rows=achBaseRows();
  return el('achIncludeSupervisors')?.checked===false?rows.filter(r=>!supervisorRow(r)):rows;
}
function achRecordTarget(rows){
  // Sólo mostrar un objetivo de trámites si el usuario lo configuró en Ajustes 10.
  const mods=[...new Set(rows.map(r=>r.module).filter(Boolean))];
  if(!mods.length)return null;
  const goals=mods.map(module=>moduleQualityOptions(module).weeklyRecords);
  return goals.every(goal=>goal>0)?goals.reduce((a,b)=>a+b,0):null;
}
// V2.3.4: las mismas filas filtradas que aparecen en la tabla alimentan los indicadores.
// La paginación solo divide la visualización: no cambia los totales de los filtros.
// Las filas con incidencia permanecen visibles para auditoría, pero jamás suman
// a registros, ventas ni a los numeradores o denominadores de calidad.
function achData(){
  const filteredRows=achFilteredRecords();
  const incidents=filteredRows.filter(selectedIncident);
  const rows=filteredRows.filter(r=>!selectedIncident(r));
  const module=achValue('achModule');
  const counters=countQualityRows(rows),goals=achReadGoals(),records=rows.length;
  const c=counters;
  const values={records,completion:c.sales,dental:c.dental,p0:c.p0,purchase:c.purchase,app:c.apps};
  // Bases exclusivamente de los folios visibles por filtro que NO tienen incidencia.
  const bases={dental:c.sales,p0:c.regular,purchase:c.sales,app:c.sales};
  const alcances={
    records:goals.records?100*records/goals.records:null,
    completion:goals.sales?100*c.sales/goals.sales:null,
    dental:bases.dental?100*c.dental/bases.dental:0,
    p0:bases.p0?100*c.p0/bases.p0:0,
    purchase:bases.purchase?100*c.purchase/bases.purchase:0,
    app:bases.app?100*c.apps/bases.app:0
  };
  const factors={};
  for(const key of QUALITY_FACTORS){
    const required=goals[key==='completion'?'sales':key];
    const value=achTargetQuality(alcances[key],key==='completion'?100:required,key,module);
    factors[key]=value===null?null:(key==='purchase'||key==='app'?Math.min(100,value):value);
  }
  const {composite,global}=correctedGlobalQuality(factors);
  const qualityRequirement=qualityRule('quality',module,'module');
  const globalReach=global;
  // 'Alcance' es siempre el porcentaje grande; el resultado sujeto a mínimos y
  // máximos configurables se expone abajo como 'Calidad' en cada tarjeta.
  const factorIndicator=(name,key)=>({name,reach:alcances[key],quality:factors[key],
    required:goals[key]??null});
  const metricList=[
    {name:'Registros',reach:alcances.records,quality:alcances.records,required:goals.records},
    {name:'Cumplimiento',reach:alcances.completion,quality:factors.completion,required:goals.sales},
    factorIndicator('Plan Dental','dental'),
    factorIndicator('Plan Cero','p0'),
    factorIndicator('Activación APP','app'),
    factorIndicator('Primera compra','purchase'),
    {name:'Calidad',reach:composite,quality:composite,required:qualityRequirement.required},
    {name:'Alcance global',reach:globalReach,quality:global,required:qualityRequirement.required,global:true}
  ];
  const counts=[
    ['Registros',records],['Ventas con código',c.sales],['Regulares',c.regular],['Garantizadas',rows.filter(r=>hasCode(r)&&isYes(r.guaranteed)).length],
    ['Plan Dental',c.dental],['Plan Cero',c.p0],['Primera compra',c.purchase],['APP activadas',c.apps],
    ['Incidencias excluidas (informativo)',incidents.length],['Ejecutivos',new Set(rows.map(r=>r.executive).filter(Boolean)).size]
  ];
  const q={goal:goals.sales,actual:values,counters,factors,composite,global};
  return {rows,filteredRows,incidents,q,counts,metricList,goals,recordGoal:goals.records,alcances,bases};
}

function populateAchFilters(){
  const data=imported.data,rows=data?.rows||[];
  const weeks=[...new Set(rows.map(r=>r.week).filter(Boolean))].sort().reverse(),select=el('achWeek');
  if(!select)return;
  const previous=select.value;
  select.innerHTML=weeks.length?weeks.map(w=>`<option value="${esc(w)}">${esc(weekLabel(w))}</option>`).join(''):'<option value="">Sin semanas disponibles</option>';
  select.value=weeks.includes(previous)?previous:(weeks.includes(imported.week)?imported.week:weeks[0]||'');
  select.disabled=!weeks.length;
  const modules=[...new Set(rows.filter(r=>r.week===select.value).map(r=>r.module).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  setAllRecordsOptions(el('achModule'),modules,'Todos los módulos');
  const all=achBaseRows(),executives=[...new Set(all.map(r=>r.executive).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  setAllRecordsOptions(el('achExec'),executives,'Todos los ejecutivos');
  const col=el('achColumn'),oldCol=col.value;
  col.innerHTML='<option value="">Sin columna adicional</option>'+tableView.columns.filter(c=>c.key.startsWith('raw:')).map(c=>`<option value="${esc(c.key)}">${esc(c.name)}</option>`).join('');
  col.value=tableView.columns.some(c=>c.key===oldCol)?oldCol:'';
  if(oldCol!==col.value)achievementsView.chosen.clear();
  populateAchValueChoices();
}
function populateAchValueChoices(){
  const key=achValue('achColumn'),host=el('achValues');if(!host)return;
  const search=normalize(achValue('achValueSearch'));
  el('achValueSearch').disabled=!key;
  if(!key){host.textContent='Selecciona una columna para elegir varios valores.';return;}
  const values=[...new Set(achBaseRows().map(r=>getCellText(r,key)))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  const shown=values.filter(v=>!search||normalize(v||'(vacío)').includes(search)).slice(0,150);
  host.innerHTML=shown.map(v=>`<label><input type="checkbox" data-ach-value="${esc(v)}" ${achievementsView.chosen.has(v)?'checked':''}>${esc(displayXlsValue(v)||'(vacío)')}</label>`).join('')||'<span class="muted">Sin valores</span>';
}
function achFilteredRecords(){
  let rows=achRowsForMetric();
  const exec=achValue('achExec'),pay=achValue('achPayment'),inc=achValue('achIncident'),app=achValue('achApp');
  const code=achValue('achCode'),guar=achValue('achGuarantee'),p0=achValue('achP0'),dental=achValue('achDental');
  const search=normalize(achValue('achSearch')),col=achValue('achColumn');
  if(exec)rows=rows.filter(r=>r.executive===exec);
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
  if(col&&achievementsView.chosen.size)rows=rows.filter(r=>achievementsView.chosen.has(getCellText(r,col)));
  if(search)rows=rows.filter(r=>normalize([...r.raw,getCellText(r,'incident'),getCellText(r,'app'),getCellText(r,'payment')].join(' ')).includes(search));
  // Conservar la preferencia solicitada: fechas recientes primero, incluso en PDF/PNG/CSV.
  return [...rows].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')||b.i-a.i);
}
function renderAchievements(){
  if(!el('achPercentages'))return;
  const {rows,filteredRows,incidents,metricList,counts,goals,q,alcances}=achData();
  const baseRows=achBaseRows(),supervisorRows=baseRows.filter(supervisorRow).length;
  const includeSupervisors=el('achIncludeSupervisors').checked;
  const note=el('achSupervisorStatus');
  if(!Object.values(supervisorConfig).some(names=>Array.isArray(names)&&names.length))
    note.textContent='Asigna supervisores en Ajustes → 11 para activar esta exclusión.';
  else if(!supervisorRows)note.textContent='No hay trámites de supervisores identificados para esta semana y módulo.';
  else note.textContent=includeSupervisors?`${number.format(supervisorRows)} trámites de supervisores incluidos en indicadores y registros.`:`${number.format(supervisorRows)} trámites de supervisores excluidos de indicadores y registros.`;
  el('achPeriod').textContent=rows.length?`${weekLabel(achValue('achWeek'))} · ${achValue('achModule')||'Todos los módulos'}`:imported.data?`${achValue('achWeek')?weekLabel(achValue('achWeek')):'Sin semana'} · ${achValue('achModule')||'Todos los módulos'}`:'Sin datos XLS';
  el('achPercentages').innerHTML=metricList.map(m=>`<div class="achievements-kpi ${m.global?'achievements-global':''}"><span>${esc(m.name)}</span><strong>${qualityPercentText(m.reach)}</strong><small>Calidad: <b>${qualityPercentText(m.quality)}</b></small></div>`).join('');
  const goalForCount={Registros:'records','Ventas con código':'sales','Plan Dental':'dental','Plan Cero':'p0','Primera compra':'purchase','APP activadas':'app'};
  el('achQuantities').innerHTML=counts.map(([label,value])=>{
    const key=goalForCount[label],target=goals[key];
    let extra='';
    if(ACH_QUANTITY_GOALS.has(key)&&target)extra=`Meta: ${achGoalText(key,target)} · ${qualityPercentText(100*value/target)} logrado`;
    else if(ACH_PERCENT_GOALS.has(key))extra=`Alcance: ${qualityPercentText(alcances[key])}${target?` · requerido: ${achGoalText(key,target)}`:''}`;
    return `<div class="achievements-count"><span>${esc(label)}</span><strong>${number.format(value)}</strong>${extra?`<small>${esc(extra)}</small>`:''}</div>`;
  }).join('');
  const records=filteredRows,cols=allRecordsColumns();
  const pages=Math.max(1,Math.ceil(records.length/achievementsView.pageSize));
  achievementsView.page=Math.min(Math.max(1,achievementsView.page),pages);
  const start=(achievementsView.page-1)*achievementsView.pageSize,visible=records.slice(start,start+achievementsView.pageSize);
  el('achRecordsHead').innerHTML='<tr>'+cols.map(c=>`<th>${esc(columnLabel(c))}</th>`).join('')+'</tr>';
  el('achRecordsBody').innerHTML=visible.length?visible.map(r=>`<tr class="${selectedIncident(r)?'flagged':''}">${cols.map(c=>`<td>${tableCellMarkup(r,c)}</td>`).join('')}</tr>`).join(''):`<tr><td class="achievements-empty" colspan="${Math.max(1,cols.length)}">${imported.data?'No hay registros que coincidan con los filtros.':'Carga un XLS para consultar los registros.'}</td></tr>`;
  el('achRecordSummary').innerHTML=`<span>${number.format(records.length)} folios filtrados en la tabla</span><span>${number.format(rows.length)} contados en indicadores</span><span>${rows.filter(hasCode).length} ventas válidas</span><span>${number.format(incidents.length)} incidencias excluidas</span>`;
  el('achRecordStatus').textContent=records.length?`Filas ${start+1}–${Math.min(start+achievementsView.pageSize,records.length)} de ${records.length} · Página ${achievementsView.page}/${pages}`:'0 registros';
  el('achPrev').disabled=achievementsView.page<=1;el('achNext').disabled=achievementsView.page>=pages;
  const filtered=ACH_ADDITIONAL.filter(id=>achValue(id)).length+(achValue('achColumn')&&achievementsView.chosen.size?1:0);
  el('achFilterBadge').textContent=filtered?`· ${filtered} filtros activos`:'· Contraídos por defecto';
}
function initAchievements(){
  el('achWeek').addEventListener('change',()=>{el('achModule').value='';populateAchFilters();achShowGoals();achievementsView.page=1;renderAchievements();});
  el('achModule').addEventListener('change',()=>{populateAchFilters();achShowGoals();achievementsView.page=1;renderAchievements();});
  for(const id of ACH_ADDITIONAL)el(id).addEventListener('change',()=>{achievementsView.page=1;renderAchievements();});
  el('achIncludeSupervisors').addEventListener('change',()=>{achievementsView.page=1;renderAchievements();});
  el('achSearch').addEventListener('input',()=>{achievementsView.page=1;renderAchievements();});
  el('achColumn').addEventListener('change',()=>{achievementsView.chosen.clear();el('achValueSearch').value='';populateAchValueChoices();achievementsView.page=1;renderAchievements();});
  el('achValueSearch').addEventListener('input',populateAchValueChoices);
  el('achValues').addEventListener('change',e=>{if(!e.target.matches('input[data-ach-value]'))return;const v=e.target.dataset.achValue;e.target.checked?achievementsView.chosen.add(v):achievementsView.chosen.delete(v);achievementsView.page=1;renderAchievements();});
  el('achReset').addEventListener('click',()=>{for(const id of ACH_ADDITIONAL)el(id).value='';el('achColumn').value='';el('achValueSearch').value='';achievementsView.chosen.clear();achievementsView.page=1;populateAchValueChoices();renderAchievements();});
  el('achPageSize').addEventListener('change',()=>{achievementsView.pageSize=Number(el('achPageSize').value)||100;achievementsView.page=1;renderAchievements();});
  el('achPrev').addEventListener('click',()=>{achievementsView.page--;renderAchievements();});
  el('achNext').addEventListener('click',()=>{achievementsView.page++;renderAchievements();});
  el('achRecordsTable').addEventListener('change',e=>applyFolioValidationChange(e.target));
  for(const id of Object.values(ACH_GOAL_INPUTS))el(id).addEventListener('input',achDraftGoals);
  el('achSaveGoals').addEventListener('click',achSaveGoals);
  el('achievementsPage').querySelectorAll('[data-ach-print]').forEach(input=>{
    const key=input.dataset.achPrint;
    input.checked=Object.prototype.hasOwnProperty.call(achievementPrintStore,key)?!!achievementPrintStore[key]:ACH_PRINT_DEFAULTS[key];
    input.addEventListener('click',event=>event.stopPropagation());
    input.closest('label').addEventListener('click',event=>event.stopPropagation());
    input.addEventListener('change',()=>{achievementPrintStore[key]=input.checked;localStorage.setItem(ACH_PRINT_STORAGE,JSON.stringify(achievementPrintStore));});
  });
  populateAchFilters();achShowGoals();renderAchievements();
}

function groupRowsFor(rows,groupBy,name){return name==='TOTAL'?rows:rows.filter(r=>(String(r[groupBy]||'').trim()||(groupBy==='module'?'Sin módulo':'Sin ejecutivo'))===name);}
function supervisorRow(row){
  const mod=normalize(String(row.module||'').trim()),person=normalize(String(row.executive||'').trim());
  if(!mod||!person)return false;
  return Object.entries(supervisorConfig).some(([module,names])=>
    normalize(String(module).trim())===mod && Array.isArray(names) &&
    names.some(name=>normalize(String(name||'').trim())===person));
}
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
function qualitySettingsInput(label,key,value,type='global'){
  return `<label>${esc(label)}<input type="number" min="0" max="100000" step="0.1" data-quality-kind="${type}" data-quality-key="${key}" value="${Number(value)||0}"></label>`;
}
function qualityRuleInput(key,kind,module=''){
  const mod=module?moduleQualityOptions(module):null;
  const values=mod?.[kind]||qualityConfig[kind];
  const globalValue=qualityConfig[kind][key];
  const override=module&&Object.prototype.hasOwnProperty.call(values,key);
  const val=override?values[key]:module?'':globalValue;
  const baseLabel=kind==='targets'?'Requerido':kind==='minima'?'Mínimo':'Máximo';
  const placeholder=module?'Global: '+(globalValue===null?'Sin tope':globalValue+'%'):kind==='maxima'?'Sin tope':'';
  const hint=kind==='maxima'?'Dejar vacío = sin tope':kind==='minima'?'Por debajo de este valor la calidad es 0%':'';
  const kindName=module?'module-'+(kind==='targets'?'target':kind==='minima'?'minimum':'maximum'):(kind==='targets'?'target':kind==='minima'?'minimum':'maximum');
  const noCap=module&&kind==='maxima'?`<label class="quality-no-cap"><input type="checkbox" data-quality-kind="module-no-cap" data-quality-key="${key}" data-quality-module="${esc(module)}" ${override&&val===null?'checked':''}> Sin tope</label>`:'';
  return `<div class="quality-rule-field"><label>${baseLabel} (%)<input aria-label="${esc(baseLabel+' '+QUALITY_FACTOR_LABELS[key]+' '+(module||'global'))}" type="number" min="${kind==='targets'?'0.01':'0'}" max="100000" step="0.1" data-quality-kind="${kindName}" data-quality-key="${key}" ${module?`data-quality-module="${esc(module)}"`:''} value="${val??''}" placeholder="${esc(placeholder)}" title="${esc(hint)}"></label>${noCap}</div>`;
}
function qualityFactorCard(key,module=''){
  if(key==='quality')return `<div class="quality-factor-card"><strong>Calidad Total y Alcance Global</strong><small>Calidad Total = mínimo entre 100% y el promedio simple de Cumplimiento, Primera compra, Programa Cero y APP. Alcance Global = promedio de esos cuatro y Calidad Total, sin tope. No se utiliza un quinto requerido ni ponderaciones.</small></div>`;
  const cap=key==='completion'||key==='p0'?' <small>Sin tope superior.</small>':qualityRuleInput(key,'maxima',module);
  return `<div class="quality-factor-card"><strong>${esc(QUALITY_FACTOR_LABELS[key])}</strong>${key==='dental'?'<small>Indicador informativo: no se suma como quinto factor de Calidad Total.</small>':''}<div class="quality-factor-fields">${qualityRuleInput(key,'targets',module)}${qualityRuleInput(key,'minima',module)}${cap}</div></div>`;
}
function renderQualitySettings(){
  const host=el('qualityGlobalInputs');if(!host)return;
  host.innerHTML=qualitySettingsInput('Meta semanal por ejecutivo (predeterminada)','execWeeklyGoal',qualityConfig.execWeeklyGoal)+QUALITY_RULE_KEYS.map(k=>qualityFactorCard(k)).join('');
  const modules=knownExecutivesByModule();
  el('qualityModuleInputs').innerHTML=modules.length?modules.map(({module})=>{
    const data=moduleQualityOptions(module);
    return `<details class="module-goal-card"><summary>${esc(module)}</summary><div class="module-goal-grid">
      ${qualitySettingsInput('Meta semanal de ventas','weeklySales',data.weeklySales||0,'module').replace('data-quality-kind="module"',`data-quality-kind="module" data-quality-module="${esc(module)}"`)}
      ${qualitySettingsInput('Meta semanal de trámites','weeklyRecords',data.weeklyRecords||0,'module').replace('data-quality-kind="module"',`data-quality-kind="module" data-quality-module="${esc(module)}"`)}
      </div>${QUALITY_RULE_KEYS.map(k=>qualityFactorCard(k,module)).join('')}</details>`;
  }).join(''):'<p class="settings-help">Importa un XLS para identificar los módulos disponibles.</p>';
}
function renderSupervisorSettings(){
  const host=el('supervisorManager');if(!host)return;
  const modules=knownExecutivesByModule();
  host.innerHTML=modules.length?modules.map(({module,names})=>`<div class="module-goal-card"><strong>${esc(module)}</strong><div class="supervisor-choice-row">${names.length?names.map(name=>`<label><input type="checkbox" data-supervisor-module="${esc(module)}" data-supervisor-name="${esc(name)}" ${(supervisorConfig[module]||[]).includes(name)?'checked':''}/> ${esc(name)}</label>`).join(''):'<span class="muted">Sin ejecutivos en los XLS activos.</span>'}</div></div>`).join(''):'<p class="settings-help">Importa un XLS para identificar supervisores disponibles.</p>';
}
function renderQualityPages(){if(el('dailyPage'))renderDaily();if(el('accumulatedPage'))renderAccumulated();if(el('weeklyPage'))renderWeekly();if(el('achievementsPage'))renderAchievements();if(el('historyPage'))renderHistory();if(el('moduleHistoryPage'))renderModuleHistory();}
function setQualityField(cfg,kind,key,inputValue){
  const target=kind==='target'?'targets':kind==='minimum'?'minima':kind==='maximum'?'maxima':'weights';
  if(target==='maxima'&&inputValue===''){cfg.maxima[key]=null;return true;}
  const n=Number(inputValue);
  if(!validQualityNumber(n,{positive:target==='targets'}))return false;
  cfg[target][key]=n;return true;
}
function initQualitySettings(){
  renderQualitySettings();renderSupervisorSettings();
  el('qualityGlobalInputs').addEventListener('change',e=>{
    const x=e.target;if(!x.matches('[data-quality-kind]'))return;
    const kind=x.dataset.qualityKind,key=x.dataset.qualityKey;
    let good=true;
    if(kind==='global'){
      const val=Number(x.value);
      if(!validQualityNumber(val,{positive:true}))good=false;else qualityConfig[key]=val;
    }else good=setQualityField(qualityConfig,kind,key,x.value);
    if(!good){alert('Valor no válido. Requerido mayor que 0; mínimos y máximos iguales o superiores a 0.');renderQualitySettings();return;}
    saveQualityConfig();el('qualitySaveStatus').textContent='Porcentajes requeridos y límites actualizados; sincronización pendiente de confirmación.';
  });
  el('qualityModuleInputs').addEventListener('change',e=>{
    const x=e.target;if(!x.matches('[data-quality-kind]'))return;
    const module=x.dataset.qualityModule,key=x.dataset.qualityKey,kind=x.dataset.qualityKind;
    const val=x.value.trim(),n=Number(val);
    qualityConfig.modules[module]??={weeklySales:0,weeklyRecords:0,targets:{},minima:{},maxima:{},weights:{}};
    const cfg=qualityConfig.modules[module];cfg.targets??={};cfg.minima??={};cfg.maxima??={};cfg.weights??={};
    if(kind==='module-no-cap'){
      if(x.checked)cfg.maxima[key]=null;else delete cfg.maxima[key];
    }else if(kind==='module'){
      if(!validQualityNumber(n)){alert('Meta inválida.');return;}
      cfg[key]=n;
    }else{
      const kindShort=kind.slice('module-'.length);
      const target=kindShort==='target'?'targets':kindShort==='minimum'?'minima':kindShort==='maximum'?'maxima':'weights';
      if(val==='')delete cfg[target][key];
      else if(!validQualityNumber(n,{positive:target==='targets'})){alert('Porcentaje inválido.');return;}
      else cfg[target][key]=n;
    }
    saveQualityConfig();el('qualitySaveStatus').textContent='Porcentajes del módulo actualizados.';
  });
  el('supervisorManager').addEventListener('change',e=>{
    const x=e.target;if(!x.matches('input[data-supervisor-module]'))return;
    const module=x.dataset.supervisorModule,name=x.dataset.supervisorName;
    const names=new Set(supervisorConfig[module]||[]);if(x.checked)names.add(name);else names.delete(name);
    supervisorConfig[module]=[...names];saveSupervisorConfig();el('supervisorSaveStatus').textContent='Asignaciones actualizadas.';
  });
  el('qualityReset').addEventListener('click',()=>{if(!confirm('¿Restaurar porcentajes requeridos, límites y metas?'))return;qualityConfig=cleanQualityConfig(null);saveQualityConfig();renderQualitySettings();});
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
    el('dailyCopyWhatsApp').disabled=true;
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
  if(!dates){el('dailyCopyWhatsApp').disabled=true;return;}
  const hasComparedRows=filterPageSupervisors(imported.data.rows,'daily').some(r=>r.fecha===dates.latest||r.fecha===dates.previous);
  el('dailyCopyWhatsApp').disabled=!hasComparedRows||dates.latest===dates.previous;
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


// V2.4.8 · Copia el TOTAL de «Por módulo» con el mismo origen de cifras que renderDaily().
function dailyWhatsAppText(){
  if(!imported.data)throw new Error('Importa un XLS para generar el reporte de WhatsApp.');
  const dates=dailyDates();
  if(!dates||dates.latest===dates.previous)throw new Error('Selecciona dos fechas distintas para comparar.');
  const rows=filterPageSupervisors(imported.data.rows,'daily');
  if(!rows.some(r=>r.fecha===dates.latest||r.fecha===dates.previous))throw new Error('No existen registros para las fechas seleccionadas.');
  const {totals}=dailyGroups('module',dates);
  return buildDailyWhatsAppReport({
    currentDate:dates.latest,previousDate:dates.previous,
    current:totals.current,previous:totals.previous,
    currentQuality:qualityResult(totals.currentRows,'module','TOTAL','daily').global,
    previousQuality:qualityResult(totals.previousRows,'module','TOTAL','daily').global,
    todayIso:dateIso(new Date())
  });
}
async function copyWhatsAppText(value){
  if(navigator.clipboard?.writeText){
    try{await navigator.clipboard.writeText(value);return true;}catch(_){/* Reintentar con selección tradicional. */}
  }
  const input=document.createElement('textarea');
  input.value=value;input.setAttribute('readonly','');
  input.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
  document.body.appendChild(input);input.focus();input.select();
  let copied=false;
  try{copied=!!document.execCommand('copy');}catch(_){}
  input.remove();return copied;
}
let dailyCopyStatusTimer=null;
function dailyCopyFeedback(text){
  const msg=el('dailyWhatsAppStatus');msg.textContent=text;msg.hidden=false;
  if(dailyCopyStatusTimer!==null)clearTimeout(dailyCopyStatusTimer);
  dailyCopyStatusTimer=setTimeout(()=>{msg.hidden=true;dailyCopyStatusTimer=null;},4200);
}
async function copyDailyWhatsApp(){
  const button=el('dailyCopyWhatsApp');
  try{
    const report=dailyWhatsAppText();
    if(!await copyWhatsAppText(report))throw new Error('El navegador bloqueó la copia. Permite el portapapeles o usa HTTPS.');
    dailyCopyFeedback('Reporte copiado. Pégalo en WhatsApp conservando las tres comillas invertidas.');
  }catch(error){dailyCopyFeedback(error?.message||'No se pudo copiar el reporte.');}
  finally{button.blur();}
}


// V12 · Acumulados independientes de la selección activa. Solo XLS persistidos.
function accumulatedRows(){
  const consolidated=combinedArchiveData(isAuthorized()?archive.reports:archive.tempReports);
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
  if(!el('accumulatedPage'))return;
  const start=el('accumulatedFrom').value,end=el('accumulatedTo').value;
  const invalid=start&&end&&start>end;
  const rows=invalid?[]:accumulatedRows();
  el('accumulatedPeriod').textContent=accumulatedPeriodText();
  el('accumulatedPeriodLabel').textContent=start||end?'Rango personalizado':isAuthorized()?'Todos los registros guardados':'Registros XLS temporales';
  el('accumulatedDataNotice').textContent=invalid?
    'La fecha inicial no puede ser posterior a la fecha final. Corrige el intervalo.':
    `${isAuthorized()?archive.reports.length:archive.tempReports.length} registros manuales ${isAuthorized()?'guardados':'temporales'} · ${number.format(rows.length)} registros únicos en el periodo · ${isAuthorized()?'Fuente: historial remoto completo.':'Fuente: archivos cargados en esta sesión, sin guardar en la nube.'}`;
  for(const [groupBy,rowsId,totalId,countId,label] of [
    ['module','accumulatedModuleRows','accumulatedModuleTotal','accumulatedModulesCount','módulos'],
    ['executive','accumulatedExecutiveRows','accumulatedExecutiveTotal','accumulatedExecutivesCount','ejecutivos']]){
    const {entries,totals}=accumulatedGroups(rows,groupBy);
    el(rowsId).innerHTML=entries.length?entries.map(g=>accumulatedRowMarkup(g,false,groupBy)).join(''):
      `<tr><td colspan="8" class="daily-empty">${invalid?'Revisa el rango de fechas.':(isAuthorized()?archive.reports:archive.tempReports).length?'Sin registros en el periodo.':'No hay XLS cargados en esta sesión.'}</td></tr>`;
    el(totalId).innerHTML=entries.length?accumulatedRowMarkup(totals,true,groupBy):'';
    el(countId).textContent=`${entries.length} ${label}`;
  }
}

// Comparativa semanal protegida: dos semanas completas (lunes a domingo).
// Se trabaja sobre todos los XLS guardados, sin alterar la selección del resto de páginas.
const WEEKLY_GOALS_KEY='wmSamsComparativaSemanalObjetivosV13';
const WEEKLY_LABELS={records:'Registros',sales:'Ventas totales',reg:'Ventas regulares',guar:'Ventas garantizadas',p0:'Programa Cero',dental:'Plan Dental',app:'Activación APP',purchase:'Primera compra'};
// El orden de las columnas semanales es explícito. Regulares y garantizadas
// solamente son conteos; no tienen meta ni calidad propia.
const WEEKLY_DISPLAY_METRICS=['records','sales','reg','guar','p0','dental','app','purchase'];
function weeklyMetricValue(metrics,rows,key){
  if(key==='app')return countQualityRows(rows).apps;
  if(key==='purchase')return countQualityRows(rows).purchase;
  return metrics[key]??0;
}
function weeklyTargetPct(key){return qualityPercentText(qualityRule(key,'TOTAL','module').required);}
function weeklyGoalMarkup(week,key,primaryWeek,metrics){
  if(key==='reg'||key==='guar')return '<td class="no-goal" title="Sin objetivo">—</td>';
  if(key==='app'||key==='purchase')return `<td class="weekly-rule-goal" title="Porcentaje requerido en Ajustes (puede variar por módulo)">${weeklyTargetPct(key)}</td>`;
  return weeklyGoalInput(week,key,primaryWeek,metrics);
}
function weeklyFactorValues(week,primaryWeek,data,q){
  const recordsGoal=weeklyGoalFor(week,'records',primaryWeek,data.totals.metrics);
  return [
    {label:'Registros',value:recordsGoal>0?weeklyPercent(data.totals.metrics.records,recordsGoal):'—'},
    {label:'Cumplimiento',value:qualityPercentText(q.factors.completion)},
    null,null,
    {label:'Plan Cero',value:qualityPercentText(q.factors.p0)},
    {label:'Plan Dental',value:qualityPercentText(q.factors.dental)},
    {label:'APP',value:qualityPercentText(q.factors.app)},
    {label:'Primera compra',value:qualityPercentText(q.factors.purchase)},
    {label:'Calidad',value:qualityPercentText(q.factors.quality)}
  ];
}

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
  const data=combinedArchiveData(isAuthorized()?archive.reports:archive.tempReports);
  const validRows=filterPageSupervisors(data?.rows||[],'weekly').filter(r=>r.fecha&&r.fecha>=week&&r.fecha<=sundayOf(week));
  const {entries,totals}=accumulatedGroups(validRows,'module');
  return {entries,totals,rows:validRows};
}
function weeklyGlobalQuality(week,primaryWeek,data){
  // El objetivo de ventas capturado en la tabla semanal tiene prioridad para
  // Cumplimiento; los demás factores usan los porcentajes requeridos de Ajustes.
  const salesGoal=weeklyGoalFor(week,'sales',primaryWeek,data.totals.metrics);
  return qualityResult(data.rows,'module','TOTAL','weekly',salesGoal>0?salesGoal:null).global;
}
function weeklyPercent(actual,target){return target>0?pct(100*actual/target):'—';}
function weeklyPanelMarkup(week,primaryWeek){
  const data=weeklyGroups(week);
  const qualityFor=g=>qualityResult(g.rows,'module',g.name,'weekly').global;
  const totalQuality=qualityResult(data.rows,'module','TOTAL','weekly',weeklyGoalFor(week,'sales',primaryWeek,data.totals.metrics)||null);
  const overall=totalQuality.global;
  const metricCells=g=>WEEKLY_DISPLAY_METRICS.map(k=>`<td>${number.format(weeklyMetricValue(g.metrics,g.rows,k))}</td>`).join('');
  const rowMarkup=g=>`<tr><td><span class="daily-entity" title="${esc(g.name)}">${esc(g.name)}</span></td>${metricCells(g)}<td class="quality-global">${qualityPercentText(qualityFor(g))}</td></tr>`;
  const inputRow=`<tr class="goal-row"><td>OBJETIVOS</td>${WEEKLY_DISPLAY_METRICS.map(k=>weeklyGoalMarkup(week,k,primaryWeek,data.totals.metrics)).join('')}<td class="weekly-rule-goal" title="Porcentaje requerido de Calidad en Ajustes">${weeklyTargetPct('quality')}</td></tr>`;
  const totalRow=`<tr class="weekly-total"><td>TOTAL ACUMULADO</td>${metricCells(data.totals)}<td class="quality-global">${qualityPercentText(overall)}</td></tr>`;
  const progressRow=`<tr class="weekly-progress"><td>CUMPLIMIENTO</td>${WEEKLY_DISPLAY_METRICS.map(k=>{
    if(k==='reg'||k==='guar')return '<td class="no-goal">—</td>';
    if(k==='app'||k==='purchase'){
      const sold=data.totals.metrics.sales;
      return `<td>${sold?weeklyPercent(weeklyMetricValue(data.totals.metrics,data.rows,k),sold):'—'}</td>`;
    }
    const goal=weeklyGoalFor(week,k,primaryWeek,data.totals.metrics);
    return `<td class="${goal?'':'no-goal'}">${weeklyPercent(data.totals.metrics[k],goal)}</td>`;
  }).join('')}<td>${qualityPercentText(totalQuality.composite)}</td></tr>`;
  const factorValues=weeklyFactorValues(week,primaryWeek,data,totalQuality);
  const factorRow=`<tr class="weekly-quality"><td>CALIDAD DE FACTORES</td>${factorValues.map(cell=>cell?`<td title="${esc(cell.label)}">${cell.value}</td>`:'<td class="no-goal">—</td>').join('')}</tr>`;
  const globalRow=`<tr class="weekly-quality"><td>ALCANCE GLOBAL</td>${WEEKLY_DISPLAY_METRICS.map(()=>'<td>—</td>').join('')}<td class="quality-global">${qualityPercentText(overall)}</td></tr>`;
  return {data,body:inputRow+(data.entries.length?data.entries.map(rowMarkup).join(''):'<tr><td colspan="10" class="daily-empty">Sin registros para esta semana.</td></tr>'),footer:totalRow+progressRow+factorRow+globalRow};
}

function weeklyVarianceData(){
  const {primary,previous}=weeklySelection();
  const main=weeklyGroups(primary),older=weeklyGroups(previous);
  return {primary,previous,main,older};
}
function renderWeekly(){
  if(!el('weeklyPage'))return;
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

// V2.4.7 · Calculadora de comisiones para supervisores.
// Separa el incentivo por el equipo de las comisiones de ventas propias.
// NO hay solicitudes remotas durante la navegación o el cálculo.
const SUP_COMMISSION_KEY='wmSamsMeridaSupervisorCommissionV24';
const SUP_FACTOR_KEYS=['completion','purchase','p0','app'];
const SUP_FACTOR_LABELS={completion:'Cumplimiento',purchase:'Primera compra',p0:'Programa Cero',app:'Activación por APP',quality:'Calidad total'};
const SUP_BASE_RULES={
  baseBonus:null,goals:{},
  required:{completion:100,purchase:90,p0:30,app:90,quality:90},
  minimum:{completion:60,purchase:60,p0:60,app:60,quality:0},
  maximum:{completion:null,purchase:100,p0:null,app:100,quality:null},
  weights:{completion:25,purchase:25,p0:25,app:25},
  additional:[{threshold:110,amount:1000},{threshold:115,amount:1500},{threshold:120,amount:2000}],
  moduleP0Threshold:30,moduleP0Penalty:15,ownP0Threshold:30,ownP0Penalty:15,ownP0UseModule:false,includeSupervisorSales:true,minimumRuleVersion:1,
  incidencePenalties:[0,0,10,20,30],
  tiers:DEFAULT_TIER.map(t=>({min:t.min,sale:t.sale,dental:t.dental,app:t.app,p0:t.p0}))
};
const SUP_LIMITS={min:0,max:1000000};
function supNumber(value,{nullable=false,positive=false,whole=false}={}){
  if(nullable&&(value===null||value===''))return null;
  const n=Number(value);
  return Number.isFinite(n)&&n>=0&&n<=1000000&&(!positive||n>0)&&(!whole||Number.isInteger(n))?n:null;
}
function normalizeSupervisorCommission(saved){
  const out=structuredClone(SUP_BASE_RULES);
  if(!saved||typeof saved!=='object'||Array.isArray(saved))return out;
  const previousZeroDefaults=saved.minimumRuleVersion!==1;
  if(supNumber(saved.baseBonus)!==null)out.baseBonus=Number(saved.baseBonus);
  if(saved.baseBonus===null)out.baseBonus=null;
  for(const m of Object.keys(saved.goals||{})){
    const n=supNumber(saved.goals[m],{whole:true,positive:true});
    if(m&&n!==null)out.goals[m]=n;
  }
  for(const [group,keys] of [['required',[...SUP_FACTOR_KEYS,'quality']],['minimum',[...SUP_FACTOR_KEYS,'quality']],['maximum',[...SUP_FACTOR_KEYS,'quality']],['weights',SUP_FACTOR_KEYS]]){
    for(const k of keys){
      if(!Object.prototype.hasOwnProperty.call(saved[group]||{},k))continue;
      if(group==='maximum'&&(saved.maximum[k]===null||saved.maximum[k]==='')){out.maximum[k]=null;continue;}
      const n=supNumber(saved[group][k],{positive:group==='required'});
      if(group==='minimum'&&k!=='quality'&&previousZeroDefaults&&n===0)continue;
      if(n!==null)out[group][k]=n;
    }
  }
  // La calidad global del supervisor nunca tiene tope superior, incluso si una configuración anterior lo guardó en 100%.
  out.maximum.quality=null;
  if(typeof saved.ownP0UseModule==='boolean')out.ownP0UseModule=saved.ownP0UseModule;
  if(typeof saved.includeSupervisorSales==='boolean')out.includeSupervisorSales=saved.includeSupervisorSales;
  for(const key of ['moduleP0Threshold','moduleP0Penalty','ownP0Threshold','ownP0Penalty']){
    const n=supNumber(saved[key]);if(n!==null)out[key]=n;
  }
  // Mantener los tramos editables guardados por el usuario; los valores iniciales son solo predeterminados.
  if(Array.isArray(saved.additional))out.additional=out.additional.map((row,i)=>{
    const entry=saved.additional[i];
    if(!entry||typeof entry!=='object')return row;
    const threshold=supNumber(entry.threshold,{positive:true});
    const amount=supNumber(entry.amount);
    return {threshold:threshold===null?row.threshold:threshold,amount:amount===null?row.amount:amount};
  });
  if(Array.isArray(saved.incidencePenalties))for(let i=1;i<=4;i++){
    const n=supNumber(saved.incidencePenalties[i]);if(n!==null)out.incidencePenalties[i]=n;
  }
  if(Array.isArray(saved.tiers))for(let i=0;i<out.tiers.length;i++){
    const src=saved.tiers[i]||{};
    for(const key of ['min','sale','dental','app','p0']){
      const n=supNumber(src[key]);if(n!==null)out.tiers[i][key]=n;
    }
  }
  return out;
}
let supSettings=normalizeSupervisorCommission(storedJson(SUP_COMMISSION_KEY));
const supView={week:'',selection:'',search:'',pageSize:100,page:1};
// Opciones solo de presentación/exportación: no se guardan en PostgreSQL.
const SUP_PRINT_KEY='wmSamsMeridaSupPrintV241';
const SUP_PRINT_DEFAULTS={filters:false,overview:true,search:false,team:true,bonus:true,own:true,recordsTeam:false,recordsOwn:true};
const supPrintState={...SUP_PRINT_DEFAULTS};
try{const stored=JSON.parse(localStorage.getItem(SUP_PRINT_KEY)||'null');if(stored&&typeof stored==='object')for(const k of Object.keys(SUP_PRINT_DEFAULTS))if(typeof stored[k]==='boolean')supPrintState[k]=stored[k];}catch(_){}
const supFoldState={filters:true,overview:true,search:true,team:true,bonus:true,own:true,recordsTeam:false,recordsOwn:false};
function supPrintEnabled(key){return supPrintState[key]!==false;}
function supFoldOpen(key){return supFoldState[key]!==false;}
function supFoldHeading(text,key){return `<summary><span class="sup-fold-title">${esc(text)}</span><span class="sup-fold-actions"><span class="sup-print-toggle"><input type="checkbox" data-sup-print="${key}" ${supPrintEnabled(key)?'checked':''} aria-label="Imprimir ${esc(text)}"> Imprimir</span><span class="sup-fold-chevron" aria-hidden="true">⌄</span></span></summary>`;}
function captureSupFolds(){document.querySelectorAll('#supPage details[data-sup-fold]').forEach(n=>{if(n.isConnected)supFoldState[n.dataset.supFold]=n.open;});}
function syncSupPrintChecks(){document.querySelectorAll('#supPage input[data-sup-print]').forEach(x=>{x.checked=supPrintEnabled(x.dataset.supPrint);});}

function saveSupervisorCalculatorSettings(){
  localStorage.setItem(SUP_COMMISSION_KEY,JSON.stringify(supSettings));
  renderSupervisorCalculator();
}
function supervisorOptions(){
  const all=[];
  for(const [module,names] of Object.entries(supervisorConfig))for(const name of names||[]){
    if(!module||!name)continue;
    all.push({module,name,key:JSON.stringify([module,name])});
  }
  return all.sort((a,b)=>a.module.localeCompare(b.module,'es')||a.name.localeCompare(b.name,'es'));
}
function supReadSelection(){
  try{const [module,name]=JSON.parse(supView.selection);if(module&&name)return {module,name};}catch(_){}
  return null;
}
function supInputNumber(id,options={}){
  const val=el(id)?.value;
  const out=supNumber(val,{nullable:options.nullable,positive:options.positive,whole:options.whole});
  return out;
}
function supWeeks(){return [...new Set((imported.data?.rows||[]).map(r=>r.week).filter(Boolean))].sort().reverse();}
function populateSupervisorCalculatorFilters(){
  const sel=el('supSupervisor'),weekSel=el('supWeek');if(!sel||!weekSel)return;
  const opts=supervisorOptions();
  if(!opts.some(x=>x.key===supView.selection))supView.selection=opts[0]?.key||'';
  sel.innerHTML=opts.length?opts.map(s=>`<option value="${esc(s.key)}">${esc(s.name)} · ${esc(s.module)}</option>`).join(''):'<option value="">Asigna supervisores en Ajustes → 11</option>';
  sel.value=supView.selection;sel.disabled=!opts.length;
  const weeks=supWeeks();const current=mondayOf(dateIso(new Date()));
  if(!weeks.includes(supView.week))supView.week=weeks.find(w=>w<=current)||weeks[0]||'';
  weekSel.innerHTML=weeks.length?weeks.map(w=>`<option value="${w}">${weekLabel(w)}</option>`).join(''):'<option value="">Carga un XLS para consultar</option>';
  weekSel.value=supView.week;weekSel.disabled=!weeks.length;
}
function supervisorModuleGoal(module,week,teamRows){
  if(supSettings.goals[module]>0)return supSettings.goals[module];
  const preset=Number(moduleQualityOptions(module).weeklySales)||0;
  if(preset>0)return preset;
  const names=[...new Set(teamRows.map(r=>r.executive).filter(Boolean))];
  return names.reduce((a,n)=>a+executiveGoal(week,n),0);
}
function supervisorWeekRows(){
  const selected=supReadSelection();
  if(!selected||!imported.data||!supView.week)return {selected,team:[],own:[],otherSupervisors:[]};
  const rows=imported.data.rows.filter(r=>r.week===supView.week&&r.module===selected.module);
  return {selected,team:rows.filter(r=>!supervisorRow(r)),own:rows.filter(r=>r.executive===selected.name),otherSupervisors:rows.filter(r=>supervisorRow(r)&&r.executive!==selected.name)};
}
function supFiltered(rows){
  const q=normalize(el('supSearch')?.value||'');
  if(!q)return rows;
  return rows.filter(r=>normalize([r.folio,r.fecha,r.executive,r.module,r.code,r.status,r.p0,r.dental,selectedIncident(r)?'INCIDENCIA':'',appEnabled(r)?'APP':''].join(' ')).includes(q));
}
function supIncidentRate(n){return supSettings.incidencePenalties[Math.min(4,Math.max(0,n))]||0;}
function supervisorQuality(validRows,goal,completionSales=validRows.length){
  const base=countQualityRows(validRows);
  const actual={completion:goal>0?100*completionSales/goal:null,
    purchase:base.sales?100*base.purchase/base.sales:0,
    p0:base.regular?100*base.p0/base.regular:0,
    app:base.sales?100*base.apps/base.sales:0};
  const factors={};
  for(const k of SUP_FACTOR_KEYS){
    const raw=actual[k];
    const quality=raw===null?null:qualityMetricFactor(raw,supSettings.required[k],{
      minimum:supSettings.minimum[k],maximum:(k==='completion'||k==='p0'?null:supSettings.maximum[k])});
    factors[k]=quality===null?null:(k==='purchase'||k==='app'?Math.min(100,quality):quality);
  }
  const {composite,global}=correctedGlobalQuality(factors);
  return {actual,factors,composite,global,base};
}
function supTier(teamCompletion){return [...supSettings.tiers].sort((a,b)=>b.min-a.min).find(t=>teamCompletion>=t.min)||null;}
function supervisorCalculator(){
  const src=supervisorWeekRows(),selected=src.selected;
  if(!selected)return {ready:false,reason:'Selecciona un supervisor en Ajustes → 11 e importa registros XLS.'};
  const goal=supervisorModuleGoal(selected.module,supView.week,src.team);
  const teamValid=src.team.filter(r=>candidate(r)&&!excluded(r));
  const teamReg=teamValid.filter(r=>guaranteeType(r)==='reg');
  const teamP0=teamReg.filter(r=>isYes(r.p0));
  const ownValid=src.own.filter(r=>candidate(r)&&!excluded(r));
  const includeSupervisorSales=supSettings.includeSupervisorSales!==false;
  const completionSales=teamValid.length+(includeSupervisorSales?ownValid.length:0);
  const completion=goal>0?completionSales/goal*100:null;
  const teamCompletion=goal>0?teamValid.length/goal*100:null;
  // Solo Cumplimiento incorpora las ventas del supervisor. P0, compra y APP
  // del equipo, el escalón de tarifas y sus penalizaciones siguen sin supervisores.
  const q=supervisorQuality(teamValid,goal,completionSales);
  const tier=teamCompletion===null?null:supTier(teamCompletion);
  const bonusConfigured=supSettings.baseBonus!==null;
  const completionMultiplier=completion===null?0:Math.min(1,Math.max(0,completion/100));
  const base=bonusConfigured&&q.global!==null?round(supSettings.baseBonus*(q.global/100)*completionMultiplier):0;
  // Un solo bono: se selecciona exclusivamente el tramo más alto alcanzado.
  const earnedTier=completion===null?null:[...supSettings.additional].filter(t=>completion>=t.threshold).sort((a,b)=>b.threshold-a.threshold)[0]||null;
  const additional=supSettings.additional.map(t=>({threshold:t.threshold,amount:t.amount,configured:true,earned:earnedTier?.threshold===t.threshold?round(t.amount):0}));
  const extras=earnedTier?round(earnedTier.amount):0;
  const moduleP0Reach=teamReg.length?100*teamP0.length/teamReg.length:null;
  const modulePenalty=teamReg.length&&moduleP0Reach<supSettings.moduleP0Threshold?supSettings.moduleP0Penalty:0;
  const incentiveBefore=round(base+extras);
  const incentiveDiscount=round(incentiveBefore*modulePenalty/100);
  const incentiveNet=round(incentiveBefore-incentiveDiscount);
  const ownReg=ownValid.filter(r=>guaranteeType(r)==='reg');
  const ownDental=ownValid.filter(r=>isYes(r.dental));
  const ownApp=ownValid.filter(appEnabled);
  const ownP0=ownReg.filter(r=>isYes(r.p0));
  const ownInc=src.own.filter(selectedIncident).length;
  const rate=tier||{sale:0,dental:0,app:0,p0:0};
  const parts=[
    {name:'Ventas',count:ownValid.length,rate:rate.sale,total:round(ownValid.length*rate.sale)},
    {name:'Activación APP',count:ownApp.length,rate:rate.app,total:round(ownApp.length*rate.app)},
    {name:'Plan Dental',count:ownDental.length,rate:rate.dental,total:round(ownDental.length*rate.dental)},
    {name:'Plan Cero',count:ownP0.length,rate:rate.p0,total:round(ownP0.length*rate.p0)}
  ];
  const ownGross=round(parts.reduce((s,p)=>s+p.total,0));
  const ownP0Reach=ownReg.length?100*ownP0.length/ownReg.length:null;
  // La penalización sobre comisiones propias elige una sola base: módulo sin supervisores
  // O ventas propias válidas. El descuento del bono del módulo conserva su propia regla.
  const ownP0UseModule=supSettings.ownP0UseModule===true;
  const ownP0Basis=ownP0UseModule?'Módulo sin supervisores':'Ventas propias del supervisor';
  const ownP0ComparedReach=ownP0UseModule?moduleP0Reach:ownP0Reach;
  const ownP0ComparedThreshold=ownP0UseModule?supSettings.moduleP0Threshold:supSettings.ownP0Threshold;
  const ownP0HasRegular=ownP0UseModule?teamReg.length>0:ownReg.length>0;
  // Sin ventas regulares en la base elegida no existe denominador; se evita la penalización.
  const ownP0BelowTarget=ownP0HasRegular&&ownP0ComparedReach<ownP0ComparedThreshold;
  const ownP0Penalty=ownP0BelowTarget?supSettings.ownP0Penalty:0;
  const ownIncPenalty=supIncidentRate(ownInc);
  const ownP0Discount=round(ownGross*ownP0Penalty/100);
  const ownIncDiscount=round(ownGross*ownIncPenalty/100);
  const ownNet=round(ownGross-ownP0Discount-ownIncDiscount);
  // La dinámica se paga una vez por venta propia válida marcada; no es base
  // para descuentos porcentuales, y nunca se suma al bono del módulo.
  const ownDynamicBonusCount=dynamicBonusRows(src.own).length;
  const ownDynamicBonus=round(ownDynamicBonusCount*dynamicBonusAmount());
  return {ready:true,selected,goal,src,teamValid,teamReg,teamP0,completionSales,includeSupervisorSales,teamCompletion,completion,completionMultiplier,q,tier,
    bonusConfigured,base,additional,extras,moduleP0Reach,modulePenalty,incentiveBefore,incentiveDiscount,incentiveNet,
    ownValid,ownReg,ownDental,ownApp,ownP0,ownInc,parts,ownGross,ownP0Reach,ownP0UseModule,ownP0Basis,ownP0ComparedReach,ownP0ComparedThreshold,ownP0HasRegular,ownP0BelowTarget,ownP0Penalty,ownIncPenalty,ownP0Discount,ownIncDiscount,ownNet,ownDynamicBonusCount,ownDynamicBonus,
    total:round(incentiveNet+ownNet+ownDynamicBonus)};
}
function supText(v){return Number.isFinite(v)?pct(v):'—';}
function supMoneyValue(v){return Number.isFinite(v)?mx(v):'—';}
function supDetailCards(c){
  if(!c.ready)return `<p class="sup-empty">${esc(c.reason)}</p>`;
  const qty=k=>c.q.actual[k];
  const factorRows=SUP_FACTOR_KEYS.map(k=>`<tr><th>${SUP_FACTOR_LABELS[k]}</th><td>${supText(qty(k))}</td><td>${supText(c.q.factors[k])}</td></tr>`).join('');
  const bonusRows=c.additional.map(b=>`<tr><th>Bono ${pct(b.threshold)}${!b.configured?' · Sin importe':''}</th><td>${b.earned?mx(b.earned):'—'}</td></tr>`).join('');
  const partsRows=c.parts.map(p=>`<tr><th>${p.name}</th><td>${number.format(p.count)} × ${mx(p.rate)}</td><td>${mx(p.total)}</td></tr>`).join('');
  return `<details class="sup-fold sup-overview" data-sup-fold="overview" ${supFoldOpen('overview')?'open':''}>${supFoldHeading('Resumen de comisiones','overview')}<div class="sup-fold-body"><div class="sup-top-summary">
      <div class="sup-big-card"><small>Comisión total estimada</small><strong>${mx(c.total)}</strong><span>${esc(c.selected.name)} · ${esc(c.selected.module)}</span></div>
      <div class="sup-big-card"><small>Bono por módulo</small><strong>${mx(c.incentiveNet)}</strong><span>Base + bono único − descuento P0</span></div>
      <div class="sup-big-card"><small>Ventas propias</small><strong>${mx(c.ownNet)}</strong><span>Sin dinámica, antes de sumar el bono fijo por folio</span></div>
    </div><p class="sup-muted">Bono por dinámica: ${c.ownDynamicBonusCount} × ${mx(dynamicBonusAmount())} = <b>${mx(c.ownDynamicBonus)}</b>, agregado al final, sin penalización.</p></div></details>
    <div class="sup-detail-grid">
      <details class="sup-panel sup-fold" data-sup-fold="team" ${supFoldOpen('team')?'open':''}>${supFoldHeading('Resultados del módulo y calidad','team')}<div class="sup-fold-body"><div class="sup-facts">
        <span>Objetivo: <b>${number.format(c.goal)} ventas</b></span><span>Ventas equipo: <b>${c.teamValid.length}</b></span><span>Ventas propias incluidas: <b>${c.includeSupervisorSales?c.ownValid.length:0}</b></span><span>Ventas módulo para cumplimiento: <b>${c.completionSales}</b></span>
        <span>Cumplimiento del módulo: <b>${supText(c.completion)}</b></span><span>Cumplimiento para tarifas propias: <b>${supText(c.teamCompletion)}</b></span><span>Escalón aplicable: <b>${c.tier?esc(c.tier.min+'% o más'):'Sin escalón pagable'}</b></span>
        <span>P0 del módulo: <b>${supText(c.moduleP0Reach)}</b></span><span>Calidad total: <b>${supText(c.q.composite)}</b></span>
        <span>Alcance global: <b>${supText(c.q.global)}</b></span>
      </div><table class="sup-metrics"><thead><tr><th>Factor</th><th>Alcance</th><th>Calidad</th></tr></thead><tbody>${factorRows}
        <tr class="sup-table-emphasis"><th>Calidad Total</th><td colspan="2">${supText(c.q.composite)}</td></tr><tr class="sup-table-emphasis"><th>Alcance Global</th><td colspan="2">${supText(c.q.global)}</td></tr></tbody></table></div></details>
      <details class="sup-panel sup-fold" data-sup-fold="bonus" ${supFoldOpen('bonus')?'open':''}>${supFoldHeading('Desglose del bono del módulo','bonus')}<div class="sup-fold-body"><div class="sup-formula">Bono base × Alcance Global (${supText(c.q.global)})${c.completion<100?' × cumplimiento módulo ('+supText(c.completion)+')':' · sin reducción por ventas (cumplimiento ≥ 100%)'}</div>
        <table class="sup-metrics"><tbody><tr><th>Bono base ${!c.bonusConfigured?'(sin configurar)':''}</th><td>${c.bonusConfigured?mx(supSettings.baseBonus):'—'}</td></tr>
        <tr><th>Cálculo base</th><td>${mx(c.base)}</td></tr>${bonusRows}
        <tr><th>Base + bono adicional</th><td>${mx(c.incentiveBefore)}</td></tr>
        <tr><th>Descuento P0 módulo (${pct(c.modulePenalty)})</th><td>−${mx(c.incentiveDiscount)}</td></tr>
        <tr class="sup-table-emphasis"><th>Bono neto módulo</th><td>${mx(c.incentiveNet)}</td></tr></tbody></table></div></details>
      <details class="sup-panel sup-fold" data-sup-fold="own" ${supFoldOpen('own')?'open':''}>${supFoldHeading('Ventas propias del supervisor','own')}<div class="sup-fold-body"><div class="sup-facts">
        <span>Registros propios: <b>${c.src.own.length}</b></span><span>Ventas pagables: <b>${c.ownValid.length}</b></span>
        <span>Incidencias propias: <b>${c.ownInc}</b></span><span>Plan Cero propio: <b>${supText(c.ownP0Reach)}</b></span>
        <span>Base P0 para penalización: <b>${esc(c.ownP0Basis)}</b></span>
        <span>P0 evaluado: <b>${supText(c.ownP0ComparedReach)}</b> / requerido <b>${pct(c.ownP0ComparedThreshold)}</b></span>
        <span>${!c.ownP0HasRegular?'Sin ventas regulares en la base elegida: no aplica penalización':c.ownP0BelowTarget?'P0 debajo del requerido: se aplica penalización':'Objetivo P0 alcanzado: sin penalización'}</span>
      </div><table class="sup-metrics"><thead><tr><th>Concepto</th><th>Cantidad × tarifa</th><th>Total</th></tr></thead><tbody>${partsRows}</tbody></table>
      <table class="sup-metrics"><tbody><tr><th>Subtotal ventas propias</th><td>${mx(c.ownGross)}</td></tr>
      <tr><th>Descuento P0 (${pct(c.ownP0Penalty)}) · ${esc(c.ownP0Basis)}</th><td>−${mx(c.ownP0Discount)}</td></tr>
      <tr><th>Descuento incidencias (${pct(c.ownIncPenalty)})</th><td>−${mx(c.ownIncDiscount)}</td></tr>
      <tr class="sup-table-emphasis"><th>Ventas propias netas</th><td>${mx(c.ownNet)}</td></tr><tr><th>Bono por dinámica (${c.ownDynamicBonusCount} × ${mx(dynamicBonusAmount())})</th><td>+${mx(c.ownDynamicBonus)}</td></tr><tr class="sup-table-emphasis"><th>Total módulo + propias + dinámica</th><td>${mx(c.total)}</td></tr></tbody></table>
      <p class="sup-muted">Los folios marcados con incidencia y los de estatus no pagable se descuentan por completo antes de aplicar estos porcentajes. Las ventas propias no generan un segundo bono semanal por escalón.</p></div></details>
    </div>`;
}
function supRowFee(r,c){
  if(!candidate(r)||excluded(r)||!c.tier)return 0;
  return c.tier.sale+(appEnabled(r)?c.tier.app:0)+(isYes(r.dental)?c.tier.dental:0)+(guaranteeType(r)==='reg'&&isYes(r.p0)?c.tier.p0:0);
}
function supTableMarkup(rows,c,tableKind,forReport=false){
  const body=rows.map(r=>{
    const incident=selectedIncident(r),app=appEnabled(r),valid=payable(r);
    const cells=[r.fecha?fmtDay(r.fecha):'—',r.executive,r.folio||'—',guaranteeType(r)==='guar'?'Garantizada':guaranteeType(r)==='reg'?'Regular':'—',r.code||'—',isYes(r.p0)?'Sí':'—',isYes(r.dental)?'Sí':'—'];
    const checkbox=type=>type==='dynamicBonus'?
      (forReport?getCellText(r,'dynamicBonus'):`<label class="dynamic-bonus-cell"><input type="checkbox" data-sup-dynamic-bonus-id="${esc(r.uid||String(r.i))}" ${dynamicBonusMarked(r)?'checked':''} ${valid?'':'disabled'} aria-label="Bono adicional ${esc(r.folio)}"><span>${dynamicBonusMarked(r)&&valid?mx(dynamicBonusAmount()):''}</span></label>`):
      forReport?(type==='incident'?(incident?'Sí':'No'):(app?'Sí':'No')):
      type==='incident'?`<input type="checkbox" data-sup-incident-id="${esc(r.uid||String(r.i))}" ${incident?'checked':''} aria-label="Marcar incidencia ${esc(r.folio)}">`:
      `<input type="checkbox" data-sup-app-id="${esc(r.uid||String(r.i))}" ${app?'checked':''} ${hasCode(r)?'':'disabled'} aria-label="APP activa ${esc(r.folio)}">`;
    return `<tr class="${incident?'sup-incident':''}">${cells.map(x=>`<td>${esc(x)}</td>`).join('')}<td>${checkbox('app')}</td><td>${checkbox('incident')}</td><td>${checkbox('dynamicBonus')}</td><td>${tableKind==='own'?(valid?mx(supRowFee(r,c)):'No paga'):(valid?'Válido':'Excluido')}</td></tr>`;
  }).join('');
  return `<table class="sup-record-table ${forReport?'sup-report-records':''}"><thead><tr>${['Fecha','Ejecutivo','Folio','Tipo','Código','P0','Dental','APP','Incidencia','Bono adicional',tableKind==='own'?'Bruto por folio':'Estado'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${body||'<tr><td colspan="11">Sin registros para la selección actual.</td></tr>'}</tbody></table>`;
}
function renderSupervisorCalculator(){
  const host=el('supPage');if(!host)return;
  captureSupFolds();
  const c=supervisorCalculator();
  el('supSummary').innerHTML=supDetailCards(c);
  syncSupPrintChecks();
  if(!c.ready){el('supTeamRows').innerHTML='';el('supOwnRows').innerHTML='';el('supTeamCount').textContent='0 registros';el('supOwnCount').textContent='0 registros';return;}
  const team=supFiltered(c.src.team).sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.i-a.i);
  const own=supFiltered(c.src.own).sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.i-a.i);
  el('supTeamCount').textContent=`${team.length} de ${c.src.team.length} registros`;
  el('supOwnCount').textContent=`${own.length} de ${c.src.own.length} registros`;
  // La búsqueda es un filtro visual: no altera el bono ni el escalón.
  el('supTeamRows').innerHTML=supTableMarkup(team,c,'team');
  el('supOwnRows').innerHTML=supTableMarkup(own,c,'own');
  el('supSelectionInfo').textContent=`Semana ${weekLabel(supView.week)} · ${c.selected.module} · ${c.selected.name} · Ventas propias ${c.includeSupervisorSales?'incluidas':'excluidas'} del cumplimiento · ${c.src.otherSupervisors.length} trámites de otros supervisores excluidos`;
}
function supervisorFactorSettingsHtml(){
  const num=(label,key,group,value,opts='')=>`<label class="sup-setting-field">${label}<input type="number" inputmode="decimal" step="0.01" min="0" max="1000000" data-sup-group="${group}" data-sup-key="${key}" value="${value??''}" ${opts}></label>`;
  const factors=SUP_FACTOR_KEYS.map(k=>`<div class="sup-factor-setting"><b>${SUP_FACTOR_LABELS[k]}</b><div class="sup-setting-grid">${num('Requerido (%)',k,'required',supSettings.required[k])}${num('Mínimo de calidad (%)',k,'minimum',supSettings.minimum[k])}${k==='completion'||k==='p0'?'<p class="settings-help">Sin tope superior.</p>':num('Máximo de calidad (%)',k,'maximum',supSettings.maximum[k])}</div></div>`).join('');
  const bonuses=supSettings.additional.map((x,i)=>`<div class="sup-setting-grid">${num('Cumplimiento requerido (%)',i,'additional-threshold',x.threshold)}${num('Bono adicional ($)',i,'additional-amount',x.amount,'placeholder="Importe por definir"')}</div>`).join('');
  const tiers=supSettings.tiers.map((t,i)=>`<tr><th>${i+1}</th>${['min','sale','dental','app','p0'].map(k=>`<td><input type="number" min="0" step="0.01" data-sup-tier="${i}" data-sup-tier-key="${k}" value="${t[k]}"></td>`).join('')}</tr>`).join('');
  const modules=[...new Set([...Object.keys(supervisorConfig),...Object.keys(qualityConfig.modules),(imported.data?.rows||[]).map(r=>r.module).filter(Boolean)].flat().filter(Boolean))].sort();
  return `<p class="settings-help">El bono base, los porcentajes y los importes por sobrecumplimiento son editables. El bono adicional es único, no acumulable: solo se paga el tramo más alto alcanzado. No se incluye el bono semanal de los ejecutivos dentro de las ventas propias.</p>
    ${num('Bono base del supervisor (MXN)','baseBonus','root',supSettings.baseBonus,'placeholder="Sin configurar"')}
    <label class="sup-checkbox-setting"><input type="checkbox" data-sup-include-sales ${supSettings.includeSupervisorSales?'checked':''}><span><b>Incluir las ventas propias del supervisor en el cumplimiento del módulo</b><small>Activado de forma predeterminada. Solo suma sus ventas pagables al cumplimiento para Calidad y bono del módulo; no modifica el escalón de tarifas propias ni P0, Primera compra o APP del equipo. Otros supervisores no se incluyen.</small></span></label>
    <h4>Objetivos semanales de ventas por módulo</h4><p class="settings-help">Si no ingresas una meta aquí, utiliza la meta semanal del módulo de Ajustes → 10. Si tampoco existe, suma las metas individuales de los ejecutivos del equipo.</p>
    <div class="sup-setting-grid">${modules.map(m=>num(esc(m)+' · ventas',m,'goals',supSettings.goals[m]??'','placeholder="Heredar objetivo"')).join('')||'<span>Importa XLS para identificar módulos.</span>'}</div>
    <h4>Calidad por variable del módulo</h4><p class="settings-help">El mínimo predeterminado es 60% de la <b>calidad calculada</b> (Alcance ÷ Requerido × 100), editable por factor. Si queda debajo, vale 0%. Calidad Total = min(100%, promedio de cuatro calidades); Alcance Global = promedio de cuatro calidades más Calidad Total, sin tope. Plan Dental se cuenta en Primera compra y no se agrega como factor individual. Los pesos antiguos y el antiguo requerido de Calidad Total ya no se aplican.</p>${factors}
    <h4>Bono adicional por sobrecumplimiento (único, no acumulable)</h4><p class="settings-help">Modifica los porcentajes requeridos y los montos de cada tramo. Se paga únicamente el bono del umbral más alto alcanzado, nunca la suma de varios.</p>${bonuses}
    <h4>Penalización de Plan Cero</h4><div class="sup-setting-grid">
      ${num('Módulo · mínimo P0 (%)','moduleP0Threshold','root',supSettings.moduleP0Threshold)}
      ${num('Módulo · descuento (%)','moduleP0Penalty','root',supSettings.moduleP0Penalty)}
      ${num('Ventas propias · mínimo P0 (%)','ownP0Threshold','root',supSettings.ownP0Threshold)}
      ${num('Ventas propias · descuento (%)','ownP0Penalty','root',supSettings.ownP0Penalty)}
    </div>
    <label class="sup-checkbox-setting"><input type="checkbox" data-sup-p0-basis="module" ${supSettings.ownP0UseModule?'checked':''}><span><b>Usar el Plan Cero del módulo para penalizar las ventas propias</b><small>Marcado: compara el Plan Cero de ventas regulares válidas de ejecutivos, sin supervisores, con el mínimo P0 del módulo. Desmarcado: utiliza solo las ventas regulares propias y su mínimo P0. En ambos casos se aplica el descuento de «Ventas propias» configurado arriba.</small></span></label>
    <h4>Penalización por incidencias propias</h4><div class="sup-setting-grid">${[1,2,3,4].map(i=>num(i===4?'4 o más incidencias (%)':i+' incidencia(s) (%)',i,'incidence',supSettings.incidencePenalties[i])).join('')}</div>
    <h4>Escalones para ventas propias del supervisor</h4><p class="settings-help">El escalón se determina exclusivamente con las ventas válidas de ejecutivos no supervisores del módulo. Estas tarifas son independientes de las de la página 1.</p>
    <div class="sup-table-wrap"><table class="sup-metrics"><thead><tr><th>Escalón</th><th>Desde (%)</th><th>Venta ($)</th><th>Dental ($)</th><th>APP ($)</th><th>P0 ($)</th></tr></thead><tbody>${tiers}</tbody></table></div>
    <div class="sup-setting-actions"><button class="btn primary small" type="button" id="supSaveSettings">Guardar configuración de supervisor</button><span id="supSettingsStatus" class="muted">Los cambios no se enviarán hasta pulsar Guardar.</span></div>`;
}
function renderSupervisorCalculatorSettings(){const host=el('supSettingsEditor');if(host)host.innerHTML=supervisorFactorSettingsHtml();}
function initSupervisorCalculator(){
  populateSupervisorCalculatorFilters();renderSupervisorCalculator();renderSupervisorCalculatorSettings();
  el('supPage').addEventListener('click',e=>{if(e.target.closest('.sup-print-toggle'))e.stopPropagation();});
  el('supPage').addEventListener('toggle',e=>{if(e.target.matches('details[data-sup-fold]')&&e.target.isConnected)supFoldState[e.target.dataset.supFold]=e.target.open;},true);
  el('supPage').addEventListener('change',e=>{
    const cb=e.target.closest('input[data-sup-print]');if(!cb)return;
    supPrintState[cb.dataset.supPrint]=cb.checked;
    try{localStorage.setItem(SUP_PRINT_KEY,JSON.stringify(supPrintState));}catch(_){}
    syncSupPrintChecks();
  });
  el('supWeek').addEventListener('change',e=>{supView.week=e.target.value;supView.page=1;renderSupervisorCalculator();});
  el('supSupervisor').addEventListener('change',e=>{supView.selection=e.target.value;supView.page=1;renderSupervisorCalculator();});
  el('supSearch').addEventListener('input',()=>{supView.page=1;renderSupervisorCalculator();});
  el('supRecordTables').addEventListener('change',event=>{
    const target=event.target;const id=target.dataset.supIncidentId??target.dataset.supAppId??target.dataset.supDynamicBonusId;
    if(id===undefined)return;
    if(target.matches('[data-sup-incident-id]')){target.disabled=true;void saveIncidentFromRow(id,target.checked).catch(error=>{alert(error.message||error);syncIncidentDisplays();});return;}
    else if(target.matches('[data-sup-app-id]')){if(!target.checked)imported.appDisabled.add(id);else imported.appDisabled.delete(id);}
    else if(target.matches('[data-sup-dynamic-bonus-id]')){if(target.checked)imported.dynamicBonuses.add(id);else imported.dynamicBonuses.delete(id);}
    saveFolioFlags();renderSupervisorCalculator();
    if(importActive()){computeImportedBase();renderRecords();}
    renderAchievements();renderAllRecords();renderTeam();
  });
  el('supSettingsEditor').addEventListener('click',event=>{
    if(event.target.id!=='supSaveSettings')return;
    const editor=el('supSettingsEditor');let next=structuredClone(supSettings);let invalid=null;
    for(const input of editor.querySelectorAll('input[data-sup-group]')){
      const {supGroup:group,supKey:key}=input.dataset;
      const empty=input.value.trim()==='';
      const nullable=empty&&(group==='goals'||group==='maximum'||group==='additional-amount'||(group==='root'&&key==='baseBonus'));
      if(empty&&!nullable){invalid=`El campo ${input.closest('label')?.textContent.trim()||key} es obligatorio.`;break;}
      const n=empty?null:supNumber(input.value,{positive:group==='required'||group==='additional-threshold',whole:group==='goals'});
      if(n===null&&!nullable){invalid=`Revisa ${input.closest('label')?.textContent.trim()||key}.`;break;}
      if(group==='root')next[key]=n;
      else if(group==='goals'){if(n===null)delete next.goals[key];else next.goals[key]=n;}
      else if(group==='additional-threshold')next.additional[Number(key)].threshold=n;
      else if(group==='additional-amount')next.additional[Number(key)].amount=n;
      else if(group==='incidence')next.incidencePenalties[Number(key)]=n;
      else next[group][key]=n;
    }
    if(!invalid)for(const input of editor.querySelectorAll('input[data-sup-tier]')){
      const n=supNumber(input.value,{positive:input.dataset.supTierKey==='min'});
      if(n===null){invalid='Revisa los importes y umbrales de los escalones.';break;}
      next.tiers[Number(input.dataset.supTier)][input.dataset.supTierKey]=n;
    }
    if(invalid){el('supSettingsStatus').textContent=invalid;el('supSettingsStatus').style.color='#b33939';return;}
    if(!saveDynamicSettings())return;
    next.ownP0UseModule=editor.querySelector('[data-sup-p0-basis="module"]')?.checked===true;
    next.includeSupervisorSales=editor.querySelector('[data-sup-include-sales]')?.checked===true;
    supSettings=normalizeSupervisorCommission(next);saveSupervisorCalculatorSettings();
    el('supSettingsStatus').textContent='Configuración guardada localmente'+(isAuthorized()?' · sincronización en cola.':'. Inicia sesión para sincronizarla.');
    el('supSettingsStatus').style.color='';
    toggleSettings(false);
  });
}

function refreshAuthorizedPages(){
  // Todas las páginas son visibles; datos e incidencias persistentes requieren Identity.
  applyNavOrder();
  if(activePage==='accumulated')renderAccumulated();
  if(activePage==='weekly')renderWeekly();
  if(activePage==='visits')window.VISITS?.refreshSources();
  if(activePage==='achievements')renderAchievements();
  if(activePage==='supervisor'){populateSupervisorCalculatorFilters();renderSupervisorCalculator();}
  if(activePage==='history'){populateHistoryFilters();renderHistory();}
  if(activePage==='moduleHistory'){populateModuleFilters();renderModuleHistory();}
}


function renderGroupNav(){
 const holder=el('appGroupNav');if(!holder)return;
 holder.innerHTML=pageNavigation.groupOrder.map(g=>`<button type="button" class="app-group-btn ${g===activeGroup?'active':''}" data-group-nav="${g}">${esc(GROUP_LABELS[g])}</button>`).join('');
}
function applyNavOrder(){
 const nav=document.querySelector('.app-navigation');if(!nav)return;
 for(const page of pageNavigation.order){const tab=nav.querySelector(`[data-page-tab="${page}"]`);if(tab){nav.appendChild(tab);tab.hidden=pageNavigation.groupBy[page]!==activeGroup;}}
 renderGroupNav();
}
function renderNavOrderEditor(){
 const host=el('pageOrderList');if(!host)return;
 const groupHolder=el('groupOrderList');
 groupHolder.innerHTML=pageNavigation.groupOrder.map((g,i)=>`<div class="page-order-row"><b>${esc(GROUP_LABELS[g])}</b><div class="page-order-actions"><button type="button" data-group-move="${g}" data-order-dir="-1" ${i===0?'disabled':''} title="Subir categoría">↑</button><button type="button" data-group-move="${g}" data-order-dir="1" ${i===pageNavigation.groupOrder.length-1?'disabled':''} title="Bajar categoría">↓</button></div></div>`).join('');
 host.innerHTML=pageNavigation.groupOrder.filter(g=>g!=='settings').flatMap(group=>{
  const pages=pageNavigation.order.filter(p=>pageNavigation.groupBy[p]===group);
  return [`<h4>${esc(GROUP_LABELS[group])}</h4>`,...pages.map((page,index)=>`<div class="page-order-row"><b>${index+1}. ${esc(PAGE_LABELS[page])}</b><div class="page-order-actions"><button type="button" data-order-move="${page}" data-order-dir="-1" title="Subir página" ${index===0?'disabled':''}>↑</button><button type="button" data-order-move="${page}" data-order-dir="1" title="Bajar página" ${index===pages.length-1?'disabled':''}>↓</button></div><label>Categoría <select data-page-group="${page}">${Object.keys(GROUP_LABELS).filter(g=>g!=='settings').map(g=>`<option value="${g}" ${group===g?'selected':''}>${esc(GROUP_LABELS[g])}</option>`).join('')}</select></label><label><input type="radio" name="navMainPage" value="${page}" ${page===pageNavigation.home?'checked':''}> Principal</label></div>`)]
 }).join('');
}
function saveNavSettings(){
 try{localStorage.setItem(PAGE_NAV_KEY,JSON.stringify(pageNavigation));}catch(error){el('pageOrderStatus').textContent='No se pudo guardar: '+error.message;return;}
 applyNavOrder();el('pageOrderStatus').textContent='Categorías, páginas y principal guardadas'+(isAuthorized()?' · sincronización en cola.':'. Inicia sesión para sincronizar.');
}
function initNavOrder(){
 pageNavigation=loadNavSettings();activeGroup=pageNavigation.groupBy[activePage]||'analysis';applyNavOrder();renderNavOrderEditor();
 el('appGroupNav').addEventListener('click',event=>{
  const btn=event.target.closest('[data-group-nav]');if(!btn)return;
  const group=btn.dataset.groupNav;
  if(group==='settings'){el('toggleSettings').click();return;}
  const first=pageNavigation.order.find(k=>pageNavigation.groupBy[k]===group);
  if(first)switchPage(first);
 });
 el('groupOrderList').addEventListener('click',event=>{
  const btn=event.target.closest('[data-group-move]');if(!btn)return;
  const index=pageNavigation.groupOrder.indexOf(btn.dataset.groupMove),next=index+Number(btn.dataset.orderDir);
  if(index<0||next<0||next>=pageNavigation.groupOrder.length)return;
  [pageNavigation.groupOrder[index],pageNavigation.groupOrder[next]]=[pageNavigation.groupOrder[next],pageNavigation.groupOrder[index]];
  renderNavOrderEditor();el('pageOrderStatus').textContent='Categorías reordenadas. Pulsa Guardar.';
 });
 el('pageOrderList').addEventListener('click',event=>{
  const btn=event.target.closest('[data-order-move]');if(!btn)return;
  const pages=pageNavigation.order.filter(k=>pageNavigation.groupBy[k]===pageNavigation.groupBy[btn.dataset.orderMove]);
  const index=pages.indexOf(btn.dataset.orderMove),next=index+Number(btn.dataset.orderDir);
  if(index<0||next<0||next>=pages.length)return;
  const a=pageNavigation.order.indexOf(pages[index]),b=pageNavigation.order.indexOf(pages[next]);
  [pageNavigation.order[a],pageNavigation.order[b]]=[pageNavigation.order[b],pageNavigation.order[a]];
  renderNavOrderEditor();el('pageOrderStatus').textContent='Orden modificado. Pulsa Guardar.';
 });
 el('pageOrderList').addEventListener('change',event=>{
  if(event.target.name==='navMainPage')pageNavigation.home=event.target.value;
  if(event.target.matches('[data-page-group]'))pageNavigation.groupBy[event.target.dataset.pageGroup]=event.target.value;
  renderNavOrderEditor();el('pageOrderStatus').textContent='Organización modificada. Pulsa Guardar.';
 });
 el('savePageOrder').addEventListener('click',saveNavSettings);
 el('resetPageOrder').addEventListener('click',()=>{pageNavigation=validNavSettings(null);renderNavOrderEditor();saveNavSettings();});
}

function updateFloatingExport(){
  const isDaily=activePage==='daily',isVisit=activePage==='visits',isIncident=activePage==='incidents';
  el('dailyCopyWhatsApp').hidden=!isDaily;
  el('floatCsv').hidden=isVisit||activePage==='history'||activePage==='moduleHistory';
  el('floatPdf').hidden=false;el('floatPng').hidden=false;
  el('floatingExportMenu').hidden=true;el('floatingExportToggle').setAttribute('aria-expanded','false');
  el('floatCsv').textContent=isIncident?'Exportar incidencias CSV':'Exportar CSV';
}
function initFloatingExport(){
  const menu=el('floatingExportMenu'),toggle=el('floatingExportToggle');
  toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));});
  const action=(id,fn)=>el(id).addEventListener('click',()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');fn();});
  action('floatPdf',()=>el(activePage==='visits'?'visitPdf':'print').click());
  action('floatPng',()=>el(activePage==='visits'?'visitPng':'exportImage').click());
  action('floatCsv',()=>activePage==='incidents'?exportIncidentCsv():el('export').click());
  el('dailyCopyWhatsApp').addEventListener('click',()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');});
  document.addEventListener('click',event=>{if(!el('floatingExport').contains(event.target)){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}});
  updateFloatingExport();
}
function mondayReminderKey(){return 'wmSamsMondayXlsV250:'+String(window.APP_CLOUD?.user?.id||'guest');}
function initMondayReminder(){
  const modal=el('xlsMondayReminder'),dismiss=el('mondayDismiss');
  function hide(){modal.hidden=true;}
  function acknowledge(){try{localStorage.setItem(mondayReminderKey(),dateIso(new Date()));}catch(_){}hide();}
  dismiss.addEventListener('click',acknowledge);
  el('mondayUpload').addEventListener('click',()=>{acknowledge();el('xlsInput').click();});
  modal.addEventListener('click',event=>{if(event.target===modal)acknowledge();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)acknowledge();});
  function maybeShow(){
    const now=new Date();if(now.getDay()!==1||!modal.hidden)return;
    if(localStorage.getItem(mondayReminderKey())!==dateIso(now))modal.hidden=false;
  }
  // Al abrir la aplicación y al volver a ella un lunes (sin recordatorios repetitivos).
  setTimeout(maybeShow,250);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)maybeShow();});
  window.addEventListener('focus',maybeShow);
}
function switchPage(page){
  activePage=DEFAULT_PAGE_ORDER.includes(page)?page:pageNavigation.home;
  document.body.dataset.page=activePage;
  el('teamPage').hidden=activePage!=='team';
  el('dailyPage').hidden=activePage!=='daily';
  el('accumulatedPage').hidden=activePage!=='accumulated';
  el('weeklyPage').hidden=activePage!=='weekly';
  el('visitPage').hidden=activePage!=='visits';
  el('allRecordsPage').hidden=activePage!=='allrecords';
  el('achievementsPage').hidden=activePage!=='achievements';
  el('supPage').hidden=activePage!=='supervisor';
  el('incidencePage').hidden=activePage!=='incidents';
  el('historyPage').hidden=activePage!=='history';
  el('moduleHistoryPage').hidden=activePage!=='moduleHistory';
  activeGroup=pageNavigation.groupBy[activePage]||'analysis';
  applyNavOrder();
  for(const b of document.querySelectorAll('[data-page-tab]')){const yes=b.dataset.pageTab===activePage;b.classList.toggle('active',yes);b.setAttribute('aria-selected',String(yes));}
  if(activePage==='team')renderTeam();
  if(activePage==='daily')renderDaily();
  if(activePage==='accumulated')renderAccumulated();
  if(activePage==='weekly')renderWeekly();
  if(activePage==='visits')window.VISITS?.open();
  if(activePage==='allrecords')renderAllRecords();
  if(activePage==='achievements'){populateAchFilters();renderAchievements();}
  if(activePage==='supervisor'){populateSupervisorCalculatorFilters();renderSupervisorCalculator();}
  if(activePage==='incidents')renderIncidencePage();
  if(activePage==='history'){populateHistoryFilters();renderHistory();}
  if(activePage==='moduleHistory'){populateModuleFilters();renderModuleHistory();}
  updateFloatingExport();
  if(el('settingsPanel').open){el('settingsPanel').open=false;el('toggleSettings').setAttribute('aria-expanded','false');}
}
for(const b of document.querySelectorAll('[data-page-tab]'))b.addEventListener('click',()=>switchPage(b.dataset.pageTab));
el('dailyCopyWhatsApp').addEventListener('click',copyDailyWhatsApp);
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
    const dynamicBonusCount=Math.min(validSales,Math.max(0,Math.floor(Number(d.dynamicBonusCount)||0)));
    const dynamicBonus=round(dynamicBonusCount*dynamicBonusAmount());
    const netBeforeDynamic=round(afterPenalty-d.recover);
    const net=round(netBeforeDynamic+dynamicBonus);
    const nextTarget=TIER.find(x=>x.min>completion);
    const needed=nextTarget?Math.max(0,Math.ceil(nextTarget.min*d.goal/100-1e-10)-validSales):0;
    return {ok:true,warnings,validReg,validGuar,validSales,validDental,validApp,validP0,excludedSales,completion,tier,p0rate,p0Penalty,incPenalty,penalty,salePay,dentalPay,appPay,p0Pay,gross,bonus,beforePenalty,p0Discount,incidenceDiscount,discounts,afterPenalty,recover:d.recover,dynamicBonusCount,dynamicBonus,netBeforeDynamic,net,nextTarget,needed,inc:d.inc,goal:d.goal};
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
    // Una tarifa puede ajustarse localmente también en modo invitado.
    // Las escrituras de ajustes a PostgreSQL exigen sesión autenticada.
    const index=Number(input.dataset.rateIndex),field=input.dataset.rateKey,value=Number(input.value);
    if(!Number.isInteger(index)||index<0||index>=TIER.length||!RATE_FIELDS.includes(field)||input.value.trim()===''||!validRateAmount(value)){
      el('rateEditorStatus').textContent='Importe no válido: utiliza un valor de 0 a 1,000,000 con máximo dos decimales.';
      renderCommissionRateEditor();return;
    }
    TIER[index][field]=value;saveCommissionRates();refreshAfterRateChange();
    el('rateEditorStatus').textContent=`Tarifa actualizada: ${RATE_LABELS[field]}, escalón ${TIER[index].label} = ${mx(value)}.`;
  });
  el('restoreDefaultRates').addEventListener('click',()=>{
    if(!confirm('¿Restaurar todas las tarifas originales del esquema de comisiones?'))return;
    DEFAULT_TIER.forEach((row,i)=>RATE_FIELDS.forEach(field=>{TIER[i][field]=row[field];}));
    saveCommissionRates();renderCommissionRateEditor();refreshAfterRateChange();
    el('rateEditorStatus').textContent='Tarifas originales restauradas.';
  });
  window.CALC_ENGINE={calculate,tiers:TIER};

  function setForm(which){for(const k of KEYS){const input=document.querySelector(`[data-scenario="${which}"] [data-field="${k}"]`);input.value=state[which][k];}}
  function syncForm(which){const d={dynamicBonusCount:state[which].dynamicBonusCount||0};for(const k of KEYS){const input=document.querySelector(`[data-scenario="${which}"] [data-field="${k}"]`);d[k]=input.value===''?NaN:Number(input.value);}state[which]=d;}
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
    return [...PAYMENT_CONCEPTS,['Bono por dinámica','dynamicBonus','dynamicBonusCount','dynamicBonus']].map(([label,totalKey,qtyKey,rateKey])=>({
      label,totalKey,quantity:qtyKey?r[qtyKey]:(r.inc===0&&r.tier?1:0),
      rate:rateKey==='dynamicBonus'?dynamicBonusAmount():r.tier?.[rateKey]||0,total:r[totalKey]
    }));
  }
  function paymentBreakdownHtml(r){
    if(!r.ok)return '';
    const items=paymentConcepts(r);
    return `<div class="commission-detail"><div class="commission-detail-title">Pago por concepto <span>cantidad × tarifa unitaria</span></div><div class="concept-pay-list">${items.map(item=>`<div class="concept-pay-row"><span class="concept-name">${esc(item.label)}</span><span class="concept-amount"><strong>${mx(item.total)}</strong> <small>(${number.format(item.quantity)} × ${mx(item.rate)})</small></span></div>`).join('')}</div><div class="commission-detail-foot">Bono por dinámica ${r.dynamicBonusCount} × ${mx(dynamicBonusAmount())}: <b>+${mx(r.dynamicBonus)}</b> (se suma después de todos los descuentos). Antes de descuentos: <b>${mx(r.beforePenalty)}</b> · Descuentos: <b>−${mx(r.discounts)}</b>${r.recover?` · Recuperación: <b>−${mx(r.recover)}</b>`:''}</div></div>`;
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
      ['Neto después de porcentajes','afterPenalty','money','subtotal'],['Folios pagados antes: recuperación','recover','negMoney'],['Bono por dinámica (al final)','dynamicBonus','money'],['TOTAL NETO SEMANAL','net','money','final']
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
  el('print').addEventListener('click',async()=>{
    try{
      if(activePage==='achievements')await preloadWeeklyAdminAssets();
      refreshAuthorizedPages();buildReport();window.print();
    }catch(error){alert('No se pudo preparar el PDF: '+error.message);}
  });
  el('export').addEventListener('click',()=>{
    if(activePage==='incidents'){exportIncidentCsv();return;}
    if(activePage==='supervisor'){
      const c=supervisorCalculator();if(!c.ready){alert(c.reason);return;}
      const lines=[['CALCULADORA DE SUPERVISOR','Valor'],['Supervisor',c.selected.name],['Módulo',c.selected.module],['Semana',weekLabel(supView.week)],['Objetivo de ventas',c.goal],['Ventas válidas del equipo',c.teamValid.length],['Incluir ventas del supervisor',c.includeSupervisorSales?'Sí':'No'],['Ventas propias incluidas en cumplimiento',c.includeSupervisorSales?c.ownValid.length:0],['Ventas válidas del módulo para cumplimiento',c.completionSales],['Cumplimiento para escalón propio %',c.teamCompletion],['Cumplimiento %',c.completion],['Calidad total %',c.q.composite],['Alcance global %',c.q.global],['Bono base',supSettings.baseBonus??'Sin configurar'],['Cálculo base',c.base],...c.additional.map(b=>['Bono '+b.threshold+'%',b.configured?b.earned:'Sin configurar']),['Penalización Plan Cero módulo %',c.modulePenalty],['Descuento Plan Cero módulo',c.incentiveDiscount],['Bono neto módulo',c.incentiveNet],['Ventas propias brutas',c.ownGross],['Penalización Plan Cero propias %',c.ownP0Penalty],['Penalización incidencias propias %',c.ownIncPenalty],['Ventas propias netas',c.ownNet],['Bono por dinámica · ventas propias',c.ownDynamicBonus],['Cantidad de folios con dinámica',c.ownDynamicBonusCount],['TOTAL ESTIMADO',c.total],[],['CALIDAD','Alcance %','Calidad %'],...SUP_FACTOR_KEYS.map(k=>[SUP_FACTOR_LABELS[k],c.q.actual[k],c.q.factors[k]]),[],['PAGO POR CONCEPTO','Cantidad','Tarifa','Total'],...c.parts.map(x=>[x.name,x.count,x.rate,x.total])];
      for(const [title,rows] of [['FOLIOS DE EJECUTIVOS',c.src.team],['FOLIOS DE SUPERVISOR',c.src.own]]){
        lines.push([], [title,'Fecha','Ejecutivo','Folio','Código','P0','Dental','APP','Incidencia','Bono adicional']);
        for(const r of [...rows].sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.i-a.i))lines.push(['',r.fecha,r.executive,r.folio,r.code,r.p0,r.dental,appEnabled(r)?'Sí':'No',selectedIncident(r)?'Sí':'No',getCellText(r,'dynamicBonus')]);
      }
      const csv='\ufeff'+lines.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`supervisor_${supView.week||'sin_semana'}.csv`);return;
    }
    if(activePage==='achievements'){
      const {metricList,counts,goals,filteredRows:records}=achData(),cols=allRecordsColumns();
      const lines=[];
      if(achPrintEnabled('filters'))lines.push(['FILTROS APLICADOS','Valor'],...achPrintFilters(),[]);
      if(achPrintEnabled('goals'))lines.push(['OBJETIVOS EN CANTIDADES Y PORCENTAJES','Meta'],...Object.entries(ACH_GOAL_INPUTS).map(([key])=>[ACH_GOAL_LABELS[key],achGoalText(key,goals[key])]),[]);
      if(achPrintEnabled('percentages'))lines.push(['LOGROS POR PORCENTAJE','Alcance real','Calidad'],...metricList.map(m=>[m.name,qualityPercentText(m.reach),qualityPercentText(m.quality)]),[]);
      if(achPrintEnabled('quantities')){
        const targets={'Registros':'records','Ventas con código':'sales','Plan Dental':'dental','Plan Cero':'p0','Primera compra':'purchase','APP activadas':'app'};
        lines.push(['LOGROS EN CANTIDADES','Real','Meta / % requerido'],...counts.map(([label,value])=>[label,value,targets[label]?achGoalText(targets[label],goals[targets[label]]):'—']),[]);
      }
      if(achPrintEnabled('records'))lines.push(['REGISTROS XLS · '+(achValue('achWeek')?weekLabel(achValue('achWeek')):'Sin semana'),achValue('achModule')||'Todos los módulos'],cols.map(columnLabel),...records.map(r=>cols.map(c=>getCellText(r,c.key))));
      if(!lines.length)lines.push(['Sin secciones seleccionadas para exportar']);
      const csv='\ufeff'+lines.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`logros_semanales_${achValue('achWeek')||'sin_semana'}.csv`);return;
    }
    if(activePage==='allrecords'){
      const columns=allRecordsColumns(),rows=getAllRecordsFiltered();
      const records=[columns.map(columnLabel),...rows.map(r=>columns.map(c=>c.key.startsWith('raw:')?displayXlsValue(getCellText(r,c.key)):getCellText(r,c.key)))];
      const csv='\ufeff'+records.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`registros_manuales_${dateIso(new Date())}.csv`);return;
    }
    if(activePage==='weekly'){
      const {primary,previous,main,older}=weeklyVarianceData();
      const lines=[['Sección','Semana','Módulo',...WEEKLY_DISPLAY_METRICS.map(k=>WEEKLY_LABELS[k]),'Calidad']];
      for(const [week,data] of [[primary,main],[previous,older]]){
        const value=(g,k)=>weeklyMetricValue(g.metrics,g.rows,k);
        const q=qualityResult(data.rows,'module','TOTAL','weekly',weeklyGoalFor(week,'sales',primary,data.totals.metrics)||null);
        lines.push(['OBJETIVOS',week,'TOTAL',...WEEKLY_DISPLAY_METRICS.map(k=>k==='reg'||k==='guar'?'':k==='app'||k==='purchase'?weeklyTargetPct(k):weeklyGoalExport(week,k,primary,data.totals.metrics)),weeklyTargetPct('quality')]);
        for(const item of data.entries)lines.push(['MÓDULO',week,item.name,...WEEKLY_DISPLAY_METRICS.map(k=>value(item,k)),qualityPercentText(qualityResult(item.rows,'module',item.name,'weekly').global)]);
        lines.push(['TOTAL',week,'TOTAL',...WEEKLY_DISPLAY_METRICS.map(k=>value(data.totals,k)),qualityPercentText(q.global)]);
        lines.push(['CUMPLIMIENTO %',week,'TOTAL',...WEEKLY_DISPLAY_METRICS.map(k=>{
          if(k==='reg'||k==='guar')return '';
          if(k==='app'||k==='purchase')return data.totals.metrics.sales?round(100*value(data.totals,k)/data.totals.metrics.sales):'';
          const goal=weeklyGoalFor(week,k,primary,data.totals.metrics);
          return goal?round(100*data.totals.metrics[k]/goal):'';
        }),qualityPercentText(q.composite)]);
        lines.push(['CALIDAD DE FACTORES %',week,'TOTAL',...weeklyFactorValues(week,primary,data,q).map(v=>v?v.value:'' )]);
        lines.push(['ALCANCE GLOBAL %',week,'TOTAL',...WEEKLY_DISPLAY_METRICS.map(()=>''),qualityPercentText(q.global)]);
      }
      lines.push(['VARIACIÓN',`${primary} vs ${previous}`,'TOTAL',...WEEKLY_DISPLAY_METRICS.map(k=>weeklyMetricValue(main.totals.metrics,main.rows,k)-weeklyMetricValue(older.totals.metrics,older.rows,k)),'']);
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
      const lines=[['Ejecutivo','Módulo','Semana','Meta','Cumplimiento %','Ventas regulares','Ventas garantizadas','Ventas totales','APP','Programa Cero','Plan Dental','Incidencias','Escalón','Folios dinámica','Bono por dinámica MXN','Comisión estimada MXN'],...items.map(e=>{const r=e.result;return [e.name,e.module,weekLabel(imported.week),e.goal,r.ok?r.completion:'',r.ok?r.validReg:'',r.ok?r.validGuar:'',r.ok?r.validSales:'',r.ok?r.validApp:'',r.ok?r.validP0:'',r.ok?r.validDental:'',e.inputs.inc,briefTier(r),r.ok?r.dynamicBonusCount:'',r.ok?r.dynamicBonus:'',r.ok?r.net:'Revisar']})];
      const csv='\ufeff'+lines.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
      saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`comparativo_ejecutivos_${imported.week}.csv`);return;
    }
    const a=calculate(state.base),b=calculate(state.sim);
    if(!a.ok||!b.ok){alert('Corrige los datos antes de exportar.');return;}
    const rows=[['Concepto','Base','Simulación','Diferencia']];
    const measures=[['Meta semanal','goal'],['Ventas regulares válidas','validReg'],['Ventas garantizadas válidas','validGuar'],['Ventas válidas','validSales'],['Cumplimiento %','completion'],['Programa Cero %','p0rate'],['Comisión por ventas','salePay'],['Comisión dental','dentalPay'],['Comisión APP','appPay'],['Comisión P0','p0Pay'],['Subtotal','gross'],['Bono','bonus'],['Penalización P0 %','p0Penalty'],['Penalización incidencias %','incPenalty'],['Descuento total','discounts'],['Descuento previo','recover'],['Bono por dinámica','dynamicBonus'],['NETO','net']];
    for(const [label,key] of measures){const x=asNum(a[key]),y=asNum(b[key]);rows.push([label,x===null?'Exento':x,y===null?'Exento':y,x===null||y===null?'':round(y-x)]);}
    rows.push([],['DETALLE DE PAGO','Escenario base','Simulación','Diferencia']);
    for(const [label,totalKey] of [...PAYMENT_CONCEPTS,['Bono por dinámica','dynamicBonus']]){
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
  // Los Ajustes se pueden explorar y editar sin cuenta. La sincronización de
  // preferencias y el historial privado permanecen protegidos por Identity.
  function refreshWeeklyAdminSettingsEditor(){
    const scope=el('weeklyAdminSettingsEditor');if(!scope)return;
    for(const field of scope.querySelectorAll('[data-weekly-admin-setting]')){
      const name=field.dataset.weeklyAdminSetting,value=weeklyAdminPrefs[name];
      if(field.type==='checkbox')field.checked=Boolean(value);
      else field.value=String(value??'');
    }
    el('weeklyAdminSettingsStatus').textContent='Plantilla preparada. Las modificaciones se aplican a Logros semanales.';
  }
  function commitWeeklyAdminSettings(){
    const scope=el('weeklyAdminSettingsEditor');if(!scope)return true;
    const next={...weeklyAdminPrefs};
    for(const field of scope.querySelectorAll('[data-weekly-admin-setting]')){
      const key=field.dataset.weeklyAdminSetting;
      next[key]=field.type==='checkbox'?field.checked:field.type==='number'?Number(field.value):field.value;
    }
    for(const key of ['commentsLines','planLines']){
      if(!Number.isInteger(next[key])||next[key]<2||next[key]>8){
        el('weeklyAdminSettingsStatus').textContent='Selecciona entre 2 y 8 líneas por recuadro.';
        scope.querySelector(`[data-weekly-admin-setting="${key}"]`).focus();return false;
      }
    }
    weeklyAdminPrefs=cleanWeeklyAdminSettings(next);
    try{localStorage.setItem(WEEKLY_ADMIN_STORAGE,JSON.stringify(weeklyAdminPrefs));}
    catch(e){el('weeklyAdminSettingsStatus').textContent='No se pudieron guardar los ajustes: '+e.message;return false;}
    el('weeklyAdminSettingsStatus').textContent='Guardado. '+(isAuthorized()?'Sincronización en cola con Netlify.':'Se conservará localmente en este navegador.');
    return true;
  }
  function initWeeklyAdminSettings(){
    refreshWeeklyAdminSettingsEditor();
    el('weeklyAdminSave').addEventListener('click',commitWeeklyAdminSettings);
    el('weeklyAdminReset').addEventListener('click',()=>{
      weeklyAdminPrefs=cleanWeeklyAdminSettings(WEEKLY_ADMIN_DEFAULTS);
      refreshWeeklyAdminSettingsEditor();commitWeeklyAdminSettings();
    });
    // Menú de Ajustes mediante botones. Solo se ve el apartado elegido.
    const details=[...el('settingsPanel').querySelectorAll('.settings-panel-content > details.settings-group')];
    const nav=el('settingsSectionsNav');
    nav.innerHTML=details.map((node,i)=>{
      const label=(node.querySelector(':scope > summary')?.textContent||node.id).replace(/^\s*\d+\s*[·.]?\s*/,'').trim();
      return `<button class="settings-section-button" type="button" data-settings-group="${node.id}" aria-expanded="false">${i+1}. ${esc(label)}</button>`;
    }).join('');
    nav.addEventListener('click',e=>{
      const btn=e.target.closest('[data-settings-group]');if(!btn)return;
      const target=el(btn.dataset.settingsGroup),willOpen=!target.open;
      details.forEach(node=>node.open=willOpen&&node===target);
      nav.querySelectorAll('[data-settings-group]').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.settingsGroup===btn.dataset.settingsGroup&&willOpen)));
      if(willOpen)target.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    for(const detail of details)detail.addEventListener('toggle',()=>{
      const btn=nav.querySelector(`[data-settings-group="${detail.id}"]`);
      if(btn)btn.setAttribute('aria-expanded',String(detail.open));
    });
    el('settingsPanel').classList.add('settings-chooser-ready');
  }
  const settingsDialog=el('settingsPanel');
  function toggleSettings(force){
    settingsDialog.open=typeof force==='boolean'?force:!settingsDialog.open;
    el('toggleSettings').setAttribute('aria-expanded',String(settingsDialog.open));
    if(settingsDialog.open)settingsDialog.scrollIntoView({behavior:'smooth',block:'start'});
    else el('toggleSettings').focus();
  }
  el('guestSettingsNotice').hidden=isAuthorized();
  el('authLogout').hidden=!isAuthorized();
  el('authLogout').addEventListener('click',()=>{void window.APP_CLOUD?.logout?.();});
  el('toggleSettings').addEventListener('click',()=>toggleSettings());
  el('closeSettings').addEventListener('click',()=>toggleSettings(false));
  function saveDynamicSettings(){
    const input=el('dynamicBonusAmount'),msg=el('dynamicBonusStatus');
    const raw=input.value.trim(),value=Number(raw);
    if(!raw||!validRateAmount(value)){
      msg.textContent='Monto inválido. Usa pesos MXN de 0 a 1,000,000 y máximo dos decimales.';
      input.focus();return false;
    }
    dynamicBonusConfig={amount:value};
    try{localStorage.setItem(DYNAMIC_BONUS_KEY,JSON.stringify(dynamicBonusConfig));}catch(err){msg.textContent='No se pudo guardar el importe: '+err.message;return false;}
    msg.textContent='Bono por dinámica guardado: '+mx(value)+(isAuthorized()?' · sincronización pendiente.':' · solo en este dispositivo.');
    if(importActive())computeImportedBase();
    renderTeam();renderSupervisorCalculator();renderRecords();renderAllRecords();renderAchievements();
    return true;
  }
  // Cualquiera de los tres botones Guardar valida ambos editores y cierra al terminar.
  el('dynamicBonusAmount').value=dynamicBonusAmount();
  el('dynamicBonusStatus').textContent='Importe configurado: '+mx(dynamicBonusAmount())+' por venta válida marcada.';
  el('saveDynamicBonus').addEventListener('click',()=>el('supSaveSettings').click());
  el('saveSettingsAndClose').addEventListener('click',()=>{if(!commitHistorySettings()||!commitWeeklyAdminSettings())return;saveNavSettings();el('supSaveSettings').click();});
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
  // Versión 2.3: textos comunes a PDF y PNG. El título es global y el resto es por página.
  const REPORT_TEXT_STORAGE='wmSamsMeridaReportTextsV17';
  const REPORT_TEXT_DEFAULTS={
    individual:{subtitle:'Calculadora individual',description:'Comisiones simuladas: pueden existir variaciones respecto al monto final a pagar.',footer:'Lee los importes del escenario base y de la simulación. El desglose muestra tarifas, bono, incidencias, descuentos y pago neto estimado; los folios no comisionables no generan pago.'},
    team:{subtitle:'Comparativo de ejecutivos',description:'Comisiones simuladas: pueden existir variaciones respecto al monto final a pagar.',footer:'Cada fila corresponde a un ejecutivo. Compara su meta, ventas comisionables, nivel de cumplimiento y comisión estimada. Las incidencias y ajustes pueden modificar el importe final.'},
    daily:{subtitle:'Comparativa diaria',description:'Actividad operativa de registros manuales · Totales y variación entre fechas seleccionadas.',footer:'Cada cifra presenta el resultado del día principal y su variación frente al día comparado. Calidad Total es el promedio de Cumplimiento, Primera compra, Programa Cero y APP, topado a 100%; Alcance Global es el promedio de esas cuatro calidades más Calidad Total, sin tope. Dental es informativo; el filtro permite incluir o excluir supervisores.'},
    accumulated:{subtitle:'Acumulado general',description:'Resultados consolidados del historial de registros manuales guardados.',footer:'Totales de los registros manuales históricos deduplicados. Cumplimiento se calcula con las metas semanales y cada calidad divide el alcance real entre el requerido. Calidad Total promedia cuatro calidades con tope de 100% y Alcance Global promedia cinco valores sin tope. El filtro permite incluir o excluir supervisores.'},
    weekly:{subtitle:'Comparativa semanal',description:'Objetivos, resultados y cumplimiento por semana completa de lunes a domingo.',footer:'OBJETIVOS define metas por semana; CUMPLIMIENTO = resultado / objetivo; CALIDAD DE FACTORES aplica el porcentaje requerido, mínimo y máximo configurados para cada factor; ALCANCE GLOBAL = promedio de las cuatro calidades (Cumplimiento, Primera compra, Programa Cero y Activaciones) más Calidad Total, dividido entre cinco; sin tope. Los supervisores se incluyen según la casilla superior.'},
    allrecords:{subtitle:'Consulta de registros manuales',description:'Vista íntegra de los registros cargados, con filtros operativos combinados.',footer:'Se muestran las filas de los registros manuales activos que cumplen todos los filtros seleccionados. La columna Incidencia excluye pagos del folio; APP refleja la activación habilitada en el Dashboard. Filtrar no altera los cálculos.'},
    achievements:{subtitle:'Logros semanales',description:'Metas de registros y ventas en cantidades; planes, APP y primera compra en porcentajes requeridos.',footer:'Alcance real (número grande) = obtenido ÷ base u objetivo. Calidad (número pequeño) = alcance ÷ porcentaje requerido, con mínimos y máximos configurados. Todos los filtros de la tabla afectan los indicadores; los folios con incidencia se muestran, pero no cuentan para sus cálculos.'},
    incidents:{subtitle:'Gestión de incidencias',description:'Historial permanente de incidencias independiente de los registros manuales.',footer:'Los folios con incidencia activa se excluyen de las comisiones. El estado Resuelta no elimina automáticamente la exclusión; desactiva la incidencia por separado cuando corresponda.'},
    supervisor:{subtitle:'Calculadora de supervisor',description:'Bono por resultados del módulo y comisiones por ventas propias del supervisor.',footer:'Bono del módulo = bono base × Alcance Global × min(1, Cumplimiento del módulo / 100). Las ventas propias se incluyen en Cumplimiento cuando su casilla está activa; el escalón de pago propio usa solo ventas válidas del equipo. El bono adicional de 110/115/120% es único; se aplican penalizaciones configuradas.'}
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
    return `<footer class="report-foot"><div class="report-footnote"><strong>NOTA PARA LEER EL REPORTE</strong><p>${esc(reportTextFor(page).footer)}</p></div><div class="report-foot-version">Versión ${APP_VERSION}</div></footer>`;
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
/* Compactar solo el reporte semanal para evitar una segunda página de pie de nota. */
.report-page:has(.weekly-report-table) .report-foot{margin-top:10px;padding-top:9px}
.report-page:has(.weekly-report-table) .report-heading{margin-bottom:11px;padding-bottom:9px}
.report-page:has(.weekly-report-table) .report-section{margin-bottom:10px}
.report-page:has(.weekly-report-table) .report-daily-grid .weekly-report-table th{font-size:7px;padding:4px 2px}
.report-page:has(.weekly-report-table) .report-daily-grid .weekly-report-table td{font-size:8px;padding:3px 2px}
.report-page:has(.weekly-report-table) .report-foot-version{margin-top:8px}
.report-page .report-section-allrecords{break-inside:auto;page-break-inside:auto}.report-page .report-section-allrecords table{table-layout:fixed}.report-page .report-section-allrecords th,.report-page .report-section-allrecords td{font-size:8px;padding:5px 6px;text-align:left;white-space:normal;overflow-wrap:anywhere}.report-page .report-section-allrecords thead{display:table-header-group}.report-page .report-section-allrecords tr{break-inside:avoid;page-break-inside:avoid}
@media print{.report-page .report-section.report-section-allrecords{break-inside:auto!important;page-break-inside:auto!important;}.report-page .report-section-allrecords table{break-inside:auto!important;page-break-inside:auto!important;}}
`;
  function buildTeamReport(){
    const entries=filteredTeamEntries();
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    let valid=entries.filter(e=>e.result.ok);
    const sums=valid.reduce((v,e)=>{const r=e.result;v.sales+=r.validSales;v.goal+=r.goal;v.net+=r.net;return v},{sales:0,goal:0,net:0});
    const tr=entries.map(e=>{const r=e.result;return `<tr><td>${esc(e.name)}</td><td>${esc(e.module)}</td><td>${e.goal}</td><td>${r.ok?pct(r.completion):'—'}</td><td>${r.ok?r.validReg:'—'}</td><td>${r.ok?r.validGuar:'—'}</td><td>${r.ok?r.validSales:'—'}</td><td>${r.ok?r.validApp:'—'}</td><td>${r.ok?r.validP0:'—'}</td><td>${r.ok?r.validDental:'—'}</td><td>${r.inc||0}</td><td>${briefTier(r)}</td><td>${r.ok?r.dynamicBonusCount:0}</td><td>${r.ok?mx(r.dynamicBonus):'—'}</td><td>${r.ok?mx(r.net):'Revisar'}</td></tr>`}).join('');
    const headers=['Ejecutivo','Módulo','Meta','Cumpl.','Reg.','Gar.','Ventas','APP','P0','Dental','Inc.','Escalón','Folios din.','Dinámica','Comisión'];
    const html=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:#edf4fc">${reportHeaderMarkup("team",`Semana: ${esc(weekLabel(imported.week))} · Calculo manual desde google forms · ${entries.length} ejecutivos visibles · ${new Date().toLocaleString('es-MX')}`)}
      <section class="report-section report-section-team-summary" data-report-section="team-summary"><h2>Resumen del equipo</h2><div class="report-kpis"><div class="report-kpi"><div class="rlabel">Ejecutivos</div><div class="rval">${entries.length}</div></div><div class="report-kpi"><div class="rlabel">Ventas válidas</div><div class="rval">${sums.sales}</div></div><div class="report-kpi"><div class="rlabel">Comisiones estimadas</div><div class="rval">${mx(round(sums.net))}</div></div></div></section>
      <section class="report-section report-section-team" data-report-section="team"><h2>Comparativo por ejecutivo</h2><table class="team-export-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${tr||'<tr><td colspan="15">Sin registros para los filtros seleccionados.</td></tr>'}</tbody></table><p class="report-note">Metas individuales editables. APP considerada por cada venta válida, excepto desactivaciones manuales. Incidencias, estatus no pagables, descuentos y penalización de Programa Cero aplicados por ejecutivo. Los objetivos se presuponen en 10 salvo modificación.</p></section>${reportFootMarkup("team")}</div>`;
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
    renderAccumulated();
    const rows=el('accumulatedFrom').value&&el('accumulatedTo').value&&el('accumulatedFrom').value>el('accumulatedTo').value?[]:accumulatedRows();
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    const headers=['Registros','Ventas','Regul.','Garant.','P. Cero','Dental','Calidad'];
    const table=(groupBy,label)=>{
      const {entries,totals}=accumulatedGroups(rows,groupBy);
      const cells=group=>`<tr${group.name==='TOTAL'?' class="daily-total-row"':''}><td>${esc(group.name)}</td>${DAILY_METRICS.map(key=>`<td>${group.metrics[key]}</td>`).join('')}<td>${qualityPercentText(qualityResult(group.rows,groupBy,group.name,'accumulated').global)}</td></tr>`;
      return `<div><h3>${label} · ${entries.length}</h3><table class="daily-report-table"><thead><tr><th>${groupBy==='module'?'Módulo':'Ejecutivo'}</th>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${entries.map(cells).join('')||'<tr><td colspan="8">Sin registros en el periodo</td></tr>'}</tbody><tfoot>${entries.length?cells(totals):''}</tfoot></table></div>`;
    };
    const html=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:#edf4fc">${reportHeaderMarkup("accumulated",`${esc(accumulatedPeriodText())} · ${isAuthorized()?archive.reports.length:archive.tempReports.length} registros manuales · ${rows.length} registros · Calculo manual desde google forms · ${new Date().toLocaleString('es-MX')}`)}<section class="report-section report-section-daily" data-report-section="daily"><h2>Acumulados por módulo y ejecutivo</h2><div class="report-daily-grid">${table('module','Módulos')}${table('executive','Ejecutivos')}</div><p class="report-note">Datos únicos de todos los registros manuales disponibles en esta sesión (guardados con login o temporales sin login). Se incluyen los registros del periodo indicado. Ventas = registros con código; Programa Cero = ventas regulares con P0; Dental = ventas con PD. Sin comparación ni variaciones diarias.</p></section>${reportFootMarkup("accumulated")}</div>`;
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style>${html}`;
    return el('printPage');
  }

  function buildWeeklyReport(){
    renderWeekly();
    const {primary,previous,main,older}=weeklyVarianceData();
    const [,accent,deep]=THEME_COLORS[uiLayout.theme];
    const metricHeaders=['Registros','Ventas','Regul.','Garant.','P. Cero','Dental','APP','1ª compra','Calidad'];
    const variation=`<table class="daily-report-table"><thead><tr><th>Indicador</th><th>Principal</th><th>Anterior</th><th>Diferencia</th></tr></thead><tbody>${WEEKLY_DISPLAY_METRICS.map(k=>{const a=weeklyMetricValue(main.totals.metrics,main.rows,k),b=weeklyMetricValue(older.totals.metrics,older.rows,k),d=a-b;return `<tr><td>${WEEKLY_LABELS[k]}</td><td>${a}</td><td>${b}</td><td>${d>0?'+':''}${d}</td></tr>`;}).join('')}</tbody></table>`;
    const table=(week,data,title)=>{
      const q=qualityResult(data.rows,'module','TOTAL','weekly',weeklyGoalFor(week,'sales',primary,data.totals.metrics)||null);
      const value=(g,k)=>weeklyMetricValue(g.metrics,g.rows,k);
      const goalRow=`<tr class="goal-row"><td>OBJETIVOS</td>${WEEKLY_DISPLAY_METRICS.map(k=>{
        if(k==='reg'||k==='guar')return '<td>—</td>';
        if(k==='app'||k==='purchase')return `<td>${weeklyTargetPct(k)}</td>`;
        const v=weeklyGoalExport(week,k,primary,data.totals.metrics);
        return `<td>${v===''?'—':number.format(v)}</td>`;
      }).join('')}<td>${weeklyTargetPct('quality')}</td></tr>`;
      const body=data.entries.map(g=>`<tr><td>${esc(g.name)}</td>${WEEKLY_DISPLAY_METRICS.map(k=>`<td>${value(g,k)}</td>`).join('')}<td>${qualityPercentText(qualityResult(g.rows,'module',g.name,'weekly').global)}</td></tr>`).join('')||'<tr><td colspan="10">Sin registros</td></tr>';
      const sum=`<tr class="daily-total-row"><td>TOTAL</td>${WEEKLY_DISPLAY_METRICS.map(k=>`<td>${value(data.totals,k)}</td>`).join('')}<td>${qualityPercentText(q.global)}</td></tr>`;
      const achievement=`<tr class="daily-total-row"><td>CUMPLIMIENTO</td>${WEEKLY_DISPLAY_METRICS.map(k=>{
        if(k==='reg'||k==='guar')return '<td>—</td>';
        if(k==='app'||k==='purchase')return `<td>${data.totals.metrics.sales?weeklyPercent(value(data.totals,k),data.totals.metrics.sales):'—'}</td>`;
        const goal=weeklyGoalFor(week,k,primary,data.totals.metrics);
        return `<td>${goal?weeklyPercent(data.totals.metrics[k],goal):'—'}</td>`;
      }).join('')}<td>${qualityPercentText(q.composite)}</td></tr>`;
      const factors=`<tr class="daily-total-row weekly-factor-report"><td>CALIDAD FACTORES</td>${weeklyFactorValues(week,primary,data,q).map(cell=>cell?`<td title="${esc(cell.label)}">${cell.value}</td>`:'<td>—</td>').join('')}</tr>`;
      const overall=`<tr class="daily-total-row"><td>ALCANCE GLOBAL</td>${WEEKLY_DISPLAY_METRICS.map(()=>'<td>—</td>').join('')}<td>${qualityPercentText(q.global)}</td></tr>`;
      return `<div><h3>${title} · ${weekLabel(week)}</h3><table class="daily-report-table weekly-report-table"><thead><tr><th>Módulo</th>${metricHeaders.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${goalRow}${body}</tbody><tfoot>${sum}${achievement}${factors}${overall}</tfoot></table></div>`;
    };
    const html=`<div id="printPage" class="report-page" style="--raccent:${accent};--rdeep:${deep};--rpale:#edf4fc">${reportHeaderMarkup("weekly",`${weekLabel(primary)} vs ${weekLabel(previous)} · Calculo manual desde google forms · ${new Date().toLocaleString('es-MX')}`)}<section class="report-section" data-report-section="weekly-variance"><h2>Variación de resultados</h2>${variation}</section><section class="report-section report-section-daily" data-report-section="daily"><h2>Resultados y objetivos por módulo</h2><div class="report-daily-grid">${table(primary,main,'Fecha de comparación 1')}${table(previous,older,'Fecha de comparación 2')}</div><p class="report-note">Regulares y garantizadas: solo conteos, sin objetivo ni calidad. Registros y ventas: metas de cantidad. Plan Cero y Dental: metas automáticas sobre regulares y ventas respectivamente. APP, Primera compra y Calidad: porcentaje requerido desde Ajustes. La calidad de cada factor se muestra en su columna.</p></section>${reportFootMarkup("weekly")}</div>`;
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
      <section class="report-section report-section-allrecords" data-report-section="allrecords"><h2>Registros manuales · ${number.format(rows.length)} filas</h2>
      <p class="report-note">Las columnas coinciden con la configuración de la tabla de la calculadora. Los filtros pueden combinarse; Incidencia y APP reflejan las casillas seleccionadas.</p>
      <table class="record-export-table"><thead><tr>${head}</tr></thead><tbody>${body||`<tr><td colspan="${Math.max(1,cols.length)}">Sin registros coincidentes.</td></tr>`}</tbody></table>
      </section>${reportFootMarkup('allrecords')}</div>`;
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style>${html}`;
    return el('printPage');
  }


  /** El informe de Logros semanales usa exclusivamente los objetivos y filtros de esa página. */
  function weeklyAchievementReportModel(){
    const week=achValue('achWeek');
    if(!week||!imported.data)return {ready:false,reason:'Selecciona la semana operativa e importa un XLS antes de exportar.'};
    const {filteredRows,rows,q,goals,alcances,counters,incidents}=achData();
    const module=achValue('achModule')||'Todos los módulos';
    const salesRows=filteredRows.filter(r=>candidate(r)&&!autoSkipped(r));
    const records=salesRows.map(r=>({
      date:fmtDay(r.fecha||'').slice(0,5),folio:String(r.folio||'—'),
      dental:isYes(r.dental),p0:isYes(r.p0),app:appEnabled(r),
      incident:selectedIncident(r),dynamic:dynamicBonusPayable(r)
    }));
    // El reporte conserva los folios incidentados para revisión, aunque NO los cuente en los objetivos.
    const below=(reach,target)=>Number.isFinite(reach)&&Number.isFinite(target)&&target>0?reach+1e-8<target:null;
    const make=(label,actual,denominator,required,reach,quality,opportunityLabel)=>{
      const target=required===null||!Number.isFinite(required)?null:required;
      const isBelow=below(reach,target===null?null:(label==='Registros'||label==='Cumplimiento ventas'?100:target));
      return {label,base:`${actual} / ${denominator>0?denominator:'—'}`,objective:target===null?'Sin definir':label==='Registros'||label==='Cumplimiento ventas'?String(target):`${number.format(target)}%`,reach,quality,below:isBelow,status:isBelow===null?'Sin meta':isBelow?'Bajo meta':'Cumple',opportunityLabel};
    };
    const c=q.counters;
    const metrics=[];
    if(weeklyAdminPrefs.showRecordsGoal)metrics.push(make('Registros',rows.length,goals.records,goals.records,alcances.records,alcances.records,'REGIST.'));
    metrics.push(make('Cumplimiento ventas',c.sales,goals.sales,goals.sales,alcances.completion,q.factors.completion,'VENTAS'));
    metrics.push(make('Plan Dental',c.dental,c.sales,goals.dental,alcances.dental,q.factors.dental,'DENTAL'));
    metrics.push(make('Primera compra',c.purchase,c.sales,goals.purchase,alcances.purchase,q.factors.purchase,'1A COMPRA'));
    metrics.push(make('Programa Cero',c.p0,c.regular,goals.p0,alcances.p0,q.factors.p0,'P. CERO'));
    metrics.push(make('Activación APP',c.apps,c.sales,goals.app,alcances.app,q.factors.app,'APP'));
    const selectedSupervisorNames=achValue('achModule')?(supervisorConfig[achValue('achModule')]||[]):[];
    const supervisor=selectedSupervisorNames.length===1?selectedSupervisorNames[0]:selectedSupervisorNames.length>1?selectedSupervisorNames.join(' / '):'SUPERVISOR(A)';
    const qualityThreshold=qualityRule('quality',achValue('achModule'),'module').required;
    const opportunities=[
      {label:'REGIST.',below:metrics.find(m=>m.opportunityLabel==='REGIST.')?.below??null},
      {label:'VENTAS',below:metrics.find(m=>m.opportunityLabel==='VENTAS')?.below??null},
      {label:'DENTAL',below:metrics.find(m=>m.opportunityLabel==='DENTAL')?.below??null},
      {label:'P. CERO',below:metrics.find(m=>m.opportunityLabel==='P. CERO')?.below??null},
      {label:'1A COMPRA',below:metrics.find(m=>m.opportunityLabel==='1A COMPRA')?.below??null},
      {label:'APP',below:metrics.find(m=>m.opportunityLabel==='APP')?.below??null},
      {label:'CALIDAD',below:below(q.composite,qualityThreshold)}
    ];
    return {ready:true,week,weekLabel:weekLabel(week),module,supervisor,
      records,metrics,opportunities,settings:weeklyAdminPrefs,goals,
      validSales:c.sales,regular:c.regular,guaranteed:rows.filter(r=>candidate(r)&&isYes(r.guaranteed)).length,
      dental:c.dental,p0:c.p0,apps:c.apps,incidents:salesRows.filter(selectedIncident).length,
      dynamic:records.filter(r=>r.dynamic).length,qualityTotal:q.composite,global:q.global};
  }
  function buildAchievementReport(){
    const model=weeklyAchievementReportModel();
    if(!model.ready)throw Error(model.reason);
    const assets=cachedWeeklyAdminAssets();
    if(!assets)throw Error('Los recursos del informe aún no están cargados. Vuelve a seleccionar Exportar.');
    const sheets=renderWeeklyAdminSheets(model,assets,{scale:3});
    el('reportHost').innerHTML=`<style id="reportCss">${weeklyAdminPrintCss}</style>${weeklyAdminPageMarkup(sheets)}`;
    return el('printPage');
  }

  function supervisorStatementModel(){
    const c=supervisorCalculator();
    return createSupervisorStatement(c,{
      week:supView.week,version:APP_VERSION,settings:supSettings,
      weekLabel,fmtDay,goalFor:executiveGoal,
      eligible:r=>candidate(r)&&!excluded(r),
      fee:supRowFee,guarantee:guaranteeType,hasP0:r=>isYes(r.p0),hasDental:r=>isYes(r.dental),
      hasApp:appEnabled,incident:selectedIncident,marked:dynamicBonusMarked,dynamicAmount:dynamicBonusAmount(),
      printed:{overview:supPrintEnabled('overview'),team:supPrintEnabled('team'),bonus:supPrintEnabled('bonus'),
        own:supPrintEnabled('own'),recordsOwn:supPrintEnabled('recordsOwn'),recordsTeam:supPrintEnabled('recordsTeam'),
        search:supPrintEnabled('search'),searchText:el('supSearch')?.value||''}
    });
  }
  function buildSupervisorReport(){
    const model=supervisorStatementModel();
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}\n${SUPERVISOR_STATEMENT_CSS}</style>${supervisorStatementHtml(model)}`;
    return el('printPage');
  }

  function buildIncidenceReport(){
    const entries=incidentArray(),cols=['Folio','Módulo','Ejecutivo','Activa','Resuelta','Comentarios'];
    const body=entries.map(r=>`<tr><td>${esc(r.folio)}</td><td>${esc(r.module||'—')}</td><td>${esc(r.executive||'—')}</td><td>${r.active?'Sí':'No'}</td><td>${r.resolved?'Sí':'No'}</td><td>${esc((r.comments||[]).map(c=>c.text).join(' / '))}</td></tr>`).join('');
    el('reportHost').innerHTML=`<style id="reportCss">${REPORT_CSS}</style><div id="printPage" class="report-page" style="--raccent:#005daa;--rdeep:#003b7a;--rpale:#eef5fb">${reportHeaderMarkup('incidents',`${entries.length} incidencias permanentes · ${new Date().toLocaleString('es-MX')}`)}<section class="report-section" data-report-section="incidents"><h2>Historial independiente de registros manuales</h2><table class="record-export-table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${body||'<tr><td colspan="6">Sin incidencias registradas.</td></tr>'}</tbody></table></section>${reportFootMarkup('incidents')}</div>`;
    return el('printPage');
  }
  function buildReportRaw(){
    if(activePage==='history')return buildHistoryReport();
    if(activePage==='moduleHistory')return buildModuleHistoryReport();
    if(activePage==='incidents')return buildIncidenceReport();
    if(activePage==='visits')return window.VISITS?.buildReport();
    if(activePage==='supervisor')return buildSupervisorReport();
    if(activePage==='allrecords')return buildAllRecordsReport();
    if(activePage==='achievements')return buildAchievementReport();
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
  function cleanReportHost(){
    const host=el('reportHost');if(!host)return;
    const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode())){
      if(!node.parentElement?.closest('style,script'))node.nodeValue=exportFriendlyText(node.nodeValue);
    }
  }
  function buildReport(){
    const result=buildReportRaw();
    cleanReportHost();
    return result;
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
    function write(t,x,yy,size=12,bold=false,color='#273243'){if(!draw)return;ctx.font=font(size,bold);ctx.fillStyle=color;ctx.textBaseline='top';ctx.fillText(exportFriendlyText(String(t||'')),x,yy);}
    function fit(t,maxWidth,size=11,bold=false){
      ctx.font=font(size,bold);let value=exportFriendlyText(String(t??'')).replace(/\s+/g,' ').trim();
      if(ctx.measureText(value).width<=maxWidth)return value;
      while(value.length&&ctx.measureText(value+'…').width>maxWidth)value=value.slice(0,-1);
      return value+'…';
    }
    function wrap(t,maxWidth,size=11,bold=false,maxLines=999){
      ctx.font=font(size,bold);const blocks=exportFriendlyText(String(t??'')).split(/\n/);let lines=[];
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
    const reportTexts=Object.fromEntries(Object.entries(reportTextFor(activePage)).map(([key,value])=>[key,exportFriendlyText(value)]));
    const titleLines=wrap(reportTexts.title,720,25,true);
    for(const titleLine of titleLines){write(titleLine,margin,y,25,true,deep);y+=31;}
    write('WM / SAM’S  ·  MARC  ·  EJECUTIVOS',775,34,10,true,accent);
    y+=8;
    y=paragraph(reportTexts.subtitle,margin,y,content,16,21,accent)+6;
    y=paragraph(reportTexts.description,margin,y,content,12,18,deep)+8;
    const selection=activePage==='incidents'?`${incidentRecords.size} incidencias permanentes · ${new Date().toLocaleString('es-MX')}`:activePage==='supervisor'?`${supView.week?weekLabel(supView.week):'Sin semana'} · ${supReadSelection()?.name||'Sin supervisor'} · ${supReadSelection()?.module||''}`:activePage==='achievements'?`${achValue('achWeek')?weekLabel(achValue('achWeek')):'Sin semana'} · ${achValue('achModule')||'Todos los módulos'} · ${achFilteredRecords().length} folios filtrados`:activePage==='allrecords'?`${getAllRecordsFiltered().length} registros · Módulo ${allRecordsFilterValue('allRecordsModule')||'Todos'} · Ejecutivo ${allRecordsFilterValue('allRecordsExecutive')||'Todos'}`:activePage==='weekly'?`${weekLabel(weeklySelection().primary)} vs. ${weekLabel(weeklySelection().previous)} · Calculo manual desde google forms`:activePage==='accumulated'?`${accumulatedPeriodText()} · ${isAuthorized()?archive.reports.length:archive.tempReports.length} registros manuales ${isAuthorized()?'guardados':'temporales'} · Calculo manual desde google forms`:activePage==='daily'&&imported.data?`Día principal ${fmtDay(dailyDates().latest)} · Día comparado ${fmtDay(dailyDates().previous)} · Calculo manual desde google forms`:activePage==='team'&&imported.data?`Semana ${weekLabel(imported.week)} · ${filteredTeamEntries().length} ejecutivos · Calculo manual desde google forms`:importActive()?`Semana ${weekLabel(imported.week)} · ${imported.executive} · Objetivo ${state.base.goal}`:`Modo manual · Objetivo ${state.base.goal}`;
    y=paragraph(selection,margin,y,content,10,15)+6;
    line(margin,y,content,accent);y+=9;
    for(const section of sections){
      const key=section.dataset.reportSection;heading(key==='sup-overview'?'Resumen de comisiones':key==='sup-filters'?'Parámetros de consulta':key==='sup-search'?'Búsqueda de folios':key==='sup-quality'?'Calidad del equipo':key==='sup-bonus'?'Bono por resultados':key==='sup-own'?'Ventas propias':key==='sup-team-records'?'Folios ejecutivos':key==='sup-own-records'?'Folios supervisor':key==='ach-filters'?'Filtros aplicados':key==='ach-goals'?'Objetivos: cantidades y porcentajes':key==='ach-percents'?'Logros por porcentaje':key==='ach-quantities'?'Logros en cantidades':key==='ach-records'?'Registros manuales filtrados':key==='allrecords'?'Registros manuales filtrados':key==='weekly-variance'?'Variación de resultados':SECTION_LABELS[key]||(key==='daily'?'Por módulo y ejecutivo':key==='team'?'Comparativo por ejecutivo':'Resumen del equipo'));
      if(['sup-overview','sup-filters','sup-search','sup-quality','sup-bonus','sup-own'].includes(key)){
        y=tableAt(section.querySelector('.sup-report-table'),margin,y,content,{fontSize:11,rowMin:28,widths:key==='sup-quality'?[2,1,1]:key==='sup-own'?[2,1.4,1]:[3,1],striped:true})+9;
      }
      else if(['sup-team-records','sup-own-records'].includes(key)){
        y=tableAt(section.querySelector('.sup-report-records'),margin,y,content,{fontSize:9,rowMin:26,widths:[1,1.6,1.2,1,1.3,.6,.7,.6,.7,1],striped:true})+9;
      }
      else if(['ach-filters','ach-goals','ach-percents','ach-quantities'].includes(key)){
        const table=section.querySelector('.ach-report-table');
        y=tableAt(table,margin,y,content,{fontSize:11,rowMin:27,widths:key==='ach-percents'?[2,1,4]:key==='ach-quantities'?[3,1,1]:[3,1],striped:true})+9;
      }
      else if(key==='weekly-variance'){
        y=tableAt(section.querySelector('.daily-report-table'),margin,y,content,{fontSize:11,rowMin:29,widths:[2.8,1,1,1],striped:true})+9;
      }
      else if(key==='daily'){
        const tables=[...section.querySelectorAll('.daily-report-table')];
        const gap=18,panelW=(content-gap)/2,startY=y;
        let endY=startY;
        for(let i=0;i<tables.length;i++){
          const x=margin+i*(panelW+gap);
          const weeklyReport=activePage==='weekly';
          write(weeklyReport?(i===0?'SEMANA PRINCIPAL':'SEMANA COMPARADA'):(i===0?'POR MÓDULO':'POR EJECUTIVO'),x,startY,13,true,deep);
          const widths=weeklyReport?[2.7,1,1,1,1,1,1,1,1,1.1]:[2.45,1,1,1,1,1,1,1.1];
          const end=tableAt(tables[i],x,startY+24,panelW,{fontSize:weeklyReport?7:8,rowMin:weeklyReport?27:25,widths,striped:true});
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
      else if(['records','allrecords','ach-records','incidents'].includes(key)){
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
    write('Versión '+APP_VERSION,margin+content-84,y,10,false,'#6b7b8e');y+=32;
    return Math.ceil(y);
  }
  async function exportPng(){
    if(activePage==='history')return exportHistoryPng();
    if(activePage==='moduleHistory')return exportModuleHistoryPng();
    if(activePage==='visits')return window.VISITS?.exportPng();
    if(activePage==='achievements'){
      const button=el('exportImage'),oldText=button.textContent;button.disabled=true;button.textContent='Preparando PNG carta…';
      try{
        const assets=await preloadWeeklyAdminAssets(),model=weeklyAchievementReportModel();
        const pages=renderWeeklyAdminSheets(model,assets,{scale:Math.max(2,Math.min(uiLayout.scale,4))});
        for(let i=0;i<pages.length;i++){
          const blob=await new Promise(resolve=>pages[i].toBlob(resolve,'image/png'));
          if(!blob)throw Error('No se pudo generar la hoja '+(i+1));
          saveBlob(blob,`seguimiento_administrativo_${achValue('achWeek')}_${i+1}_de_${pages.length}.png`);
        }
      }catch(error){alert('No se pudo generar PNG: '+error.message);}
      finally{button.disabled=false;button.textContent=oldText;}
      return;
    }
    const button=el('exportImage'),before=button.textContent;
    button.disabled=true;button.textContent='Generando imagen…';
    try{
      buildReport();
      const supModel=activePage==='supervisor'?supervisorStatementModel():null;
      const probe=document.createElement('canvas').getContext('2d');
      const measured=supModel?.ready?paintSupervisorStatement(probe,false,supModel):null;
      const w=measured?.width||1120,h=measured?.height||paintReportCanvas(probe,false);
      // Escala máxima compatible sin superar límites habituales de tamaño/memoria de Canvas.
      const scale=Math.min(uiLayout.scale,24000/Math.max(w,h),Math.sqrt(90000000/(w*h)));
      if(scale<.75)throw Error('El reporte es demasiado extenso para generar un PNG legible. Reduce la cantidad de filas o utiliza Imprimir / PDF, que conserva el texto vectorial.');
      const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo iniciar el lienzo PNG.');
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      if(supModel?.ready)paintSupervisorStatement(ctx,true,supModel);
      else paintReportCanvas(ctx,true);
      canvas.toBlob(blob=>{
        button.disabled=false;button.textContent=before;
        if(blob)saveBlob(blob,activePage==='supervisor'?`calculadora_supervisor_${supView.week||'sin_semana'}.png`:activePage==='achievements'?`logros_semanales_${achValue('achWeek')||'sin_semana'}.png`:activePage==='incidents'?`historial_incidencias_${dateIso(new Date())}.png`:activePage==='allrecords'?`registros_manuales_${dateIso(new Date())}.png`:activePage==='weekly'?`comparativa_semanal_${weeklySelection().primary}_vs_${weeklySelection().previous}.png`:activePage==='accumulated'?`acumulado_general_${el('accumulatedFrom').value||'todo'}_${el('accumulatedTo').value||'todo'}.png`:activePage==='daily'?`comparativa_diaria_${imported.data?dailyDates().latest:'sin_datos'}.png`:activePage==='team'?`comisiones_equipo_${imported.week}.png`:`comisiones_simuladas_${importActive()?imported.week:'manual'}.png`);
        else alert('No se pudo guardar la imagen PNG. Prueba un periodo con menos folios.');
      },'image/png');
    }catch(err){button.disabled=false;button.textContent=before;alert('No se pudo generar el PNG: '+err.message);}
  }
  setUpLayout();
  el('exportImage').addEventListener('click',exportPng);
  window.addEventListener('beforeprint',()=>{try{if(activePage!=='achievements'||cachedWeeklyAdminAssets())buildReport();}catch(error){console.warn('Reporte de impresión:',error);}});
  window.CALC_REPORT={buildReport,layout:uiLayout};

  initAllRecordsPage();initAchievements();initWeeklyAdminSettings();initQualitySettings();initSupervisorCalculator();initIncidences();initHistory();initModuleHistory();initNavOrder();initFloatingExport();initMondayReminder();
  restore();setForm('base');setForm('sim');render();initializeWeeklyDates();refreshAuthorizedPages();switchPage(pageNavigation.home);initArchive();
  window.APP_CLOUD?.registerRefresh(async()=>{
    if(!isAuthorized())return;
    archive.reports=await archiveGetAll();archive.temporaryMode=false;
    archiveSelectionRestore();loadFolioFlags();loadCommissionRates();
    for(const key of Object.keys(teamGoals))delete teamGoals[key];Object.assign(teamGoals,loadTeamStore(TEAM_GOALS_STORAGE));
    qualityConfig=cleanQualityConfig(storedJson(QUALITY_STORAGE_V22));
    weeklyAdminPrefs=readWeeklyAdminPrefs();refreshWeeklyAdminSettingsEditor();historyPrefs=readHistoryPrefs();refreshHistorySettingsEditor();moduleHistoryPrefs=readModuleHistoryPrefs();refreshModuleHistorySettingsEditor();
    pageNavigation=loadNavSettings();activeGroup=pageNavigation.groupBy[activePage]||'analysis';applyNavOrder();renderNavOrderEditor();
    if(firstCloudNavigation){firstCloudNavigation=false;el('histPeriod').value=historyPrefs.defaultPeriod;el('histWeekday').value=historyPrefs.defaultWeekday==='today'?String(new Date().getDay()):historyPrefs.defaultWeekday;el('mhPeriod').value=moduleHistoryPrefs.defaultPeriod;el('mhWeekday').value=moduleHistoryPrefs.defaultWeekday==='today'?String(new Date().getDay()):moduleHistoryPrefs.defaultWeekday;el('mhIncludeSupervisors').value=moduleHistoryPrefs.includeSupervisors?'yes':'no';switchPage(pageNavigation.home);}
    dynamicBonusConfig=loadDynamicBonus();if(el('dynamicBonusAmount'))el('dynamicBonusAmount').value=dynamicBonusAmount();
    refreshArchiveData(true);await refreshIncidents(true);refreshAuthorizedPages();render();window.VISITS?.refreshSources();
  });
  // Carga anticipada de logotipos y firma para evitar esperas al exportar.
  preloadWeeklyAdminAssets().catch(err=>console.warn('Recursos semanales:',err));
  // Solo lectura: acuse consulta TODOS los XLS del historial, sin aplicar filtros visuales.
  window.VISIT_SOURCE={
    isAuthorized,
    rows(){
      const data=combinedArchiveData(isAuthorized()?archive.reports:archive.tempReports);
      if(!data)return [];
      const indexes=Object.fromEntries(data.headers.map((h,i)=>[normalize(h),i]));
      const find=(row,terms)=>{
        const key=terms.find(t=>Object.hasOwn(indexes,normalize(t)));
        return key?String(row.raw[indexes[normalize(key)]]??'').trim():'';
      };
      return data.rows.map(r=>({...r,
        incidentFlag:selectedIncident(r),
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
