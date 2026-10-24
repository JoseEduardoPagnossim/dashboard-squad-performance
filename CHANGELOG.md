## V2.60.8 — Snapshots, histórico e evolução do Resultado

- congela o Resultado econômico no fechamento da competência em `strategy_result_snapshots`;
- vincula cada snapshot à mesma revisão financeira oficial da competência;
- preserva Receita Direta, Influenciada e Protegida como séries independentes;
- bloqueia mutações de eventos e atribuições enquanto a competência estiver fechada;
- adiciona histórico por operação ou Squad, respeitando o filtro estratégico;
- calcula evolução de Receita Direta, ROI direto, Receita Protegida e custo entre fechamentos;
- identifica reconstruções `legacy_backfill` separadamente de snapshots capturados no fechamento;
- adiciona `MIGRACAO_V2.60.8.sql` e o motor `RE-0.9.0-result-history`.

## V2.60.7 — Insights e diagnóstico de resultado

- traduz ROI, cobertura e impactos econômicos em situações operacionais explicáveis;
- diferencia retorno forte/positivo, proximidade do break-even, influência alta com retorno direto baixo, concentração em proteção, retorno abaixo do custo e lacunas de atribuição;
- mantém Receita Direta como única base do ROI; Influenciada e Protegida entram apenas como contexto independente;
- diagnósticos por operação, Squad e técnico com guardrail explícito contra causalidade automática;
- técnico sem custo pessoal permanece visível, mas com diagnóstico econômico inconclusivo;
- não exige migration nova; reutiliza as RPCs e custos oficiais da V2.60.6;
- motor de Resultado atualizado para `RE-0.8.0-result-diagnostics`.

## V2.60.6 — ROI e retorno operacional

- cruza Receita Direta com custo da operação, do Squad e do técnico;
- adiciona retorno líquido direto, ROI direto e cobertura de custo;
- mantém Receita Influenciada e Protegida fora do ROI, exibindo impacto por R$ de custo;
- usa custo total no nível operacional/Squad e custo pessoal no nível individual;
- técnicos sem custo permanecem auditáveis com ROI indisponível;
- adiciona RPCs agregada e individual para o cruzamento financeiro;
- motor de Resultado atualizado para `RE-0.7.0-roi-return`.

## V2.60.5 — Resultado por Squad

- Consolidação de Receita Direta, Influenciada e Protegida por Squad, sem total artificial entre naturezas.
- Rateio econômico calculado antes do filtro, usando `attribution_share` e a mesma regra determinística da visão por técnico.
- Nova RPC agregada `get_strategy_result_squad_summary`, sem exposição de dados individuais.
- Fase 5 preparada para ROI e retorno operacional na V2.60.6.

## V2.60.4 — Resultado por técnico
- consolida contribuição econômica individual sem somar naturezas distintas;
- aplica attribution_share explícita e divide apenas o saldo remanescente entre participantes sem percentual;
- impede shares explícitos acima de 100% por evento;
- adiciona RPC individual protegida por people_costs;
- mostra Receita Direta, Influenciada, Protegida e MRR por técnico;
- mantém ROI/custo fora do escopo até V2.60.6.

## V2.60.3 — Receita Protegida

- ativa a terceira natureza econômica da Fase 5 com o motor `RE-0.4.0-protected-revenue`;
- adiciona retenção, recuperação e prevenção de cancelamento como naturezas nativas;
- separa casos em acompanhamento de proteções confirmadas e perdas;
- mede Receita Protegida, MRR protegido, ARR protegido, risco aberto e taxa de proteção;
- exige validação da permanência antes de contabilizar um caso confirmado;
- permite retirar da métrica uma proteção posteriormente perdida sem apagar a auditoria;
- mantém Receita Direta e Receita Influenciada independentes;
- adiciona `MIGRACAO_V2.60.3.sql` e RPC agregada com filtro de Squad sem duplicidade.

## V2.60.2 — Receita Influenciada

- ativa a segunda natureza econômica da Fase 5;
- separa oportunidade aberta de receita convertida;
- adiciona etapas nativas de influência: origem, qualificação, evolução, apoio à negociação e handoff;
- mede Receita Influenciada, pipeline aberto e conversão;
- adiciona lançamento/auditoria por técnico e Squad;
- preserva Receita Direta como natureza separada;
- adiciona `MIGRACAO_V2.60.2.sql` e RPC agregada com filtro sem duplicidade.

## V2.60.1 — Receita Direta

- ativa o motor `RE-0.2.0-direct-revenue`;
- mede somente eventos `direct` + `confirmed`;
- define Receita Direta Total como soma de `gross_amount`;
- mantém Novo MRR e Novo ARR separados para impedir dupla contagem;
- adiciona Up-sell como categoria nativa de Receita Direta;
- adiciona categorias de upgrade, módulo, serviço, treinamento, implantação, venda direta e outros;
- adiciona lançamento manual com técnico responsável e atribuição `owner`;
- adiciona ticket médio, composição por categoria e auditoria dos lançamentos;
- aplica guard de integridade para categoria, valor positivo e moeda BRL;
- cria `get_strategy_direct_revenue_summary()` e `MIGRACAO_V2.60.1.sql`.

## V2.60.0 — Fundação de Resultado

- abre a Fase 5 com a nova seção estratégica `Resultado`;
- adiciona o motor `RE-0.1.0-result-foundation`;
- separa receita direta, influenciada e protegida como naturezas econômicas independentes;
- cria `strategy_result_events` e `strategy_result_attributions`;
- evita duplicidade financeira ao separar evento econômico de participantes;
- adiciona estados `draft`, `confirmed` e `cancelled`;
- cria deduplicação por origem/referência;
- adiciona RPC agregada de prontidão e contagens, sem somar valores monetários;
- herda filtros estratégicos de competência, Squad e comparação;
- mantém filtros operacionais isolados;
- adiciona migration `MIGRACAO_V2.60.0.sql`.

## V2.59.9 — Hardening e fechamento da Fase 4

- atualiza o motor para `CA-1.0.0-phase4-hardening`;
- torna a seleção de snapshots determinística por competência, Squad e revisão;
- prioriza prévia de competência reaberta sobre fotografia congelada;
- aplica fail-closed a snapshots com cobertura parcial, inconsistências ou contrato inválido;
- preserva aliases de faltantes/inconsistências entre `strategy-data` e o motor;
- limita FTE disponível histórico acima do nominal e invalida a linha para referência;
- adiciona migration de imutabilidade e contratos defensivos do snapshot;
- encerra a Fase 4 antes da abertura da Fase 5 — Resultado.

# V2.59.8 — Snapshots, histórico e evolução da capacidade

- cria `strategy_capacity_snapshots` com revisão vinculada ao snapshot financeiro da competência;
- captura automaticamente a fotografia de capacidade no fechamento e preserva revisões anteriores;
- reconstrói competências fechadas anteriores como `legacy_backfill`, sem rotulá-las como fechamento oficial;
- passa o histórico da Fase 4 a ler exclusivamente snapshots congelados;
- preserva compatibilidade com `get_strategy_capacity_utilization_history`;
- adiciona evolução de FTE disponível x necessário, utilização e linha do tempo de diagnósticos;
- mantém competência aberta como `live_preview`, sem contar como snapshot;
- atualiza o motor para `CA-0.9.0-snapshots-history` e adiciona migration V2.59.8.

# V2.59.7 R1 - Hotfix de testes do pipeline

- Corrige o pacote patch da V2.59.7 para incluir todas as expectativas históricas de versão/cache-buster atualizadas.
- Reproduzido o cenário V2.59.6 R1 + patch V2.59.7: 71 falhas antes do hotfix.
- Não altera regra de negócio, APP_VERSION, banco de dados ou motor da V2.59.7.

## V2.59.7 — Insights e diagnóstico de capacidade

- adiciona motor determinístico `CA-0.8.0-capacity-diagnostics`;
- cruza gap de FTE com utilização histórica para explicar a situação operacional;
- diferencia déficit com sobrecarga de déficit com baixa absorção;
- diferencia folga saudável de capacidade ociosa potencial;
- usa FCR apenas como evidência contextual, sem meta implícita;
- adiciona diagnóstico consolidado e por Squad;
- mantém decisão de contratação/redução fora do motor automático;
- não adiciona migration nova.

## V2.59.6 R1 — Hotfix do resumo de Capacidade

- preserva no view model estratégico os campos estendidos de resolução e capacidade;
- corrige os cards consolidados de FTE disponível, disponibilidade, resoluções/FTE e indicadores derivados;
- mantém intactos os dados já corretos por Squad e na aba Eficiência;
- não exige reimportação nem migration;
- usa cache-buster `2.59.6-r1` sem consumir a V2.59.7 do roadmap.

## V2.59.6 — Gap de capacidade

- atualiza o motor para `CA-0.7.0-capacity-gap`;
- calcula FTE disponível menos FTE necessário;
- calcula excesso e déficit de FTE sem arredondamento decisório;
- converte o gap em volume de atendimentos pela referência histórica;
- adiciona leitura consolidada da operação e por Squad;
- mantém janelas históricas incompletas em fail-closed;
- reposiciona o bloco V2.59.5 de FTE necessário para o painel Capacidade;
- mantém diagnósticos causais e recomendações reservados para V2.59.7;
- não adiciona migration nova;
- adiciona documentação e regressões da V2.59.6.

## V2.59.5 — FCR automático + FTE necessário

- atualiza o motor para `CA-0.6.0-required-fte`;
- adiciona `Resolve` opcional à Importação de Qualidade Completa;
- calcula resoluções automáticas como `atendimentos - Resolve Não`;
- considera ausência de resposta como resolvida somente com fonte Resolve válida;
- adiciona FCR operacional total, por Squad e por técnico;
- torna a fonte automática prioritária em `strategy_resolution_metrics`, mantendo manual como contingência;
- recalcula resolução automática após reimportação operacional;
- dimensiona FTE necessário com demanda de atendimentos e histórico fechado de atendimentos/FTE disponível;
- mantém janelas históricas incompletas em fail-closed e não calcula gap antes da V2.59.6;
- adiciona migration, documentação e regressões da V2.59.5.

## V2.59.4 — Produtividade por FTE

- atualiza o motor para `CA-0.5.0-productivity-per-fte`;
- calcula atendimentos por FTE disponível;
- calcula resoluções por FTE disponível;
- adiciona taxa de resolução como contexto;
- cria índice normalizado com operação = 100;
- compara produtividade por Squad e por técnico;
- preserva referência global ao filtrar um Squad;
- mantém V2.59.5 responsável pelo FTE necessário;
- não adiciona migration.

## V2.59.3 — Utilização, ociosidade e sobrecarga

- atualiza o motor para `CA-0.4.0-utilization-bands`;
- cria referência histórica de capacidade baseada em competências fechadas e completas;
- usa mediana de `resoluções / FTE disponível` dentro da janela selecionada;
- calcula taxa de utilização e capacidade sustentável observada;
- calcula saldo de capacidade em volume;
- classifica operação e Squad como abaixo, dentro ou acima da capacidade;
- fixa faixas explícitas em <90%, 90%–110% e >110%;
- não pula meses incompletos nem presume disponibilidade em histórico legado;
- adiciona RPC agregada histórica sem criar tabela nova;
- mantém FTE necessário sem cálculo;
- adiciona documentação e regressões da V2.59.3.

## V2.59.2 — Capacidade utilizada

- atualiza o motor para `CA-0.3.0-used-capacity`;
- define capacidade utilizada como carga observada, não como percentual;
- calcula resoluções e resoluções por FTE disponível;
- adiciona cobertura fail-closed da base de carga;
- ignora disponibilidade 0% como capacidade ativa, mas sinaliza produção positiva nesse cenário como inconsistência;
- consolida capacidade utilizada por Squad e técnico;
- adiciona RPCs agregadas sem expor detalhes individuais;
- mantém taxa de utilização e FTE necessário sem cálculo;
- adiciona migration, documentação e regressões da V2.59.2.

## V2.59.1 — Capacidade disponível

- ativa o primeiro indicador da Fase 4 com `CA-0.2.0-available-capacity`;
- adiciona `availability_factor` por pessoa/competência;
- calcula FTE disponível e FTE indisponível sem alterar custos;
- consolida disponibilidade por técnico e Squad;
- mantém agregados disponíveis sem expor custos pessoais;
- preserva histórico fechado anterior sem presumir 100% de disponibilidade;
- mantém capacidade utilizada, utilização e FTE necessário sem cálculo;
- adiciona testes e documentação da V2.59.1.

## V2.59.0 — Fundação de Capacidade

