# V2.41.0 — Experiência inicial e Home

## Objetivo

A V2.41.0 melhora o primeiro contato com o Soften Performance Hub sem alterar as regras operacionais do produto. A versão atua em quatro frentes: login, consistência visual, Home pós-login e estados vazios orientativos.

## Novo login

- usa a logo oficial da Soften já distribuída em `assets/soften-logo-sidebar.png`;
- separa identidade do produto e formulário de acesso em duas áreas no desktop;
- mantém o formulário em uma única coluna em telas menores;
- padroniza altura de controles, raio, espaçamento e proporções dos botões;
- preserva autenticação e modo claro/escuro existentes.

A V2.41.0 não altera o fluxo de autenticação Supabase. A otimização do caminho crítico de login e carregamento continua reservada para a etapa estrutural de performance.

## Nova Home

`Início` passa a ser a primeira tela após o login. O conteúdo é montado conforme o perfil conectado.

### Técnico

Exibe resumo individual da competência, com atendimentos, Nota 5, percentual de avaliação, bonificação disponível, alertas pessoais e atalhos para Meu desempenho e demais áreas permitidas.

### Admin de Squad

Exibe indicadores do Squad, projeção, técnicos em atenção, alertas preditivos e atalhos para Operação, Indicadores, Bonificação, Apresentação e Configurações conforme as permissões efetivas.

### Admin Geral

Exibe panorama consolidado da organização, alertas globais e cartões resumidos dos Squads, além de acesso rápido ao comparativo consolidado e funções administrativas permitidas.

## Empty states

Telas sem contexto deixam de ficar silenciosas. Quando não há competência, vínculo técnico ou dados suficientes, a interface informa o motivo e, quando a permissão permite, oferece ações como:

- abrir a Central de Importação;
- consultar o Como usar;
- navegar para outra área válida;
- entender que ainda não há dados para a competência.

Os botões respeitam a mesma matriz de permissões já usada pela aplicação.

## Proporções visuais

A versão adiciona tokens de interface para card, controles e botões e os aplica ao login e aos novos componentes da Home. O objetivo é reduzir diferenças de altura e espaçamento sem redesenhar os módulos consolidados.

## Compatibilidade

- não altera tabelas ou RPCs do Supabase;
- não exige migration;
- não muda regras financeiras;
- não muda regras de importação;
- não muda playlists ou monitoramento de TV;
- preserva permissões granulares e layouts pessoais existentes.

## Qualidade

A V2.41.0 adiciona testes específicos para:

- logo oficial no login e no boot;
- Home como rota inicial;
- renderização contextual por perfil;
- KPIs, alertas, atalhos e visão de Squads;
- empty states acionáveis;
- proporções e regras responsivas.

A suíte totaliza **96 testes automatizados**.
