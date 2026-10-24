# V2.60.1 — Receita Direta

## Objetivo
Medir receita comprovadamente atribuída à atuação direta do time sem misturar receita influenciada ou protegida.

## Regra financeira
**Receita Direta Total = soma de `gross_amount` dos eventos `direct` com status `confirmed`.**

`monthly_recurring_amount` (Novo MRR) e `annual_recurring_amount` (Novo ARR) são indicadores paralelos de recorrência. Eles **não são adicionados novamente** à Receita Direta Total.

## Categorias nativas
- `upsell` — Up-sell
- `plan_upgrade` — Upgrade de plano
- `module_addon` — Módulo adicional
- `service` — Serviço avulso
- `training` — Treinamento adicional
- `implementation` — Implantação / setup
- `direct_sale` — Venda direta
- `other` — Outros

Up-sell fica, portanto, explicitamente dentro de Receita Direta quando o próprio time realizou o fechamento.

## Direta x influenciada
- O time identificou, negociou e fechou: **Receita Direta**.
- O time identificou/qualificou e outro setor fechou: **Receita Influenciada** (V2.60.2).

## Integridade
- somente eventos confirmados entram nos valores;
- evento confirmado exige categoria, valor maior que zero e BRL;
- rascunhos podem permanecer incompletos sem afetar indicadores;
- cancelados/estornados não entram nos valores;
- lançamento manual exige técnico responsável e cria atribuição `owner` com share 100%;
- uma referência de origem continua protegida contra duplicidade pela fundação V2.60.0;
- filtro de Squad usa existência de atribuição ao Squad, sem duplicar o mesmo evento na consulta;
- divisão econômica entre vários Squads fica reservada para a V2.60.5.

## Interface
A área Resultado passa a exibir:
- Receita Direta Total;
- eventos confirmados;
- ticket médio;
- Novo MRR;
- Novo ARR;
- atribuídos x sem atribuição;
- composição por categoria;
- formulário de lançamento manual;
- auditoria dos lançamentos da competência para usuários com permissão de edição estratégica;
- cancelamento auditável de lançamentos confirmados enquanto a competência estiver aberta.

## Banco
Executar `MIGRACAO_V2.60.1.sql` após `MIGRACAO_V2.60.0.sql`.

A migration adiciona `direct_revenue_category`, guard de integridade e a RPC agregada `get_strategy_direct_revenue_summary(date,text)`.
