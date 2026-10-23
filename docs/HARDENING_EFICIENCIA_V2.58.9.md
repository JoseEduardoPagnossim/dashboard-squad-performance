# V2.58.9 — Hardening, regressões e fechamento da Fase 3

## Objetivo

A V2.58.9 encerra a Fase 3 de eficiência econômica. O foco desta versão não é criar um novo indicador, mas tornar confiáveis as regras entregues entre V2.58.1 e V2.58.8 antes da abertura da Fase 4.

## Correções de integridade

### `null` não pode virar zero

O motor agora diferencia explicitamente ausência de dado de valor zero. Antes do hardening, conversões JavaScript com `Number(null)` podiam transformar campos indisponíveis em `0`, contaminando médias, medianas, deltas e índices relativos.

A V2.58.9 trata `null`, `undefined` e texto vazio como ausência de base. Zero continua válido quando é um valor realmente informado.

### Benchmark fail-closed

Benchmark econômico só é publicado quando toda a base de custo comparável possui uma base explícita de resoluções.

Exemplo: se três Squads possuem custo e apenas dois possuem resoluções informadas, a operação não usa somente esses dois para criar uma referência artificialmente melhor. O benchmark da operação permanece indisponível até completar a cobertura.

A regra diferencia:

- candidatos com custo;
- linhas com resolução informada;
- quantidade faltante;
- cobertura por quantidade;
- cobertura pelo custo representado.

Um valor `0` de resoluções informado explicitamente é uma base válida. Uma linha sem registro de resolução não é equivalente a zero.

### Benchmark individual

O mesmo princípio é aplicado à produtividade individual. A referência do Squad de um técnico só é calculada quando todos os técnicos vinculados e com custo naquele Squad possuem base explícita de resolução. A referência global individual só é calculada com cobertura completa da base técnica comparável.

## Histórico e reabertura

Ao reabrir uma competência, a prévia corrente passa a substituir visualmente o snapshot congelado daquela mesma competência enquanto ela estiver aberta. Isso evita exibir uma fotografia antiga como se ainda representasse o estado corrente.

Ao fechar novamente:

1. a V2.57.6 cria nova revisão financeira;
2. a V2.58.8 cria nova revisão do snapshot de eficiência;
3. a prévia desaparece;
4. a nova revisão oficial volta a representar a competência.

O motor também seleciona defensivamente a maior revisão congelada por competência e prioriza a prévia quando a competência está reaberta.

## Histórico com cobertura parcial

Para evolução da operação, um snapshot com custo em Squads sem base de resolução não é marcado como pronto. O Squad que possui sua própria base completa pode continuar sendo analisado isoladamente, mas a operação não recebe uma eficiência consolidada artificial.

## Integridade no banco

Executar:

`supabase/migrations/MIGRACAO_V2.58.9.sql`

A migration adiciona uma guarda de integridade em `strategy_resolution_metrics`:

- normaliza Squad em maiúsculas e remove espaços externos;
- exige identificação e Squad;
- impede resolução negativa;
- impede alteração do conteúdo de resolução enquanto a competência está fechada;
- preserva o `ON DELETE SET NULL` de usuários para não quebrar histórico;
- valida resoluções contra os atendimentos operacionais do técnico na mesma competência/Squad;
- impede resolução positiva sem vínculo operacional verificável.

Também adiciona contratos `NOT VALID` para novos snapshots de eficiência:

- `financial_snapshot_revision = revision`;
- payload de snapshot obrigatoriamente como objeto JSON.

`NOT VALID` foi usado de propósito: novos registros passam a ser protegidos sem reescrever ou bloquear automaticamente um legado que já esteja persistido.

## Segurança

As regras anteriores continuam preservadas:

- custos individuais exigem permissão de custos pessoais;
- indicadores agregados exigem permissão agregada;
- resolução individual continua protegida por RLS;
- snapshot bruto continua sem policy de leitura direta;
- leitura histórica continua pela RPC agregada;
- revogação de acesso limpa os dados estratégicos já carregados no cliente.

## Fase 3 encerrada

A Fase 3 passa a ter as seguintes entregas consolidadas:

- V2.58.0 — Fundação da Eficiência;
- V2.58.1 — Custo por atendimento;
- V2.58.2 — Custo por resolução;
- V2.58.3 — Produtividade econômica por técnico;
- V2.58.4 — Produtividade econômica por Squad;
- V2.58.5 — Comparativos, benchmarks e eficiência relativa;
- V2.58.6 — Insights e diagnóstico de eficiência;
- V2.58.8 — Snapshots, histórico e evolução;
- V2.58.9 — Hardening, regressões e fechamento da Fase 3.

A numeração V2.58.7 permanece não publicada neste fluxo; a V2.58.9 não cria retrospectivamente uma versão intermediária.

## Motor

Regra corrente:

`EF-0.9.0-phase3-hardening`

Snapshot histórico existente:

`ES-1.0.0`

A versão do snapshot não foi alterada porque o hardening não reescreve o formato congelado da V2.58.8.
