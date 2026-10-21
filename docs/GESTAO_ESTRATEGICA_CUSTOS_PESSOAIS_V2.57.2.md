# V2.57.2 — Competências, pessoas e custos pessoais

## Objetivo

Adicionar a primeira camada financeira real da Gestão Estratégica sem alterar o domínio operacional já estável. A versão cria competências financeiras próprias, cadastro de pessoas/FTE e custos pessoais mensais.

## Estrutura de dados

- `strategy_competences`: competência mensal estratégica, status e observações.
- `strategy_people`: pessoas que compõem o custo do Suporte, vinculadas ou não ao cadastro operacional.
- `strategy_employee_costs`: fotografia mensal de Squad, FTE, salário, encargos, benefícios, variável, horas extras e outros custos.

O `total_cost` é calculado no banco por:

`(salário + encargos + benefícios + variável + horas extras + outros) × FTE`.

## Segurança

O checkbox **Acesso à Gestão Estratégica** continua liberando somente visão da área e agregados. Ele não libera salários individuais nem edição.

Permissões detalhadas:

- `can_view_people_costs`: permite consultar pessoas e custos individuais.
- `can_edit_costs`: permite criar/alterar competências, pessoas e custos; a interface exige também `can_view_people_costs`.

Usuários apenas com `can_view_aggregates` recebem totais por meio da RPC `get_strategy_people_cost_summary`. O frontend não consulta `strategy_people` ou `strategy_employee_costs` para esse perfil.

## Habilitação inicial para o responsável pelo preenchimento

Na V2.57.2 as permissões financeiras detalhadas continuam administrativas no `strategy_access`. Para o usuário responsável pelo preenchimento, habilite explicitamente:

```sql
update public.strategy_access
set
  can_view_people_costs = true,
  can_edit_costs = true,
  updated_at = now()
where organization_id = '<ORGANIZATION_ID>'
  and user_id = '<USER_ID>'
  and can_view_strategy = true;
```

Isso não altera a regra do checkbox geral para os demais usuários.

## Fluxo de uso

1. Acesse **Gestão Estratégica > Premissas**.
2. Escolha ou informe a competência.
3. Crie a competência financeira.
4. Cadastre as pessoas que compõem o custo da operação.
5. Informe FTE, salário, encargos, benefícios e demais componentes.
6. Salve pessoas e custos.
7. Consulte os totais em **Resultado Executivo** ou **Custos & Eficiência**.

## Isolamento

Nenhuma tabela operacional foi alterada. O módulo estratégico continua sem escrever em:

- `squad_months`;
- `technician_monthly`;
- `daily_metrics`;
- tabelas de qualidade;
- tabelas de bonificação.

Squad e competência estratégicos continuam com estado próprio.

## O que ainda não entra

- custos operacionais;
- rateios;
- custo por atendimento;
- receita;
- capacidade/FTE projetado;
- fechamento definitivo e snapshot da competência.
