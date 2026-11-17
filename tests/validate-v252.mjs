import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WEEKLY_ADMIN_WIDTH,WEEKLY_ADMIN_HEIGHT,WEEKLY_ADMIN_STORAGE,WEEKLY_ADMIN_DEFAULTS,
cleanWeeklyAdminSettings,renderWeeklyAdminSheets,weeklyAdminPageCount,weeklyAdminPageMarkup,weeklyAdminPrintCss
} from '../src/weekly-admin-report.js';
const snapshots=[];
globalThis.document={createElement(type){assert.equal(type,'canvas');
  const obj={texts:[],lines:[],images:[],rectangles:[]};
  const ctx={beginPath(){},roundRect(...p){obj.rectangles.push(p);},fill(){},stroke(){},moveTo(...p){obj.from=p;},lineTo(...p){obj.lines.push([obj.from,p]);},scale(){},fillRect(){},drawImage(...p){obj.images.push(p);},fillText(value){obj.texts.push(String(value));},measureText(value){return {width:String(value).length*4}},set font(v){this._font=v},get font(){return this._font}};
  const canvas={width:0,height:0,getContext:()=>ctx,toDataURL:()=>`data:image/png;base64,ZGF0YQ==`};
  snapshots.push(obj);return canvas;
}};
const row=i=>({date:'02/11',folio:String(26000100+i).padStart(8,'0'),dental:i%2===0,p0:i%3===0,app:true,incident:i%17===0,dynamic:i%11===0});
const factors=['Registros','Cumplimiento ventas','Plan Dental','Primera compra','Programa Cero','Activación APP'];
const metric=(name,i)=>({label:name,base:'25 / 30',objective:'90%',reach:80+i,quality:90+i,below:i%2===0,status:i%2===0?'Bajo meta':'Cumple'});
const create=(n=50,extra={})=>({ready:true,week:'2026-11-02',weekLabel:'02 al 08 de noviembre de 2026',supervisor:'SUPERVISORA PRUEBA',module:'SAMS CLUB PENSIONES',goals:{sales:54,records:60},validSales:47,regular:34,guaranteed:16,dental:33,p0:12,apps:44,incidents:3,dynamic:8,qualityTotal:93.2,global:95.7,metrics:factors.map(metric),opportunities:['REGIST.','VENTAS','DENTAL','P. CERO','1A COMPRA','APP','CALIDAD'].map((label,i)=>({label,below:i%2===0})),records:Array.from({length:n},(_,i)=>row(i)),settings:{...WEEKLY_ADMIN_DEFAULTS},...extra});
const assets={header:{name:'original INVEX MARC'},signature:{name:'original firma'}};
assert.equal(WEEKLY_ADMIN_WIDTH,612);assert.equal(WEEKLY_ADMIN_HEIGHT,792);
assert.equal(WEEKLY_ADMIN_STORAGE,'wmSamsWeeklyAdminReportV252');
assert.deepEqual(cleanWeeklyAdminSettings({commentsLines:30,planLines:-1,showLogos:'no',mainColor:'red'}),{...WEEKLY_ADMIN_DEFAULTS});
for(const n of [0,1,7,17,25,26,49,50,51,75,100,101]){
 const before=snapshots.length,model=create(n),pages=renderWeeklyAdminSheets(model,assets,{scale:3});
 assert.equal(pages.length,Math.max(1,Math.ceil(n/50)));assert.equal(weeklyAdminPageCount(model),pages.length);
 assert(pages.every(c=>c.width===1836&&c.height===2376));
 const rendered=snapshots.slice(before);
 const strings=rendered.flatMap(s=>s.texts);
 for(let i=0;i<n;i++)assert(strings.includes(row(i).folio),'Folio perdido '+n+': '+i);
 assert(rendered.every(s=>s.images.length===2));
 assert(rendered.every(s=>s.texts.at(-1)==='SUPERVISOR(A) · FIRMA'),'No debe haber texto debajo de las firmas');
 assert(rendered.every(s=>s.texts.includes('COMENTARIOS Y RESULTADOS DE LA SEMANA')));
 assert(rendered.every(s=>s.texts.includes('PLAN DE TRABAJO PARA LA SIGUIENTE SEMANA')));
 const html=weeklyAdminPageMarkup(pages);assert.equal((html.match(/weekly-admin-paper/g)||[]).length,pages.length);
}
assert(weeklyAdminPrintCss.includes('size:letter portrait'));
// Layout with 50 folios and 8 metrics keeps handwriting >= 46pt and signatures separate.
const app=fs.readFileSync('src/legacy-app.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const cloud=fs.readFileSync('src/cloud-boot.js','utf8');
const server=fs.readFileSync('netlify/functions/settings.js','utf8');
assert(app.includes('function weeklyAchievementReportModel()'));
assert(app.includes('const {filteredRows,rows,q,goals,alcances,counters,incidents}=achData()'));
assert(app.includes('const assets=await preloadWeeklyAdminAssets()'));
assert(app.includes('renderWeeklyAdminSheets(weeklyAchievementReportModel(),assets'));
assert(app.includes('if(activePage===\'achievements\'){\n      const button=el(\'exportImage\')'));
assert(index.includes('settingsWeeklyAdminV252'));
assert(index.includes('settingsSectionsNav'));
assert(cloud.includes(WEEKLY_ADMIN_STORAGE)&&server.includes(WEEKLY_ADMIN_STORAGE));
console.log('OK V2.5.2: PDF carta, PNG 2 tablas dinámicas, 0-101 folios, firmas finales, módulo de Logros y ajustes sincronizados.');
