import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, passwordHash } from '../server/database.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const snapshot=JSON.parse(readFileSync(join(root,'data','inspections-snapshot-2026-10-31.json'),'utf8'));
const org='aurora';
const kinds={ocupacao:'occupation',desocupacao:'move_out',revistoria:'reinspection',visita:'visit',placa_fotos:'plate_photos',manutencao:'maintenance'};
const statuses={new:'new',received:'received',in_progress:'in_progress',awaiting_contract:'no_contract',completed:'completed',finalized:'finalized',canceled:'cancelled'};
const statusNames={new:'Nova',received:'Recebida',in_progress:'Em andamento',no_contract:'Sem contrato',completed:'Concluída',finalized:'Finalizada',cancelled:'Cancelada'};
const slug=value=>value.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'equipe';
const db=openDatabase(join(root,'data','gestor.sqlite'));
try {
  if(!snapshot.people?.length||!snapshot.inspections?.length||!Array.isArray(snapshot.events)) throw new Error('Exportação incompleta.');
  if(db.prepare('SELECT count(*) n FROM inspections WHERE org_id=?').get(org).n!==0) throw new Error('A organização já tem vistorias; importação cancelada para evitar duplicação.');
  const people=new Map(snapshot.people.map(person=>[person.id,person]));
  if(snapshot.inspections.some(item=>!people.has(item.created_by)||(item.assigned_to&&!people.has(item.assigned_to)))) throw new Error('Há vínculos de equipe ausentes no retrato exportado.');
  if(snapshot.events.some(event=>!people.has(event.changed_by)&&event.changed_by)) throw new Error('Há responsáveis de histórico ausentes no retrato exportado.');

  const existingUsers=db.prepare('SELECT id,org_id,active,username FROM users').all();
  const usersById=new Map(existingUsers.map(user=>[user.id,user]));
  const activePeople=snapshot.people.filter(person=>person.active);
  if(activePeople.some(person=>usersById.get(person.id)?.org_id!==org||usersById.get(person.id)?.active!==1)) throw new Error('Uma pessoa ativa do Supabase não tem conta ativa nesta cópia local.');
  const unusedUsernames=new Set(existingUsers.map(user=>user.username.toLowerCase()));
  const updateUser=db.prepare('UPDATE users SET name=?,active=? WHERE id=? AND org_id=?');
  const addUser=db.prepare('INSERT INTO users(id,org_id,name,username,email,password,role,active) VALUES(?,?,?,?,?,?,?,?)');
  const addProperty=db.prepare('INSERT INTO properties(id,org_id,code,name,address,unit,tenant,contact,owner,active) VALUES(?,?,?,?,?,?,?,?,?,?)');
  const currentPropertyIds=new Set(db.prepare('SELECT id FROM properties WHERE org_id=?').all(org).map(property=>property.id));
  const archivedProperties=new Map();
  const insertInspection=db.prepare(`INSERT INTO inspections(
    id,org_id,protocol,property_id,property_code_snapshot,address_snapshot,kind,requester_id,inspector_id,status,
    deadline_at,scheduled_at,reason,completion_note,created_at,updated_at,revision
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?, ?,?,?,?, ?,1)`);
  const insertEvent=db.prepare('INSERT INTO inspection_events(org_id,inspection_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)');
  const eventsForInspection=new Set();
  let disabledUsers=0,archivedPropertiesCreated=0;

  db.exec('BEGIN IMMEDIATE');
  try {
    for(const person of snapshot.people) {
      const existing=usersById.get(person.id);
      if(existing) {
        updateUser.run(person.name,person.active?1:0,person.id,org);
        continue;
      }
      if(person.active) throw new Error('Conta ativa ausente; nenhuma nova senha será criada nesta importação.');
      const base=`historico_${slug(person.name)}_${person.id.replace(/-/g,'').slice(0,8)}`;
      let username=base;
      for(let suffix=2;unusedUsernames.has(username.toLowerCase());suffix++) username=`${base}_${suffix}`;
      unusedUsernames.add(username.toLowerCase());
      addUser.run(person.id,org,person.name,username,`${username}@local.invalid`,passwordHash(randomBytes(32).toString('hex')),'staff',0);
      disabledUsers++;
    }

    const byDate=[...snapshot.inspections].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
    for(const [index,item] of byDate.entries()) {
      const kind=kinds[item.type],status=statuses[item.status];
      if(!kind||!status) throw new Error(`Tipo ou situação sem mapeamento: ${item.type}/${item.status}`);
      let propertyId=item.matched_property_id&&currentPropertyIds.has(item.matched_property_id)?item.matched_property_id:null;
      if(!propertyId) {
        const address=item.address_snapshot||'Endereço não informado';
        const code=(item.property_code||'').trim();
        const key=`${code.toLowerCase()}\u0000${address.toLowerCase()}`;
        propertyId=archivedProperties.get(key);
        if(!propertyId) {
          const hash=createHash('sha256').update(key||item.id).digest('hex');
          propertyId=`historical-property-${hash.slice(0,24)}`;
          let propertyCode=`HIST-${hash.slice(0,16).toUpperCase()}`;
          let suffix=2;
          while(db.prepare('SELECT id FROM properties WHERE org_id=? AND code=?').get(org,propertyCode)) propertyCode=`HIST-${hash.slice(0,14).toUpperCase()}-${suffix++}`;
          addProperty.run(propertyId,org,propertyCode,'Cadastro histórico sem vínculo atual',address,'','','','',0);
          archivedProperties.set(key,propertyId); currentPropertyIds.add(propertyId); archivedPropertiesCreated++;
        }
      }
      const protocol=`HIST-${String(index+1).padStart(4,'0')}`;
      const created=item.created_at||snapshot.exportedAt;
      insertInspection.run(item.id,org,protocol,propertyId,item.property_code||'',item.address_snapshot||'Endereço não informado',kind,item.created_by,item.assigned_to||null,status,'',item.scheduled_at||'',item.notes||'','',created,item.updated_at||created);
    }

    const eventInsertOrder=[...snapshot.events].sort((a,b)=>a.changed_at.localeCompare(b.changed_at)||a.id.localeCompare(b.id));
    for(const event of eventInsertOrder) {
      const from=event.from_status?statuses[event.from_status]:null,to=statuses[event.to_status];
      if(!to||(event.from_status&&!from)) throw new Error(`Situação histórica sem mapeamento: ${event.from_status}/${event.to_status}`);
      const actor=people.get(event.changed_by)?.name||'Sistema anterior';
      const action=from?'Situação atualizada':'Pedido registrado';
      const detail=from?`${statusNames[from]} → ${statusNames[to]}`:`Situação inicial: ${statusNames[to]}`;
      insertEvent.run(org,event.inspection_id,actor,action,detail,event.changed_at);
      eventsForInspection.add(event.inspection_id);
    }
    for(const item of byDate) if(!eventsForInspection.has(item.id)) {
      insertEvent.run(org,item.id,people.get(item.created_by).name,'Pedido importado','Registro trazido da base de vistorias.',item.created_at||snapshot.exportedAt);
    }
    const imported=db.prepare('SELECT count(*) n FROM inspections WHERE org_id=?').get(org).n;
    const importedEvents=db.prepare('SELECT count(*) n FROM inspection_events WHERE org_id=?').get(org).n;
    if(imported!==snapshot.inspections.length||importedEvents<snapshot.events.length) throw new Error('A contagem importada não confere.');
    if(db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Falha de integridade referencial.');
    db.exec('COMMIT');
    console.log(JSON.stringify({inspections:imported,historyEvents:importedEvents,disabledPeople:disabledUsers,archivedProperties:archivedPropertiesCreated,sourceChecklistItems:snapshot.checklistItemCount||0}));
  } catch(error) {
    db.exec('ROLLBACK');
    throw error;
  }
} finally { db.close(); }
