import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, existsSync, readFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { openDatabase, seedDemo } from './database.js';
import { createApp } from './http.js';
import { syncPeopleFromSupabase } from './supabase.js';

if(process.env.NODE_ENV==='production') throw new Error('Esta versão funciona apenas localmente. Não iniciar em produção.');
const root=fileURLToPath(new URL('../',import.meta.url)),dataDir=join(root,'data');
mkdirSync(dataDir,{recursive:true});
const lock=join(dataDir,'server.lock');
if(existsSync(lock)) {
  const pid=Number(readFileSync(lock,'utf8'));
  let live=false;try {process.kill(pid,0);live=true;} catch(error) {if(error.code!=='ESRCH')live=true;}
  if(live) throw new Error('Já há uma instância local em execução.');
  unlinkSync(lock);
}
writeFileSync(lock,String(process.pid),{flag:'wx'});
let db,server;
function cleanup(){try{db?.close();}catch{}try{if(readFileSync(lock,'utf8')===String(process.pid))unlinkSync(lock);}catch{}}
try {
  db=openDatabase(join(dataDir,'gestor.sqlite'));seedDemo(db);
  syncPeopleFromSupabase(db, 'aurora').catch(err => console.error('[Startup Supabase Sync Error]:', err.message));
  ({server}=createApp({db,uploadsDir:join(root,'uploads')}));
  const port=Number(process.env.PORT||4173);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Porta inválida.');
  server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`A porta ${port} já está em uso. Defina outra em PORT.`:error.message);cleanup();process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Gestor Imob · ambiente local\nLocal: http://127.0.0.1:${port}\nEncerre com Ctrl+C.`));
}catch(error){cleanup();throw error;}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server?.close(()=>{cleanup();process.exit(0);});server?.closeIdleConnections();});
process.on('exit',cleanup);
