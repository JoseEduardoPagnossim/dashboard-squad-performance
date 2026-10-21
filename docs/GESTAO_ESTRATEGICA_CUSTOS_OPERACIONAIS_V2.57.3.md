# V2.57.3 — Custos operacionais e rateios

## Objetivo

Adicionar à Gestão Estratégica os custos operacionais da competência sem misturá-los às tabelas de atendimento, qualidade, bonificação ou folha. Cada lançamento precisa ser integralmente distribuído entre os Squads antes de entrar nos consolidados estratégicos.

## Estruturas novas

- `strategy_operational_costs`: cadastro mensal do custo operacional.
- `strategy_cost_allocations`: fotografia do percentual de cada custo atribuído a cada Squad.

Categorias iniciais:

- Tecnologia
- Comunicação
- Infraestrutura
- Terceiros
- Treinamento
- Outros

## Métodos de rateio

### Direto

100% do custo é atribuído a um único Squad.

### FTE

Distribui proporcionalmente ao FTE registrado nos custos pessoais da mesma competência. Pessoas sem Squad não entram na base de distribuição.

### Atendimentos

Distribui proporcionalmente ao total de atendimentos de cada Squad na competência, usando o consolidado operacional somente como fonte de leitura.

### Manual

O usuário informa os percentuais por Squad. A soma deve totalizar 100%.

## Preservação histórica

Os rateios automáticos gravam `percentage`, `basis_value` e `basis_total`. Assim, se FTE ou atendimentos históricos forem corrigidos posteriormente, o custo já rateado não muda silenciosamente.

## Segurança

Usuários com `can_view_strategy + can_view_aggregates` recebem apenas totais por meio de `get_strategy_operational_cost_summary`. Descrição, subcategoria e distribuição detalhada dos lançamentos ficam disponíveis somente para `can_edit_costs`.

A gravação usa `save_strategy_operational_cost(...)`, que valida a competência, bloqueia competência fechada, exige 100% de rateio e persiste custo + alocações na mesma transação.

## Resultado Executivo

O total estratégico passa a ser:

`custo de pessoas + custo operacional`

Ainda não entram nesta versão custo por atendimento, spread de eficiência, capacidade ou receitas.

## Implantação

Execute, em ordem:

1. `MIGRACAO_V2.57.0.sql`
2. `MIGRACAO_V2.57.1.sql`
3. `MIGRACAO_V2.57.2.sql`
4. `MIGRACAO_V2.57.3.sql`

Não é necessário republicar Edge Functions.
