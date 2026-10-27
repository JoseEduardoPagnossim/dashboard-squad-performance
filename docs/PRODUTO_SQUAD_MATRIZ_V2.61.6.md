# V2.61.6 — Matriz Produto × Squad

Matriz aditiva que consome exclusivamente `get_strategy_product_unit_economics_summary` (V2.61.4), uma consulta por Squad, em lotes de cinco.

Indicadores: custo por atendimento, custo por resolução, atendimentos por FTE, resoluções por FTE, ROI direto, resultado direto líquido e volume de atendimentos.

Melhor/pior são relativos ao mesmo Produto com pelo menos dois valores válidos. Empates e valores ausentes não recebem classificação. FTE depende de disponibilidade e reconciliação. Receita influenciada/protegida não integra ROI.

Não exige migration: reaproveita as RPCs e controles de permissão vigentes. Testar no Supabase real antes da liberação em produção.
