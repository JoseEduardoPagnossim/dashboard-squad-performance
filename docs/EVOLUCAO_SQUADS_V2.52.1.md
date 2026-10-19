# V2.52.1 — Evolução dos Squads e exportação transparente

## Exportação transparente

A V2.52.0 exportava o fundo como transparente, mas mantinha as cores de texto do tema atual. Em temas escuros isso fazia título, legenda, eixos e rodapé parecerem ausentes quando a imagem era inserida em slides claros.

A V2.52.1 separa o conceito de transparência do contraste do conteúdo:

- **Transparente • fundo claro**: fundo alfa, textos/eixos escuros.
- **Transparente • fundo escuro**: fundo alfa, textos/eixos claros.
- As cores das séries e dos Squads não são alteradas.
- PNG, SVG e Copiar imagem passam pela mesma regra.

## Evolução dentro dos cards de Todos os Squads

Cada card recebe um gráfico combinado compacto:

- barras: quantidade de atendimentos;
- linha: percentual de avaliação;
- tooltip: atendimentos, avaliações e percentual avaliado;
- barras: cor oficial personalizada do Squad;
- linha: cor semântica de avaliação.

### Granularidade automática

- até 15 dias: diário;
- 16 a 45 dias: blocos semanais de sete dias a partir do início do período;
- acima de 45 dias: uma coluna/ponto por competência.

A agregação de cada recorte reutiliza `periodTechniciansForSquad` e `deriveTotals`, mantendo a mesma fonte dos KPIs do card e preservando a regra de consolidado mensal oficial quando o recorte cobre a competência inteira.

## Escala

A linha percentual utiliza a configuração visual global:

- Foco automático;
- Completa 0–100%;
- Manual.

Quando o modo focado reduz o eixo, o card informa o intervalo utilizado.

## Impacto técnico

- frontend-only;
- sem migration;
- sem alteração de bonificação, pontuação ou importação;
- sem nova consulta ao Supabase;
- quatro SVGs compactos renderizados a partir dos dados já carregados na Visão do Squad.
