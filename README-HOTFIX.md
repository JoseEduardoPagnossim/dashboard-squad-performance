# V2.57.7 - CI hotfix 2

Este hotfix substitui somente `tests/strategy-operational-costs-v2573.test.js`.

Motivo: o arquivo legado ainda esperava o contrato temporario da etapa V2.57.3 (`buildOperationalAllocationPlan`, `normalizeCostAllocationRow`, RPC antiga e versao 2.57.3). A implementacao final de custos operacionais foi consolidada na V2.57.4 e permanece na V2.57.7 por meio de `calculateOperationalAllocations`, `summarizeOperationalCosts`, `normalizeAllocationRow`, `get_strategy_financial_summary` e `get_strategy_squad_cost_summary`.

Nao altera codigo de producao, banco, migrations ou versao.

Validacao no pacote V2.57.7: `npm run check` -> 432 testes, 432 aprovados, 0 falhas.
