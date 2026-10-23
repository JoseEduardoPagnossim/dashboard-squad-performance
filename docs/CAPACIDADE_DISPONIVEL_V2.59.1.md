# V2.59.1 — Capacidade disponível

A V2.59.1 ativa o primeiro cálculo operacional da Fase 4: **FTE disponível por técnico e por Squad**.

## Regra

`FTE disponível = FTE nominal × disponibilidade da competência`

Exemplos:

- FTE 1,00 e disponibilidade 100% → 1,00 FTE disponível;
- FTE 1,00 e disponibilidade 50% → 0,50 FTE disponível;
- FTE 0,50 e disponibilidade 50% → 0,25 FTE disponível.

A disponibilidade é uma fotografia operacional da competência. Ela **não altera salário, custo pessoal nem o FTE contratual**.

## Como preencher

O campo `FTE` continua representando a jornada contratual equivalente. Para uma jornada de 44 horas semanais, o valor é 1,00.

A nova coluna `Disponib. %` representa quanto daquela competência a pessoa esteve efetivamente disponível para a operação:

- 100% — disponível durante toda a competência;
- 50% — disponível por metade da competência;
- 0% — sem disponibilidade operacional na competência.

A V2.59.1 não tenta inferir férias, afastamentos, admissões ou desligamentos a partir de outras fontes. O percentual é explícito e auditável.

## Consolidação

A tela Capacidade passa a mostrar:

- FTE nominal;
- FTE disponível;
- FTE indisponível;
- taxa de disponibilidade;
- consolidação por Squad;
- detalhamento por técnico para quem possui acesso a pessoas/custos.

A consolidação agregada é disponibilizada por RPC própria e não expõe salários ou custos individuais.

## Fail closed

Uma competência com FTE nominal e disponibilidade ausente não recebe FTE disponível agregado. O sistema mantém a métrica como indisponível até que todos os FTEs relevantes do escopo tenham fator de disponibilidade.

`0%` informado explicitamente é um valor válido e diferente de disponibilidade ausente.

## Histórico anterior

A migration não preenche retroativamente competências já fechadas. Essas competências permanecem sem disponibilidade explícita até uma futura camada de histórico/snapshot da Fase 4.

Competências abertas existentes recebem 100% como ponto de partida para permitir ajuste antes do fechamento.

## Banco de dados

Executar `supabase/migrations/MIGRACAO_V2.59.1.sql` depois da V2.58.9.

A migration:

- adiciona `availability_factor` em `strategy_employee_costs`;
- mantém competências fechadas anteriores sem backfill artificial;
- cria `get_strategy_capacity_summary(date,text)`;
- cria `get_strategy_capacity_squad_summary(date)`;
- preserva RLS e acesso agregado existente.

Não é necessário republicar Edge Functions.

## Fora do escopo

A V2.59.1 ainda não calcula:

- capacidade sustentável em volume;
- capacidade utilizada;
- utilização/ociosidade/sobrecarga;
- FTE necessário;
- gap de capacidade.

Esses itens permanecem reservados às versões seguintes da Fase 4.
