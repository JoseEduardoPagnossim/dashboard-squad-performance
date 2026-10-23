# V2.58.8 — Snapshots, histórico e evolução

## Objetivo

A V2.58.8 congela a fotografia econômica de cada competência fechada para que o histórico de eficiência não seja reescrito quando fórmulas, benchmarks ou regras do motor evoluírem no futuro.

A versão não substitui o snapshot financeiro criado na V2.57.6. Ela cria uma camada específica de eficiência vinculada à mesma revisão de fechamento.

## Snapshot de eficiência

A migration cria `strategy_efficiency_snapshots`.

Cada registro guarda:

- organização;
- competência;
- revisão do fechamento;
- revisão do snapshot financeiro usado como fonte;
- versão do snapshot (`ES-1.0.0`);
- versão da regra (`EF-0.8.0-snapshots-history`);
- origem (`close` ou `legacy_backfill`);
- fotografia agregada da operação;
- fotografia por Squad;
- benchmarks observados naquela competência.

A tabela não é exposta diretamente ao cliente. O histórico agregado é consumido pela RPC `get_strategy_efficiency_history()` e continua protegido pela permissão estratégica de agregados.

## O que fica congelado

Na operação e por Squad ficam preservados, quando disponíveis:

- custo total;
- custo de pessoas;
- custo operacional;
- FTE;
- atendimentos;
- resoluções;
- quantidade de registros de resolução;
- custo por atendimento;
- custo por resolução;
- taxa de resolução;
- produtividade econômica em resoluções por R$ 1.000;
- taxa de avaliação.

Também são congelados os benchmarks da competência:

- benchmark ponderado da operação;
- média simples dos Squads elegíveis;
- mediana;
- melhor referência observada.

## Fechamento e revisões

Quando uma competência passa para `closed`, um trigger captura automaticamente o snapshot de eficiência usando a mesma `snapshot_revision` do fechamento financeiro.

Se a competência for reaberta e posteriormente fechada novamente, a V2.57.6 cria uma nova revisão financeira e a V2.58.8 grava uma nova revisão de eficiência. A revisão anterior não é sobrescrita.

## Competências antigas

Na instalação da migration, competências já fechadas são consolidadas uma única vez a partir do snapshot financeiro existente e da base de resoluções preservada.

Essas linhas usam `source = legacy_backfill` e aparecem na interface como **Reconstruído**. Isso evita apresentar uma reconstrução posterior como se tivesse sido capturada originalmente no fechamento.

## Competência aberta

A competência atualmente aberta pode aparecer na interface como **Prévia aberta**. Ela é calculada com os dados vivos e não é persistida como snapshot.

Somente o fechamento transforma a fotografia em histórico imutável.

## Evolução

A tela de Eficiência passa a exibir:

- quantidade de snapshots históricos;
- quantidade de fechamentos oficiais;
- quantidade de competências reconstruídas;
- variação da produtividade contra o snapshot anterior;
- gráfico de produtividade econômica ao longo das competências;
- comparação do Squad selecionado com a referência da operação;
- índice base 100 para produtividade e custo por resolução;
- linha do tempo detalhada por competência.

Ao filtrar um Squad, o histórico seleciona a fotografia daquele Squad, mas a referência da operação permanece a fotografia global congelada da mesma competência.

## Segurança e integridade

- snapshot histórico não depende dos dados operacionais atuais para ser exibido;
- snapshot já criado não é atualizado por mudanças futuras de fórmula;
- a tabela bruta de snapshots não possui leitura direta para `authenticated`;
- a RPC pública entrega somente dados agregados de operação/Squad;
- não há exposição de custo pessoal individual nesta camada;
- snapshots reconstruídos são identificados separadamente dos oficiais.

## Migration

Executar:

`supabase/migrations/MIGRACAO_V2.58.8.sql`

A migration é necessária para ativar captura automática, backfill das competências fechadas e histórico agregado.
