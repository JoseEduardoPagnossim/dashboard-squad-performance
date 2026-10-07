# V2.48.10 — Bonificação orientada ao fechamento

## Objetivo

Reduzir ruído visual e transformar a Bonificação em uma tela de fechamento financeiro, priorizando os indicadores que efetivamente alimentam o cálculo e os valores por técnico.

## Alterações

- Removidos os cards de transição/atalho para a Central de Configurações em Operação, Bonificação e Apresentação/TV.
- O bloco **Fechamento Financeiro / Técnicos do Squad** passa a ser o primeiro conteúdo operacional do módulo financeiro.
- No topo do fechamento são exibidos:
  - média de atendimentos por técnico/dia do Squad (`financeComparison.groupAvgPerDay`);
  - taxa de Notas 5 do Squad (`financeComparison.groupNotes5Pct`);
  - cancelados da competência, taxa e multiplicador de cancelamento.
- Os KPIs não possuem fórmulas paralelas: leem o mesmo consolidado gerado pelo motor financeiro.
- O contexto mostra competência, modelo oficial, dias úteis e quantidade de técnicos considerada na Base do Squad.
- Histórico de cálculo/auditoria e simulador foram movidos para o fim do módulo e ficam recolhidos por padrão.

## Segurança de regressão

A versão não modifica o motor `finance-rules.js`, a versão `FR-2.48.8-1`, filtros de Squad/mês/técnico, sidebar, topbar, RLS ou schema do Supabase. Não há migration nova.
