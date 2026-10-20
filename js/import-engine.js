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
  const normalizeCsvHeader=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  function parseCsvRows(text){
    const source=String(text||'').replace(/^\uFEFF/,''),physicalLines=source.split(/\r?\n/),firstNonEmpty=(physicalLines.find(line=>String(line).trim())||''),sepDirective=firstNonEmpty.trim().match(/^sep\s*=\s*([;,])\s*$/i),comma=(firstNonEmpty.match(/,/g)||[]).length,semi=(firstNonEmpty.match(/;/g)||[]).length,delimiter=sepDirective?sepDirective[1]:(semi>comma?';':','),rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<source.length;i++){const c=source[i];if(quoted){if(c==='"'&&source[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===delimiter){row.push(field);field=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&source[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>String(v).trim()!==''))rows.push(row);row=[]}else field+=c}row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);if(sepDirective&&rows.length)rows.shift();return rows;
  }
  const FINANCIAL_IMPACT_HEADER_ALIASES={
    date:{label:'Data da avaliação',accepted:['DataAvaliacao','Data Avaliação','Data da Avaliação','Time','Data'],aliases:['dataavaliacao','datadaavaliacao','time','data']},
    service:{label:'Nota Serviço',accepted:['NotaServico','Nota Serviço','Nota Atendimento'],aliases:['notaservico','notaatendimento']},
    product:{label:'Nota Produto',accepted:['NotaProduto','Nota Produto'],aliases:['notaproduto']},
    company:{label:'Nota Empresa',accepted:['NotaEmpresa','Nota Empresa'],aliases:['notaempresa']}
  };
  const QUALITY_IMPORT_HEADER_ALIASES={
    date:{label:'Data da avaliação',accepted:['Time','DataAvaliacao','Data Avaliação','Data da Avaliação','Data'],aliases:['time','dataavaliacao','datadaavaliacao','data']},
    technician:{label:'Técnico',accepted:['nomeApresentativo','Nome Apresentativo','Tecnico','Técnico','Atendente'],aliases:['nomeapresentativo','tecnico','atendente']},
    product:{label:'Nota Produto',accepted:['NotaProduto','Nota Produto'],aliases:['notaproduto']},
    company:{label:'Nota Empresa',accepted:['NotaEmpresa','Nota Empresa'],aliases:['notaempresa']}
  };
  const QUALITY_FULL_IMPORT_HEADER_ALIASES={
    date:{label:'Data da avaliação',accepted:['Time','DataAvaliacao','Data Avaliação','Data da Avaliação','Data'],aliases:['time','dataavaliacao','datadaavaliacao','data']},
    technician:{label:'Técnico',accepted:['nomeApresentativo','Nome Apresentativo','Tecnico','Técnico','Atendente'],aliases:['nomeapresentativo','tecnico','atendente']},
    service:{label:'Nota Serviço',accepted:['NotaServico','Nota Serviço','Nota Atendimento'],aliases:['notaservico','notaatendimento']},
    product:{label:'Nota Produto',accepted:['NotaProduto','Nota Produto'],aliases:['notaproduto']},
    company:{label:'Nota Empresa',accepted:['NotaEmpresa','Nota Empresa'],aliases:['notaempresa']},
    group:{label:'Grupo',accepted:['grupoAtendimento','Grupo Atendimento','Squad','Grupo'],aliases:['grupoatendimento','squad','grupo'],optional:true}
  };
  function resolveFinancialImpactColumns(headers=[]){
    const original=(headers||[]).map(v=>String(v||'').trim()),normalized=original.map(normalizeCsvHeader),indexes={},missing=[];
    for(const [key,definition] of Object.entries(FINANCIAL_IMPACT_HEADER_ALIASES)){
      const index=normalized.findIndex(header=>definition.aliases.includes(header));
      indexes[key]=index>=0?index:null;
      if(index<0)missing.push({key,label:definition.label,accepted:[...definition.accepted]});
    }
    return{indexes,missing,headers:original,normalizedHeaders:normalized};
  }
  function resolveQualityImportColumns(headers=[]){
    const original=(headers||[]).map(v=>String(v||'').trim()),normalized=original.map(normalizeCsvHeader),indexes={},missing=[];
    for(const [key,definition] of Object.entries(QUALITY_IMPORT_HEADER_ALIASES)){
      const index=normalized.findIndex(header=>definition.aliases.includes(header));
      indexes[key]=index>=0?index:null;
      if(index<0)missing.push({key,label:definition.label,accepted:[...definition.accepted]});
    }
    return{indexes,missing,headers:original,normalizedHeaders:normalized};
  }
  function resolveQualityFullImportColumns(headers=[]){
    const original=(headers||[]).map(v=>String(v||'').trim()),normalized=original.map(normalizeCsvHeader),indexes={},missing=[];
    for(const [key,definition] of Object.entries(QUALITY_FULL_IMPORT_HEADER_ALIASES)){
      const index=normalized.findIndex(header=>definition.aliases.includes(header));
      indexes[key]=index>=0?index:null;
      if(index<0&&!definition.optional)missing.push({key,label:definition.label,accepted:[...definition.accepted]});
    }
    return{indexes,missing,headers:original,normalizedHeaders:normalized};
  }

  const QUALITY_PREP_DEDUPE_ALIASES=['idcliente','clienteid','codigocliente','codcliente','cnpj','cpf','documento','documentocliente','clientecnpj','razaosocial','nomecliente','cliente'];
  function suggestQualityPreparation(headers=[],kind='quality'){
    const original=(headers||[]).map(v=>String(v||'').trim()),base=kind==='quality-full'?resolveQualityFullImportColumns(original):resolveQualityImportColumns(original),full=resolveQualityFullImportColumns(original),mapping={date:base.indexes.date,technician:base.indexes.technician,product:base.indexes.product,company:base.indexes.company,service:full.indexes.service,group:full.indexes.group};
    const normalized=original.map(normalizeCsvHeader),dedupeIndex=normalized.findIndex(h=>QUALITY_PREP_DEDUPE_ALIASES.includes(h));
    return{headers:original,mapping,dedupeColumns:dedupeIndex>=0?[dedupeIndex]:[],dedupeEnabled:kind==='quality',keep:'first'};
  }
  function qualityPreparationMonthKey(value){
    const raw=String(value||'').trim();if(!raw)return'';
    let m=raw.match(/^(\d{4})[-\/]([01]?\d)(?:[-\/]([0-3]?\d))?/);if(m)return`${m[1]}-${String(Number(m[2])).padStart(2,'0')}`;
    m=raw.match(/^([0-3]?\d)[-\/]([01]?\d)[-\/](\d{4})/);if(m)return`${m[3]}-${String(Number(m[2])).padStart(2,'0')}`;
    m=raw.match(/(\d{4})[-\/]([01]?\d)/);return m?`${m[1]}-${String(Number(m[2])).padStart(2,'0')}`:'';
  }
  function qualityPreparationKeyValue(value){return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').replace(/[^a-z0-9@._ -]/g,'').trim()}
  function csvEscape(value){const text=String(value??'');return /[";,\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text}
  function prepareQualitySource({headers=[],rows=[],kind='quality',mapping={},dedupeEnabled=false,dedupeColumns=[],keep='first'}={}){
    if(!['quality','quality-full'].includes(kind))throw new Error('Tipo de preparação de qualidade inválido.');
    const required=kind==='quality-full'?['date','technician','service','product','company']:['date','technician','product','company'];
    const missing=required.filter(key=>!Number.isInteger(Number(mapping?.[key]))||Number(mapping[key])<0||Number(mapping[key])>=headers.length);if(missing.length)throw new Error(`Mapeie as colunas obrigatórias: ${missing.join(', ')}.`);
    const dedupeIdx=(dedupeColumns||[]).map(Number).filter(i=>Number.isInteger(i)&&i>=0&&i<headers.length);if(dedupeEnabled&&!dedupeIdx.length)throw new Error('Selecione ao menos uma coluna para deduplicar.');
    const sourceRows=(rows||[]).map((row,index)=>({row,index})),dateIdx=Number(mapping.date),seen=new Map(),kept=[],duplicateIndexes=new Set();let blankDedupKeys=0;
    if(dedupeEnabled){
      for(const item of sourceRows){const month=qualityPreparationMonthKey(item.row[dateIdx]),parts=dedupeIdx.map(i=>qualityPreparationKeyValue(item.row[i]));if(parts.every(v=>!v)){blankDedupKeys++;continue}const key=`${month||'sem-competencia'}|${parts.join('|')}`;if(!seen.has(key))seen.set(key,item.index);else if(keep==='last'){duplicateIndexes.add(seen.get(key));seen.set(key,item.index)}else duplicateIndexes.add(item.index)}
    }
    for(const item of sourceRows)if(!duplicateIndexes.has(item.index))kept.push(item.row);
    const get=(row,key)=>{const idx=Number(mapping?.[key]);return Number.isInteger(idx)&&idx>=0&&idx<row.length?row[idx]:''};
    const canonicalHeaders=kind==='quality-full'?['DataAvaliacao','nomeApresentativo','NotaServico','NotaProduto','NotaEmpresa','grupoAtendimento']:['DataAvaliacao','nomeApresentativo','NotaProduto','NotaEmpresa'];
    const canonicalRows=kept.map(row=>kind==='quality-full'?[get(row,'date'),get(row,'technician'),get(row,'service'),get(row,'product'),get(row,'company'),get(row,'group')]:[get(row,'date'),get(row,'technician'),get(row,'product'),get(row,'company')]);
    const csvText=[canonicalHeaders,...canonicalRows].map(row=>row.map(csvEscape).join(',')).join('\n');
    return{csvText,headers:canonicalHeaders,rows:canonicalRows,stats:{sourceRows:sourceRows.length,sourceColumns:headers.length,resultRows:canonicalRows.length,duplicatesRemoved:duplicateIndexes.size,blankDedupKeys,dedupeEnabled:!!dedupeEnabled,dedupeColumns:dedupeIdx,keep:keep==='last'?'last':'first',partitionByCompetence:true},mapping:{...mapping}};
  }

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
  function summarizeQualityFull(rows,period,codes,currentByCode={}){
    const squads=[];
    for(const code of codes||[]){
      const selected=(rows||[]).filter(r=>r.id===period&&r.group===code);
      if(!selected.length)continue;
      const service=selected.reduce((s,r)=>s+(safe(r.serviceNote)>0?1:0),0),product=selected.reduce((s,r)=>s+(safe(r.productNote)>0?1:0),0),company=selected.reduce((s,r)=>s+(safe(r.companyNote)>0?1:0),0),incoming={rows:selected.length,ratings:service+product+company,technicians:uniqueNames(selected),service,product,company};
      const current=currentByCode?.[code]||{rows:0,technicians:0,service:0,product:0,company:0};
      squads.push({code,incoming,current,rowDelta:pctDelta(incoming.rows,current.rows),technicianDelta:pctDelta(incoming.technicians,current.technicians)});
    }
    return {kind:'quality-full',period,squads,rows:squads.reduce((s,x)=>s+x.incoming.rows,0),technicians:squads.reduce((s,x)=>s+x.incoming.technicians,0),service:squads.reduce((s,x)=>s+x.incoming.service,0),product:squads.reduce((s,x)=>s+x.incoming.product,0),company:squads.reduce((s,x)=>s+x.incoming.company,0)};
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
    if(ambiguous>0)add('error','ambiguous',`${ambiguous} vínculo(s) ambíguo(s) foram detectados. Vincule cada nome a um único técnico antes de importar.`);
    for(const item of summary?.squads||[]){
      if(kind==='service'&&item.current?.attendance>0){
        if(item.attendanceDelta<=-.35)add('warning','attendance_drop',`Squad ${item.code}: atendimentos cairão ${Math.round(Math.abs(item.attendanceDelta)*100)}% em relação ao valor atual.`);
        if(item.technicianDelta<=-.30)add('warning','technician_drop',`Squad ${item.code}: quantidade de técnicos cairá ${Math.round(Math.abs(item.technicianDelta)*100)}%.`);
        if(item.incoming.evaluations>item.incoming.attendance*1.15)add('warning','evaluation_ratio',`Squad ${item.code}: avaliações estão acima de 115% dos atendimentos; confira o CSV.`);
      }
      if(kind==='quality'&&item.current?.rows>0&&item.rowDelta<=-.40)add('warning','quality_drop',`Squad ${item.code}: avaliações de Produto/Empresa cairão ${Math.round(Math.abs(item.rowDelta)*100)}%.`);
      if(kind==='quality-full'&&item.current?.rows>0&&item.rowDelta<=-.40)add('warning','quality_full_drop',`Squad ${item.code}: linhas da Qualidade Completa cairão ${Math.round(Math.abs(item.rowDelta)*100)}% em relação à base atual.`);
    }
    return {level,blocked,requiresConfirmation,issues};
  }
  function historySummary(record={}){
    return {
      id:String(record.id||record.batchKey||''),batchKey:String(record.batchKey||record.id||''),kind:['service','quality','quality-full'].includes(record.kind)?record.kind:'service',period:String(record.period||''),fileName:String(record.fileName||''),checksum:String(record.checksum||''),scope:Array.isArray(record.scope)?record.scope:[],rows:safe(record.rows),ignored:safe(record.ignored),unmatched:safe(record.unmatched),status:['success','failed','reverted'].includes(record.status)?record.status:'success',createdAt:record.createdAt||new Date().toISOString(),createdBy:record.createdBy||'',risk:record.risk||'ok',beforeSnapshot:record.beforeSnapshot||null,details:record.details||{}
    };
  }
  function canRollback(record){return Boolean(record&&record.status==='success'&&record.beforeSnapshot&&Object.keys(record.beforeSnapshot||{}).length>0)}
  return {safe,pctDelta,checksumText,parseCsvRows,normalizeCsvHeader,resolveFinancialImpactColumns,resolveQualityImportColumns,resolveQualityFullImportColumns,suggestQualityPreparation,prepareQualitySource,summarizeService,summarizeQuality,summarizeQualityFull,validatePreview,historySummary,canRollback};
});
