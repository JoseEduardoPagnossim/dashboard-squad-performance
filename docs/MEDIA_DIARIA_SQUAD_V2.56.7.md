# V2.56.7 — Média diária dinâmica por Squad

## Objetivo

Fazer o gráfico **Atendimentos diários x média do período** obedecer ao mesmo filtro global de Squad usado pelo restante do dashboard.

## Regra aplicada

- Com um Squad específico selecionado, somente as linhas diárias daquele Squad entram no gráfico e no cálculo da média.
- Com **Todos os Squads**, os atendimentos de todos os Squads são somados por data antes do cálculo da média geral.
- Dias com total de atendimentos igual a zero continuam fora do denominador, preservando a regra de **dias com atendimento** já usada pelo gráfico.
- O período continua sendo o período global selecionado.

## Comunicação visual

O título, a legenda e o resumo do gráfico agora acompanham o escopo:

- `Squad E` → **Atendimentos diários do Squad E x média do período**.
- `Todos os Squads` → **Atendimentos diários consolidados x média do período**.

O resumo exibe o escopo, período, média diária calculada e quantidade de dias com atendimento.

## Impacto técnico

Alteração frontend-only em `js/app.js` e identificadores de título em `index.html`.

Não há alteração de RPC, Supabase, banco de dados, fórmulas de Qualidade, Gestão Preditiva, bonificação ou importações.
