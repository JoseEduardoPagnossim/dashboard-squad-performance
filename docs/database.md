# Banco de dados — Supabase

Este documento representa o fluxo recomendado para a versão `2.29.9`.

## Instalação nova

Em um projeto Supabase novo:

1. abra o SQL Editor;
2. execute `supabase/schema.sql` uma única vez;
3. crie o primeiro usuário em **Authentication > Users**;
4. copie o UUID desse usuário e ajuste/execute `supabase/bootstrap_primeiro_admin.sql`;
5. publique as Edge Functions de `supabase/functions/`;
6. configure URL e chave publishable/anon em `js/config.js`;
7. valide login, leitura dos Squads e uma importação controlada antes de liberar o ambiente.

`supabase/schema.sql` é um instalador cumulativo para uma base vazia e reúne as evoluções necessárias até a V2.29.9, incluindo os `GRANT`s explícitos exigidos pela Data API.

## Atualização de uma base existente

Não recrie o banco e não execute `schema.sql` sobre produção apenas para atualizar a aplicação.

Use `supabase/migrations/README.md` para identificar a sequência histórica e execute somente as migrations ainda pendentes. Antes de qualquer alteração em produção, faça backup e valide a aplicação após a migration.

Para uma base que já está na V2.29.8, execute apenas:

```text
supabase/migrations/MIGRACAO_V2.29.9.sql
```

A V2.29.9 torna explícitos os privilégios necessários para a Data API do Supabase. O passo a passo completo está em `docs/SUPABASE_DATA_API_GRANTS_2026.md`.

## Edge Functions

As funções ficam em:

```text
supabase/functions/create-user/
supabase/functions/manage-user/
```

Elas concentram operações administrativas que não devem depender de privilégios expostos ao navegador. As duas funções usam `service_role` somente no backend. A V2.29.9 concede explicitamente apenas os privilégios de tabela que essas funções utilizam pela Data API.

## RLS e GRANT

As tabelas sensíveis utilizam Row Level Security. A aplicação diferencia Admin Geral, Admin de Squad e Técnico. Ao criar novas tabelas, mantenha o padrão:

- habilitar RLS;
- criar policies por organização/Squad/usuário;
- conceder explicitamente apenas os privilégios necessários ao papel `authenticated`;
- conceder ao `service_role` somente quando uma Edge Function/backend realmente acessar a tabela pela Data API;
- não conceder `anon` por padrão;
- se houver `identity`/`serial`, revisar também o `GRANT` da sequence;
- manter `CREATE TABLE`, `GRANT`, RLS e policies na mesma migration futura.

## Histórico

O guia antigo e detalhado de evolução foi preservado em `docs/database-history.md` apenas como referência histórica. Para instalações novas, use este documento e `supabase/schema.sql`.
