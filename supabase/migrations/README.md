# Migrações do Supabase

Este diretório preserva o histórico de evolução do banco do Soften Performance Hub.

## Instalação nova

Para um projeto Supabase novo, use **`../schema.sql`**. Ele já reúne a estrutura necessária até a V2.51.0.

Depois:

1. publique as Edge Functions de `../functions/`;
2. crie o primeiro usuário no Supabase Auth;
3. execute `../bootstrap_primeiro_admin.sql` informando o UUID do usuário;
4. configure `js/config.js` no frontend.

## Base existente

Não execute `schema.sql` sobre produção apenas para atualizar versão. Aplique somente as migrações que ainda não foram executadas, respeitando a ordem de versão.

A sequência com alterações de banco é:

```text
V2.3.0
V2.4.0
V2.11.0
V2.13.0
V2.14.0
V2.18.0
V2.19.0
V2.20.0
V2.20.5
V2.21.0
V2.24.2
V2.25.1
V2.26.0
V2.27.0
V2.28.0
V2.28.1
V2.29.0
V2.29.2
V2.29.5
V2.29.6
V2.29.8
V2.29.9
V2.36.0
V2.38.0
V2.39.0
V2.40.0
V2.42.0
V2.43.0
V2.43.1
V2.43.2
V2.46.0
V2.48.2
V2.48.3
V2.48.7
V2.48.8
V2.50.2 R2
V2.50.2 R4
V2.51.0
```

`MIGRACAO_V2.25.0.sql` foi preservada como histórico; para uma instalação que ainda não tenha feedbacks, prefira a revisão `V2.25.1`.


## V2.29.8 — Auditoria

`MIGRACAO_V2.29.8.sql` cria `audit_logs`, habilita RLS e disponibiliza a RPC `log_audit_event`. Depois da migração, republique `create-user` e `manage-user` para que as operações administrativas de usuários também sejam auditadas no backend.


## V2.29.9 — Grants explícitos da Data API

`MIGRACAO_V2.29.9.sql` adiciona os privilégios SQL explícitos exigidos pela nova política de exposição da Data API do Supabase. A migração cobre as duas tabelas financeiras criadas sem `GRANT` na V2.18.0 e os acessos das Edge Functions que usam `service_role`.

A migração não concede acesso ao role `anon`. O frontend exige autenticação e continua protegido por RLS/policies.

Para qualquer tabela nova criada em `public`, inclua o `GRANT` necessário na mesma migração que contém o `CREATE TABLE`.


## V2.39.0 — Memória financeira

`MIGRACAO_V2.39.0.sql` cria `finance_calculation_memory` para preservar a memória imutável dos cálculos de bonificação, com RLS por Squad e permissões financeiras granulares. Execute a migration para compartilhar o histórico entre navegadores e gestores.


## V2.42.0 — Avatar privado

`MIGRACAO_V2.42.0.sql` adiciona `profiles.avatar_path`, cria o bucket privado `user-avatars`, limita objetos a 128 KB e aplica policies de leitura por organização e escrita somente no próprio caminho. A RPC `save_my_avatar_path(text)` atualiza somente o avatar do usuário autenticado.


## V2.43.0 — Contexto inicial e índices de performance

`MIGRACAO_V2.43.0.sql` cria a RPC `get_initial_dashboard_context()` para o caminho crítico do login e adiciona índices de apoio à busca por competência e detalhes diários. A RPC limita o resultado à organização/papel do usuário autenticado e não leva detalhes diários nem regras financeiras pesadas no índice inicial.


## V2.43.1 — Observabilidade de performance

`MIGRACAO_V2.43.1.sql` cria `app_performance_events` e as RPCs `record_performance_events(jsonb)` e `get_performance_summary(integer)`. O frontend não recebe acesso direto à tabela; a gravação associa automaticamente organização/usuário pela sessão e a consulta agregada exige Administrador.

A telemetria contém apenas tempos, nome técnico do evento, origem resumida, versão do app e metadados pequenos de cache/erro. Não armazena senha, CSV, conteúdo de atendimento ou dados de clientes.


## V2.43.2 — Simplificação de perfis

`MIGRACAO_V2.43.2.sql` converte qualquer `squad_admin` legado para `super_admin`, remove vínculo fixo de Squad e restrições individuais dos Administradores e atualiza `can_admin_squad(uuid)` para conceder administração somente ao Administrador global da organização.

Depois da migration, republique as Edge Functions `create-user` e `manage-user`, pois elas passam a aceitar somente `super_admin` e `technician` como perfis ativos.


## V2.46.0 — Central de Alertas

`MIGRACAO_V2.46.0.sql` cria `internal_notifications` e `internal_notification_reads`. As policies mantêm o isolamento por organização, restringem publicação/encerramento a Administradores e permitem que cada usuário registre somente a própria leitura. Técnicos recebem apenas comunicados destinados a todos, técnicos ou ao próprio Squad.


## V2.48.2 — Identidade visual pública do boot/login

