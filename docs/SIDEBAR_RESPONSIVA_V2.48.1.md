# V2.48.1 — Sidebar responsiva em zoom e viewport reduzida

## Problema

Em desktop, quando a altura útil do navegador diminuía — inclusive ao voltar o zoom para 100% em determinadas resoluções — o menu consumia quase toda a sidebar. Regras antigas ainda ocultavam a campanha em `max-height: 820px` e a versão podia ficar fora da área visível.

## Solução

A sidebar foi separada em áreas com responsabilidades claras:

- cabeçalho: fixo dentro da sidebar;
- navegação: única área com scroll vertical;
- campanha: preservada e compactável;
- player e versão: preservados no rodapé.

No desktop a sidebar usa `100dvh`, `overflow: hidden` e `sidebar-nav` usa `flex: 1`, `min-height: 0` e `overflow-y: auto`. A arte da campanha reduz sua altura abaixo de 900 px e novamente abaixo de 760 px, em vez de desaparecer.

O modo recolhido continua ocultando a campanha intencionalmente e o comportamento mobile permanece independente.

## Banco

Não exige migration e não altera dados, permissões, filtros ou regras de negócio.
