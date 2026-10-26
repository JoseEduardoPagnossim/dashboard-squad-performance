# V2.61.3 — Resultado econômico por Produto

## Objetivo

Relacionar o Resultado econômico estabilizado na Fase 5 à dimensão Produto/Squad sem alterar a natureza dos fatos financeiros e sem criar um total artificial pela soma de Receita Direta, Influenciada e Protegida.

## Fontes oficiais

A sincronização lê exclusivamente `strategy_result_events` e `strategy_result_attributions` da competência. Entram apenas eventos economicamente elegíveis:

- Direta: `confirmed`;
- Influenciada: `confirmed`;
- Protegida: `confirmed`, verificada e ainda não perdida.

O rateio por Squad reaproveita a mesma política da Fase 5: `attribution_share` explícito tem precedência e o saldo é dividido entre participantes sem share explícito. Qualquer parcela sem Squad vira `UNALLOCATED`.

## Classificação por Produto

Cada parcela econômica vira uma fonte `source_domain='result'` com `metric_key` igual a `direct`, `influenced` ou `protected`. A classificação utiliza `strategy_product_attributions` e pode ser fracionária, limitada a 100% por fonte.

O saldo sem Produto permanece como `UNCLASSIFIED` e continua no denominador da cobertura. Não existe redistribuição automática do saldo entre os produtos já classificados.

## Métricas

Por Produto são exibidos, separadamente:

- Receita Direta, MRR direto e ARR direto;
- Receita Influenciada, MRR influenciado e ARR influenciado;
- Receita Protegida, MRR protegido e ARR protegido.

As coberturas de classificação são calculadas por natureza econômica. Cada natureza também é reconciliada separadamente contra o resumo oficial de Resultado por Squad.

## Guardrails

- Direta + Influenciada + Protegida nunca formam uma métrica única de "receita gerada".
- MRR e ARR são dimensões paralelas e não são somadas novamente ao `gross_amount`.
- A sincronização é bloqueada em competência fechada.
- A sincronização usa referências estáveis e UPSERT: parcelas que continuam elegíveis preservam o mesmo ID e as atribuições de Produto; parcelas que deixam de existir são marcadas como obsoletas e saem do resumo sem apagar o histórico físico.
- Unit Economics e ROI por Produto permanecem para a V2.61.4.
