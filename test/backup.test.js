import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { randomUUID,createHash } from 'node:crypto';
import {openDatabase,seedDemo} from '../server/database.js';
import {createBackup} from '../server/backup.js';
import {tempDir,removeTestDir} from './helpers.js';

test('backup recupera banco e conteúdo efetivo do anexo',async()=>{
  const root=tempDir(),dbPath=join(root,'source.sqlite'),uploadsDir=join(root,'uploads');mkdirSync(uploadsDir);
  const db=openDatabase(dbPath);seedDemo(db);const storage=randomUUID(),content=Buffer.from('%PDF-1.4\nArquivo fictício de teste\n%%EOF');
  const digest=createHash('sha256').update(content).digest('hex');writeFileSync(join(uploadsDir,storage),content);
  db.prepare('INSERT INTO attachments VALUES(?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),'aurora','t1','teste.pdf','application/pdf',content.length,storage,digest,'internal',new Date().toISOString());db.close();
  try{
    const dest=await createBackup({dbPath,uploadsDir,backupRoot:join(root,'backups')});
    const restored=openDatabase(join(dest,'gestor.sqlite'));
    try{const a=restored.prepare('SELECT * FROM attachments').get();assert.equal(a.sha256,digest);assert.deepEqual(readFileSync(join(dest,'uploads',a.storage_name)),content);assert.equal(restored.prepare('SELECT COUNT(*) n FROM tickets').get().n,7);}finally{restored.close();}
    const manifest=JSON.parse(readFileSync(join(dest,'manifest.json'),'utf8'));assert.equal(manifest.files.length,1);assert.equal(manifest.files[0].sha256,digest);
  }finally{removeTestDir(root);}
});
