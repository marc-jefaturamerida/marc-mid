import {defineConfig,loadEnv} from 'vite';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'VITE_');
 // GitHub Pages serves repository at /marc-mid/; override for another repo/domain.
 const base=env.VITE_CLOUD_PROVIDER==='supabase'?(env.VITE_APP_BASE||'/marc-mid/'): '/';
 return {base};
});