- inicia a Fase 4 com o motor `CA-0.1.0-capacity-foundation`;
- adiciona a seção estratégica Capacidade, isolada dos filtros operacionais;
- formaliza FTE nominal, FTE disponível, demanda, capacidade, utilização, FTE necessário e gap;
- exibe apenas FTE e produção observada já suportados pelas bases atuais;
- mantém FTE disponível, capacidade, utilização e FTE necessário como pendentes até as versões corretas do roadmap;
- adiciona prontidão técnica das entregas V2.59.1–V2.59.8;
- não cria migration nova.

## V2.58.9 — Hardening, regressões e fechamento da Fase 3

- corrige `null` sendo interpretado como zero em métricas, benchmarks e deltas;
- torna benchmarks de Squad fail-closed quando existe custo sem base explícita de resolução;
- torna benchmarks individuais fail-closed quando a referência comparável está incompleta;
- diferencia resolução zero informada de ausência de registro de resolução;
- impede histórico da competência reaberta de continuar mostrando snapshot antigo como estado corrente;
- deduplica defensivamente competências no motor histórico e preserva a maior revisão;
- exige cobertura completa para considerar a evolução agregada da operação pronta;
- adiciona guarda de banco para validar resoluções contra atendimentos operacionais;
- preserva `ON DELETE SET NULL` de usuários sem romper snapshots/histórico;
- adiciona contratos de integridade para novas revisões de snapshot;
- atualiza o motor para `EF-0.9.0-phase3-hardening`;
- encerra formalmente a Fase 3 sem criar uma V2.58.7 retroativa.

## V2.58.8 — Snapshots, histórico e evolução

- cria `strategy_efficiency_snapshots` vinculada à revisão da competência;
- captura automaticamente produtividade, custo por resolução, taxa de resolução e benchmarks no fechamento;
- preserva snapshots anteriores quando uma competência é reaberta e fechada em nova revisão;
- reconstrói competências antigas já fechadas com origem explícita `legacy_backfill`;
- adiciona RPC agregada `get_strategy_efficiency_history()` sem expor custo individual;
- adiciona prévia não persistida para competência aberta;
- publica linha do tempo histórica e gráficos de evolução;
- compara Squad selecionado com a referência congelada da operação;
- adiciona índice base 100 de produtividade e custo por resolução;
- atualiza o motor para `EF-0.8.0-snapshots-history`;
- exige a migration `MIGRACAO_V2.58.8.sql`.

## V2.58.6 — Insights e diagnóstico de eficiência

- adiciona diagnóstico explicável de eficiência por Squad e técnico;
- diferencia pressão de custo, pressão de resolução, eficiência saudável e alerta de qualidade;
- adiciona referências operacionais de custo por resolução, taxa de resolução e qualidade;
- mantém benchmark global mesmo com filtro de Squad;
- publica diagnóstico prioritário e próxima análise recomendada;
- mantém qualidade como guardrail sem peso oculto na fórmula econômica;
- explicita tolerâncias diagnósticas no motor;
- não cria migration nova;
- atualiza motor para `EF-0.7.0-efficiency-diagnostics`.

## V2.58.5 — Comparativos, benchmarks e eficiência relativa

- adiciona benchmark ponderado da operação para produtividade econômica;
- calcula média simples, mediana e melhor referência observada entre Squads elegíveis;
- publica índice relativo com operação = 100 e diferenças percentuais versus operação e mediana;
- adiciona comparação individual versus benchmark técnico do próprio Squad e da operação;
- mantém custos compartilhados fora do benchmark individual;
- mantém filtros de exibição sem contaminar a referência global da competência;
- trata ±5% como faixa próxima da referência, sem transformar benchmark em meta;
- não cria migration nova;
- atualiza o motor para `EF-0.6.0-relative-efficiency-benchmarks`.

## V2.58.4 — Produtividade econômica por Squad

- calcula produtividade econômica do Squad como `resoluções / custo total consolidado × R$ 1.000`;
- inclui custo de pessoas e custo operacional já rateado no denominador do Squad;
- adiciona ranking econômico por Squad na competência selecionada;
- exibe FTE, atendimentos, resoluções, taxa de resolução, taxa de avaliação, custo por resolução e resoluções por FTE;
- mantém qualidade e efetividade como guardrails visíveis, sem pesos ocultos no índice;
- mantém Squads sem custo ou sem base de resolução visíveis, mas sem posição no ranking;
- respeita o filtro estratégico de Squad e a permissão agregada;
- atualiza o motor de eficiência para `EF-0.5.0-economic-productivity-squad`;
- não exige migration nova e reutiliza a consolidação financeira e a base de resoluções da V2.58.2.

## V2.58.3 — Produtividade econômica por técnico

- calcula produtividade econômica individual como `resoluções / custo pessoal × R$ 1.000`;
- mantém custos compartilhados fora do técnico para evitar rateio individual arbitrário;
- adiciona ranking por técnico na competência e no Squad selecionado;
- exibe FTE, atendimentos, resoluções, taxa de resolução, nota média e custo pessoal por resolução;
- usa qualidade como guardrail visível, sem multiplicador oculto no índice;
- mantém linhas incompletas visíveis sem posição no ranking;
- protege a visão individual com a permissão de custos pessoais;
- atualiza o motor de eficiência para `EF-0.4.0-economic-productivity-person`;
- não exige migration nova e depende da base de resoluções da V2.58.2.

## V2.58.2 — Custo por Resolução

- cria uma base estratégica explícita de resoluções por técnico, competência e Squad;
- não reutiliza atendimentos automaticamente como resolução;
- calcula custo por resolução na operação, por Squad e por técnico;
- adiciona taxa de resolução (`resoluções / atendimentos`);
- adiciona histórico e comparação conforme mês anterior, 3, 6 ou 12 competências;
- permite editar resoluções na própria tela de Eficiência enquanto a competência estiver aberta;
- congela a base de resoluções no fechamento por RLS/policies;
- adiciona RPCs agregadas sem expor detalhe individual a perfis sem acesso de pessoas;
- atualiza o motor de eficiência para `EF-0.3.0-cost-per-resolution`;
- exige a migration `MIGRACAO_V2.58.2.sql`.

## V2.58.1 — Custo por Atendimento

- calcula custo por atendimento com `custo total consolidado / atendimentos válidos`;
- publica comparação histórica conforme mês anterior, 3, 6 ou 12 competências;
- adiciona visão por Squad usando custo total já rateado;
- adiciona custo pessoal por atendimento por técnico, sem redistribuir custo operacional até o indivíduo;
- carrega a produção mensal necessária para vincular atendimentos ao `user_id` do técnico;
- adiciona ação **Excluir dos custos** na tabela de pessoas;
- exclusão preserva usuário operacional, produção e competências fechadas, removendo custos apenas de competências abertas;
- técnicos excluídos permanecem registrados como inativos no Estratégico para não serem recriados pela sincronização;
- atualiza o motor de eficiência para `EF-0.2.0-cost-per-attendance`;
- não exige migration nova.

## V2.58.0 R5 — Compatibilidade de schema estratégico

- corrige instalações que vieram da V2.57.3, onde `strategy_cost_allocations` ainda não possuía `allocated_amount` e `allocation_method_snapshot`;
- converte percentuais legados de 0..100 para a escala atual 0..1 sem apagar rateios existentes;
- normaliza categorias e o método legado `headcount` para o contrato atual baseado em FTE;
- adiciona `MIGRACAO_V2.58.0_R5.sql`, idempotente para bases já atualizadas;
- melhora o alerta da tela para apontar a migration R5 quando detectar drift de `strategy_cost_allocations`;
- revisa os assets para `2.58.0-r5` e identifica visualmente a R5.

# Changelog

## V2.58.0 R4 — Cache busting e compatibilidade de insights

- altera a revisão dos assets para `2.58.0-r4`, forçando o navegador/CDN a buscar o JavaScript corrigido;
- mantém a release funcional em `2.58.0`, sem avançar o roadmap para a V2.58.1;
- adiciona alias temporário de compatibilidade `window.insightEngine` para sessões que ainda tenham o `app.js` antigo em memória/cache;
- identifica visualmente a revisão R4 no login e rodapé;
- separa versão funcional da revisão de assets no validador do projeto;
- adiciona regressão para impedir publicação de hotfix com o mesmo cache-buster.

## V2.58.0 R3 — Hotfix de renderização estratégica

- corrige `ReferenceError: insightEngine is not defined` após criar/salvar competência;
- o Resultado Executivo passa a usar o alias carregado `strategyInsightsEngine`;
- preserva a persistência já concluída antes da renderização;
- adiciona regressão específica para impedir retorno do erro de escopo.

## V2.58.0 — Fundação da Eficiência

- corrige confirmação de persistência de competências, pessoas e custos para não exibir sucesso quando o banco não confirma a gravação;
- adiciona lista visível de competências financeiras cadastradas;
- pré-carrega técnicos ativos do cadastro operacional na base estratégica quando ela está vazia e oferece sincronização manual posterior;
- adiciona o grupo estratégico `PRE` (Pré-atendimento), sem criar técnicos no módulo operacional;
- abre a Fase 3 com uma seção própria de Eficiência dentro da Gestão Estratégica;
- adiciona o motor `strategy-efficiency.js` com contrato de dados e regra `EF-0.1.0-foundation`;
- conecta competência, Squad e comparação ao novo módulo sem herdar filtros operacionais;
- publica indicadores-base de custo consolidado, atendimentos, FTE e cobertura da base;
- valida a prontidão das próximas métricas sem antecipar suas fórmulas;
- mantém custo por resolução pendente até existir uma definição/fonte explícita de resolução;
- não exige migration nova e não altera bonificação, ranking ou importações operacionais.

## V2.57.9 — Hardening, segurança e regressões

- torna a normalização de permissões estratégica fail-closed quando o campo oficial do banco está presente;
- limpa dados financeiros em memória imediatamente após alteração/revogação de acesso;
- bloqueia composição, consolidação, insights e gráficos agregados na UI sem `can_view_aggregates`;
- normaliza custos negativos e percentuais de rateio fora de 0..1;
- consolida aliases de Squad no rateio antes da distribuição de centavos;
- atualiza o motor estratégico para `SC-0.6.1`;
- adiciona regressões específicas e trava de consistência de versão no validador;
- não exige migration nova.

## V2.57.8 — Reimportação operacional substitutiva

- corrige reimportação que herdava técnicos ausentes do CSV atual;
- mantém metas e configurações apenas dos técnicos que continuam presentes no arquivo;
- permite que `persistImportedMonth()` exclua corretamente linhas antigas não presentes na nova fotografia;
- preserva o saneamento de identidades inativas/excluídas da V2.57.7;
- não exige migration nova.


## V2.57.7 — Saneamento de técnicos excluídos na reimportação

- revalida `user_id` somente contra técnicos ativos antes de consolidar o CSV operacional;
- histórico/alias de técnico excluído continua reconhecendo o nome, mas grava `user_id = null`;
- reimportação corrige vínculos inválidos já salvos em competências abertas;
- preserva atendimentos e avaliações do técnico histórico nos totais do Squad;
- exclui registros sem usuário ativo de headcount, ranking, pontuação, bonificação e demais métricas individuais da competência aberta;
- ranking por período usa apenas identidades ativas, enquanto os totais do Squad continuam considerando toda a produção;
- adiciona trigger de banco para impedir que um usuário inativo/excluído seja reatribuído a `technician_monthly`;
- adiciona `MIGRACAO_V2.57.7.sql`.

## V2.57.6 — Insights, fechamento e snapshots

- adiciona permissão separada **Fechar competências** no Controle de Usuários;
- cria snapshots imutáveis por competência com revisão, fingerprint e versão das regras;
- fechamento valida custos operacionais não alocados e divergências de rateio;
- competências fechadas passam a bloquear alterações de custos e rateios também no banco;
- Resultado Executivo, histórico e consolidação por Squad passam a ler o snapshot quando o mês está fechado;
- reabertura preserva snapshots anteriores e um novo fechamento cria nova revisão;
- insights passam a identificar rascunho, competência provisória e snapshot fechado;
- atualiza motor estratégico para `SC-0.6.0-snapshot` e insights para `SI-1.1.0`;
- adiciona `MIGRACAO_V2.57.6.sql`.

## V2.57.4 — Motor financeiro + consolidação por Squad

- Corrige o acesso estratégico: checkbox marcado passa a habilitar visualização detalhada e edição do MVP.
- Cria custos operacionais e snapshots de rateio.
- Implementa motor SC-0.4.0-financial.
- Consolida pessoas + operação + atendimentos por Squad.
- Adiciona `MIGRACAO_V2.57.4.sql`.

## V2.57.2 — Competências, pessoas e custos pessoais

