# V2.63.9 — Hardening e homologação final da Fase 8

## Objetivo

Reforçar as garantias financeiras e de auditoria dos módulos de Automação, Receita Direta, Bonificação e Fechamento Estratégico, preservando a V2.63.8 como base. **Conclusão dos testes de código não equivale a homologação do banco Supabase.** A liberação em produção exige os testes de permissões e transações descritos a seguir.

## Correções concretas

1. **Cancelamentos oficiais**: um `squad_months` fechado só utiliza `closed_snapshot.financeMonthData`; quando o snapshot está ausente, não existe fallback para `finance_month_data`. A prévia apresenta `missing_closed_snapshot`, bloqueando fechamento.
2. **Valores inválidos de cancelamento**: ambos os campos devem ser inteiros não negativos, até 9 algarismos; não pode haver mais cancelamentos que clientes iniciais. A prévia marca `invalid_closed_cancellations` e bloqueia fechamento.
3. **Pré-atendimento / Squad C**: além do total de comissões, quantidade e fingerprint, a prévia confere igualdade de centavos com o valor da aprovação histórica. Divergência gera `approved_amount_mismatch` e requer investigação, não correção automática.
4. **Competência vazia**: sem pessoas conciliáveis e sem meses operacionais, a prévia não presume que o fechamento pode ser concluído. Exige uma fonte real e revisão.
5. **Histórico append-only**: V2.63.9 instala guardas BEFORE UPDATE OR DELETE nos ledgers de vendas recorrentes/avulsas, tentativas, comissões, aprovações, auditoria e snapshots complementares. `strategy_bonus_cost_links_v2638` permanece atualizável apenas pela RPC oficial.
6. **Permissões**: o wrapper `close_strategy_competence(date)` exige `close_competence`, `people_costs` e `edit_costs`, em concordância com a rotina de conferência. O core continua sem EXECUTE para `authenticated`.
7. **Experiência de conferência**: identifica na interface `Snapshot ausente`, `Dados inconsistentes` e aprovação de valor divergente. Taxas provisórias não são apresentadas como taxas oficiais.
8. **CI**: `scripts/audit-phase8.mjs` é executado dentro de `npm run validate`, verificando versões/cache-busters e contratos comerciais/migrations. Regressões intencionais são exercitadas por testes de adulteração simulada.

## Regras financeiras preservadas

- **Contratações recorrentes**: `Vl Atual Ativo` é o MRR mensal adicionado em **cada linha**; `Vl Anterior` é ignorado. ARR = 12 × MRR, apenas indicador, sem somá-lo novamente à Receita Direta.
- **Vendas avulsas**: `vlTotalItem` é o valor total da linha, **não** multiplicar por quantidade; nenhum MRR ou ARR.
- **Identificação**: cada ocorrência de venda é preservada; deduplicação por identidade e ordinal, não somente ID da venda; reimportações integrais idempotentes. Em arquivos parciais com vendas idênticas e sem ID de item único, a decisão humana continua necessária.
- **Squads**: Pré-atendimento somente no Squad C, com perfil próprio; técnicos de A/B/D/E permanecem operacionais. Registros sem grupo são ignorados, não redistribuídos.
- **Comissões**: integral, percentual, líquido após custo de terceiros e fixa; sem regra = pendente. Uma venda recebe uma única comissão conforme a regra congelada na contratação; Pre-atendimento sem atendimentos artificiais.
- **Bonificação e custos**: valor oficial é integrado uma única vez em `variable_pay`, sem somar novamente comissão de vendas e sem modificar salários/encargos. FTE diferente de 1 ou divergência manual exige conferência.
- **Histórico**: períodos fechados e snapshots não são sobrescritos. Correções comerciais dependem de nova revisão auditável.

## Instalação

1. Faça backup do repositório V2.63.8 e do banco de dados, incluindo snapshots e tabelas Fase 8.
2. **Em homologação**, execute `supabase/migrations/MIGRACAO_V2.63.9.sql` no SQL Editor, **após** MIGRACAO_V2.63.8.sql. Não reaplique migrations antigas fora de ordem.
3. Confira o `COMMIT` e atualização do schema PostgREST; execute as verificações de leitura abaixo.
4. Aplique o ZIP incremental ou patch **sobre V2.63.8**; execute `npm run check` no repositório completo.
5. Publique; force atualização com `Ctrl + Shift + R` e confira `V2.63.9` no rodapé; nenhuma Edge Function nova.
6. Execute as provas de RLS, reimportação, comissões, fechamento, reabertura, idempotência e auditoria em homologação antes da produção.

