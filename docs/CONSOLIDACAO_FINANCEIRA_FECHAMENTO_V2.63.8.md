# V2.63.8 — Conciliação financeira, Bonificação e fechamento estratégico

## Objetivo e limites

Preservar o modelo financeiro existente na Gestão Estratégica e reconhecer **uma única vez** a Bonificação oficial nos custos pessoais. Esta etapa não reimporta CSV, não recalcula comissões de vendas e não regrava receitas. Usa as apurações da V2.63.6 e as estruturas estratégicas anteriores.

### Fonte do valor oficial — técnicos

A origem é `technician_finance_monthly.calculated.final`, vinculada pelo `user_id` e pelo Squad operacional correto **somente quando** `squad_months.is_closed=true`. O valor deve coincidir com `financeData.final` do técnico no `squad_months.closed_snapshot`. Mês operacional aberto, ausência de cálculo, homônimos ou divergência de snapshot bloqueiam o reconhecimento, em vez de tomar o valor de comissão de vendas isoladamente (o qual já integra o bônus final). A fonte oficial de cada técnico inclui base, férias, prêmios, bônus, descontos e comissão de vendas, conforme as regras operacionais.

### Fonte do valor oficial — Pré-atendimento / Squad C

**Não criar atendimento, técnico ou mês operacional fictício para o Pré-atendimento.** A ação **Aprovar comissão** congela a soma de `strategy_sales_commissions` já calculadas para a pessoa ativa e vinculada a uma conta `pre_attendance`. Uma comissão com regra pendente bloqueia a aprovação. Sem vendas, pode haver aprovação explícita de R$ 0,00. Mudanças posteriores exigem **nova aprovação revisionada**, preservando o documento anterior. A aprovação é uma memória comercial própria, não um fechamento da Bonificação operacional.

### Sincronização com custos pessoais

A ação **Sincronizar custos** atualiza **somente** `strategy_employee_costs.variable_pay` e o registro de reconciliação. Salário, encargos, benefícios, horas extras e demais parcelas não são alterados. A primeira sincronização só ocorre com `variable_pay=0`, e as seguintes apenas se a parcela atual corresponder ao valor previamente sincronizado. Divergência manual gera status `manual_conflict` e precisa de correção consciente. Nenhuma despesa é adicionada a outro campo, evitando contagem dupla. Todos os movimentos geram evento em `strategy_bonus_sync_audit_v2638`.

Para preservar igualdade de centavos entre a bonificação nominal e a coluna `total_cost` (que aplica `fte` sobre cada parcela), a sincronização exige `fte=1`. Pessoas com FTE parcial são exibidas como `fte_not_one` e exigem conferência da distribuição/custeio, sem arredondamento inventado. Uma pessoa sem linha de custo estratégico é exibida como `cost_row_missing`.

### Cancelamentos e fechamento

A consulta de cancelamentos lê `squad_months.finance_month_data` e, ao fechar a operação, prefere o valor congelado em `squad_months.closed_snapshot.financeMonthData`. O painel separa **provisório** de **fechado**. Havendo mês operacional, mês aberto ou dados de clientes/cancelamentos ausentes bloqueiam o fechamento estratégico. O Squad C, por não ter mês operacional de Suporte, não recebe cancelamentos presumidos; quando não existe fonte, a tela mostra ausência de dados, nunca zero fictício.

O botão **Fechar competência** continua usando a rotina de fechamento estratégico original (custos, receitas e snapshots). A migration envolve essa rotina com pré-validação obrigatória da Bonificação, inclusive em chamada direta à API. Após o fechamento original, grava `strategy_financial_closure_v2638` com a fotografia adicional de bônus, cancelamentos, revisão e fingerprint. **Não modifica snapshots históricos existentes.** Reaberturas preservam as revisões anteriores; novo fechamento gera outra revisão.

### Segurança e consistência

- Isolamento por `organization_id`, pessoa e Squad, com RLS nas quatro novas tabelas; somente `SELECT` é concedido diretamente.
- Aprovar/Sincronizar exigem `people_costs` e `edit_costs`; fechamento exige `close_competence` e `people_costs`.
- Migração renomeia uma única vez a função original `close_strategy_competence(date)` para `close_strategy_competence_core_v2638(date)` e instala o wrapper. O core fica sem EXECUTE para `authenticated`, impedindo contornar o pré-fechamento. Reexecutar a migration não acumula wrappers.
- Competência estratégica fechada bloqueia aprovações e sincronizações; só a reabertura autorizada permite nova revisão. Apuração manual de comissão não ocorre aqui.

## Implantação e homologação

1. Faça **backup** de arquivos e banco. Confira que migrations V2.63.0–V2.63.7 foram executadas.
2. Em **homologação**, execute `MIGRACAO_V2.63.8.sql`, confirme políticas, grants e assinatura do wrapper. Teste rollback/transação antes de produção.
3. Aplique o ZIP incremental V2.63.8 **sobre a V2.63.7** (ou aplique o patch), rode `npm run check` e publique.
4. Em **Gestão Estratégica → Automação → Conciliação da Bonificação e fechamento estratégico**, selecione a competência, **Conferir pendências**, aprove valores de Pré-atendimento se necessário e **Sincronizar custos**.
5. Confirme valores de `strategy_employee_costs.variable_pay`, totais por Squad e no Resultado Estratégico, reconcilie cancelamentos e faça um fechamento de teste. Reabra e feche novamente para verificar snapshots por revisão.
6. Teste conta sem permissão, outro tenant, FTE parcial, variável manual divergente, mês operacional aberto, snapshot técnico inconsistente, comissão pendente, competência fechada e ausência de custos pessoais. O bloqueio deve ser explícito, sem alteração silenciosa.

**Atenção:** `npm run check` verifica consistência de código, fluxo e contratos SQL estaticamente. Não simula um banco Supabase real. Execute esta migration primeiro em homologação e confira todos os fluxos financeiros/RLS antes de publicar em produção.