`MIGRACAO_V2.48.2.sql` cria a RPC `get_public_theme_bootstrap(text)`. Ela permite que a tela de entrada recupere somente a identidade visual antes da autenticação, sem conceder `SELECT` anônimo nas tabelas do sistema. Após o login, o frontend continua carregando o tema autenticado exato do Squad.


## V2.48.7 — Calendário operacional

`MIGRACAO_V2.48.7.sql` cria `business_calendar_exceptions`, com leitura limitada à própria organização e manutenção restrita a Administradores. O frontend combina essas exceções com os feriados nacionais fixos padrão e usa o resultado apenas no cálculo financeiro por dias úteis. Competências fechadas preservam a memória usada no snapshot.

## V2.48.8 — Isenção individual do desconto ABAIXO

`MIGRACAO_V2.48.8.sql` adiciona `technician_finance_monthly.waive_below_discount`. A flag é específica por técnico e competência: mantém o profissional na Base do Squad e na redistribuição quando `ACIMA`, mas impede o desconto financeiro quando `ABAIXO` e não adiciona esse valor ao pool. Férias recebem a mesma isenção automaticamente pelo motor financeiro, sem depender da flag manual.



## V2.50.2 R2 — Fonte dedicada da Apresentação

`MIGRACAO_V2.50.2_R2.sql` cria `get_presentation_technician_daily_overview()`. A RPC entrega somente métricas diárias necessárias ao ranking da Apresentação, usa `SECURITY DEFINER`, exige usuário autenticado ativo e limita o resultado à mesma `organization_id`. Isso permite que técnicos vejam o ranking compartilhado sem expor dados financeiros nem depender do carregador organizacional completo.

## V2.50.2 R4 — Fonte organizacional da Apresentação

`MIGRACAO_V2.50.2_R4.sql` cria `get_presentation_daily_context_v2502(date,date,text)` para entregar à Apresentação somente as métricas diárias do período/Squad solicitado, sempre dentro da organização do usuário autenticado. O RPC não expõe dados financeiros e força o recarregamento do schema do PostgREST após a criação.

## V2.51.0 — Identidade estável de técnicos

`MIGRACAO_V2.51.0.sql` cria `technician_aliases` para armazenar os nomes atuais e históricos usados pelo CRM/CSV e vinculá-los ao `user_id` real do técnico. A migration também semeia aliases a partir do cadastro, histórico de Squad, competências mensais já vinculadas e auditoria, além de adicionar índice de apoio em `technician_monthly(squad_month_id,user_id)`.

A migration não soma nem apaga métricas mensais existentes. Se uma competência já tiver dois registros da mesma pessoa por mudança de nome, confirme o alias em **Usuários** e reimporte o CSV operacional daquele mês; a aplicação reconcilia as linhas usando o CSV como fonte de verdade. Não é necessário republicar Edge Functions.

## V2.53.0 — Qualidade Completa sem deduplicação

`MIGRACAO_V2.53.0.sql` cria `quality_full_daily`, uma base agregada diária para o gráfico Serviço × Produto × Empresa alimentado por CSV completo, sem deduplicação prévia. A tabela armazena somente contagens de notas por Squad/data e metadados técnicos da importação; não recebe nome, CPF/CNPJ ou identificador de cliente.

A migration também amplia `import_batches.kind` com `quality-full`. Leitura segue `can_read_squad(uuid)` e escrita exige `can_admin_squad(uuid)`. Não é necessário republicar Edge Functions.

## V2.53.1 — Consolidados diários por período

`MIGRACAO_V2.53.1.sql` adiciona `get_org_daily_attendance_overview_range(date,date)` e `get_org_technician_daily_overview_range(date,date)`. As novas RPCs restringem o consolidado diário ao período solicitado pelo frontend e preservam o isolamento por organização do usuário autenticado. O frontend também pagina os resultados, evitando truncamento em 1.000 linhas quando o período possui muitos técnicos/dias.

Não é necessário republicar Edge Functions.

### V2.57.0 — Fundação da Gestão Estratégica

Execute `MIGRACAO_V2.57.0.sql` para criar `strategy_access` e `has_strategy_access`. Esta etapa não cria salário ou custos.

### V2.57.1 — Acesso estratégico opt-in

Execute `MIGRACAO_V2.57.1.sql` depois da V2.57.0. Ela torna o acesso à Gestão Estratégica desmarcado por padrão, restringe a administração dos checkboxes ao Super Admin e revoga o bootstrap automático criado na fundação. Não é necessário republicar Edge Functions.

### V2.57.2 — Competências, pessoas e custos pessoais

Execute `MIGRACAO_V2.57.2.sql` depois da V2.57.1. A migration cria `strategy_competences`, `strategy_people`, `strategy_employee_costs` e a RPC agregada `get_strategy_people_cost_summary(date,text)`. Usuários com acesso estratégico básico continuam sem acesso aos salários individuais; a edição exige `can_view_people_costs` e `can_edit_costs`. Não é necessário republicar Edge Functions.


