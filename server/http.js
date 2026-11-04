import { isSupabaseConfigured, syncAllFromSupabase } from './supabase.js';
import { createServer } from 'node:http';
import { randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Service, AppError, text } from './service.js';

const publicDir=fileURLToPath(new URL('../public/',import.meta.url));
const sha=(s)=>createHash('sha256').update(s).digest('hex');
const staticFiles={ '/':['index.html','text/html; charset=utf-8'], '/app.js':['app.js','text/javascript; charset=utf-8'], '/styles.css':['styles.css','text/css; charset=utf-8'], '/favicon.svg':['favicon.svg','image/svg+xml'] };
function safeUser(user) { return {id:user.id,name:user.name,email:user.email,role:user.role}; }
function samePassword(password,stored) { const [salt,hex]=stored.split(':'); const candidate=scryptSync(password,salt,64);return timingSafeEqual(candidate,Buffer.from(hex,'hex')); }
async function body(req) {
  if(req.body&&typeof req.body==='object'&&!Array.isArray(req.body)) return req.body;
  if(typeof req.body==='string') {
    try { const data=JSON.parse(req.body); if(data&&typeof data==='object'&&!Array.isArray(data)) return data; } catch {}
  }
  if(!req.headers['content-type']?.startsWith('application/json')) throw new AppError('Formato de envio inválido.',415);
  let bytes=0;const chunks=[];
  for await(const chunk of req) { bytes+=chunk.length;if(bytes>8*1024*1024) throw new AppError('Envio muito grande. Máximo 5 MB por arquivo.',413); chunks.push(chunk); }
  try { const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!data||typeof data!=='object'||Array.isArray(data)) throw new Error();return data; } catch { throw new AppError('Dados de envio inválidos.'); }
}

