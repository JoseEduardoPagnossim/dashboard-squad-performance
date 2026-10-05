# V2.45.1 — Correção da Home modular e espaçamento

## Problema corrigido

A V2.45.0 aplicava `personal-layout-root` também ao `homeWidgetGrid`. A regra antiga desse layout usava `display:flex!important`, enquanto a Home modular dependia de `display:grid`. O `flex` tinha prioridade e fazia todos os widgets ficarem empilhados à esquerda; por isso alterar Pequeno/Médio/Largo/Total não mudava a largura real na tela.

## Correção da grade

- O comportamento `flex` do layout pessoal agora é aplicado apenas às telas legadas que dependem dele.
- `homeWidgetGrid` permanece explicitamente em `display:grid!important`.
- A grade mantém 12 colunas no desktop e os breakpoints já previstos para tablet/celular.
- O container e os widgets deixam de carregar limitações de largura incompatíveis com a grade.

## Widgets ocultos

Também foi corrigido o ciclo Salvar/Cancelar:

- fora do modo de edição, widgets ocultos recebem `layout-user-hidden`;
- durante a edição, eles ficam visíveis de forma atenuada (`home-widget-edit-hidden`) para poderem ser reativados;
- widgets indisponíveis para o perfil (como Visão de Squads para Técnico) não reservam espaço vazio na grade;
- Cancelar restaura exatamente o layout salvo;
- Salvar aplica ordem, visibilidade e tamanho persistidos.

## Mapeamento de espaçamento

A revisão passou a tratar com o token `--ds-card-gap` os principais contêineres e separadores estruturais que ainda usavam valores isolados ou podiam aparentar cards sem margem:

- Home e grade de widgets;
- Configurações;
- Gestão preditiva;
- Perfil;
- Distribuição por dias úteis;
- Históricos de Squad e Indicadores;
- cabeçalhos de histórico, Usuários, Ajuda, Auditoria, Configurações e Perfil;
- barra de comando de Configurações.

O padding interno seletivo criado na V2.45.0 foi mantido para cards herdados sem padding próprio.

## Banco e regras de negócio

Não exige migration. Não altera Supabase, metas, cálculos de performance, bonificação ou regras financeiras.
