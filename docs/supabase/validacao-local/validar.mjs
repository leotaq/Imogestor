import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const sql = fs.readFileSync(new URL('../001_manutencao_base.sql', import.meta.url), 'utf8');
const db = new PGlite();
const checks = [];
const check = async (name, fn) => { await fn(); checks.push(name); };
const one = async (query, args=[]) => (await db.query(query,args)).rows[0];
const denied = async (query,code,args=[]) => {
  let failure;
  try { await db.query(query,args); } catch (e) { failure = e; }
  assert.equal(failure?.code,code,`Esperado SQLSTATE ${code}; recebido ${failure?.message ?? 'sucesso'}`);
};
const bootstrap = `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;`;
try {
 await db.exec(bootstrap);
 await db.exec(`CREATE TABLE public.properties(id uuid PRIMARY KEY, code text, address text);
  CREATE TABLE public.people(id uuid PRIMARY KEY,name text);
  CREATE TABLE public.inspections(id uuid PRIMARY KEY, property_code text);
  GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
  INSERT INTO public.properties VALUES ('00000000-0000-4000-8000-000000000001','TESTE-1','Endereco ficticio');`);
 const fingerprint = async()=>JSON.stringify((await db.query(`SELECT c.relname,c.relacl::text,c.relrowsecurity,c.relforcerowsecurity,
  (SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod)) ORDER BY a.attnum)
   FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped) AS columns,
  (SELECT jsonb_agg(pg_get_constraintdef(k.oid) ORDER BY k.conname) FROM pg_constraint k WHERE k.conrelid=c.oid) AS constraints
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname`)).rows);
 const before = await fingerprint();
 await check('DDL completo executa em PostgreSQL local',()=>db.exec(sql));
 await check('Definicoes e permissoes das tabelas public de teste permanecem iguais',async()=>assert.equal(await fingerprint(),before));
 await check('Todas as quatro tabelas novas tem RLS ativo',async()=>{
  const r=await one(`SELECT count(*)::int AS total, bool_and(c.relrowsecurity) AS rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='gestor_manutencao' AND c.relkind='r'`);
  assert.deepEqual(r,{total:4,rls:true});
 });
 await check('anon, authenticated e service_role nao recebem acesso ao schema ou tabelas',async()=>{
  for(const role of ['anon','authenticated','service_role']){
   const r=await one(`SELECT has_schema_privilege($1,'gestor_manutencao','USAGE') AS schema_usage,
    has_table_privilege($1,'gestor_manutencao.requests','SELECT') AS table_select`,[role]);
   assert.deepEqual(r,{schema_usage:false,table_select:false});
   await db.exec(`SET ROLE ${role}`);
   try { await denied('SELECT * FROM gestor_manutencao.requests','42501'); }
   finally { await db.exec('RESET ROLE'); }
  }
 });
 const org1=(await one(`INSERT INTO gestor_manutencao.organizations(name) VALUES ('Imobiliaria ficticia A') RETURNING id`)).id;
 const org2=(await one(`INSERT INTO gestor_manutencao.organizations(name) VALUES ('Imobiliaria ficticia B') RETURNING id`)).id;
 const values=[org1,'Titular ficticio','Solicitante ficticio','51999990000','Rua de teste','s/n','Bairro ficticio','Cidade ficticia','RS','90000000'];
 const insert=`INSERT INTO gestor_manutencao.requests
  (organization_id,source,category,description,leaseholder_name_declared,requester_name,contact_phone,street,number,neighborhood,city,state_code,postal_code,property_id,property_code_snapshot,property_address_snapshot)
  VALUES ($1,'tenant_portal','hidraulica','Vazamento ficticio',$2,$3,$4,$5,$6,$7,$8,$9,$10,'00000000-0000-4000-8000-000000000001','TESTE-1','Endereco ficticio') RETURNING id,protocol,property_link_status`;
 let ticket;
 await check('Chamado publico declarado aceita s/n e comeca com vinculo pendente',async()=>{
  ticket=await one(insert,values); assert.equal(ticket.property_link_status,'pending'); assert.ok(ticket.protocol);
 });
 await check('Contato ausente e rejeitado',async()=>{
  const empty=[...values]; empty[3]=' '; await denied(insert,'23514',empty);
 });
 await check('Endereco obrigatorio incompleto e rejeitado',async()=>{
  const empty=[...values]; empty[4]=''; await denied(insert,'23514',empty);
 });
 await check('Vinculo confirmado exige identificador de imovel',async()=>{
  await denied(`UPDATE gestor_manutencao.requests SET property_link_status='confirmed',property_id=NULL WHERE id=$1`,'23514',[ticket.id]);
 });
 const eventSql=`INSERT INTO gestor_manutencao.request_events(organization_id,request_id,event_type,actor_ref,message) VALUES($1,$2,'created','operador-ficticio','Registro ficticio') RETURNING visibility`;
 await check('Historico de outra organizacao e rejeitado por FK composta',async()=>{await denied(eventSql,'23503',[org2,ticket.id]);});
 await check('Notas novas sao internas por padrao',async()=>{assert.equal((await one(eventSql,[org1,ticket.id])).visibility,'internal');});
 const attachmentSql=`INSERT INTO gestor_manutencao.request_attachments
  (organization_id,request_id,object_key,original_name,media_type,byte_size,sha256,uploaded_by_ref)
  VALUES($1,$2,$3,'teste.png','image/png',$4,$5,'operador-ficticio') RETURNING visibility`;
 const sha='a'.repeat(64);
 await check('Anexo de outra organizacao e rejeitado',async()=>{await denied(attachmentSql,'23503',[org2,ticket.id,'teste-externo',100,sha]);});
 await check('Anexo acima de 10 MiB e rejeitado',async()=>{await denied(attachmentSql,'23514',[org1,ticket.id,'teste-grande',10485761,sha]);});
 await check('Metadados de anexo valido sao internos por padrao',async()=>{assert.equal((await one(attachmentSql,[org1,ticket.id,'teste-valido',100,sha])).visibility,'internal');});
 await check('Exclusao do imovel no sistema antigo nao e bloqueada e preserva snapshot',async()=>{
  await db.query(`DELETE FROM public.properties WHERE code='TESTE-1'`);
  const r=await one(`SELECT property_code_snapshot,property_address_snapshot FROM gestor_manutencao.requests WHERE id=$1`,[ticket.id]);
  assert.deepEqual(r,{property_code_snapshot:'TESTE-1',property_address_snapshot:'Endereco ficticio'});
 });
 await check('RLS sem policies bloqueia leitura/insercao mesmo se teste conceder grants',async()=>{
  await db.exec(`BEGIN; GRANT USAGE ON SCHEMA gestor_manutencao TO authenticated; GRANT SELECT,INSERT ON gestor_manutencao.organizations TO authenticated; SET LOCAL ROLE authenticated;`);
  try {
   assert.equal((await db.query('SELECT * FROM gestor_manutencao.organizations')).rows.length,0);
   await denied(`INSERT INTO gestor_manutencao.organizations(name) VALUES ('Nao permitido')`,'42501');
  } finally {await db.exec('ROLLBACK');}
 });
 await check('Reaplicar rascunho falha sem modificar schema preexistente',async()=>{
  let code;
  try{await db.exec(sql);}catch(e){code=e.code;}finally{await db.exec('ROLLBACK');}
  assert.equal(code,'42P06'); assert.equal((await one(`SELECT count(*)::int AS n FROM gestor_manutencao.requests`)).n,1);
 });
 const rollbackDb=new PGlite();
 try {
  await rollbackDb.exec(bootstrap);
  await check('Falha antes do COMMIT permite reverter toda a criacao',async()=>{
   let code;
   try{await rollbackDb.exec(sql.replace(/COMMIT;\s*$/,'SELECT 1/0; COMMIT;'));}catch(e){code=e.code;}
   finally{await rollbackDb.exec('ROLLBACK');}
   assert.equal(code,'22012');
   const result=await rollbackDb.query(`SELECT count(*)::int AS n FROM pg_namespace WHERE nspname='gestor_manutencao'`);
   assert.equal(result.rows[0].n,0);
  });
 }finally{await rollbackDb.close();}
 const version=(await one('SELECT version() AS value')).value;
 const report={local_date:'2026-10-19',environment:'PGlite 0.5.10 em memoria; somente dados ficticios; sem rede de banco',version,
  sql_sha256:crypto.createHash('sha256').update(sql).digest('hex'),passed:checks.length,checks,
  limits:['Nao reproduz Supabase Auth, Storage, PostgREST ou event triggers gerenciados','Nao e backup nem restauracao de producao','Nao valida fluxos do site de vistorias contra uma copia','Nenhum SQL DDL executado no Supabase remoto']};
 fs.writeFileSync(new URL('../validacao-postgres-local.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
} finally {await db.close();}
