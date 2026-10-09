# V2.50.0 — Análise comparativa e transparência dos indicadores

## Objetivo

Evoluir o Performance Hub de uma leitura apenas do resultado atual para uma leitura de **evolução** e **explicabilidade**, sem adicionar novos filtros globais nem duplicar fontes de verdade.

## Comparação de períodos

A comparação fica dentro de **Meu desempenho** e é opcional. O período principal continua sendo definido pelo **Período de análise** da topbar.

Modos disponíveis:

- **Sem comparação** — comportamento padrão;
- **Mês anterior · mesmo recorte** — desloca início e fim em um mês. Exemplo: 01/10–08/10 compara com 01/09–08/09;
- **Período anterior equivalente** — usa a mesma quantidade de dias imediatamente antes do início do recorte. Exemplo: 01/10–08/10 compara com 23/09–30/09.

Os KPIs comparados são:

- Atendimentos;
- Notas 5;
- % avaliado;
- Nota média.

A Pontuação oficial não entra na comparação do recorte porque continua sendo um indicador mensal oficial.

## Carregamento sob demanda

Quando o período comparativo exige uma competência que ainda está apenas em resumo, o dashboard carrega somente as competências necessárias ao comparativo. O período principal não é alterado e a URL não ganha parâmetros extras.

## Entenda este número

Os cinco KPIs principais passam a ter a ação **Entenda este número**. A dialog informa:

- resultado exibido;
- período ou competência correspondente;
- componentes do cálculo;
- meta ou referência utilizada;
- fórmula aplicada;
- observações específicas da regra.

### Atendimentos e Notas 5

A meta proporcional é calculada competência por competência, usando os dias úteis do recorte em relação aos dias úteis do mês.

### % avaliado

A taxa usa `total de avaliações / atendimentos elegíveis`. Em competência completa, atendimentos configurados como sem disparo de avaliação são retirados da base. Em períodos parciais, permanece a leitura diária bruta vigente.

### Nota média

A média é ponderada pelas quantidades de notas 1 a 5 e segue a regra vigente de truncamento em duas casas.

### Pontuação oficial

Continua mensal. A explicação mostra os quatro critérios, referências, pesos, quantidade de critérios atingidos, status e ranking.

## Arquitetura

`js/comparison-engine.js` concentra funções puras de:

- deslocamento mensal com ajuste de último dia;
- período anterior de mesma duração;
- deltas absolutos, percentuais e em pontos percentuais;
- classificação visual da variação.

A agregação operacional recebeu suporte explícito a `start/end`, para que comparações não dependam de `analysisStartDate` e `analysisEndDate` globais.

## Banco de dados

Nenhuma migration é necessária para a V2.50.0.
