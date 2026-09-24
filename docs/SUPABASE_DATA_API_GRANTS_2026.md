# Supabase Data API — ajuste de GRANTs para 30/10/2026

## Motivo

A partir de 30/10/2026, projetos Supabase existentes deixam de receber automaticamente os privilégios de tabela que tornavam novas tabelas do schema `public` acessíveis pela Data API.

O Soften Performance Hub usa `supabase-js`, portanto depende da Data API. As tabelas existentes continuam com os privilégios atuais, mas novas tabelas e recriações do banco precisam de `GRANT` explícito.

A V2.29.9 corrige os pontos do projeto que ainda dependiam do comportamento antigo:

- `technician_finance_monthly` para o frontend autenticado;
- `super_admin_commissions` para o frontend autenticado;
- `profiles`, `squads`, `squad_months`, `technician_monthly`, `profile_squad_history` e `audit_logs` para as Edge Functions que usam `service_role`.

Nenhum acesso adicional é concedido ao role `anon`.

## Base existente — passo a passo

### 1. Fazer backup

Antes de alterar produção, gere um backup do banco pelo procedimento normal do projeto/Supabase.

### 2. Executar a migration V2.29.9

No Dashboard do Supabase:

1. abra o projeto;
2. acesse **SQL Editor**;
3. abra o arquivo `supabase/migrations/MIGRACAO_V2.29.9.sql` deste repositório;
4. copie todo o conteúdo;
5. execute no SQL Editor;
6. confirme que a execução terminou sem erro.

A migration usa apenas `GRANT` e pode ser executada novamente sem duplicar dados.

### 3. Conferir os privilégios aplicados

Execute a consulta abaixo no SQL Editor:

```sql
select
  table_name,
  grantee,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'technician_finance_monthly',
    'super_admin_commissions',
    'profiles',
    'squads',
    'squad_months',
    'technician_monthly',
    'profile_squad_history',
    'audit_logs'
  )
  and grantee in ('authenticated', 'service_role')
order by table_name, grantee, privilege_type;
```

O resultado deve incluir, no mínimo:

- `authenticated` com `SELECT/INSERT/UPDATE/DELETE` em `technician_finance_monthly`;
- `authenticated` com `SELECT/INSERT/UPDATE` em `super_admin_commissions`;
- `service_role` com `SELECT/INSERT/UPDATE` em `profiles`;
- `service_role` com `SELECT` em `squads` e `squad_months`;
- `service_role` com `SELECT/UPDATE` em `technician_monthly`;
- `service_role` com `SELECT/INSERT/UPDATE` em `profile_squad_history`;
- `service_role` com `INSERT` em `audit_logs`.

### 4. Testar a aplicação

Depois da migration, valide pelo menos:

1. login de um Admin Geral;
2. carregamento dos Squads e competências;
3. abertura de uma competência que possua dados financeiros;
4. salvamento de um ajuste financeiro de teste controlado;
5. salvamento da comissão do Admin Geral;
6. criação ou edição de um usuário de teste pela interface;
7. registro da operação em **Gestão > Auditoria**.

A V2.29.9 não altera as Edge Functions, portanto não é necessário republicá-las apenas por esse ajuste.

## Instalação nova

Em uma base vazia, não execute as migrations históricas uma a uma. Execute o `supabase/schema.sql`, que já inclui a V2.29.9 e os `GRANT`s necessários.

Depois siga o fluxo normal:

1. criar o primeiro usuário no Supabase Auth;
2. executar `supabase/bootstrap_primeiro_admin.sql` com o UUID correto;
3. publicar `create-user` e `manage-user`;
4. configurar `js/config.js` apenas com URL e chave publishable/anon;
5. testar login e operações principais.

## Padrão obrigatório para novas tabelas

Toda migration futura que criar uma tabela no schema `public` deve declarar os privilégios da Data API na mesma migration.

Exemplo para uma tabela acessada somente por usuários autenticados:

```sql
create table public.exemplo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id)
);

alter table public.exemplo enable row level security;

grant select, insert, update, delete
on table public.exemplo
  to authenticated;

create policy exemplo_select
on public.exemplo
for select
  to authenticated
using (user_id = (select auth.uid()));
```

Se uma Edge Function usando `service_role` acessar a tabela pela Data API, conceda somente as operações necessárias ao backend:

```sql
grant select, insert
on table public.exemplo
  to service_role;
```

Não conceda `anon` por padrão. Use esse role apenas quando existir uma funcionalidade realmente pública antes do login.

Se a tabela utilizar `identity`/`serial`, o role que insere também pode precisar de privilégio na sequence correspondente. Exemplo:

```sql
grant usage, select
on sequence public.exemplo_id_seq
  to authenticated;
```

## Relação entre GRANT e RLS

`GRANT` e RLS não substituem um ao outro:

- `GRANT` define se o role pode executar `SELECT`, `INSERT`, `UPDATE` ou `DELETE` na tabela;
- RLS/policies definem quais linhas esse role pode acessar;
- `service_role` ignora RLS, mas ainda precisa do privilégio SQL exigido para chegar à tabela pela Data API.

Por isso, novas tabelas devem ser revisadas sempre nas duas camadas.
