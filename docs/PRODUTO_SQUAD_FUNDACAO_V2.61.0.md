# V2.61.0 — Fundação Produto/Squad

## Objetivo

Criar a fundação da Fase 6 para relacionar uma mesma dimensão de Produto às fontes operacionais e econômicas já existentes no dashboard, sem antecipar os cálculos de Demanda, Custo, Resultado e Unit Economics das próximas versões.

## Contrato da dimensão Produto

A V2.61.0 introduz um catálogo organizacional de produtos (`strategy_products`) com código estável, nome, aliases, status ativo/inativo e trilha de auditoria. Nenhum produto é criado automaticamente pela migration: o catálogo deve refletir os produtos realmente utilizados pela organização.

Alterar o nome de um produto no catálogo não reescreve o passado. As atribuições guardam `product_code_snapshot` e `product_name_snapshot` no momento do vínculo.

## Fontes Produto/Squad

A tabela `strategy_product_sources` registra uma fonte única por competência e domínio. Os seis domínios fundacionais são:

- `attendance` — Atendimentos;
- `resolution` — Resoluções;
- `people_cost` — Custo de pessoas;
- `operational_cost` — Custo operacional;
- `fte` — FTE;
- `result` — Resultado econômico.

A fonte mantém referência estável, quantidade ou valor, moeda e snapshots opcionais de pessoa/Squad. A V2.61.0 não faz backfill automático: cada domínio será conectado às suas fontes oficiais nas versões seguintes.

## Atribuição por Produto

`strategy_product_attributions` relaciona uma fonte a um ou mais produtos por `allocation_share`.

Regras:

- a soma das participações de uma mesma fonte nunca pode ultrapassar 100%;
- a validação é serializada no banco para evitar concorrência acima de 100%;
- a parte atribuída pode ser dividida entre vários produtos;
- qualquer saldo abaixo de 100% permanece como **Não classificado**;
- o saldo não classificado continua no denominador de cobertura e nunca desaparece dos indicadores;
- a associação com Produto não altera a natureza original de um atendimento, custo, FTE ou resultado econômico.

## Competência fechada

Fontes e atribuições Produto/Squad não podem ser inseridas, alteradas ou excluídas enquanto a competência estiver fechada. A competência deve ser reaberta antes de qualquer correção.

O catálogo de produtos é global da organização e pode continuar sendo administrado; os snapshots gravados nas atribuições preservam a identidade histórica.

## Segurança

- leitura agregada da fundação usa `has_strategy_access('aggregates')`;
- detalhe de fontes e atribuições exige `edit_costs`;
- manutenção do catálogo também exige `edit_costs`;
- RLS e escopo organizacional são aplicados às três tabelas.

## Resumo de cobertura

A RPC `get_strategy_product_foundation` retorna, por competência e opcionalmente Squad:

- quantidade de produtos e produtos ativos;
- quantidade de fontes registradas;
- fontes totalmente classificadas;
- fontes parcialmente classificadas;
- fontes sem classificação;
- soma das participações atribuídas;
- saldo não classificado;
- percentual médio de cobertura de classificação;
- cobertura por domínio;
- catálogo de produtos para a interface.

A cobertura mede **classificação das fontes**, não participação econômica ponderada por valor.

## Interface

A aba estratégica **Produto/Squad** apresenta:

- Produtos ativos;
- Fontes registradas;
- Cobertura de classificação;
- Fontes não classificadas;
- prontidão por domínio;
- cadastro/ativação/desativação do catálogo;
- roadmap da Fase 6;
- alertas de integridade da fundação.

## Roadmap

- V2.61.0 — Fundação Produto/Squad — pronta;
- V2.61.1 — Demanda por Produto;
- V2.61.2 — Custo por Produto;
- V2.61.3 — Resultado econômico por Produto;
- V2.61.4 — Unit Economics por Produto;
- V2.61.5 — Comparativo entre Squads;
- V2.61.6 — Matriz Produto × Squad;
- V2.61.7 — Mix, concentração e dependência;
- V2.61.8 — Insights e diagnóstico Produto/Squad;
- V2.61.9 — Snapshots, histórico e hardening.
