import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,ticketInput,inspectionInput,quoteInput} from './helpers.js';

test('isola leitura e referências entre duas imobiliárias',()=>{
  const {db,service:s,admin,other}=fixture();try{
    assert.equal(s.list(other).length,0);
    assert.throws(()=>s.detail(other,'t1'),{status:404});
    assert.throws(()=>s.createTicket(admin,{...ticketInput,property_id:'p-other'}),{status:404});
    assert.throws(()=>s.updateTicket(admin,'t1',{revision:1,status:'triage',priority:'normal',assignee_id:other.id,due_date:'2026-12-15'}),{status:404});
  }finally{db.close();}
});
test('pedido de vistoria segue proposta, aceite e conclusão com histórico',()=>{
  const {db,service:s,admin,staff,other}=fixture();try{
    assert.equal(s.listInspections(admin).length,6);
    assert.equal(s.listInspections(other).length,0);
    assert.throws(()=>s.inspectionDetail(other,'i1'),{status:404});
    const created=s.createInspection(admin,inspectionInput);
    assert.equal(created.status,'new');assert.equal(created.requester.name,'Rafael Lima');
    assert.equal(created.property.password,undefined);assert.equal(created.requester.password,undefined);
    assert.equal(created.address_snapshot,created.property.address+' · '+created.property.unit);
    assert.throws(()=>s.createInspection(admin,{...inspectionInput,property_id:'p-other'}),{status:404});
    let d=s.updateInspection(admin,created.id,{revision:1,status:'new',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''});
    assert.equal(d.status,'new');assert.equal(d.inspector.name,'Rafael Lima');assert.equal(d.scheduled_end,'2026-12-15T15:30');
    assert.throws(()=>s.updateInspection(admin,created.id,{revision:2,status:'received',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''}),{status:403});
    d=s.updateInspection(staff,created.id,{revision:2,status:'received',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''});
    assert.equal(d.status,'received');
    assert.throws(()=>s.updateInspection(admin,created.id,{revision:2,status:'in_progress',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''}),{status:409});
    d=s.updateInspection(admin,created.id,{revision:3,status:'in_progress',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''});
    assert.throws(()=>s.updateInspection(admin,created.id,{revision:4,status:'completed',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:''}),/resultado/);
    d=s.updateInspection(admin,created.id,{revision:4,status:'completed',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',duration_minutes:60,reason:'',completion_note:'Checklist concluído.'});
    assert.equal(d.events.length,7);assert.equal(d.status,'completed');
  }finally{db.close();}
});
test('vistoria exige motivo para cancelar e restringe financeiro',()=>{
  const {db,service:s,admin}=fixture();try{
    const finance=db.prepare("SELECT * FROM users WHERE id='bia'").get();
    const i=s.createInspection(admin,inspectionInput);
    assert.throws(()=>s.updateInspection(admin,i.id,{revision:1,status:'cancelled',inspector_id:'',scheduled_at:'',reason:'',completion_note:''}),/motivo/);
    assert.throws(()=>s.updateInspection(admin,i.id,{revision:1,status:'received',inspector_id:'rafael',scheduled_at:'',reason:'',completion_note:''}),/vistoriador e a data/);
    assert.deepEqual(s.listInspections(finance),[]);
    assert.throws(()=>s.inspectionDetail(finance,'i1'),{status:403});
    assert.throws(()=>s.createInspection(finance,inspectionInput),{status:403});
    const cancelled=s.updateInspection(admin,i.id,{revision:1,status:'cancelled',inspector_id:'',scheduled_at:'',reason:'Solicitação fictícia cancelada.',completion_note:''});
    assert.equal(cancelled.status,'cancelled');
    assert.throws(()=>s.updateInspection(admin,i.id,{revision:2,status:'received',inspector_id:'rafael',scheduled_at:'2026-12-15T14:30',reason:'',completion_note:''}),/horário fica bloqueado/);
  }finally{db.close();}
});
test('impede que atendimento aprove despesa ou orçamento',()=>{
  const {db,service:s,staff}=fixture();try{
    assert.throws(()=>s.decide(staff,'t2','q1',{status:'approved',approver:'Proprietário',note:'Por telefone'}),{status:403});
    assert.throws(()=>s.cost(staff,'t1',{description:'Peças',amount:100,payer:'Proprietário',due_date:'2026-12-15'}),{status:403});
  }finally{db.close();}
});
test('revisão de proposta invalida autorização anterior para novas OS',()=>{
  const {db,service:s,admin}=fixture();try{
    const t=s.createTicket(admin,ticketInput);let d=s.quote(admin,t.id,quoteInput);const q=d.quotes[0];
    s.decide(admin,t.id,q.id,{status:'approved',approver:'Titular proprietário',note:'Confirmou por e-mail fictício.'});
    d=s.quote(admin,t.id,{...quoteInput,items:[{label:'Escopo revisado',cents:20000}]});
    assert.equal(d.quotes.find(x=>x.id===q.id).status,'superseded');
    assert.throws(()=>s.order(admin,t.id,{provider_id:'v1',quote_id:q.id,kind:'execution',scope:q.scope,scheduled_at:'2026-12-15T14:00',authorization_by:'Proprietário',authorization_note:'Decisão antiga',authorized_cents:18000}),/versão aprovada/);
    assert.equal(d.quotes[1].version,2);
  }finally{db.close();}
});
test('diagnóstico tem autorização própria antes do orçamento de reparo',()=>{
  const {db,service:s,admin}=fixture();try{
    const t=s.createTicket(admin,ticketInput);
    const d=s.order(admin,t.id,{provider_id:'v1',kind:'diagnosis',scope:'Identificar a origem do vazamento',scheduled_at:'2026-12-15T14:00',authorization_by:'Proprietário fictício',authorization_note:'Visita gratuita autorizada por telefone.',authorized_cents:0});
    assert.equal(d.quotes.length,0);assert.equal(d.orders[0].quote_id,null);assert.equal(d.orders[0].authorized_cents,0);
  }finally{db.close();}
});
test('não permite concluir chamado com OS pendente nem perder edição concorrente',()=>{
  const {db,service:s,admin}=fixture();try{
    const t=s.detail(admin,'t3');
    assert.throws(()=>s.updateTicket(admin,t.id,{revision:t.revision,status:'resolved',priority:'normal',assignee_id:'marina',due_date:t.due_date,solution:'Resolvido.'}),/ordens de serviço pendentes/);
    s.updateTicket(admin,t.id,{revision:t.revision,status:t.status,priority:'high',assignee_id:'marina',due_date:t.due_date});
    assert.throws(()=>s.updateTicket(admin,t.id,{revision:t.revision,status:t.status,priority:'normal',assignee_id:'marina',due_date:t.due_date}),{status:409});
  }finally{db.close();}
});
test('fluxo completo guarda escopo, confirmação e pagamento parcial independente',()=>{
  const {db,service:s,admin}=fixture();try{
    let d=s.createTicket(admin,ticketInput);
    d=s.updateTicket(admin,d.id,{revision:d.revision,status:'triage',priority:'normal',assignee_id:admin.id,due_date:d.due_date});
    d=s.quote(admin,d.id,quoteInput);const q=d.quotes[0];
    d=s.decide(admin,d.id,q.id,{status:'approved',approver:'Proprietário',note:'E-mail fictício da autorização'});
    assert.throws(()=>s.order(admin,d.id,{provider_id:'v1',quote_id:q.id,kind:'execution',scope:'Outro serviço não aprovado',scheduled_at:'2026-12-15T14:00',authorization_by:'Proprietário',authorization_note:'E-mail',authorized_cents:18000}),/mesmo do orçamento/);
    d=s.order(admin,d.id,{provider_id:'v1',quote_id:q.id,kind:'execution',scope:q.scope,scheduled_at:'2026-12-15T14:00',authorization_by:'Proprietário',authorization_note:'E-mail fictício',authorized_cents:18000});
    d=s.orderUpdate(admin,d.id,d.orders[0].id,{status:'completed',completion:'Torneira reparada',evidence_note:'Teste funcional realizado; sem foto neste caso fictício.'});
    d=s.updateTicket(admin,d.id,{revision:d.revision,status:'resolved',priority:'normal',assignee_id:admin.id,due_date:d.due_date,solution:'Torneira reparada.'});
    d=s.updateTicket(admin,d.id,{revision:d.revision,status:'closed',priority:'normal',assignee_id:admin.id,due_date:d.due_date,solution:d.solution,reason:'Inquilino confirmou por telefone fictício.'});
    d=s.cost(admin,d.id,{description:'Reparo',amount:18000,payer:'Proprietário',due_date:'2026-12-15'});
    d=s.pay(admin,d.id,d.costs[0].id,{amount:5000,note:'Referência de pagamento fictício'});
    assert.equal(d.status,'closed');assert.equal(d.costs[0].paid,5000);assert.ok(d.events.length>=8);
    assert.throws(()=>s.pay(admin,d.id,d.costs[0].id,{amount:15000,note:'Excede saldo'}),/excede/);
    d=s.updateTicket(admin,d.id,{revision:d.revision,status:'in_progress',priority:'normal',assignee_id:admin.id,due_date:d.due_date,solution:d.solution,reason:'Vazamento retornou'});
    assert.equal(d.status,'in_progress');assert.equal(d.orders[0].status,'completed');
  }finally{db.close();}
});

test('snapshot do chamado preserva titular e endereço após mudança de cadastro',()=>{
  const {db,service:s,admin}=fixture();try{
    const d=s.createTicket(admin,ticketInput);
    db.prepare('UPDATE properties SET tenant=?,address=? WHERE id=?').run('Novo titular fictício','Outro endereço fictício','p1');
    const kept=s.detail(admin,d.id);
    assert.equal(kept.tenant_snapshot,'Ana Ribeiro');assert.notEqual(kept.address_snapshot,kept.property.address);
    assert.equal(kept.property.tenant,'Novo titular fictício');
  }finally{db.close();}
});
