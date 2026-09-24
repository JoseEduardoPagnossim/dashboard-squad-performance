# Migrações do Supabase

Este diretório preserva o histórico de evolução do banco do Soften Performance Hub.

## Instalação nova

Para um projeto Supabase novo, use **`../schema.sql`**. Ele já reúne a estrutura necessária até a V2.29.9.

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
```

`MIGRACAO_V2.25.0.sql` foi preservada como histórico; para uma instalação que ainda não tenha feedbacks, prefira a revisão `V2.25.1`.


## V2.29.8 — Auditoria

`MIGRACAO_V2.29.8.sql` cria `audit_logs`, habilita RLS e disponibiliza a RPC `log_audit_event`. Depois da migração, republique `create-user` e `manage-user` para que as operações administrativas de usuários também sejam auditadas no backend.


## V2.29.9 — Grants explícitos da Data API

`MIGRACAO_V2.29.9.sql` adiciona os privilégios SQL explícitos exigidos pela nova política de exposição da Data API do Supabase. A migração cobre as duas tabelas financeiras criadas sem `GRANT` na V2.18.0 e os acessos das Edge Functions que usam `service_role`.

A migração não concede acesso ao role `anon`. O frontend exige autenticação e continua protegido por RLS/policies.

Para qualquer tabela nova criada em `public`, inclua o `GRANT` necessário na mesma migração que contém o `CREATE TABLE`.
