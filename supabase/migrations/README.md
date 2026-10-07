# Migrações do Supabase

Este diretório preserva o histórico de evolução do banco do Soften Performance Hub.

## Instalação nova

Para um projeto Supabase novo, use **`../schema.sql`**. Ele já reúne a estrutura necessária até a V2.48.8.

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