## Queries de diagnóstico somente de leitura

```sql
-- Verificar status de RLS das tabelas novas e legadas financeiras
select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in (
 'strategy_recurring_sales','strategy_merchandise_sales','strategy_sales_commissions',
 'strategy_pre_bonus_approvals_v2638','strategy_bonus_sync_audit_v2638','strategy_financial_closure_v2638');

-- Verificar oito triggers append-only existentes e ativos
select c.relname, t.tgname, t.tgenabled
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and t.tgname='phase8_immutable_guard_v2639'
order by c.relname;

-- Verificar core restrito e wrapper acessível ao papel autenticado
select p.proname, has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('close_strategy_competence','close_strategy_competence_core_v2638');
```

**Resultado esperado**: RLS habilitado (true) nas seis tabelas, oito triggers `tgenabled='O'`, `authenticated_can_execute=false` para o core e `true` para o wrapper. Também inspecione as políticas RLS por organização/permissões na ferramenta do Supabase.

## Matriz de homologação obrigatória (execução manual em ambiente isolado)

| Cenário | Resultado esperado |
|---|---|
| Importar o mesmo CSV recorrente integral duas vezes | Apenas primeira importação gera receita, posterior é duplicada |
| Importar CSV avulso com ID repetido em produtos diferentes | Preserva itens diferentes, sem MRR |
| Importar linha sem grupo | Ignorada sem atribuição a outro Squad |
| Vendedor de outro Squad ou tenant | Vínculo rejeitado |
| Pre-atendimento do Squad C sem atendimentos | Comissão comercial e custo após aprovação, nenhum técnico fictício |
| Produto sem regra de comissão | Pendente, sem valor inventado |
| Alterar regra após importação | Comissão histórica não é recalculada |
| Mês operacional fechado sem `closed_snapshot.financeMonthData` | `Snapshot ausente`; fechamento bloqueado |
| Mês fechado com cancelamentos maiores que clientes | `Dados inconsistentes`; fechamento bloqueado |
| Aprovação do Squad C divergente da soma | Bloqueio e revisão, não soma silenciosa |
| Bonificação manual conflitante / FTE parcial | `manual_conflict` ou `fte_not_one`; sem sobrescrita |
| Competência sem qualquer fonte | Não fechar automaticamente |
| Usuário autenticado sem `edit_costs` | RPC de fechamento negada |
| Usuário de outra organização | Não enxerga/edita informações de outro tenant |
| UPDATE/DELETE nos ledgers por papel administrativo em homologação | Exceção `55000`; nenhuma alteração persistida |
| Reabrir e fechar período autorizado | Nova revisão, snapshots anteriores intocados |

Execute com dados de teste/usuários de teste em tenant isolado. Não execute UPDATE/DELETE de demonstração na produção.

## Limitações e critérios de aceite

- O CLI é **auditoria estática**, não emula SQL ou regras de autenticação/PostgREST. Sem acesso conectado ao Supabase não é possível afirmar que as transações e políticas RLS passaram em produção.
- O CSV original não dispõe de identificador permanente único por linha comercial; reimportação parcial com transações exatamente idênticas exige governança manual.
- Se um mês já fechado não tiver snapshot válido, **não ajustar a migration para aceitar dados editáveis**. Investigue a origem do histórico, reconcilie e use fluxo autorizado de reabertura/revisão.
- Guarde evidências da matriz (papel usado, competência, status, consulta, lote, valor agregado) antes de aprovar o go-live.

## Rollback controlado

Para reverter **apenas** o código e os triggers da V2.63.9, há `supabase/migrations/ROLLBACK_V2.63.9.sql` que restaura as versões V2.63.8 das duas funções e retira os triggers. Não apaga receita nem snapshots, mas **reintroduz os riscos corrigidos**; use somente após backup e aprovação de mudança. Restaure também o frontend V2.63.8. Não use rollback para contornar dados inconsistentes.
