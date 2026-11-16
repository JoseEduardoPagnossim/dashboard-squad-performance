# Hotfix R29.1 — Diagnóstico da pré-validação e lotes sem vendas novas

## Problema identificado
Na R29, `confirmStrategyRecurringImport()` exibiu apenas o toast genérico “nenhuma venda foi gravada” quando a função RPC recusava linhas. O motivo e a linha já estavam em `strategyRecurringState.lastAudit`, mas a interface só mostrava texto abaixo da confirmação. Além disso, a RPC `preview_strategy_recurring_chunk_r29` descartava o resumo retornado pelo motor oficial (`imported`, `duplicates`, `closed`). Isso impedia distinguir importações inteiramente duplicadas de lotes com vendas novas e podia criar lotes `draft` vazios.

## Correções
- Diagnóstico destacado **antes do resumo do importador**, mostrando linha, vendedor, produto e motivo da primeira recusa, com exportação CSV para todas as recusas.
- Toast específico com a primeira linha e motivo, em vez da mensagem genérica.
- Nova migration `MIGRACAO_V2.63.20_PREVIEW_RESULTADO_R291.sql` mantém a validação transacional com rollback, mas devolve os contadores de vendas novas, duplicadas e competências fechadas, sem persistir lote nem venda de teste.
- Quando a pré-validação identifica **zero novas vendas**, e todas as aptas são duplicadas/fechadas, evita criar lote vazio. Exceção: quando o usuário opta pelo recálculo R23 de comissões; nesse caso, mantém o fluxo de lote necessário à reconciliação financeira.
- A R29.1 **não reimporta automaticamente**, não remove lotes antigos nem modifica as 99 vendas já gravadas.

## Aplicação
1. Backup do banco e aplicação da migration V2.63.20 no SQL Editor do Supabase, após a V2.63.19 da R29.
2. Publicar apenas os arquivos incrementais do ZIP sobre a R29.
3. Atualizar o navegador uma vez, conferir cache-buster `2.63.9-r291`.
4. Reabrir importação MRR, selecionar CSV original e competência outubro/2026; confirmar apenas após conferir vínculos, competência aberta e prévia. O sistema deve **mostrar motivo específico** se bloquear; exportar CSV dos erros.
5. Se a pré-validação mostrar que existem vendas novas, verificar as regras e comissão antes de concluir e conferir Arthur Santos (01/10 e 05/10) depois.

## Limitações e segurança
- O motivo específico de tentativas antigas que não foi gravado não pode ser reconstruído do banco retroativamente.
- A pré-validação não é uma transação atômica envolvendo **todas** as chamadas de produção. Problemas de rede ou mudanças concorrentes ainda podem interromper uma importação; conferir lotes e registro financeiro antes de tentar novamente.
- Contagens são estimativas no momento da pré-validação. Um dado alterado depois pode mudar o resultado real.
- Dados de vendedores externos continuam fora do escopo de importação e pendências de vínculos de vendedores elegíveis devem ser resolvidas antes da confirmação.
- Competências fechadas e regras existentes de idempotência continuam protegidas pelo motor SQL oficial.

## Testes
`npm run check`: 1.157 testes aprovados, zero falhas. Necessária homologação em Supabase com usuário autorizado para confirmar o resultado da RPC.

## Commit
`fix: detalha bloqueios e evita lotes comerciais vazios na pre-validacao (R29.1)`
