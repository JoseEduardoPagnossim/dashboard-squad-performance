# V2.61.4 R1 — Hotfix do status oficial nos Indicadores

## Problema
O card **Técnicos acima da referência** recalculava o status no recorte de datas usando `periodStatus`, enquanto a matriz **Status oficial de cada técnico por competência** exibia o status mensal oficial (`m.technicians[].status`). Em competências parciais, as duas referências podiam divergir e o card podia mostrar 100% ACIMA mesmo com técnicos ABAIXO na matriz.

## Correção
- o card passa a somar ACIMA/ABAIXO a partir dos mesmos status oficiais usados na matriz;
- a proporção usa somente registros oficialmente classificados;
- em uma competência o rodapé mostra a quantidade de técnicos com status oficial; em múltiplas competências, mostra registros técnico-competência;
- o cálculo de ranking/pontuação do recorte continua existindo para as análises de período, mas não alimenta mais este card oficial.

## Banco
Não há migration.

## Cache
`js/app.js` usa cache-buster `2.61.4-r1`, sem consumir a V2.61.5 do roadmap.
