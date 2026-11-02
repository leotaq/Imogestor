import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function ensureUsernames(db) {
  if (!db.prepare('PRAGMA table_info(users)').all().some(column => column.name === 'username')) {
    db.exec("ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT ''");
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    const users = db.prepare('SELECT id,name,username FROM users ORDER BY id').all();
    const used = new Set(users.filter(user => user.username).map(user => user.username.toLowerCase()));
    const update = db.prepare('UPDATE users SET username=? WHERE id=?');
    for (const user of users) {
      if (user.username) continue;
      const base = user.name.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'usuario';
      const suffix = user.id.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'usuario';
      let username = base;
      for (let attempt = 1; used.has(username.toLowerCase()); attempt++) username = `${base}_${suffix}${attempt === 1 ? '' : `_${attempt}`}`;
      used.add(username.toLowerCase());
      update.run(username, user.id);
    }
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username COLLATE NOCASE)');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function ensureActiveColumns(db) {
  for (const table of ['users', 'properties']) {
    if (!db.prepare(`PRAGMA table_info(${table})`).all().some(column => column.name === 'active')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))`);
    }
  }
}

function ensureUserJobTitle(db) {
  if (!db.prepare('PRAGMA table_info(users)').all().some(column => column.name === 'job_title')) {
    db.exec("ALTER TABLE users ADD COLUMN job_title TEXT NOT NULL DEFAULT ''");
  }
}

function ensurePropertyAddressColumns(db) {
  const columns=new Set(db.prepare('PRAGMA table_info(properties)').all().map(column=>column.name));
  for (const [name,definition] of Object.entries({
    property_street:'TEXT', property_number:'TEXT', property_complement:'TEXT', property_neighborhood:'TEXT',
    property_city:"TEXT CHECK(property_city IS NULL OR property_city IN ('Taquara','Parobé','Igrejinha'))"
  })) if(!columns.has(name)) db.exec(`ALTER TABLE properties ADD COLUMN ${name} ${definition}`);
}

function ensureInspectionKinds(db) {
  const schema=db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='inspections'").get()?.sql||'';
  if (schema.includes("'plate_photos'")&&schema.includes("'maintenance'")) return;
  db.exec('PRAGMA foreign_keys=OFF');
  let transaction=false;
  try {
    db.exec('BEGIN IMMEDIATE'); transaction=true;
    db.exec(`CREATE TABLE inspections_rebuild(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id), protocol TEXT NOT NULL,
      property_id TEXT NOT NULL, property_code_snapshot TEXT NOT NULL, address_snapshot TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('occupation','move_out','reinspection','visit','plate_photos','maintenance')),
      requester_id TEXT NOT NULL, inspector_id TEXT,
      status TEXT NOT NULL CHECK(status IN ('new','received','in_progress','no_contract','completed','finalized','cancelled')),
      deadline_at TEXT NOT NULL DEFAULT '', scheduled_at TEXT NOT NULL DEFAULT '',
      scheduled_end TEXT NOT NULL DEFAULT '', duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK(duration_minutes BETWEEN 0 AND 480),
      reason TEXT NOT NULL DEFAULT '', completion_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
      UNIQUE(id,org_id), UNIQUE(org_id,protocol),
      FOREIGN KEY(property_id,org_id) REFERENCES properties(id,org_id),
      FOREIGN KEY(requester_id,org_id) REFERENCES users(id,org_id),
      FOREIGN KEY(inspector_id,org_id) REFERENCES users(id,org_id)
    ) STRICT`);
    const columns='id,org_id,protocol,property_id,property_code_snapshot,address_snapshot,kind,requester_id,inspector_id,status,deadline_at,scheduled_at,reason,completion_note,created_at,updated_at,revision';
    db.exec(`INSERT INTO inspections_rebuild(${columns}) SELECT ${columns} FROM inspections`);
    db.exec('DROP TABLE inspections');
    db.exec('ALTER TABLE inspections_rebuild RENAME TO inspections');
    db.exec('CREATE INDEX IF NOT EXISTS inspections_org ON inspections(org_id,created_at)');
    db.exec('CREATE INDEX IF NOT EXISTS inspections_schedule ON inspections(org_id,scheduled_at)');
    db.exec('COMMIT'); transaction=false;
  } catch (error) {
    if(transaction) db.exec('ROLLBACK');
    throw error;
  } finally {
    db.exec('PRAGMA foreign_keys=ON');
  }
}

function ensureInspectionScheduleColumns(db) {
  const columns=new Set(db.prepare('PRAGMA table_info(inspections)').all().map(column=>column.name));
  if(!columns.has('scheduled_end')) db.exec("ALTER TABLE inspections ADD COLUMN scheduled_end TEXT NOT NULL DEFAULT ''");
  if(!columns.has('duration_minutes')) db.exec('ALTER TABLE inspections ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK(duration_minutes BETWEEN 0 AND 480)');
  db.exec('CREATE INDEX IF NOT EXISTS inspections_inspector_schedule ON inspections(org_id,inspector_id,scheduled_at)');
}

export function openDatabase(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys=ON;
    PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS organizations(id TEXT PRIMARY KEY, name TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS users(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL, username TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','staff','finance')),
      job_title TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), UNIQUE(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS properties(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id),
      code TEXT NOT NULL, name TEXT NOT NULL, address TEXT NOT NULL, unit TEXT NOT NULL,
      tenant TEXT NOT NULL, contact TEXT NOT NULL, owner TEXT NOT NULL,
      property_street TEXT, property_number TEXT, property_complement TEXT, property_neighborhood TEXT,
      property_city TEXT CHECK(property_city IS NULL OR property_city IN ('Taquara','Parobé','Igrejinha')),
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
      UNIQUE(id,org_id), UNIQUE(org_id,code)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS providers(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL, specialty TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), UNIQUE(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS tickets(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id),
      protocol TEXT NOT NULL, property_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
      requester TEXT NOT NULL, contact TEXT NOT NULL, tenant_snapshot TEXT NOT NULL, address_snapshot TEXT NOT NULL,
      category TEXT NOT NULL, priority TEXT NOT NULL, status TEXT NOT NULL, source TEXT NOT NULL,
      assignee_id TEXT, due_date TEXT NOT NULL, waiting_reason TEXT NOT NULL DEFAULT '', solution TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
      UNIQUE(id,org_id), UNIQUE(org_id,protocol),
      FOREIGN KEY(property_id,org_id) REFERENCES properties(id,org_id),
      FOREIGN KEY(assignee_id,org_id) REFERENCES users(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS inspections(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id), protocol TEXT NOT NULL,
      property_id TEXT NOT NULL, property_code_snapshot TEXT NOT NULL, address_snapshot TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('occupation','move_out','reinspection','visit','plate_photos','maintenance')),
      requester_id TEXT NOT NULL, inspector_id TEXT,
      status TEXT NOT NULL CHECK(status IN ('new','received','in_progress','no_contract','completed','finalized','cancelled')),
      deadline_at TEXT NOT NULL DEFAULT '', scheduled_at TEXT NOT NULL DEFAULT '',
      scheduled_end TEXT NOT NULL DEFAULT '', duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK(duration_minutes BETWEEN 0 AND 480),
      reason TEXT NOT NULL DEFAULT '', completion_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
      UNIQUE(id,org_id), UNIQUE(org_id,protocol),
      FOREIGN KEY(property_id,org_id) REFERENCES properties(id,org_id),
      FOREIGN KEY(requester_id,org_id) REFERENCES users(id,org_id),
      FOREIGN KEY(inspector_id,org_id) REFERENCES users(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS inspection_events(
      id INTEGER PRIMARY KEY, org_id TEXT NOT NULL, inspection_id TEXT NOT NULL,
      actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY(inspection_id,org_id) REFERENCES inspections(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS inspection_notifications(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, inspection_id TEXT NOT NULL, recipient_id TEXT NOT NULL,
      created_at TEXT NOT NULL, read_at TEXT NOT NULL DEFAULT '', UNIQUE(org_id,inspection_id,recipient_id),
      FOREIGN KEY(inspection_id,org_id) REFERENCES inspections(id,org_id),
      FOREIGN KEY(recipient_id,org_id) REFERENCES users(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS contracts(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id),
      property_id TEXT NOT NULL, property_code_snapshot TEXT NOT NULL, address_snapshot TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('occupation','addendum','other')), manual_reason TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '', requested_by TEXT NOT NULL, requested_at TEXT NOT NULL,
      deadline_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('requested','in_progress','sent_to_manager')),
      delay_reason TEXT NOT NULL DEFAULT '', delayed_at TEXT NOT NULL DEFAULT '', sent_to_manager_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
      UNIQUE(id,org_id),
      FOREIGN KEY(property_id,org_id) REFERENCES properties(id,org_id),
      FOREIGN KEY(requested_by,org_id) REFERENCES users(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS contract_events(
      id INTEGER PRIMARY KEY, org_id TEXT NOT NULL, contract_id TEXT NOT NULL,
      actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY(contract_id,org_id) REFERENCES contracts(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS contract_notifications(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, contract_id TEXT NOT NULL, recipient_id TEXT NOT NULL,
      created_at TEXT NOT NULL, read_at TEXT NOT NULL DEFAULT '', UNIQUE(org_id,contract_id,recipient_id),
      FOREIGN KEY(contract_id,org_id) REFERENCES contracts(id,org_id),
      FOREIGN KEY(recipient_id,org_id) REFERENCES users(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS quotes(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, ticket_id TEXT NOT NULL, provider_id TEXT NOT NULL,
      version INTEGER NOT NULL, scope TEXT NOT NULL, items TEXT NOT NULL, total INTEGER NOT NULL CHECK(total>=0),
      status TEXT NOT NULL, approver TEXT NOT NULL DEFAULT '', decision_note TEXT NOT NULL DEFAULT '',
      decision_at TEXT, decision_actor TEXT, created_at TEXT NOT NULL,
      UNIQUE(id,org_id), UNIQUE(ticket_id,version),
      FOREIGN KEY(ticket_id,org_id) REFERENCES tickets(id,org_id),
      FOREIGN KEY(provider_id,org_id) REFERENCES providers(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS orders(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, ticket_id TEXT NOT NULL, provider_id TEXT NOT NULL, quote_id TEXT,
      kind TEXT NOT NULL, scope TEXT NOT NULL, scheduled_at TEXT NOT NULL, status TEXT NOT NULL,
      authorization_by TEXT NOT NULL, authorization_note TEXT NOT NULL, authorized_cents INTEGER NOT NULL,
      completion TEXT NOT NULL DEFAULT '', evidence_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
      UNIQUE(id,org_id), FOREIGN KEY(ticket_id,org_id) REFERENCES tickets(id,org_id),
      FOREIGN KEY(provider_id,org_id) REFERENCES providers(id,org_id),
      FOREIGN KEY(quote_id,org_id) REFERENCES quotes(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS notes(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, ticket_id TEXT NOT NULL, author TEXT NOT NULL,
      body TEXT NOT NULL, audience TEXT NOT NULL CHECK(audience IN ('internal','resident','provider','owner')),
      created_at TEXT NOT NULL, FOREIGN KEY(ticket_id,org_id) REFERENCES tickets(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS events(
      id INTEGER PRIMARY KEY, org_id TEXT NOT NULL, ticket_id TEXT NOT NULL, actor TEXT NOT NULL,
      action TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id,org_id) REFERENCES tickets(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS costs(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, ticket_id TEXT NOT NULL,
      description TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0),
      paid INTEGER NOT NULL DEFAULT 0 CHECK(paid>=0 AND paid<=amount), payer TEXT NOT NULL,
      due_date TEXT NOT NULL, payment_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id,org_id) REFERENCES tickets(id,org_id), UNIQUE(id,org_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS attachments(
      id TEXT PRIMARY KEY, org_id TEXT NOT NULL, ticket_id TEXT NOT NULL,
      name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, storage_name TEXT NOT NULL UNIQUE,
      sha256 TEXT NOT NULL, audience TEXT NOT NULL DEFAULT 'internal', created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id,org_id) REFERENCES tickets(id,org_id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS tickets_org ON tickets(org_id,created_at);
    CREATE INDEX IF NOT EXISTS events_ticket ON events(org_id,ticket_id,id);
    CREATE INDEX IF NOT EXISTS inspections_org ON inspections(org_id,created_at);
    CREATE INDEX IF NOT EXISTS inspections_schedule ON inspections(org_id,scheduled_at);
    CREATE INDEX IF NOT EXISTS inspection_events_record ON inspection_events(org_id,inspection_id,id);
    CREATE INDEX IF NOT EXISTS inspection_notifications_recipient ON inspection_notifications(org_id,recipient_id,created_at);
    CREATE INDEX IF NOT EXISTS contracts_org_deadline ON contracts(org_id,status,deadline_at);
    CREATE INDEX IF NOT EXISTS contract_events_record ON contract_events(org_id,contract_id,id);
    CREATE INDEX IF NOT EXISTS contract_notifications_recipient ON contract_notifications(org_id,recipient_id,created_at);
  `);
  ensureUsernames(db);
  ensureActiveColumns(db);
  ensureUserJobTitle(db);
  ensurePropertyAddressColumns(db);
  ensureInspectionKinds(db);
  ensureInspectionScheduleColumns(db);
  return db;
}

