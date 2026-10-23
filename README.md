## V2.59.3 — Utilização, ociosidade e sobrecarga

- compara a carga atual por FTE disponível com histórico fechado comparável;
- usa mediana das competências imediatamente anteriores da janela selecionada;
- classifica abaixo de 90%, dentro de 90% a 110% e acima de 110%;
- calcula capacidade sustentável observada e saldo de capacidade em resoluções;
- mantém referência incompleta em modo fail-closed, sem pular meses ou preencher histórico antigo;
- compara cada Squad com o próprio histórico e a operação com o histórico agregado;
- cria a RPC histórica em `MIGRACAO_V2.59.3.sql`;
- mantém FTE necessário e gap estrutural reservados às versões posteriores.

## V2.59.2 — Capacidade utilizada

- mede a carga real absorvida em resoluções;
- calcula resoluções por FTE disponível sem criar percentual artificial de utilização;
- exige cobertura completa de disponibilidade e resolução para consolidar o indicador;
- mantém zero explícito diferente de ausência de fonte;
- adiciona visões por operação, Squad e técnico;
- cria RPCs agregadas em `MIGRACAO_V2.59.2.sql`;
- mantém utilização, ociosidade, sobrecarga e FTE necessário reservados às próximas versões.

## V2.59.1 — Capacidade disponível

- adiciona disponibilidade percentual por pessoa e competência;
- calcula `FTE disponível = FTE nominal × disponibilidade`;
- consolida FTE disponível e indisponível por Squad;
- mantém custos e FTE contratual inalterados;
- preserva competências fechadas antigas sem backfill artificial;
- adiciona RPCs agregadas de capacidade e migration `MIGRACAO_V2.59.1.sql`;
- mantém utilização e FTE necessário bloqueados para as próximas versões.

## V2.59.0 — Fundação de Capacidade

- inicia a Fase 4 com o motor `CA-0.1.0-capacity-foundation`;
- adiciona a seção estratégica Capacidade, isolada dos filtros operacionais;
- formaliza FTE nominal, FTE disponível, demanda, capacidade, utilização, FTE necessário e gap;
- exibe apenas FTE e produção observada já suportados pelas bases atuais;
- mantém FTE disponível, capacidade, utilização e FTE necessário como pendentes até as versões corretas do roadmap;
- adiciona prontidão técnica das entregas V2.59.1–V2.59.8;
- não cria migration nova.

## V2.58.9 — Hardening, regressões e fechamento da Fase 3

A Fase 3 de eficiência econômica foi endurecida antes da abertura da próxima etapa. A V2.58.9 corrige conversões de `null` que podiam virar zero, bloqueia benchmarks com cobertura parcial de resoluções, corrige a prévia de competências reabertas e adiciona validação de integridade no banco para a base de resoluções.

Execute `supabase/migrations/MIGRACAO_V2.58.9.sql` após as migrations anteriores da Fase 3. A V2.58.8 continua sendo responsável pelos snapshots históricos; a V2.58.9 apenas reforça a integridade sem reescrever o histórico congelado.

Detalhes: `docs/HARDENING_EFICIENCIA_V2.58.9.md`.

## V2.58.8 — Snapshots, histórico e evolução

A Fase 3 passa a congelar a fotografia econômica de competências fechadas. Produtividade, custo por resolução, taxa de resolução e benchmarks ficam associados à revisão do fechamento, permitindo evolução histórica sem reescrever o passado quando o motor mudar.

A versão exige `supabase/migrations/MIGRACAO_V2.58.8.sql`. Competências fechadas antes desta versão são reconstruídas uma única vez e identificadas como `legacy_backfill`; novos fechamentos geram snapshots oficiais automaticamente.

Detalhes: `docs/EFICIENCIA_SNAPSHOTS_HISTORICO_V2.58.8.md`.

## V2.58.6 — Insights e diagnóstico de eficiência

A Fase 3 passa a transformar produtividade econômica e benchmarks em diagnósticos explicáveis por Squad e técnico. O painel diferencia pressão de custo, pressão de resolução, eficiência saudável e alertas de qualidade, sempre exibindo a evidência e a próxima análise sugerida.

