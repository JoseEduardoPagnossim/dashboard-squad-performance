# V2.49.1 — Período de análise unificado

## Objetivo

Eliminar a contradição visual entre **Competência** e **Período** sem remover a possibilidade de analisar duas ou mais competências. O período continua sendo a fonte oficial dos cálculos.

## Controle único

Nas telas que usam recorte temporal, a topbar exibe **Período de análise**. A Competência deixa de aparecer como um segundo controle concorrente e passa a existir dentro do seletor.

### Por competência

O usuário escolhe uma competência e um recorte:

- Mês completo;
- Até hoje;
- 1ª quinzena;
- 2ª quinzena;
- Personalizado.

O calendário fica limitado às datas disponíveis daquela competência. Ao trocar de competência, o recorte é normalizado para **Mês completo** quando ela está fechada e **Até hoje** quando está em andamento.

### Intervalo livre

O usuário pode selecionar qualquer data dentro dos dados importados, inclusive atravessando duas ou mais competências. O rótulo do controle informa a abrangência, por exemplo: `01/09–08/10 · 2 competências`.

## Regra de cálculo

`state.analysisStartDate` e `state.analysisEndDate` continuam sendo a fonte oficial dos dados de período. `state.currentId` permanece como contexto mensal auxiliar.

Quando o intervalo cruza competências, as metas mensais de atendimento e notas 5 continuam sendo proporcionadas por dias úteis dentro de cada competência e somadas no resultado do período. A meta de taxa de avaliação é ponderada pelos dias úteis efetivamente incluídos em cada competência.

## Compatibilidade

- URLs antigas com `month`, `from` e `to` continuam válidas.
- Visões salvas continuam restaurando os mesmos parâmetros.
- Quando um intervalo antigo cruza meses, a interface abre em **Intervalo livre**.
- Em intervalos de uma única competência, a interface usa **Por competência** sempre que possível.
- Nenhuma migration é necessária.

## Mobile

O drawer aplica a mesma regra do desktop: quando a tela possui período analítico, Competência não aparece como filtro separado. O seletor **Período de análise** concentra a competência e o recorte.
