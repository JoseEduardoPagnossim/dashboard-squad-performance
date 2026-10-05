# V2.47.0 — Busca global, Ctrl+K, breadcrumbs e URLs persistentes

## Objetivo

A V2.47 cria uma camada única de navegação para o Performance Hub. Menu lateral, busca global, breadcrumbs, histórico do navegador e links persistentes passam a apontar para a mesma rota interna.

A implementação é **frontend-only** e não exige migration de banco.

## Busca global / Ctrl+K

O atalho **Ctrl+K** (ou **Cmd+K** no macOS) abre a busca global a partir de qualquer tela autenticada.

A busca indexa somente destinos disponíveis para o perfil atual, incluindo:

- telas principais;
- Central de Alertas;
- seções de Indicadores;
- módulos de Configurações;
- áreas administrativas permitidas;
- Squads disponíveis para Administradores;
- técnicos encontrados nas competências já carregadas do Squad atual.

A busca ignora diferenças de acentuação e aceita múltiplos termos. Exemplo: `qualidade tecnico` encontra o detalhamento de qualidade mesmo sem o usuário digitar o nome exato da tela.

### Teclado

- `Ctrl+K` / `Cmd+K`: abrir ou fechar;
- `↑` / `↓`: navegar pelos resultados;
- `Enter`: abrir o resultado selecionado;
- `Esc`: fechar.

## Breadcrumbs

A faixa logo abaixo do cabeçalho mostra a hierarquia funcional da tela atual.

Exemplos:

- `Início > Desempenho > Indicadores > Qualidade`;
- `Início > Gestão > Financeiro > Bonificação`;
- `Início > Configurações > Aparência e gráficos`.

Níveis que representam um destino real são clicáveis. O breadcrumb é derivado do mesmo estado usado pela URL, evitando divergência entre título, menu e conteúdo.

## URLs persistentes

A navegação normal usa parâmetros próprios, sem reaproveitar a rota especial da TV.

Principais parâmetros:

```text
page
section
module
indicator
squad
month
tech
from
to
```

Exemplo:

```text
?page=indicators&indicator=quality&squad=D&month=2026-10&from=2026-10-01&to=2026-10-05
```

### Comportamento

- trocar de tela cria uma entrada no histórico do navegador;
- trocar filtro atualiza a URL com `replaceState`, sem poluir o botão Voltar;
- Voltar/Avançar restaura tela, seção e principais filtros;
- atualizar a página restaura a rota após o login;
- links copiados podem abrir diretamente a mesma área, respeitando as permissões do usuário;
- rotas não permitidas não elevam privilégio e são ignoradas/fallback para uma área válida.

## Compatibilidade com Apresentação / TV

A rota persistente normal usa `page=presentation`.

O modo TV já existente continua usando:

```text
view=presentation
```

com os parâmetros próprios de TV, playlist, intervalo, escala e densidade. Isso impede que um link normal para a tela Apresentação ative por engano o modo de exibição dedicado.

## Permissões

A busca global não é uma forma de contornar o menu. Resultados são montados depois das permissões efetivas do usuário.

- Administradores continuam com acesso integral conforme o modelo atual;
- Técnicos visualizam somente destinos liberados;
- módulos administrativos, Indicadores, Auditoria, Usuários, Alertas e Apresentação continuam passando pelas mesmas validações já usadas na navegação convencional.

## Arquitetura

Novo módulo:

`js/navigation-engine.js`

Responsabilidades puras do motor:

- normalização da rota;
- leitura e serialização dos parâmetros persistentes;
- normalização textual da busca;
- pontuação e ordenação dos comandos da busca global.

`js/app.js` permanece responsável por permissões, aplicação da rota ao estado da aplicação, breadcrumbs e interação com a interface.

## Banco de dados

**Nenhuma migration nova.**

A V2.47 não cria tabelas, policies, funções ou colunas no Supabase.
