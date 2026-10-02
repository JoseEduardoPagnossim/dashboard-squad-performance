const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../js/predictive-engine.js');

test('projeta contagem pelo ritmo de dias uteis',()=>{
  assert.equal(engine.projectCount(100,10,20),200);
  assert.equal(engine.projectCount(0,0,20),0);
});

test('classifica metrica de contagem por projecao',()=>{
  const ok=engine.countMetric({realized:100,goal:180,elapsedDays:10,totalDays:20});
  assert.equal(ok.status,'on_track');
  assert.equal(ok.projection,200);
  const warn=engine.countMetric({realized:82,goal:180,elapsedDays:10,totalDays:20});
  assert.equal(warn.status,'attention');
  const bad=engine.countMetric({realized:70,goal:180,elapsedDays:10,totalDays:20});
  assert.equal(bad.status,'critical');
});

test('taxa usa gap em pontos percentuais',()=>{
  const m=engine.rateMetric({realized:.31,goal:.343});
  assert.equal(m.status,'critical');
  assert.ok(Math.abs(m.gap + .033)<1e-9);
});

test('comparacao relativa e por pontos funciona',()=>{
  const a=engine.compare(90,100);assert.equal(a.ratio,-.1);
  const b=engine.compare(.35,.40,{points:true});assert.ok(Math.abs(b.delta + .05)<1e-9);assert.equal(b.points,true);
});

test('risco de tecnico combina sinais de meta e avaliacao',()=>{
  const r=engine.technicianRisk({name:'Ana',squad:'D',att:60,notes5:10,evalPct:.25,goalAtt:200,goalNotes5:40,goalEvalPct:.343,elapsedDays:10,totalDays:20});
  assert.equal(r.level,'critical');
  assert.ok(r.score>=4);
  assert.ok(r.reasons.length>=2);
});

test('alertas priorizam criticos e avisam baixa confianca',()=>{
  const attendance=engine.countMetric({realized:50,goal:200,elapsedDays:5,totalDays:20});
  const notes5=engine.countMetric({realized:10,goal:40,elapsedDays:5,totalDays:20});
  const evaluation=engine.rateMetric({realized:.25,goal:.343});
  const alerts=engine.buildAlerts({attendance,notes5,evaluation,attendanceComparison:engine.compare(50,80),evaluationComparison:engine.compare(.25,.35,{points:true}),atRiskTechnicians:3,totalTechnicians:8,confidenceLevel:'low'});
  assert.equal(alerts[0].severity,'critical');
  assert.ok(alerts.some(x=>x.code==='low_confidence'));
  assert.ok(alerts.some(x=>x.code==='technicians_at_risk'));
});

test('mes anterior trata virada de ano',()=>{
  assert.equal(engine.previousMonthId('2026-10'),'2026-09');
  assert.equal(engine.previousMonthId('2026-01'),'2025-12');
});
