(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyData=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function cleanCode(value){return String(value||'').trim().toUpperCase()}
  function cleanText(value){return String(value??'').trim()}
  function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function competenceId(value){
    const text=String(value||'').trim();
    const match=/^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(text);
    if(!match)return'';
    const month=Number(match[2]);if(month<1||month>12)return'';
    return `${match[1]}-${match[2]}`;
  }
  function competenceDate(value){const id=competenceId(value);return id?`${id}-01`:''}
  function normalizeSquads(source){
    const rows=Array.isArray(source)?source:Object.values(source&&typeof source==='object'?source:{});
    return rows.map(row=>({
      code:cleanCode(row?.code),
      name:String(row?.name||`Squad ${cleanCode(row?.code)}`).trim(),
      competences:Object.keys(row?.months&&typeof row.months==='object'?row.months:{}).filter(id=>/^\d{4}-\d{2}$/.test(id)).sort()
    })).filter(row=>row.code).sort((a,b)=>a.code.localeCompare(b.code,'pt-BR'));
  }
  function collectCompetences(squads){
    const rows=Array.isArray(squads)&&squads.every(row=>Array.isArray(row?.competences))?squads:normalizeSquads(squads);
    const set=new Set();for(const squad of rows)for(const id of squad.competences||[])if(/^\d{4}-\d{2}$/.test(id))set.add(id);
    return [...set].sort();
  }
  function competenceLabel(id){
    const match=/^(\d{4})-(\d{2})$/.exec(String(id||''));if(!match)return String(id||'—');
    const date=new Date(Number(match[1]),Number(match[2])-1,1);
    return date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());
  }
  function normalizeCompetenceRow(row={}){
    const id=competenceId(row.competence||row.competence_id||row.id_label||'');
    return{
      id:cleanText(row.id),
      competence:id,
      competenceDate:competenceDate(id),
      status:['draft','provisional','closed'].includes(row.status)?row.status:'draft',
      notes:cleanText(row.notes),
      createdAt:row.created_at||null,
      updatedAt:row.updated_at||null
    };
  }
  function normalizePersonRow(row={}){
    return{
      id:cleanText(row.id),
      userId:cleanText(row.user_id)||null,
      name:cleanText(row.name||row.full_name),
      roleLabel:cleanText(row.role_label),
      squadCode:cleanCode(row.default_squad_code||row.squad_code)||'',
      defaultFte:Math.max(0,Math.min(1,num(row.default_fte,1))),
      active:row.active!==false,
      source:cleanText(row.source)||'manual',
      createdAt:row.created_at||null,
      updatedAt:row.updated_at||null
    };
  }
  function normalizeEmployeeCostRow(row={}){
    const fte=Math.max(0,Math.min(1,num(row.fte,1)));
    const salary=Math.max(0,num(row.salary));
    const employerCharges=Math.max(0,num(row.employer_charges));
    const benefits=Math.max(0,num(row.benefits));
    const variablePay=Math.max(0,num(row.variable_pay));
    const overtime=Math.max(0,num(row.overtime));
    const otherCosts=Math.max(0,num(row.other_costs));
    const gross=salary+employerCharges+benefits+variablePay+overtime+otherCosts;
    return{
      id:cleanText(row.id),
      competenceId:cleanText(row.competence_id),
      personId:cleanText(row.person_id),
      squadCode:cleanCode(row.squad_code_snapshot),
      fte,
      salary,employerCharges,benefits,variablePay,overtime,otherCosts,
      grossCost:gross,
      totalCost:Number.isFinite(Number(row.total_cost))?Number(row.total_cost):gross*fte,
      source:cleanText(row.source)||'manual',
      notes:cleanText(row.notes),
      createdAt:row.created_at||null,
      updatedAt:row.updated_at||null
    };
  }
  function normalizePeopleSummary(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    return{
      competence:competenceId(source.competence),
      squadCode:cleanCode(source.squad_code||source.squadCode)||'ALL',
      peopleCount:Math.max(0,num(source.people_count??source.peopleCount)),
      fte:Math.max(0,num(source.fte)),
      salary:Math.max(0,num(source.salary)),
      employerCharges:Math.max(0,num(source.employer_charges??source.employerCharges)),
      benefits:Math.max(0,num(source.benefits)),
      variablePay:Math.max(0,num(source.variable_pay??source.variablePay)),
      overtime:Math.max(0,num(source.overtime)),
      otherCosts:Math.max(0,num(source.other_costs??source.otherCosts)),
      totalCost:Math.max(0,num(source.total_cost??source.totalCost))
    };
  }
  function buildOperationalContext({squads}={}){
    const normalized=normalizeSquads(squads),competences=collectCompetences(normalized);
    return Object.freeze({
      squads:Object.freeze(normalized.map(row=>Object.freeze({...row,competences:Object.freeze([...row.competences])}))),
      competences:Object.freeze([...competences]),
      latestCompetence:competences.at(-1)||''
    });
  }
  function buildFinancialContext({competences=[],people=[],costs=[],summary=null}={}){
    const competenceRows=(competences||[]).map(normalizeCompetenceRow).filter(row=>row.competence);
    const personRows=(people||[]).map(normalizePersonRow).filter(row=>row.id&&row.name);
    const costRows=(costs||[]).map(normalizeEmployeeCostRow).filter(row=>row.personId);
    return Object.freeze({
      competences:Object.freeze(competenceRows.map(row=>Object.freeze({...row}))),
      people:Object.freeze(personRows.map(row=>Object.freeze({...row}))),
      costs:Object.freeze(costRows.map(row=>Object.freeze({...row}))),
      summary:Object.freeze(normalizePeopleSummary(summary||{}))
    });
  }
  return{num,competenceId,competenceDate,normalizeSquads,collectCompetences,competenceLabel,normalizeCompetenceRow,normalizePersonRow,normalizeEmployeeCostRow,normalizePeopleSummary,buildOperationalContext,buildFinancialContext};
});
