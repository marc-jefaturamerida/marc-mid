import { getUser, refreshSession } from '@netlify/identity';
import { getDatabase } from '@netlify/database';

export async function authorize(request) {
  // El access token de Identity expira normalmente cada hora. Renovarlo
  // aquí permite seguir usando las Functions tras cerrar el navegador,
  // siempre que Netlify conserve una cookie refresh aún válida.
  try { await refreshSession(); } catch (_) { /* getUser valida el token actual. */ }
  const user = await getUser();
  if (!user?.id) return { response: send({ error: 'Inicia sesión por correo para acceder a la nube.' }, 401) };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) {
      return { response: send({ error: 'Origen no permitido' }, 403) };
    }
  }
  return { owner: String(user.id), db: getDatabase() };
}
export function send(data, status=200) {
  return new Response(JSON.stringify(data), {
    status, headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
export async function jsonBody(request, limit=5_000_000) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > limit) throw new Error('El archivo o la configuración supera el tamaño admitido.');
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > limit) throw new Error('El contenido supera el límite permitido.');
  return JSON.parse(raw);
}
export const responseError = (error) => {
  const message=error instanceof Error ? error.message : 'Solicitud inválida';
  const isInput=/inválid|incorrect|columna|encabezad|fila|límite|tamaño|falt|reporte|archivo|firma|contenido/i.test(message);
  return send({error:isInput?message:'No se pudo completar la operación. Comprueba la base de datos y el estado del despliegue.'},isInput?400:500);
};
