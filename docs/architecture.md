# Arquitetura

## Frontend

O Soften Performance Hub é uma aplicação estática, sem etapa de build. O navegador carrega `index.html`, os estilos em `css/styles.css` e os scripts em `js/`.

A ordem de carregamento dos scripts é importante:

1. `js/config.js` — seleciona modo `supabase` ou `demo`;
2. `js/core-utils.js` — formatação, seletores e utilidades compartilhadas;
3. `js/audit-utils.js` — confirmação crítica, sanitização e rótulos de auditoria;
4. `js/demo-users.js` — usuários fictícios do modo de demonstração;
5. `js/default-data.js` — dados fictícios do modo de demonstração;
6. `js/finance-rules.js` — regras financeiras puras, compartilhadas pela aplicação e pelos testes automatizados;
7. `js/app.js` — estado, renderização, orquestração das regras e integrações.

A modularização foi iniciada de forma conservadora para não alterar o comportamento existente. As regras financeiras críticas já foram retiradas do arquivo principal para que o código executado em produção seja o mesmo exercitado pela suíte automática. O próximo passo natural é separar gradualmente áreas como autenticação, importação, indicadores e feedbacks.


## Qualidade automatizada

As suítes `tests/finance-rules.test.js` e `tests/audit-utils.test.js` usam o test runner nativo do Node.js. Elas validam as regras financeiras críticas e as proteções de auditoria sem depender do navegador. O workflow `.github/workflows/quality.yml` executa `npm run validate` e `npm test` em pushes e Pull Requests da branch `main`.

Essa separação permite alterar o painel visualmente ou evoluir a lógica financeira com uma verificação automática de regressões antes da publicação.

## Persistência

Em produção, o frontend usa Supabase para:

- autenticação;
- dados de organizações, Squads, técnicos e competências;
- métricas operacionais e de qualidade;
- configurações financeiras;
- feedbacks;
- temas;
- custos e impacto financeiro;
- RPCs de consolidação/ranking;
- trilha de auditoria administrativa em `audit_logs`.

A estrutura para uma base nova está em `supabase/schema.sql`. A evolução histórica permanece em `supabase/migrations/`.

## Edge Functions

As ações que exigem privilégios elevados, como criação e manutenção de usuários, ficam em `supabase/functions/`. Na V2.29.8 essas funções também registram a auditoria de usuários no backend. Chaves administrativas não devem ser expostas no frontend.

## Dependências carregadas sob demanda

A aplicação carrega bibliotecas externas somente quando necessário, como XLSX para exportação de Excel e jsPDF/AutoTable para PDF. O cliente Supabase também é carregado no navegador.

## GitHub Pages

Não há roteamento SPA dependente do nome do repositório. Os arquivos usam caminhos relativos, mantendo compatibilidade com:

`https://joseeduardopagnossim.github.io/dashboard-squad-performance/`


## Núcleo de gráficos — V2.35.0

`js/chart-engine.js` é carregado antes de `js/app.js` e concentra a infraestrutura compartilhada de gráficos: normalização das preferências, escala percentual, altura, estilo de linhas/pontos, densidade de rótulos, geração de caminhos/áreas SVG, gradientes e interação de tooltip/legenda.

Os renderizadores de negócio continuam em `app.js` nesta etapa para preservar o comportamento das telas, mas consomem o mesmo motor. Novos gráficos devem usar `window.SoftenChartEngine` e não recriar primitivas equivalentes localmente. O script `scripts/validate-project.mjs` verifica essa dependência e bloqueia regressões de duplicação.

## V2.37.0 — Motor preditivo

`js/predictive-engine.js` concentra funções puras de projeção por dias úteis, comparação entre competências, confiança da projeção, risco individual e alertas automáticos. O `app.js` permanece responsável por preparar os dados da competência e renderizar a experiência do usuário. O motor preditivo não grava dados e não interfere no fechamento oficial, nas metas ou na bonificação.

## V2.38.0 — Configurações e personalização

- `js/settings-engine.js` centraliza matriz de permissões por papel, overrides restritivos e definição dos layouts personalizáveis.
- `profiles.permissions` guarda somente restrições específicas; o papel base continua sendo o teto de acesso.
- `profiles.ui_preferences` guarda layout/densidade pessoal e pode ser atualizado pelo próprio usuário via `save_my_ui_preferences`.
- A aplicação mantém fallback em `localStorage`, preservando o funcionamento caso a migration ainda não tenha sido aplicada.
- A Central de Configurações funciona como ponto de entrada para preferências pessoais e atalhos administrativos.

