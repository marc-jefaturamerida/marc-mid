/** Adaptive cards for data-only tables; no event handlers changed or rows re-created. */
const TARGETS=['#teamTable','.history-table','#leaderPeopleSection table','#leaderModulesSection table','#weeklyPage table','#accumulatedPage table'];
function apply(root){
 for(const selector of TARGETS)for(const table of root.querySelectorAll(selector)){
  table.classList.add('jm-adaptive-table');const heads=[...table.querySelectorAll('thead th')].map(h=>h.textContent.trim());
  for(const row of table.querySelectorAll('tbody tr')){
   for(const [i,td] of [...row.cells].entries())if(!td.hasAttribute('data-label'))td.setAttribute('data-label',heads[i]||'Dato');
  }
 }
}
export function enhanceMobileTables(){
 const main=document.getElementById('appRoot')||document.body;apply(main);
 let pending=false;const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;apply(main);});});
 observer.observe(main,{childList:true,subtree:true});
}
