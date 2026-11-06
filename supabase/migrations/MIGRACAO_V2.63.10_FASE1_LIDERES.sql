-- V2.63.10 fase 1: comissão financeira de líderes por competência e Squad.
-- Não altera tabelas de técnicos, produção, métricas ou snapshots.
begin;
alter table public.super_admin_commissions
  add column if not exists squad_code text,
  add column if not exists sales_commission numeric(14,2) not null default 0,
  add column if not exists manual_bonus numeric(14,2) not null default 0,
  add column if not exists discount numeric(14,2) not null default 0,
  add column if not exists redistribution numeric(14,2) not null default 0,
  add column if not exists vacation boolean not null default false;
-- Histórico sem vínculo permanece NULL: não se atribui Squad retroativamente por suposição.
alter table public.super_admin_commissions
  drop constraint if exists super_admin_commissions_squad_code_check;
alter table public.super_admin_commissions
  add constraint super_admin_commissions_squad_code_check check (squad_code is null or squad_code in ('A','B','D','E'));
create index if not exists idx_super_admin_commissions_squad_period
  on public.super_admin_commissions(organization_id,squad_code,year,month);
comment on column public.super_admin_commissions.squad_code is 'Vínculo exclusivamente financeiro do líder ao Squad no mês; NULL em registros legados não conciliados.';
grant select,insert,update on public.super_admin_commissions to authenticated;
commit;
