# R30.6.1 - Correcao do calendario duplicado e da apresentacao responsiva

**Base requerida:** R30.6 publicada. Este e um hotfix incremental; nao ha SQL.

## Problema
Ao clicar no icone a direita do campo, o navegador ainda poderia abrir seu seletor nativo; ao clicar na area principal, abria o calendario Soften, com layout sujeito a sobreposicoes e zoom.

## Correcao
- O input nativo continua preservado como fonte de valor (inclusive `input`/`change`), mas fica totalmente oculto e inacessivel ao clique.
- Campo e icone usam exclusivamente o botao personalizado para abrir o calendario Soften.
- O modal ganhou estilos isolados, largura controlada, corpo com rolagem e rodape visivel.
- O seletor de ano do calendario usa um campo numerico simples para evitar interferencia de controles de selecao personalizados.
- Nao altera datas gravadas, operacoes financeiras ou competencias.

## Aplicacao
Extraia o conteudo deste ZIP **diretamente na raiz do repositorio**, junto ao `index.html`, mantendo `css/`, `js/` e `tests/`. Nao crie subpasta `dashboard-squad-performance`.

Execute `npm run check`; faca commit e push; confira o GitHub Actions; atualize com `Ctrl+Shift+R`.

Se o navegador continuar exibindo um seletor cinza, confira no codigo fonte publicado se `date-controls.js?v=2.63.9-r3062` foi carregado e se `css/styles.css?v=2.63.9-r3062` corresponde a nova revisao.
