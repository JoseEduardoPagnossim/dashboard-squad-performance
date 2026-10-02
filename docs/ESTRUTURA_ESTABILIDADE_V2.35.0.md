# V2.35.0 — Estrutura e estabilidade

## Objetivo
Reduzir o acoplamento do `app.js`, centralizar o comportamento dos gráficos e aumentar a cobertura automatizada sem alterar regras de negócio ou a experiência já aprovada.

## Refatoração aplicada
- Novo `js/chart-engine.js` em formato UMD, utilizável pelo navegador e diretamente pelos testes Node.
- Preferências de gráficos centralizadas: fonte, altura, padding, escala percentual, espessura de linha e tamanho de ponto.
- Geometria SVG centralizada: segmentação de séries, curvas, áreas e gradientes.
- Rótulos e formatação centralizados, incluindo escape de conteúdo.
- Interações compartilhadas centralizadas: tooltip, régua, destaque e legenda interativa.
- `app.js` mantém regras de negócio e composição das telas, consumindo o motor compartilhado.

## Proteções contra regressão
O validador exige que `chart-engine.js` seja carregado antes do `app.js`, verifica sua existência e impede o retorno de primitivas centrais duplicadas no arquivo principal.

## Testes
A suíte passou a incluir testes de normalização de preferências, densidade de rótulos, escalas, altura, estilos, CSS variables, segmentação, caminhos SVG, sanitização dos rótulos e estrutura do projeto.

Resultado desta versão: **40 testes automatizados aprovados**.
