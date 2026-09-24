-- SOFTEN PERFORMANCE HUB V2.29.9
-- Compatibilidade com a mudança de exposição da Data API do Supabase em 30/10/2026.
-- Torna explícitos os GRANTs que o projeto realmente utiliza e deixa de depender
-- dos privilégios automáticos para novas tabelas no schema public.
-- Pode ser executada com segurança em uma base existente: GRANT é idempotente.

begin;

-- Data API usada pelo frontend autenticado.
-- Estas tabelas foram criadas na V2.18.0 sem GRANT explícito.
grant select, insert, update, delete
on table public.technician_finance_monthly
  to authenticated;

grant select, insert, update
on table public.super_admin_commissions
  to authenticated;

-- Data API usada pelas Edge Functions create-user e manage-user.
-- O service_role ignora RLS, mas continua precisando de privilégio SQL na tabela.
grant usage on schema public to service_role;

grant select, insert, update
on table public.profiles
  to service_role;

grant select
on table public.squads
  to service_role;

grant select
on table public.squad_months
  to service_role;

grant select, update
on table public.technician_monthly
  to service_role;

grant select, insert, update
on table public.profile_squad_history
  to service_role;

grant insert
on table public.audit_logs
  to service_role;

-- Não é concedido acesso ao role anon. O dashboard exige autenticação antes
-- de consultar dados da aplicação.

commit;