### V2.57.4 — Motor financeiro + consolidação por Squad

Execute `MIGRACAO_V2.57.4.sql` depois da V2.57.2. A migration alinha o checkbox estratégico ao MVP atual (`can_view_people_costs` + `can_edit_costs`), cria `strategy_operational_costs`, `strategy_cost_allocations` e as RPCs agregadas `get_strategy_financial_summary(date,text)` e `get_strategy_squad_cost_summary(date)`. Não é necessário republicar Edge Functions.

- `MIGRACAO_V2.57.6.sql`: fechamento de competências, snapshots versionados e proteção de competências fechadas.

### V2.57.7 — Saneamento de identidade na reimportação

Execute `MIGRACAO_V2.57.7.sql` depois da V2.57.6. A migration remove `user_id` inválido de competências operacionais abertas, instala uma proteção para impedir novos vínculos com técnico inativo/excluído e atualiza o ranking individual do próprio Squad para ignorar esses registros enquanto a competência estiver aberta. A produção histórica permanece nos totais do Squad. Não é necessário republicar Edge Functions.

### V2.58.0 R5 - compatibility hotfix
Execute `MIGRACAO_V2.58.0_R5.sql` after the strategic migrations when the database originated from V2.57.3. It upgrades the legacy `strategy_cost_allocations` shape to the current contract without deleting existing allocations.

### V2.58.2 — Base explícita de resoluções

Execute `MIGRACAO_V2.58.2.sql` antes de usar custo por resolução e produtividade econômica. A migration cria `strategy_resolution_metrics` e as RPCs agregadas de resolução. Resolução permanece uma fonte própria e não é inferida automaticamente a partir de atendimentos.

### V2.58.8 — Snapshots, histórico e evolução

Execute `MIGRACAO_V2.58.8.sql` depois da V2.58.2. Ela cria `strategy_efficiency_snapshots`, captura revisões imutáveis no fechamento e disponibiliza o histórico agregado por `get_strategy_efficiency_history()`. Competências fechadas anteriormente são identificadas como `legacy_backfill`.

### V2.58.9 — Hardening e fechamento da Fase 3

Execute `MIGRACAO_V2.58.9.sql` depois da V2.58.8. Ela instala validação de integridade em `strategy_resolution_metrics`, impedindo resoluções negativas, competências divergentes, alterações indevidas após fechamento e resoluções superiores aos atendimentos operacionais vinculados. Também reforça o contrato dos snapshots de eficiência. Não é necessário republicar Edge Functions.


### V2.59.1 — Capacidade disponível

Execute `MIGRACAO_V2.59.1.sql` depois da V2.58.9. A migration adiciona `availability_factor` aos custos pessoais por competência e cria as RPCs agregadas `get_strategy_capacity_summary(date,text)` e `get_strategy_capacity_squad_summary(date)`. Competências abertas existentes recebem 100% como ponto de partida; competências já fechadas permanecem sem disponibilidade retroativa. Não é necessário republicar Edge Functions.

### V2.59.2 — Capacidade utilizada

Execute `MIGRACAO_V2.59.2.sql` depois da V2.59.1. A migration cria as RPCs agregadas `get_strategy_capacity_used_summary(date,text)` e `get_strategy_capacity_used_squad_summary(date)`, consolidando resoluções absorvidas e resoluções por FTE disponível com cobertura fail-closed. Ela não cria tabela nova e não calcula percentual de utilização; essa taxa fica reservada para a V2.59.3. Não é necessário republicar Edge Functions.


### V2.59.3 — Utilização, ociosidade e sobrecarga

Execute `MIGRACAO_V2.59.3.sql` depois da V2.59.2. A migration cria `get_strategy_capacity_utilization_history()`, que publica somente histórico agregado de competências fechadas por operação e Squad. A aplicação usa essa base para calcular a mediana histórica da janela selecionada, taxa de utilização e faixas de capacidade. Não cria tabela nova, não altera custos e não preenche disponibilidade retroativamente. Não é necessário republicar Edge Functions.

### V2.59.5 — FCR automático + FTE necessário

Execute `MIGRACAO_V2.59.5.sql` depois da V2.59.3 (a V2.59.4 não possui migration). Ela cria a base agregada da coluna `Resolve` da Qualidade Completa, publica `get_operational_fcr_overview_range(date,date)`, sincroniza `strategy_resolution_metrics` por `sync_strategy_resolution_metrics_from_quality(date,text)` e amplia `get_strategy_capacity_utilization_history()` com atendimentos por FTE disponível para o cálculo de FTE necessário. Não é necessário republicar Edge Functions.


### V2.61.2 — Custo por Produto
Execute `MIGRACAO_V2.61.2.sql` depois da V2.61.1. A migration adiciona `sync_strategy_product_cost_sources(date,text)` e `get_strategy_product_cost_summary(date,text)`. O sincronizador reutiliza custos oficiais de pessoas/operação, usa Atendimentos por Produto como driver e mantém o saldo como Não classificado. Não é necessário republicar Edge Functions.
