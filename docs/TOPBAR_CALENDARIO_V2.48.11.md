# V2.48.11 — Topbar legível e calendário do Design System

## Objetivo

Eliminar truncamentos dos filtros superiores e retirar o calendário nativo do navegador dos filtros de período sem alterar a lógica funcional já existente.

## Filtros superiores

Os controles **Squad**, **Mês** e **Técnico** continuam usando os mesmos elementos `<select>`, listeners e sincronização de URL. A mudança é exclusivamente visual: o rótulo fica acima do valor selecionado para que o texto tenha toda a largura disponível.

Em desktop, a topbar pode quebrar de linha nos mesmos breakpoints já existentes. Nenhum controle pode ampliar a largura global da página.

## Calendário

Os quatro seletores de data usados em:

- topbar: `analysisStartDate` e `analysisEndDate`;
- Indicadores: `indicatorStartDate` e `indicatorEndDate`;

usam agora um calendário próprio do Design System. Os antigos `input[type=date]` auxiliares foram convertidos em `input[type=hidden]`, portanto não existe mais popup nativo nesses filtros.

O calendário:

- respeita a menor e a maior data importadas;
- navega mês a mês;
- destaca a data selecionada e o intervalo atual;
- permite escolher **Hoje** quando a data estiver dentro dos limites;
- fecha com `Esc`, clique externo ou scroll;
- abre como portal fixo para não ser cortado por `overflow` da topbar/cards.

Ao escolher um dia, a aplicação continua executando `handleAnalysisDateInput()`. Logo, renderização, filtros, URL persistente e cálculos continuam no fluxo anterior.

## Banco e regras financeiras

Não há migration. O motor financeiro permanece com `FR-2.48.8-1`.
