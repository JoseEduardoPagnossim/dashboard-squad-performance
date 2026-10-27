# V2.61.8 — Insights e diagnóstico Produto/Squad

Diagnósticos baseados nas linhas da V2.61.4 por Squad, também utilizadas pela matriz da V2.61.6. Não existem novas migrations.

- Comparação **do mesmo produto** entre Squads, com pelo menos dois indicadores válidos por métrica e 10 atendimentos para disparar uma situação.
- Alertas: custo/atendimento 30% acima da média do produto; atendimentos/FTE 30% abaixo; resolução/atendimento 20% abaixo; resultado direto líquido negativo.
- Referências médias simples por Squad são usadas só como heurística para triagem, não como benchmark de desempenho conclusivo.
- Taxa de resolução/atendimento **não** é o FCR oficial.
- Não somar receita protegida/influenciada ao resultado direto; dados financeiros incompletos não produzem conclusões.
- Exibir evidências numéricas e alertas de fonte parcial; sem atribuir causalidade ou riscos de churn.
- Executar `npm run check`.
