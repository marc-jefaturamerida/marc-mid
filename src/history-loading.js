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

/**
 * V3.0.4.3: descarga comprobada por archivo y fragmentos de filas.
 * El catálogo (firmas) se recupera por separado; un archivo nunca se publica
 * en memoria ni participa en los cálculos hasta tener exactamente todas sus filas.
 * La adaptación del tamaño del fragmento evita respuestas HTTP excesivas.
 */
export async function loadChunkedHistory(requestMetadata, requestInfo, requestRows, {
  pageSize = 250,
  maxFiles = 500,
  maxRowsPerFile = 50000,
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)),
  onProgress = () => {}
} = {}) {
  if (![requestMetadata, requestInfo, requestRows].every(fn => typeof fn === 'function'))
    throw Error('Faltan operaciones para descargar los XLS por fragmentos.');
  const metadata = await requestMetadata();
  if (!Array.isArray(metadata) || metadata.length > maxFiles)
    throw Error('El catálogo remoto de XLS es inválido o supera el máximo admitido.');
  const ids = new Set();
  for (const meta of metadata) {
    if (!meta || typeof meta.id !== 'string' || typeof meta.fingerprint !== 'string' || ids.has(meta.id))
      throw Error('El catálogo remoto contiene identificadores repetidos o incompletos.');
    ids.add(meta.id);
  }
  const reports = [];
  for (const meta of metadata) {
    const info = await requestInfo(meta.id);
    if (!info || info.id !== meta.id || info.fingerprint !== meta.fingerprint ||
        !Array.isArray(info.headers) || !Number.isInteger(Number(info.rowCount)) ||
        Number(info.rowCount) < 1 || Number(info.rowCount) > maxRowsPerFile)
      throw Error(`La ficha de ${meta.id} no coincide con el catálogo o está incompleta.`);
    const total = Number(info.rowCount), rows = [];
    let size = Math.max(1, Math.min(500, Math.floor(pageSize) || 250));
    let singleRetry = 0;
    while (rows.length < total) {
      const offset = rows.length, wanted = Math.min(size, total - offset);
      let part;
      try { part = await requestRows(meta.id, offset, wanted); }
      catch (error) {
        if ([401, 403, 404].includes(error?.status)) throw error;
        if (size > 1) { size = Math.max(1, Math.floor(size / 2)); singleRetry = 0; continue; }
        if (singleRetry++ < 1) { await pause(500); continue; }
        throw Error(`No se pudieron descargar las filas ${offset+1}–${offset+wanted} de ${meta.id}: ${error?.message || String(error)}`);
      }
      if (!part || part.id !== meta.id || !Array.isArray(part.rows) ||
          Number(part.totalRows) !== total || part.rows.length < 1 || part.rows.length > wanted ||
          Number(part.nextOffset) !== offset + part.rows.length ||
          part.rows.some(row => !Array.isArray(row)))
        throw Error(`Fragmento inconsistente de ${meta.id} a partir de la fila ${offset+1}.`);
      rows.push(...part.rows);
      singleRetry = 0;
    }
    if (rows.length !== total) throw Error(`El XLS ${meta.id} no tiene todas sus filas.`);
    reports.push({ id: info.id, name: info.name, size: info.size,
      fingerprint: info.fingerprint, addedAt: info.addedAt, headers: info.headers, rows });
    onProgress(reports.length, metadata.length);
  }
  return reports;
}
