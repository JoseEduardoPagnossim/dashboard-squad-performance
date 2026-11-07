# R18 — Estorno auditado compatível com a proteção de imutabilidade

## Diagnóstico
A RPC da R15/R17 copia as vendas e suas comissões para auditoria e tenta removê-las, mas o trigger `phase8_immutable_guard_v2639` recusa qualquer `DELETE`. Por isso a transação é revertida.

## Alteração
A migration atualiza a função do trigger **sem desativar o gatilho**, e atualiza a RPC de estorno para marcar a transação com o identificador único do estorno. A exclusão só é autorizada se o registro original for idêntico à cópia de auditoria e o lote, organização, origem e vínculo de comissão coincidirem. `UPDATE` continua proibido. O marcador é local à transação e limpo antes da atualização de status do lote.

## Instalação
1. Faça backup do Supabase.
2. Aplique as migrations até R17, se ainda não aplicadas.
3. Execute `supabase/migrations/MIGRACAO_V2.63.14_ESTORNO_IMUTABILIDADE_R18.sql` no SQL Editor.
4. No painel R16+, abra Histórico de Importações → Conferir estorno, valide os valores e confirme o lote.
5. Confirme que o lote passou a `reverted`, que as vendas e comissões do lote sumiram das tabelas ativas, e que há cópia em `strategy_commercial_reversed_sales_v26311`.

## Segurança
Não modifica bonificação técnica manual, meses operacionais, snapshots, competências financeiras nem outras vendas. A RPC mantém validações de permissão, organização, número de vendas, justificativa, elegibilidade, cópia de auditoria e atomicidade. O comando SQL instala apenas código; não executa estorno de dados.

## Limitação
Validação automatizada estática/local, não substitui teste de transação contra um Supabase de homologação. Se houver comissões comerciais duplicadas para uma venda, a RPC legada poderá precisar de ajuste separado na cópia de auditoria.
