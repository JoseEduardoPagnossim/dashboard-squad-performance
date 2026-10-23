# V2.59.0 — Fundação de Capacidade

A V2.59.0 inicia a Fase 4 sem antecipar os cálculos de capacidade disponível, utilização ou FTE necessário.

## Objetivo

Criar um contrato explícito para distinguir:

- **FTE nominal**: força equivalente cadastrada na competência; não é headcount;
- **FTE disponível**: FTE nominal ajustado por disponibilidade real; será implementado na V2.59.1;
- **demanda**: volume que precisa ser absorvido pela operação; a unidade principal da fundação é resolução;
- **capacidade**: volume sustentável que a estrutura disponível consegue absorver; não equivale ao volume realizado;
- **utilização**: parcela da capacidade efetivamente consumida pela demanda;
- **FTE necessário**: força equivalente necessária para sustentar a demanda usando uma referência de capacidade confiável;
- **gap de capacidade**: diferença entre estrutura disponível e estrutura necessária.

## Motor

`CA-0.1.0-capacity-foundation`

O motor vive em `js/strategy-capacity.js` e não depende do motor financeiro para inventar capacidade. Ele recebe apenas escopo, métricas observadas e disponibilidade explícita das fontes.

## Filtros

A seção Capacidade usa o mesmo contexto estratégico isolado das demais seções:

- competência estratégica;
- Squad/grupo estratégico;
- comparação: mês anterior, 3, 6 ou 12 meses.

Filtros operacionais não são importados silenciosamente para a camada de capacidade.

## Bases observadas na V2.59.0

A fundação pode exibir:

- FTE nominal;
- pessoas vinculadas ao custo estratégico;
- atendimentos observados;
- resoluções observadas;
- atendimentos por FTE nominal;
- resoluções por FTE nominal.

Os dois últimos indicadores são referências **observadas**, não capacidade sustentável.

## Fail-closed

A V2.59.0 não calcula:

- FTE disponível;
- capacidade teórica/sustentável;
- capacidade utilizada;
- taxa de utilização;
- FTE necessário;
- gap de capacidade.

Esses valores permanecem `null`/pendentes até suas versões planejadas. Zero explícito continua sendo dado válido; ausência de fonte continua indisponível.

## Roadmap técnico

- V2.59.1 — capacidade disponível;
- V2.59.2 — capacidade utilizada;
- V2.59.3 — utilização, ociosidade e sobrecarga;
- V2.59.4 — produtividade por FTE;
- V2.59.5 — FTE necessário;
- V2.59.6 — gap de capacidade;
- V2.59.7 — insights e diagnóstico;
- V2.59.8 — snapshots, histórico e evolução;
- V2.59.9 — hardening e fechamento da Fase 4.

## Banco de dados

A V2.59.0 não cria migration. A fundação consome somente bases existentes da Gestão Estratégica e da Fase 3.
