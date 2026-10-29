# V2.63.6 — Motor de comissões e Bonificação

## Regras
- Calcula uma única vez por venda importada usando **commission_rule_at_import**, sem recalcular comissão já apurada ao alterar o catálogo. As duas origens permanecem separadas, inclusive MRR.
- Modalidades: `full` (100%), `percentage`, `net_after_third_party` (mínimo 0) e `fixed`. Regra não configurada ou custo faltante fica pendente **sem comissão presumida**.
- O valor fixo corresponde a **uma unidade/venda importada**, não multiplica `quantidade` automaticamente. Para múltiplas unidades com comissão individual, a regra precisará de ajuste explícito.
- Somente competências estratégicas abertas podem ser apuradas. Os registros não são atualizados numa nova execução; alteração retroativa exige fluxo de revisão auditável.
- Os cálculos ocorrem na RPC `calculate_strategy_sales_commissions_v2636`; consulta por `strategy_commissions_summary_v2636`.
- A sincronização com o campo `technician_finance_monthly.sales_commission` é **manual e conservadora**: apenas contas ativas `technician`, mês operacional aberto e valor sem conflito com comissão já lançada. Conflitos não são sobrescritos.
- Pré-atendimento (Squad C) **não cria competência de técnico operacional**, nem atendimento artificial. Seu resultado comercial fica em `strategy_sales_commissions` e no resumo mensal; a vinculação ao cálculo da bonificação oficial de Pré-atendimento ainda exige motor operacional independente e homologação específica.
- Importante: a sincronização técnica atualiza o campo de comissão, mas o **recalculo do total final de Bonificação** precisa ocorrer no próprio módulo para refletir a configuração de teto e regras existentes. Não injeta o valor comercial como custo pessoal estratégico diretamente, evitando dupla contagem até haver reconciliação do valor final oficial.
- Risco remanescente: `strategy_employee_costs.total_cost` aplica FTE sobre `variable_pay`; não realizar lançamentos automáticos de remuneração até reconciliação da fórmula e da origem oficial.

## Instalação
1. Backup de V2.63.5 e Supabase.
2. Aplicar `supabase/migrations/MIGRACAO_V2.63.6.sql` no SQL Editor, primeiro em homologação.
3. Publicar os arquivos do ZIP incremental sobre V2.63.5 e executar `npm run check`.
4. Na Automação, selecionar competência, clicar em Apurar comissões e Consultar resultado.
5. Sincronizar com Bonificação somente após conferência de conflitos; recalcular bonificação no módulo original.
6. Homologar RLS, contas Pré-atendimento e fechamento real antes de produção.

## Controle de escopo
Nenhum salário, beneficio, encargo ou custo estratégico é sobrescrito. Nenhuma comissão pendente é paga automaticamente. A visão própria de Bonificação de Pré-atendimento e a consolidação de custo oficial por pessoa seguem pendentes de uma integração específica — não alegar que foram concluídas.
