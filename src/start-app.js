// Proveedor de nube configurable en compilación; Netlify continúa disponible como respaldo.
const provider=import.meta.env.VITE_CLOUD_PROVIDER||'netlify';
if(provider==='supabase')await import('./supabase-boot.js');
else await import('./cloud-boot.js');