let lastStateSync = 0;
export function createHandler({db,uploadsDir}) {
  const service=new Service(db), attempts=new Map();
  return async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
    try {
      const host=req.headers.host||'';
      if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) && !process.env.VERCEL && !host.includes('vercel.app')) throw new AppError('Este ambiente aceita apenas acesso local.',403);
      const proto=req.headers['x-forwarded-proto']||(req.socket?.encrypted?'https':'http');
      const url=new URL(req.url,`${proto}://${host}`),pathname=url.pathname;
      if(req.method==='GET'&&staticFiles[pathname]) {
        const [file,type]=staticFiles[pathname];res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache','Expires':'0'});res.end(await readFile(join(publicDir,file)));return;
      }
      if(req.method==='GET'&&pathname==='/api/health') {json({ok:true,mode:process.env.VERCEL?'vercel':'local-demo'});return;}
      if(!pathname.startsWith('/api/')) throw new AppError('Página não encontrada.',404);
      if(!['GET','HEAD'].includes(req.method)) {
        if(req.headers['x-gestor-request']!=='1') throw new AppError('Requisição não autorizada.',403);
        if(req.headers.origin && req.headers.origin!==`http://${host}` && req.headers.origin!==`https://${host}`) throw new AppError('Origem não autorizada.',403);
      }
      if(req.method==='POST'&&pathname==='/api/login') {
        const input=await body(req),identifier=text(input.identifier??input.email,'Usuário ou e-mail',180).toLowerCase(),password=text(input.password,'Senha',200);
        const key=req.socket.remoteAddress||'local',now=Date.now();
        for(const [k,a] of attempts) if(a.until<now) attempts.delete(k);
        const attempt=attempts.get(key);
        if(attempt&&attempt.count>=10) throw new AppError('Muitas tentativas. Aguarde 15 minutos.',429);
        const matches=db.prepare('SELECT * FROM users WHERE active=1 AND (lower(email)=? OR username=? COLLATE NOCASE) LIMIT 2').all(identifier,identifier);
        const user=matches.length===1?matches[0]:null;
        // A derivação fictícia evita uma diferença de custo óbvia para e-mail inexistente.
        const valid=samePassword(password,user?.password||`${'0'.repeat(32)}:${'0'.repeat(128)}`);
        if(!user||!valid) {attempts.set(key,{count:(attempt?.count||0)+1,until:attempt?.until||now+900000});throw new AppError('Usuário, e-mail ou senha incorretos.',401);}
        attempts.delete(key);db.prepare('DELETE FROM sessions WHERE expires<?').run(now);
        const token=randomBytes(32).toString('hex');
        db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(sha(token),user.id,now+8*3600000);
        res.setHeader('Set-Cookie',`gestor_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
        json(safeUser(user));return;
      }
      const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('gestor_session='))?.slice(15);
      const user=cookie?db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1').get(sha(cookie),Date.now()):null;
      if(!user) throw new AppError('Entre para acessar o painel.',401);
      if(req.method==='POST'&&pathname==='/api/logout') {
        db.prepare('DELETE FROM sessions WHERE token=?').run(sha(cookie));res.setHeader('Set-Cookie','gestor_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');json({ok:true});return;
      }
      if(req.method==='POST'&&pathname==='/api/sync') {
        await syncAllFromSupabase(db, user.org_id);
        json({ok:true,synced_at:new Date().toISOString()});return;
      }
      if(req.method==='GET'&&pathname==='/api/state') {
        const now = Date.now();
        if(now - lastStateSync > 15000) {
          lastStateSync = now;
          await syncAllFromSupabase(db, user.org_id).catch(err => console.error('[Auto State Sync Error]:', err.message));
        }
        json({...service.catalogs(user),...(user.role==='admin'?{adminUsers:service.adminUsers(user)}:{}),tickets:service.list(user),inspections:service.listInspections(user),contracts:service.listContracts(user),notifications:service.notifications(user),
          orders:db.prepare(`SELECT o.*,t.protocol,t.title,p.name property_name,p.unit,v.name provider_name FROM orders o JOIN tickets t ON t.id=o.ticket_id AND t.org_id=o.org_id JOIN properties p ON p.id=t.property_id AND p.org_id=t.org_id JOIN providers v ON v.id=o.provider_id AND v.org_id=o.org_id WHERE o.org_id=? ORDER BY o.scheduled_at`).all(user.org_id),
          costs:db.prepare('SELECT c.*,t.protocol,t.title FROM costs c JOIN tickets t ON t.id=c.ticket_id AND t.org_id=c.org_id WHERE c.org_id=? ORDER BY c.created_at DESC').all(user.org_id)});return;
      }
      if(req.method==='GET'&&pathname==='/api/notifications') {json(service.notifications(user));return;}
      if(req.method==='GET'&&pathname==='/api/export') {
        const csvCell=(value)=>{let s=String(value??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
        const rows=[['Protocolo','Título','Imóvel','Solicitante','Categoria','Prioridade','Situação','Responsável','Prazo','Custo realizado (BRL)'],...service.list(user).map(t=>[t.protocol,t.title,`${t.property_name} ${t.unit}`,t.requester,t.category,t.priority,t.status,t.assignee_name,t.due_date,(t.cost_total/100).toFixed(2)])];
        res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="chamados.csv"'});res.end('\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'));return;
      }
      if(req.method==='POST'&&pathname==='/api/users') {
          const created = service.createUser(user,await body(req));
          await syncUserToSupabase(created).catch(e => console.error('[Supabase sync error]:', e.message));
          json(created,201);
          return;
        }
      const notificationMatch=pathname.match(/^\/api\/notifications\/([\w-]+)\/read$/);
      if(req.method==='POST'&&notificationMatch) {json(service.markNotificationRead(user,notificationMatch[1]));return;}
      const userMatch=pathname.match(/^\/api\/users\/([\w-]+)$/);
      if(userMatch&&req.method==='PATCH') {
          const updated = service.updateUser(user,userMatch[1],await body(req));
          await syncUserToSupabase(updated).catch(e => console.error('[Supabase sync error]:', e.message));
          json(updated);
          return;
        }
      const providerMatch=pathname.match(/^\/api\/providers\/([\w-]+)$/);
      if(providerMatch) {
        if(req.method==='GET') {json(service.row('providers',providerMatch[1],user.org_id));return;}
        if(req.method==='PATCH') {json(service.updateProvider(user,providerMatch[1],await body(req)));return;}
        if(req.method==='DELETE') {json(service.deleteProvider(user,providerMatch[1]));return;}
      }
      if(req.method==='POST'&&['/api/properties','/api/providers'].includes(pathname)) {json(service.catalogCreate(user,pathname.split('/')[2],await body(req)),201);return;}
      if(req.method==='POST'&&pathname==='/api/tickets') {json(service.createTicket(user,await body(req)),201);return;}
      if(req.method==='POST'&&pathname==='/api/inspections') {json(service.createInspection(user,await body(req)),201);return;}
      if(req.method==='POST'&&pathname==='/api/contracts') {json(service.createContract(user,await body(req)),201);return;}
      const contractMatch=pathname.match(/^\/api\/contracts\/([\w-]+)$/);
      if(contractMatch) {
        if(req.method==='GET') {json(service.contractDetail(user,contractMatch[1]));return;}
        if(req.method==='PATCH') {json(service.updateContract(user,contractMatch[1],await body(req)));return;}
      }
      const resetMatch=pathname.match(/^\/api\/inspections\/([\w-]+)\/reset$/);
      if(resetMatch&&req.method==='POST') {json(service.resetInspection(user,resetMatch[1]));return;}
      const inspectionMatch=pathname.match(/^\/api\/inspections\/([\w-]+)$/);
      if(inspectionMatch) {
        if(req.method==='GET') {json(service.inspectionDetail(user,inspectionMatch[1]));return;}
        if(req.method==='PATCH') {json(service.updateInspection(user,inspectionMatch[1],await body(req)));return;}
        if(req.method==='DELETE') {json(service.deleteInspection(user,inspectionMatch[1]));return;}
      }
      const fileMatch=pathname.match(/^\/api\/attachments\/([\w-]+)$/);
      if(fileMatch&&req.method==='GET') {
        const file=service.row('attachments',fileMatch[1],user.org_id);
        const content=await readFile(join(uploadsDir,file.storage_name));
        res.writeHead(200,{'Content-Type':file.mime,'Content-Length':content.length,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`});res.end(content);return;
      }
      const match=pathname.match(/^\/api\/tickets\/([\w-]+)(?:\/(notes|quotes|orders|costs|attachments)(?:\/([\w-]+))?)?$/);
      if(!match) throw new AppError('Recurso não encontrado.',404);
      const [,id,action,childId]=match;
      service.row('tickets',id,user.org_id);
      if(req.method==='GET'&&!action) {json(service.detail(user,id));return;}
      if(req.method==='DELETE'&&!action) {
        const result=service.deleteTicket(user,id);
        if(result.storageNames?.length) {
          for(const name of result.storageNames) {
            try { await unlink(join(uploadsDir,name)); } catch {}
          }
        }
        json({ok:true,id,protocol:result.protocol});
        return;
      }
      const input=await body(req);
      if(req.method==='PATCH'&&!action) {json(service.updateTicket(user,id,input));return;}
      if(req.method==='POST') {
        if(action==='notes') {json(service.note(user,id,input),201);return;}
        if(action==='quotes'&&!childId) {json(service.quote(user,id,input),201);return;}
        if(action==='quotes'&&childId) {json(service.decide(user,id,childId,input));return;}
        if(action==='orders'&&!childId) {json(service.order(user,id,input),201);return;}
        if(action==='orders'&&childId) {json(service.orderUpdate(user,id,childId,input));return;}
        if(action==='costs'&&!childId) {json(service.cost(user,id,input),201);return;}
        if(action==='costs'&&childId) {json(service.pay(user,id,childId,input));return;}
        if(action==='attachments'&&!childId) {
          const name=basename(text(input.name,'Nome do arquivo',180));
          const allowed={'image/png':b=>b.subarray(0,8).toString('hex')==='89504e470d0a1a0a','image/jpeg':b=>b.subarray(0,3).toString('hex')==='ffd8ff','image/webp':b=>b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP','application/pdf':b=>b.subarray(0,5).toString()==='%PDF-'};
          if(!allowed[input.mime]||typeof input.data!=='string'||!input.data||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.data)) throw new AppError('Use arquivo JPEG, PNG, WebP ou PDF.');
          const bytes=Buffer.from(input.data,'base64');
          if(!bytes.length||bytes.length>5*1024*1024) throw new AppError('Arquivo deve ter até 5 MB.');
          if(!allowed[input.mime](bytes)) throw new AppError('O conteúdo não corresponde ao tipo do arquivo.');
          const fileId=randomUUID(),storageName=randomUUID();await mkdir(uploadsDir,{recursive:true});
          await writeFile(join(uploadsDir,storageName),bytes,{flag:'wx'});
          try {service.transaction(()=>{
            db.prepare('INSERT INTO attachments VALUES(?,?,?,?,?,?,?,?,?,?)').run(fileId,user.org_id,id,name,input.mime,bytes.length,storageName,sha(bytes),'internal',new Date().toISOString());
            service.event(user,id,'Anexo recebido',`${name} · acesso interno.`);
          });} catch(e) {await unlink(join(uploadsDir,storageName));throw e;}
          json(service.detail(user,id),201);return;
        }
      }
      throw new AppError('Operação não encontrada.',404);
    } catch(error) {
      if(error instanceof AppError) json({...error.details,error:error.message},error.status);
      else {console.error('Falha interna:',error.message);json({error:'Não foi possível concluir. Os dados anteriores foram preservados.'},500);}
    }
  };
}

export function createApp({db,uploadsDir}) {
  const handler=createHandler({db,uploadsDir});
  const server=createServer(handler);
  return {server};
}
