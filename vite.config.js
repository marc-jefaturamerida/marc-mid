import {defineConfig,loadEnv} from 'vite';
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'VITE_');
  return {base:env.VITE_APP_BASE||'/marc-mid/'};
});
