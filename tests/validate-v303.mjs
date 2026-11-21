import assert from 'node:assert/strict';
import {customizeClipboard} from '../src/clipboard-settings.js';
const original='REPORTE DE INCIDENCIA\nFolio: 123\nMódulo: A\nEjecutivo: B';
assert.equal(customizeClipboard('incident',original,{}),original);
const result=customizeClipboard('incident',original,{incident:{title:'Aviso',hidden:['Módulo'],labels:{Folio:'Solicitud'},order:['Ejecutivo','Folio']}});
assert.equal(result,'Aviso\nEjecutivo: B\nSolicitud: 123');
const d='*Reporte general*\n\n```\nRegist. 10 (+1)\nVentas 2 (+2)\n```';
assert.match(customizeClipboard('daily',d,{daily:{order:['Ventas','Regist.'],deltas:false}}),/Ventas 2\nRegist. 10/);
console.log('V3.0.3: personalización de portapapeles OK');
