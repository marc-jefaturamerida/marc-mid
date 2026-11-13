import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderWeeklyAdminSheets,weeklyAdminPageCount,weeklyAdminPrintCss} from '../src/weekly-admin-report.js';
const runs=[];
function fakeCanvas(){
  const texts=[],images=[];
  const ctx={texts,images,beginPath(){},roundRect(){},fill(){},stroke(){},scale(){},fillRect(){},moveTo(){},lineTo(){},drawImage(img,...rect){images.push([img,...rect]);},fillText(str){texts.push(String(str));},measureText(str){return {width:String(str).length*4}},set font(v){this._font=v},get font(){return this._font}};
  const canvas={width:0,height:0,getContext:()=>ctx};runs.push({canvas,ctx});return canvas;
}
globalThis.document={createElement:tag=>{assert.equal(tag,'canvas');return fakeCanvas();}};
const model={ready:true,weekLabel:'02/11/2026 — 08/11/2026',supervisor:'SUPERVISOR DE PRUEBA',module:'SAM SCL',goal:54,validSales:50,regular:35,guaranteed:15,dental:33,p0:12,apps:44,incidents:3,dynamic:8,qualityTotal:97.8,qualityObjective:90,global:98.4,
  records:Array.from({length:50},(_,i)=>({date:'02/11',folio:String(26700000+i),dental:i%2===0,p0:i%3===0,app:true,incident:i%19===0,dynamic:i%7===0})),
  metrics:[{label:'Cumplimiento ventas',base:'50 / 54',objective:'100%',reach:'92.6%',quality:'92.6%',below:true,status:'Bajo objetivo'},{label:'Primera compra',base:'39 / 50',objective:'90%',reach:'78%',quality:'86.7%',below:true,status:'Bajo objetivo'},{label:'Programa Cero',base:'12 / 35',objective:'30%',reach:'34.3%',quality:'114.3%',below:false,status:'Alcanzado'},{label:'Activación APP',base:'44 / 50',objective:'90%',reach:'88%',quality:'97.8%',below:true,status:'Bajo objetivo'}]};
const assets={header:{},signature:{}};
assert.equal(weeklyAdminPageCount(model),1);
let pages=renderWeeklyAdminSheets(model,assets,{scale:3});
assert.equal(pages.length,1);assert.equal(pages[0].width,1836);assert.equal(pages[0].height,2376);
const all=runs[0].ctx.texts;
for(const record of model.records)assert(all.includes(record.folio),record.folio);
assert(all.includes('COMENTARIOS, PLAN DE TRABAJO Y FIRMAS'));
assert(all.includes('AZAMAR DEL ANGEL'));
assert.equal(all.at(-1),'SUPERVISOR(A) · FIRMA');
assert.equal(runs[0].ctx.images.length,2);
assert(!all.some(t=>/^0[1-6] · /.test(t)));
model.records.push({...model.records[0],folio:'26700050'});
assert.equal(weeklyAdminPageCount(model),2);
pages=renderWeeklyAdminSheets(model,assets,{scale:2});assert.equal(pages.length,2);
assert.equal(pages[1].width,1224);assert.equal(pages[1].height,1584);
assert(runs.at(-1).ctx.texts.includes('26700050'));
assert(runs.at(-1).ctx.texts.some(value=>value.includes('Hoja 2 de 2')));
assert(weeklyAdminPrintCss.includes('size:letter portrait'));
const app=fs.readFileSync('src/legacy-app.js','utf8');
assert(app.includes('preloadWeeklyAdminAssets'));
assert(app.includes('weeklyAdminPageMarkup(pages)'));
assert(app.includes('const rows=[...c.src.team,...c.src.own].filter(r=>candidate(r)&&!autoSkipped(r))'));
console.log('OK V2.5.1: 50 folios en carta, multipágina sin pérdida, logos/firma y sin textos bajo firmas.');
