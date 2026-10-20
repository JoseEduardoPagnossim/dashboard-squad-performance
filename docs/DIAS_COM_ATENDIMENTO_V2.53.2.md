# V2.53.2 — Média diária somente em dias com atendimento

## Regra

O gráfico **Atendimentos diários consolidados x média do período** considera somente dias cujo total consolidado dos Squads seja maior que zero.

Exemplo: se o período possui valores `331, 490, 331, 317, 0, 0, 0`, somente os quatro primeiros dias são exibidos e entram no cálculo da média.

A fórmula passa a ser:

`média diária = soma dos atendimentos dos dias com volume / quantidade de dias com volume > 0`

## Visual

- dias zerados não são plotados;
- a linha pontilhada se chama **Média dos dias com atendimento**;
- o cabeçalho informa quantos dias foram considerados.

## Banco

Não exige migration nova. A V2.53.2 reutiliza as RPCs por intervalo introduzidas na V2.53.1.
