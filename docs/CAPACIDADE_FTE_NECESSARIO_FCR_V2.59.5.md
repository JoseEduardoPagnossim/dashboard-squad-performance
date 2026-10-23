# V2.59.5 — FCR automático + FTE necessário

A V2.59.5 conecta a Importação de Qualidade Completa à base estratégica de resoluções e ativa o dimensionamento de FTE necessário na Fase 4.

## FCR automático pela Qualidade Completa

A importação existente passa a aceitar a coluna opcional `Resolve`. Não existe um segundo fluxo de importação.

Regra oficial:

- `Resolve = Não` representa chamado não resolvido;
- `Resolve = Sim` representa chamado resolvido;
- ausência de resposta é considerada resolvida **somente quando a competência possui uma importação válida com a coluna Resolve**;
- sem coluna Resolve, a competência fica sem fonte automática e o sistema não presume 100% de resolução.

Fórmulas:

`Resolvidos = Atendimentos operacionais - Resolve Não`

`FCR = Resolvidos / Atendimentos operacionais`

Exemplo: 500 atendimentos, 100 respostas `Não` e 100 respostas `Sim` em 200 pesquisas respondidas resultam em 400 resolvidos e FCR de 80%.

### Integridade

O cálculo é fail-closed. O FCR automático não é publicado quando:

- existe valor inválido na coluna Resolve;
- existe `Resolve = Não` sem vínculo inequívoco com técnico/Squad;
- a quantidade de `Resolve = Não` excede os atendimentos operacionais;
- algum mês com atendimento no período consultado não possui fonte Resolve válida.

Zero `Resolve = Não` é um valor válido. Quando a importação foi feita com a coluna Resolve e nenhum chamado recebeu resposta negativa, os atendimentos sem resposta são considerados resolvidos pela premissa definida.

### Consolidação

A mesma base atende três níveis:

- FCR total da operação;
- FCR por Squad/grupo na visão operacional;
- FCR por técnico em Indicadores.

A base estratégica `strategy_resolution_metrics` passa a receber a resolução automática com `source = csv`. Quando a fonte automática é válida, ela é prioritária para os técnicos operacionais vinculados. O preenchimento manual permanece como contingência onde não existe fonte automática válida.

Uma reimportação operacional de atendimentos também solicita nova sincronização das resoluções automáticas, evitando manter uma resolução calculada sobre uma quantidade antiga de atendimentos.

## FTE necessário

A V2.59.5 usa **atendimentos** como demanda de dimensionamento. Chamados não resolvidos continuam consumindo capacidade operacional e, por isso, FCR não reduz artificialmente a demanda.

Fórmula:

`FTE necessário = Atendimentos atuais / Referência histórica de atendimentos por FTE disponível`

A referência histórica segue o mesmo contrato conservador da V2.59.3:

- somente competências anteriores fechadas;
- janela contígua de mês anterior, 3, 6 ou 12 meses;
- disponibilidade/FTE e atendimentos precisam estar completos;
- a referência é a mediana dos atendimentos por FTE disponível;
- uma competência ausente/incompleta invalida a janela em vez de ser substituída silenciosamente por um mês mais antigo.

Cada Squad é dimensionado contra seu próprio histórico. A operação usa o histórico consolidado da operação.

Se a demanda atual for zero e a referência histórica for válida, o FTE necessário é zero. Sem referência histórica válida, o FTE necessário permanece indisponível.

A V2.59.5 não calcula déficit ou excesso de pessoas. O **gap entre FTE disponível e FTE necessário** permanece reservado para a V2.59.6.

## Banco de dados

Executar `supabase/migrations/MIGRACAO_V2.59.5.sql` depois da V2.59.3. A V2.59.4 não possui migration.

A migration:

- cria `quality_full_resolution_daily`;
- cria `quality_full_resolution_coverage`;
- cria `sync_strategy_resolution_metrics_from_quality(date,text)`;
- cria `get_operational_fcr_overview_range(date,date)`;
- amplia `get_strategy_capacity_utilization_history()` com atendimentos/FTE disponível para dimensionamento;
- preserva as regras de acesso por organização/Squad;
- não exige republicação de Edge Functions.
