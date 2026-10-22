# V2.58.0 R5 — Compatibilidade de schema estratégico

## Causa
A V2.57.3 criou `strategy_cost_allocations` com percentual em escala 0..100, `basis_total` e sem `allocated_amount`/`allocation_method_snapshot`. A V2.57.4 mudou o contrato, mas usou `CREATE TABLE IF NOT EXISTS`; em bases onde a tabela já existia, as novas colunas não foram adicionadas. As RPCs posteriores passaram a consultar `allocated_amount`, gerando erro em runtime.

## Correção
Execute `supabase/migrations/MIGRACAO_V2.58.0_R5.sql` depois das migrations estratégicas anteriores. A migration:

- preserva registros existentes;
- adiciona `allocation_method_snapshot` e `allocated_amount`;
- converte `percentage` de 0..100 para 0..1 apenas quando detecta a estrutura legada;
- recalcula `allocated_amount` a partir do valor do custo e do percentual convertido;
- converte `headcount` para `fte` e normaliza categorias antigas;
- recarrega o schema do PostgREST.

Não há exclusão de custos, pessoas, competências ou snapshots.
