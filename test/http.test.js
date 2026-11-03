import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from '../server/http.js';
import { DEMO_PASSWORD } from '../server/database.js';
import {fixture,tempDir,removeTestDir} from './helpers.js';

async function appFixture(t){
  const f=fixture(),dir=tempDir();const {server}=createApp({db:f.db,uploadsDir:dir});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{await new Promise(r=>{server.close(r);server.closeAllConnections();});f.db.close();removeTestDir(dir);});
  const request=(path,{cookie='',method='GET',data,headers={}}={})=>fetch(base+path,{method,headers:{'Content-Type':'application/json','X-Gestor-Request':'1',...(cookie?{Cookie:cookie}:{}),...headers},body:data?JSON.stringify(data):undefined});
  const login=async(email='gestor@demo.local')=>{const r=await request('/api/login',{method:'POST',data:{email,password:DEMO_PASSWORD}});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);return r.headers.get('set-cookie').split(';')[0];};
  return {...f,dir,request,login};
}
test('login, sessão, isolamento de anexos e exportação sem notas internas',async t=>{
  const {request,login,db,dir}=await appFixture(t);
  assert.equal((await request('/api/state')).status,401);
  const cookie=await login();const other=await login('outra@demo.local');
  assert.equal((await request('/api/tickets/t1',{cookie:other})).status,404);
  const bad=await request('/api/tickets/t1/attachments',{cookie,method:'POST',data:{name:'foto.png',mime:'image/png',data:Buffer.from('isto não é uma imagem').toString('base64')}});assert.equal(bad.status,400);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBzUAAAAASUVORK5CYII=','base64');
  const upload=await request('/api/tickets/t1/attachments',{cookie,method:'POST',data:{name:'evidencia.png',mime:'image/png',data:png.toString('base64')}});assert.equal(upload.status,201);const detail=await upload.json();
  const file=detail.attachments[0];assert.equal(file.storage_name,undefined);
  const stored=db.prepare('SELECT storage_name FROM attachments WHERE id=?').get(file.id);assert.deepEqual(readFileSync(join(dir,stored.storage_name)),png);
  assert.equal((await request('/api/attachments/'+file.id,{cookie:other})).status,404);
  const download=await request('/api/attachments/'+file.id,{cookie});assert.equal(download.status,200);assert.deepEqual(Buffer.from(await download.arrayBuffer()),png);
  await request('/api/tickets/t1/notes',{cookie,method:'POST',data:{audience:'internal',body:'NOTA_INTERNA_NAO_EXPORTAR'}});
  const report=await request('/api/export',{cookie});assert.equal(report.status,200);assert.ok(!(await report.text()).includes('NOTA_INTERNA_NAO_EXPORTAR'));
  assert.equal((await request('/api/export',{cookie:other})).status,200);
  await request('/api/logout',{cookie,method:'POST',data:{}});assert.equal((await request('/api/state',{cookie})).status,401);
});
test('API de vistorias exige sessão, restringe papéis e atualiza agenda',async t=>{
  const {request,login}=await appFixture(t);
  assert.equal((await request('/api/inspections/i1')).status,401);
  const cookie=await login(),state=await (await request('/api/state',{cookie})).json();
  assert.equal(state.inspections.length,6);
  const createdResponse=await request('/api/inspections',{cookie,method:'POST',data:{property_id:'p1',kind:'move_out',requester_id:'rafael',deadline_at:'2026-12-15'}});
  assert.equal(createdResponse.status,201);const created=await createdResponse.json();
  assert.equal(created.status,'new');assert.equal(created.requester.password,undefined);assert.equal(created.property.tenant,undefined);
  const scheduled=await request('/api/inspections/'+created.id,{cookie,method:'PATCH',data:{revision:1,status:'new',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''}});
  assert.equal(scheduled.status,200);const proposed=await scheduled.json();assert.equal(proposed.status,'new');assert.equal(proposed.scheduled_end,'2026-12-15T15:30');
  assert.equal((await request('/api/inspections/'+created.id,{cookie,method:'PATCH',data:{revision:2,status:'received',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''}})).status,403);
  const inspector=await login('atendimento@demo.local'),accepted=await request('/api/inspections/'+created.id,{cookie:inspector,method:'PATCH',data:{revision:2,status:'received',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''}});
  assert.equal(accepted.status,200);const updated=await accepted.json();assert.equal(updated.status,'received');assert.equal(updated.scheduled_at,'2026-12-15T14:30');
  const finance=await login('financeiro@demo.local'),financeState=await (await request('/api/state',{cookie:finance})).json();
  assert.equal(financeState.inspections.length,0);assert.equal((await request('/api/inspections/i1',{cookie:finance})).status,403);
  const other=await login('outra@demo.local');assert.equal((await request('/api/inspections/'+created.id,{cookie:other})).status,404);
});
test('rejeita alteração cross-origin e JSON sem cabeçalho do cliente',async t=>{
  const {request,login}=await appFixture(t);const cookie=await login();
  assert.equal((await request('/api/tickets/t1/notes',{cookie,method:'POST',headers:{Origin:'https://example.com'},data:{audience:'internal',body:'Não gravar'}})).status,403);
  assert.equal((await request('/api/tickets/t1/notes',{cookie,method:'POST',headers:{'X-Gestor-Request':''},data:{audience:'internal',body:'Não gravar'}})).status,403);
  assert.equal((await request('/api/tickets/t1',{cookie})).status,200);
});
test('CSV neutraliza fórmulas em conteúdo informado pelo usuário',async t=>{
  const {request,login,db}=await appFixture(t);const cookie=await login();
  db.prepare('UPDATE tickets SET title=? WHERE id=?').run('=HYPERLINK("https://example.com")','t1');
  const report=await request('/api/export',{cookie});assert.ok((await report.text()).includes("'="));
});

test('endpoint DELETE /api/tickets/:id exclui chamado com sucesso',async t=>{
  const {request,login}=await appFixture(t);
  const cookie=await login();
  const res=await request('/api/tickets/t1',{cookie,method:'DELETE'});
  assert.equal(res.status,200);
  const json=await res.json();
  assert.equal(json.ok,true);
  const check=await request('/api/tickets/t1',{cookie});
  assert.equal(check.status,404);
});

test('rotas PATCH e DELETE /api/providers/:id atualizam e removem prestador',async t=>{
  const {request,login,db}=await appFixture(t);
  const cookie=await login();
  await request('/api/providers',{cookie,method:'POST',data:{name:'Prestador HTTP',specialty:'Vidraçaria',phone:'51999992222',email:'vidro@example.com'}});
  const prov=db.prepare("SELECT * FROM providers WHERE name='Prestador HTTP'").get();
  assert.ok(prov);
  const patchRes=await request('/api/providers/'+prov.id,{cookie,method:'PATCH',data:{name:'Vidraçaria Sul',specialty:'Vidros',phone:'51999993333',email:'sul@example.com',active:1}});
  assert.equal(patchRes.status,200);
  const delRes=await request('/api/providers/'+prov.id,{cookie,method:'DELETE'});
  assert.equal(delRes.status,200);
});
