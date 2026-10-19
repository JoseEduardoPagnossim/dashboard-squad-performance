# V2.52.2 — Rótulos e exportação dos gráficos dos Squads

## Objetivo

Refinar os gráficos combinados `Volume × avaliação` introduzidos na V2.52.1 para uso operacional e em apresentações.

## Exportação

Cada gráfico de Squad recebe o mesmo fluxo de exportação dos demais gráficos do Performance Hub:

- PNG 16:9 para slide;
- PNG somente gráfico;
- SVG vetorial;
- copiar imagem.

O título exportado identifica o Squad do card e o contexto mantém o período/granularidade daquele gráfico. O clique no botão de exportação não navega para o Squad.

## Rótulos de dados

- **Barras:** quantidade de atendimentos posicionada na base da barra.
- **Linha:** taxa de avaliação com uma casa decimal sobre o ponto.
- Até 12 pontos, todos os rótulos ficam visíveis. Em séries maiores, o dashboard intercala os rótulos e mantém o último ponto para preservar legibilidade.

## Legibilidade

Os rótulos recebem contorno de contraste na tela. No exportador, o contorno é recalculado para tema claro, escuro e fundos transparentes, evitando perda de leitura ao levar a imagem para PowerPoint ou Google Apresentações.

## Impacto técnico

Alteração frontend-only. Não modifica Supabase, importação, pontuação, metas ou bonificação. Não exige migration.
