# V2.57.8 — Reimportação operacional substitutiva

## Problema

A montagem da competência preservava técnicos que possuíam produção no estado anterior mesmo quando eles não apareciam mais no CSV reimportado. Isso fazia registros antigos continuarem nas métricas após uma reimportação completa.

## Regra nova

Para competência aberta, o CSV operacional é a fotografia oficial do Squad/mês:

- técnico presente no CSV: permanece e pode reaproveitar metas/configurações anteriores;
- técnico ausente no CSV: não é herdado para `m.technicians`;
- na persistência, registros antigos que não receberam `keepIds` são excluídos de `technician_monthly`;
- produção ausente do arquivo novo deixa de compor as métricas da competência;
- usuário inativo/excluído continua protegido pelas regras da V2.57.7.

Competências fechadas continuam exigindo reabertura antes da reimportação.
