# V2.48.14 — Meu desempenho

## Objetivo
Separar visualmente **competência mensal** de **período selecionado** para que o técnico não interprete a meta proporcional do recorte como meta mensal concluída.

## Hierarquia
1. Hero do técnico — contexto geral e competência oficial.
2. Ritmo do mês — progresso mensal de Atendimentos e Notas 5 + ritmo necessário.
3. Desempenho no período selecionado — única exibição da data exata do recorte.
4. KPIs do período — Atendimentos, Notas 5, % Avaliado e Nota média.
5. Pontuação oficial do mês — explicitamente mensal.

## Redundâncias removidas
- O período exato não é mais repetido no hero e no resumo do histórico diário.
- O card antigo “Como está o seu ritmo?” foi removido porque sua informação foi consolidada no novo resumo mensal.
- “Meta mensal completa” saiu dos KPIs de período; o rodapé agora usa “Meta mensal” e “Progresso do mês” apenas como contexto.

## Regras preservadas
Nenhum cálculo de meta, pontuação, status, bonificação, ranking ou filtro foi alterado. O novo layout apenas reapresenta valores já calculados pelo sistema.
