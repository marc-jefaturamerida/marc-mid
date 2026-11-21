// Comprobación pública: confirma que Netlify desplegó sus Functions.
// No expone información de la base de datos ni de usuarios.
export default async function handler() {
  return new Response(JSON.stringify({ok:true,service:'dashboard-merida-functions'}), {
    status:200,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
  });
}
