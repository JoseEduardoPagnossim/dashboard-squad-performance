# V2.48.6 — Regressão de layout e integridade horizontal

## Sintoma
Após a V2.48.5, a aplicação podia criar uma largura de documento muito maior que a viewport. Ao navegar ou focar controles no topo, o navegador podia deslocar horizontalmente a página; a sidebar saía da área visível e sobrava uma grande faixa vazia à direita.

## Causa
O Design System mantém o `<select>` original como fonte de valor para preservar listeners e regras de negócio. Ele recebe `ds-select-source` e deveria medir apenas 1px. Porém, regras legadas de alta especificidade, como `#squadSelect`, `#monthSelect` e `#techSelect`, aplicavam `width:100%!important`. Por terem maior especificidade, venciam a classe de ocultação. O select ficava invisível, mas com a largura do topbar e em posição absoluta, ampliando `scrollWidth`.

## Correção
- `#appShell select.ds-select-source` passa a ter prioridade sobre regras legadas.
- `width`, `min-width` e `max-width` ficam travados em 1px.
- `height`, `min-height` e `max-height` ficam travados em 1px.
- posição e contenção são explicitamente neutralizadas para não participar da geometria global.
- o proxy visual continua sendo irmão do select original; o select não é movido nem substituído.
- menus do proxy continuam em portal fixo e limitados à viewport.

## Validação
A validação de navegador mede `document.documentElement.scrollWidth` em múltiplas larguras e confirma que o shell não cria overflow horizontal. Também verifica troca de Squad/mês/técnico, eventos `input/change`, opções dinâmicas, estados disabled e abertura/fechamento dos proxies.

## Banco
Não exige migration.
