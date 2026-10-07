# V2.48.7 — Calendário operacional da bonificação

## Objetivo

A bonificação financeira deixa de considerar apenas segunda a sexta e passa a usar o calendário operacional da organização:

```text
dias úteis financeiros = dias de segunda a sexta até a última data importada − dias não úteis ativos
```

A alteração afeta somente cálculos financeiros que usam `atendimentos/técnico/dia`. Metas, pontuação operacional, filtros e histórico diário mantêm suas regras existentes.

## Configuração

Em **Configurações → Bonificação → Calendário operacional** o Administrador pode:

- escolher o ano;
- ativar/desativar feriados nacionais fixos sugeridos;
- cadastrar feriados estaduais ou municipais;
- cadastrar recessos/dias não úteis da empresa;
- salvar o calendário compartilhado pelos Squads A, B, D e E.

A lista padrão inclui os feriados nacionais fixos. Datas móveis ou regras locais devem ser cadastradas quando forem efetivamente dias sem operação.

## Memória de cálculo

A auditoria da Base do Squad mostra:

- dias seg–sex até a última data importada;
- quantidade e descrição dos dias não úteis descontados;
- dias úteis considerados;
- técnicos considerados no divisor;
- média de atendimentos/técnico/dia;
- % de Notas 5 e faixas financeiras.

Exemplo validado para setembro/2026:

```text
Dias seg–sex: 22
07/09 descontado: 1
Dias úteis: 21
Atendimentos: 1.589
Técnicos considerados: 7
Média: 1.589 ÷ 21 ÷ 7 = 10,81
```

A alteração do divisor é identificada pela versão financeira `FR-2.48.7-1`, preservando rastreabilidade em memórias e snapshots.

## Fechamento

Ao fechar a competência, o snapshot grava também a memória do calendário. Alterações futuras no calendário não recalculam meses fechados. Ao reabrir, a competência volta a usar o calendário atual e é recalculada.

## Topbar

A V2.48.7 aumenta somente as caixas visuais dos filtros de **Squad**, **Mês** e **Técnico** na topbar. Os elementos `<select>` originais, listeners `change`, URLs persistentes e encadeamento entre filtros não foram alterados.

## Banco

Execute `MIGRACAO_V2.48.7.sql` antes de publicar o frontend. A tabela `business_calendar_exceptions` possui RLS por organização; leitura fica disponível aos usuários autenticados da organização e escrita somente ao Administrador.
