# V2.58.5 — Comparativos, benchmarks e eficiência relativa

## Objetivo
Adicionar contexto comparativo aos indicadores econômicos da Fase 3 sem transformar custo baixo ou a melhor posição do período em meta automática.

## Benchmark de Squad
A produtividade econômica continua sendo:

`resoluções / custo total consolidado × 1.000`

A V2.58.5 calcula quatro referências na competência:

- **benchmark da operação:** soma das resoluções dos Squads elegíveis dividida pela soma de seus custos totais, multiplicada por R$ 1.000; é a média ponderada e define o índice 100;
- **média simples dos Squads:** média aritmética da produtividade econômica dos Squads elegíveis;
- **mediana dos Squads:** ponto central das produtividades elegíveis, menos sensível a extremos;
- **melhor referência atual:** maior produtividade observada na competência. É uma referência, não uma meta automática.

## Eficiência relativa

`índice relativo = produtividade do Squad / benchmark da operação × 100`

Também são publicados:

- diferença percentual versus operação;
- diferença percentual versus mediana;
- custo por resolução;
- taxa de resolução;
- taxa de avaliação como guardrail.

A leitura textual considera uma faixa de ±5% como próxima da referência. A classificação é descritiva e não substitui análise gerencial.

## Benchmark individual
Para técnicos, a fórmula da V2.58.3 é preservada:

`resoluções / custo pessoal × 1.000`

Cada técnico elegível é comparado a:

- produtividade ponderada da base técnica do próprio Squad;
- produtividade ponderada da base técnica da operação.

Custos operacionais compartilhados continuam fora do técnico.

## Filtros e permissões
O filtro de Squad define quais linhas são exibidas, mas o benchmark da operação e a mediana são calculados com todos os Squads elegíveis da competência para evitar que selecionar um único Squad transforme sua própria produtividade em referência.

Detalhes individuais continuam exigindo permissão de custos pessoais. Benchmarks agregados respeitam a permissão de agregados.

## Banco
Não há migration nova. A V2.58.5 reutiliza custos estratégicos e a base de resoluções criada na V2.58.2.

## Regra do motor
`EF-0.6.0-relative-efficiency-benchmarks`
