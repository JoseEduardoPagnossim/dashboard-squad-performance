# V2.52.3 — Benchmark consolidado de avaliação

## Objetivo

Adicionar uma leitura executiva única abaixo dos quatro cards da Visão do Squad, comparando a taxa consolidada real da operação com duas referências fixas.

## Cálculo

A série principal não usa média simples dos percentuais dos quatro grupos. Para cada competência no período selecionado:

`Taxa consolidada = Total de avaliações / Total de atendimentos elegíveis`

Os atendimentos e avaliações são obtidos da mesma agregação usada pelos KPIs dos cards. Em competências completas prevalece o consolidado mensal; em recortes parciais é usado o detalhamento diário.

## Séries

- **Taxa consolidada**: linha principal com rótulos em todos os pontos.
- **Tendência**: regressão linear da taxa consolidada ao longo das competências.
- **Limite mínimo**: constante em 20%.
- **Objetivo**: constante em 60%.

## Escala e exportação

O gráfico reutiliza a escala percentual inteligente da V2.52.0, incluindo as referências de 20% e 60% no cálculo do eixo. Também participa do fluxo padrão de exportação PNG/SVG/cópia para apresentações.

## Banco de dados

Não há migration nova.
