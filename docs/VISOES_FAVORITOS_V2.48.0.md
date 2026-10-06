# V2.48.0 — Visões salvas, filtros persistentes e favoritos

## Objetivo

Transformar a navegação persistente da V2.47 em um espaço pessoal de trabalho, permitindo que cada usuário retome rapidamente análises recorrentes sem refazer filtros.

## Visões salvas

O botão **Visões** no topo permite salvar a tela atual com um nome. O snapshot guarda, quando aplicável:

- página;
- seção administrativa, módulo de Configurações ou subseção de Indicadores;
- Squad;
- competência;
- técnico;
- período De / Até.

As visões podem ser abertas, renomeadas, excluídas e adicionadas/removidas dos favoritos. O limite defensivo é de 30 visões por usuário.

## Favoritos

A estrela ao lado do botão Visões adiciona ou remove a rota atual dos favoritos. O favorito captura a combinação atual de tela e filtros, e não apenas o nome da página.

Favoritos aparecem no painel **Visões** e também no `Ctrl+K`, com prioridade maior na busca vazia. O limite é de 20 favoritos por usuário.

## Filtros persistentes

Quando ativados, o sistema lembra automaticamente `Squad`, `mês`, `técnico`, `De` e `Até` por contexto funcional. Exemplos de contextos independentes:

- `team`;
- `individual`;
- `indicators:performance`;
- `indicators:quality`;
- `admin:finance`;
- `settings:appearance`.

A opção pode ser desligada no painel Visões. Também existe a ação **Limpar filtros lembrados**.

### Ordem de precedência

1. parâmetros explícitos da URL ou de uma visão salva;
2. filtros lembrados do contexto;
3. valores padrão carregados para a sessão.

Isso evita que a memória pessoal altere links compartilhados ou atalhos nomeados.

## Persistência

A V2.48 reutiliza `profiles.ui_preferences` e `save_my_ui_preferences`, já disponíveis desde a V2.38.0. Em modo demonstração ou quando a sincronização remota estiver indisponível, o mesmo payload é preservado em `localStorage`.

Não há migration nova.

## Segurança e permissões

Salvar uma rota não concede acesso. Ao listar favoritos/visões ou tentar abri-los, a aplicação recalcula as permissões atuais. Se o perfil perder acesso a uma área, o atalho deixa de ser exibido/aberto mesmo que permaneça salvo no JSON pessoal.