export const DEMO_PASSWORD = 'DemoGestor!2026';
export function seedDemo(db) {
  if (db.prepare('SELECT id FROM organizations LIMIT 1').get()) return;
  const now = new Date();
  const day = (offset) => { const d = new Date(now); d.setDate(d.getDate() + offset); return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d); };
  const at = (offset) => new Date(now.getTime() + offset * 86400000).toISOString();
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO organizations VALUES (?,?)').run('aurora', 'Imobiliária Aurora');
    db.prepare('INSERT INTO organizations VALUES (?,?)').run('horizonte', 'Imobiliária Horizonte');
    const userInsert = db.prepare('INSERT INTO users(id,org_id,name,username,email,password,role) VALUES (?,?,?,?,?,?,?)');
    userInsert.run('marina','aurora','Marina Costa','marina','gestor@demo.local',passwordHash(DEMO_PASSWORD),'admin');
    userInsert.run('rafael','aurora','Rafael Lima','rafael','atendimento@demo.local',passwordHash(DEMO_PASSWORD),'staff');
    db.prepare("UPDATE users SET job_title='vistoriador' WHERE id='rafael'").run();
    userInsert.run('bia','aurora','Beatriz Alves','bia','financeiro@demo.local',passwordHash(DEMO_PASSWORD),'finance');
    userInsert.run('outra','horizonte','Equipe Horizonte','equipe_horizonte','outra@demo.local',passwordHash(DEMO_PASSWORD),'admin');
    const props = [
      ['p1','IM-001','Residencial Ipê','Rua das Acácias, 145 · Centro, Porto Alegre/RS','Apto 302','Ana Ribeiro','ana@example.com','Luiz Ferreira'],
      ['p2','IM-002','Casa Jardim','Rua dos Jasmins, 82 · Jardim, Porto Alegre/RS','Casa 02','Pedro Martins','pedro@example.com','Clara Gomes'],
      ['p3','IM-003','Edifício Alameda','Av. das Palmeiras, 520 · Bela Vista, Porto Alegre/RS','Apto 704','Joana Dias','joana@example.com','Roberto Lima'],
      ['p4','IM-004','Residencial Horizonte','Rua dos Cedros, 210 · Centro, Porto Alegre/RS','Apto 101','Lucas Souza','lucas@example.com','Helena Costa'],
      ['p5','IM-005','Condomínio dos Lagos','Rua dos Lagos, 90 · Jardim, Porto Alegre/RS','Área comum','','condominio@example.com','Condomínio dos Lagos']
    ];
    const propertyInsert=db.prepare('INSERT INTO properties(id,org_id,code,name,address,unit,tenant,contact,owner) VALUES (?,?,?,?,?,?,?,?,?)');
    for (const p of props) propertyInsert.run(p[0],'aurora',...p.slice(1));
    propertyInsert.run('p-other','horizonte','HZ-01','Imóvel privado','Endereço fictício','Sala 1','Outro titular','outro@example.com','Outro proprietário');
    const providers = [['v1','Carlos Mendes','Hidráulica','(51) 90000-0101','carlos@example.com'],['v2','Elétrica Sul','Elétrica','(51) 90000-0102','eletrica@example.com'],['v3','Renova Reparos','Pintura e infiltração','(51) 90000-0103','renova@example.com'],['v4','Chave & Cia','Fechaduras','(51) 90000-0104','chaves@example.com']];
    for (const p of providers) db.prepare('INSERT INTO providers VALUES (?,?,?,?,?,?,1)').run(p[0],'aurora',...p.slice(1));
    const tickets = [
      ['t1','p1','Vazamento na pia da cozinha','A água está acumulando no armário sob a pia. O registro foi fechado.','Hidráulica','urgent','triage','marina',-1,-3],
      ['t2','p2','Tomadas da sala sem energia','As tomadas da parede principal não estão funcionando.','Elétrica','high','waiting','rafael',2,-2],
      ['t3','p3','Infiltração na parede do quarto','Mancha de umidade próxima à janela depois da chuva.','Infiltração','normal','in_progress','marina',3,-4],
      ['t4','p4','Fechadura da porta emperrando','A chave está girando com dificuldade na porta de entrada.','Fechadura','normal','new',null,4,-1],
      ['t5','p5','Revisão da iluminação do hall','Dois pontos de luz do hall estão apagados.','Elétrica','low','resolved','rafael',-1,-7],
      ['t6','p2','Ajuste da torneira do banheiro','Torneira continua pingando após fechar.','Hidráulica','normal','closed','marina',-2,-12],
      ['t7','p3','Vedação da janela da sala','Entrada de água durante chuva forte.','Infiltração','high','new',null,1,-1]
    ];
    for (const [id,pid,title,description,category,priority,status,assignee,due,created] of tickets) {
      const p = db.prepare('SELECT * FROM properties WHERE id=?').get(pid);
      db.prepare(`INSERT INTO tickets(id,org_id,protocol,property_id,title,description,requester,contact,tenant_snapshot,address_snapshot,category,priority,status,source,assignee_id,due_date,waiting_reason,solution,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,'aurora',`CH-${String(1041 + Number(id.slice(1))).padStart(4,'0')}`,pid,title,description,p.tenant || 'Síndica do condomínio',p.contact,p.tenant,`${p.address} · ${p.unit}`,category,priority,status,'WhatsApp',assignee,day(due),status==='waiting'?'Aprovação do orçamento':'', ['resolved','closed'].includes(status)?'Serviço realizado e registrado pela equipe.':'',at(created),at(-1));
      db.prepare('INSERT INTO events(org_id,ticket_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)').run('aurora',id,'Marina Costa','Chamado registrado','Dados fictícios para demonstração do painel.',at(created));
    }
    db.prepare('INSERT INTO quotes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('q1','aurora','t2','v2',1,'Revisar circuito e substituir duas tomadas',JSON.stringify([{label:'Mão de obra',cents:28000},{label:'Materiais',cents:9500}]),37500,'pending','','',null,null,at(-1));
    db.prepare('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('o1','aurora','t3','v3',null,'diagnosis','Avaliar origem da infiltração',`${day(0)}T14:00`,'scheduled','Roberto Lima','Visita autorizada por telefone; registro feito pela equipe.',0,'','',at(-2));
    db.prepare('INSERT INTO costs VALUES (?,?,?,?,?,?,?,?,?,?)').run('c1','aurora','t5','Substituição de luminárias',24000,0,'Proprietário',day(3),'',at(-1));
    db.prepare('INSERT INTO costs VALUES (?,?,?,?,?,?,?,?,?,?)').run('c2','aurora','t6','Reparo da torneira',18000,18000,'Proprietário',day(-2),'Pagamento fictício de demonstração',at(-3));
    const inspections=[
      ['i1','p1','move_out','rafael','marina','new',day(3),`${day(3)}T09:00`,-1,'',''],
      ['i2','p2','occupation','marina','rafael','received',day(4),`${day(4)}T14:00`,-2,'',''],
      ['i3','p3','reinspection','rafael','marina','in_progress',day(1),`${day(0)}T10:00`,-1,'',''],
      ['i4','p4','visit','marina','rafael','completed',day(-1),`${day(-2)}T11:00`,-4,'','Checklist concluído na demonstração.'],
      ['i5','p5','occupation','rafael',null,'no_contract',day(2),'',-3,'Pedido cancelado por falta de contrato.',''],
      ['i6','p2','move_out','marina',null,'cancelled',day(1),'',-5,'Cancelamento de demonstração.','']
    ];
    for(const [index,[id,propertyId,kind,requesterId,inspectorId,status,deadline,scheduled,created,reason,completion]] of inspections.entries()) {
      const property=db.prepare('SELECT code,address,unit FROM properties WHERE id=?').get(propertyId);
      const createdAt=at(created);
      db.prepare(`INSERT INTO inspections(id,org_id,protocol,property_id,property_code_snapshot,address_snapshot,kind,requester_id,inspector_id,status,deadline_at,scheduled_at,reason,completion_note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,'aurora',`VST-${String(index+1).padStart(4,'0')}`,propertyId,property.code,`${property.address} · ${property.unit}`,kind,requesterId,inspectorId,status,deadline,scheduled,reason,completion,createdAt,createdAt);
      db.prepare('INSERT INTO inspection_events(org_id,inspection_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)').run('aurora',id,requesterId==='marina'?'Marina Costa':'Rafael Lima','Pedido registrado',`Pedido fictício de ${kind}.`,createdAt);
      if(status!=='new') db.prepare('INSERT INTO inspection_events(org_id,inspection_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)').run('aurora',id,'Marina Costa','Situação atualizada',status==='in_progress'?'Vistoria iniciada.':status==='completed'?'Vistoria concluída.':status==='finalized'?'Vistoria finalizada.':status==='no_contract'?'Sem contrato.':status==='cancelled'?'Pedido cancelado.':'Vistoria recebida.',createdAt);
    }
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}
