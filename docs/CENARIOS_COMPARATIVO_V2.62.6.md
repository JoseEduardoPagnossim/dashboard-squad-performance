# V2.62.6 — Comparativo entre cenários

## Objetivo
Confrontar, lado a lado, a competência oficial (Atual), um cenário Otimista, outro Conservador e um cenário Personalizado. Todas as alternativas são calculadas em memória sobre uma única competência, Squad e revisão, sem persistência, sem alteração do snapshot ou dos lançamentos.

## Premissas ilustrativas (alteráveis futuramente, mas fixas nesta entrega)
- **Atual**: nenhuma alteração; reproduz a base oficial disponível.
- **Otimista**: demanda +15%; 1 contratação; receita direta +12%, influenciada +10%, protegida +5%; pessoal +4%; operacional +2%.
- **Conservador**: demanda -10%; receita direta -10%, influenciada -10%, protegida -5%; pessoal +5%; operacional +8%.
- **Personalizado**: campos independentes de demanda, contratações, desligamentos, transferências, jornada, 3 receitas e 2 custos. Valores iniciais iguais ao atual.

Essas hipóteses são apenas *exemplos de planejamento*. Não se atribui probabilidade, sazonalidade nem vínculo causal entre contratações, demanda e receita.

## Fontes e fórmulas
- **Financeiro**: mesma reconciliação da V2.62.5; receita direta é a única entrada em retorno líquido e ROI; influenciada e protegida permanecem separadas.
- **Capacidade**: FTE disponível validado, atendimentos oficiais da competência, referência histórica de atendimentos/FTE e premissas de movimentação/jornada. O FTE necessário corresponde à demanda projetada / produtividade histórica por FTE, com utilização = necessário/disponível × 100. Ociosidade e sobrecarga nunca são ambas positivas.
- **Comparabilidade**: o motor exige competência, Squad e revisão iguais nas fontes econômicas e de equipe. Cada coluna registra sua própria disponibilidade; ausência de FTE não mascara um custo disponível, e vice-versa.
- **Transferências**: no escopo "Todos os Squads" são neutras para o FTE total. Uma transferência entre Squads precisa de contrapartida no escopo da operação para manter a reconciliação global.
- **Delta**: variação absoluta contra o cenário Atual, em reais, FTE, atendimentos ou pontos percentuais para indicadores %.
- **ROI com custo zero**: indisponível em vez de zero ou infinito.

## Limites e QA
Não há cálculo automático de custo adicional de contratação ou economia com desligamento; tais custos dependem de premissas financeiras explícitas. Os cenários são simulações locais sem gravação em banco, sem garantias de resultado. Validar interface, fontes e permissões no ambiente Supabase antes de publicar. Executar `npm run check`.
