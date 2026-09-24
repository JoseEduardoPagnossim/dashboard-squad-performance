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
7. `js/roi-rules.js` — fórmulas e agregações puras do ROI, independentes da origem dos dados;
8. `js/app.js` — estado, renderização, orquestração das regras e integrações.

A modularização foi iniciada de forma conservadora para não alterar o comportamento existente. As regras financeiras críticas já foram retiradas do arquivo principal para que o código executado em produção seja o mesmo exercitado pela suíte automática. O próximo passo natural é separar gradualmente áreas como autenticação, importação, indicadores e feedbacks.


## Qualidade automatizada

As suítes `tests/finance-rules.test.js`, `tests/audit-utils.test.js` e `tests/roi-rules.test.js` usam o test runner nativo do Node.js. Elas validam as regras financeiras críticas e as proteções de auditoria sem depender do navegador. O workflow `.github/workflows/quality.yml` executa `npm run validate` e `npm test` em pushes e Pull Requests da branch `main`.

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
- trilha de auditoria administrativa em `audit_logs`;
- premissas do ROI em `support_monthly_costs` e oportunidades em `support_roi_opportunities`.

A estrutura para uma base nova está em `supabase/schema.sql`. A evolução histórica permanece em `supabase/migrations/`.

## Edge Functions

As ações que exigem privilégios elevados, como criação e manutenção de usuários, ficam em `supabase/functions/`. Na V2.29.8 essas funções também registram a auditoria de usuários no backend. Chaves administrativas não devem ser expostas no frontend.

## Dependências carregadas sob demanda

A aplicação carrega bibliotecas externas somente quando necessário, como XLSX para exportação de Excel e jsPDF/AutoTable para PDF. O cliente Supabase também é carregado no navegador.

## GitHub Pages

Não há roteamento SPA dependente do nome do repositório. Os arquivos usam caminhos relativos, mantendo compatibilidade com:

`https://joseeduardopagnossim.github.io/dashboard-squad-performance/`


## Arquitetura do ROI

O ROI segue a separação **origem → resolução mensal → regra pura → apresentação**. `js/app.js` coleta dados do monitor, CSV ou cadastro manual e monta o objeto mensal; `js/roi-rules.js` calcula os indicadores sem conhecer Supabase, CSV ou DOM. Isso permite substituir uma fonte por API no futuro sem alterar a fórmula financeira.
