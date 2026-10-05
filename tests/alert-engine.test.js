const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../js/alert-engine.js');

test('notificacao interna normaliza prioridade, categoria e datas',()=>{
  const n=engine.normalizeInternal({id:'1',title:'Aviso',message:'Texto',severity:'CRITICAL',category:'operation',audience_type:'all',created_at:'2026-10-05T12:00:00Z'});
  assert.equal(n.severity,'critical');assert.equal(n.category,'operation');assert.equal(n.audienceType,'all');assert.equal(n.source,'internal');
});

test('destinatario respeita administradores, tecnicos e squad',()=>{
  const admin={role:'super_admin',squadId:null},tech={role:'technician',squadId:'s1'};
  assert.equal(engine.audienceMatches(engine.normalizeInternal({audience_type:'admins'}),admin),true);
  assert.equal(engine.audienceMatches(engine.normalizeInternal({audience_type:'admins'}),tech),false);
  assert.equal(engine.audienceMatches(engine.normalizeInternal({audience_type:'squad',squad_id:'s1'}),tech),true);
  assert.equal(engine.audienceMatches(engine.normalizeInternal({audience_type:'squad',squad_id:'s2'}),tech),false);
});

test('agenda e expiracao definem notificacao ativa',()=>{
  const now=new Date('2026-10-05T15:00:00Z');
  assert.equal(engine.isActive(engine.normalizeInternal({starts_at:'2026-10-05T14:00:00Z',expires_at:'2026-10-05T16:00:00Z'}),now),true);
  assert.equal(engine.isActive(engine.normalizeInternal({starts_at:'2026-10-05T16:00:00Z'}),now),false);
  assert.equal(engine.isActive(engine.normalizeInternal({starts_at:'2026-10-05T12:00:00Z',expires_at:'2026-10-05T14:59:59Z'}),now),false);
});

test('alerta automatico gera id estavel para o mesmo sinal',()=>{
  const a=engine.automaticAlert({code:'attendance',scope:'D',period:'2026-10',subject:'Squad D',severity:'warning',title:'Atenção',text:'Ritmo abaixo'});
  const b=engine.automaticAlert({code:'attendance',scope:'D',period:'2026-10',subject:'Squad D',severity:'warning',title:'Atenção',text:'Ritmo abaixo'});
  assert.equal(a.id,b.id);assert.match(a.id,/^auto:attendance:/);
});

test('feed combina fontes, aplica leitura e prioriza nao lidos criticos',()=>{
  const notifications=[{id:'n1',title:'Interno',message:'Mensagem',severity:'info',audience_type:'all',created_at:'2026-10-05T15:00:00Z'}];
  const automatic=[engine.automaticAlert({code:'risk',severity:'critical',title:'Risco',text:'Atenção',createdAt:'2026-10-05T14:00:00Z'})];
  const feed=engine.buildFeed({automatic,notifications,readIds:['n1'],user:{role:'technician'},now:new Date('2026-10-05T16:00:00Z')});
  assert.equal(feed[0].severity,'critical');assert.equal(feed[0].read,false);assert.equal(feed[1].read,true);
  const c=engine.counts(feed);assert.equal(c.unread,1);assert.equal(c.internal,1);assert.equal(c.automatic,1);
});

test('filtros permitem combinar status, origem, prioridade e busca',()=>{
  const rows=[{read:false,source:'automatic',severity:'critical',category:'performance',title:'Meta',text:'abaixo'},{read:true,source:'internal',severity:'info',category:'announcement',title:'Comunicado',text:'geral'}];
  assert.equal(engine.filterFeed(rows,{status:'unread'}).length,1);
  assert.equal(engine.filterFeed(rows,{source:'internal'}).length,1);
  assert.equal(engine.filterFeed(rows,{severity:'critical',search:'meta'}).length,1);
  assert.equal(engine.filterFeed(rows,{category:'announcement'}).length,1);
});
