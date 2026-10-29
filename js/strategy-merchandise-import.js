(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyMerchandiseImport=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const SOURCE='merchandise_sales_csv';
  const recurring=typeof require==='function'?require('./strategy-recurring-import'):globalThis.SoftenStrategyRecurringImport;
  function clean(v){return String(v??'').normalize('NFKC').trim();}
  function normalize(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
  function quantity(value){const t=clean(value);if(!t)return '';if(!/^\d{1,8}([.,]\d{1,4})?$/.test(t))return null;const n=Number(t.replace(',','.'));if(!Number.isFinite(n)||n<=0||n>99999999)return null;return String(n);}
  function build({parsed,mapping,people=[],profiles=[],aliases=[],products=[],organizationId}={}){
    const csv=typeof require==='function'?require('./strategy-csv-importer'):globalThis.SoftenStrategyCsvImporter;
    const seller=typeof require==='function'?require('./strategy-seller-reconciliation'):globalThis.SoftenStrategySellerReconciliation;
    const catalog=typeof require==='function'?require('./strategy-product-catalog'):globalThis.SoftenStrategyProductCatalog;
    if(!organizationId)throw new Error('Organização não definida.');
    const valid=csv.validateMapping(SOURCE,parsed.headers,mapping);
    const matched=seller.reconcile({sourceKey:SOURCE,parsed,mapping:valid,people,profiles,aliases});
    const peopleByName=new Map(matched.groups.map(g=>[JSON.stringify([SOURCE,g.squad,g.normalized]),g]));
    const productByName=new Map(products.filter(p=>p.source_key===SOURCE&&p.generates_mrr===false&&p.active===true)
      .map(p=>[p.normalized_name||catalog.normalize(p.name),p]));
    const idx=k=>valid[k]?parsed.headers.indexOf(valid[k]):-1;
    const positions=Object.fromEntries(['saleId','date','seller','squad','product','amount','quantity'].map(k=>[k,idx(k)]));
    const get=(row,k)=>positions[k]<0?'':clean(row[positions[k]]);
    const summary={total:parsed.rows.length,ready:0,ignoredNoGroup:0,pendingSeller:0,pendingProduct:0,pendingDate:0,pendingAmount:0,pendingId:0,pendingQuantity:0,repeatedRows:0,readyAmountCents:0};
    const records=[],occurrences=new Map();
    for(let i=0;i<parsed.rows.length;i++){
      const row=parsed.rows[i],squad=csv.normalizeSquad(get(row,'squad'));
      if(!squad){summary.ignoredNoGroup++;continue;}
      const saleId=get(row,'saleId'),name=get(row,'seller'),productName=get(row,'product'),product=productByName.get(catalog.normalize(productName));
      const match=peopleByName.get(JSON.stringify([SOURCE,squad,seller.normalizeName(name)]));
      const day=recurring.date(get(row,'date')),amountCents=recurring.cents(get(row,'amount'));
      const qty=quantity(get(row,'quantity'));
      let status='ready';
      if(!match||match.status!=='matched')status='pendingSeller';
      else if(!product)status='pendingProduct';
      else if(!day)status='pendingDate';
      else if(amountCents===null)status='pendingAmount';
      else if(!saleId||saleId.length>100)status='pendingId';
      else if(qty===null)status='pendingQuantity';
      const fingerprint=JSON.stringify([normalize(saleId),day||'',normalize(name),squad,catalog.normalize(productName),amountCents,qty]);
      const occurrence=status==='ready'?(occurrences.get(fingerprint)||0)+1:0;
      if(status==='ready')occurrences.set(fingerprint,occurrence);
      records.push({line:i+2,status,saleId,day,seller:name,squad,product:productName,quantity:qty,amountCents,
        personId:match?.personId||null,productId:product?.id||null,occurrence,fingerprint});
    }
    for(const r of records){summary[r.status]++;if(r.status==='ready'){summary.readyAmountCents+=r.amountCents;if(occurrences.get(r.fingerprint)>1)summary.repeatedRows++;}}
    const ready=records.filter(r=>r.status==='ready').map(r=>Object.freeze({saleId:r.saleId,date:r.day,seller:r.seller,squad:r.squad,
      product:r.product,productId:r.productId,personId:r.personId,amountCents:r.amountCents,quantity:r.quantity,occurrence:r.occurrence}));
    return Object.freeze({sourceKey:SOURCE,summary:Object.freeze(summary),records:Object.freeze(records),ready:Object.freeze(ready),
      note:'Cada linha é uma venda avulsa. ID repetido não é usado isoladamente para deduplicar. Sem MRR/ARR nem comissão nesta versão.'});
  }
  function chunks(prepared,size=100){if(!prepared||!Array.isArray(prepared.ready)||size<1||size>100)throw new Error('Lote inválido.');const out=[];for(let i=0;i<prepared.ready.length;i+=size)out.push(prepared.ready.slice(i,i+size));return out;}
  return Object.freeze({SOURCE,quantity,build,chunks});
});
