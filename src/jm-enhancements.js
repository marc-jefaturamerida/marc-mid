import {initAuditUi} from './audit-ui.js';
import {initSettingsSearch} from './settings-search.js';
import {enhanceMobileTables} from './mobile-tables.js';
function boot(){initSettingsSearch();enhanceMobileTables();initAuditUi();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
