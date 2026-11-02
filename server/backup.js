import { DatabaseSync, backup } from 'node:sqlite';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export async function createBackup({dbPath,uploadsDir,backupRoot}) {
  const destination=join(backupRoot,`gestor-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,6)}`);
  await mkdir(join(destination,'uploads'),{recursive:true});
  const source=new DatabaseSync(dbPath,{readOnly:true});
  const manifest={created_at:new Date().toISOString(),format:1,files:[]};
  try {
    const references=source.prepare('SELECT storage_name,sha256 FROM attachments').all();
    await backup(source,join(destination,'gestor.sqlite'));
    for(const file of references) {
      if(!/^[a-f0-9-]{36}$/.test(file.storage_name)) throw new Error('Referência de arquivo inválida.');
      const content=await readFile(join(uploadsDir,file.storage_name));
      const digest=createHash('sha256').update(content).digest('hex');
      if(digest!==file.sha256)throw new Error('Anexo não confere com o registro. Backup não concluído.');
      await copyFile(join(uploadsDir,file.storage_name),join(destination,'uploads',file.storage_name));
      manifest.files.push({file:`uploads/${file.storage_name}`,sha256:digest});
    }
    const verify=new DatabaseSync(join(destination,'gestor.sqlite'),{readOnly:true});
    try{if(verify.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Banco de backup inválido.');}finally{verify.close();}
    manifest.database_sha256=createHash('sha256').update(await readFile(join(destination,'gestor.sqlite'))).digest('hex');
    await writeFile(join(destination,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
    return destination;
  }finally{source.close();}
}
