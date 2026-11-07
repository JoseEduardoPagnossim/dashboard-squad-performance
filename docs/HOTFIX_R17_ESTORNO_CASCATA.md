# Hotfix R17 - Estorno em cascata

A R16 impedia estorno quando `technician_finance_monthly.sales_commission` tinha valor e atualizacao posterior, mesmo sem sincronizacao das vendas. Essa heuristica foi removida da **previa**.

A RPC existente `reverse_strategy_commercial_batch_v26311` permanece transacional: registra auditoria e copia das vendas/comissoes, exclui as comissoes comerciais vinculadas ao lote, vendas, atribuicoes e eventos relacionados, altera o lote para `reverted` e recalcula a parcela automatica dos lideres. Nao altera bonificacoes tecnicas manuais nem snapshots operacionais.

Mantem bloqueios por fechamento financeiro estrategico, snapshots/consolidacoes, fechamento operacional posterior a importacao, limite de 5.000 vendas, lote vazio ou nao elegivel, e verificacoes de acesso, justificativa e quantidade esperada.

Aplicar a migration R17 depois de R16, apos backup do banco. Conferir a previa no painel antes de confirmar. Nenhum dado e apagado automaticamente ao aplicar a migration. Testes automatizados locais nao substituem homologacao da RPC no Supabase.
