# Soften Performance Hub V2.29.9

## Compatibilidade com a nova exposição da Data API do Supabase

Esta versão prepara o projeto para a mudança do Supabase que, em 30/10/2026, deixa de conceder automaticamente privilégios da Data API a novas tabelas do schema `public` em projetos existentes.

## O que mudou

- criada `supabase/migrations/MIGRACAO_V2.29.9.sql`;
- adicionados `GRANT`s explícitos das tabelas financeiras usadas pelo frontend;
- adicionados `GRANT`s mínimos para as Edge Functions que usam `service_role`;
- mantido o role `anon` sem novos privilégios de dados;
- atualizado `supabase/schema.sql` para instalações novas;
- documentado o padrão obrigatório de `CREATE TABLE + GRANT + RLS/policies` para novas tabelas;
- reforçado o Quality Gate para exigir a migration de compatibilidade e detectar novas migrations com `CREATE TABLE` sem `GRANT` explícito.

## Atualização de base existente

Se a base já está na V2.29.8:

1. faça backup;
2. execute `supabase/migrations/MIGRACAO_V2.29.9.sql` no SQL Editor;
3. valide login, dados financeiros e administração de usuários;
4. publique a V2.29.9 normalmente.

Não execute `supabase/schema.sql` sobre produção.

Não é necessário republicar `create-user` e `manage-user` apenas por causa desta versão, pois o código das Edge Functions não mudou.

## Instalação nova

Use apenas `supabase/schema.sql`. O instalador cumulativo já contém os privilégios necessários para a Data API.

## Validação recomendada

Consulte `docs/SUPABASE_DATA_API_GRANTS_2026.md` para o passo a passo completo, a consulta de verificação dos privilégios e o checklist de teste.
