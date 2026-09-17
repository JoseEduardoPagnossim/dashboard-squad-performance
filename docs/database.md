# Banco de dados — Supabase

Este documento representa o fluxo recomendado para a versão `2.29.6`.

## Instalação nova

Em um projeto Supabase novo:

1. abra o SQL Editor;
2. execute `supabase/schema.sql` uma única vez;
3. crie o primeiro usuário em **Authentication > Users**;
4. copie o UUID desse usuário e ajuste/executa `supabase/bootstrap_primeiro_admin.sql`;
5. publique as Edge Functions de `supabase/functions/`;
6. configure URL e chave publishable/anon em `js/config.js`;
7. valide login, leitura dos Squads e uma importação controlada antes de liberar o ambiente.

`supabase/schema.sql` é um instalador cumulativo para uma base vazia e reúne as evoluções necessárias até a V2.29.6.

## Atualização de uma base existente

Não recrie o banco e não execute `schema.sql` sobre produção apenas para atualizar a aplicação.

Use `supabase/migrations/README.md` para identificar a sequência histórica e execute somente as migrações ainda pendentes. Antes de qualquer alteração em produção, faça backup e valide em um ambiente separado quando possível.

## Edge Functions

As funções ficam em:

```text
supabase/functions/create-user/
supabase/functions/manage-user/
```

Elas concentram operações administrativas que não devem depender de privilégios expostos ao navegador.

## RLS

As tabelas sensíveis utilizam Row Level Security. A aplicação diferencia Admin Geral, Admin de Squad e Técnico. Ao criar novas tabelas, mantenha o padrão:

- habilitar RLS;
- criar policies por organização/Squad/usuário;
- conceder apenas os privilégios necessários ao papel `authenticated`;
- usar `service_role` somente no backend/Edge Function.

## Histórico

O guia antigo e detalhado de evolução foi preservado em `docs/database-history.md` apenas como referência histórica. Para instalações novas, use este documento e `supabase/schema.sql`.
