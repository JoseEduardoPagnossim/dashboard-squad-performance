# Arquitetura

## Frontend

O Soften Performance Hub é uma aplicação estática, sem etapa de build. O navegador carrega `index.html`, os estilos em `css/styles.css` e os scripts em `js/`.

A ordem de carregamento dos scripts é importante:

1. `js/config.js` — seleciona modo `supabase` ou `demo`;
2. `js/core-utils.js` — formatação, seletores e utilidades compartilhadas;
3. `js/demo-users.js` — usuários fictícios do modo de demonstração;
4. `js/default-data.js` — dados fictícios do modo de demonstração;
5. `js/app.js` — estado, regras de negócio, renderização e integrações.

A modularização foi iniciada de forma conservadora para não alterar o comportamento existente. O próximo passo natural é separar gradualmente áreas como autenticação, importação, indicadores, finanças e feedbacks.

## Persistência

Em produção, o frontend usa Supabase para:

- autenticação;
- dados de organizações, Squads, técnicos e competências;
- métricas operacionais e de qualidade;
- configurações financeiras;
- feedbacks;
- temas;
- custos e impacto financeiro;
- RPCs de consolidação/ranking.

A estrutura para uma base nova está em `supabase/schema.sql`. A evolução histórica permanece em `supabase/migrations/`.

## Edge Functions

As ações que exigem privilégios elevados, como criação e manutenção de usuários, ficam em `supabase/functions/`. Chaves administrativas não devem ser expostas no frontend.

## Dependências carregadas sob demanda

A aplicação carrega bibliotecas externas somente quando necessário, como XLSX para exportação de Excel e jsPDF/AutoTable para PDF. O cliente Supabase também é carregado no navegador.

## GitHub Pages

Não há roteamento SPA dependente do nome do repositório. Os arquivos usam caminhos relativos, mantendo compatibilidade com:

`https://joseeduardopagnossim.github.io/dashboard-squad-performance/`
