/** Respaldo de XLS únicamente en el origen local (localhost/127.0.0.1/file:).
 * IndexedDB conserva archivos completos entre reinicios del servidor local.
 * Nunca almacena tokens ni datos de Supabase Auth.
 */
export const localBrowserMode=()=>typeof location!=='undefined'&&(location.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(location.hostname));
const DB='marc-mid-local-v41',STORE='xls';
function openDb(){return new Promise((resolve,reject)=>{
 if(typeof indexedDB==='undefined'){reject(Error('Este navegador no permite IndexedDB.'));return;}
 const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'});};
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('No fue posible abrir IndexedDB.'));
});}
async function task(kind,mode='readonly',value=null){const db=await openDb();try{return await new Promise((resolve,reject)=>{
 const tx=db.transaction(STORE,mode),req=kind==='getAll'?tx.objectStore(STORE).getAll():kind==='put'?tx.objectStore(STORE).put(value):kind==='delete'?tx.objectStore(STORE).delete(value):tx.objectStore(STORE).clear();
 let result;req.onsuccess=()=>{result=req.result;if(kind==='getAll')resolve(result);};req.onerror=()=>reject(req.error);
 tx.oncomplete=()=>{if(kind!=='getAll')resolve(result);};tx.onabort=()=>reject(tx.error||Error('Transacción de IndexedDB interrumpida.'));
 });}finally{db.close();}}
export const loadLocalXls=async()=>localBrowserMode()?task('getAll'):[];
export const saveLocalXls=async report=>{if(localBrowserMode())await task('put','readwrite',report);};
export const deleteLocalXls=async id=>{if(localBrowserMode())await task('delete','readwrite',id);};
export const clearLocalXls=async()=>{if(localBrowserMode())await task('clear','readwrite');};
