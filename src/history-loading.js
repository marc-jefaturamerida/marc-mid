/**
 * Descarga íntegra del historial XLS con paginación adaptable.
 * Un fallo en una página nunca se interpreta como un historial vacío o completo.
 * El API existente permite entre 1 y 8 archivos por petición; algunos archivos
 * son lo bastante grandes como para que un lote de 8 exceda límites de respuesta.
 */
export async function loadCompleteHistory(requestPage, {
  pageSize = 8,
  maxFiles = 500,
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)),
  onProgress = () => {}
} = {}) {
  if (typeof requestPage !== 'function') throw Error('No se definió el acceso al historial.');
  const result = [], seen = new Set();
  let offset = 0, size = Math.max(1, Math.min(8, Math.floor(pageSize) || 8));
  let singleRetry = 0;
  while (offset < maxFiles) {
    let payload;
    try {
      payload = await requestPage(offset, size);
    } catch (error) {
      // Un fallo de sesión no mejora reduciendo la página o repitiendo consultas.
      if ([401, 403].includes(error?.status)) throw error;
      if (size > 1) {
        size = Math.max(1, Math.floor(size / 2));
        singleRetry = 0;
        continue;
      }
      if (singleRetry++ < 1) {
        await pause(700);
        continue;
      }
      throw new Error(`Falló la descarga del historial desde el archivo ${offset + 1}: ${error?.message || String(error)}`);
    }
    if (!payload || !Array.isArray(payload.reports)) {
      throw Error(`Respuesta incompleta del historial en la posición ${offset + 1}. No se considerará cargado.`);
    }
    const batch = payload.reports;
    for (const report of batch) {
      if (!report || typeof report.id !== 'string' || !Array.isArray(report.headers) || !Array.isArray(report.rows)) {
        throw Error(`Reporte incompleto en la posición ${offset + 1}. No se considerará cargado.`);
      }
      if (!seen.has(report.id)) { seen.add(report.id); result.push(report); }
    }
    onProgress(result.length);
    if (!payload.hasMore) return result;
    const next = Number(payload.nextOffset);
    if (!batch.length || !Number.isInteger(next) || next <= offset || next > maxFiles) {
      throw Error('El historial devolvió una paginación incompleta. No se considerará cargado.');
    }
    offset = next;
    singleRetry = 0;
  }
  throw Error(`El historial supera el límite de ${maxFiles} archivos admitidos en la carga.`);
}
