(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoftenStrategyManualEntries=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const TYPES=Object.freeze({direct_sale:'Venda direta',influenced:'Receita influenciada confirmada',protected:'Receita protegida confirmada',third_party_cost:'Custo de terceiros'});
function money(value){if(typeof value==='string')return Number(value.replace(/\./g,'').replace(',','.'));return Number(value);}
function validate(data){
 if(!data||!Object.prototype.hasOwnProperty.call(TYPES,data.type))throw new Error('Selecione um tipo valido.');
 if(!/^[A-E]$/.test(String(data.squadCode||'')))throw new Error('Selecione o Squad.');
 if(!/^20\d{2}-(0[1-9]|1[0-2])-01$/.test(String(data.competence||'')))throw new Error('Competencia invalida.');
 const day=String(data.occurredOn||'');if(!/^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/.test(day)||new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day||day.slice(0,7)!==data.competence.slice(0,7))throw new Error('Data fora da competencia ou invalida.');
 const amount=money(data.amount),mrr=money(data.mrr||0);
 if(!Number.isFinite(amount)||amount<=0||amount>999999999999.99||!Number.isFinite(mrr)||mrr<0||mrr>999999999999.99)throw new Error('Informe valores validos.');
 if(data.type!=='direct_sale'&&mrr!==0)throw new Error('Somente venda direta pode gerar MRR.');
 const description=String(data.description||'').trim(),reason=String(data.reason||'').trim(),reference=String(data.reference||'').trim();
 if(description.length<4||description.length>250)throw new Error('Descreva o lancamento com 4 a 250 caracteres.');
 if(reason.length<10||reason.length>500)throw new Error('Justificativa obrigatoria com 10 a 500 caracteres.');
 if(reference.length>180||(data.type==='influenced'||data.type==='protected')&&!reference)throw new Error('Informe uma referencia comprovavel.');
 if(data.type==='direct_sale'&&!data.personId)throw new Error('Selecione colaborador ativo.');
 return Object.freeze({type:data.type,competence:data.competence,occurredOn:day,squadCode:data.squadCode,personId:data.personId||null,amount:Math.round(amount*100)/100,mrr:Math.round(mrr*100)/100,description,reference,reason});
}
function latest(rows){const m=new Map();for(const x of rows||[]){const id=x.entry_group_id;if(!id)continue;const previous=m.get(id);if(!previous||Number(x.revision)>Number(previous.revision))m.set(id,x);}return [...m.values()].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));}
return Object.freeze({TYPES,validate,latest});
});
