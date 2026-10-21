# V2.56.3 — Filtro de Squad unificado em Indicadores

## Problema observado

Ao alterar o Squad diretamente na subaba **Qualidade**, o filtro visual mudava, porém os dados só passavam a respeitar o novo Squad depois de abrir **Desempenho** e retornar para **Qualidade**.

## Causa

As versões V2.56.1 e V2.56.2 adicionaram um controlador de hidratação exclusivo para Qualidade. Apesar de reutilizar internamente o mesmo carregador de competências, a troca de Squad passou a possuir dois ciclos assíncronos diferentes:

- Desempenho: `hydrateCurrentViewAsync(...)`;
- Qualidade: `hydrateIndicatorSquadFilter(...)`.

Esse desvio permitia que a subaba Qualidade permanecesse fora do mesmo ciclo de atualização que já funcionava corretamente em Desempenho.

## Correção

A V2.56.3 elimina o controlador paralelo e deixa um único fluxo de atualização:

1. o Squad é atualizado no estado global;
2. os seletores e a tela são redesenhados imediatamente;
3. `hydrateCurrentViewAsync(...)` carrega os meses completos necessários;
4. o token global confirma que Squad, período e subaba ainda são os mesmos;
5. a tela é redesenhada com o novo escopo.

A Qualidade continua exibindo um estado de atualização quando o mês do novo Squad ainda está somente em modo resumo, evitando reaproveitar números do escopo anterior.

## Escopo

- sem migration;
- sem alteração de schema;
- sem alteração das fórmulas de Qualidade;
- sem alteração das fórmulas de Desempenho ou Gestão Preditiva;
- sem alteração de bonificação ou importação.

## Validação

Os testes de regressão verificam que não existe mais `hydrateIndicatorSquadFilter`, que a troca direta de Squad chama o mesmo `hydrateCurrentViewAsync(...)` usado pelo restante da tela e que o cache-bust da versão está alinhado em todos os assets principais.
