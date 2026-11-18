(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyRecurringImport=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const SOURCE='contracted_modules_csv';
  function clean(value){return String(value??'').normalize('NFKC').trim();}
  function normalize(value){return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
  function date(value){
    const s=clean(value);let y,m,d;
    let match=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
    if(match){[,y,m,d]=match;}else{match=s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s.*)?$/);if(!match)return null;[,d,m,y]=match;}
    const year=Number(y),month=Number(m),day=Number(d);if(year<2000||year>2099||month<1||month>12||day<1||day>31)return null;
    const utc=new Date(Date.UTC(year,month-1,day));if(utc.getUTCFullYear()!==year||utc.getUTCMonth()!==month-1||utc.getUTCDate()!==day)return null;
    return `${y}-${m}-${d}`;
  }
  function cents(value){
    const text=clean(value).replace(/^R\$\s*/i,'').replace(/\s/g,'');
    if(!text)return null;
    let n;
    if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text))n=Number(text.replace(/\./g,'').replace(',','.'));
    else if(/^\d+(,\d{1,2})$/.test(text))n=Number(text.replace(',','.'));
    else if(/^\d+(\.\d{1,2})?$/.test(text))n=Number(text);
    else return null;
    if(!Number.isFinite(n)||n<=0||n>99999999.99)return null;
    return Math.round(n*100);
  }
  function build({parsed,mapping,people=[],profiles=[],aliases=[],leaderCommissions=[],products=[],organizationId}={}){
    const csv=typeof require==='function'?require('./strategy-csv-importer'):globalThis.SoftenStrategyCsvImporter;
    const seller=typeof require==='function'?require('./strategy-seller-reconciliation'):globalThis.SoftenStrategySellerReconciliation;
    const catalog=typeof require==='function'?require('./strategy-product-catalog'):globalThis.SoftenStrategyProductCatalog;
    if(!organizationId)throw new Error('Organização não definida.');
    const valid=csv.validateMapping(SOURCE,parsed.headers,mapping);
    const sellerReview=seller.reconcile({sourceKey:SOURCE,parsed,mapping:valid,people,profiles,aliases,leaderCommissions});
    const bySeller=new Map(sellerReview.groups.map(g=>[JSON.stringify([SOURCE,g.squad,g.normalized]),g]));
    const byProduct=new Map(products.filter(p=>p.source_key===SOURCE&&p.generates_mrr===true&&p.active===true).map(p=>[p.normalized_name||catalog.normalize(p.name),p]));
    const idx=k=>valid[k]?parsed.headers.indexOf(valid[k]):-1;
    const positions=Object.fromEntries(['date','seller','squad','product','amount','activeMonthly','customer','taxId','contractDate'].map(k=>[k,idx(k)]));
    const get=(row,k)=>positions[k]<0?'':clean(row[positions[k]]);
    let summary={total:parsed.rows.length,ready:0,ignoredNoGroup:0,pendingSeller:0,pendingProduct:0,pendingDate:0,pendingAmount:0,repeatedRows:0,readyMrrCents:0};
    const records=[],occurrences=new Map();
    for(let index=0;index<parsed.rows.length;index++){
      const row=parsed.rows[index],group=csv.normalizeSquad(get(row,'squad'));
      if(!group){summary.ignoredNoGroup++;continue;}
      const sellerName=get(row,'seller'),sKey=JSON.stringify([SOURCE,group,seller.normalizeName(sellerName)]),resolved=bySeller.get(sKey);
      const productName=get(row,'product'),product=byProduct.get(catalog.normalize(productName));
      const day=date(get(row,'date')),amountCents=cents(get(row,'amount')),activeMonthlyCents=amountCents;
      const customer=get(row,'customer'),taxId=get(row,'taxId'),contractDate=get(row,'contractDate');
      let status='ready';
      if(!resolved||resolved.status!=='matched'||(resolved.role==='super_admin'&&!resolved.periods.includes((day||'').slice(0,7))))status='pendingSeller';
      else if(!product)status='pendingProduct';
      else if(!day)status='pendingDate';
      else if(amountCents===null)status='pendingAmount';
      const fingerprint=JSON.stringify([day||'',normalize(sellerName),group,catalog.normalize(productName),amountCents,normalize(taxId),normalize(customer),date(contractDate)||'']);
      const occurrence=status==='ready'?(occurrences.get(fingerprint)||0)+1:0;
      const entry={line:parsed.sourceLineNumbers?.[index]||index+2,status,occurrence,day,amountCents,activeMonthlyCents,personId:resolved?.personId||null,userId:resolved?.userId||null,productId:product?.id||null,
        seller:sellerName,squad:group,product:productName,customer,taxId,contractDate:date(contractDate)||'',contractTimestamp:contractDate,fingerprint};
      records.push(entry);
      if(status==='ready')occurrences.set(fingerprint,occurrence);
    }
    // Cada linha representa uma venda, inclusive linhas idênticas. O ordinal por identidade
    // preserva todas as ocorrências na reimportação integral do arquivo.
    for(const entry of records){if(entry.status==='ready'&&occurrences.get(entry.fingerprint)>1)summary.repeatedRows++;summary[entry.status]++;if(entry.status==='ready')summary.readyMrrCents+=entry.activeMonthlyCents;}
    const ready=records.filter(r=>r.status==='ready').map(r=>Object.freeze({line:r.line,date:r.day,seller:r.seller,squad:r.squad,product:r.product,productId:r.productId,personId:r.personId,amountCents:r.amountCents,activeMonthlyCents:r.activeMonthlyCents,customer:r.customer.slice(0,160),taxId:r.taxId.slice(0,30),contractDate:r.contractDate,occurrence:r.occurrence}));
    return Object.freeze({sourceKey:SOURCE,summary:Object.freeze(summary),records:Object.freeze(records),ready:Object.freeze(ready),note:'R30: somente Vl Anterior alimenta vendas, MRR e comissões. Negociações especiais são revisadas antes da gravação.'});
  }
  // R30: detecção local de candidatos, sem persistir prefixo do CNPJ ou horário bruto.
  // Não é uma chave única; toda sugestão exige classificação expressa do administrador.
  function timestampMinute(value){
    const s=clean(value);let match=s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?$/);
    if(!match){const br=s.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2})(?:[.,]\d{1,6})?)?$/);if(!br)return null;match=[br[0],br[3],br[2],br[1],br[4],br[5],br[6]||'00'];}
    const [_,y,m,d,h,minute,second='00']=match;
    if(!date(`${y}-${m}-${d}`)||Number(h)>23||Number(minute)>59||Number(second)>59)return null;
    return Date.UTC(+y,+m-1,+d,+h,+minute,+second);
  }
  function detectSpecialDeals(prepared){
    if(!prepared?.records)return [];
    const candidates=new Map();
    for(const r of prepared.records){
      if(r.status!=='ready')continue;
      const digits=String(r.taxId||'').replace(/\D/g,'');
      const moment=timestampMinute(r.contractTimestamp);
      if(digits.length<7||moment===null)continue;
      const key=JSON.stringify([digits.slice(0,7),normalize(r.seller),r.squad]);
      if(!candidates.has(key))candidates.set(key,[]);
      candidates.get(key).push({line:r.line,moment,amountCents:r.amountCents,product:r.product,seller:r.seller,squad:r.squad,customerPrefix:digits.slice(0,7)});
    }
    const groups=[];let seq=0;
    for(const items of candidates.values()){
      items.sort((a,b)=>a.moment-b.moment||a.line-b.line);
      let group=[];
      const flush=()=>{if(group.length>1){groups.push({id:`R30-${String(++seq).padStart(5,'0')}`,lines:group.map(x=>x.line),items:group.map(({line,product,amountCents})=>({line,product,amountCents})),seller:group[0].seller,squad:group[0].squad,customerPrefix:group[0].customerPrefix,totalCents:group.reduce((sum,x)=>sum+x.amountCents,0)});}group=[];};
      for(const item of items){if(group.length&&item.moment-group[0].moment>60000)flush();group.push(item);}
      flush();
    }
    return groups.sort((a,b)=>a.lines[0]-b.lines[0]);
  }
  function applySpecialDecisions(prepared,decisions){
    const groups=detectSpecialDeals(prepared);
    const mapped=new Map();
    for(const group of groups){
      const decision=decisions[group.id];
      if(!decision||!['independent','special'].includes(decision.mode))throw new Error(`Revise a negociação ${group.id} (${group.seller}).`);
      if(decision.mode==='independent')continue;
      const mrrCents=decision.mrrCents,commissionCents=decision.commissionCents;
      if(!Number.isSafeInteger(mrrCents)||mrrCents<0||mrrCents>9999999999||!Number.isSafeInteger(commissionCents)||commissionCents<0||commissionCents>9999999999)throw new Error(`Informe MRR e comissão válidos para ${group.id}.`);
      group.lines.forEach((line,i)=>mapped.set(line,{specialGroupId:group.id,specialRole:i===0?'anchor':'member',specialMrrCents:i===0?mrrCents:0,specialCommissionCents:i===0?commissionCents:0,specialSumCents:group.totalCents,specialLineCount:group.lines.length}));
    }
    return {...prepared,ready:prepared.ready.map(row=>({...row,...(mapped.get(row.line)||{})}))};
  }
  function chunks(prepared,size=100){
    if(!prepared||!Array.isArray(prepared.ready)||size<1||size>100)throw new Error('Lote inválido.');
    const bundles=[],seen=new Set(),byGroup=new Map();
    for(const row of prepared.ready){if(row.specialGroupId){if(!byGroup.has(row.specialGroupId))byGroup.set(row.specialGroupId,[]);byGroup.get(row.specialGroupId).push(row);}}
    for(const row of prepared.ready){
      if(!row.specialGroupId){bundles.push([row]);continue;}
      if(seen.has(row.specialGroupId))continue;
      seen.add(row.specialGroupId);bundles.push(byGroup.get(row.specialGroupId));
    }
    const result=[];let chunk=[];
    for(const bundle of bundles){
      if(bundle.length>size)throw new Error('Negociação R30 maior que o limite de 100 módulos; revise o grupo.');
      if(chunk.length+bundle.length>size){result.push(chunk);chunk=[];}
      chunk.push(...bundle);
    }
    if(chunk.length)result.push(chunk);
    return result;
  }
  return Object.freeze({SOURCE,date,cents,normalize,build,chunks,detectSpecialDeals,applySpecialDecisions,timestampMinute});
});
