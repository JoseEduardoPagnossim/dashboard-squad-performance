(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenPredictiveEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const safe=v=>Number.isFinite(Number(v))?Number(v):0;
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  function previousMonthId(id){
    const m=String(id||'').match(/^(\d{4})-(\d{2})$/);if(!m)return null;
    let y=Number(m[1]),mo=Number(m[2])-1;if(mo<1){mo=12;y--;}return `${y}-${String(mo).padStart(2,'0')}`;
  }
  function projectCount(realized,elapsedDays,totalDays){
    const r=Math.max(0,safe(realized)),e=Math.max(0,safe(elapsedDays)),t=Math.max(0,safe(totalDays));
    if(!e||!t)return r;
    return r/e*t;
  }
  function confidence(elapsedDays,totalDays){
    const e=Math.max(0,safe(elapsedDays)),t=Math.max(1,safe(totalDays)),ratio=e/t;
    if(e<=3||ratio<.2)return{level:'low',label:'Baixa',note:'Projeção inicial; poucos dias úteis realizados.'};
    if(e<=8||ratio<.5)return{level:'medium',label:'Média',note:'Projeção intermediária; tende a estabilizar com mais dias.'};
    return{level:'high',label:'Alta',note:'Base mais madura dentro da competência.'};
  }
  function countMetric({realized=0,goal=0,elapsedDays=0,totalDays=0}={}){
    const r=Math.max(0,safe(realized)),g=Math.max(0,safe(goal)),projection=projectCount(r,elapsedDays,totalDays),remaining=Math.max(0,g-r),remainingDays=Math.max(0,safe(totalDays)-safe(elapsedDays)),completion=g?r/g:0,projectedCompletion=g?projection/g:0,neededPerDay=remainingDays?remaining/remainingDays:remaining;
    let status='neutral';
    if(g>0){if(r>=g)status='achieved';else if(projectedCompletion>=1)status='on_track';else if(projectedCompletion>=.9)status='attention';else status='critical';}
    return{realized:r,goal:g,projection,remaining,remainingDays,completion,projectedCompletion,neededPerDay,status};
  }
  function rateMetric({realized=0,goal=0}={}){
    const r=clamp(safe(realized),0,1),g=clamp(safe(goal),0,1),gap=r-g;let status='neutral';
    if(g>0){if(r>=g)status='achieved';else if(g-r<=.02)status='attention';else status='critical';}
    return{realized:r,goal:g,projection:r,gap,status};
  }
  function compare(current,previous,{points=false}={}){
    const c=safe(current),p=safe(previous),delta=c-p;
    return{current:c,previous:p,delta,ratio:points?delta:(p?delta/Math.abs(p):(c?1:0)),points:!!points};
  }
  function technicianRisk({name='',squad='',att=0,notes5=0,evalPct=0,goalAtt=0,goalNotes5=0,goalEvalPct=0,elapsedDays=0,totalDays=0}={}){
    const attMetric=countMetric({realized:att,goal:goalAtt,elapsedDays,totalDays}),notesMetric=countMetric({realized:notes5,goal:goalNotes5,elapsedDays,totalDays}),evalMetric=rateMetric({realized:evalPct,goal:goalEvalPct});
    const reasons=[];let score=0;
    if(goalAtt>0&&attMetric.projectedCompletion<.9){score+=2;reasons.push(`Atendimentos projetados em ${Math.round(attMetric.projectedCompletion*100)}% da meta`);}else if(goalAtt>0&&attMetric.projectedCompletion<1){score+=1;reasons.push('Atendimentos projetados abaixo da meta');}
    if(goalNotes5>0&&notesMetric.projectedCompletion<.9){score+=2;reasons.push(`Notas 5 projetadas em ${Math.round(notesMetric.projectedCompletion*100)}% da meta`);}else if(goalNotes5>0&&notesMetric.projectedCompletion<1){score+=1;reasons.push('Notas 5 projetadas abaixo da meta');}
    if(goalEvalPct>0&&evalPct<goalEvalPct-.05){score+=2;reasons.push('Taxa de avaliação mais de 5 p.p. abaixo da meta');}else if(goalEvalPct>0&&evalPct<goalEvalPct){score+=1;reasons.push('Taxa de avaliação abaixo da meta');}
    const level=score>=4?'critical':score>=2?'warning':score>0?'watch':'ok';
    return{name,squad,score,level,reasons,att:attMetric,notes5:notesMetric,eval:evalMetric};
  }
  function buildAlerts({attendance,notes5,evaluation,attendanceComparison,evaluationComparison,atRiskTechnicians=0,totalTechnicians=0,confidenceLevel='high'}={}){
    const items=[];const add=(severity,code,title,text)=>items.push({severity,code,title,text});
    if(attendance?.goal>0){
      if(attendance.status==='critical')add('critical','attendance_projection','Projeção de atendimentos abaixo da meta',`Mantido o ritmo atual, o fechamento tende a atingir ${Math.round(attendance.projectedCompletion*100)}% da meta.`);
      else if(attendance.status==='attention')add('warning','attendance_projection','Atendimentos exigem aceleração',`A projeção está em ${Math.round(attendance.projectedCompletion*100)}% da meta; o ritmo diário precisa subir.`);
      else if(['on_track','achieved'].includes(attendance.status))add('positive','attendance_projection','Ritmo de atendimentos adequado','A projeção atual alcança ou supera a meta da competência.');
    }
    if(notes5?.goal>0){
      if(notes5.status==='critical')add('critical','notes5_projection','Notas 5 abaixo do ritmo esperado',`A projeção indica ${Math.round(notes5.projectedCompletion*100)}% da meta de notas 5.`);
      else if(notes5.status==='attention')add('warning','notes5_projection','Notas 5 próximas, mas abaixo da meta',`A projeção indica ${Math.round(notes5.projectedCompletion*100)}% da meta de notas 5.`);
    }
    if(evaluation?.goal>0&&evaluation.realized<evaluation.goal){
      const pp=(evaluation.goal-evaluation.realized)*100;add(pp>=5?'critical':'warning','evaluation_gap','Taxa de avaliação abaixo da meta',`Gap atual de ${pp.toFixed(1).replace('.',',')} p.p. em relação à meta.`);
    }else if(evaluation?.goal>0)add('positive','evaluation_gap','Taxa de avaliação dentro da meta','A taxa atual está no patamar esperado ou acima dele.');
    if(attendanceComparison&&attendanceComparison.previous>0&&attendanceComparison.ratio<=-.10)add(attendanceComparison.ratio<=-.20?'critical':'warning','attendance_trend','Queda versus período equivalente',`Atendimentos estão ${Math.abs(attendanceComparison.ratio*100).toFixed(1).replace('.',',')}% abaixo da competência anterior no mesmo corte.`);
    if(evaluationComparison&&evaluationComparison.previous>0&&evaluationComparison.delta<=-.03)add(evaluationComparison.delta<=-.05?'critical':'warning','evaluation_trend','Avaliação recuou no comparativo equivalente',`A taxa está ${Math.abs(evaluationComparison.delta*100).toFixed(1).replace('.',',')} p.p. abaixo do mês anterior no mesmo corte.`);
    if(totalTechnicians>0&&atRiskTechnicians>0){const ratio=atRiskTechnicians/totalTechnicians;add(ratio>=.3?'critical':'warning','technicians_at_risk','Técnicos com projeção de risco',`${atRiskTechnicians} de ${totalTechnicians} técnico(s) apresentam ao menos dois sinais de atenção.`);}
    if(confidenceLevel==='low')add('info','low_confidence','Projeção ainda inicial','Poucos dias úteis foram realizados; interprete a projeção como tendência preliminar.');
    const order={critical:0,warning:1,info:2,positive:3};return items.sort((a,b)=>(order[a.severity]??9)-(order[b.severity]??9)).slice(0,8);
  }
  return{safe,previousMonthId,projectCount,confidence,countMetric,rateMetric,compare,technicianRisk,buildAlerts};
});
