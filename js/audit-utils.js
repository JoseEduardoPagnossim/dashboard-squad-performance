(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenAuditUtils=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SENSITIVE_KEY=/password|passwd|senha|token|secret|authorization|service[_-]?role|api[_-]?key|apikey/i;

  function normalizeConfirmationText(value){
    return String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleUpperCase('pt-BR');
  }

  function confirmationMatches(value,expected){
    const target=normalizeConfirmationText(expected);
    return !!target&&normalizeConfirmationText(value)===target;
  }

  function sanitizeAuditValue(value,depth=0){
    if(depth>6)return '[limite de profundidade]';
    if(value==null||typeof value==='string'||typeof value==='number'||typeof value==='boolean')return value;
    if(value instanceof Date)return value.toISOString();
    if(Array.isArray(value))return value.slice(0,100).map(v=>sanitizeAuditValue(v,depth+1));
    if(typeof value==='object'){
      const out={};
      for(const [key,item] of Object.entries(value)){
        if(SENSITIVE_KEY.test(key)){out[key]='[removido]';continue;}
        out[key]=sanitizeAuditValue(item,depth+1);
      }
      return out;
    }
    return String(value);
  }

  function actionCategory(action=''){
    const prefix=String(action).split('.')[0];
    return ['user','month','finance','goals','costs','quality','feedback','theme'].includes(prefix)?prefix:'other';
  }

  function actionLabel(action=''){
    const labels={
      'user.create':'Usuário criado','user.update':'Usuário alterado','user.activate':'Usuário reativado','user.deactivate':'Usuário inativado','user.delete':'Usuário excluído',
      'month.import_service':'Importação operacional','month.import_quality':'Importação de qualidade','month.close':'Competência fechada','month.reopen':'Competência reaberta','month.delete':'Competência excluída',
      'finance.config_update':'Regras financeiras alteradas','finance.technicians_update':'Valores financeiros alterados','finance.rules_copy':'Regras financeiras copiadas','finance.admin_commission':'Comissão do Admin Geral alterada',
      'goals.team_update':'Metas do Squad alteradas','goals.monthly_metrics_update':'Metas e métricas individuais alteradas',
      'costs.support_update':'Custos do Suporte alterados',
      'quality.financial_import':'CSV de impacto financeiro importado','quality.financial_params_update':'Parâmetros de impacto financeiro alterados'
    };
    return labels[action]||String(action||'Ação administrativa');
  }

  return {normalizeConfirmationText,confirmationMatches,sanitizeAuditValue,actionCategory,actionLabel};
});
