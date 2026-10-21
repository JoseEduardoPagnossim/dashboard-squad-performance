# V2.56.6 — Visibilidade correta das subabas de Indicadores

## Problema

Ao abrir ou atualizar diretamente **Indicadores > Qualidade**, o painel de **Desempenho** podia reaparecer mesmo estando marcado com a classe `hidden`. Isso fazia a tela exibir cards de Desempenho zerados e dava a impressão de que o filtro de Squad da Qualidade não havia sido respeitado.

## Causa

O painel de Desempenho também é a raiz do layout personalizado de Indicadores. A classe `personal-layout-root` aplicava `display:flex!important`, enquanto `hidden` aplicava `display:none!important`. Como o seletor do layout tinha maior especificidade, ele reexibia o painel que a navegação tinha acabado de ocultar.

## Correção

A regra de layout pessoal agora só força `display:flex` quando a raiz **não** estiver oculta:

```css
.personal-layout-root:not(.home-widget-grid):not(.hidden){
  display:flex!important;
  flex-direction:column;
  min-width:0;
}
```

Assim, uma subaba com `hidden` permanece invisível mesmo que também carregue `personal-layout-root`.

## Escopo

- sem alteração de cálculos;
- sem alteração de carregamento de dados;
- sem migration;
- preserva a Home modular e os layouts pessoais existentes;
- corrige especificamente o conflito de visibilidade entre subabas de Indicadores.
