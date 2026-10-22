## V2.57.7 — Saneamento de técnicos excluídos na reimportação

A importação operacional passa a separar **produção histórica** de **identidade ativa**. Se um chamado vier no nome de um técnico já excluído/inativo, a linha continua compondo atendimentos e avaliações do Squad, porém é gravada sem `user_id` e não participa de ranking, headcount, pontuação ou bonificação individual enquanto a competência estiver aberta.

Ao reimportar uma competência aberta, vínculos inválidos já salvos são saneados automaticamente. Execute `supabase/migrations/MIGRACAO_V2.57.7.sql` antes de reimportar. Competências fechadas devem ser reabertas antes de qualquer correção.

Detalhes: `docs/REIMPORTACAO_TECNICO_EXCLUIDO_V2.57.7.md`.

## V2.57.6 — Insights, fechamento e snapshots

A Gestão Estratégica passa a permitir fechamento controlado das competências financeiras. O fechamento congela uma fotografia auditável dos custos, rateios, produção e qualidade daquele mês, sem alterar o operacional.

### Principais entregas
- permissão separada **Fechar competências**, administrada pelo Super Admin e desmarcada por padrão;
- fechamento por RPC, com validação de custos não alocados e rateios inconsistentes;
- snapshot versionado por competência, com revisão, fingerprint e versões das regras;
- competências fechadas passam a ser somente leitura e os resumos executivo/histórico passam a ler o snapshot;
- reabertura controlada sem apagar snapshots anteriores;
- novo fechamento após reabertura cria uma nova revisão;
- insights executivos passam a sinalizar competência provisória, rascunho e snapshot fechado;
- bloqueio de INSERT/UPDATE/DELETE em custos e rateios de competências fechadas via RLS.

### Banco
Execute `supabase/migrations/MIGRACAO_V2.57.6.sql` após as migrações anteriores da série 2.57.x.

Detalhes: `docs/GESTAO_ESTRATEGICA_FECHAMENTO_SNAPSHOTS_V2.57.6.md`.