- Cria competências financeiras independentes do calendário operacional.
- Adiciona cadastro estratégico de pessoas com Squad e FTE.
- Adiciona custos pessoais mensais: salário, encargos, benefícios, variável, horas extras e outros.
- Calcula custo atribuído considerando FTE.
- Expõe totais agregados por competência/Squad via RPC segura, sem baixar salários individuais para usuários sem permissão.
- Implementa editor manual em Premissas para usuários com permissões detalhadas.
- Mantém o operacional, Qualidade e Bonificação sem alterações.
- Adiciona `MIGRACAO_V2.57.2.sql`.

## V2.57.1 — Acesso à Gestão Estratégica por usuário

- adiciona o checkbox **Gestão Estratégica** diretamente no Controle de Usuários;
- o acesso passa a ser **opt-in**: Administrador/Super Admin não recebe a área estratégica automaticamente;
- somente `super_admin` pode liberar ou revogar o checkbox, inclusive o próprio acesso;
- marcar o checkbox libera apenas visualização da Estratégia e indicadores agregados; permissões futuras de custos individuais, edição e fechamento permanecem desligadas;
- altera a RLS de `strategy_access` para que o Super Admin possa administrar os acessos mesmo sem possuir acesso estratégico para si;
- revoga somente o bootstrap automático de Super Admin criado pela V2.57.0;
- não adiciona salários, encargos ou custos: o MVP financeiro continua para a próxima etapa.

Detalhes: `docs/ACESSO_GESTAO_ESTRATEGICA_V2.57.1.md`.

## V2.57.0 — Fundação da Gestão Estratégica

- cria a nova área `Gestão Estratégica` sem alterar o fluxo operacional existente;
- adiciona rotas independentes para Resultado Executivo, Custos & Eficiência e Premissas;
- mantém estado e filtros estratégicos fora do `state` operacional;
- adiciona autorização específica em `strategy_access`, sem custos financeiros reais;
- adiciona módulos `strategy-*` e stylesheet próprio;
- a tela nasce funcional, porém propositalmente sem valores financeiros.

Detalhes: `docs/GESTAO_ESTRATEGICA_FUNDACAO_V2.57.0.md`.

## V2.56.7 — Média diária dinâmica por Squad

- O gráfico diário passa a respeitar o filtro global de Squad antes de agrupar atendimentos por data.
- Com Squad específico, a média considera somente os dias com atendimento daquele Squad no período selecionado.
- Com Todos os Squads, soma A+B+D+E por dia e calcula a média sobre o consolidado diário, sem fazer média das médias.
- Título, legenda e resumo do gráfico passam a indicar dinamicamente o escopo selecionado.
- Mantém a exclusão de dias zerados do denominador e não altera RPCs ou banco de dados.
- Frontend-only; sem migration.

Detalhes: `docs/MEDIA_DIARIA_SQUAD_V2.56.7.md`.

## V2.56.6 — Visibilidade correta das subabas de Indicadores

- Corrige o conflito entre `hidden` e `personal-layout-root` que podia reexibir o painel de Desempenho dentro da aba Qualidade.
- O layout pessoal só aplica `display:flex` quando a raiz não estiver oculta.
- Mantém intactos filtros, cálculos, carregamento de dados e regras da Qualidade.
- Adiciona regressão específica para impedir que uma subaba oculta seja reexibida pelo sistema de layout.
- Frontend-only; sem migration.

Detalhes: `docs/VISIBILIDADE_SUBABAS_V2.56.6.md`.

## V2.56.5 — Filtro de Squad da Qualidade com recarga confirmada

- Corrige a troca direta de Squad em **Indicadores > Qualidade** sem exigir passagem pela aba Desempenho.
- A renderização da Qualidade recalcula o escopo diretamente do estado global no momento do desenho, evitando reutilização de arrays de um Squad anterior.
- A troca explícita de Squad força a revalidação dos meses completos da Qualidade no Supabase, ignorando cache mensal potencialmente obsoleto.
- O mesmo `ensureViewData` continua sendo usado por Desempenho e Qualidade; apenas a troca direta na Qualidade solicita `forceMonths`.
- Restaura e atualiza o teste `indicator-squad-filter-v2563.test.js`, que existia no repositório e não estava no pacote V2.56.4, eliminando os 3 falsos negativos do CI.
- Frontend-only; sem migration.

Detalhes: `docs/FILTRO_SQUAD_QUALIDADE_V2.56.5.md`.

## V2.56.4 — Filtro de Squad sincronizado nos Indicadores

- Corrige a troca direta de Squad em **Indicadores > Qualidade** sem exigir passagem prévia por Desempenho.
- A troca de Squad agora aguarda o mesmo `ensureViewData` usado pelo restante da tela antes da renderização final.
- Adiciona proteção contra respostas atrasadas quando o usuário alterna rapidamente entre Squads.
- O carregamento explícito do filtro usa modo estrito para não ocultar falhas de carregamento mensal.
- Remove definitivamente qualquer controlador paralelo de hidratação específico da Qualidade.
- Mantém fórmulas, persistência e banco de dados inalterados; nenhuma migration é necessária.
- Atualiza os cache-busters do frontend para `2.56.4`.

Detalhes: `docs/FILTRO_SQUAD_QUALIDADE_V2.56.4.md`.

## V2.56.3 — Filtro de Squad unificado em Indicadores

- Remove o controlador assíncrono exclusivo da aba **Qualidade**, que fazia a troca direta de Squad seguir um caminho diferente da aba **Desempenho**.
- A troca de Squad passa a usar exclusivamente `hydrateCurrentViewAsync(...)` em todas as subabas de Indicadores, reaproveitando o mesmo ciclo de carregamento já validado em Desempenho.
- Ao entrar em **Qualidade**, **Dias úteis** ou **Detalhamento**, a tela reutiliza o carregador global de Indicadores; não existe mais estado paralelo de hidratação por Squad.
- Enquanto a competência do novo Squad ainda estiver apenas em modo resumo, a Qualidade limpa os valores anteriores e exibe o estado de atualização até a carga completa terminar.
- O token global de renderização continua protegendo contra respostas atrasadas de outro Squad, período ou subaba.
- Cache-bust atualizado integralmente para `2.56.3`.
- Frontend-only; sem migration e sem alteração nas fórmulas de Qualidade, Desempenho, Gestão Preditiva, bonificação ou importações.

Detalhes: `docs/FILTRO_SQUAD_QUALIDADE_V2.56.3.md`.

## V2.56.2 — Filtro de Squad reativo na Qualidade

- Corrige o comportamento em que a aba **Qualidade** podia continuar exibindo os números do Squad anterior enquanto aguardava a carga do novo escopo.
- A troca de Squad agora atualiza imediatamente o contexto visual; os dados antigos são removidos e a tela mostra **Atualizando dados do Squad...** enquanto o Supabase carrega as competências necessárias.
- Adiciona proteção contra respostas assíncronas antigas: somente a hidratação correspondente à mesma subaba, Squad e período pode redesenhar a tela.
- A Qualidade passa a reutilizar o mesmo carregador de dados da aba Desempenho, eliminando caminhos paralelos de atualização do Squad.
- Mantém inalteradas as fórmulas de Qualidade, Desempenho, Gestão Preditiva, bonificação e importações.
- Frontend-only; sem migration e sem alteração de schema.

Detalhes: `docs/FILTRO_SQUAD_QUALIDADE_V2.56.2.md`.

## V2.56.1 — Filtro de Squad consistente em Indicadores

- Corrige a troca de Squad feita diretamente na aba **Qualidade**, sem exigir passagem prévia por **Desempenho**.
- Ao alterar o Squad nas abas de **Qualidade**, **Dias úteis** e **Detalhamento**, os dados completos das competências do novo escopo são carregados antes da renderização final dos cards e gráficos.
- A troca para **Todos os Squads** também garante o carregamento dos meses necessários de todos os grupos antes de consolidar a Qualidade.
- Ao alternar entre as subabas de Indicadores, o módulo revalida os dados necessários em segundo plano, preservando o mesmo contexto global de Squad e período.
- Mantém inalteradas as fórmulas de Desempenho, Qualidade, Gestão Preditiva, bonificação e importações.
- Frontend-only; sem migration e sem alteração de schema.

Detalhes: `docs/FILTRO_SQUAD_QUALIDADE_V2.56.1.md`.

## V2.56.0 — Gestão preditiva por Squad

- Corrige e protege o escopo da Gestão Preditiva para que cards, alertas, tabela por Squad e técnicos em risco respeitem o Squad selecionado.
- Adiciona validação defensiva de escopo no `predictive-engine`, evitando exibir consolidado global quando a tela estiver em um Squad específico.
- Cards preditivos passam a destacar Projeção/Tendência como informação principal, mantendo Realizado e Meta como contexto.
- O card de risco passa a exibir `técnicos sob risco`, `quantidade de total`, representatividade e critério de 2+ sinais, sem tratar o total da equipe como meta.
- O chip da competência mostra também o escopo atual do Squad.
- Melhora a mensagem de Notas 5 quando a meta já foi atingida ou a projeção supera o objetivo.
- Frontend-only; sem migration e sem alteração nas regras de Desempenho, bonificação ou importação.

Detalhes: `docs/GESTAO_PREDITIVA_V2.56.0.md`.

## V2.55.0 — Preparação inteligente de CSV

- Produto/Empresa e Qualidade Completa podem usar o mesmo relatório bruto exportado do CRM.
- Adiciona uma etapa de preparação para mapear Data, Técnico, Serviço, Produto, Empresa e Grupo diretamente para as colunas da origem.
- Colunas extras são ignoradas automaticamente, eliminando a necessidade de apagar campos manualmente no Excel.
- Produto/Empresa passa a oferecer deduplicação interna por uma ou mais colunas escolhidas, separada por competência, com opção de manter a primeira ou a última ocorrência.
- Qualidade Completa mantém todas as respostas e deixa a deduplicação desativada por padrão para preservar a semântica do gráfico consolidado.
- Mapeamento e chaves do mesmo relatório podem ser lembrados localmente.
- Frontend-only; sem migration e sem alteração nas regras de cálculo ou persistência.

Detalhes: `docs/PREPARACAO_CSV_V2.55.0.md`.

## V2.54.1 — Hotfix dos seletores de mês e ano do calendário

- Corrige os controles de **mês** e **ano** da navegação direta do calendário no seletor de Período de análise.
- O Design System transforma `<select>` em botões visuais; a regra genérica dos botões de navegação estava reduzindo esses dois controles para `34x34px` e escondendo seus textos.
- O hotfix aplica dimensões e layout próprios aos proxies de mês/ano, preservando as setas anterior/próximo e toda a lógica da V2.54.0.
- Frontend-only; sem migration e sem alteração de filtros, cálculos ou persistência do contexto global.

## V2.54.0 — Seleção avançada de período e contexto global

- Intervalo livre passa a permitir escolher **Competência inicial** e **Competência final** diretamente, usando o primeiro/último dia disponível de cada competência.
- Adiciona presets rápidos de **3, 6 e 12 meses**, **Ano atual**, **Ano anterior** e **Histórico**.
- O calendário ganha navegação direta por **mês e ano**, mantendo as setas para ajuste sequencial.
- **Squad e Período** passam a formar um contexto global de análise: ao navegar entre módulos, os valores atuais permanecem até o usuário alterá-los explicitamente.
- Visões salvas e URLs explícitas continuam podendo aplicar outro contexto de forma intencional.
- Mês e Técnico continuam contextuais por tela; módulos que não usam Período não apagam o intervalo global.
- A troca manual de Squad preserva o período atual quando houver interseção de dados no novo escopo.
- Frontend-only; sem migration e sem alteração das regras de cálculo.

Detalhes: `docs/PERIODO_CONTEXTO_GLOBAL_V2.54.0.md`.

## V2.53.2 — Média diária somente em dias com atendimento

- Ajusta o gráfico **Atendimentos diários consolidados x média do período** para considerar somente datas com volume consolidado maior que zero.
- Dias sem nenhum atendimento deixam de aparecer na série e não entram no divisor da média diária.
- A linha de referência passa a se chamar **Média dos dias com atendimento**.
- O cabeçalho informa quantos dias com atendimento foram considerados no cálculo.
- Sem migration nova; reutiliza as RPCs por período da V2.53.1.

## V2.53.1 — Consolidados diários por período + seletor de competência estável

- Corrige truncamento dos gráficos diários causado pelo retorno máximo por requisição da Data API.
- Adiciona `get_org_daily_attendance_overview_range(date,date)` e `get_org_technician_daily_overview_range(date,date)`.
- O frontend envia o período ativo e pagina respostas em lotes de até 900 linhas.
- O consolidado diário é invalidado/recarregado quando o período muda.
- Corrige o Design System para não fechar um select customizado ao rolar o próprio menu de opções.
- O ajuste resolve a seleção de Janeiro em arquivos com muitas competências na Central de Importação.
- Requer `MIGRACAO_V2.53.1.sql`.

## V2.53.0 — Qualidade Completa sem deduplicação

