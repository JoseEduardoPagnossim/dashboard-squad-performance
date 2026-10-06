# V2.48.3 — Tipografia configurável, controles e salvamento

## Tipografia
- Inter
- Roboto
- Source Sans 3

A escolha é armazenada em `theme.fontFamily`, acompanha exportação/importação JSON e é aplicada por `--app-font-family`.

## Controles padronizados
Foram revisados `select`, checkbox, radio, range, campos temporais, cores e upload da imagem de fundo. Os controles preservam a funcionalidade nativa necessária, mas passam a usar a mesma linguagem visual do Design System.

## Salvamento explícito
O modal **Personalizar tema** não persiste mais cada alteração enquanto o usuário digita. As mudanças são pré-visualizadas localmente e só são gravadas após **Salvar tema**. Cancelar, fechar no X ou clicar no backdrop restaura o snapshot anterior.

As demais telas administrativas já possuíam ações explícitas de salvar (metas, regras, financeiro, custos, layout, apresentação, usuários e gráficos) e foram mantidas.
