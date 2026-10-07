-- Soften Performance Hub V2.48.8
-- Excecao individual do desconto por status ABAIXO na bonificacao.
-- Ferias passam a isentar automaticamente o desconto, sem retirar o tecnico
-- da quantidade do Squad nem da redistribuicao quando estiver ACIMA.

begin;

alter table if exists public.technician_finance_monthly
  add column if not exists waive_below_discount boolean not null default false;

comment on column public.technician_finance_monthly.waive_below_discount is
'Quando true, o tecnico permanece normalmente na Base do Squad e pode receber redistribuicao se estiver ACIMA, mas nao sofre o desconto financeiro por status ABAIXO e nao alimenta o pool de redistribuicao.';

commit;