- Cria a importação exclusiva **Qualidade Completa**, destinada ao CSV completo de avaliações sem deduplicação de clientes.
- Aceita Data, Técnico, Nota Serviço, Nota Produto e Nota Empresa; `grupoAtendimento` é opcional e pode acelerar o vínculo ao Squad.
- Mantém cada linha válida da origem como uma resposta e agrega os dados por dia/Squad antes de persistir.
- Cria `quality_full_daily`, sem armazenar nomes ou CNPJs de clientes, com RLS por organização/Squad.
- Reimportar uma competência substitui somente aquela competência da nova base analítica.
- Adiciona em Visão do Squad o gráfico **Qualidade Atendimento × Produto × Empresa**, ponderado pelas respostas reais de cada dimensão.
- O gráfico respeita lacunas históricas, escala focada, rótulos e exportação da V2.52.x.
- A nova fonte não altera ranking, bonificação, taxa oficial de avaliação, importação operacional, Produto/Empresa atual ou Impacto Financeiro.
- Requer `supabase/migrations/MIGRACAO_V2.53.0.sql`.

Detalhes: `docs/QUALIDADE_COMPLETA_V2.53.0.md`.

## V2.52.3 — Benchmark consolidado de avaliação

- Novo card de largura total em **Visão do Squad → Todos os Squads** com a evolução consolidada da taxa de avaliação.
- Taxa calculada por volume real da operação, usando avaliações ÷ atendimentos elegíveis.
- Referências fixas de **60% objetivo** e **20% limite mínimo**.
- Linha de tendência linear para leitura da direção histórica.
- Rótulos da série principal, resumo da taxa atual/gap/tendência e exportação pelo mesmo fluxo da V2.52.x.
- `renderIndicatorLineChart` passa a aceitar controle por série para área, pontos e rótulos, sem alterar o comportamento padrão dos gráficos existentes.
- Frontend-only: sem migration nova.

## V2.52.2 — Rótulos e exportação dos gráficos dos Squads

- Habilita o botão **Exportar** nos quatro gráficos `Volume × avaliação` da Visão do Squad.
- Adiciona quantidade de atendimentos na base das barras e percentual de avaliação nos pontos da linha.
- Mantém todos os rótulos em séries com até 12 pontos e usa densidade intercalada em séries maiores para evitar sobreposição.
- Exportação passa a respeitar o contexto do Squad do card, mesmo com `Todos os Squads` selecionado.
- Legendas do mini gráfico passam a ser incorporadas ao pacote de exportação.
- Reforça contraste dos rótulos na tela e no SVG/PNG, inclusive em fundos transparentes.
- Sem migration nova.

Detalhes: `docs/ROTULOS_EXPORTACAO_SQUADS_V2.52.2.md`.

## V2.52.1 — Evolução dos Squads e exportação transparente refinada

- Corrige a exportação com fundo transparente: textos, eixos e legendas passam a usar contraste escuro explícito para slides claros.
- Adiciona a opção **Transparente • fundo escuro**, com textos claros para uso sobre apresentações escuras.
- Mantém as cores oficiais das séries/Squads em ambas as variantes transparentes.
- Adiciona aos cards de **Todos os Squads** um gráfico combinado compacto de **Atendimentos × % de avaliação**.
- A granularidade do mini gráfico adapta-se automaticamente ao período: **diário até 15 dias**, **semanal de 16 a 45 dias** e **por competência acima de 45 dias**.
- As barras usam a cor oficial configurada do Squad e a linha de avaliação usa a cor semântica de qualidade.
- A escala percentual do mini gráfico reutiliza o **Foco automático** da V2.52.0 e informa o intervalo quando o eixo estiver focado.
- Tooltip do card exibe Atendimentos, Avaliações e % de avaliação por recorte.
- Os valores são derivados da mesma agregação operacional usada pelos KPIs dos cards, sem criar um segundo cálculo de performance.
- Frontend-only: não exige migration nova nem republicação de Edge Function.

Detalhes: `docs/EVOLUCAO_SQUADS_V2.52.1.md`.

## V2.52.0 — Indicadores otimizados, escala inteligente e exportação

- Reorganiza a leitura de avaliação em Todos os Squads para evitar três gráficos com a mesma mensagem.
- O comparativo executivo de qualidade passa a exibir **Nota média das avaliações por Squad** em escala 1–5 e média ponderada.
- Substitui o comparativo mensal redundante por **% de avaliação dos Squads x meta**, com barras a partir de 0%, marcador da meta e diferença em p.p.
- Mantém **% de avaliação por Squad** na Evolução Histórica como série mensal consolidada.
- Adiciona cores oficiais personalizáveis para A, B, D e E, persistidas junto ao tema e reutilizadas nos gráficos por Squad.
- Adiciona os perfis visuais **Executivo, Analítico e Apresentação** e move os controles detalhados para Ajustes avançados.
- Substitui a antiga escala Automática por **Foco automático**, mantendo Completa 0–100% e Manual; gráficos focados exibem o intervalo usado.
- Adiciona exportação local dos gráficos para PNG 16:9, PNG somente gráfico, SVG vetorial e área de transferência, com tema atual, fundo claro ou transparente.
- Adiciona `js/chart-export.js` e cobertura automatizada específica da V2.52.0.
- Frontend-only: não exige migration nova nem republicação de Edge Function.

Detalhes: `docs/INDICADORES_EXPORTACAO_V2.52.0.md`.

## V2.51.0 — Identidade estável de técnicos e aliases do CSV

- Passa a usar `user_id` como identidade principal do técnico durante a importação, evitando tratar mudança de nome no CRM como uma nova pessoa.
- Adiciona **Nomes anteriores / aliases do CSV** no cadastro do Técnico; ao trocar o nome atual, o valor anterior é preservado antes da atualização do perfil.
- Cria `technician_aliases` com isolamento por organização e sementes vindas do perfil, histórico de Squad, competências já vinculadas e auditoria.
- A importação operacional consolida nomes diferentes ligados ao mesmo usuário **antes** dos cálculos do mês e informa os aliases reconhecidos na prévia.
- Vínculos ambíguos passam a bloquear a importação em vez de realizar associação aproximada entre pessoas.
- Ao reimportar uma competência já suja, o sistema reconstrói as métricas automáticas a partir do CSV, preserva dados manuais/financeiros e remove linhas mensais duplicadas da mesma identidade.
- A importação de Produto/Empresa também passa a reconhecer aliases históricos.
- A migration não soma métricas duplicadas automaticamente; competências já afetadas devem ser reimportadas depois da confirmação dos aliases.
- Adiciona `MIGRACAO_V2.51.0.sql`; sem necessidade de republicar Edge Functions.

Detalhes: `docs/IDENTIDADE_TECNICOS_V2.51.0.md`.

### V2.50.2 R4 — Fonte organizacional definitiva da Apresentação

- Corrige o caso em que a Apresentação ficava **Online com 0 registros**, mesmo havendo competência e dados importados.
- Adiciona o RPC `get_presentation_daily_context_v2502`, baseado no mesmo padrão `current_profile`/organização usado pelo contexto de login já estável do projeto.
- O novo RPC recebe período e Squad, retorna somente as métricas necessárias à Apresentação e não expõe dados financeiros.
- Mantém os RPCs anteriores apenas como compatibilidade e o fallback detalhado somente para Administradores, evitando que um técnico veja por engano apenas os próprios dados.
- A tela passa a sinalizar **Atenção** quando existe competência indexada, mas a fonte compartilhada retorna 0 registros, em vez de exibir `Online` como se a sincronização estivesse válida.
- Adiciona diagnóstico em `window.SoftenPresentationDiagnostics` com fonte, quantidade carregada/exibida, período e estado da sincronização.
- Preserva o preset **RH / Pagamento** do R3 com **Bônus total** como última coluna.
- Cache-bust de `presentation.js` e `app.js` atualizado para `2.50.2-r4`.

### V2.50.2 R3 — Preset RH totalizador + robustez da Apresentação

- O preset **RH / Pagamento** passa a usar: **Grupo, Técnico, Comissão base do técnico, Comissão Venda, Comissão manual e Bônus total**.
- **Bônus total** fica sempre como última coluna e totaliza Comissão base + Comissão Venda + Comissão manual por técnico.
- A Apresentação passa a consultar primeiro o RPC organizacional histórico `get_org_technician_daily_overview()` de forma isolada, removendo a dependência prática da migration R2 para o carregamento principal.
- O RPC dedicado da R2 permanece como fallback de compatibilidade.
- Se os RPCs não retornarem dados, Administradores ainda têm fallback pelos meses detalhados carregados, evitando tela vazia quando houver dados disponíveis no dashboard.
- A última visão válida continua preservada em falhas de sincronização.
- Cache-bust de `finance-report-engine.js` e `app.js` atualizado para `2.50.2-r3`.

### V2.50.2 R2 — Correção da fonte de dados da Apresentação

- Corrige regressão em que a Apresentação podia ficar com **0 registros** e status offline após a V2.50.2.
- A tela deixa de depender do carregamento em lote de quatro RPCs organizacionais e passa a buscar somente o consolidado diário necessário ao ranking.
- Adiciona a RPC dedicada `get_presentation_technician_daily_overview()`, restrita à organização do usuário autenticado e sem dados financeiros.
- Mantém fallback para `get_org_technician_daily_overview()` enquanto a migration R2 ainda não tiver sido aplicada, evitando tela vazia em ambientes já compatíveis.
- Preserva a última apresentação válida quando uma atualização falha e não substitui o ranking por um conjunto parcial do técnico logado.
- Cache-bust de `app.js` atualizado para `2.50.2-r2`.

### V2.50.2 R1 — Preset RH corrigido para folha de pagamento

- Ajusta o preset **RH / Pagamento** para as cinco colunas oficiais: **Grupo, Técnico, Comissão base do técnico, Comissão Venda e Comissão manual**.
- A **Comissão manual** consolida bônus manual + prêmios de atendimento/Notas 5. A **Comissão base do técnico** é a parcela automática restante do valor oficial após retirar Comissão Venda e Comissão manual, preservando a reconciliação do total a pagar.
- O preset RH continua ativando automaticamente a aplicação das mesmas colunas ao Excel.
- A configuração salva pelo usuário permanece persistente em **Minha configuração**; o preset RH sempre restaura o layout oficial acima.
- Cache-bust de `finance-report-engine.js` e `app.js` atualizado para `2.50.2-r1`, sem alterar a versão funcional `2.50.2`.

## V2.50.2 — Preset RH + Apresentação compartilhada

- Adiciona preset **RH / Pagamento** com as colunas Técnico e Valor oficial.
- O preset RH habilita a aplicação da mesma seleção no Excel, deixando o arquivo pronto para encaminhamento ao RH.
- A Apresentação deixa de depender dos meses detalhados carregados para o usuário atual e usa o consolidado diário organizacional.
- Técnicos autorizados a abrir a Apresentação passam a ver o mesmo ranking do escopo configurado, e não somente seus próprios números.
- URLs/TVs da Apresentação passam a respeitar o Squad configurado para qualquer usuário autenticado da mesma organização.
- Frontend-only; usa RPC organizacional já existente e não exige migration.

## V2.50.1 — Relatório de bonificação personalizável

- Adiciona configurador de colunas no fechamento de Bonificação.
- Colunas podem ser exibidas/ocultadas e reordenadas por drag-and-drop ou botões.
- Presets Enxuto, Completo e Minha configuração, com prévia da ordem antes da exportação.
- Preferência salva no perfil do usuário e reaproveitada nas próximas gerações.
- PDF passa a usar catálogo dinâmico de colunas e quebra horizontal quando necessário.
- Excel pode seguir a mesma configuração por opção; desmarcado, permanece completo.
- Introduz `js/finance-report-engine.js` para normalização, presets, ordenação e colunas calculadas.
- Sem migration.

## V2.50.0 — Análise comparativa e transparência dos indicadores

- Adiciona comparação opcional no **Meu desempenho** com o mesmo recorte do mês anterior ou período anterior de mesma duração.
- Exibe deltas nos KPIs de Atendimentos, Notas 5, % avaliado e Nota média, sem criar um segundo filtro global.
- Carrega competências adicionais de comparação sob demanda quando necessário.
- Adiciona **Entenda este número** aos cinco KPIs principais, com fórmula, componentes, referência/meta e contexto do período.
- Cria `comparison-engine.js` para cálculo determinístico de intervalos e deltas, com testes unitários.
- Parametriza a agregação e a meta proporcional por `start/end`, evitando dependência indevida do período global em comparações.
- Atualiza versão e cache-bust para `2.50.0`; sem migration.

### V2.49.1 R6 — Alertas centralizados na topbar

