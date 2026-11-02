import { randomUUID } from 'node:crypto';
import { passwordHash } from './database.js';

export const STATUSES = ['new','triage','waiting','in_progress','resolved','closed','cancelled'];
export const PRIORITIES = ['low','normal','high','urgent'];
export const CATEGORIES = ['Hidráulica','Elétrica','Infiltração','Fechadura','Equipamento','Estrutura','Área comum','Outro'];
export const INSPECTION_KINDS = ['occupation','move_out','reinspection','visit','plate_photos','maintenance'];
export const INSPECTION_STATUSES = ['new','received','in_progress','no_contract','completed','finalized','cancelled'];
const CONTRACT_KINDS = ['occupation','addendum','other'];
const stateNames={new:'Novo',triage:'Em triagem',waiting:'Aguardando',in_progress:'Em atendimento',resolved:'Solucionado',closed:'Encerrado',cancelled:'Cancelado'};
const inspectionStateNames={new:'Nova',received:'Aceita',in_progress:'Em andamento',no_contract:'Sem contrato',completed:'Concluída',finalized:'Finalizada',cancelled:'Cancelada'};
const inspectionKindNames={occupation:'Ocupação',move_out:'Desocupação',reinspection:'Revistoria',visit:'Visita',plate_photos:'Fotos de placa',maintenance:'Manutenção'};
export class AppError extends Error { constructor(message,status=400,details={}) { super(message); this.status=status; this.details=details; } }
export function text(value,label,max=2000,required=true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new AppError(`${label}: informe um valor válido (até ${max} caracteres).`);
  return value.trim();
}
function pick(value,values,label) { if(!values.includes(value)) throw new AppError(`${label} inválido.`); return value; }
function date(value) { if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value) throw new AppError('Informe uma data válida.'); return value; }
function dateTime(value) { if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new AppError('Informe data e horário da vistoria.'); date(value.slice(0,10)); if(Number(value.slice(11,13))>23||Number(value.slice(14))>59) throw new AppError('Horário inválido.'); return value; }
function appointmentEnd(start,duration) { return new Date(Date.parse(`${start}:00Z`)+duration*60000).toISOString().slice(0,16); }
function timeMinutes(value) { return Number(value.slice(11,13))*60+Number(value.slice(14,16)); }
function timeAt(day,minutes) { return `${day}T${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`; }
function todayInSaoPaulo() { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()); }
function cents(value,zero=false) { if(!Number.isSafeInteger(value)||value<(zero?0:1)||value>100000000) throw new AppError('Valor inválido.'); return value; }