Não há migration nova. A V2.58.2 continua sendo o pré-requisito para a base de resoluções.

Detalhes: `docs/EFICIENCIA_DIAGNOSTICOS_V2.58.6.md`.

## V2.58.5 — Comparativos, benchmarks e eficiência relativa

A Fase 3 passa a comparar produtividade econômica de Squads e técnicos contra referências observadas na própria competência. A operação ponderada define o índice 100; média, mediana e melhor referência ajudam a interpretar dispersão sem criar meta automática. Técnicos são comparados também com a base econômica do próprio Squad, preservando a regra de custo pessoal da V2.58.3.

Não há migration nova. A `MIGRACAO_V2.58.2.sql` continua sendo o pré-requisito da base de resoluções.

Detalhes: `docs/EFICIENCIA_BENCHMARKS_V2.58.5.md`.

## V2.58.4 — Produtividade econômica por Squad

A Fase 3 passa a consolidar a produtividade econômica no nível em que os custos compartilhados já possuem atribuição confiável. O indicador principal é **resoluções por R$ 1.000 de custo total do Squad**, incluindo custo de pessoas e custo operacional rateado. FTE, taxa de resolução e taxa de avaliação permanecem visíveis como guardrails e não alteram o índice por pesos ocultos.

Não há migration nova. A base explícita de resoluções continua dependendo de `supabase/migrations/MIGRACAO_V2.58.2.sql`.

Detalhes: `docs/EFICIENCIA_PRODUTIVIDADE_SQUAD_V2.58.4.md`.

## V2.58.3 — Produtividade econômica por técnico

A Fase 3 passa a relacionar resoluções e custo pessoal por técnico. O indicador principal é **resoluções por R$ 1.000 de custo pessoal**, acompanhado por FTE, atendimentos, taxa de resolução, nota média e custo por resolução. Qualidade permanece visível como guardrail e não altera o índice por peso oculto.

Não há migration nova; execute a migration da V2.58.2 para dispor da base explícita de resoluções.

Detalhes: `docs/EFICIENCIA_PRODUTIVIDADE_TECNICO_V2.58.3.md`.

## V2.58.2 — Custo por Resolução

A Fase 3 passa a separar atendimento de resolução. A versão cria uma base explícita de resoluções por técnico/competência, calcula custo por resolução e taxa de resolução na operação, por Squad e por técnico, e preserva o histórico ao fechar a competência. Execute `supabase/migrations/MIGRACAO_V2.58.2.sql` antes de usar o indicador.

Detalhes: `docs/EFICIENCIA_CUSTO_RESOLUCAO_V2.58.2.md`.

## V2.58.1 — Custo por Atendimento

A Fase 3 passa a calcular oficialmente custo por atendimento no escopo estratégico selecionado. A tela compara operação, Squads e custo pessoal por atendimento dos técnicos vinculados, mantendo custos compartilhados no nível do Squad. A tabela de custos também ganha **Excluir dos custos**, que desativa a pessoa somente no Estratégico, limpa custos de competências abertas e preserva o usuário operacional e snapshots fechados.

Não há migration nova. Detalhes: `docs/EFICIENCIA_CUSTO_ATENDIMENTO_V2.58.1.md`.

## V2.58.0 R5 — Hotfix de compatibilidade do schema

Bases que passaram pela V2.57.3 podem manter a estrutura antiga de `strategy_cost_allocations`. A migration `supabase/migrations/MIGRACAO_V2.58.0_R5.sql` atualiza essa estrutura sem excluir dados, converte a escala de percentual e adiciona as colunas usadas pelo motor atual. Execute a R5 no Supabase antes de validar novamente a Gestão Estratégica.

## V2.58.0 R4 — Hotfix de cache dos insights

O código corrigido do R3 estava correto, porém R2 e R3 publicavam o mesmo endereço de asset (`js/app.js?v=2.58.0`). A R4 usa `assetVersion=2.58.0-r4`, força a atualização dos arquivos estáticos e adiciona compatibilidade temporária para sessões que ainda tenham o JavaScript antigo carregado.

## V2.58.0 R3 — Hotfix de renderização estratégica

