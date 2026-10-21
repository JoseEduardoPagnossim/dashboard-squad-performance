# V2.56.5 — Filtro de Squad da Qualidade com recarga confirmada

## Sintoma

Em **Indicadores > Qualidade**, a troca direta do filtro de Squad podia manter os números do escopo anterior. Ao abrir **Desempenho** e retornar para **Qualidade**, a tela passava a refletir o novo Squad.

## Causa tratada

A Qualidade dependia do objeto mensal já residente em memória. Mesmo com `state.squadCode` atualizado, um mês marcado como `full` podia ser reaproveitado sem uma nova leitura do Supabase na troca explícita de Squad. Além disso, a função de renderização recebia `squads` e `rangeIds` calculados pelo chamador, o que deixava uma janela para reutilização de um escopo anterior em renderizações encadeadas.

A V2.56.5 fecha os dois pontos:

1. na troca manual de Squad enquanto **Qualidade** está aberta, o carregador mensal é executado com `forceMonths=true`, reconsultando os meses do novo escopo;
2. `renderQualityIndicators()` recalcula `squads` e `rangeIds` diretamente do estado global imediatamente antes dos cálculos.

## Compatibilidade

- Desempenho continua usando o mesmo `ensureViewData` e não recebe recarga forçada;
- fórmulas de Serviço, Produto e Empresa não foram alteradas;
- período global e persistência de filtros não foram alterados;
- nenhuma migration é necessária.

## CI

O repositório ainda continha `tests/indicator-squad-filter-v2563.test.js`, mas o pacote anterior não continha esse arquivo. Ele mantinha três expectativas antigas (versão 2.56.3 e assinatura anterior de carregamento), causando exatamente **3 falhas** no GitHub Actions. A V2.56.5 inclui e atualiza esse teste.
