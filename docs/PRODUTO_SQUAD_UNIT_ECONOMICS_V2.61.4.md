# V2.61.4 — Unit Economics por Produto

## Objetivo

Cruzar **Demanda, Cost to Serve, FTE e Resultado econômico** para explicar a eficiência econômica de cada Produto sem criar uma nova fonte financeira e sem misturar Receita Direta, Influenciada e Protegida.

## Regra econômica

O ROI da V2.61.4 permanece coerente com a Fase 5:

`ROI direto = (Receita Direta - Cost to Serve) / Cost to Serve × 100`

Receita Influenciada e Receita Protegida **não entram no numerador do ROI**. Elas aparecem como indicadores independentes de impacto:

- `Receita Influenciada / R$ de custo`;
- `Receita Protegida / R$ de custo`;
- MRR protegido continua paralelo e não é somado ao gross amount.

Quando o Cost to Serve é zero, ROI e cobertura direta ficam indisponíveis em vez de produzir infinito ou 0% artificial.

## FTE por Produto

A V2.61.4 ativa o domínio `fte` da Fundação Produto/Squad.

São sincronizadas duas métricas:

- `nominal_fte` — FTE contratual da competência;
- `available_fte` — FTE nominal × fator de disponibilidade, somente quando a base de disponibilidade está completa.

O **FTE alocado** por Produto usa a mesma classificação de Atendimentos do Squad. Portanto, ele representa **FTE equivalente/alocado para consumo de capacidade**, não apontamento real de horas trabalhadas em cada Produto.

Qualquer parcela de Atendimentos sem classificação gera a parcela correspondente de FTE em **Não classificado**.

## Indicadores por Produto

A tabela de Unit Economics publica, sem criar score composto:

- Atendimentos;
- Cost to Serve;
- FTE disponível alocado;
- custo por Atendimento;
- custo por Resolução;
- Atendimentos por FTE disponível;
- Resoluções por FTE disponível;
- Receita Direta;
- ROI direto;
- Receita Influenciada por R$ de custo;
- Receita Protegida por R$ de custo.

Clientes atendidos continuam sendo usados como denominador apenas quando a V2.61.1 possui fonte explícita para essa métrica.

## Sincronização

`sync_strategy_product_unit_economics_sources(date,text)` atualiza, na mesma execução:

1. Demanda por Produto;
2. Custo por Produto;
3. Resultado econômico por Produto;
4. FTE nominal/disponível por Produto.

Isso evita cruzar uma fonte recém-atualizada com outra ainda defasada.

A sincronização é bloqueada em competência fechada e exige permissão de edição estratégica.

## Reconciliação

`get_strategy_product_unit_economics_summary(date,text)` valida separadamente:

- Demanda;
- Cost to Serve;
- FTE nominal/disponível;
- Receita Direta;
- Receita Influenciada;
- Receita Protegida.

**Não classificado permanece dentro dos totais**. Nenhum saldo é redistribuído artificialmente para melhorar cobertura ou ROI.

## Limites desta versão

A V2.61.4 não determina qual Squad é “melhor”, não cria ranking composto e não transforma Influenciada/Protegida em receita direta.

A próxima entrega é a **V2.61.5 — Comparativo entre Squads**, que comparará custo, produtividade, FCR, capacidade e resultado econômico preservando o mix de Produtos e a natureza das métricas.
