(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenImportEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const safe=v=>Number.isFinite(Number(v))?Number(v):0;
  const pctDelta=(next,current)=>{
    const a=safe(next),b=safe(current);
    if(!b)return a?1:0;
    return (a-b)/Math.abs(b);
  };
  const checksumText=text=>{
    const s=String(text||'');let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(16).padStart(8,'0');
  };
  const uniqueNames=rows=>new Set((rows||[]).map(r=>String(r.name||r.technicianName||'').trim()).filter(Boolean)).size;
  function summarizeService(rows,period,codes,currentByCode={}){
    const squads=[];
    for(const code of codes||[]){
      const selected=(rows||[]).filter(r=>r.id===period&&r.group===code);
      if(!selected.length)continue;
      const incoming={rows:selected.length,technicians:uniqueNames(selected),attendance:selected.reduce((s,r)=>s+safe(r.att),0),notes5:selected.reduce((s,r)=>s+safe(r.notes5),0),evaluations:selected.reduce((s,r)=>s+[5,4,3,2,1].reduce((a,n)=>a+safe(r[`notes${n}`]),0),0)};
      const current=currentByCode?.[code]||{technicians:0,attendance:0,evaluations:0,notes5:0};
      squads.push({code,incoming,current,attendanceDelta:pctDelta(incoming.attendance,current.attendance),technicianDelta:pctDelta(incoming.technicians,current.technicians),evaluationDelta:pctDelta(incoming.evaluations,current.evaluations)});
    }
    return {kind:'service',period,squads,rows:squads.reduce((s,x)=>s+x.incoming.rows,0),technicians:squads.reduce((s,x)=>s+x.incoming.technicians,0),attendance:squads.reduce((s,x)=>s+x.incoming.attendance,0),evaluations:squads.reduce((s,x)=>s+x.incoming.evaluations,0)};
  }
  function summarizeQuality(rows,period,codes,currentByCode={}){
    const squads=[];
    for(const code of codes||[]){
      const selected=(rows||[]).filter(r=>r.id===period&&r.group===code);
      if(!selected.length)continue;
      const product=selected.reduce((s,r)=>s+(safe(r.productNote)>0?1:0),0),company=selected.reduce((s,r)=>s+(safe(r.companyNote)>0?1:0),0),incoming={rows:selected.length,ratings:product+company,technicians:uniqueNames(selected),product,company};
      const current=currentByCode?.[code]||{rows:0,technicians:0,product:0,company:0};
      squads.push({code,incoming,current,rowDelta:pctDelta(incoming.ratings,current.rows),technicianDelta:pctDelta(incoming.technicians,current.technicians)});
    }
    return {kind:'quality',period,squads,rows:squads.reduce((s,x)=>s+x.incoming.rows,0),technicians:squads.reduce((s,x)=>s+x.incoming.technicians,0),product:squads.reduce((s,x)=>s+x.incoming.product,0),company:squads.reduce((s,x)=>s+x.incoming.company,0)};
  }
  function validatePreview({kind,totalRows=0,validRows=0,ignored=0,unmatched=0,ambiguous=0,negativeValues=0,closedSquads=[],summary=null}={}){
    const issues=[];let level='ok',blocked=false,requiresConfirmation=false;
    const add=(severity,code,message)=>{issues.push({severity,code,message});if(severity==='error'){level='error';blocked=true}else if(severity==='warning'&&level!=='error'){level='warning';requiresConfirmation=true}else if(severity==='info'&&level==='ok'){level='ok'}};
    if(!validRows)add('error','no_valid_rows','Nenhuma linha válida ficou disponível para a competência e o escopo selecionados.');
    if(negativeValues>0)add('error','negative_values',`${negativeValues} valor(es) negativo(s) foram encontrados em campos numéricos.`);
    if((closedSquads||[]).length)add('error','closed_month',`A competência está fechada em: ${(closedSquads||[]).join(', ')}.`);
    const invalidRatio=totalRows?safe(ignored)/safe(totalRows):0;
    if(invalidRatio>=.20)add('warning','many_ignored',`${Math.round(invalidRatio*100)}% das linhas do arquivo foram ignoradas.`);
    else if(ignored>0)add('info','ignored_rows',`${ignored} linha(s) inválida(s) ou fora do escopo serão ignoradas.`);
    const unmatchedRatio=totalRows?safe(unmatched)/safe(totalRows):0;
    if(unmatchedRatio>=.15)add('warning','many_unmatched',`${unmatched} vínculo(s) não foram reconhecidos; revise nomes e Squads antes de confirmar.`);
    else if(unmatched>0)add('info','unmatched',`${unmatched} vínculo(s) não reconhecido(s) serão ignorados.`);
    if(ambiguous>0)add('warning','ambiguous',`${ambiguous} vínculo(s) ambíguo(s) foram detectados.`);
    for(const item of summary?.squads||[]){
      if(kind==='service'&&item.current?.attendance>0){
        if(item.attendanceDelta<=-.35)add('warning','attendance_drop',`Squad ${item.code}: atendimentos cairão ${Math.round(Math.abs(item.attendanceDelta)*100)}% em relação ao valor atual.`);
        if(item.technicianDelta<=-.30)add('warning','technician_drop',`Squad ${item.code}: quantidade de técnicos cairá ${Math.round(Math.abs(item.technicianDelta)*100)}%.`);
        if(item.incoming.evaluations>item.incoming.attendance*1.15)add('warning','evaluation_ratio',`Squad ${item.code}: avaliações estão acima de 115% dos atendimentos; confira o CSV.`);
      }
      if(kind==='quality'&&item.current?.rows>0&&item.rowDelta<=-.40)add('warning','quality_drop',`Squad ${item.code}: avaliações de Produto/Empresa cairão ${Math.round(Math.abs(item.rowDelta)*100)}%.`);
    }
    return {level,blocked,requiresConfirmation,issues};
  }
  function historySummary(record={}){
    return {
      id:String(record.id||record.batchKey||''),batchKey:String(record.batchKey||record.id||''),kind:record.kind==='quality'?'quality':'service',period:String(record.period||''),fileName:String(record.fileName||''),checksum:String(record.checksum||''),scope:Array.isArray(record.scope)?record.scope:[],rows:safe(record.rows),ignored:safe(record.ignored),unmatched:safe(record.unmatched),status:['success','failed','reverted'].includes(record.status)?record.status:'success',createdAt:record.createdAt||new Date().toISOString(),createdBy:record.createdBy||'',risk:record.risk||'ok',beforeSnapshot:record.beforeSnapshot||null,details:record.details||{}
    };
  }
  function canRollback(record){return Boolean(record&&record.status==='success'&&record.beforeSnapshot&&Object.keys(record.beforeSnapshot||{}).length>0)}
  return {safe,pctDelta,checksumText,summarizeService,summarizeQuality,validatePreview,historySummary,canRollback};
});