- Remove o atalho **Alertas** e seu contador duplicado da sidebar.
- Mantém o sino da topbar como superfície única de notificações e itens não lidos.
- Preserva a **Central de Alertas** completa, acessível pelo popover do sino, busca global, Home e guia de ajuda.
- Simplifica a atualização do badge para trabalhar somente com `notificationBadge` na topbar.
- Cache-bust de `styles.css` e `app.js` atualizado para `2.49.1-r6`.

### V2.49.1 R5 — Sincronização da Apresentação

- Corrige a atualização manual e automática da **Apresentação**, que ainda chamava `loadSupabaseData()` removido na refatoração de carregamento sob demanda.
- A sincronização passa a recarregar diretamente no Supabase as competências usadas pelo período exibido, com `force: true`, sem reconstruir todo o estado do dashboard.
- Períodos com mais de uma competência passam a carregar todas as competências necessárias também ao abrir a Apresentação.
- Em falha de rede/consulta, restaura apenas as competências afetadas e mantém a última apresentação válida.
- Cache-bust de `app.js` atualizado para `2.49.1-r5`.

### V2.49.1 R4 — Competência sem duplicidade na topbar

- Remove visualmente o campo **Competência** da topbar sempre que **Período de análise** estiver ativo.
- Mantém a competência disponível dentro da dialog do Período de análise e preserva o seletor mensal nas telas que não usam período analítico.
- Adiciona proteção em JavaScript e CSS para impedir a regressão do campo duplicado.

## V2.49.1 — Hotfix R2 do seletor de competência no Período de análise

- Corrige a causa real da troca de competência não responder dentro da dialog.
- O Design System renderiza as opções do `select` em um portal fora da dialog; o clique nesse portal era interpretado como clique externo e fechava o **Período de análise** antes da seleção ser concluída.
- O fechamento por clique externo agora reconhece o portal do seletor de competência como parte da dialog.
- Força sincronização imediata do proxy visual do Design System após atualizar opções/valor da competência.
- Mantém o campo **Competência** da topbar sem removê-lo nesta etapa; a retirada continua pendente até a validação funcional.
- Cache-bust de `app.js` atualizado para `2.49.1-r2`, mantendo a versão funcional em `2.49.1`.

## V2.49.1 — Hotfix do seletor de competência no Período de análise

- Corrige a troca de competência dentro da dialog **Período de análise** no modo **Por competência**.
- O seletor passa a reagir imediatamente ao evento `input` e mantém `change` como fallback.
- As opções da competência deixam de ser reconstruídas a cada renderização do calendário, evitando que a seleção ativa seja sobrescrita durante a interação.
- Mantém temporariamente o campo **Competência** da topbar para validação; sua remoção será feita somente após confirmação do teste.
- Cache-bust específico de `app.js` alterado para `2.49.1-r1`, mantendo a versão funcional em `2.49.1`.

## V2.49.1 — Período de análise unificado

- Unifica Competência e Período em **Período de análise** quando a tela utiliza recorte temporal.
- Adiciona os modos **Por competência** e **Intervalo livre**.
- Por competência: Mês completo, Até hoje, 1ª quinzena, 2ª quinzena e Personalizado, com calendário limitado ao mês escolhido.
- Intervalo livre: mantém análise entre múltiplas competências e preserva `analysisStartDate` / `analysisEndDate` como fonte oficial dos cálculos.
- Mantém a proporcionalização mensal de metas em períodos que cruzam competências.
- Drawer mobile passa a exibir o mesmo controle unificado e deixa de contar Competência + Período como dois filtros separados.
- Compatibilidade mantida com URLs e Visões antigas (`month`, `from`, `to`).
- Frontend-only; sem migration e sem alteração da regra financeira `FR-2.48.8-1`.

## V2.49.0 — Sistema unificado de filtros

- Topbar normalizada em Squad, Competência, Período e Técnico, com matriz contextual por módulo.
- Novo PeriodPicker unifica intervalo e atalhos sem alterar `analysisStartDate`/`analysisEndDate`.
- Drawer responsivo para filtros em telas estreitas, com rascunho e aplicação explícita.
- URLs, Visões salvas e filtros persistentes continuam compatíveis com os parâmetros já existentes.
- Indicadores deixam de duplicar controles de período; contextos com filtros locais ocultam filtros globais sem utilidade.
- Home passa a consumir a competência escolhida no consolidado organizacional.
- Frontend-only; sem migration e sem alteração da regra financeira `FR-2.48.8-1`.

## V2.48.14 — Ritmo mensal e clareza entre mês e período

- Novo bloco horizontal **Ritmo do mês** no topo de Meu desempenho, antes dos KPIs do recorte diário.
- Atendimentos e Notas 5 mensais usam os mesmos totais/metas oficiais já existentes; o ritmo necessário reutiliza a lógica diária vigente.
- KPIs do recorte passam a informar **Meta proporcional do período** e um rodapé compacto com o progresso mensal, reduzindo a chance de confundir 110% do recorte com meta mensal concluída.
- `% Avaliado` mostra meta mensal e diferença em pontos percentuais; Nota média fica explicitamente marcada como indicador do período.
- Pontuação é rotulada como **oficial do mês**.
- Removido o card mensal duplicado da parte inferior e eliminada a repetição do intervalo exato no hero e no resumo diário.
- Frontend-only; sem migration e sem alteração da regra financeira `FR-2.48.8-1`.

## V2.48.13 — Central de Importação responsiva, escopo próprio e drag-and-drop

- Central de Importação recebe header/body/footer próprios; somente o corpo rola e as ações permanecem sempre acessíveis.
- Enquanto qualquer modal estiver aberta, o scroll do documento de fundo fica bloqueado, inclusive durante confirmações aninhadas.
- Novo seletor de escopo dentro da importação permite Todos os Squads ou um Squad específico sem depender do filtro externo do painel.
- Troca de escopo reprocessa o CSV já carregado e atualiza prévia, riscos, vínculos e comparação sem exigir novo upload.
- Upload operacional e Produto/Empresa aceita drag-and-drop na tela de Operação e na própria dialog, preservando o seletor de arquivo tradicional.
- Fluxos de validação, confirmação crítica, mês fechado, rollback, histórico e persistência permanecem inalterados.
- Versão frontend `2.48.13`; sem migration nova e sem mudança na regra financeira `FR-2.48.8-1`.

## V2.48.12 — Estabilização visual da Topbar

- Corrige valores de Squad, Mês e Técnico recortados verticalmente após a V2.48.11.
- O layout interno do filtro deixa de depender de grid comprimido e passa a usar coluna flexível com linha de valor de 20 px, preservando a altura externa de 44 px.
- Mantém calendário próprio, IDs, listeners e lógica dos filtros sem alterações.
- Nenhuma migration e nenhuma mudança na regra financeira.

## V2.48.11 — Topbar legível e calendário próprio

- Squad, mês e técnico passam a usar rótulo superior e valor em linha própria na topbar, reduzindo truncamentos sem alterar a lógica dos filtros.
- Atalhos de período ganham largura suficiente para exibir seus textos completos.
- Filtros de data deixam de abrir o calendário nativo do navegador e passam a usar calendário próprio do Design System.
- O novo calendário respeita intervalo importado, período atual, navegação mensal e seleção por `handleAnalysisDateInput()`.
- Nenhuma regra financeira ou estrutura de banco foi alterada.
- Sem migration.

## V2.48.10 — Bonificação orientada ao fechamento e limpeza de atalhos

- Remove avisos intermediários que redirecionavam Operação, Bonificação e Apresentação/TV para a Central de Configurações.
- Coloca o Fechamento Financeiro no topo do módulo de Bonificação.
- Exibe KPIs do mesmo consolidado usado no cálculo: média diária do Squad, % Notas 5 e cancelados/taxa/multiplicador.
- Histórico financeiro e simulador passam para o final e ficam recolhidos por padrão.
- Nenhuma regra financeira foi alterada; `FR-2.48.8-1` permanece vigente.
- Sem migration.

## V2.48.9 — Limpeza visual da governança financeira

- Remove os identificadores técnicos `FR-*` e a assinatura da configuração da interface da Bonificação/Configurações.
- Mantém esses identificadores internamente em memória, auditoria, snapshot e relatórios para rastreabilidade.
- A regra financeira permanece `FR-2.48.8-1`, pois não houve alteração de cálculo.
- Não exige migration.

## V2.48.8 — Exceções de desconto e tela compacta de bonificação

- Férias continuam aplicando 50% somente sobre a comissão-base após cancelamento e passam a isentar automaticamente o desconto por status `ABAIXO`.
- Novo campo `waive_below_discount` permite isentar pontualmente um técnico do desconto sem removê-lo da quantidade do Squad; quando ABAIXO, ele também deixa de alimentar o pool de redistribuição.
- Técnicos isentos ou em férias continuam aptos a receber redistribuição quando estiverem `ACIMA`, salvo quando `exclude_from_group_count` estiver marcado.
- Memória, auditoria, relatório Excel, reimportação e snapshot de fechamento preservam a nova flag; a versão da regra financeira passa a `FR-2.48.8-1` e o snapshot sobe para versão 11.
- A listagem de técnicos na Bonificação foi compactada em grade/tabela responsiva, sem alterar sidebar, topbar ou layouts de outros módulos.
- Nova migration `MIGRACAO_V2.48.8.sql` adiciona `technician_finance_monthly.waive_below_discount`.

## V2.48.7 — Calendário operacional da bonificação e topbar legível

- Corrige o divisor de dias da bonificação: Base do Squad e modelo Individual passam a usar dias úteis operacionais (segunda a sexta menos exceções ativas).
- Novo calendário anual por organização com feriados nacionais fixos padrão e exceções estaduais, municipais ou de empresa.
- Auditoria financeira passa a exibir dias seg–sex, dias não úteis descontados, dias úteis finais e datas consideradas.
- A versão da regra financeira passa a `FR-2.48.7-1`; o snapshot de fechamento sobe para versão 10 e congela o calendário financeiro usado na competência.
- Relatório Excel inclui a memória dos dias úteis.
- Filtros superiores ganham largura maior e tratamento visual restrito à topbar, preservando sidebar e lógica de seleção.
- Nova migration `MIGRACAO_V2.48.7.sql` cria `business_calendar_exceptions` com RLS por organização.

## V2.48.6 — Hotfix de overflow horizontal e integridade do Design System

- Corrige regressão em que os selects-fonte invisíveis de Squad, mês, técnico e outros filtros herdavam `width:100%!important` de regras legadas.
- Elimina o crescimento indevido do documento e o scroll horizontal global que fazia a sidebar parecer desaparecer.
- Reforça a ocultação do select nativo com seletor de maior especificidade, largura mínima/máxima de 1px e contenção de layout.
- Mantém o proxy visual do Design System sem mover o select original e sem alterar listeners de negócio.
- Adiciona validação de integridade horizontal para desktop e breakpoints responsivos.
- Sem migration de banco.

## V2.48.5 — Correção de regressões dos controles e navegação

- Corrige a regressão da V2.48.4 que reparentava todos os `<select>` e podia quebrar filtros dependentes como Squad, competência, técnico, grupos e selects dinâmicos.
- O `<select>` original permanece no mesmo ponto do DOM e continua sendo a fonte de verdade; o Design System usa um proxy visual irmão, sem alterar listeners ou estrutura esperada pela aplicação.
- O menu de opções passa a abrir em portal fixo no `body`, evitando corte por `overflow` em topbar, cards, tabelas e modais.
- Remove hooks globais em `HTMLSelectElement.prototype`; sincronização passa a ser local, por MutationObserver e verificação leve de estado.
- Mantém sincronização quando opções são reconstruídas via `innerHTML`, quando o valor é alterado por JavaScript, quando o campo é desabilitado e quando selects são adicionados/removidos dinamicamente.
- Faz recuperação única das preferências de navegação antigas para reabrir grupos/subgrupos da sidebar após a regressão, preservando apenas o estado de sidebar inteira recolhida.
- Mantém search, number, date/month/datetime-local, color, checkbox/radio, range, file, textarea e demais inputs dentro do Design System.
- Sem migration de banco.
- Suíte automatizada: **201/201 testes aprovados**; smoke visual/funcional adicional validou selects dependentes e todos os tipos de controle no Chromium.

## V2.48.4 — Design System completo nos campos + sidebar estabilizada

- Corrige regressão estrutural da sidebar com grid vertical único e scroll restrito à navegação.
- Mantém campanha, player e versão acessíveis em desktop mesmo com zoom/altura reduzida.
- Padroniza visualmente todos os tipos de campo usados no sistema.
- Remove aparência nativa de `search`, spinners de `number`, seta nativa de `select` e indicadores nativos visíveis de data.
- Date/month/datetime-local recebem acionador visual do Design System mantendo o picker do navegador apenas como mecanismo interno.
- Inputs de cor viram fonte oculta e passam a ser acionados por swatch próprio.
- Todos os `input[type=file]` permanecem ocultos e acessíveis somente por botões do sistema.
- Design System passa a classificar também controles adicionados dinamicamente.
- Sem migration de banco.

