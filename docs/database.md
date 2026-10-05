# Banco de dados — Supabase

Este documento representa o fluxo recomendado para a versão `2.42.0`.

## Instalação nova

Em um projeto Supabase novo:

1. abra o SQL Editor;
2. execute `supabase/schema.sql` uma única vez;
3. crie o primeiro usuário em **Authentication > Users**;
4. copie o UUID desse usuário e ajuste/execute `supabase/bootstrap_primeiro_admin.sql`;
5. publique as Edge Functions de `supabase/functions/`;
6. configure URL e chave publishable/anon em `js/config.js`;
7. valide login, leitura dos Squads e uma importação controlada antes de liberar o ambiente.

`supabase/schema.sql` é um instalador cumulativo para uma base vazia e reúne as evoluções necessárias até a V2.42.0, incluindo os `GRANT`s explícitos exigidos pela Data API.

## Atualização de uma base existente

Não recrie o banco e não execute `schema.sql` sobre produção apenas para atualizar a aplicação.

Use `supabase/migrations/README.md` para identificar a sequência histórica e execute somente as migrations ainda pendentes. Antes de qualquer alteração em produção, faça backup e valide a aplicação após a migration.

Para uma base que já está na V2.29.8, execute apenas:

```text
supabase/migrations/MIGRACAO_V2.29.9.sql
```

A V2.29.9 torna explícitos os privilégios necessários para a Data API do Supabase. O passo a passo completo está em `docs/SUPABASE_DATA_API_GRANTS_2026.md`.


### Atualizações recentes

Para ambientes já atualizados até V2.29.9, verifique também as migrations funcionais posteriores aplicáveis. As evoluções mais recentes com banco são:

```text
supabase/migrations/MIGRACAO_V2.39.0.sql  # memória financeira
supabase/migrations/MIGRACAO_V2.40.0.sql  # playlists e TVs
supabase/migrations/MIGRACAO_V2.42.0.sql  # avatar privado
```

A V2.42 cria o bucket privado `user-avatars`, adiciona `profiles.avatar_path` e políticas para que cada usuário grave apenas a própria imagem otimizada.

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

## V2.40.0 — Apresentação / TV

Para playlists compartilhadas, múltiplas TVs e monitoramento centralizado, execute:

```text
supabase/migrations/MIGRACAO_V2.40.0.sql
```

A migration cria `presentation_playlists` e `presentation_devices`. A primeira guarda a programação reutilizável; a segunda registra o dispositivo físico, sua playlist atribuída e a telemetria mais recente. As RPCs `get_presentation_device_config` e `touch_presentation_device` permitem que uma TV autenticada da mesma organização leia somente sua programação e atualize somente heartbeat/telemetria.

Sem a migration, a aplicação mantém fallback em `localStorage`, adequado apenas para demonstração/contingência local.


## V2.42.0 — Avatar

`profiles.avatar_path` referencia o arquivo WebP privado em `user-avatars`. A migration cria bucket com limite de 128 KB, políticas de leitura por organização, escrita somente no próprio caminho e a RPC `save_my_avatar_path(text)`.


## V2.43.1 — Performance

A observabilidade centralizada usa `app_performance_events`. O papel `authenticated` não possui acesso direto à tabela. `record_performance_events(jsonb)` recebe lotes pequenos e `get_performance_summary(integer)` entrega apenas agregados para Admin Geral.
