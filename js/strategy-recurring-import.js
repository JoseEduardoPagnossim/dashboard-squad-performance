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
  function build({parsed,mapping,people=[],profiles=[],aliases=[],products=[],organizationId}={}){
    const csv=typeof require==='function'?require('./strategy-csv-importer'):globalThis.SoftenStrategyCsvImporter;
    const seller=typeof require==='function'?require('./strategy-seller-reconciliation'):globalThis.SoftenStrategySellerReconciliation;
    const catalog=typeof require==='function'?require('./strategy-product-catalog'):globalThis.SoftenStrategyProductCatalog;
    if(!organizationId)throw new Error('Organização não definida.');
    const valid=csv.validateMapping(SOURCE,parsed.headers,mapping);
    const sellerReview=seller.reconcile({sourceKey:SOURCE,parsed,mapping:valid,people,profiles,aliases});
    const bySeller=new Map(sellerReview.groups.map(g=>[JSON.stringify([SOURCE,g.squad,g.normalized]),g]));
    const byProduct=new Map(products.filter(p=>p.source_key===SOURCE&&p.generates_mrr===true&&p.active===true).map(p=>[p.normalized_name||catalog.normalize(p.name),p]));
    const idx=k=>valid[k]?parsed.headers.indexOf(valid[k]):-1;
    const positions=Object.fromEntries(['date','seller','squad','product','amount','customer','taxId','contractDate'].map(k=>[k,idx(k)]));
    const get=(row,k)=>positions[k]<0?'':clean(row[positions[k]]);
    let summary={total:parsed.rows.length,ready:0,ignoredNoGroup:0,pendingSeller:0,pendingProduct:0,pendingDate:0,pendingAmount:0,repeatedRows:0,readyMrrCents:0};
    const records=[],occurrences=new Map();
    for(let index=0;index<parsed.rows.length;index++){
      const row=parsed.rows[index],group=csv.normalizeSquad(get(row,'squad'));
      if(!group){summary.ignoredNoGroup++;continue;}
      const sellerName=get(row,'seller'),sKey=JSON.stringify([SOURCE,group,seller.normalizeName(sellerName)]),resolved=bySeller.get(sKey);
      const productName=get(row,'product'),product=byProduct.get(catalog.normalize(productName));
      const day=date(get(row,'date')),amountCents=cents(get(row,'amount'));
      const customer=get(row,'customer'),taxId=get(row,'taxId'),contractDate=get(row,'contractDate');
      let status='ready';
      if(!resolved||resolved.status!=='matched')status='pendingSeller';
      else if(!product)status='pendingProduct';
      else if(!day)status='pendingDate';
      else if(amountCents===null)status='pendingAmount';
      const fingerprint=JSON.stringify([day||'',normalize(sellerName),group,catalog.normalize(productName),amountCents,normalize(taxId),normalize(customer),date(contractDate)||'']);
      const occurrence=status==='ready'?(occurrences.get(fingerprint)||0)+1:0;
      const entry={line:index+2,status,occurrence,day,amountCents,personId:resolved?.personId||null,userId:resolved?.userId||null,productId:product?.id||null,
        seller:sellerName,squad:group,product:productName,customer,taxId,contractDate:date(contractDate)||'',fingerprint};
      records.push(entry);
      if(status==='ready')occurrences.set(fingerprint,occurrence);
    }
    // Cada linha representa uma venda, inclusive linhas idênticas. O ordinal por identidade
    // preserva todas as ocorrências na reimportação integral do arquivo.
    for(const entry of records){if(entry.status==='ready'&&occurrences.get(entry.fingerprint)>1)summary.repeatedRows++;summary[entry.status]++;if(entry.status==='ready')summary.readyMrrCents+=entry.amountCents;}
    const ready=records.filter(r=>r.status==='ready').map(r=>Object.freeze({date:r.day,seller:r.seller,squad:r.squad,product:r.product,productId:r.productId,personId:r.personId,amountCents:r.amountCents,customer:r.customer.slice(0,160),taxId:r.taxId.slice(0,30),contractDate:r.contractDate,occurrence:r.occurrence}));
    return Object.freeze({sourceKey:SOURCE,summary:Object.freeze(summary),records:Object.freeze(records),ready:Object.freeze(ready),note:'Cada linha apta é uma venda; ocorrências idênticas recebem ordinais. Reimportações integrais não duplicam receitas.'});
  }
  function chunks(prepared,size=100){if(!prepared||!Array.isArray(prepared.ready)||size<1||size>100)throw new Error('Lote inválido.');const result=[];for(let i=0;i<prepared.ready.length;i+=size)result.push(prepared.ready.slice(i,i+size));return result;}
  return Object.freeze({SOURCE,date,cents,normalize,build,chunks});
});
