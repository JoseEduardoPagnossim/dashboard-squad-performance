# Fase 9 — Histórico de importações comerciais R13

Consulta somente leitura, na própria aba de importação, dos últimos 50 lotes MRR e Não MRR. Exibe status, data, arquivo, tentativas importadas, duplicadas e bloqueadas por competência fechada. Permite abrir lote e ver vendas gravadas, com exportação CSV. Vendas anteriores mantêm seu valor original; a comissão exibida é **estimativa pela regra congelada**, não pagamento oficial. Tentativas recusadas ficam apenas na contagem, não são vendas persistidas. O limite defensivo de 5.000 ocorrências ou vendas é sinalizado como consulta parcial; exportação de vendas é bloqueada quando parcial.

Usa exclusivamente tabelas e políticas RLS preexistentes, sem nova migration. Permissões estratégicas continuam obrigatórias. Nunca recalcula pagamentos, cria vendas ou modifica snapshots. Histórico real depende de Supabase homologado. Validação de lotes de dados reais, RLS, volume e correspondência financeira permanece pendente.
