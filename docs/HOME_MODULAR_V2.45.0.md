# V2.45.0 — Home modular

## Objetivo

Transformar a Home em um painel pessoal sem criar uma nova fonte de dados. Os widgets continuam consumindo exatamente os mesmos indicadores, alertas e contextos já calculados pelo sistema.

## Como personalizar

Na Home, use **Organizar Home**. Durante a edição:

1. arraste um widget para outro para alterar a ordem;
2. escolha o tamanho quando aquele widget permitir;
3. use **Ocultar** para retirar um bloco da Home;
4. use **Restaurar padrão** para voltar ao desenho original no rascunho;
5. clique em **Salvar Home** para persistir.

Cancelar descarta o rascunho.

## Tamanhos

A grade possui 12 colunas. Os widgets aceitam apenas tamanhos que façam sentido para seu conteúdo:

- **Pequeno:** 4 colunas;
- **Médio:** 6 colunas;
- **Largo:** 8 colunas;
- **Total:** 12 colunas.

Indicadores principais, visão de Squads e contexto usam opções mais largas para não comprometer a leitura. Em tablets e celulares o layout reduz automaticamente o número de colunas.

## Persistência

Ordem, visibilidade, densidade e tamanhos ficam em `ui_preferences` do próprio perfil. A V2.45 utiliza a infraestrutura já criada pela V2.38/V2.42 e não exige migration nova.

## Perfis

- **Administrador:** pode usar todos os widgets da Home.
- **Técnico:** personaliza seus widgets, mas a visão consolidada de Squads não é disponibilizada.

## Correção de espaçamento da V2.44

Durante a revisão visual foram encontrados cards herdados que recebiam borda/superfície do Design System, mas não possuíam padding interno próprio. A V2.45 aplica o token `--ds-card-padding` de forma seletiva nos seguintes grupos:

- Configurações e governança;
- Performance/observabilidade;
- Gestão Preditiva;
- Auditoria;
- Perfil/avatar;
- Como usar;
- Jornada do mês;
- distribuição de dias úteis;
- barra de edição da Home.

Os grids relacionados também recebem gap consistente. Componentes que já possuíam padding específico não foram sobrescritos.
