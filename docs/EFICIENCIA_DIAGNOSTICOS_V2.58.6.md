# V2.58.6 — Insights e diagnóstico de eficiência

## Objetivo
Transformar os indicadores econômicos e benchmarks da Fase 3 em diagnósticos explicáveis, mantendo separação entre fato observado, sinal de atenção e próxima análise recomendada.

## Princípios
- diagnóstico não é meta automática;
- não existe score oculto;
- produtividade econômica continua sendo a métrica-base;
- qualidade funciona como guardrail e não multiplica a produtividade;
- filtro de Squad altera as linhas exibidas, mas não redefine a referência global da operação;
- técnico continua usando somente custo pessoal; Squad usa custo total consolidado.

## Referências
A V2.58.6 reutiliza os benchmarks da V2.58.5 e acrescenta referências operacionais para:
- custo por resolução;
- taxa de resolução;
- qualidade agregada por Squad;
- nota média na base técnica individual.

## Regras diagnósticas
As tolerâncias são públicas no motor:
- produtividade econômica: ±5% da referência é considerada próxima;
- taxa de resolução: queda superior a 5 p.p. é considerada desvio relevante;
- qualidade de Squad: queda superior a 3 p.p. aciona guardrail;
- nota média individual: diferença inferior a -0,30 ponto aciona guardrail.

Principais diagnósticos:
1. **Eficiência saudável** — produtividade acima da referência com guardrails preservados.
2. **Pressão de resolução** — produtividade abaixo da referência acompanhada de taxa de resolução inferior à base.
3. **Pressão de custo** — produtividade abaixo da referência com custo por resolução acima da base.
4. **Eficiência com alerta de qualidade** — produtividade acima da referência, porém qualidade inferior à base comparável.
5. **Eficiência próxima da referência** — dentro da faixa de ±5%, evitando reação excessiva a pequenas oscilações.
6. **Base insuficiente** — não existe informação suficiente para diagnóstico responsável.

## Priorização
O painel destaca primeiro alertas de resolução ou qualidade, depois pressão de custo/eficiência. Resultados saudáveis e próximos da referência permanecem visíveis, mas não substituem análise gerencial.

## Banco
Não há migration nova. A V2.58.6 reutiliza a base de resoluções da V2.58.2 e os custos/produção já existentes.

## Regra do motor
`EF-0.7.0-efficiency-diagnostics`
