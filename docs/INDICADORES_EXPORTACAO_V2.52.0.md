# V2.52.0 — Indicadores otimizados, identidade dos Squads e exportação

## Objetivo

A V2.52.0 reduz redundância na tela **Indicadores**, melhora a leitura de séries com valores próximos, padroniza a identidade visual dos Squads e permite levar os gráficos diretamente para apresentações sem precisar de captura de tela.

## Indicadores otimizados

Quando o escopo é **Todos os Squads**, os três blocos de avaliação passam a responder perguntas diferentes:

1. **Nota média das avaliações por Squad** — qualidade percebida, em escala de 1 a 5 e média ponderada pelo total de avaliações.
2. **% de avaliação dos Squads x meta** — cobertura do período selecionado em barras horizontais, sempre partindo de 0%, com a meta específica de cada Squad e a diferença em pontos percentuais.
3. **% de avaliação por Squad** na Evolução Histórica — preserva a leitura mensal da cobertura e a linha consolidada de Total geral.

O gráfico de quantidade de atendimentos e os demais indicadores permanecem com suas regras atuais.

## Cores oficiais por Squad

A configuração visual passa a oferecer uma cor específica para os Squads A, B, D e E. Essas cores são aplicadas de forma consistente sempre que a série representa um Squad, incluindo comparativos mensais, semanais, históricos e exportações.

As cores fazem parte de `chartPreferences` do tema e, portanto, usam o mesmo mecanismo de persistência já existente. Para aplicar a mesma identidade a toda a operação, um Super Admin pode selecionar **Todos os Squads** no escopo de aparência antes de salvar.

## Escala inteligente

Os gráficos percentuais oferecem três modos:

- **Foco automático** — calcula um eixo visual próximo dos dados. Exemplo: valores entre 30,8% e 45,4% usam aproximadamente 25%–50%.
- **Completa** — força 0%–100%.
- **Manual** — preserva mínimo e máximo informados pelo administrador.

Quando o eixo não começa em zero ou não termina em 100%, o gráfico mostra explicitamente **Escala focada**. Os valores não são alterados. Gráficos de barras comparativos, como cobertura x meta, continuam partindo de 0%.

## Perfis visuais

A configuração principal foi simplificada para três presets:

- **Executivo** — poucos rótulos e leitura objetiva.
- **Analítico** — exibe todos os rótulos e aumenta a área útil.
- **Apresentação** — fontes maiores, linhas mais fortes e maior altura dos gráficos.

Os controles anteriores continuam disponíveis dentro de **Ajustes avançados**: fonte do sistema, tamanhos de texto, altura, padding, espessura de linha, raio dos pontos e escala manual.

## Exportação de gráficos

Gráficos renderizados recebem a ação **Exportar**. O modal permite:

- **PNG 16:9** em 1920×1080, com título, contexto do filtro, legenda, fonte e observação da escala;
- **PNG somente gráfico** em 1600×900;
- **SVG vetorial** para máxima nitidez em PowerPoint e outras ferramentas;
- **Copiar imagem** para colar diretamente na apresentação;
- aparência no **Tema atual**, **Fundo claro** ou **Fundo transparente**.

O contexto exportado registra o Squad e o Período de análise ativos. A exportação é exclusivamente local no navegador e não altera dados do dashboard.

## Persistência e banco

A versão reutiliza a infraestrutura existente de temas e preferências. **Não há migration nova na V2.52.0.** A migration V2.51.0 continua necessária apenas para a identidade estável e aliases de técnicos.
