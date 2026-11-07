# Hotfix R19 - retorno de estorno e recarga de comissoes

## Problema
Depois de o RPC de estorno concluir no Supabase, a interface chamava `loadSuperAdminCommissions`, funcao inexistente. A excecao caia no catch do estorno e exibida como operacao recusada, embora o lote ja estivesse revertido.

## Correcao
- Substitui as duas chamadas (estorno e sincronizacao de lideres) por `ensureSuperAdminCommissions(true)`.
- Separa erro do RPC de estorno de erro de atualizacao de interface. O sucesso do banco e informado antes de iniciar a recarga.
- Sem alteracoes de banco e sem migracao SQL.

## Aplicacao
Substitua `js/app.js` no projeto R16/R18 e publique o arquivo. Atualize a pagina sem cache. Nao tente estornar novamente lotes ja marcados `reverted`.

## Verificacao de dados (SQL somente leitura)
```sql
SELECT id,status,accepted_rows,rejected_rows FROM public.strategy_import_batches
WHERE id='a99b23cb-89d5-4001-aa56-291b62aec37c'::uuid;

SELECT COUNT(*) AS vendas_restantes FROM public.strategy_recurring_sales
WHERE batch_id='a99b23cb-89d5-4001-aa56-291b62aec37c'::uuid;
```
