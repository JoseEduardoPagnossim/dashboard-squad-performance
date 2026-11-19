# R30.6.2 — Correcao do calendario nativo duplicado

## Diagnostico
O `js/design-system.js` ainda criava um botao `ds-picker-button` para campos `date`, `month` e `datetime-local`. Esse botao acionava `input.showPicker()`, abrindo o calendario nativo do navegador. Ao mesmo tempo, `js/date-controls.js` gerava o novo calendario Soften.

## Correcao
- O Design System deixa de criar o botao nativo dos campos de data/competencia.
- O Date Controls remove wrappers legados e utiliza somente o acionador personalizado.
- Os inputs originais seguem preservados para gravacao de valores, eventos e integracoes.
- Revisao dos assets: `2.63.9-r3062`.
- Sem migration SQL.

## Instalacao
Extrair o ZIP na raiz **ja existente** do repositorio Git (a mesma de `index.html` e `package.json`). Nao colocar outra pasta `dashboard-squad-performance` dentro dela. Substituir os arquivos, executar `npm run check`, commitar e publicar.

## Validacao
`npm run check`: 1197 testes aprovados, zero falhas. Conferir na hospedagem, clicando no campo e no icone de Competencia selecionada. Ambos devem abrir somente o calendario Soften.
