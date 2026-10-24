(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyData=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function cleanCode(value){return String(value||'').trim().toUpperCase()}
  function cleanText(value){return String(value??'').trim()}
  function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function optionalNumber(value){if(value===null||value===undefined)return null;if(typeof value==='string'&&!value.trim())return null;const n=Number(value);return Number.isFinite(n)?n:null}
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
    const availabilityRaw=optionalNumber(row.availability_factor??row.availabilityFactor),availabilityFactor=availabilityRaw==null?null:Math.max(0,Math.min(1,availabilityRaw));
    return{
      id:cleanText(row.id),
      competenceId:cleanText(row.competence_id??row.competenceId),
      personId:cleanText(row.person_id??row.personId),
      squadCode:cleanCode(row.squad_code_snapshot??row.squadCode),
      fte,availabilityFactor,availableFte:availabilityFactor==null?null:fte*availabilityFactor,
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
    const availableFteRaw=optionalNumber(source.available_fte??source.availableFte),unavailableFteRaw=optionalNumber(source.unavailable_fte??source.unavailableFte),availabilityCoverageRaw=optionalNumber(source.availability_coverage??source.availabilityCoverage),availabilityRateRaw=optionalNumber(source.availability_rate??source.availabilityRate);
    const usedVolumeRaw=optionalNumber(source.used_capacity_volume??source.usedCapacityVolume),usedPerAvailableFteRaw=optionalNumber(source.used_per_available_fte??source.usedPerAvailableFte),usedCoverageRaw=optionalNumber(source.used_capacity_coverage??source.usedCapacityCoverage);
    return{competence:competenceId(source.competence),squadCode:cleanCode(source.squad_code||source.squadCode)||'ALL',peopleCount:Math.max(0,num(source.people_count??source.peopleCount)),fte:Math.max(0,num(source.fte??source.nominal_fte??source.nominalFte)),availableFte:availableFteRaw==null?null:Math.max(0,availableFteRaw),unavailableFte:unavailableFteRaw==null?null:Math.max(0,unavailableFteRaw),availabilityCoverage:availabilityCoverageRaw==null?null:Math.max(0,Math.min(1,availabilityCoverageRaw)),availabilityRate:availabilityRateRaw==null?null:Math.max(0,Math.min(1,availabilityRateRaw)),availabilityEntries:Math.max(0,num(source.availability_entries??source.availabilityEntries)),availabilityMissing:Math.max(0,num(source.availability_missing??source.availabilityMissing)),availabilityComplete:source.availability_complete===true||source.availabilityComplete===true,usedCapacityVolume:usedVolumeRaw==null?null:Math.max(0,usedVolumeRaw),usedPerAvailableFte:usedPerAvailableFteRaw==null?null:Math.max(0,usedPerAvailableFteRaw),usedCapacityCoverage:usedCoverageRaw==null?null:Math.max(0,Math.min(1,usedCoverageRaw)),usedCapacityEntries:Math.max(0,num(source.used_capacity_entries??source.usedCapacityEntries)),usedCapacityMissing:Math.max(0,num(source.used_capacity_missing??source.usedCapacityMissing)),usedCapacityComplete:source.used_capacity_complete===true||source.usedCapacityComplete===true,salary:Math.max(0,num(source.salary)),employerCharges:Math.max(0,num(source.employer_charges??source.employerCharges)),benefits:Math.max(0,num(source.benefits)),variablePay:Math.max(0,num(source.variable_pay??source.variablePay)),overtime:Math.max(0,num(source.overtime)),otherCosts:Math.max(0,num(source.other_costs??source.otherCosts)),peopleCost,operationalCost,unallocatedOperationalCost:Math.max(0,num(source.unallocated_operational_cost??source.unallocatedOperationalCost)),totalCost:Number.isFinite(explicitTotal)?Math.max(0,explicitTotal):peopleCost+operationalCost,attendance,resolutions,resolutionEntries,costPerResolution:resolutions>0?(Number.isFinite(explicitTotal)?Math.max(0,explicitTotal):peopleCost+operationalCost)/resolutions:null,resolutionRate:attendance>0?Math.min(1,resolutions/attendance):null,evaluationRate:Number.isFinite(evaluationRaw)?evaluationRaw:null,qualityTarget:Number.isFinite(qualityTargetRaw)?qualityTargetRaw:null};
  }
  function normalizeSquadFinancialRow(row={}){const base=normalizeFinancialSummary(row);return{...base,squadCode:cleanCode(row.squad_code||row.squadCode),costPerAttendance:base.attendance>0?base.totalCost/base.attendance:null,costPerResolution:base.resolutions>0?base.totalCost/base.resolutions:null,resolutionRate:base.attendance>0?Math.min(1,base.resolutions/base.attendance):null,attendancePerFte:base.fte>0?base.attendance/base.fte:null};}
  function normalizeFinancialHistoryRow(row={}){const base=normalizeFinancialSummary(row);return{...base,status:['draft','provisional','closed'].includes(row.status)?row.status:'draft',costPerAttendance:base.attendance>0?base.totalCost/base.attendance:null,costPerResolution:base.resolutions>0?base.totalCost/base.resolutions:null,resolutionRate:base.attendance>0?Math.min(1,base.resolutions/base.attendance):null,attendancePerFte:base.fte>0?base.attendance/base.fte:null};}

  function normalizeEfficiencyMetric(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    const totalCost=Math.max(0,num(source.total_cost??source.totalCost)),attendance=Math.max(0,num(source.attendance)),resolutions=Math.max(0,num(source.resolutions)),fte=Math.max(0,num(source.fte));
    const productivityRaw=optionalNumber(source.economic_productivity??source.economicProductivity),costAttendanceRaw=optionalNumber(source.cost_per_attendance??source.costPerAttendance),costResolutionRaw=optionalNumber(source.cost_per_resolution??source.costPerResolution),resolutionRateRaw=optionalNumber(source.resolution_rate??source.resolutionRate),evaluationRaw=optionalNumber(source.evaluation_rate??source.evaluationRate);
    return{
      squadCode:cleanCode(source.squad_code??source.squadCode),
      totalCost,peopleCost:Math.max(0,num(source.people_cost??source.peopleCost)),operationalCost:Math.max(0,num(source.operational_cost??source.operationalCost)),
      peopleCount:Math.max(0,num(source.people_count??source.peopleCount)),fte,attendance,resolutions,resolutionEntries:Math.max(0,num(source.resolution_entries??source.resolutionEntries)),
      costPerAttendance:costAttendanceRaw!=null?Math.max(0,costAttendanceRaw):(attendance>0?totalCost/attendance:null),
      costPerResolution:costResolutionRaw!=null?Math.max(0,costResolutionRaw):(resolutions>0?totalCost/resolutions:null),
      resolutionRate:resolutionRateRaw!=null?Math.max(0,Math.min(1,resolutionRateRaw)):(attendance>0?Math.min(1,resolutions/attendance):null),
      economicProductivity:productivityRaw!=null?Math.max(0,productivityRaw):(totalCost>0?resolutions*1000/totalCost:null),
      evaluationRate:evaluationRaw!=null?Math.max(0,Math.min(1,evaluationRaw)):null
    };
  }
  function normalizeEfficiencyHistoryRow(row={}){
    const operation=normalizeEfficiencyMetric(row.operation||{}),squads=(Array.isArray(row.squads)?row.squads:[]).map(normalizeEfficiencyMetric).filter(item=>item.squadCode),bench=row.benchmarks&&typeof row.benchmarks==='object'?row.benchmarks:{};
    const operationBenchmark=optionalNumber(bench.operation_benchmark??bench.operationBenchmark),meanBenchmark=optionalNumber(bench.mean_benchmark??bench.meanBenchmark),medianBenchmark=optionalNumber(bench.median_benchmark??bench.medianBenchmark),bestValue=optionalNumber(bench.best_value??bench.bestValue);
    return{
      competence:competenceId(row.competence),status:row.status==='closed'?'closed':'draft',revision:Math.max(0,num(row.revision)),snapshotVersion:cleanText(row.snapshot_version??row.snapshotVersion),ruleVersion:cleanText(row.rule_version??row.ruleVersion),source:['close','legacy_backfill','live_preview'].includes(row.source)?row.source:'close',financialSnapshotRevision:Math.max(0,num(row.financial_snapshot_revision??row.financialSnapshotRevision)),createdAt:row.created_at??row.createdAt??null,
      operation,squads,benchmarks:{operationBenchmark,meanBenchmark,medianBenchmark,bestSquadCode:cleanCode(bench.best_squad_code??bench.bestSquadCode),bestValue}
    };
  }

  function normalizeCapacityHistoryRow(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},snapshotSource=['close','legacy_backfill','live_preview'].includes(source.source)?source.source:'close';
    const nominalFte=optionalNumber(source.nominal_fte??source.nominalFte),availableFte=optionalNumber(source.available_fte??source.availableFte),availabilityRate=optionalNumber(source.availability_rate??source.availabilityRate),usedVolume=optionalNumber(source.used_capacity_volume??source.usedCapacityVolume),usedPerFte=optionalNumber(source.used_per_available_fte??source.usedPerAvailableFte),attendanceVolume=optionalNumber(source.attendance_volume??source.attendanceVolume),attendancePerFte=optionalNumber(source.attendance_per_available_fte??source.attendancePerAvailableFte),resolutionRate=optionalNumber(source.resolution_rate??source.resolutionRate);
    return{
      competence:competenceId(source.competence),squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',status:source.status==='closed'?'closed':'draft',
      revision:Math.max(0,num(source.revision)),snapshotVersion:cleanText(source.snapshot_version??source.snapshotVersion),ruleVersion:cleanText(source.rule_version??source.ruleVersion),source:snapshotSource,financialSnapshotRevision:Math.max(0,num(source.financial_snapshot_revision??source.financialSnapshotRevision)),createdAt:source.created_at??source.createdAt??null,
      candidateCount:Math.max(0,num(source.candidate_count??source.candidateCount)),nominalFte:nominalFte==null?null:Math.max(0,nominalFte),availableFte:availableFte==null?null:Math.max(0,availableFte),availabilityRate:availabilityRate==null?null:Math.max(0,Math.min(1,availabilityRate)),
      usedCapacityVolume:usedVolume==null?null:Math.max(0,usedVolume),usedPerAvailableFte:usedPerFte==null?null:Math.max(0,usedPerFte),
      attendanceVolume:attendanceVolume==null?null:Math.max(0,attendanceVolume),attendancePerAvailableFte:attendancePerFte==null?null:Math.max(0,attendancePerFte),resolutionRate:resolutionRate==null?null:Math.max(0,Math.min(1,resolutionRate)),
      usedCapacityComplete:source.used_capacity_complete===true||source.usedCapacityComplete===true||source.complete===true,attendanceComplete:source.attendance_complete===true||source.attendanceComplete===true,availabilityComplete:source.availability_complete===true||source.availabilityComplete===true,
      availabilityMissing:Math.max(0,num(source.availability_missing??source.availabilityMissing)),usedCapacityMissing:Math.max(0,num(source.used_capacity_missing??source.usedCapacityMissing)),attendanceMissing:Math.max(0,num(source.attendance_missing??source.attendanceMissing)),inconsistentRows:Math.max(0,num(source.inconsistent_rows??source.inconsistentRows))
    };
  }


  function normalizeResultFoundation(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    return{
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,
      competence:competenceId(source.competence),
      squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',
      eventCount:Math.max(0,num(source.event_count??source.eventCount)),
      confirmedCount:Math.max(0,num(source.confirmed_count??source.confirmedCount)),
      draftCount:Math.max(0,num(source.draft_count??source.draftCount)),
      cancelledCount:Math.max(0,num(source.cancelled_count??source.cancelledCount)),
      attributedCount:Math.max(0,num(source.attributed_count??source.attributedCount)),
      unattributedCount:Math.max(0,num(source.unattributed_count??source.unattributedCount)),
      sourceCount:Math.max(0,num(source.source_count??source.sourceCount)),
      directCount:Math.max(0,num(source.direct_count??source.directCount)),
      influencedCount:Math.max(0,num(source.influenced_count??source.influencedCount)),
      protectedCount:Math.max(0,num(source.protected_count??source.protectedCount))
    };
  }
  function normalizeResultDirectRevenue(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},categories=Array.isArray(source.categories)?source.categories:[];
    return{
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,
      competence:competenceId(source.competence),
      squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',
      currency:cleanCode(source.currency)||'BRL',
      eventCount:Math.max(0,num(source.event_count??source.eventCount)),
      revenueTotal:Math.max(0,num(source.revenue_total??source.revenueTotal)),
      monthlyRecurringAmount:Math.max(0,num(source.monthly_recurring_amount??source.monthlyRecurringAmount)),
      annualRecurringAmount:Math.max(0,num(source.annual_recurring_amount??source.annualRecurringAmount)),
      ticketAverage:Math.max(0,num(source.ticket_average??source.ticketAverage)),
      attributedEventCount:Math.max(0,num(source.attributed_event_count??source.attributedEventCount)),
      unattributedEventCount:Math.max(0,num(source.unattributed_event_count??source.unattributedEventCount)),
      sourceCount:Math.max(0,num(source.source_count??source.sourceCount)),
      categories:categories.map(row=>({
        category:String(row?.category||'').trim().toLowerCase(),
        eventCount:Math.max(0,num(row?.event_count??row?.eventCount)),
        revenueTotal:Math.max(0,num(row?.revenue_total??row?.revenueTotal)),
        monthlyRecurringAmount:Math.max(0,num(row?.monthly_recurring_amount??row?.monthlyRecurringAmount)),
        annualRecurringAmount:Math.max(0,num(row?.annual_recurring_amount??row?.annualRecurringAmount))
      })).filter(row=>row.category)
    };
  }

  function normalizeResultInfluencedRevenue(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},stages=Array.isArray(source.stages)?source.stages:[];
    return{
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,
      competence:competenceId(source.competence),
      squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',
      currency:cleanCode(source.currency)||'BRL',
      opportunityCount:Math.max(0,num(source.opportunity_count??source.opportunityCount)),
      draftCount:Math.max(0,num(source.draft_count??source.draftCount)),
      convertedCount:Math.max(0,num(source.converted_count??source.convertedCount)),
      cancelledCount:Math.max(0,num(source.cancelled_count??source.cancelledCount)),
      influencedRevenueTotal:Math.max(0,num(source.influenced_revenue_total??source.influencedRevenueTotal)),
      openPotentialAmount:Math.max(0,num(source.open_potential_amount??source.openPotentialAmount)),
      monthlyRecurringAmount:Math.max(0,num(source.monthly_recurring_amount??source.monthlyRecurringAmount)),
      annualRecurringAmount:Math.max(0,num(source.annual_recurring_amount??source.annualRecurringAmount)),
      conversionRate:Math.max(0,Math.min(1,num(source.conversion_rate??source.conversionRate))),
      attributedEventCount:Math.max(0,num(source.attributed_event_count??source.attributedEventCount)),
      unattributedEventCount:Math.max(0,num(source.unattributed_event_count??source.unattributedEventCount)),
      sourceCount:Math.max(0,num(source.source_count??source.sourceCount)),
      stages:stages.map(row=>({
        stage:String(row?.stage||'').trim().toLowerCase(),opportunityCount:Math.max(0,num(row?.opportunity_count??row?.opportunityCount)),draftCount:Math.max(0,num(row?.draft_count??row?.draftCount)),convertedCount:Math.max(0,num(row?.converted_count??row?.convertedCount)),cancelledCount:Math.max(0,num(row?.cancelled_count??row?.cancelledCount)),influencedRevenueTotal:Math.max(0,num(row?.influenced_revenue_total??row?.influencedRevenueTotal)),openPotentialAmount:Math.max(0,num(row?.open_potential_amount??row?.openPotentialAmount))
      })).filter(row=>row.stage)
    };
  }

  function normalizeResultProtectedRevenue(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},types=Array.isArray(source.types)?source.types:[];
    return{
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,
      competence:competenceId(source.competence),
      squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',
      currency:cleanCode(source.currency)||'BRL',
      caseCount:Math.max(0,num(source.case_count??source.caseCount)),
      draftCount:Math.max(0,num(source.draft_count??source.draftCount)),
      protectedCount:Math.max(0,num(source.protected_count??source.protectedCount)),
      lostCount:Math.max(0,num(source.lost_count??source.lostCount)),
      protectedRevenueTotal:Math.max(0,num(source.protected_revenue_total??source.protectedRevenueTotal)),
      atRiskAmount:Math.max(0,num(source.at_risk_amount??source.atRiskAmount)),
      protectedMrr:Math.max(0,num(source.protected_mrr??source.protectedMrr)),
      protectedArr:Math.max(0,num(source.protected_arr??source.protectedArr)),
      atRiskMrr:Math.max(0,num(source.at_risk_mrr??source.atRiskMrr)),
      atRiskArr:Math.max(0,num(source.at_risk_arr??source.atRiskArr)),
      protectionRate:Math.max(0,Math.min(1,num(source.protection_rate??source.protectionRate))),
      attributedEventCount:Math.max(0,num(source.attributed_event_count??source.attributedEventCount)),
      unattributedEventCount:Math.max(0,num(source.unattributed_event_count??source.unattributedEventCount)),
      sourceCount:Math.max(0,num(source.source_count??source.sourceCount)),
      types:types.map(row=>({
        type:String(row?.type||'').trim().toLowerCase(),caseCount:Math.max(0,num(row?.case_count??row?.caseCount)),draftCount:Math.max(0,num(row?.draft_count??row?.draftCount)),protectedCount:Math.max(0,num(row?.protected_count??row?.protectedCount)),lostCount:Math.max(0,num(row?.lost_count??row?.lostCount)),protectedRevenueTotal:Math.max(0,num(row?.protected_revenue_total??row?.protectedRevenueTotal)),atRiskAmount:Math.max(0,num(row?.at_risk_amount??row?.atRiskAmount)),protectedMrr:Math.max(0,num(row?.protected_mrr??row?.protectedMrr)),protectedArr:Math.max(0,num(row?.protected_arr??row?.protectedArr)),atRiskMrr:Math.max(0,num(row?.at_risk_mrr??row?.atRiskMrr)),atRiskArr:Math.max(0,num(row?.at_risk_arr??row?.atRiskArr))
      })).filter(row=>row.type)
    };
  }


  function normalizeResultTechnicianRow(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    return{
      technicianKey:cleanText(source.technician_key??source.technicianKey),personId:cleanText(source.person_id??source.personId)||null,userId:cleanText(source.user_id??source.userId)||null,
      technicianName:cleanText(source.technician_name??source.technicianName)||'Sem identificação',squadCode:cleanCode(source.squad_code??source.squadCode),
      participationCount:Math.max(0,num(source.participation_count??source.participationCount)),creditedEventCount:Math.max(0,num(source.credited_event_count??source.creditedEventCount)),
      directEventCount:Math.max(0,num(source.direct_event_count??source.directEventCount)),directRevenue:Math.max(0,num(source.direct_revenue??source.directRevenue)),directMrr:Math.max(0,num(source.direct_mrr??source.directMrr)),directArr:Math.max(0,num(source.direct_arr??source.directArr)),
      influencedEventCount:Math.max(0,num(source.influenced_event_count??source.influencedEventCount)),influencedRevenue:Math.max(0,num(source.influenced_revenue??source.influencedRevenue)),influencedMrr:Math.max(0,num(source.influenced_mrr??source.influencedMrr)),influencedArr:Math.max(0,num(source.influenced_arr??source.influencedArr)),
      protectedEventCount:Math.max(0,num(source.protected_event_count??source.protectedEventCount)),protectedRevenue:Math.max(0,num(source.protected_revenue??source.protectedRevenue)),protectedMrr:Math.max(0,num(source.protected_mrr??source.protectedMrr)),protectedArr:Math.max(0,num(source.protected_arr??source.protectedArr)),
      directShareUnits:Math.max(0,num(source.direct_share_units??source.directShareUnits)),influencedShareUnits:Math.max(0,num(source.influenced_share_units??source.influencedShareUnits)),protectedShareUnits:Math.max(0,num(source.protected_share_units??source.protectedShareUnits))
    };
  }
  function normalizeResultTechnician(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},rows=Array.isArray(source.rows)?source.rows:[];
    return{
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,competence:competenceId(source.competence),squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',currency:cleanCode(source.currency)||'BRL',
      technicianCount:Math.max(0,num(source.technician_count??source.technicianCount)),participationCount:Math.max(0,num(source.participation_count??source.participationCount)),creditedEventCount:Math.max(0,num(source.credited_event_count??source.creditedEventCount)),
      directRevenue:Math.max(0,num(source.direct_revenue??source.directRevenue)),influencedRevenue:Math.max(0,num(source.influenced_revenue??source.influencedRevenue)),protectedRevenue:Math.max(0,num(source.protected_revenue??source.protectedRevenue)),
      directMrr:Math.max(0,num(source.direct_mrr??source.directMrr)),influencedMrr:Math.max(0,num(source.influenced_mrr??source.influencedMrr)),protectedMrr:Math.max(0,num(source.protected_mrr??source.protectedMrr)),
      rows:rows.map(normalizeResultTechnicianRow).filter(row=>row.technicianKey||row.personId||row.userId)
    };
  }

  function normalizeResultSquadRow(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    return{
      squadCode:cleanCode(source.squad_code??source.squadCode)||'SEM SQUAD',technicianCount:Math.max(0,num(source.technician_count??source.technicianCount)),participationCount:Math.max(0,num(source.participation_count??source.participationCount)),creditedEventCount:Math.max(0,num(source.credited_event_count??source.creditedEventCount)),
      directEventCount:Math.max(0,num(source.direct_event_count??source.directEventCount)),directRevenue:Math.max(0,num(source.direct_revenue??source.directRevenue)),directMrr:Math.max(0,num(source.direct_mrr??source.directMrr)),directArr:Math.max(0,num(source.direct_arr??source.directArr)),
      influencedEventCount:Math.max(0,num(source.influenced_event_count??source.influencedEventCount)),influencedRevenue:Math.max(0,num(source.influenced_revenue??source.influencedRevenue)),influencedMrr:Math.max(0,num(source.influenced_mrr??source.influencedMrr)),influencedArr:Math.max(0,num(source.influenced_arr??source.influencedArr)),
      protectedEventCount:Math.max(0,num(source.protected_event_count??source.protectedEventCount)),protectedRevenue:Math.max(0,num(source.protected_revenue??source.protectedRevenue)),protectedMrr:Math.max(0,num(source.protected_mrr??source.protectedMrr)),protectedArr:Math.max(0,num(source.protected_arr??source.protectedArr)),
      directShareUnits:Math.max(0,num(source.direct_share_units??source.directShareUnits)),influencedShareUnits:Math.max(0,num(source.influenced_share_units??source.influencedShareUnits)),protectedShareUnits:Math.max(0,num(source.protected_share_units??source.protectedShareUnits))
    };
  }
  function normalizeResultSquad(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},rows=Array.isArray(source.rows)?source.rows:[];
    return{
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,competence:competenceId(source.competence),squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',currency:cleanCode(source.currency)||'BRL',
      squadCount:Math.max(0,num(source.squad_count??source.squadCount)),technicianCount:Math.max(0,num(source.technician_count??source.technicianCount)),participationCount:Math.max(0,num(source.participation_count??source.participationCount)),creditedEventCount:Math.max(0,num(source.credited_event_count??source.creditedEventCount)),
      directRevenue:Math.max(0,num(source.direct_revenue??source.directRevenue)),influencedRevenue:Math.max(0,num(source.influenced_revenue??source.influencedRevenue)),protectedRevenue:Math.max(0,num(source.protected_revenue??source.protectedRevenue)),
      directMrr:Math.max(0,num(source.direct_mrr??source.directMrr)),influencedMrr:Math.max(0,num(source.influenced_mrr??source.influencedMrr)),protectedMrr:Math.max(0,num(source.protected_mrr??source.protectedMrr)),
      rows:rows.map(normalizeResultSquadRow).filter(row=>row.squadCode)
    };
  }


  function normalizeResultRoiRow(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    return{
      squadCode:cleanCode(source.squad_code??source.squadCode)||'SEM SQUAD',
      totalCost:Math.max(0,num(source.total_cost??source.totalCost)),peopleCost:Math.max(0,num(source.people_cost??source.peopleCost)),operationalCost:Math.max(0,num(source.operational_cost??source.operationalCost)),fte:Math.max(0,num(source.fte)),
      directRevenue:Math.max(0,num(source.direct_revenue??source.directRevenue)),influencedRevenue:Math.max(0,num(source.influenced_revenue??source.influencedRevenue)),protectedRevenue:Math.max(0,num(source.protected_revenue??source.protectedRevenue)),
      directMrr:Math.max(0,num(source.direct_mrr??source.directMrr)),influencedMrr:Math.max(0,num(source.influenced_mrr??source.influencedMrr)),protectedMrr:Math.max(0,num(source.protected_mrr??source.protectedMrr)),
      directNetReturn:optionalNumber(source.direct_net_return??source.directNetReturn),directRoiPct:optionalNumber(source.direct_roi_pct??source.directRoiPct),directCostCoverage:optionalNumber(source.direct_cost_coverage??source.directCostCoverage),
      influencedImpactPerCost:optionalNumber(source.influenced_impact_per_cost??source.influencedImpactPerCost),protectedImpactPerCost:optionalNumber(source.protected_impact_per_cost??source.protectedImpactPerCost),directRevenuePerFte:optionalNumber(source.direct_revenue_per_fte??source.directRevenuePerFte),protectedMrrPerFte:optionalNumber(source.protected_mrr_per_fte??source.protectedMrrPerFte)
    };
  }
  function normalizeResultRoi(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},rows=Array.isArray(source.rows)?source.rows:[];
    return{sourceAvailable:source.source_available===true||source.sourceAvailable===true,competence:competenceId(source.competence),squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',currency:cleanCode(source.currency)||'BRL',totalCost:Math.max(0,num(source.total_cost??source.totalCost)),fte:Math.max(0,num(source.fte)),directRevenue:Math.max(0,num(source.direct_revenue??source.directRevenue)),influencedRevenue:Math.max(0,num(source.influenced_revenue??source.influencedRevenue)),protectedRevenue:Math.max(0,num(source.protected_revenue??source.protectedRevenue)),unallocatedDirectRevenue:Math.max(0,num(source.unallocated_direct_revenue??source.unallocatedDirectRevenue)),unallocatedInfluencedRevenue:Math.max(0,num(source.unallocated_influenced_revenue??source.unallocatedInfluencedRevenue)),unallocatedProtectedRevenue:Math.max(0,num(source.unallocated_protected_revenue??source.unallocatedProtectedRevenue)),directNetReturn:optionalNumber(source.direct_net_return??source.directNetReturn),directRoiPct:optionalNumber(source.direct_roi_pct??source.directRoiPct),directCostCoverage:optionalNumber(source.direct_cost_coverage??source.directCostCoverage),influencedImpactPerCost:optionalNumber(source.influenced_impact_per_cost??source.influencedImpactPerCost),protectedImpactPerCost:optionalNumber(source.protected_impact_per_cost??source.protectedImpactPerCost),directRevenuePerFte:optionalNumber(source.direct_revenue_per_fte??source.directRevenuePerFte),protectedMrrPerFte:optionalNumber(source.protected_mrr_per_fte??source.protectedMrrPerFte),rows:rows.map(normalizeResultRoiRow).filter(row=>row.squadCode)};
  }
  function normalizeResultTechnicianRoiRow(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    return{technicianKey:cleanText(source.technician_key??source.technicianKey),personId:cleanText(source.person_id??source.personId)||null,userId:cleanText(source.user_id??source.userId)||null,technicianName:cleanText(source.technician_name??source.technicianName)||'Sem identificação',squadCode:cleanCode(source.squad_code??source.squadCode),costAvailable:source.cost_available===true||source.costAvailable===true,totalCost:Math.max(0,num(source.total_cost??source.totalCost)),fte:Math.max(0,num(source.fte)),directRevenue:Math.max(0,num(source.direct_revenue??source.directRevenue)),influencedRevenue:Math.max(0,num(source.influenced_revenue??source.influencedRevenue)),protectedRevenue:Math.max(0,num(source.protected_revenue??source.protectedRevenue)),directNetReturn:optionalNumber(source.direct_net_return??source.directNetReturn),directRoiPct:optionalNumber(source.direct_roi_pct??source.directRoiPct),directCostCoverage:optionalNumber(source.direct_cost_coverage??source.directCostCoverage),influencedImpactPerCost:optionalNumber(source.influenced_impact_per_cost??source.influencedImpactPerCost),protectedImpactPerCost:optionalNumber(source.protected_impact_per_cost??source.protectedImpactPerCost),directRevenuePerFte:optionalNumber(source.direct_revenue_per_fte??source.directRevenuePerFte)};
  }
  function normalizeResultTechnicianRoi(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},rows=Array.isArray(source.rows)?source.rows:[];
    return{sourceAvailable:source.source_available===true||source.sourceAvailable===true,competence:competenceId(source.competence),squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',currency:cleanCode(source.currency)||'BRL',technicianCount:Math.max(0,num(source.technician_count??source.technicianCount)),costedTechnicianCount:Math.max(0,num(source.costed_technician_count??source.costedTechnicianCount)),technicianCostTotal:Math.max(0,num(source.technician_cost_total??source.technicianCostTotal)),directRevenue:Math.max(0,num(source.direct_revenue??source.directRevenue)),influencedRevenue:Math.max(0,num(source.influenced_revenue??source.influencedRevenue)),protectedRevenue:Math.max(0,num(source.protected_revenue??source.protectedRevenue)),directNetReturn:optionalNumber(source.direct_net_return??source.directNetReturn),directRoiPct:optionalNumber(source.direct_roi_pct??source.directRoiPct),directCostCoverage:optionalNumber(source.direct_cost_coverage??source.directCostCoverage),rows:rows.map(normalizeResultTechnicianRoiRow).filter(row=>row.technicianKey||row.personId||row.userId)};
  }


  function resultHistoryOptionalNonNegative(value){const n=optionalNumber(value);return n==null?null:Math.max(0,n)}
  function normalizeResultHistoryRow(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    return{competence:competenceId(source.competence),status:cleanText(source.status)||'closed',revision:resultHistoryOptionalNonNegative(source.revision),snapshotVersion:cleanText(source.snapshot_version??source.snapshotVersion),ruleVersion:cleanText(source.rule_version??source.ruleVersion),source:cleanText(source.source)||'close',financialSnapshotRevision:resultHistoryOptionalNonNegative(source.financial_snapshot_revision??source.financialSnapshotRevision),snapshotFingerprint:cleanText(source.snapshot_fingerprint??source.snapshotFingerprint),createdAt:source.created_at??source.createdAt??null,squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',creditedEventCount:resultHistoryOptionalNonNegative(source.credited_event_count??source.creditedEventCount),totalCost:resultHistoryOptionalNonNegative(source.total_cost??source.totalCost),fte:resultHistoryOptionalNonNegative(source.fte),directRevenue:resultHistoryOptionalNonNegative(source.direct_revenue??source.directRevenue),directMrr:resultHistoryOptionalNonNegative(source.direct_mrr??source.directMrr),directArr:resultHistoryOptionalNonNegative(source.direct_arr??source.directArr),influencedRevenue:resultHistoryOptionalNonNegative(source.influenced_revenue??source.influencedRevenue),influencedMrr:resultHistoryOptionalNonNegative(source.influenced_mrr??source.influencedMrr),influencedArr:resultHistoryOptionalNonNegative(source.influenced_arr??source.influencedArr),protectedRevenue:resultHistoryOptionalNonNegative(source.protected_revenue??source.protectedRevenue),protectedMrr:resultHistoryOptionalNonNegative(source.protected_mrr??source.protectedMrr),protectedArr:resultHistoryOptionalNonNegative(source.protected_arr??source.protectedArr),directNetReturn:optionalNumber(source.direct_net_return??source.directNetReturn),directRoiPct:optionalNumber(source.direct_roi_pct??source.directRoiPct),directCostCoverage:optionalNumber(source.direct_cost_coverage??source.directCostCoverage),influencedImpactPerCost:optionalNumber(source.influenced_impact_per_cost??source.influencedImpactPerCost),protectedImpactPerCost:optionalNumber(source.protected_impact_per_cost??source.protectedImpactPerCost)};
  }
  function normalizeResultHistory(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},rows=Array.isArray(source.rows)?source.rows:[],hardening=source.hardening&&typeof source.hardening==='object'?source.hardening:{};
    return{sourceAvailable:source.source_available===true||source.sourceAvailable===true,squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',snapshotVersion:cleanText(source.snapshot_version??source.snapshotVersion),ruleVersion:cleanText(source.rule_version??source.ruleVersion),hardening:{version:cleanText(hardening.version),latestSnapshotCount:Math.max(0,num(hardening.latest_snapshot_count??hardening.latestSnapshotCount)),closedSnapshotCount:Math.max(0,num(hardening.closed_snapshot_count??hardening.closedSnapshotCount)),eligibleSnapshotCount:Math.max(0,num(hardening.eligible_snapshot_count??hardening.eligibleSnapshotCount)),invalidSnapshotCount:Math.max(0,num(hardening.invalid_snapshot_count??hardening.invalidSnapshotCount)),reopenedCompetenceCount:Math.max(0,num(hardening.reopened_competence_count??hardening.reopenedCompetenceCount)),legacyBackfillCount:Math.max(0,num(hardening.legacy_backfill_count??hardening.legacyBackfillCount))},rows:rows.map(normalizeResultHistoryRow).filter(row=>row.competence).sort((a,b)=>a.competence.localeCompare(b.competence))};
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
  function buildFinancialContext({competences=[],people=[],costs=[],operationalCosts=[],allocations=[],resolutionMetrics=[],summary=null,squadSummary=[],history=[],efficiencyHistory=[],capacityHistory=[],resultFoundation={},resultDirectRevenue={},resultInfluencedRevenue={},resultProtectedRevenue={},resultTechnician={},resultSquad={},resultRoi={},resultTechnicianRoi={},resultHistory={}}={}){
    const competenceRows=(competences||[]).map(normalizeCompetenceRow).filter(row=>row.competence);
    const personRows=(people||[]).map(normalizePersonRow).filter(row=>row.id&&row.name);
    const costRows=(costs||[]).map(normalizeEmployeeCostRow).filter(row=>row.personId);
    const operationalRows=(operationalCosts||[]).map(normalizeOperationalCostRow).filter(row=>row.id);
    const allocationRows=(allocations||[]).map(normalizeAllocationRow).filter(row=>row.operationalCostId);
    const resolutionRows=(resolutionMetrics||[]).map(normalizeResolutionMetricRow).filter(row=>row.userId&&row.squadCode);
    const squadRows=(squadSummary||[]).map(normalizeSquadFinancialRow).filter(row=>row.squadCode);
    const historyRows=(history||[]).map(normalizeFinancialHistoryRow).filter(row=>row.competence).sort((a,b)=>a.competence.localeCompare(b.competence));
    const efficiencyRows=(efficiencyHistory||[]).map(normalizeEfficiencyHistoryRow).filter(row=>row.competence).sort((a,b)=>a.competence.localeCompare(b.competence));
    const capacityRows=(capacityHistory||[]).map(normalizeCapacityHistoryRow).filter(row=>row.competence).sort((a,b)=>a.competence.localeCompare(b.competence)||a.squadCode.localeCompare(b.squadCode));
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
      efficiencyHistory:Object.freeze(efficiencyRows.map(row=>Object.freeze({...row,operation:Object.freeze({...row.operation}),squads:Object.freeze(row.squads.map(item=>Object.freeze({...item}))),benchmarks:Object.freeze({...row.benchmarks})}))),
      capacityHistory:Object.freeze(capacityRows.map(row=>Object.freeze({...row}))),
      resultFoundation:Object.freeze(normalizeResultFoundation(resultFoundation||{})),
      resultDirectRevenue:Object.freeze({...normalizeResultDirectRevenue(resultDirectRevenue||{}),categories:Object.freeze(normalizeResultDirectRevenue(resultDirectRevenue||{}).categories.map(row=>Object.freeze({...row})))}),
      resultInfluencedRevenue:Object.freeze({...normalizeResultInfluencedRevenue(resultInfluencedRevenue||{}),stages:Object.freeze(normalizeResultInfluencedRevenue(resultInfluencedRevenue||{}).stages.map(row=>Object.freeze({...row})))}),
      resultProtectedRevenue:Object.freeze({...normalizeResultProtectedRevenue(resultProtectedRevenue||{}),types:Object.freeze(normalizeResultProtectedRevenue(resultProtectedRevenue||{}).types.map(row=>Object.freeze({...row})))}),
      resultTechnician:Object.freeze({...normalizeResultTechnician(resultTechnician||{}),rows:Object.freeze(normalizeResultTechnician(resultTechnician||{}).rows.map(row=>Object.freeze({...row})))}),
      resultSquad:Object.freeze({...normalizeResultSquad(resultSquad||{}),rows:Object.freeze(normalizeResultSquad(resultSquad||{}).rows.map(row=>Object.freeze({...row})))}),
      resultRoi:Object.freeze({...normalizeResultRoi(resultRoi||{}),rows:Object.freeze(normalizeResultRoi(resultRoi||{}).rows.map(row=>Object.freeze({...row})))}),
      resultTechnicianRoi:Object.freeze({...normalizeResultTechnicianRoi(resultTechnicianRoi||{}),rows:Object.freeze(normalizeResultTechnicianRoi(resultTechnicianRoi||{}).rows.map(row=>Object.freeze({...row})))}),
      resultHistory:Object.freeze({...normalizeResultHistory(resultHistory||{}),rows:Object.freeze(normalizeResultHistory(resultHistory||{}).rows.map(row=>Object.freeze({...row})))})
    });
  }
  return{num,optionalNumber,competenceId,competenceDate,normalizeSquads,collectCompetences,competenceLabel,normalizeCompetenceRow,normalizePersonRow,normalizeEmployeeCostRow,normalizeOperationalCostRow,normalizeAllocationRow,normalizeResolutionMetricRow,normalizePeopleSummary,normalizeFinancialSummary,normalizeSquadFinancialRow,normalizeFinancialHistoryRow,normalizeEfficiencyMetric,normalizeEfficiencyHistoryRow,normalizeCapacityHistoryRow,normalizeResultFoundation,normalizeResultDirectRevenue,normalizeResultInfluencedRevenue,normalizeResultProtectedRevenue,normalizeResultTechnicianRow,normalizeResultTechnician,normalizeResultSquadRow,normalizeResultSquad,normalizeResultRoiRow,normalizeResultRoi,normalizeResultTechnicianRoiRow,normalizeResultTechnicianRoi,normalizeResultHistoryRow,normalizeResultHistory,buildOperationalContext,buildFinancialContext};
});
