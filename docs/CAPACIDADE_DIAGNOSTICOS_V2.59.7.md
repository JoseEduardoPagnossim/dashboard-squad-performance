# V2.59.7 — Insights e diagnóstico de capacidade

## Objetivo
Traduzir os indicadores da Fase 4 em situações operacionais explicáveis sem criar recomendações automáticas de contratação ou redução de quadro.

## Bases usadas
- FTE disponível (V2.59.1)
- capacidade utilizada / resoluções por FTE (V2.59.2)
- utilização vs histórico fechado (V2.59.3)
- produtividade por FTE (V2.59.4)
- FTE necessário (V2.59.5)
- gap de capacidade (V2.59.6)
- FCR atual como evidência contextual, sem meta implícita.

## Matriz de diagnóstico
O motor cruza o status do gap (déficit, equilíbrio, excesso) com a faixa de utilização (abaixo, dentro, acima).

| Gap | Utilização | Diagnóstico |
|---|---|---|
| Déficit | Acima | Déficit com sobrecarga |
| Déficit | Dentro | Déficit de capacidade |
| Déficit | Abaixo | Déficit com baixa absorção |
| Equilíbrio | Acima | Equilíbrio sob pressão |
| Equilíbrio | Dentro | Operação equilibrada |
| Equilíbrio | Abaixo | Estrutura adequada com baixa absorção |
| Excesso | Acima | Sinais divergentes |
| Excesso | Dentro | Folga de capacidade |
| Excesso | Abaixo | Capacidade ociosa potencial |

## Princípios
1. Déficit não significa automaticamente contratar.
2. Excesso não significa automaticamente reduzir equipe.
3. Déficit com utilização abaixo da referência exige investigação de FCR, backlog, complexidade e processo antes de ampliar estrutura.
4. O FCR é mostrado como evidência factual; esta versão não define meta mínima de FCR.
5. Cada Squad é comparado com seu próprio histórico fechado e consecutivo.
6. Base incompleta permanece sem diagnóstico (fail-closed).

## Banco de dados
Não há migration nova na V2.59.7. O diagnóstico é calculado sobre as bases já publicadas até a V2.59.5.
