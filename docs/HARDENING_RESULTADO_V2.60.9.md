# V2.60.9 — Hardening, regressões e fechamento da Fase 5

## Objetivo

A V2.60.9 encerra a Fase 5 — Resultado. O foco não é criar uma quarta natureza econômica nem alterar a regra conceitual entregue nas versões anteriores. O objetivo é estabilizar o ciclo completo da Fase 5, garantindo que Receita Direta, Influenciada e Protegida permaneçam reconciliáveis entre lançamento, atribuição, ROI, diagnóstico, fechamento e histórico.

Motor corrente:

`RE-1.0.0-phase5-hardening`

Formato do snapshot preservado:

`RS-1.0.0`

Versão de hardening do histórico:

`RH-1.0.0`

## Correções de integridade

### 1. ROI consolidado não perde receita confirmada sem rateio

Até a V2.60.8, o ROI operacional reutilizava o consolidado por Squad. Esse consolidado depende da atribuição econômica e, por isso, uma Receita Direta confirmada ainda sem técnico/Squad podia aparecer na Receita Direta, mas desaparecer do ROI consolidado.

A V2.60.9 separa as responsabilidades:

- operação em `Todos`: Receita Direta, Influenciada e Protegida vêm dos totais econômicos oficiais de cada natureza;
- linhas por Squad: continuam usando o rateio econômico da V2.60.5;
- a diferença ainda sem rateio fica explícita como `unallocated_*_revenue` enquanto a competência está aberta;
- Receita Influenciada e Protegida continuam fora do numerador do ROI.

Isso impede que a ausência temporária de atribuição individual reduza artificialmente o Resultado da operação.

### 2. Fechamento exige 100% de atribuição efetiva

O banco passa a bloquear o fechamento quando um evento economicamente elegível não estiver totalmente atribuído.

A validação usa exatamente a regra da V2.60.4:

- `attribution_share` explícita tem precedência;
- participantes sem percentual dividem o saldo restante;
- se todos estiverem sem percentual, o evento é dividido igualmente;
- evento sem participante não pode ser congelado como resultado auditável;
- se todos os participantes possuem percentual explícito, a soma precisa fechar em 100%.

Eventos `draft` e `cancelled` não bloqueiam o fechamento porque não compõem o resultado econômico realizado.

### 3. Concorrência em `attribution_share`

A validação de shares agora bloqueia a linha do evento (`FOR UPDATE`) antes de somar os percentuais. Isso serializa gravações concorrentes do mesmo evento e impede que duas inserções simultâneas ultrapassem 100% por condição de corrida.

## Hardening dos snapshots

A tabela `strategy_result_snapshots` passa a ser consumida somente por RPC agregada autorizada. O `SELECT` direto de `authenticated` é revogado.

Novos writes passam a respeitar contratos `NOT VALID` entre coluna e payload:

- `snapshot_version`;
- `rule_version`;
- `source`;
- `revision`;
- `financial_snapshot_revision`;
- revisão financeira igual à revisão do Resultado;
- payload principal como objeto;
- `operation` como objeto;
- `squads` como array;
- `integrity` como objeto;
- `snapshot_fingerprint = md5(snapshot::text)`.

`NOT VALID` protege novos registros sem bloquear implantação por eventual legado anterior ao hardening.

Snapshots também passam a ser imutáveis por trigger: `UPDATE` e `DELETE` são rejeitados.

## Histórico fail-closed

A RPC histórica foi reforçada para:

1. selecionar a maior revisão de cada competência;
2. desempatar deterministicamente preferindo `close` a `legacy_backfill`;
3. excluir competência atualmente reaberta;
4. validar contrato e fingerprint do snapshot;
5. rejeitar a revisão corrente quando inválida, sem recair silenciosamente para uma revisão antiga;
6. publicar contadores de hardening para auditoria.

O cliente revalida defensivamente:

- revisão e revisão financeira;
- versão `RS-1.0.0`;
- origem do snapshot;
- presença do fingerprint;
- métricas econômicas obrigatórias;
- coerência matemática de retorno líquido, ROI e cobertura quando há custo.

Snapshot inválido não participa da evolução.

## Correção de propagação do histórico

A V2.60.8 carregava `resultHistory` no fluxo de dados, mas o `getFinancialData()` do controller estratégico não devolvia esse campo ao `viewModel`. A V2.60.9 corrige a propagação, incluindo também os metadados `hardening`.

## Interface

A área Resultado passa a exibir o fechamento da Fase 5 com indicadores de integridade:

- snapshots válidos;
- snapshots rejeitados;
- competências reabertas fora da série congelada;
- estado do rateio econômico corrente.

Quando a migration V2.60.9 ainda não foi aplicada, o histórico informa `MIGRAÇÃO PENDENTE` em vez de aparentar que o hardening está ativo.

## Banco de dados

Executar:

`supabase/migrations/MIGRACAO_V2.60.9.sql`

Ela deve ser aplicada após `MIGRACAO_V2.60.8.sql`.

## Critério de saída da Fase 5

A Fase 5 pode ser considerada encerrada quando:

- a migration V2.60.9 estiver aplicada;
- `npm run check` estiver integralmente verde;
- Receita Direta da operação reconciliar com o ROI consolidado;
- competência com resultado confirmado sem rateio completo for impedida de fechar;
- após regularização do rateio, o fechamento gerar nova revisão `RS-1.0.0`;
- competência reaberta sair da série congelada até novo fechamento;
- snapshot oficial não aceitar `UPDATE` ou `DELETE`;
- snapshot com contrato/fingerprint inválido não participar da evolução.

## Fase 5 encerrada

- V2.60.0 — Fundação de Resultado;
- V2.60.1 — Receita Direta;
- V2.60.2 — Receita Influenciada;
- V2.60.3 — Receita Protegida;
- V2.60.4 — Resultado por técnico;
- V2.60.5 — Resultado por Squad;
- V2.60.6 — ROI e retorno operacional;
- V2.60.7 — Insights e diagnóstico de resultado;
- V2.60.8 — Snapshots, histórico e evolução;
- V2.60.9 — Hardening, regressões, integridade, auditoria e fechamento da Fase 5.
