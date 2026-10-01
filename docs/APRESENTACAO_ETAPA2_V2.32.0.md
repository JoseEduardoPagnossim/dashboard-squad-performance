# Módulo Apresentação — Etapa 2 (V2.32.0)

## Objetivo

Portar para o Performance Hub as seis visualizações e os cálculos do projeto `app_ranking`, sem duplicar a importação de CSV.

## Visualizações

1. Finalizados do Dia
2. Notas do Dia
3. Finalizados Geral
4. Notas Geral
5. Finalizados por Grupo
6. Notas por Grupo

## Regras preservadas

- Carrossel na ordem acima, a cada 20 segundos.
- Ao selecionar uma aba manualmente, a troca automática fica suspensa por 60 segundos.
- Finalizados: ordena por total de atendimentos; desempata pela média por rodada e depois pelo nome.
- Notas: ordena por quantidade de avaliações; desempata pela média ponderada e depois pelo nome.
- Notas por grupo: mostra total de avaliações, média ponderada e participação percentual no total do período.
- Movimentação diária compara a posição atual com a rodada anterior.
- Movimentação geral compara o acumulado atual com o acumulado até a rodada anterior.
- G6 = seis primeiros; Z4 = quatro últimos, quando aplicável.
- A lista de técnicos excluídos replica o monitor legado `app_ranking`.

## Fonte dos dados

A apresentação transforma o histórico diário já carregado no dashboard (`daily_metrics`) no mesmo modelo lógico usado pelo ranking legado: data, técnico, grupo/Squad, quantidade e notas de 1 a 5.

## Grupo

No Performance Hub, o campo de grupo do CSV é o código do Squad (A, B, D ou E). Portanto, as telas de grupo consolidam os Squads. Em uma URL restrita a um único Squad, haverá naturalmente apenas aquele grupo.

## URL direta

- `?view=presentation`
- `?view=presentation&squad=D`
- `?view=presentation&squad=all`

A autenticação continua sendo a mesma do dashboard.
