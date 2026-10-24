# V2.60.6 — ROI e retorno operacional

## Objetivo
Cruzar o resultado econômico da Fase 5 com a base de custos já existente, sem criar uma segunda fonte financeira e sem misturar Receita Direta, Influenciada e Protegida.

## Regra econômica
O **ROI direto** usa exclusivamente Receita Direta confirmada:

- **Retorno líquido direto** = Receita Direta − Custo
- **ROI direto (%)** = (Receita Direta − Custo) ÷ Custo × 100
- **Cobertura do custo** = Receita Direta ÷ Custo

Receita Influenciada e Receita Protegida não entram no ROI. Elas aparecem como indicadores complementares:

- **Influenciada / R$ de custo** = Receita Influenciada ÷ Custo
- **Protegida / R$ de custo** = Receita Protegida ÷ Custo

Isso impede que valor comercial influenciado ou receita preservada seja tratado como faturamento direto.

## Escopos
### Operação / Squad
Usa o custo total da competência, incluindo custo de pessoas e custo operacional rateado. A visão por Squad usa o mesmo rateio financeiro já utilizado no módulo Custos & Eficiência.

### Técnico
Usa somente o custo pessoal cadastrado para o técnico na competência. Técnicos sem custo vinculado permanecem visíveis, porém ROI, cobertura e razões por custo ficam indisponíveis.

## Integridade
- custo zero não gera ROI infinito;
- valores sem denominador aparecem como indisponíveis;
- Receita Direta, Influenciada e Protegida continuam separadas;
- ROI individual exige permissão `people_costs`;
- ROI por Squad/operação exige acesso a agregados;
- o motor reutiliza `get_strategy_financial_summary`, `get_strategy_squad_cost_summary`, `get_strategy_result_squad_summary` e `get_strategy_result_technician_summary`.

## RPCs
A migration V2.60.6 adiciona:

- `get_strategy_result_roi_summary(date,text)` — retorno operacional e por Squad;
- `get_strategy_result_technician_roi_summary(date,text)` — retorno individual protegido.

## Motor
`RE-0.7.0-roi-return`

A próxima etapa da Fase 5 é a **V2.60.7 — Insights e diagnóstico de resultado**.
