# V2.59.6 R1 — Hotfix do resumo de Capacidade

## Sintoma

Os dados de disponibilidade e resolução apareciam corretamente nas tabelas por Squad e na aba Eficiência, mas os cards consolidados da aba Capacidade exibiam `—`.

## Causa

O resumo carregado do Supabase era normalizado com os campos novos (`availableFte`, `availabilityComplete`, `resolutions`, `resolutionEntries`, `usedCapacityVolume` etc.). Porém, ao construir o `viewModel`, `mergeFinancialSummary()` reconstruía apenas os campos financeiros legados e descartava os campos estendidos.

## Correção

`mergeFinancialSummary()` agora preserva os campos normalizados recebidos e sobrescreve apenas os campos financeiros que precisa recalcular. Assim, os cards consolidados recebem a mesma base já usada pelas tabelas por Squad.

## Impacto

- não altera dados no banco;
- não altera FCR;
- não altera disponibilidade cadastrada;
- não altera FTE necessário ou gap;
- não exige reimportação;
- não exige migration;
- cache-buster atualizado para `2.59.6-r1`.
