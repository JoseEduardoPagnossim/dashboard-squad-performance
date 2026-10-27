# V2.61.5 — Comparativo entre Squads

Usa os resultados oficiais consolidados por competência: `get_strategy_squad_cost_summary`, `get_strategy_resolution_squad_summary`, `get_strategy_capacity_squad_summary`, `get_strategy_capacity_used_squad_summary` e `get_strategy_result_squad_summary`. Sem novas tabelas ou funções SQL.

ROI direto: (receita direta − custo total) / custo total; receitas influenciada e protegida não entram no ROI. FCR segue resolução / atendimentos oficiais. FTE disponível só é mostrado quando a disponibilidade está completa. Capacidade utilizada é volume oficial, não taxa de utilização. Escopo de Squad segue o filtro estratégico atual. Sem ranking automático de taxas incompletas.

## Implantação

Substitua os arquivos do ZIP, mantenha as migrations anteriores e execute `npm run check`. Não há migration V2.61.5. Para comparação entre todos os Squads selecione **Todos os Squads** no filtro.
