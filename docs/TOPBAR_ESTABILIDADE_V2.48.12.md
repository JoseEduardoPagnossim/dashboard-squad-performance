# V2.48.12 — Estabilização visual da Topbar

## Objetivo

Corrigir o recorte vertical dos valores dos filtros **Squad**, **Mês** e **Técnico** observado após a V2.48.11, sem alterar a lógica de seleção nem a estrutura geral do painel.

## Causa

A V2.48.11 colocou rótulo e valor em duas linhas dentro de um controle externo fixo de 44 px usando grid. A combinação de altura de linha, fonte e proxy visual do Design System podia ultrapassar alguns pixels em determinados navegadores/níveis de zoom e o valor ficava recortado.

## Correção

Somente a composição interna dos três filtros da topbar foi alterada:

- caixa externa continua com **44 px**;
- rótulo usa uma linha fixa de **9 px**;
- valor usa uma linha fixa de **20 px**;
- wrapper usa coluna flexível centralizada;
- proxy e trigger não podem aumentar a altura do controle;
- ellipsis continua protegendo nomes excepcionalmente longos.

## O que não mudou

- `#squadSelect`, `#monthSelect` e `#techSelect`;
- listeners de `change`;
- estado e URL persistente;
- calendário próprio da V2.48.11;
- sidebar;
- layout dos módulos;
- regra financeira (`FR-2.48.8-1`);
- banco de dados.
