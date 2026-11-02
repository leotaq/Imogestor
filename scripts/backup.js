import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { createBackup } from '../server/backup.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const marker=join(root,'data','server.lock');
if(existsSync(marker)) {
  const pid=Number(readFileSync(marker,'utf8'));
  if(!Number.isInteger(pid)||pid<1)throw new Error('Marcador de execução inválido. Revise o estado do servidor antes do backup.');
  let active=true;
  try{process.kill(pid,0);}catch(error){if(error.code==='ESRCH')active=false;}
  if(active)throw new Error('Encerre o servidor com Ctrl+C antes do backup para manter banco e anexos consistentes.');
}
if(!existsSync(join(root,'data','gestor.sqlite')))throw new Error('Banco ainda não criado. Inicie a aplicação primeiro.');
const destination=await createBackup({dbPath:join(root,'data','gestor.sqlite'),uploadsDir:join(root,'uploads'),backupRoot:join(root,'backups')});
console.log(`Backup de banco e anexos verificado: ${destination}`);
