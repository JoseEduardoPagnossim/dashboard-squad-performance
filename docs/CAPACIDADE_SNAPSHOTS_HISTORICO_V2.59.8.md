# V2.59.8 — Snapshots, histórico e evolução da capacidade

## Objetivo
Congelar a fotografia de capacidade de cada competência no fechamento e usar essa fotografia imutável como fonte das referências e da evolução histórica da Fase 4.

## O que é congelado
Por operação (`ALL`) e por Squad, o snapshot registra:

- FTE nominal e FTE disponível;
- taxa de disponibilidade e completude da disponibilidade;
- atendimentos e atendimentos por FTE disponível;
- resoluções e resoluções por FTE disponível;
- FCR quando a relação resolução/atendimento é válida;
- contadores de cobertura, ausências e inconsistências;
- revisão do fechamento financeiro, versão do snapshot e versão da regra.

## Origem dos pontos históricos
- `close`: snapshot oficial criado automaticamente ao fechar a competência.
- `legacy_backfill`: reconstrução controlada de competências que já estavam fechadas antes da V2.59.8.
- `live_preview`: somente no frontend, para a competência ainda aberta. Não é persistida e não conta como snapshot.

## Integridade e revisão
O snapshot de capacidade exige uma competência fechada, `snapshot_revision > 0` e a existência do snapshot financeiro da mesma revisão. A chave `(organization_id, competence_id, revision)` impede duas fotografias de capacidade para o mesmo fechamento.

Reabrir a competência preserva a fotografia anterior. Um novo fechamento incrementa a revisão financeira e cria uma nova fotografia de capacidade para a nova revisão.

## Histórico e referências
`get_strategy_capacity_snapshot_history()` entrega somente dados persistidos em `strategy_capacity_snapshots`. A função legada `get_strategy_capacity_utilization_history()` permanece como alias para a mesma fonte congelada.

Para cada ponto da evolução, o motor `CA-0.9.0-snapshots-history` recalcula, usando apenas competências anteriores:

- referência de resoluções por FTE;
- utilização;
- referência de atendimentos por FTE;
- FTE necessário;
- gap de FTE e de atendimentos;
- diagnóstico de capacidade.

A janela continua fail-closed: se faltar qualquer competência exigida pela comparação selecionada, o indicador dependente dessa referência permanece indisponível.

## Migração de competências antigas
A migration executa um backfill das competências fechadas sem snapshot da revisão atual. Como esses valores são reconstruídos após o fechamento original, a origem fica explicitamente marcada como `legacy_backfill` e nunca como `close`.

## Interface
A área Capacidade passa a exibir:

1. quantidade de snapshots no escopo;
2. quantidade de fechamentos oficiais;
3. quantidade de reconstruções legadas;
4. diagnóstico do ponto mais recente;
5. evolução de FTE disponível x FTE necessário;
6. evolução da utilização;
7. linha do tempo com FTE, demanda, resoluções, FCR, produtividade por FTE, utilização, FTE necessário, gap e diagnóstico.

## Segurança
A tabela usa RLS e não recebe escrita direta do cliente autenticado. Captura e leitura são feitas por funções `security definer` protegidas pelo acesso estratégico existente. A captura não é concedida ao papel `authenticated`.