## V2.48.3 — Tipografia configurável, controles padronizados e salvamento explícito

- Adiciona fonte do sistema por tema com três opções: Inter, Roboto e Source Sans 3.
- A fonte passa a ser aplicada à interface completa e acompanhada pelo JSON do tema.
- Padroniza selects, checkboxes, radios, ranges, campos temporais, cores e upload visual no Design System.
- Substitui o upload nativo visível do fundo por botão + status de arquivo.
- Personalização de tema passa a operar em rascunho: preview imediato, mas persistência apenas ao clicar em **Salvar tema**.
- Cancelar/fechar o modal restaura o tema anterior sem gravar alterações.
- Mantém botões de salvamento já existentes nas configurações de gráficos, layout, metas, financeiro, custos, apresentação e usuários.
- Inclui MIGRACAO_V2.48.3.sql somente para expor `fontFamily` na identidade visual pública do boot/login; nenhuma tabela nova é criada.

## V2.48.2 — Tema persistente no boot/login e carregamento sem flicker

- Remove o fallback visual imediato para **Brasil em Campo** quando o navegador está sem cache local.
- Adiciona identidade neutra da Soften enquanto o tema persistido ainda está sendo resolvido.
- Adiciona RPC pública sanitizada `get_public_theme_bootstrap` para recuperar somente identidade visual antes do login.
- Mantém `squad_themes` protegido por RLS e sem `SELECT` anônimo direto.
- Aguarda o tema exato do Squad antes de liberar a interface autenticada.
- Remove imagens de futebol hardcoded do boot, boas-vindas de áudio e campanha inicial.
- Exige `MIGRACAO_V2.48.2.sql`.
- Suíte automatizada: **187/187 testes aprovados**.

## V2.48.1 — Sidebar responsiva em zoom e viewport reduzida

- Corrige desaparecimento progressivo da campanha, player e versão em 100% de zoom/viewport baixa.
- Transforma `sidebar-nav` na única área rolável da sidebar desktop.
- Preserva cabeçalho, campanha e rodapé fora do scroll da navegação.
- Mantém a campanha visível e compacta abaixo de 900 px e 760 px de altura.
- Respeita `100dvh` e evita overflow horizontal.
- Não exige migration de banco.

## V2.48.0 — Visões salvas, filtros persistentes e favoritos

- Adiciona estrela de favorito e painel pessoal de **Visões** no cabeçalho.
- Permite salvar a visão atual com nome, rota e filtros aplicáveis.
- Permite abrir, renomear, excluir e favoritar visões salvas.
- Integra favoritos e visões salvas à busca global `Ctrl+K`.
- Lembra Squad, competência, técnico e período por contexto de tela.
- URLs explícitas e visões salvas têm prioridade sobre filtros lembrados.
- Reutiliza `profiles.ui_preferences`/`save_my_ui_preferences`; não cria tabela nova.
- Inclui `js/workspace-engine.js` e testes dedicados.
- Sem migration de banco.
- Suíte automatizada: **180/180 testes aprovados**.

## V2.47.1 — Correção da importação Produto/Empresa com DataAvaliacao

- Corrige a Central de Importação de qualidade, que ainda exigia literalmente a coluna `Time`.
- Passa a aceitar `DataAvaliacao`, `Data Avaliação`, `Data da Avaliação`, `Time` ou `Data` como coluna de data.
- Mantém `nomeApresentativo` e adiciona aliases seguros `Técnico`, `Tecnico` e `Atendente`.
- Mantém `NotaProduto` e `NotaEmpresa` obrigatórias; `NotaServico` continua ignorada na importação de Produto/Empresa.
- Melhora a mensagem de erro exibindo aliases aceitos e cabeçalhos realmente encontrados.
- Validação feita também contra o CSV real de setembro enviado para diagnóstico: 1.706 linhas de dados reconhecidas.
- Sem migration de banco.
- Suíte automatizada: **167/167 testes aprovados**.

## V2.47.0 — Busca global, breadcrumbs e URLs persistentes

- Adiciona busca global com `Ctrl+K` / `Cmd+K` e navegação completa por teclado.
- Indexa telas, seções de Indicadores, módulos de Configurações, Squads e técnicos disponíveis no contexto carregado.
- Filtra resultados conforme perfil e permissões efetivas.
- Adiciona breadcrumbs derivados da mesma rota usada pela navegação.
- Persiste página, seção, módulo, Squad, competência, técnico e período na URL quando aplicável.
- Integra `pushState`, `replaceState` e `popstate` para suportar links compartilháveis e Voltar/Avançar.
- Separa a rota normal `page=presentation` do modo TV `view=presentation`.
- Cria `js/navigation-engine.js` e testes dedicados de normalização, URL e busca.
- Não exige migration de banco.
- Suíte automatizada: **164/164 testes aprovados**.

## V2.46.0 — Central de Alertas + notificações internas

- Adiciona sino global com contador de itens não lidos e popover de notificações recentes.
- Cria a Central de Alertas com KPIs, filtros, busca e ações contextuais.
- Reaproveita sinais operacionais existentes para alertas automáticos de performance e cobertura.
- Permite a Administradores publicar notificações para Todos, Administradores, Técnicos ou Squad específico.
- Adiciona prioridade, categoria, agendamento, expiração e destino opcional de ação.
- Persiste leitura individual no Supabase e mantém leitura local para alertas automáticos.
- Inclui gestão das notificações publicadas e encerramento sem exclusão histórica.
- Adiciona auditoria para publicação/encerramento e permissões `notifications.view`/`notifications.manage`.
- Inclui `MIGRACAO_V2.46.0.sql` com RLS por organização, perfil e Squad.

## V2.45.2 — Filtros superiores e CSV deduplicado

- Centraliza a visibilidade dos filtros superiores para evitar divergência entre `showView()` e `applyPermissions()`.
- Exibe o filtro de período na Apresentação e remove controles sem efeito em módulos que não consomem Squad/Mês/período.
- Oculta Squad em **Indicadores > Impacto financeiro**, que é corporativo para o Suporte técnico completo.
- Corrige importação do CSV deduplicado com aliases de cabeçalho (`Time`, `Data Avaliação`, `Nota Atendimento`, entre outros).
- Reconhece e ignora a diretiva `sep=;` adicionada por algumas exportações do Excel.
- Mantém as quatro dimensões obrigatórias e melhora a mensagem de erro com aliases aceitos e cabeçalhos encontrados.
- Sem migration de banco.
- Suíte automatizada: **144/144 testes aprovados**.

## V2.45.1 — Correção da grade da Home e espaçamento

- Corrige conflito entre `.personal-layout-root` e `.home-widget-grid` que forçava `display:flex` e ignorava os tamanhos dos widgets.
- Mantém a Home em grade de 12 colunas com largura total do container e responsividade existente.
- Corrige persistência visual de widgets ocultos após Salvar/Cancelar; durante a edição eles permanecem visíveis de forma atenuada para poderem ser reativados.
- Amplia o mapeamento de espaçamento para Home, históricos, cabeçalhos e barras de configuração usando `--ds-card-gap`.
- Sem migration e sem alteração de cálculos, metas ou regras financeiras.

## V2.45.0 — Home modular e ritmo visual
- Corrige padding interno ausente em cards herdados que não possuíam espaçamento próprio.
- Padroniza gaps dos grids afetados sem alterar cards que já tinham padding específico.
- Adiciona Home modular em grade de 12 colunas.
- Permite reorganizar widgets por drag-and-drop.
- Permite ocultar/exibir widgets e escolher tamanhos compatíveis por bloco.
- Mantém controles de subir/descer em Configurações como alternativa ao arraste.
- Salva ordem, visibilidade e tamanhos dentro de `ui_preferences` por usuário.
- Mantém comportamento responsivo e oculta widgets não aplicáveis ao perfil Técnico.
- Não exige migration de banco.
- Suíte automatizada da versão: **134/134 testes aprovados**.

## V2.44.0 — Design System e padronização visual
- Cria `css/design-system.css` como camada visual central e temática.
- Cria `js/design-system.js` para classificação semântica de cards e tabelas.
- Padroniza tipografia, espaçamento, raios, sombras, controles e estados de interação.
- Diferencia visualmente cards de KPI, análise, configuração e informação.
- Melhora tabelas com cabeçalho fixo, zebra sutil, números tabulares, primeira coluna fixa em grades largas e densidade automática.
- Integra a preferência de densidade do usuário ao novo sistema visual.
- Mantém temas, gráficos, TV, regras de negócio, permissões e performance sem mudanças funcionais.
- Não exige migration de banco.
- Suíte automatizada da versão: **129/129 testes aprovados**.

## V2.43.2 — Simplificação de perfis e permissões
- Remove Admin de Squad dos fluxos ativos da interface, mantendo apenas Administrador e Técnico.
- Administradores passam a ter acesso integral a todos os Squads e módulos, sem restrições individuais por `permissions`.
- Restrições específicas continuam disponíveis somente para Técnicos e nunca elevam privilégios.
- Cadastro, edição, filtros, Home, ajuda e matriz de permissões foram atualizados para o modelo de dois perfis.
- Edge Functions `create-user` e `manage-user` deixam de criar `squad_admin` e passam a gerenciar Administradores globalmente.
- Inclui `MIGRACAO_V2.43.2.sql`, que converte registros legados `squad_admin` para `super_admin` e reforça `can_admin_squad()` para Administradores globais.
- Mantém o valor legado no schema histórico apenas para compatibilidade com migrations antigas.
- Atualiza documentação, demo e testes estruturais para o modelo atual.
- Suíte automatizada da versão: **122/122 testes aprovados**.

## V2.43.1 — Métricas de performance e ajustes finos
- Mede o login completo, incluindo autenticação, até a interface utilizável.
- Registra tempos de carregamento por módulo e por competência.
- Adiciona contadores de cache hit/miss/stale/write e long tasks do navegador.
- Captura erros de runtime e promises rejeitadas com payload sanitizado.
- Envia telemetria em lote, de forma assíncrona e fora do caminho crítico do login.
- Cria `Configurações → Performance` para Admin Geral com média, P95, erros e módulos mais lentos.
- Adiciona exportação JSON do diagnóstico para análise pontual.
- Inclui `MIGRACAO_V2.43.1.sql` com tabela de eventos e RPCs seguras de gravação/resumo.
- Mantém fallback local quando a migration ainda não foi aplicada.
- Amplia a suíte automatizada para **118 testes**.

## V2.43.0 — Performance e carregamento progressivo
- Substitui o carregamento monolítico pós-login por contexto inicial enxuto e hidratação progressiva.
- Adiciona RPC `get_initial_dashboard_context()` para perfil, Squads, índice de competências e resumo do período atual.
- Implementa lazy loading de competências completas somente quando a tela exige detalhes.
- Paraleliza consultas independentes e deduplica requisições concorrentes da mesma competência.
- Adiciona cache de sessão para contexto inicial, meses completos e temas, com invalidação após gravações relevantes.
- Carrega consolidados organizacionais e comissões de Admin Geral somente quando necessários.
- Adiciona indicador não bloqueante de carregamento sob demanda.
- Expõe diagnóstico de tempo de login em `window.SoftenPerformanceDiagnostics`.
- Adiciona índices de banco para período e métricas diárias via `MIGRACAO_V2.43.0.sql`.
- Ajusta carregamento de assets: áudio sem preload e remoção de arquivos históricos sem uso em runtime.
- Mantém fallback otimizado quando a migration V2.43 ainda não estiver instalada.
- Amplia a suíte para **110 testes automatizados**.

## V2.42.0 — Navegação retrátil e avatar
- Adiciona sidebar retrátil no desktop, com modo compacto de ícones e tooltips.
- Torna Desempenho, Gestão e Conta recolhíveis e cria submódulos Financeiro, Pessoas e Governança.
- Salva o estado da navegação por usuário dentro de `ui_preferences`, com fallback local.
- Adiciona avatar em Meu perfil com recorte quadrado, conversão WebP e limite seguro antes do upload.
- Usa bucket privado `user-avatars` e grava somente `avatar_path` em `profiles`.
- Exibe avatar no topo, Home e Meu perfil, mantendo iniciais como fallback e sem carregar fotos na listagem administrativa.
- Inclui `MIGRACAO_V2.42.0.sql` com bucket, RLS e RPC de atualização do próprio avatar.
- Atualiza Como usar e documentação da arquitetura.