function userInput(input,updating=false,currentJobTitle='') {
  const name=text(input.name,'Nome',150),username=text(input.username,'Usuário',64).toLowerCase();
  if(!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(username)) throw new AppError('Use no usuário letras sem acento, números, ponto, hífen ou sublinhado.');
  const email=text(input.email||'','E-mail',180,false).toLowerCase()||`${username}@local.invalid`;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Informe um e-mail válido.');
  const role=pick(input.role,['admin','staff','finance'],'Função'),password=text(input.password||'','Senha',200,!updating);
  const job_title=text(input.job_title??currentJobTitle,'Cargo / nomenclatura',80,false);
  if(password&&password.length<8) throw new AppError('A senha deve ter pelo menos 8 caracteres.');
  let active=1;
  if(updating) {
    if(['1',1,true].includes(input.active)) active=1;
    else if(['0',0,false].includes(input.active)) active=0;
    else throw new AppError('Informe se o usuário está ativo.');
  }
  return {name,username,email,role,password,job_title,active};
}
export class Service {
  constructor(db) { this.db=db; }
  row(table,id,org) {
    if(!['tickets','properties','providers','users','quotes','orders','costs','attachments','inspections','contracts'].includes(table)) throw new Error('Tabela não permitida');
    const row=this.db.prepare(`SELECT * FROM ${table} WHERE id=? AND org_id=?`).get(id,org);
    if(!row) throw new AppError('Registro não encontrado.',404);
    return row;
  }
  admin(user) { if(user.role!=='admin') throw new AppError('Esta ação exige acesso de gestão.',403); }
  financial(user) { if(!['admin','finance'].includes(user.role)) throw new AppError('Esta ação exige acesso financeiro.',403); }
  transaction(fn) { this.db.exec('BEGIN IMMEDIATE'); try { const result=fn(); this.db.exec('COMMIT'); return result; } catch(e) { this.db.exec('ROLLBACK'); throw e; } }
  appointmentRows(user,inspectorId,excludeId='') {
    return this.db.prepare("SELECT id,scheduled_at,scheduled_end,duration_minutes FROM inspections WHERE org_id=? AND inspector_id=? AND scheduled_at<>'' AND status<>'cancelled' AND id<>?").all(user.org_id,inspectorId,excludeId);
  }
  suggestAppointmentSlots(user,inspectorId,requested,duration,excludeId='') {
    const busy=this.appointmentRows(user,inspectorId,excludeId).map(row=>[row.scheduled_at,row.scheduled_end||appointmentEnd(row.scheduled_at,row.duration_minutes)]);
    const firstDay=new Date(`${requested.slice(0,10)}T00:00:00Z`),suggestions=[];
    for(let offset=0;offset<14&&suggestions.length<3;offset++) {
      const day=new Date(firstDay);day.setUTCDate(day.getUTCDate()+offset);const dayText=day.toISOString().slice(0,10);
      for(const [from,to] of [[480,660],[780,1080]]) {
        let minute=Math.ceil(Math.max(from,offset===0?timeMinutes(requested):from)/15)*15;
        for(;minute+duration<=to&&suggestions.length<3;minute+=15) {
          const start=timeAt(dayText,minute),end=appointmentEnd(start,duration);
          if(!busy.some(([a,b])=>a<end&&b>start)){suggestions.push(start);minute+=duration-15;}
        }
      }
    }
    return suggestions;
  }
  validateAppointment(user,inspectorId,startValue,durationValue,excludeId='') {
    const inspector=this.row('users',inspectorId,user.org_id);
    if(inspector.active!==1||!['admin','staff'].includes(inspector.role)) throw new AppError('Selecione alguém ativo da equipe como vistoriador.');
    if(String(inspector.job_title||'').trim().toLowerCase()!=='vistoriador') throw new AppError('Defina o cargo Vistoriador no painel Equipe antes de atribuir a agenda.');
    const start=dateTime(startValue),duration=Number(durationValue);
    if(!Number.isInteger(duration)||duration<15||duration>480||duration%15) throw new AppError('Informe a duração em blocos de 15 minutos, entre 15 e 480.');
    const end=appointmentEnd(start,duration),from=timeMinutes(start),to=timeMinutes(end);
    if(!([[480,660],[780,1080]].some(([a,b])=>from>=a&&to<=b))) throw new AppError('O expediente é das 08:00 às 11:00 e das 13:00 às 18:00. Ajuste o início ou a duração.');
    const conflict=this.appointmentRows(user,inspectorId,excludeId).some(row=>{
      const existingEnd=row.scheduled_end||appointmentEnd(row.scheduled_at,row.duration_minutes);
      return row.scheduled_at<end&&existingEnd>start;
    });
    if(conflict) {
      const suggestions=this.suggestAppointmentSlots(user,inspectorId,start,duration,excludeId);
      const formatted=suggestions.map(value=>`${value.slice(0,10)} às ${value.slice(11)}`).join(', ');
      throw new AppError(`Conflito com outro agendamento deste vistoriador.${formatted?` Horários livres sugeridos: ${formatted}.`: ' Não encontrei vaga nos próximos 14 dias.'}`,409,{suggestions});
    }
    return {start,end,duration};
  }
  event(user,id,action,detail) {
    const now=new Date().toISOString();
    this.db.prepare('INSERT INTO events(org_id,ticket_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)').run(user.org_id,id,user.name,action,detail,now);
    this.db.prepare('UPDATE tickets SET updated_at=? WHERE id=? AND org_id=?').run(now,id,user.org_id);
  }
  catalogs(user) {
    return {
      organization:this.db.prepare('SELECT name FROM organizations WHERE id=?').get(user.org_id).name,
      user:{id:user.id,name:user.name,email:user.email,role:user.role},
      users:this.db.prepare('SELECT id,name,role,job_title FROM users WHERE org_id=? AND active=1 ORDER BY name').all(user.org_id),
      properties:this.db.prepare('SELECT * FROM properties WHERE org_id=? AND active=1 ORDER BY code').all(user.org_id),
      providers:this.db.prepare('SELECT * FROM providers WHERE org_id=? ORDER BY name').all(user.org_id), categories:CATEGORIES
    };
  }
  ensureUniqueUser(username,email,exceptId='') {
    if(this.db.prepare('SELECT id FROM users WHERE (username=? COLLATE NOCASE OR lower(email)=?) AND id<>? LIMIT 1').get(username,email,exceptId)) throw new AppError('Já existe uma conta com esse usuário ou e-mail.');
  }
  adminUsers(user) {
    this.admin(user);
    return this.db.prepare("SELECT id,name,username,email,role,job_title,active FROM users WHERE org_id=? AND lower(email) NOT LIKE '%@demo.local' ORDER BY active DESC,name COLLATE NOCASE").all(user.org_id);
  }
  createUser(user,input) {
    this.admin(user);
    const fields=userInput(input);
    return this.transaction(()=>{
      this.ensureUniqueUser(fields.username,fields.email);
      const id=randomUUID();
      this.db.prepare('INSERT INTO users(id,org_id,name,username,email,password,role,job_title,active) VALUES(?,?,?,?,?,?,?,?,1)').run(id,user.org_id,fields.name,fields.username,fields.email,passwordHash(fields.password),fields.role,fields.job_title);
      return this.db.prepare('SELECT id,name,username,email,role,job_title,active FROM users WHERE id=? AND org_id=?').get(id,user.org_id);
    });
  }
  updateUser(user,id,input) {
    this.admin(user);
    const current=this.row('users',id,user.org_id),fields=userInput(input,true,current.job_title||'');
    if(id===user.id&&(fields.role!==current.role||fields.active!==current.active)) throw new AppError('Peça a outro administrador para alterar sua própria função ou situação.');
    return this.transaction(()=>{
      this.ensureUniqueUser(fields.username,fields.email,id);
      if(current.role==='admin'&&current.active===1&&(fields.role!=='admin'||fields.active!==1)) {
        const remaining=this.db.prepare("SELECT COUNT(*) total FROM users WHERE org_id=? AND role='admin' AND active=1 AND id<>?").get(user.org_id,id).total;
        if(!remaining) throw new AppError('Mantenha pelo menos um usuário ativo com acesso de Gestão.');
      }
      this.db.prepare('UPDATE users SET name=?,username=?,email=?,password=?,role=?,job_title=?,active=? WHERE id=? AND org_id=?').run(fields.name,fields.username,fields.email,fields.password?passwordHash(fields.password):current.password,fields.role,fields.job_title,fields.active,id,user.org_id);
      if(fields.password||fields.role!==current.role||fields.active!==current.active) this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
      return this.db.prepare('SELECT id,name,username,email,role,job_title,active FROM users WHERE id=? AND org_id=?').get(id,user.org_id);
    });
  }
  list(user) {
    return this.db.prepare(`SELECT t.*,p.name property_name,p.unit,p.code property_code,u.name assignee_name,
      (SELECT COUNT(*) FROM quotes q WHERE q.ticket_id=t.id AND q.org_id=t.org_id AND q.status='pending') pending_quotes,
      (SELECT COALESCE(SUM(c.amount),0) FROM costs c WHERE c.ticket_id=t.id AND c.org_id=t.org_id) cost_total
      FROM tickets t JOIN properties p ON p.id=t.property_id AND p.org_id=t.org_id
      LEFT JOIN users u ON u.id=t.assignee_id AND u.org_id=t.org_id WHERE t.org_id=? ORDER BY t.created_at DESC`).all(user.org_id);
  }
  detail(user,id) {
    const ticket=this.row('tickets',id,user.org_id);
    const related=(table)=>this.db.prepare(`SELECT * FROM ${table} WHERE ticket_id=? AND org_id=? ORDER BY ${table==='events'?'id':'created_at'}`).all(id,user.org_id);
    return {...ticket,property:this.row('properties',ticket.property_id,user.org_id),
      quotes:related('quotes').map(q=>({...q,items:JSON.parse(q.items)})),orders:related('orders'),notes:related('notes'),events:related('events'),costs:related('costs'),
      attachments:related('attachments').map(({storage_name,sha256,...a})=>a)};
  }
  inspectionAccess(user) { if(!['admin','staff'].includes(user.role)) throw new AppError('Esta área exige acesso da equipe de vistorias.',403); }
  listInspections(user) {
    if(!['admin','staff'].includes(user.role)) return [];
    return this.db.prepare(`SELECT i.*,p.name property_name,p.unit,coalesce(nullif(i.property_code_snapshot,''),p.code) property_code,r.name requester_name,v.name inspector_name
      FROM inspections i JOIN properties p ON p.id=i.property_id AND p.org_id=i.org_id
      JOIN users r ON r.id=i.requester_id AND r.org_id=i.org_id
      LEFT JOIN users v ON v.id=i.inspector_id AND v.org_id=i.org_id
      WHERE i.org_id=? ORDER BY CASE WHEN i.scheduled_at='' THEN 1 ELSE 0 END,i.scheduled_at,i.created_at DESC`).all(user.org_id);
  }
  notifications(user) {
    if(!['admin','staff'].includes(user.role)) return {unread_count:0,items:[]};
    const inspectionCount=this.db.prepare("SELECT COUNT(*) total FROM inspection_notifications WHERE org_id=? AND recipient_id=? AND read_at=''").get(user.org_id,user.id).total;
    const contractCount=this.db.prepare("SELECT COUNT(*) total FROM contract_notifications WHERE org_id=? AND recipient_id=? AND read_at=''").get(user.org_id,user.id).total;
    const inspections=this.db.prepare(`SELECT 'inspection' AS type,n.id,n.inspection_id,n.created_at,n.read_at,i.protocol,i.kind,i.property_code_snapshot property_code,i.address_snapshot,i.completion_note,v.name inspector_name
      FROM inspection_notifications n JOIN inspections i ON i.id=n.inspection_id AND i.org_id=n.org_id
      LEFT JOIN users v ON v.id=i.inspector_id AND v.org_id=i.org_id
      WHERE n.org_id=? AND n.recipient_id=? ORDER BY n.created_at DESC LIMIT 50`).all(user.org_id,user.id);
    const contracts=this.db.prepare(`SELECT 'contract' AS type,n.id,n.contract_id,n.created_at,n.read_at,c.kind,c.manual_reason,c.property_code_snapshot property_code,c.address_snapshot,u.name sender_name
      FROM contract_notifications n JOIN contracts c ON c.id=n.contract_id AND c.org_id=n.org_id
      JOIN users u ON u.id=c.requested_by AND u.org_id=c.org_id
      WHERE n.org_id=? AND n.recipient_id=? ORDER BY n.created_at DESC LIMIT 50`).all(user.org_id,user.id);
    const items=[...inspections,...contracts].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,50);
    return {unread_count:inspectionCount+contractCount,items};
  }
  markNotificationRead(user,id) {
    this.inspectionAccess(user);
    const now=new Date().toISOString();
    const inspection=this.db.prepare('SELECT id FROM inspection_notifications WHERE id=? AND org_id=? AND recipient_id=?').get(id,user.org_id,user.id);
    if(inspection) this.db.prepare("UPDATE inspection_notifications SET read_at=? WHERE id=? AND org_id=? AND recipient_id=? AND read_at=''").run(now,id,user.org_id,user.id);
    else {
      const contract=this.db.prepare('SELECT id FROM contract_notifications WHERE id=? AND org_id=? AND recipient_id=?').get(id,user.org_id,user.id);
      if(!contract) throw new AppError('Aviso não encontrado.',404);
      this.db.prepare("UPDATE contract_notifications SET read_at=? WHERE id=? AND org_id=? AND recipient_id=? AND read_at=''").run(now,id,user.org_id,user.id);
    }
    return {ok:true};
  }
  inspectionDetail(user,id) {
    this.inspectionAccess(user);
    const inspection=this.row('inspections',id,user.org_id);
    const contract=inspection.contract_id?this.db.prepare(`
      SELECT c.*, u.name requester_name 
      FROM contracts c 
      JOIN users u ON u.id=c.requested_by AND u.org_id=c.org_id 
      WHERE c.id=? AND c.org_id=?
    `).get(inspection.contract_id,user.org_id):null;
    return {...inspection,
      property:this.db.prepare('SELECT id,code,name,address,unit FROM properties WHERE id=? AND org_id=?').get(inspection.property_id,user.org_id),
      requester:this.db.prepare('SELECT id,name,role FROM users WHERE id=? AND org_id=?').get(inspection.requester_id,user.org_id),
      inspector:inspection.inspector_id?this.db.prepare('SELECT id,name,role FROM users WHERE id=? AND org_id=?').get(inspection.inspector_id,user.org_id):null,
      contract,
      events:this.db.prepare('SELECT * FROM inspection_events WHERE inspection_id=? AND org_id=? ORDER BY id').all(id,user.org_id)};
  }
  inspectionEvent(user,id,action,detail) {
    const now=new Date().toISOString();
    this.db.prepare('INSERT INTO inspection_events(org_id,inspection_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)').run(user.org_id,id,user.name,action,detail,now);
    this.db.prepare('UPDATE inspections SET updated_at=? WHERE id=? AND org_id=?').run(now,id,user.org_id);
  }
  createInspection(user,input) {
    this.inspectionAccess(user);
    const property=this.row('properties',input.property_id,user.org_id),kind=pick(input.kind,INSPECTION_KINDS,'Tipo de vistoria');
    if(property.active!==1) throw new AppError('Este imóvel está arquivado e não aceita novos pedidos.');
    const requesterId=input.requester_id||user.id,requester=this.row('users',requesterId,user.org_id);
    if(requester.active!==1||!['admin','staff'].includes(requester.role)) throw new AppError('Selecione alguém ativo da equipe como solicitante.');
    let deadline=input.deadline_at?date(input.deadline_at):'';
    const inspectorId=input.inspector_id||null,scheduled=input.scheduled_at?dateTime(input.scheduled_at):'';
    if(Boolean(inspectorId)!==Boolean(scheduled)) throw new AppError('Informe o vistoriador e a data da proposta juntos.');

    let contractId=input.contract_id||'';
    let linkedContract=null;
    if(contractId) {
      linkedContract=this.db.prepare('SELECT * FROM contracts WHERE id=? AND org_id=?').get(contractId,user.org_id);
    } else if(kind==='occupation') {
      linkedContract=this.db.prepare("SELECT * FROM contracts WHERE org_id=? AND property_id=? AND kind='occupation' AND requested_by=? ORDER BY requested_at DESC LIMIT 1").get(user.org_id,property.id,requester.id);
      if(!linkedContract) {
        linkedContract=this.db.prepare("SELECT * FROM contracts WHERE org_id=? AND property_id=? AND kind='occupation' ORDER BY requested_at DESC LIMIT 1").get(user.org_id,property.id);
      }
      if(linkedContract) contractId=linkedContract.id;
    }

    if(!deadline&&linkedContract?.deadline_at) {
      deadline=linkedContract.deadline_at;
    }

    const id=randomUUID(),now=new Date().toISOString();
    return this.transaction(()=>{
      const appointment=scheduled?this.validateAppointment(user,inspectorId,scheduled,input.duration_minutes):{start:'',end:'',duration:0};
      const number=this.db.prepare('SELECT COUNT(*) n FROM inspections WHERE org_id=?').get(user.org_id).n;
      const protocol=`VST-${String(number+1).padStart(4,'0')}`;
      this.db.prepare(`INSERT INTO inspections(id,org_id,protocol,property_id,property_code_snapshot,address_snapshot,kind,requester_id,inspector_id,status,deadline_at,scheduled_at,scheduled_end,duration_minutes,contract_id,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,'new',?,?,?,?,?,?,?)`).run(id,user.org_id,protocol,property.id,property.code,`${property.address} · ${property.unit}`,kind,requester.id,inspectorId,deadline,appointment.start,appointment.end,appointment.duration,contractId,now,now);
      this.inspectionEvent(user,id,'Pedido registrado',`${inspectionKindNames[kind]} · ${property.code}.`);
      if(linkedContract) {
        this.inspectionEvent(user,id,'Contrato vinculado',`Vinculada ao contrato de ocupação solicitado por ${requester.name} (Previsão de entrega/assinatura: ${linkedContract.deadline_at}).`);
        this.contractEvent(user,linkedContract.id,'Vistoria vinculada',`Vistoria de ocupação ${protocol} criada por ${requester.name} e vinculada.`,now);
      }
      if(scheduled)this.inspectionEvent(user,id,'Horário proposto',`${this.row('users',inspectorId,user.org_id).name} · ${appointment.start}–${appointment.end}. Aguardando aceite do vistoriador.`);
      return this.inspectionDetail(user,id);
    });
  }
  updateInspection(user,id,input) {
    this.inspectionAccess(user);
    const current=this.row('inspections',id,user.org_id);
    if(!Number.isInteger(input.revision)||input.revision!==current.revision) throw new AppError('A vistoria mudou. Atualize a página antes de salvar.',409);
    const status=pick(input.status,INSPECTION_STATUSES,'Situação');
    const transitions={new:['new','received','no_contract','cancelled'],received:['new','received','in_progress','no_contract','cancelled'],in_progress:['in_progress','completed','no_contract','cancelled'],no_contract:['no_contract'],completed:['completed','finalized'],finalized:['finalized'],cancelled:['cancelled']};
    const inspectorId=input.inspector_id||null;
    const scheduled=input.scheduled_at?dateTime(input.scheduled_at):'';
    if(Boolean(inspectorId)!==Boolean(scheduled)) throw new AppError('Informe o vistoriador e a data da vistoria juntos.');
    const duration=scheduled?Number(input.duration_minutes??current.duration_minutes):0;
    const appointmentChanged=inspectorId!==current.inspector_id||scheduled!==current.scheduled_at||duration!==current.duration_minutes;
    if(current.status==='received'&&appointmentChanged&&user.role!=='admin') throw new AppError('Somente a Gestão pode alterar um horário aceito.');
    if(appointmentChanged&&['in_progress','no_contract','completed','finalized','cancelled'].includes(current.status)) throw new AppError('O horário fica bloqueado depois que a vistoria começa ou é encerrada.');
    let nextStatus=status;
    if(current.status==='new'&&status==='received') {
      if(!scheduled) throw new AppError('A vistoria precisa ter horário proposto antes do aceite.');
      if(user.id!==inspectorId) throw new AppError('Somente o vistoriador designado pode aceitar este horário.',403);
    }
    if(current.status==='received'&&appointmentChanged) nextStatus='new';
    if(!transitions[current.status].includes(nextStatus)) throw new AppError('Transição inválida para esta vistoria.');
    const reason=text(input.reason||'','Motivo',1500,false),completion=text(input.completion_note||'','Registro da vistoria',4000,false);
    if(['no_contract','cancelled'].includes(nextStatus)&&!reason) throw new AppError('Registre o motivo antes de continuar.');
    if(['completed','finalized'].includes(nextStatus)&&!completion) throw new AppError('Registre o resultado antes de concluir.');
    return this.transaction(()=>{
      const now=new Date().toISOString();
      const appointment=scheduled?((appointmentChanged||current.status==='new')&&nextStatus!=='cancelled'?this.validateAppointment(user,inspectorId,scheduled,duration,id):{start:scheduled,end:current.scheduled_end||appointmentEnd(scheduled,current.duration_minutes),duration}):{start:'',end:'',duration:0};
      const result=this.db.prepare(`UPDATE inspections SET inspector_id=?,scheduled_at=?,scheduled_end=?,duration_minutes=?,status=?,reason=?,completion_note=?,contract_id=coalesce(?,contract_id),updated_at=?,revision=revision+1
        WHERE id=? AND org_id=? AND revision=?`).run(inspectorId,appointment.start,appointment.end,appointment.duration,nextStatus,reason,completion,input.contract_id!==undefined?input.contract_id:null,now,id,user.org_id,input.revision);
      if(!result.changes) throw new AppError('A vistoria mudou. Atualize antes de salvar.',409);
      const changes=[];
      if(nextStatus!==current.status) changes.push(`${inspectionStateNames[current.status]} → ${inspectionStateNames[nextStatus]}`);
      if(inspectorId!==current.inspector_id) changes.push(`Vistoriador: ${inspectorId?this.row('users',inspectorId,user.org_id).name:'não atribuído'}`);
      if(scheduled!==current.scheduled_at) changes.push(scheduled?`Agendada para ${scheduled}`:'Agendamento removido');
      if(duration!==current.duration_minutes&&scheduled) changes.push(`Duração prevista: ${duration} min`);
      if(reason) changes.push(reason);
      if(completion) changes.push(completion);
      this.inspectionEvent(user,id,nextStatus!==current.status?'Situação atualizada':'Agendamento atualizado',changes.join(' · ')||'Registro atualizado.');
      if(nextStatus==='new'&&scheduled&&(appointmentChanged||current.status!=='new')) this.inspectionEvent(user,id,'Novo horário proposto',`${this.row('users',inspectorId,user.org_id).name} · ${appointment.start}–${appointment.end}. Aguardando novo aceite.`);
      if(nextStatus==='received'&&current.status==='new') this.inspectionEvent(user,id,'Horário aceito',`${this.row('users',inspectorId,user.org_id).name} confirmou o agendamento.`);
      if(nextStatus==='completed'&&current.status!=='completed'&&current.requester_id!==user.id) {
        const requester=this.db.prepare('SELECT active FROM users WHERE id=? AND org_id=?').get(current.requester_id,user.org_id);
        if(requester?.active) this.db.prepare('INSERT OR IGNORE INTO inspection_notifications(id,org_id,inspection_id,recipient_id,created_at) VALUES(?,?,?,?,?)').run(randomUUID(),user.org_id,id,current.requester_id,now);
      }
      if(nextStatus==='finalized'&&current.status!=='finalized'&&current.requester_id===user.id) {
        this.db.prepare("UPDATE inspection_notifications SET read_at=? WHERE org_id=? AND inspection_id=? AND recipient_id=? AND read_at=''").run(now,user.org_id,id,user.id);
      }
      return this.inspectionDetail(user,id);
    });
  }
  contractAccess(user) { if(!['admin','staff'].includes(user.role)) throw new AppError('Esta área exige acesso da equipe.',403); }
  contractRecord(user,id) {
    const c=this.row('contracts',id,user.org_id);
    const property=this.db.prepare('SELECT id,code,name,address,unit FROM properties WHERE id=? AND org_id=?').get(c.property_id,user.org_id);
    const requester=this.db.prepare('SELECT id,name FROM users WHERE id=? AND org_id=?').get(c.requested_by,user.org_id);
    const events=this.db.prepare('SELECT * FROM contract_events WHERE contract_id=? AND org_id=? ORDER BY id').all(id,user.org_id);
    const inspections=this.db.prepare(`
      SELECT i.id,i.protocol,i.kind,i.status,i.scheduled_at,i.deadline_at,v.name inspector_name
      FROM inspections i
      LEFT JOIN users v ON v.id=i.inspector_id AND v.org_id=i.org_id
      WHERE i.org_id=? AND (i.contract_id=? OR (i.property_id=? AND i.kind='occupation' AND i.requester_id=?))
      ORDER BY i.created_at DESC
    `).all(user.org_id,id,c.property_id,c.requested_by);
    return {...c,property,requester,inspections,overdue:c.status!=='sent_to_manager'&&c.deadline_at<todayInSaoPaulo(),events};
  }
  listContracts(user) {
    if(!['admin','staff'].includes(user.role)) return [];
    return this.db.prepare(`SELECT c.*,p.name property_name,p.unit,u.name requester_name,
      CASE WHEN c.status<>'sent_to_manager' AND c.deadline_at<? THEN 1 ELSE 0 END overdue
      FROM contracts c JOIN properties p ON p.id=c.property_id AND p.org_id=c.org_id
      JOIN users u ON u.id=c.requested_by AND u.org_id=c.org_id
      WHERE c.org_id=? ORDER BY overdue DESC,c.deadline_at,c.requested_at DESC`).all(todayInSaoPaulo(),user.org_id);
  }
  contractDetail(user,id) { this.contractAccess(user);return this.contractRecord(user,id); }
  contractEvent(user,id,action,detail,now) {
    this.db.prepare('INSERT INTO contract_events(org_id,contract_id,actor,action,detail,created_at) VALUES(?,?,?,?,?,?)').run(user.org_id,id,user.name,action,detail,now);
  }
  createContract(user,input) {
    this.admin(user);
    const property=this.row('properties',input.property_id,user.org_id),kind=pick(input.kind,CONTRACT_KINDS,'Tipo de contrato');
    if(property.active!==1) throw new AppError('Este imóvel está arquivado e não aceita novos pedidos.');
    const requesterId=input.requested_by||user.id,requester=this.row('users',requesterId,user.org_id);
    if(requester.active!==1||!['admin','staff'].includes(requester.role)) throw new AppError('Selecione alguém ativo da equipe como solicitante.');
    const manualReason=text(input.manual_reason||'','Motivo',400,kind==='other');
    const details=text(input.details||'','Informações para confecção',4000,false);
    const deadline=date(input.deadline_at),id=randomUUID(),now=new Date().toISOString();
    return this.transaction(()=>{
      this.db.prepare(`INSERT INTO contracts(id,org_id,property_id,property_code_snapshot,address_snapshot,kind,manual_reason,details,requested_by,requested_at,deadline_at,status,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,'requested',?)`).run(id,user.org_id,property.id,property.code,`${property.address} · ${property.unit}`,kind,manualReason,details,requester.id,now,deadline,now);
      this.contractEvent(user,id,'Solicitação criada',`${kind==='occupation'?'Ocupação':kind==='addendum'?'Aditivo':manualReason} · ${property.code}. Previsão de entrega e assinatura: ${deadline}.`,now);
      if(kind==='occupation') {
        const openInspection=this.db.prepare("SELECT id,protocol FROM inspections WHERE org_id=? AND property_id=? AND kind='occupation' AND requester_id=? AND (contract_id='' OR contract_id IS NULL) ORDER BY created_at DESC LIMIT 1").get(user.org_id,property.id,requester.id);
        if(openInspection) {
          this.db.prepare("UPDATE inspections SET contract_id=?,updated_at=? WHERE id=? AND org_id=?").run(id,now,openInspection.id,user.org_id);
          this.inspectionEvent(user,openInspection.id,'Contrato vinculado',`Vinculada à solicitação de contrato de ocupação (Previsão de entrega/assinatura: ${deadline}).`);
          this.contractEvent(user,id,'Vistoria vinculada',`Vistoria de ocupação ${openInspection.protocol} vinculada.`,now);
        }
      }
      return this.contractRecord(user,id);
    });
  }
  updateContract(user,id,input) {
    this.contractAccess(user);
    const current=this.row('contracts',id,user.org_id);
    if(!Number.isInteger(input.revision)||input.revision!==current.revision) throw new AppError('O pedido mudou. Atualize a página antes de salvar.',409);
    const action=pick(input.action,['start','justify_delay','send_to_manager'],'Ação');
    const now=new Date().toISOString();
    return this.transaction(()=>{
      if(action==='start') {
        if(current.status!=='requested') throw new AppError('Este pedido não está aguardando início.',409);
        const result=this.db.prepare("UPDATE contracts SET status='in_progress',updated_at=?,revision=revision+1 WHERE id=? AND org_id=? AND revision=?").run(now,id,user.org_id,input.revision);
        if(!result.changes) throw new AppError('O pedido mudou. Atualize antes de iniciar.',409);
        this.contractEvent(user,id,'Confecção iniciada','A equipe iniciou a preparação do contrato.',now);
      } else if(action==='justify_delay') {
        if(current.status==='sent_to_manager') throw new AppError('O contrato já foi enviado à gestora.',409);
        const reason=text(input.reason,'Justificativa do atraso',1000);
        const result=this.db.prepare('UPDATE contracts SET delay_reason=?,delayed_at=?,updated_at=?,revision=revision+1 WHERE id=? AND org_id=? AND revision=?').run(reason,current.delayed_at||now,now,id,user.org_id,input.revision);
        if(!result.changes) throw new AppError('O pedido mudou. Atualize antes de justificar.',409);
        this.contractEvent(user,id,'Atraso justificado',reason,now);
      } else {
        if(current.status!=='in_progress') throw new AppError('Inicie a confecção antes de enviar o contrato à gestora.',409);
        const result=this.db.prepare("UPDATE contracts SET status='sent_to_manager',sent_to_manager_at=?,updated_at=?,revision=revision+1 WHERE id=? AND org_id=? AND revision=?").run(now,now,id,user.org_id,input.revision);
        if(!result.changes) throw new AppError('O pedido mudou. Atualize antes de enviar.',409);
        this.contractEvent(user,id,'Enviado à gestora',`Disponível para ${this.row('users',current.requested_by,user.org_id).name}.`,now);
        const requester=this.db.prepare('SELECT active FROM users WHERE id=? AND org_id=?').get(current.requested_by,user.org_id);
        if(requester?.active&&current.requested_by!==user.id) this.db.prepare('INSERT OR IGNORE INTO contract_notifications(id,org_id,contract_id,recipient_id,created_at) VALUES(?,?,?,?,?)').run(randomUUID(),user.org_id,id,current.requested_by,now);
      }
      return this.contractRecord(user,id);
    });
  }
  createTicket(user,input) {
    const p=this.row('properties',input.property_id,user.org_id);
    if(p.active!==1) throw new AppError('Este imóvel está arquivado e não aceita novos chamados.');
    const id=randomUUID(),now=new Date().toISOString();
    const title=text(input.title,'Título',150),description=text(input.description,'Descrição',6000);
    const requester=text(input.requester,'Solicitante',150),contact=text(input.contact,'Contato',180);
    const category=pick(input.category,CATEGORIES,'Categoria'),priority=pick(input.priority,PRIORITIES,'Prioridade');
    const source=pick(input.source,['Telefone','WhatsApp','E-mail','Presencial'],'Origem');
    const due=date(input.due_date);
    return this.transaction(()=>{
      const count=this.db.prepare('SELECT COUNT(*) total FROM tickets WHERE org_id=?').get(user.org_id).total;
      const protocol=`CH-${String(1042+count).padStart(4,'0')}`;
      this.db.prepare(`INSERT INTO tickets(id,org_id,protocol,property_id,title,description,requester,contact,tenant_snapshot,address_snapshot,category,priority,status,source,due_date,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,user.org_id,protocol,p.id,title,description,requester,contact,p.tenant,`${p.address} · ${p.unit}`,category,priority,'new',source,due,now,now);
      this.event(user,id,'Chamado registrado',`Recebido por ${source}.`);
      return this.detail(user,id);
    });
  }
  updateTicket(user,id,input) {
    const ticket=this.row('tickets',id,user.org_id);
    if(!Number.isInteger(input.revision)||input.revision!==ticket.revision) throw new AppError('O chamado mudou. Atualize a página antes de salvar.',409);
    const status=pick(input.status,STATUSES,'Situação'),priority=pick(input.priority,PRIORITIES,'Prioridade');
    const assignee=input.assignee_id||null;
    if(assignee&&this.row('users',assignee,user.org_id).active!==1) throw new AppError('Selecione um responsável ativo.');
    const due=date(input.due_date), reason=text(input.reason||'','Justificativa',1500,false);
    const solution=text(input.solution||'','Solução',4000,false);
    const transitions={new:['new','triage','cancelled'],triage:['triage','waiting','in_progress','resolved','cancelled'],waiting:['waiting','triage','in_progress','resolved','cancelled'],in_progress:['in_progress','waiting','resolved','cancelled'],resolved:['resolved','in_progress','closed'],closed:['closed','in_progress'],cancelled:['cancelled','triage']};
    if(!transitions[ticket.status].includes(status)) throw new AppError('Transição inválida. Faça a triagem antes de avançar o chamado.');
    if(['waiting','cancelled'].includes(status)&&!reason) throw new AppError('Informe o motivo da espera ou cancelamento.');
    if(status!==ticket.status&&['closed','cancelled'].includes(ticket.status)&&!reason) throw new AppError('Informe o motivo da reabertura.');
    if(['resolved','closed'].includes(status)) {
      if(!solution) throw new AppError('Registre a solução antes de concluir.');
      const pending=this.db.prepare("SELECT COUNT(*) n FROM orders WHERE ticket_id=? AND org_id=? AND status NOT IN ('completed','cancelled')").get(id,user.org_id).n;
      if(pending) throw new AppError('Existem ordens de serviço pendentes.');
      if(status==='closed'&&!reason) throw new AppError('Registre quem confirmou a solução e por qual canal.');
    }
    return this.transaction(()=>{
      const result=this.db.prepare('UPDATE tickets SET status=?,priority=?,assignee_id=?,due_date=?,waiting_reason=?,solution=?,updated_at=?,revision=revision+1 WHERE id=? AND org_id=? AND revision=?').run(status,priority,assignee,due,status==='waiting'?reason:'',solution,new Date().toISOString(),id,user.org_id,input.revision);
      if(!result.changes) throw new AppError('O chamado mudou. Atualize antes de salvar.',409);
      this.event(user,id,'Triagem atualizada',`${stateNames[ticket.status]} → ${stateNames[status]}${reason?` · ${reason}`:''}`);
      return this.detail(user,id);
    });
  }
  note(user,id,input) {
    this.row('tickets',id,user.org_id);
    const audience=pick(input.audience,['internal','resident','provider','owner'],'Público');
    const body=text(input.body,'Mensagem',6000),now=new Date().toISOString();
    return this.transaction(()=>{
      this.db.prepare('INSERT INTO notes VALUES(?,?,?,?,?,?,?)').run(randomUUID(),user.org_id,id,user.name,body,audience,now);
      this.event(user,id,'Anotação registrada',audience==='internal'?'Nota interna.':`Registro destinado a ${{resident:'inquilino',provider:'prestador',owner:'proprietário'}[audience]}; envio externo não realizado.`);
      return this.detail(user,id);
    });
  }
  quote(user,id,input) {
    const ticket=this.row('tickets',id,user.org_id);
    if(['resolved','closed','cancelled'].includes(ticket.status)) throw new AppError('Reabra o chamado antes de incluir orçamento.');
    const provider=this.row('providers',input.provider_id,user.org_id);
    if(!provider.active) throw new AppError('O prestador está inativo.');
    const scope=text(input.scope,'Escopo',3000);
    if(!Array.isArray(input.items)||!input.items.length||input.items.length>30) throw new AppError('Inclua entre 1 e 30 itens.');
    const items=input.items.map(i=>({label:text(i.label,'Item',200),cents:cents(i.cents,true)}));
    const total=cents(items.reduce((s,i)=>s+i.cents,0),true);
    return this.transaction(()=>{
      const version=this.db.prepare('SELECT COALESCE(MAX(version),0)+1 n FROM quotes WHERE ticket_id=? AND org_id=?').get(id,user.org_id).n;
      this.db.prepare("UPDATE quotes SET status='superseded' WHERE ticket_id=? AND org_id=? AND status IN ('approved','pending')").run(id,user.org_id);
      this.db.prepare('INSERT INTO quotes VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),user.org_id,id,provider.id,version,scope,JSON.stringify(items),total,'pending','','',null,null,new Date().toISOString());
      this.event(user,id,'Orçamento registrado',`Versão ${version}; propostas anteriores substituídas. Autorizações anteriores não cobrem novo escopo.`);
      return this.detail(user,id);
    });
  }
  decide(user,id,quoteId,input) {
    this.admin(user);this.row('tickets',id,user.org_id);
    const quote=this.row('quotes',quoteId,user.org_id);
    if(quote.ticket_id!==id) throw new AppError('Orçamento não encontrado.',404);
    if(quote.status!=='pending') throw new AppError('Esta versão não está mais aguardando decisão.',409);
    const status=pick(input.status,['approved','rejected'],'Decisão');
    const approver=text(input.approver,'Pessoa autorizadora',150),note=text(input.note,'Canal e evidência da decisão',2000);
    return this.transaction(()=>{
      this.db.prepare('UPDATE quotes SET status=?,approver=?,decision_note=?,decision_at=?,decision_actor=? WHERE id=? AND org_id=?').run(status,approver,note,new Date().toISOString(),user.name,quote.id,user.org_id);
      this.event(user,id,status==='approved'?'Aprovação externa registrada':'Recusa registrada',`Versão ${quote.version}; informado por ${approver}. Registro de ${user.name}: ${note}`);
      return this.detail(user,id);
    });
  }
  order(user,id,input) {
    this.admin(user);const ticket=this.row('tickets',id,user.org_id);
    if(['resolved','closed','cancelled'].includes(ticket.status)) throw new AppError('Reabra o chamado para agendar um serviço.');
    const provider=this.row('providers',input.provider_id,user.org_id);
    if(!provider.active) throw new AppError('Prestador inativo.');
    const kind=pick(input.kind,['diagnosis','execution','return'],'Tipo de serviço');
    const scope=text(input.scope,'Escopo',3000),by=text(input.authorization_by,'Autorizador',150),note=text(input.authorization_note,'Registro da autorização',2000);
    if(typeof input.scheduled_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.scheduled_at)||!Number.isFinite(Date.parse(input.scheduled_at))) throw new AppError('Informe data e horário da visita.');
    date(input.scheduled_at.slice(0,10));
    if(Number(input.scheduled_at.slice(11,13))>23||Number(input.scheduled_at.slice(14))>59) throw new AppError('Horário inválido.');
    let amount=cents(input.authorized_cents,true),quoteId=null;
    if(kind!=='diagnosis') {
      const q=this.row('quotes',input.quote_id,user.org_id);
      if(q.ticket_id!==id||q.status!=='approved'||q.provider_id!==provider.id) throw new AppError('Selecione a versão aprovada para este prestador.');
      const latest=this.db.prepare('SELECT MAX(version) v FROM quotes WHERE ticket_id=? AND org_id=?').get(id,user.org_id).v;
      if(latest!==q.version) throw new AppError('O orçamento foi substituído. Solicite nova aprovação.');
      if(scope!==q.scope) throw new AppError('O escopo da execução deve ser o mesmo do orçamento aprovado.');
      quoteId=q.id;amount=q.total;
    }
    return this.transaction(()=>{
      this.db.prepare('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),user.org_id,id,provider.id,quoteId,kind,scope,input.scheduled_at,'scheduled',by,note,amount,'','',new Date().toISOString());
      this.event(user,id,'Ordem de serviço agendada',`${kind==='diagnosis'?'Diagnóstico':'Execução/retorno'} · ${provider.name} · ${input.scheduled_at}. Autorização registrada pela equipe.`);
      return this.detail(user,id);
    });
  }
  orderUpdate(user,id,orderId,input) {
    this.row('tickets',id,user.org_id);const o=this.row('orders',orderId,user.org_id);
    if(o.ticket_id!==id) throw new AppError('OS não encontrada.',404);
    if(['completed','cancelled'].includes(o.status)) throw new AppError('Esta OS já foi finalizada. Crie uma nova para retorno.');
    const status=pick(input.status,['in_progress','completed','cancelled'],'Situação da OS');
    const completion=text(input.completion||'','Registro da execução',4000,status!=='in_progress');
    const evidence=text(input.evidence_note||'','Evidência ou justificativa sem foto',2000,status==='completed');
    return this.transaction(()=>{
      this.db.prepare('UPDATE orders SET status=?,completion=?,evidence_note=? WHERE id=? AND org_id=?').run(status,completion,evidence,o.id,user.org_id);
      this.event(user,id,'Execução atualizada',`${{in_progress:'Em execução',completed:'Concluída',cancelled:'Cancelada'}[status]} · ${completion||'Serviço iniciado.'}${evidence?' · '+evidence:''}`);
      return this.detail(user,id);
    });
  }
  cost(user,id,input) {
    this.financial(user);this.row('tickets',id,user.org_id);
    const description=text(input.description,'Descrição da despesa',250),amount=cents(input.amount);
    const payer=pick(input.payer,['Proprietário','Inquilino','Imobiliária','Outro'],'Pagador');const due=date(input.due_date);
    return this.transaction(()=>{
      this.db.prepare('INSERT INTO costs VALUES(?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),user.org_id,id,description,amount,0,payer,due,'',new Date().toISOString());
      this.event(user,id,'Custo registrado',`${description} · ${payer} · ${(amount/100).toFixed(2)} BRL. Controle gerencial.`);
      return this.detail(user,id);
    });
  }
  pay(user,id,costId,input) {
    this.financial(user);const cost=this.row('costs',costId,user.org_id);
    if(cost.ticket_id!==id) throw new AppError('Despesa não encontrada.',404);
    const amount=cents(input.amount),note=text(input.note,'Comprovante ou referência do pagamento',2000);
    if(amount>cost.amount-cost.paid) throw new AppError('O valor excede o saldo pendente.');
    return this.transaction(()=>{
      this.db.prepare('UPDATE costs SET paid=paid+?,payment_note=? WHERE id=? AND org_id=?').run(amount,note,cost.id,user.org_id);
      this.event(user,id,'Pagamento externo registrado',`${(amount/100).toFixed(2)} BRL · ${note}. Nenhuma transferência foi realizada pelo sistema.`);
      return this.detail(user,id);
    });
  }
  catalogCreate(user,kind,input) {
    if(kind==='properties'){if(!['admin','staff'].includes(user.role))throw new AppError('Acesso restrito à equipe.',403);}else this.admin(user);
    const id=randomUUID();
    if(kind==='properties') {
      const code=text(input.code,'Código do imóvel',180),street=text(input.property_street,'Nome da rua',400);
      const number=text(input.property_number||'','Número',80,false),complement=text(input.property_complement||'','Complemento',180,false);
      const neighborhood=text(input.property_neighborhood||'','Bairro',180,false),city=pick(input.property_city,['Taquara','Parobé','Igrejinha'],'Cidade');
      if(this.db.prepare('SELECT id FROM properties WHERE org_id=? AND code=?').get(user.org_id,code)) throw new AppError('Já existe um imóvel com esse código.');
      const address=[`${street}${number?`, ${number}`:''}`,neighborhood,city].filter(Boolean).join(' · ');
      this.db.prepare(`INSERT INTO properties(id,org_id,code,name,address,unit,tenant,contact,owner,property_street,property_number,property_complement,property_neighborhood,property_city)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,user.org_id,code,street,address,complement,'','','',street,number,complement,neighborhood,city);
    } else if(kind==='providers') {
      const fields=['name','specialty','phone','email'].map(k=>text(input[k]||'',k,180,!['email','phone'].includes(k)));
      this.db.prepare('INSERT INTO providers VALUES (?,?,?,?,?,?,1)').run(id,user.org_id,...fields);
    } else throw new AppError('Cadastro inválido.');
    return this.catalogs(user);
  }
}
