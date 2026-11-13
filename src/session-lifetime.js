/** Límite local de uso de una sesión autenticada en este navegador.
 * La autenticación REAL y los tokens los gestiona Netlify Identity: nunca
 * se guardan contraseñas ni JWT en esta estructura.
 */
export const REMEMBER_DAYS = 7;
export const REMEMBER_MS = REMEMBER_DAYS * 24 * 60 * 60 * 1000;
export const REMEMBER_KEY = 'wmSamsIdentityRememberV249';

export function readRememberedSession(storage) {
  try {
    const item = JSON.parse(storage.getItem(REMEMBER_KEY) || 'null');
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    if (typeof item.userId !== 'string' || !item.userId.trim()) return null;
    if (!Number.isFinite(item.expiresAt) || item.expiresAt <= 0) return null;
    return { userId: item.userId, expiresAt: item.expiresAt };
  } catch (_) { return null; }
}
export function isRememberedSessionExpired(storage, userId, now = Date.now()) {
  const record = readRememberedSession(storage);
  return !!record && record.userId === String(userId) && now >= record.expiresAt;
}
export function rememberSession(storage, userId, now = Date.now(), reset = false) {
  if (typeof userId !== 'string' || !userId.trim()) return null;
  const saved = readRememberedSession(storage);
  // Al reabrir la página NO se reinicia el contador de siete días.
  if (!reset && saved && saved.userId === userId) return saved;
  const record = { userId, expiresAt: now + REMEMBER_MS };
  try { storage.setItem(REMEMBER_KEY, JSON.stringify(record)); } catch (_) { /* cookies/Identity siguen siendo la fuente de verdad */ }
  return record;
}
export function clearRememberedSession(storage) {
  try { storage.removeItem(REMEMBER_KEY); } catch (_) {}
}