## V2.41.0 — Experiência inicial e Home
- Redesenha a tela de login com a logo oficial da Soften, hierarquia visual mais clara e comportamento responsivo.
- Padroniza proporções de cards, campos e botões para reduzir diferenças visuais entre módulos.
- Cria o módulo **Início** e o define como primeira tela após o login.
- A Home se adapta ao perfil: Técnico, Admin de Squad e Admin Geral recebem KPIs, alertas e atalhos adequados ao próprio contexto.
- Admin Geral recebe visão resumida dos Squads e acesso rápido ao comparativo consolidado.
- Substitui estados vazios silenciosos por mensagens orientativas e ações para importar dados, consultar ajuda ou navegar para o próximo passo.
- Atualiza o guia **Como usar** com o novo fluxo de entrada pelo módulo Início.
- Não altera regras de negócio, autenticação, persistência financeira ou estrutura do banco e não exige migration nova.
- Amplia a suíte para **96 testes automatizados**.

## V2.40.1 — Como usar atualizado
- Reescreve o guia interno para refletir todas as áreas do painel atual.
- Adiciona busca textual dentro do Como usar e contador de tópicos encontrados.
- Adiciona atalhos contextuais para Meu desempenho, Visão do Squad, Indicadores, Apresentação, Operação, Bonificação, Configurações e Meu perfil.
- Adiciona mapa dos módulos com objetivo, momento de uso e acesso direto.
- Documenta Central de Importação, Operação/metas, gestão preditiva, Financeiro avançado, Central de Configurações, TV/Comunicação, usuários/permissões e feedbacks.
- Atualiza a matriz de permissões para o modelo granular da V2.38+.
- Explica playlists, URL fixa de TV, heartbeat e estados Online/Atenção/Offline.
- Mantém o conteúdo sensível ao perfil e às permissões do usuário conectado.
- Não exige migration nova e amplia a suíte para **90 testes automatizados**.

## V2.40.0 — TV / Comunicação
- Playlists nomeadas para reutilizar configurações de apresentação.
- Cadastro de múltiplas TVs com URL dinâmica por dispositivo.
- Monitoramento por heartbeat: online, atenção, offline, última sincronização, tela atual e resolução.
- Alterações em playlists são recarregadas pelas TVs cadastradas durante a sincronização automática.
- Persistência compartilhada no Supabase com RLS, RPC de configuração por dispositivo e heartbeat restrito à telemetria.
- Fallback local preserva a operação em ambiente demo ou antes da migration.
- Amplia a suíte automatizada para **86 testes**, incluindo motor de TV, URLs dinâmicas, heartbeat, status e estrutura da migration.

## V2.39.0 — Financeiro avançado

- adiciona versão explícita do motor financeiro (`FR-2.39.0-1`) em cada cálculo;
- cria assinatura determinística das regras e parâmetros da competência;
- adiciona memória de cálculo com fotografia das configurações, modelo, valores por técnico e total da folha;
- registra memórias automaticamente ao salvar regras, ajustes individuais, copiar regras e fechar a competência;
- adiciona registro manual de memória para auditorias pontuais;
- cria simulador por técnico sem alterar ou persistir dados oficiais;
- simulador recalcula Base do Squad, status, prêmios, redistribuição, férias e teto sobre uma cópia da competência;
- adiciona explicação completa, passo a passo, da bonificação no painel do técnico e na administração;
- fechamento passa a congelar versão e assinatura das regras;
- relatórios Excel/PDF passam a identificar versão e assinatura do cálculo;
- nova tabela imutável `finance_calculation_memory` via `MIGRACAO_V2.39.0.sql`;
- fallback local mantém o histórico disponível no navegador quando a migration ainda não foi executada;
- adiciona `js/finance-advanced.js` e amplia a suíte automatizada para 77 testes.

## V2.38.1 — Centralização das configurações

- transforma **Configurações** no ponto único para regras e comportamento dos módulos;
- move **Metas do Squad** e referências de pontuação para `Configurações > Operação e metas`;
- move modelo financeiro, faixas, cancelamento, prêmios, descontos e teto para `Configurações > Bonificação`;
- move tema, aplicação por Squad/todos os Squads e preferências dos gráficos para `Configurações > Aparência e gráficos`;
- move toda a configuração da TV/carrossel para `Configurações > Apresentação / TV`;
- mantém telas de Operação, Bonificação e Apresentação focadas em dados, conferência e execução;
- adiciona busca de configurações, filtros por módulo e seletor de competência dentro da Central;
- inclui identificação visual **MÓDULO:** em cada card centralizado e atalhos contextuais a partir das telas operacionais;
- preserva Usuários/Permissões como gestão de entidade, mantendo o resumo de governança dentro da Central;
- amplia a suíte para **66 testes automatizados**.

## V2.38.0 — Configurações e personalização

- nova Central de Configurações acessível a todos os perfis;
- layout individual com ordem, visibilidade e densidade dos principais blocos de Meu desempenho, Visão do Squad e Indicadores;
- preferências salvas localmente e sincronizáveis pelo Supabase;
- novo motor `js/settings-engine.js` para layouts e matriz de permissões;
- permissões granulares restritivas por usuário, sem ultrapassar o limite do papel base;
- Admin Geral passa a editar permissões específicas no cadastro de usuário;
- navegação e principais ações administrativas passam a respeitar as permissões efetivas;
- Edge Functions de usuários passam a validar a permissão `users.manage`;
- nova migração V2.38.0 com `profiles.permissions`, `profiles.ui_preferences` e RPC de preferências pessoais;
- suíte automatizada ampliada com testes de permissões e layouts.

## V2.37.0 — Gestão preditiva

- Realizado × Meta × Projeção para atendimentos, notas 5 e % de avaliação.
- Projeção por ritmo de dias úteis e indicador de confiança (baixa, média ou alta).
- Comparação com a competência anterior usando o mesmo corte de dias úteis.
- Alertas automáticos de risco, desaceleração, gap de avaliação e concentração de técnicos em atenção.
- Visão por Squad com status preditivo e tabela dos técnicos com maiores sinais de risco.
- Novo motor `js/predictive-engine.js` testável e desacoplado do `app.js`.
- Suíte ampliada com testes de projeção, comparação, risco e estrutura.

## V2.36.0 — Central de Importação

- nova Central de Importação em Administração;
- prévia por competência antes da gravação;
- comparação Atual x Novo por Squad;
- validações para mês fechado, valores negativos, linhas ignoradas, vínculos não encontrados/ambíguos e quedas relevantes;
- confirmação reforçada com a palavra `IMPORTAR` quando existem alertas;
- checksum simples do arquivo para rastreabilidade;
- histórico recente com tipo, competência, arquivo, escopo, risco e status;
- snapshot de segurança das competências tocadas;
- restauração automática do snapshot se uma importação falhar no meio da gravação;
- reversão da última importação concluída por até 30 minutos, bloqueada se uma competência afetada tiver sido fechada;
- persistência opcional do histórico no Supabase via `import_batches`;
- novo `js/import-engine.js` com regras testáveis de prévia e validação;
- suíte ampliada para 49 testes automatizados.

## V2.35.1 — Estrutura e estabilidade

- criado `js/chart-engine.js` como núcleo único das regras visuais e geométricas dos gráficos;
- preferências de gráficos, escala percentual, altura, espessura, pontos e densidade de rótulos agora passam pelo mesmo motor;
- primitivas SVG e interações de tooltip/legenda foram removidas do `app.js` e centralizadas no motor;
- `app.js` reduzido de 3.082 para 2.937 linhas sem remover funcionalidades;
- adicionados testes de `chart-engine` e testes de arquitetura/ordem de carregamento;
- validador do projeto passou a exigir o motor central e impedir duplicação das primitivas principais no `app.js`;
- suíte automatizada ampliada para 40 testes.

## V2.34.8 — Gráficos padronizados, aparência multi-Squad e férias na comissão-base

- Padroniza os gráficos legados (diário e histórico) para respeitar densidade de rótulos, fonte, altura, espessura de linha e tamanho dos pontos.
- Remove conflitos de altura fixa dos gráficos de qualidade em telas menores, preservando apenas limites responsivos de segurança.
- Persiste `chartPreferences` no JSON do tema e no Supabase.
- Admin Geral pode escolher aplicar a aparência somente ao Squad atual ou replicar para todos os Squads A/B/D/E.
- Corrige férias na bonificação: o redutor de 50% passa a incidir somente sobre a comissão-base após o multiplicador de cancelamento; bônus, prêmios, vendas, desconto e redistribuição ficam integrais.
- Relatórios e detalhamento financeiro passam a exibir a base após férias e o ajuste correspondente.

## V2.34.7 — Logo na apresentação

- Adiciona a marca Soften no hero do módulo Apresentação e no modo TV direto.
- Logo se adapta às densidades compacta, normal e ampla.
- Mantém compatibilidade com o ajuste automático de resolução da TV.

## V2.34.5 — Rótulos de dados permanentes nos gráficos

- Exibe os valores diretamente sobre pontos, linhas e barras, sem depender de hover.
- Mantém tooltip interativo como complemento.
- Adiciona posicionamento alternado e tamanho compacto para reduzir sobreposição em gráficos com várias séries.
- Aplica rótulos ao gráfico diário, históricos, indicadores, qualidade e gráficos em tela cheia.
- Preserva formatação de percentual, moeda e números conforme cada métrica.

# V2.34.5

- Apresentação em TV passa a usar encaixe automático baseado na área útil da tela, com referência 16:9 de 1920x1080.
- Modo direto bloqueia barras de rolagem e recalcula a escala ao redimensionar, entrar/sair do fullscreen ou alterar o conteúdo.
- Novas opções administrativas: Ajuste à tela, Escala, Densidade e Margem de segurança.
- Escala pode ser automática ou ajustada entre 75% e 110% como multiplicador do encaixe calculado.
- Densidade automática escolhe Compacta, Normal ou Ampla conforme resolução e volume de linhas.
- URLs da TV carregam fit, scale, density e safe, permitindo configuração diferente por televisão.
- Mantidos carrossel, atualização automática, tolerância a queda de conexão e preferências existentes.

# V2.34.3

- Padroniza dimensoes de todos os filtros do cabecalho para impedir reflow ao alternar Squad, mes, tecnico, datas e atalhos de periodo.
- Squad, mes, tecnico, datas, presets, tema e usuario passam a ocupar caixas estaveis no desktop.
- Filtros do painel Indicadores recebem grade previsivel e deixam de variar conforme o conteudo.
- Breakpoints de zoom/tablet/celular reorganizam os controles sem recalcular suas larguras pelo texto selecionado.

# V2.34.2

- Corrigida a largura do filtro de Squad no topo para permanecer fixa ao alternar entre Todos os Squads e Squads individuais.
- Mantida largura adaptada no breakpoint responsivo, evitando deslocamento dos controles em zoom alto.

- Sidebar passa para drawer responsivo em viewport estreita/zoom, com backdrop, fechamento por ESC e botão sempre acessível.
- Breakpoint ampliado para 980 px para evitar desaparecimento da navegação ao aumentar o zoom.
- Tela Indicadores reorganizada para tablet/celular: filtros, abas, KPIs, gráficos, cabeçalhos e ações empilham sem estourar a viewport.
- Tabelas e matrizes largas mantêm rolagem horizontal controlada no celular.
- Nenhuma regra de cálculo ou persistência foi alterada.

## V2.34.0 — Apresentação (Etapa 4: Administração)

- Adicionada área administrativa no módulo Apresentação.
- Configuração de Squad da TV, intervalo do carrossel e frequência de atualização.
- Seleção e reordenação das seis abas do ranking.
- Preferências de indicadores, G6/Z4, filtros e número de colunas.
- URL da TV passa a carregar as preferências de forma autocontida.
- Preferências administrativas também ficam salvas no navegador.
- Botões para copiar a URL configurada e abrir a TV diretamente.
- Mantida compatibilidade com URLs de apresentação das versões anteriores.
- Versão atualizada para 2.34.0.

## V2.33.0 — Apresentação (Etapa 3: TV contínua)

- Carrossel de 20s com barra de progresso e contador regressivo.
- Fullscreen por botão, duplo clique e tecla `F`.
- Atalhos de teclado para carrossel, navegação e atualização.
- Atualização automática dos dados a cada 5 minutos e botão de atualização manual.
- Recuperação automática quando a conexão volta, com retentativa em 1 minuto durante falhas.
- Últimos dados válidos permanecem na tela se a internet ou o Supabase ficarem indisponíveis.
- Indicador visual de Online / Sincronizando / Sem conexão / Atenção.
- Screen Wake Lock no modo TV quando suportado pelo navegador.
- Versão atualizada para 2.33.0.

## V2.32.0 — Apresentação (Etapa 2: Ranking completo)

