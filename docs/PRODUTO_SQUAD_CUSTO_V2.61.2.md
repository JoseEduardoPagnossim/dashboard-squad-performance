# V2.61.2 — Custo por Produto

## Objetivo

Transformar a demanda já classificada por Produto em uma visão de **Cost to Serve**, sem criar uma segunda contabilidade de custos. A V2.61.2 reutiliza os custos oficiais da Gestão Estratégica e distribui esses valores por Produto usando um driver explícito e auditável.

## Regra de rateio

O driver padrão desta versão é **Atendimentos por Produto dentro do Squad**.

Para cada Squad:

1. o custo de pessoas é lido de `strategy_employee_costs`;
2. o custo operacional é lido do rateio oficial em `strategy_cost_allocations`;
3. a classificação de Atendimentos registrada na camada Produto/Squad é reutilizada como `allocation_share` dos custos;
4. qualquer saldo de Atendimentos ainda sem Produto mantém a mesma parcela do custo como **Não classificado**.

A sincronização nunca cria uma nova origem financeira: ela apenas espelha os custos oficiais em `strategy_product_sources` para permitir a reconciliação Produto/Squad.

## Indicadores

- **Cost to Serve** = custo de pessoas + custo operacional atribuídos ao Produto;
- **Participação no custo** = Cost to Serve do Produto ÷ custo total do escopo;
- **Custo por atendimento** = Cost to Serve ÷ Atendimentos;
- **Custo por resolução** = Cost to Serve ÷ Resoluções;
- **Custo por cliente atendido** = Cost to Serve ÷ Clientes atendidos.

Os indicadores unitários ficam indisponíveis quando o respectivo denominador não existe ou não possui uma fonte válida. A versão não substitui ausência de Clientes por Atendimentos e não transforma Atendimentos em Chamados.

## Reconciliação

A RPC `get_strategy_product_cost_summary` devolve:

- custo de pessoas;
- custo operacional;
- custo total;
- custo classificado;
- custo não classificado;
- cobertura da classificação;
- custo financeiro oficial do mesmo escopo;
- diferença de reconciliação.

O esperado é:

`Produto(s) + Não classificado = custo financeiro oficial da competência/escopo`.

Uma diferença acima de centavos deve ser tratada como sinal de sincronização/integridade, e não escondida.

## Banco

A migration `MIGRACAO_V2.61.2.sql` adiciona:

- `sync_strategy_product_cost_sources(date,text)`;
- `get_strategy_product_cost_summary(date,text)`.

A sincronização exige `edit_costs`, respeita competência aberta e reconstrói apenas as atribuições derivadas dos custos gerenciados pela V2.61.2.

## Fora do escopo

A V2.61.2 não calcula Receita Direta/Influenciada/Protegida por Produto, ROI por Produto ou Unit Economics completo. Essas leituras entram nas próximas versões da Fase 6.
