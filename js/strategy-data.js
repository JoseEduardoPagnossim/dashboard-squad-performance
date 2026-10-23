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
      closedAt:row.closed_at??row.closedAt??null,
      closedBy:cleanText(row.closed_by??row.closedBy)||null,
      reopenedAt:row.reopened_at??row.reopenedAt??null,
      reopenedBy:cleanText(row.reopened_by??row.reopenedBy)||null,
      snapshotRevision:Math.max(0,num(row.snapshot_revision??row.snapshotRevision)),
      snapshotVersion:cleanText(row.snapshot_version??row.snapshotVersion),
      ruleVersion:cleanText(row.rule_version??row.ruleVersion),
      createdAt:row.created_at??row.createdAt??null,
      updatedAt:row.updated_at??row.updatedAt??null
    };
  }
  function normalizePersonRow(row={}){
    return{
      id:cleanText(row.id),
      userId:cleanText(row.user_id??row.userId)||null,
      name:cleanText(row.name||row.full_name||row.fullName),
      roleLabel:cleanText(row.role_label??row.roleLabel),
      squadCode:cleanCode(row.default_squad_code||row.squad_code||row.squadCode)||'',
      defaultFte:Math.max(0,Math.min(1,num(row.default_fte??row.defaultFte,1))),
      active:row.active!==false,
      source:cleanText(row.source)||'manual',
      createdAt:row.created_at??row.createdAt??null,
      updatedAt:row.updated_at??row.updatedAt??null
    };
  }
  function normalizeEmployeeCostRow(row={}){
    const fte=Math.max(0,Math.min(1,num(row.fte,1)));
    const salary=Math.max(0,num(row.salary));
    const employerCharges=Math.max(0,num(row.employer_charges??row.employerCharges));
    const benefits=Math.max(0,num(row.benefits));
    const variablePay=Math.max(0,num(row.variable_pay??row.variablePay));
    const overtime=Math.max(0,num(row.overtime));
    const otherCosts=Math.max(0,num(row.other_costs??row.otherCosts));
    const gross=salary+employerCharges+benefits+variablePay+overtime+otherCosts;
    return{
      id:cleanText(row.id),
      competenceId:cleanText(row.competence_id??row.competenceId),
      personId:cleanText(row.person_id??row.personId),
      squadCode:cleanCode(row.squad_code_snapshot??row.squadCode),
      fte,
      salary,employerCharges,benefits,variablePay,overtime,otherCosts,
      grossCost:gross,
      totalCost:Number.isFinite(Number(row.total_cost??row.totalCost))?Math.max(0,Number(row.total_cost??row.totalCost)):gross*fte,
      source:cleanText(row.source)||'manual',
      notes:cleanText(row.notes),
      createdAt:row.created_at||null,
      updatedAt:row.updated_at||null
    };
  }

  function normalizeOperationalCostRow(row={}){
    return{
      id:cleanText(row.id),competenceId:cleanText(row.competence_id),description:cleanText(row.description),category:cleanText(row.category)||'Outros',amount:Math.max(0,num(row.amount)),scopeType:['organization','squad'].includes(row.scope_type)?row.scope_type:'organization',squadCode:cleanCode(row.squad_code),allocationMethod:['direct','fte','attendance','manual'].includes(row.allocation_method)?row.allocation_method:'fte',recurring:row.recurring===true,source:cleanText(row.source)||'manual',notes:cleanText(row.notes),createdAt:row.created_at||null,updatedAt:row.updated_at||null
    };
  }
  function normalizeAllocationRow(row={}){
    return{id:cleanText(row.id),operationalCostId:cleanText(row.operational_cost_id),squadCode:cleanCode(row.squad_code),allocationMethod:cleanText(row.allocation_method_snapshot)||'fte',basisValue:Math.max(0,num(row.basis_value)),percentage:Math.max(0,Math.min(1,num(row.percentage))),allocatedAmount:Math.max(0,num(row.allocated_amount)),createdAt:row.created_at||null,updatedAt:row.updated_at||null};
  }
  function normalizeResolutionMetricRow(row={}){
    return{
      id:cleanText(row.id),
      competenceId:cleanText(row.competence_id??row.competenceId),
      competence:competenceId(row.competence||row.competence_date||''),
      userId:cleanText(row.user_id??row.userId),
      technicianName:cleanText(row.technician_name_snapshot??row.technicianName??row.name),
      squadCode:cleanCode(row.squad_code_snapshot??row.squadCode),
      resolutions:Math.max(0,Math.round(num(row.resolutions))),
      source:cleanText(row.source)||'manual',
      notes:cleanText(row.notes),
      createdAt:row.created_at||null,
      updatedAt:row.updated_at||null
    };
  }
  function normalizeFinancialSummary(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    const peopleCost=Math.max(0,num(source.people_cost??source.peopleCost??source.total_cost_people??source.totalCostPeople??source.total_cost??source.totalCost));
    const operationalCost=Math.max(0,num(source.operational_cost??source.operationalCost));
    const explicitTotal=Number(source.total_cost??source.totalCost);
    const evaluationRaw=Number(source.evaluation_rate??source.evaluationRate),qualityTargetRaw=Number(source.quality_target??source.qualityTarget),attendance=Math.max(0,num(source.attendance)),resolutions=Math.max(0,num(source.resolutions)),resolutionEntries=Math.max(0,num(source.resolution_entries??source.resolutionEntries));
    return{competence:competenceId(source.competence),squadCode:cleanCode(source.squad_code||source.squadCode)||'ALL',peopleCount:Math.max(0,num(source.people_count??source.peopleCount)),fte:Math.max(0,num(source.fte)),salary:Math.max(0,num(source.salary)),employerCharges:Math.max(0,num(source.employer_charges??source.employerCharges)),benefits:Math.max(0,num(source.benefits)),variablePay:Math.max(0,num(source.variable_pay??source.variablePay)),overtime:Math.max(0,num(source.overtime)),otherCosts:Math.max(0,num(source.other_costs??source.otherCosts)),peopleCost,operationalCost,unallocatedOperationalCost:Math.max(0,num(source.unallocated_operational_cost??source.unallocatedOperationalCost)),totalCost:Number.isFinite(explicitTotal)?Math.max(0,explicitTotal):peopleCost+operationalCost,attendance,resolutions,resolutionEntries,costPerResolution:resolutions>0?(Number.isFinite(explicitTotal)?Math.max(0,explicitTotal):peopleCost+operationalCost)/resolutions:null,resolutionRate:attendance>0?Math.min(1,resolutions/attendance):null,evaluationRate:Number.isFinite(evaluationRaw)?evaluationRaw:null,qualityTarget:Number.isFinite(qualityTargetRaw)?qualityTargetRaw:null};
  }
  function normalizeSquadFinancialRow(row={}){const base=normalizeFinancialSummary(row);return{...base,squadCode:cleanCode(row.squad_code||row.squadCode),costPerAttendance:base.attendance>0?base.totalCost/base.attendance:null,costPerResolution:base.resolutions>0?base.totalCost/base.resolutions:null,resolutionRate:base.attendance>0?Math.min(1,base.resolutions/base.attendance):null,attendancePerFte:base.fte>0?base.attendance/base.fte:null};}
  function normalizeFinancialHistoryRow(row={}){const base=normalizeFinancialSummary(row);return{...base,status:['draft','provisional','closed'].includes(row.status)?row.status:'draft',costPerAttendance:base.attendance>0?base.totalCost/base.attendance:null,costPerResolution:base.resolutions>0?base.totalCost/base.resolutions:null,resolutionRate:base.attendance>0?Math.min(1,base.resolutions/base.attendance):null,attendancePerFte:base.fte>0?base.attendance/base.fte:null};}

  function normalizeEfficiencyMetric(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    const totalCost=Math.max(0,num(source.total_cost??source.totalCost)),attendance=Math.max(0,num(source.attendance)),resolutions=Math.max(0,num(source.resolutions)),fte=Math.max(0,num(source.fte));
    const productivityRaw=Number(source.economic_productivity??source.economicProductivity),costAttendanceRaw=Number(source.cost_per_attendance??source.costPerAttendance),costResolutionRaw=Number(source.cost_per_resolution??source.costPerResolution),resolutionRateRaw=Number(source.resolution_rate??source.resolutionRate),evaluationRaw=Number(source.evaluation_rate??source.evaluationRate);
    return{
      squadCode:cleanCode(source.squad_code??source.squadCode),
      totalCost,peopleCost:Math.max(0,num(source.people_cost??source.peopleCost)),operationalCost:Math.max(0,num(source.operational_cost??source.operationalCost)),
      peopleCount:Math.max(0,num(source.people_count??source.peopleCount)),fte,attendance,resolutions,resolutionEntries:Math.max(0,num(source.resolution_entries??source.resolutionEntries)),
      costPerAttendance:Number.isFinite(costAttendanceRaw)?Math.max(0,costAttendanceRaw):(attendance>0?totalCost/attendance:null),
      costPerResolution:Number.isFinite(costResolutionRaw)?Math.max(0,costResolutionRaw):(resolutions>0?totalCost/resolutions:null),
      resolutionRate:Number.isFinite(resolutionRateRaw)?Math.max(0,Math.min(1,resolutionRateRaw)):(attendance>0?Math.min(1,resolutions/attendance):null),
      economicProductivity:Number.isFinite(productivityRaw)?Math.max(0,productivityRaw):(totalCost>0?resolutions*1000/totalCost:null),
      evaluationRate:Number.isFinite(evaluationRaw)?Math.max(0,Math.min(1,evaluationRaw)):null
    };
  }
  function normalizeEfficiencyHistoryRow(row={}){
    const operation=normalizeEfficiencyMetric(row.operation||{}),squads=(Array.isArray(row.squads)?row.squads:[]).map(normalizeEfficiencyMetric).filter(item=>item.squadCode),bench=row.benchmarks&&typeof row.benchmarks==='object'?row.benchmarks:{};
    const operationBenchmark=Number(bench.operation_benchmark??bench.operationBenchmark),meanBenchmark=Number(bench.mean_benchmark??bench.meanBenchmark),medianBenchmark=Number(bench.median_benchmark??bench.medianBenchmark),bestValue=Number(bench.best_value??bench.bestValue);
    return{
      competence:competenceId(row.competence),status:row.status==='closed'?'closed':'draft',revision:Math.max(0,num(row.revision)),snapshotVersion:cleanText(row.snapshot_version??row.snapshotVersion),ruleVersion:cleanText(row.rule_version??row.ruleVersion),source:['close','legacy_backfill','live_preview'].includes(row.source)?row.source:'close',financialSnapshotRevision:Math.max(0,num(row.financial_snapshot_revision??row.financialSnapshotRevision)),createdAt:row.created_at??row.createdAt??null,
      operation,squads,benchmarks:{operationBenchmark:Number.isFinite(operationBenchmark)?operationBenchmark:null,meanBenchmark:Number.isFinite(meanBenchmark)?meanBenchmark:null,medianBenchmark:Number.isFinite(medianBenchmark)?medianBenchmark:null,bestSquadCode:cleanCode(bench.best_squad_code??bench.bestSquadCode),bestValue:Number.isFinite(bestValue)?bestValue:null}
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
  function buildFinancialContext({competences=[],people=[],costs=[],operationalCosts=[],allocations=[],resolutionMetrics=[],summary=null,squadSummary=[],history=[],efficiencyHistory=[]}={}){
    const competenceRows=(competences||[]).map(normalizeCompetenceRow).filter(row=>row.competence);
    const personRows=(people||[]).map(normalizePersonRow).filter(row=>row.id&&row.name);
    const costRows=(costs||[]).map(normalizeEmployeeCostRow).filter(row=>row.personId);
    const operationalRows=(operationalCosts||[]).map(normalizeOperationalCostRow).filter(row=>row.id);
    const allocationRows=(allocations||[]).map(normalizeAllocationRow).filter(row=>row.operationalCostId);
    const resolutionRows=(resolutionMetrics||[]).map(normalizeResolutionMetricRow).filter(row=>row.userId&&row.squadCode);
    const squadRows=(squadSummary||[]).map(normalizeSquadFinancialRow).filter(row=>row.squadCode);
    const historyRows=(history||[]).map(normalizeFinancialHistoryRow).filter(row=>row.competence).sort((a,b)=>a.competence.localeCompare(b.competence));
    const efficiencyRows=(efficiencyHistory||[]).map(normalizeEfficiencyHistoryRow).filter(row=>row.competence).sort((a,b)=>a.competence.localeCompare(b.competence));
    return Object.freeze({
      competences:Object.freeze(competenceRows.map(row=>Object.freeze({...row}))),
      people:Object.freeze(personRows.map(row=>Object.freeze({...row}))),
      costs:Object.freeze(costRows.map(row=>Object.freeze({...row}))),
      operationalCosts:Object.freeze(operationalRows.map(row=>Object.freeze({...row}))),
      allocations:Object.freeze(allocationRows.map(row=>Object.freeze({...row}))),
      resolutionMetrics:Object.freeze(resolutionRows.map(row=>Object.freeze({...row}))),
      summary:Object.freeze(normalizeFinancialSummary(summary||{})),
      squadSummary:Object.freeze(squadRows.map(row=>Object.freeze({...row}))),
      history:Object.freeze(historyRows.map(row=>Object.freeze({...row}))),
      efficiencyHistory:Object.freeze(efficiencyRows.map(row=>Object.freeze({...row,operation:Object.freeze({...row.operation}),squads:Object.freeze(row.squads.map(item=>Object.freeze({...item}))),benchmarks:Object.freeze({...row.benchmarks})})))
    });
  }
  return{num,competenceId,competenceDate,normalizeSquads,collectCompetences,competenceLabel,normalizeCompetenceRow,normalizePersonRow,normalizeEmployeeCostRow,normalizeOperationalCostRow,normalizeAllocationRow,normalizeResolutionMetricRow,normalizePeopleSummary,normalizeFinancialSummary,normalizeSquadFinancialRow,normalizeFinancialHistoryRow,normalizeEfficiencyMetric,normalizeEfficiencyHistoryRow,buildOperationalContext,buildFinancialContext};
});