- Porta as seis visualizações do `app_ranking` para o módulo Apresentação.
- Reproduz os cálculos de ranking diário, acumulado, notas e grupos.
- Mantém critérios de desempate do monitor original.
- Adiciona G6, Z4 e movimentação de posições.
- Adiciona carrossel automático de 20 segundos e pausa temporária após troca manual de aba.
- Mantém URL direta por Squad ou consolidada em `squad=all`.
- Usa exclusivamente o histórico diário já salvo no Performance Hub; não exige nova importação de CSV.

## V2.30.3

- Corrige o tema público exibido antes da autenticação: login e carregamento agora usam Brasil em Campo como fallback nativo.
- Remove o flash visual do dragão no primeiro carregamento ao trocar o `--hero-img` padrão do CSS e os `src` estáticos para a arte pública brasileira.
- Mantém temas personalizados por Squad após o login; o fallback público só é usado quando ainda não há tema autenticado/cache disponível.
- Mantém o preset Vermithor disponível de forma explícita, sem torná-lo novamente o tema padrão da aplicação.

## V2.30.2

- Corrige superfícies visuais que ainda podiam exibir a arte Vermithor em cards e previews.
- Hero, visão do Squad, ajuda, perfil, preview de aparência, login, carregamento e ambientação passam a receber a imagem do tema localmente.
- Squads ainda salvos com o tema legado Vermithor herdam a última identidade personalizada conhecida, evitando o retorno do dragão ao alternar entre Squads.
- O cache público deixa de ser sobrescrito por temas legados Vermithor.

## 2.30.2
- Corrige o Hero principal para exibir de forma visível a imagem configurada no tema.
- A visão "Todos os Squads" agora preserva o tema do último Squad selecionado, sem voltar ao Vermithor.
- Login e carregamento recuperam o último tema conhecido e, em atualizações, tentam também o tema salvo por Squad no cache local.
- O último Squad visualizado passa a ser lembrado para restaurar corretamente a identidade visual antes da autenticação.

# Changelog

## V2.30.0 — Tema unificado nas telas e artes da campanha

- A imagem definida em **Aparência > Imagem de fundo** passa a ser reutilizada no fundo principal, login, carregamento, boas-vindas da trilha e card lateral da campanha.
- Nome e frase da campanha passam a atualizar também o card lateral, a tela de carregamento e o título de boas-vindas da trilha.
- O último tema aplicado fica armazenado localmente para manter a identidade visual nas telas anteriores ao login. Em navegador novo, o tema padrão é usado até a primeira autenticação, quando o tema do Squad é carregado.
- Mantido fallback para os assets originais quando não existe fundo personalizado.


Histórico resumido do Soften Performance Hub. As notas completas de cada versão permanecem em `docs/releases/`.

## 2.29.9

- compatibilidade com a mudança de exposição automática da Data API do Supabase prevista para 30/10/2026;
- nova migration `MIGRACAO_V2.29.9.sql` com `GRANT`s explícitos para frontend autenticado e Edge Functions;
- nenhuma nova permissão para o role `anon`;
- `schema.sql` cumulativo atualizado para novas instalações;
- documentação e Quality Gate reforçados para futuras tabelas.

## 2.29.8

- nova área **Gestão > Auditoria** com leitura por escopo e RLS;
- registro de alterações administrativas com ator, data/hora, descrição e visão antes/depois;
- auditoria de usuários realizada pelas Edge Functions `create-user` e `manage-user`;
- auditoria de importações, competências, metas, regras/valores financeiros, custos e impacto financeiro;
- confirmação digitada para exclusões e reabertura de competência;
- sanitização de campos sensíveis nos payloads de auditoria;
- novos testes automáticos para confirmação crítica e sanitização;
- nova migração `MIGRACAO_V2.29.8.sql` e atualização do instalador cumulativo.

## 2.29.7

- extração das regras financeiras críticas para `js/finance-rules.js`;
- inclusão de testes automáticos com Node.js para faixas, cancelamento, status, prêmios, redistribuição, férias, piso zero e teto global;
- inclusão do GitHub Actions `Quality Gate` em pushes e Pull Requests da `main`;
- validação estrutural reforçada para garantir o carregamento correto do módulo financeiro;
- nenhuma migração de banco de dados necessária.

## 2.29.6

- consolidação das regras de status e bonificação;
- ajuste de arredondamento da nota média;
- separação definitiva entre status operacional e exclusão financeira de competência parcial;
- alinhamento do ranking/RPC com a visão administrativa.

## 2.29.5

- inclusão de atendimentos não elegíveis à avaliação;
- ajuste da base de cálculo da % de avaliação e da bonificação.

## 2.29.0–2.29.4

- impacto financeiro da qualidade;
- leitura estratégica de risco;
- consistência de referências/status;
- importação operacional mais robusta;
- status da equipe derivado dos status individuais.

## 2.28.x

- indicadores de férias e legibilidade;
- base de custos gerais do Suporte.

## 2.27.x

- conciliação Serviço x Produto x Empresa;
- indicadores por dias úteis;
- detalhamento e correções do histórico diário.

## 2.26.x

- indicadores de qualidade e importação independente de Produto/Empresa.

## Notas completas

- [2.29.9 — Compatibilidade Data API do Supabase](docs/releases/ATUALIZACAO_V2.29.9.md)
- [2.29.8 — Auditoria e proteção de operações críticas](docs/releases/ATUALIZACAO_V2.29.8.md)
- [2.29.7 — Qualidade automatizada e testes financeiros](docs/releases/ATUALIZACAO_V2.29.7.md)
- [2.29.6 — Soften Performance Hub V2.29.6](docs/releases/ATUALIZACAO_V2.29.6.md)
- [2.29.5 — Soften Performance Hub V2.29.5](docs/releases/ATUALIZACAO_V2.29.5.md)
- [2.29.4 — Atualização V2.29.4 — Status da equipe consistente](docs/releases/ATUALIZACAO_V2.29.4.md)
- [2.29.3 — Atualização V2.29.3 — Importação operacional mais robusta](docs/releases/ATUALIZACAO_V2.29.3.md)
- [2.29.2 — Atualização V2.29.2 — Consistência de status e referências](docs/releases/ATUALIZACAO_V2.29.2.md)
- [2.29.1 — Atualização V2.29.1 — Leitura estratégica do impacto financeiro](docs/releases/ATUALIZACAO_V2.29.1.md)
- [2.29.0 — V2.29.0 — Impacto financeiro da qualidade](docs/releases/ATUALIZACAO_V2.29.0.md)
- [2.28.1 — V2.28.1 — Custo geral do Suporte](docs/releases/ATUALIZACAO_V2.28.1.md)
- [2.28.0 — Soften Performance Hub V2.28.0](docs/releases/ATUALIZACAO_V2.28.0.md)
- [2.27.4 — Soften Performance Hub V2.27.4](docs/releases/ATUALIZACAO_V2.27.4.md)
- [2.27.2 — Soften Performance Hub V2.27.2](docs/releases/ATUALIZACAO_V2.27.2.md)
- [2.27.1 — Soften Performance Hub V2.27.1](docs/releases/ATUALIZACAO_V2.27.1.md)
- [2.27.0 — Soften Performance Hub V2.27.0](docs/releases/ATUALIZACAO_V2.27.0.md)
- [2.26.1 — ATUALIZAÇÃO V2.26.1](docs/releases/ATUALIZACAO_V2.26.1.md)
- [2.26.0 — Soften Performance Hub V2.26.0](docs/releases/ATUALIZACAO_V2.26.0.md)
- [2.25.0 — Soften Performance Hub V2.25.0](docs/releases/ATUALIZACAO_V2.25.0.md)
- [2.24.3 — Atualização V2.24.3](docs/releases/ATUALIZACAO_V2.24.3.md)
- [2.24.2 — Atualização V2.24.2](docs/releases/ATUALIZACAO_V2.24.2.md)
- [2.24.1 — Atualização V2.24.1 — Meu Desempenho](docs/releases/ATUALIZACAO_V2.24.1.md)
- [2.24.0 — Atualização V2.24.0 — Light & Dark Mode Premium](docs/releases/ATUALIZACAO_V2.24.0.md)
- [2.23.3 — Atualização V2.23.3](docs/releases/ATUALIZACAO_V2.23.3.md)
- [2.23.2 — Soften Performance Hub V2.23.2](docs/releases/ATUALIZACAO_V2.23.2.md)
- [2.23.1 — Soften Performance Hub V2.23.1](docs/releases/ATUALIZACAO_V2.23.1.md)
- [2.23.0 — Atualização V2.23.0 — Gráficos e Métricas Premium](docs/releases/ATUALIZACAO_V2.23.0.md)
- [2.22.0 — Atualização V2.22.0 — Interface premium](docs/releases/ATUALIZACAO_V2.22.0.md)
- [2.21.0 — Soften Performance Hub V2.21.0](docs/releases/ATUALIZACAO_V2.21.0.md)
- [2.20.5 — Atualização V2.20.5](docs/releases/ATUALIZACAO_V2.20.5.md)
- [2.20.4 — Atualização V2.20.4](docs/releases/ATUALIZACAO_V2.20.4.md)
- [2.20.3 — Atualização V2.20.3](docs/releases/ATUALIZACAO_V2.20.3.md)
- [2.20.2 — Atualização V2.20.2](docs/releases/ATUALIZACAO_V2.20.2.md)
- [2.20.1 — Atualização V2.20.1](docs/releases/ATUALIZACAO_V2.20.1.md)
- [2.20.0 — Atualização V2.20.0](docs/releases/ATUALIZACAO_V2.20.0.md)
- [2.19.1 — Atualização V2.19.1](docs/releases/ATUALIZACAO_V2.19.1.md)
- [2.19.0 — Atualização V2.19.0 — checklist de produção](docs/releases/ATUALIZACAO_V2.19.0.md)
- [2.18.1 — Soften Performance Hub V2.18.1](docs/releases/ATUALIZACAO_V2.18.1.md)
- [2.18.0 — Atualização V2.18.0](docs/releases/ATUALIZACAO_V2.18.0.md)
- [2.17.1 — Atualização V2.17.1 — correção da trilha ambiente](docs/releases/ATUALIZACAO_V2.17.1.md)
- [2.17.0 — Atualização V2.17.0 — trilha ambiente por tema](docs/releases/ATUALIZACAO_V2.17.0.md)
- [2.16.0 — Atualização V2.16.0](docs/releases/ATUALIZACAO_V2.16.0.md)
- [2.15.0 — Atualização V2.15.0](docs/releases/ATUALIZACAO_V2.15.0.md)
- [2.14.1 — Atualização V2.14.1](docs/releases/ATUALIZACAO_V2.14.1.md)
- [2.14.0 — Atualização V2.14.0](docs/releases/ATUALIZACAO_V2.14.0.md)
- [2.13.0 — Atualização V2.13.0](docs/releases/ATUALIZACAO_V2.13.0.md)
- [2.12.0 — Atualização V2.12.0](docs/releases/ATUALIZACAO_V2.12.0.md)
- [2.11.0 — Atualização V2.11.0](docs/releases/ATUALIZACAO_V2.11.0.md)
- [2.10.1 — Atualização V2.10.1](docs/releases/ATUALIZACAO_V2.10.1.md)
- [2.10.0 — Atualização V2.10.0](docs/releases/ATUALIZACAO_V2.10.0.md)
- [2.9.0 — Atualização V2.9.0](docs/releases/ATUALIZACAO_V2.9.0.md)
- [2.8.0 — Atualização V2.8.0](docs/releases/ATUALIZACAO_V2.8.0.md)
- [2.7.0 — Atualização V2.7.0](docs/releases/ATUALIZACAO_V2.7.0.md)
- [2.6.0 — Atualização para V2.6.0](docs/releases/ATUALIZACAO_V2.6.0.md)
- [2.5.0 — Atualização V2.5.0](docs/releases/ATUALIZACAO_V2.5.0.md)
- [2.4.0 — Atualização V2.3.0 → V2.4.0](docs/releases/ATUALIZACAO_V2.4.0.md)
- [2.3.0 — Atualização V2.2.x → V2.3.0](docs/releases/ATUALIZACAO_V2.3.0.md)
- [2.2.0 — Atualização V2.1.1 -> V2.2.0](docs/releases/ATUALIZACAO_V2.2.0.md)

## V2.31.0 — Módulo Apresentação (Etapa 1)

- Adicionado o módulo **Apresentação** ao menu Desempenho.
- Criada URL direta para TV por `?view=presentation` e filtro opcional `squad`.
- Apresentação consome os mesmos dados já carregados no Performance Hub, sem nova importação de CSV.
- Adicionados indicadores de resumo e ranking inicial por atendimentos.
- Criado layout direto para TV sem sidebar/topbar.
- Adicionados atalhos de URL, nova tela e fullscreen.
- Separação inicial em `js/presentation.js` e `css/presentation.css` para suportar a evolução do carrossel na Etapa 2.
