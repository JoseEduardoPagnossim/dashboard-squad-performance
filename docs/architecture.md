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
7. `js/finance-advanced.js` — versão/assinatura, memória, explicações e comparação de simulações;
8. `js/chart-engine.js` — primitivas e preferências visuais dos gráficos;
9. `js/import-engine.js` — prévia, validação e segurança de importação;
10. `js/predictive-engine.js` — projeção, comparação e alertas;
11. `js/settings-engine.js` — permissões e layouts personalizáveis;
12. `js/app.js` — estado, renderização, orquestração das regras e integrações.

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
- `profiles.ui_preferences` guarda layout/densidade pessoal e, a partir da V2.42, também o estado da navegação (sidebar, grupos e submódulos). Pode ser atualizado pelo próprio usuário via `save_my_ui_preferences`.
- A aplicação mantém fallback em `localStorage`, preservando o funcionamento caso a migration ainda não tenha sido aplicada.
- A Central de Configurações funciona como ponto de entrada para preferências pessoais e atalhos administrativos.



## V2.38.1 — Configurações centralizadas

A camada de configuração passou a ser montada pela função `prepareCentralSettings()`. Os cards continuam declarados no HTML próximo aos módulos de origem para preservar compatibilidade estrutural, mas são realocados para `#centralConfigModules` antes do binding dos eventos. Isso mantém IDs e funções existentes sem duplicar controles.

A Apresentação expõe `syncAdminConfig()` para que a configuração da TV seja inicializada na Central mesmo antes de a tela de Apresentação ser aberta.

## V2.39.0 — Governança financeira

`js/finance-advanced.js` é carregado depois de `finance-rules.js` e antes de `app.js`. Ele não redefine a regra de comissão: sua responsabilidade é registrar a versão lógica, gerar a assinatura determinística dos parâmetros, montar explicações auditáveis, criar snapshots de memória e calcular deltas de simulação.

A tabela `finance_calculation_memory` funciona como trilha imutável da bonificação. Registros podem ser inseridos e lidos por administradores autorizados do Squad, mas não atualizados ou excluídos por usuários autenticados. O fechamento do mês preserva `financeRuleVersion` e `financeRuleFingerprint` também em `closed_snapshot`.

O simulador trabalha exclusivamente sobre uma cópia em memória da competência e executa o mesmo pipeline de cálculo usado pelo valor oficial. Nenhuma simulação chama rotinas de persistência. A memória centralizada depende da migration V2.39.0; na ausência dela, a aplicação preserva um fallback local sem impedir o restante do fluxo financeiro.

## V2.40.0 — TV / Comunicação

`js/tv-engine.js` concentra normalização de playlists/dispositivos, classificação de presença, resumo do monitor, geração de chaves e URLs dinâmicas e payloads de heartbeat. O `presentation.js` continua responsável pelo runtime da apresentação e emite telemetria a cada 30 segundos quando a rota contém `tv=<device_key>`.

TVs cadastradas usam uma URL estável e carregam sua playlist por `get_presentation_device_config`. Durante cada sincronização de dados, a rota verifica se a playlist foi alterada e reaplica a configuração sem exigir troca da URL física. As URLs legadas com configuração inteira na query string permanecem suportadas.

O `app.js` gerencia playlists, dispositivos, monitor e persistência. Na ausência da migration V2.40.0, existe fallback local; em produção, a fonte compartilhada é o Supabase com RLS e RPCs restritas.


## V2.41.0 — Experiência inicial e Home

`home` passa a ser a rota inicial do painel após a autenticação. A renderização permanece em `app.js` nesta etapa porque consome estado já carregado de múltiplos módulos, mas foi isolada em funções `renderHome*` por papel para facilitar a futura separação.

A Home não cria uma nova fonte de dados: reutiliza competências, metas, dados financeiros e o motor preditivo que já estão em memória. Isso evita alterar cálculos ou persistência durante a mudança de experiência. Os estados vazios também usam a matriz de permissões existente para decidir quais próximos passos podem ser oferecidos.

O novo login modifica somente apresentação e hierarquia visual. O caminho de autenticação e o carregamento inicial de dados permanecem os mesmos; a redução do tempo de login será tratada em uma etapa estrutural específica de performance.


## V2.42.0 — Navegação e avatar

- A sidebar mantém a mesma árvore de rotas, mas a apresentação foi organizada em grupos e submódulos de no máximo dois níveis.
- `settings-engine.js` normaliza `ui_preferences.navigation`, garantindo compatibilidade com preferências salvas em versões anteriores.
- O modo recolhido é exclusivamente visual e não altera permissões ou roteamento.
- O avatar usa Supabase Storage privado no bucket `user-avatars`. `profiles.avatar_path` mantém apenas a referência do arquivo.
- O frontend reduz a imagem antes do upload; a interface não carrega avatars da lista de usuários para evitar N chamadas de Storage.
- A URL assinada do próprio usuário é carregada depois que a aplicação já foi liberada, evitando transformar a foto em dependência do caminho crítico do login.


## V2.43.1 — Observabilidade

`js/performance-engine.js` passa a manter métricas locais de cache, eventos e long tasks. O `app.js` envia somente eventos técnicos sanitizados em lote pela RPC `record_performance_events`, fora do caminho crítico do login. A leitura histórica fica em `Configurações → Performance` e usa `get_performance_summary`, disponível apenas ao Admin Geral.


## V2.43.2 — Modelo de acesso simplificado

A aplicação passa a considerar apenas dois papéis ativos: `super_admin` (Administrador) e `technician` (Técnico). `settings-engine.js` normaliza `squad_admin` legado para `super_admin` somente para compatibilidade de leitura, mas a UI e as Edge Functions não criam mais esse papel.

Administradores não possuem Squad fixo e sempre recebem o conjunto completo de permissões administrativas. `permissions` continua existindo para restrições do Técnico e compatibilidade com preferências já persistidas. A Home possui apenas dois caminhos por perfil: técnico ou administrador global.

O nome SQL `can_admin_squad(uuid)` foi preservado para evitar reescrever policies históricas; semanticamente, na V2.43.2 ele significa “pode administrar este Squad” e retorna verdadeiro somente para `super_admin` da mesma organização.
