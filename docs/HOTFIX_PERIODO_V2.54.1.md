# V2.54.1 — Hotfix dos seletores de mês e ano

## Problema

A navegação direta por mês e ano adicionada na V2.54.0 usa selects customizados pelo Design System. O proxy visual de cada select é um botão `.ds-select-trigger`.

A regra genérica `.period-picker-nav button` também atingia esses proxies e forçava `width:34px` e `height:34px`. Como consequência, somente a seta do select permanecia visível e os textos de mês e ano desapareciam.

## Correção

A V2.54.1 aplica dimensões próprias e largura total aos controles dentro de `.period-picker-jump`, mantendo:

- seletor de mês legível;
- seletor de ano legível;
- setas anterior/próximo com 34px;
- comportamento responsivo;
- toda a lógica de período e contexto global da V2.54.0.

Não há migration nem alteração nas regras de cálculo.
