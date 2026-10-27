(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyScenarioInsights=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SC-INSIGHTS-1.0.0';
  const IDS=Object.freeze(['optimistic','conservative','custom']);
  const NAMES=Object.freeze({current:'Atual',optimistic:'Otimista',conservative:'Conservador',custom:'Personalizado'});
  const PRIORITY=Object.freeze({critical:0,attention:1,tradeoff:2,opportunity:3,information:4});
  const DIMENSIONS=Object.freeze({capacity:'Capacidade',economic:'Resultado econômico',tradeoff:'Compensações',integrity:'Integridade das premissas'});
  function finite(value){return typeof value==='number'&&Number.isFinite(value)?value:null;}
  function pct(value){return finite(value)===null?null:Math.round(value*10)/10;}
  function number(value){return finite(value)===null?null:Math.round(value*100)/100;}
  function record(id,kind,dimension,code,title,description,evidence,action){
    const facts=Object.freeze(evidence.map(item=>Object.freeze({label:item[0],value:number(item[1]),unit:item[2]||'number'})));
    return Object.freeze({id:id+':'+code,scenario:id,scenarioName:NAMES[id],kind,dimension,code,title,description,
      evidence:facts,action,official:false,persisted:false});
  }
  function analyze(compared,{scenario='all',kind='all'}={}){
    if(!compared||!compared.scenarios||!compared.scenarios.current||!compared.delta||!Array.isArray(compared.order))throw new Error('Comparativo válido obrigatório para os insights.');
    if(scenario!=='all'&&!IDS.includes(scenario))throw new Error('Filtro de cenário inválido.');
    if(kind!=='all'&&!Object.hasOwn(PRIORITY,kind))throw new Error('Filtro de diagnóstico inválido.');
    const current=compared.scenarios.current.metrics;
    const out=[];
    const push=(...args)=>out.push(record(...args));
    for(const id of IDS){
      const item=compared.scenarios[id];if(!item)continue;
      const m=item.metrics||{},d=compared.delta[id]||{},a=item.assumptions||{},status=item.status||{};
      // Each analytical dimension is independent. Do not use a missing metric as zero.
      if(status.capacity==='simulated'&&finite(m.overloadFte)!==null&&m.overloadFte>0.005){
        push(id,'critical','capacity','overload','Sobrecarga de capacidade projetada',
          'A demanda projetada excede o FTE disponível. É uma necessidade estimada, não uma previsão de SLA.',
          [['Utilização',m.utilizationPct,'pct'],['Sobrecarga',m.overloadFte,'fte'],['FTE necessário',m.requiredFte,'fte']],
          'Rever demanda, produtividade histórica ou dimensionamento de FTE antes de aprovar a alternativa.');
      }else if(status.capacity==='simulated'&&finite(m.idleFte)!==null&&finite(m.availableFte)!==null&&m.availableFte>0&&m.idleFte/m.availableFte>=0.2){
        push(id,'attention','capacity','idle','Capacidade ociosa relevante',
          'A projeção reserva pelo menos 20% do FTE disponível sem utilização pela demanda estimada. Não implica dispensas automaticamente.',
          [['Ociosidade',m.idleFte,'fte'],['Utilização',m.utilizationPct,'pct']],
          'Avaliar realocação, variações de demanda e atividades não refletidas nos atendimentos antes de mudar o quadro.');
      }
      if(status.capacity==='simulated'&&finite(current.overloadFte)!==null&&current.overloadFte>0.005&&finite(m.overloadFte)!==null&&m.overloadFte<current.overloadFte-0.005){
        push(id,'opportunity','capacity','relief','Redução da sobrecarga estimada',
          'A alternativa reduz o déficit de FTE em relação à base atual, sem comprovar melhora de qualidade ou custos.',
          [['Sobrecarga atual',current.overloadFte,'fte'],['Sobrecarga projetada',m.overloadFte,'fte']],
          'Comparar o alívio de capacidade com os efeitos financeiros e as premissas de produtividade.');
      }
      if(status.economic==='simulated'&&finite(m.directNet)!==null&&m.directNet< -0.01){
        push(id,'critical','economic','loss','Resultado líquido direto negativo',
          'Sob as premissas informadas, a receita direta projetada não cobre o custo total projetado.',
          [['Resultado líquido direto',m.directNet,'money'],['Custo total',m.totalCost,'money']],
          'Revisar a viabilidade financeira e separar o valor de receitas influenciadas/protegidas do caixa direto.');
      }else if(status.economic==='simulated'&&finite(d.directNet)!==null&&d.directNet< -0.01){
        push(id,'attention','economic','net-down','Redução do resultado líquido direto',
          'O retorno financeiro direto cai em relação ao cenário atual; o sinal não indica causa isolada.',
          [['Variação do resultado',d.directNet,'money'],['Resultado projetado',m.directNet,'money']],
          'Verificar quais hipóteses de custo e receita provocam a diferença antes de decidir.');
      }else if(status.economic==='simulated'&&finite(d.directNet)!==null&&d.directNet>0.01){
        push(id,'opportunity','economic','net-up','Melhora do resultado líquido direto',
          'O resultado projetado supera a base, condicionado às hipóteses de receita direta e de custo.',
          [['Melhora do resultado',d.directNet,'money'],['Resultado projetado',m.directNet,'money']],
          'Confirmar a viabilidade das hipóteses antes de incorporar a alternativa ao planejamento.');
      }
      if(status.economic==='simulated'&&finite(d.totalCost)!==null&&d.totalCost>0.01&&finite(d.attendance)!==null&&d.attendance<=0){
        push(id,'tradeoff','tradeoff','cost-demand','Custo maior com demanda estável ou menor',
          'O custo total cresce sem crescimento projetado no volume de atendimentos. Isso pode elevar o custo por atendimento.',
          [['Variação do custo',d.totalCost,'money'],['Variação de atendimentos',d.attendance,'integer']],
          'Revisar despesas adicionais e justificar a capacidade ou qualidade esperada antes de aprovar os custos.');
      }
      if(status.capacity==='simulated'&&status.economic==='simulated'&&finite(d.directNet)!==null&&d.directNet>0.01&&finite(m.overloadFte)!==null&&m.overloadFte>0.005){
        push(id,'tradeoff','tradeoff','profit-overload','Resultado melhora, mas a capacidade fica sobrecarregada',
          'Maior resultado direto projetado convive com déficit de FTE. A melhora financeira não elimina o risco operacional.',
          [['Melhora do resultado',d.directNet,'money'],['Sobrecarga projetada',m.overloadFte,'fte']],
          'Avaliar ajuste de FTE ou premissas de produtividade para sustentar o ganho econômico.');
      }
      if(status.capacity==='simulated'&&status.economic==='simulated'&&finite(d.directNet)!==null&&d.directNet< -0.01&&finite(d.overloadFte)!==null&&d.overloadFte< -0.005){
        push(id,'tradeoff','tradeoff','relief-cost','Capacidade melhora com redução de resultado',
          'A alternativa alivia a sobrecarga, mas reduz o resultado líquido direto. A decisão envolve custo e nível de serviço.',
          [['Variação do resultado',d.directNet,'money'],['Redução da sobrecarga',-d.overloadFte,'fte']],
          'Definir limite aceitável de custo para ganho de capacidade antes de decidir.');
      }
      if(status.economic==='simulated'&&finite(d.directRevenue)!==null&&d.directRevenue>0.01&&finite(d.directNet)!==null&&d.directNet< -0.01){
        push(id,'tradeoff','tradeoff','sales-net','Receita direta cresce, mas resultado cai',
          'O ganho de receita direta não compensa a variação dos custos segundo as premissas do cenário.',
          [['Variação da receita direta',d.directRevenue,'money'],['Variação do resultado',d.directNet,'money']],
          'Revisar custos incrementais e a margem prevista; não atribuir o efeito à contratação sem evidência.');
      }
      if(status.economic==='simulated'&&(finite(d.influencedRevenue)!==null&&Math.abs(d.influencedRevenue)>0.01||finite(d.protectedRevenue)!==null&&Math.abs(d.protectedRevenue)>0.01)){
        push(id,'information','economic','revenue-types','Receitas de impacto não compõem o ROI direto',
          'Receitas influenciada e protegida variam neste cenário, mas não foram adicionadas ao caixa direto ou ao ROI.',
          [['Variação influenciada',d.influencedRevenue,'money'],['Variação protegida',d.protectedRevenue,'money']],
          'Tratar esses valores como indicadores de influência e proteção, evitando dupla contagem.');
      }
      if((a.hires>0||a.exits>0||a.transfersIn>0||a.transfersOut>0||a.newHours!==a.currentHours)&&status.economic==='simulated'){
        push(id,'information','integrity','headcount-expense','Equipe e custos são premissas independentes',
          'Movimentações e jornada alteram o FTE, mas não atualizam salários, rescisões ou benefícios automaticamente.',
          [['Variação de FTE',d.availableFte,'fte'],['Variação de custo pessoal',d.peopleCost,'money']],
          'Conferir se os custos de contratação, desligamento e jornada estão representados nos ajustes financeiros.');
      }
      const missing=Object.entries(status).filter(([,value])=>value!=='simulated').map(([key])=>key);
      if(missing.length){
        push(id,'information','integrity','missing','Comparação parcial por falta de fontes',
          'Uma ou mais dimensões estão indisponíveis ('+missing.join(', ')+'). Nenhum resultado ausente foi estimado como zero.',
          [],'Atualizar fontes e conciliações antes de interpretar a alternativa como completa.');
      }
    }
    const sorted=out.sort((a,b)=>PRIORITY[a.kind]-PRIORITY[b.kind]||IDS.indexOf(a.scenario)-IDS.indexOf(b.scenario)||a.id.localeCompare(b.id));
    const counts=Object.fromEntries(Object.keys(PRIORITY).map(key=>[key,sorted.filter(r=>r.kind===key).length]));
    const filtered=sorted.filter(r=>(scenario==='all'||r.scenario===scenario)&&(kind==='all'||r.kind===kind));
    return Object.freeze({ruleVersion:RULE_VERSION,competence:compared.competence,squadCode:compared.squadCode,revision:compared.revision,
      official:false,persisted:false,total:sorted.length,counts:Object.freeze(counts),items:Object.freeze(filtered),
      note:'Sinais condicionais, não recomendações automáticas nem previsões. Validar premissas, fontes e contexto operacional antes de executar decisões.'});
  }
  return Object.freeze({RULE_VERSION,IDS,NAMES,PRIORITY,DIMENSIONS,analyze});
});