Corrige o erro `insightEngine is not defined` disparado na atualização da visão estratégica após salvar/criar competência. O render executivo agora utiliza `strategyInsightsEngine`, que é o alias efetivamente carregado por `app.js`.

## V2.58.0 — Fundação da Eficiência

A revisão R2 da V2.58.0 reforça a persistência da área estratégica: competências e pessoas só exibem confirmação após retorno do banco, competências cadastradas ficam visíveis na própria tela e técnicos ativos do módulo operacional podem ser sincronizados para `strategy_people`. Pessoas de Pré-atendimento podem ser mantidas apenas no Estratégico usando o grupo `PRE`, sem entrar no ranking ou nas métricas operacionais.

A Fase 3 começa com uma seção própria de Eficiência, um motor puro (`EF-0.1.0-foundation`) e um contrato de dados que reaproveita custos estratégicos e produção operacional sem alterar os módulos existentes. A tela mostra as bases disponíveis e a prontidão dos próximos indicadores, mantendo custo por resolução pendente até a definição explícita da fonte de resolução.

Não há migration nova. Detalhes: `docs/EFICIENCIA_FUNDACAO_V2.58.0.md`.

## V2.57.9 — Hardening, segurança e regressões

A Gestão Estratégica encerra a Fase 2 com permissões fail-closed, limpeza imediata de dados financeiros após revogação de acesso, proteção de renderização agregada, normalização defensiva de valores e regressões automáticas para o motor de rateio. O CI também passa a bloquear versões divergentes entre package, lock, APP_VERSION e cache-busters.

Não há migration nova. Detalhes: `docs/HARDENING_ESTRATEGIA_V2.57.9.md`.

## V2.57.8 — Reimportação operacional substitutiva

A reimportação de uma competência aberta agora substitui a fotografia operacional daquele Squad/mês. Técnicos que não existem no CSV novo deixam de ser herdados do estado anterior; a persistência remove as linhas antigas de `technician_monthly`, preservando apenas configurações dos técnicos que continuam presentes no arquivo.

A proteção da V2.57.7 contra `user_id` inativo/excluído permanece ativa. Não há migration nova nesta versão.

Detalhes: `docs/REIMPORTACAO_SUBSTITUTIVA_V2.57.8.md`.

## V2.57.7 — Saneamento de técnicos excluídos na reimportação

A importação operacional passa a separar **produção histórica** de **identidade ativa**. Se um chamado vier no nome de um técnico já excluído/inativo, a linha continua compondo atendimentos e avaliações do Squad, porém é gravada sem `user_id` e não participa de ranking, headcount, pontuação ou bonificação individual enquanto a competência estiver aberta.

Ao reimportar uma competência aberta, vínculos inválidos já salvos são saneados automaticamente. Execute `supabase/migrations/MIGRACAO_V2.57.7.sql` antes de reimportar. Competências fechadas devem ser reabertas antes de qualquer correção.

Detalhes: `docs/REIMPORTACAO_TECNICO_EXCLUIDO_V2.57.7.md`.

## V2.57.6 — Insights, fechamento e snapshots

A Gestão Estratégica passa a permitir fechamento controlado das competências financeiras. O fechamento congela uma fotografia auditável dos custos, rateios, produção e qualidade daquele mês, sem alterar o operacional.

### Principais entregas
- permissão separada **Fechar competências**, administrada pelo Super Admin e desmarcada por padrão;
- fechamento por RPC, com validação de custos não alocados e rateios inconsistentes;
- snapshot versionado por competência, com revisão, fingerprint e versões das regras;
- competências fechadas passam a ser somente leitura e os resumos executivo/histórico passam a ler o snapshot;
- reabertura controlada sem apagar snapshots anteriores;
- novo fechamento após reabertura cria uma nova revisão;
- insights executivos passam a sinalizar competência provisória, rascunho e snapshot fechado;
- bloqueio de INSERT/UPDATE/DELETE em custos e rateios de competências fechadas via RLS.

### Banco
Execute `supabase/migrations/MIGRACAO_V2.57.6.sql` após as migrações anteriores da série 2.57.x.

Detalhes: `docs/GESTAO_ESTRATEGICA_FECHAMENTO_SNAPSHOTS_V2.57.6.md`.
