(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyProductCatalog=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const ORIGINS=Object.freeze({contracted_modules_csv:true,merchandise_sales_csv:false});
  const TYPES=Object.freeze({unconfigured:'Pendente',full:'100% da venda',percentage:'Percentual da venda',net_after_third_party:'Venda menos custo de terceiros',fixed:'Valor fixo'});
  function normalize(value){return String(value??'').normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');}
  function assertOrigin(sourceKey){if(!Object.prototype.hasOwnProperty.call(ORIGINS,sourceKey))throw new Error('Origem de produtos inválida.');return sourceKey;}
  function name(value){const result=String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');if(result.length<2||result.length>160||!normalize(result))throw new Error('Nome do produto deve ter de 2 a 160 caracteres.');return result;}
  function discover(sourceKey,identified){assertOrigin(sourceKey);if(!identified||!Array.isArray(identified.products))throw new Error('Identificação de produtos inválida.');const seen=new Map();for(const product of identified.products){const text=name(product.name),key=normalize(text);if(!seen.has(key))seen.set(key,text);}return Object.freeze(Array.from(seen.values()).sort((a,b)=>a.localeCompare(b,'pt-BR')));}
  function registerPayload(sourceKey,products){assertOrigin(sourceKey);if(!Array.isArray(products)||!products.length||products.length>200)throw new Error('Selecione de 1 a 200 produtos por lote.');const seen=new Set();return Object.freeze({p_source_key:sourceKey,p_products:products.map(input=>{const text=name(input),key=normalize(text);if(seen.has(key))throw new Error('Produto duplicado no lote.');seen.add(key);return text;})});}
  function numeric(value,field){if(value===''||value===null||value===undefined)throw new Error(`${field} é obrigatório.`);const n=Number(String(value).replace(',','.'));if(!Number.isFinite(n)||n<0||Math.abs(Math.round(n*100)-n*100)>1e-7||n>99999999.99)throw new Error(`${field} deve ser não negativo e conter até duas casas decimais.`);return n;}
  function validateRule(type,amount){
    if(!Object.prototype.hasOwnProperty.call(TYPES,type))throw new Error('Tipo de comissão inválido.');
    if(type==='unconfigured'||type==='full'){if(amount!==null&&amount!==''&&amount!==undefined)throw new Error('Essa modalidade não aceita valor adicional.');return Object.freeze({type,percentage:null,thirdPartyCost:null,fixedAmount:null});}
    const value=numeric(amount,type==='percentage'?'Percentual':type==='fixed'?'Comissão fixa':'Custo de terceiros');
    if(type==='percentage'&&value>100)throw new Error('Percentual deve ficar entre 0% e 100%.');
    return Object.freeze({type,percentage:type==='percentage'?value:null,thirdPartyCost:type==='net_after_third_party'?value:null,fixedAmount:type==='fixed'?value:null});
  }
  function rulePayload(productId,type,amount){if(typeof productId!=='string'||!productId.trim())throw new Error('Selecione o produto.');const rule=validateRule(type,amount);return Object.freeze({p_product_id:productId,p_commission_type:rule.type,p_percentage:rule.percentage,p_third_party_cost:rule.thirdPartyCost,p_fixed_amount:rule.fixedAmount});}
  function calculate(rule,saleValue){const sale=numeric(saleValue,'Valor vendido'),type=rule?.type||rule?.commission_type;
    const amount=type==='percentage'?(rule.percentage??rule.commission_percentage):type==='fixed'?(rule.fixedAmount??rule.fixed_amount):(rule.thirdPartyCost??rule.third_party_cost);
    if(type==='unconfigured'||!type)return Object.freeze({status:'pending',amount:null});
    const checked=validateRule(type,type==='full'?null:amount);
    const commission=type==='full'?sale:type==='percentage'?sale*checked.percentage/100:type==='fixed'?checked.fixedAmount:sale-checked.thirdPartyCost;
    if(commission<0)return Object.freeze({status:'pending_cost_above_sale',amount:null});
    return Object.freeze({status:'calculated',amount:Math.round((commission+Number.EPSILON)*100)/100});
  }
  return Object.freeze({ORIGINS,TYPES,normalize,assertOrigin,name,discover,registerPayload,validateRule,rulePayload,calculate});
});
