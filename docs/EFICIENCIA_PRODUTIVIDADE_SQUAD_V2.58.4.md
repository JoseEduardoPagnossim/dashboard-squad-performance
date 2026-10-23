# V2.58.4 — Produtividade econômica por Squad

## Objetivo
Consolidar eficiência econômica no nível do Squad usando custos que já possuem atribuição confiável por equipe, sem distribuir custos compartilhados artificialmente até o técnico.

## Fórmula oficial

`produtividade econômica do Squad = resoluções / custo total consolidado × R$ 1.000`

O custo total inclui **custo de pessoas + custo operacional rateado** do Squad. Quanto maior o número de resoluções entregues para o mesmo custo, maior a produtividade econômica. Custo baixo sem resolução não melhora o ranking.

## Guardrails visíveis
A fórmula não recebe pesos ocultos. A leitura mostra em paralelo:
- FTE do Squad;
- atendimentos;
- resoluções;
- taxa de resolução;
- taxa de avaliação;
- custo por resolução;
- resoluções por FTE.

Esses indicadores servem para interpretar o resultado econômico e evitar concluir que um Squad é melhor apenas por ser mais barato.

## Elegibilidade do ranking
Um Squad recebe posição quando possui:
1. custo total consolidado maior que zero;
2. base explícita de resolução registrada na competência.

Squads com base incompleta continuam visíveis, mas ficam sem posição no ranking.

## Escopo e permissões
A visão respeita o filtro estratégico de Squad e exige permissão agregada. Não expõe custos individuais de técnicos.

## Banco
Não há migration nova na V2.58.4. A versão reutiliza:
- consolidação financeira da Fase 2;
- produção operacional existente;
- `strategy_resolution_metrics` e RPCs da V2.58.2.

## Regra do motor
`EF-0.5.0-economic-productivity-squad`
