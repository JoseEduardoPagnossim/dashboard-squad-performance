# V2.59.3 — Utilização, ociosidade e sobrecarga

A V2.59.3 transforma a carga observada da V2.59.2 em uma leitura relativa de utilização, sem inventar capacidade teórica.

## Regra central

A referência de capacidade é histórica e observada:

1. a aplicação identifica as competências imediatamente anteriores à competência atual;
2. considera somente competências **fechadas**;
3. exige disponibilidade e resoluções completas em todos os meses da janela escolhida;
4. calcula a mediana de `resoluções / FTE disponível` da janela;
5. compara a intensidade atual com essa mediana.

Fórmulas:

- `referência por FTE = mediana histórica de resoluções / FTE disponível`;
- `capacidade sustentável observada = referência por FTE × FTE disponível atual`;
- `taxa de utilização = resoluções atuais / capacidade sustentável observada`;
- equivalente: `resoluções por FTE atual / referência histórica por FTE`.

## Janelas

O seletor estratégico continua sendo a origem da comparação:

- **Mês anterior**: exige exatamente a competência imediatamente anterior;
- **3 meses**: exige os 3 meses imediatamente anteriores;
- **6 meses**: exige os 6 meses imediatamente anteriores;
- **12 meses**: exige os 12 meses imediatamente anteriores.

A aplicação não pula um mês incompleto para buscar um mês mais antigo. Se qualquer competência necessária estiver ausente ou incompleta, a referência fica indisponível.

## Faixas

As faixas são explícitas no motor `CA-0.4.0-utilization-bands`:

- abaixo de **90%**: **ABAIXO DA CAPACIDADE**;
- de **90% a 110%**, inclusive: **DENTRO DA CAPACIDADE**;
- acima de **110%**: **ACIMA DA CAPACIDADE**.

A margem de ±10% evita classificar pequenas oscilações como ociosidade ou sobrecarga estrutural.

## Saldo de capacidade

O painel também apresenta:

- `saldo = capacidade sustentável observada - resoluções atuais`;
- saldo positivo = folga potencial frente à referência;
- saldo negativo = sobrecarga observada frente à referência.

Esse saldo ainda não é convertido em FTE necessário. O dimensionamento de FTE permanece reservado à V2.59.5.

## Operação e Squad

A operação é comparada com seu próprio histórico agregado (`ALL`). Cada Squad é comparado com o histórico do próprio Squad.

Filtrar um Squad não transforma aquele Squad em referência para si mesmo na competência atual. A referência sempre vem de competências anteriores fechadas.

## Fail-closed

A utilização permanece indisponível quando:

- a carga atual da V2.59.2 está incompleta;
- o FTE disponível atual está indisponível;
- algum mês exigido pela janela não está fechado;
- algum mês exigido não possui disponibilidade completa;
- algum mês exigido não possui resoluções completas;
- existe inconsistência entre produção e disponibilidade;
- a referência histórica resulta em zero ou ausência de valor.

Competências antigas anteriores à V2.59.1 não recebem disponibilidade 100% artificialmente. Portanto, elas podem aparecer como base histórica incompleta e não participam da referência.

## Interpretação

A referência é um **padrão histórico observado**, não uma meta automática, SLA ou limite contratual. Uma classificação acima de 110% indica que a carga por FTE está significativamente acima do padrão histórico comparável; não afirma, isoladamente, que a equipe está em risco ou que é necessária contratação.

Diagnóstico e dimensionamento estrutural continuam nas próximas versões da Fase 4.

## Banco de dados

Executar `supabase/migrations/MIGRACAO_V2.59.3.sql` depois da V2.59.2.

A migration não cria tabela nova. Ela publica `get_strategy_capacity_utilization_history()`, que retorna somente agregados de competências fechadas para operação e Squad.
