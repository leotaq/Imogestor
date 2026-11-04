import { openDatabase, seedDemo } from '../server/database.js';
import { Service } from '../server/service.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve,sep,basename } from 'node:path';

export function fixture(){const db=openDatabase();seedDemo(db);return {db,service:new Service(db),admin:db.prepare("SELECT * FROM users WHERE id='marina'").get(),staff:db.prepare("SELECT * FROM users WHERE id='rafael'").get(),other:db.prepare("SELECT * FROM users WHERE id='outra'").get()};}
export const ticketInput={property_id:'p1',title:'Teste de vazamento',description:'Descrição fictícia para teste.',requester:'Pessoa fictícia',contact:'teste@example.com',category:'Hidráulica',priority:'normal',source:'Telefone',due_date:'2026-12-15'};
export const inspectionInput={property_id:'p1',kind:'move_out',requester_id:'rafael',deadline_at:'2026-12-15'};
export const quoteInput={provider_id:'v1',scope:'Reparo de torneira',items:[{label:'Mão de obra',cents:18000}]};
export function tempDir(){return mkdtempSync(join(tmpdir(),'gestor-test-'));}
export function removeTestDir(dir){const path=resolve(dir);if(!path.startsWith(resolve(tmpdir())+sep)||!basename(path).startsWith('gestor-test-'))throw new Error('Limpeza fora do diretório de teste.');rmSync(path,{recursive:true,force:true,maxRetries:5,retryDelay:50});}
