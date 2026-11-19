import assert from 'node:assert/strict';
import {jefaturaDailyProgress,jefaturaProgressInline,jefaturaProgressReport} from '../src/jefatura-daily-progress.js';
import {buildDailyWhatsAppReport} from '../src/daily-whatsapp-report.js';
const rows=[...Array.from({length:20},(_,i)=>({fecha:i<8?'2026-11-16':i<15?'2026-11-17':'2026-11-18',payable:true,regular:i<12,dental:i<10,p0:i<4})),
  {fecha:'2026-11-18',payable:false,regular:true,dental:true,p0:true},
  {fecha:'2026-11-19',payable:true,regular:true,dental:true,p0:true}];
const snapshot=jefaturaDailyProgress({date:'2026-11-18',rows,weeklySalesGoal:100,dentalGoalPct:90,p0GoalPct:30});
assert.deepEqual(snapshot.counts,{sales:20,regular:12,dental:10,p0:4});
assert.equal(snapshot.elapsed,3);assert.equal(snapshot.weekStart,'2026-11-16');assert.equal(snapshot.weekEnd,'2026-11-22');
assert.equal(snapshot.sales.actual,20);assert.equal(Number(snapshot.sales.required.toFixed(2)),42.86);
assert.equal(Number(snapshot.sales.difference.toFixed(2)),-22.86);
assert.equal(jefaturaProgressInline(snapshot),'Hoy avanzamos 20% sobre el objetivo de la jefatura. Deberíamos llevar 42.86%. Tenemos una diferencia de -22.86%.');
const report=jefaturaProgressReport(snapshot);
assert.match(report,/\*Ventas\*\nAlcance: 20%\nRequerido hoy: 42.86%\nDiferencia: -22.86%/);
assert.match(report,/\*Plan Dental\*\nAlcance: 50%\nRequerido hoy: 90%\nDiferencia: -40%/);
assert.match(report,/\*Plan Cero\*\nAlcance: 33.33%\nRequerido hoy: 30%\nDiferencia: \+3.33%/);
const example=buildDailyWhatsAppReport({currentDate:'2026-11-19',previousDate:'2026-11-18',todayIso:'2026-11-19',current:{records:20,sales:9,reg:6,guar:3,p0:2,dental:6},previous:{records:21,sales:6,reg:4,guar:2,p0:1,dental:3},currentQuality:96.26,previousQuality:64.35,progressText:jefaturaProgressInline(snapshot)});
assert.ok(example.startsWith('Buenas noches cierre del. Día.\n*Reporte general de hoy versus ayer.*\n'));
assert.ok(example.includes('Regist. 20 (-1)'));
assert.ok(example.includes('Ventas  9  (+3)'));
assert.ok(example.includes('Calidad  96.26%  (+31.91 pp)'));
assert.ok(example.includes('Hoy avanzamos 20%'));
assert.ok(!example.includes('Subimos un poco'));
const missing=jefaturaDailyProgress({date:'2026-11-18',rows,dentalGoalPct:null,p0GoalPct:null});
assert.match(jefaturaProgressInline(missing),/sin objetivo semanal/);
assert.match(jefaturaProgressReport(missing),/Requerido hoy: —/);
const start=jefaturaDailyProgress({date:'2026-11-16',rows,weeklySalesGoal:100});assert.equal(start.elapsed,1);
const end=jefaturaDailyProgress({date:'2026-11-22',rows,weeklySalesGoal:100});assert.equal(end.elapsed,7);assert.equal(end.sales.required,100);
console.log('OK: reporte diario de WhatsApp y Jefatura, comisionables, porcentajes y fechas.');
