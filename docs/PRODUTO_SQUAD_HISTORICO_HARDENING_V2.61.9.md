# V2.61.9 — Snapshots e histórico Produto/Squad

Aplicar `supabase/migrations/MIGRACAO_V2.61.9.sql` antes de publicar.

O fechamento tenta congelar automaticamente a revisão Produto/Squad; caso as fontes não estejam disponíveis, a operação registra aviso no console e é possível clicar em **Congelar revisão atual** depois de corrigir as fontes. A mesma revisão não é sobrescrita.

A função executa exclusivamente para competência fechada e perfil autorizado a fechar. O histórico pode ser lido apenas por quem possui acesso a agregados estratégicos. Reabrir uma competência não elimina revisões anteriores; um novo fechamento gera nova revisão.

Auditoria operacional recomendada: validar a revisão financeira, contagem de Squads, dados de FTE e reconciliação de cada fonte; o aplicativo não substitui auditoria contábil. Histórico sem snapshot prévio não é reconstruído automaticamente.
