# Regras permanentes do Dashboard Squad Performance

**Obrigatório antes de implementar qualquer versão da Fase 8:** ler `docs/FASE8_REGRAS_OBRIGATORIAS_V2.63.0.md` integralmente. Essas são decisões de negócio aprovadas pelo usuário e prevalecem sobre suposições do desenvolvedor. Não alterar sem autorização.

Release incremental: preservar dados e migrations anteriores; não alterar snapshots oficiais; testar `npm run check`; entregar ZIP com somente arquivos modificados, patch aplicável, migration SQL quando necessário, documentação e sempre uma mensagem de commit pronta. Mantenha os controles de segurança multi-tenant e o Pré-atendimento separado dos indicadores operacionais do Suporte.

**Fase 8, V2.63.1:** ler também `docs/IMPORTADOR_CSV_CONFIGURAVEL_V2.63.1.md` antes de alterar parser, modelos e importações de receitas. O reconhecimento de produtos nesta versão é somente prévia; nenhuma venda/comissão pode ser lançada prematuramente.

**Fase 8, V2.63.2:** consultar `docs/CONCILIACAO_PESSOAS_SQUADS_V2.63.2.md` antes de alterar identidades/aliases. Nunca associar vendedor sem Squad válido, conta ativa e `strategy_people.user_id` da mesma organização. Pré-atendimento somente Squad C, sem dados operacionais.

**Fase 8, V2.63.3:** consultar `docs/CATALOGO_COMERCIAL_COMISSOES_V2.63.3.md` antes de modificar catálogo/comissões. A origem define MRR; não juntar produtos de fontes diferentes, nem pagar comissões nesta etapa. Toda alteração de regra cria revisão imutável, sem alterar snapshots anteriores.

**Fase 8, V2.63.4:** consultar `docs/IMPORTACAO_RECEITA_RECORRENTE_V2.63.4.md`. Novo MRR somente por vendas únicas do CSV Anotação de Venda, nunca por `Vl Anterior`, nunca recalcular comissão. Reimportações são idempotentes pela identidade e confirmadas no Supabase; fechamento e histórico permanecem protegidos.

**Fase 8, V2.63.5:** consultar `docs/IMPORTACAO_VENDAS_AVULSAS_V2.63.5.md`. CSV Venda de Mercadorias: `vlTotalItem` é valor total de cada linha (nunca multiplicar quantidade); `id` pode se repetir por item e não é chave única; receita direta avulsa sem MRR/ARR, comissões e Bonificação só na V2.63.6. Reimportações idempotentes, identidades auditadas, contas e Squads validados e competências fechadas protegidas.

V2.63.6: revisar docs/COMISSOES_BONIFICACAO_V2.63.6.md antes de modificar bonificacao. Não contabilizar duas vezes e não inferir bonus de Pre-atendimento pela producao tecnica.

**Fase 8, V2.63.7:** consultar `docs/LANCAMENTOS_MANUAIS_V2.63.7.md` antes de modificar lancamentos e correcoes. Nunca duplicar Resultado/custos, nao editar projecoes ou vendas CSV sem auditoria, nem criar comissao de venda manual sem regra aprovada. A transferencia do bonus oficial do Pre-atendimento aos custos e assunto da V2.63.8.


## V2.63.8 — Regras imutáveis de Fechamento Financeiro

- `technician_finance_monthly.calculated.final` somente é elegível após fechamento operacional, com comparação ao `squad_months.closed_snapshot` do próprio técnico; valor já contém comissão de vendas, não somá-la duas vezes.
- Pré-atendimento = perfil `pre_attendance`, Squad C estratégico, sem produção técnica; aprovação comercial separada, revisionada por competência e pessoa, pendentes não viram zero.
- Sincronização manual, com validação de conflitos, atualiza somente `strategy_employee_costs.variable_pay`, nunca salários/encargos/benefícios; FTE diferente de 1 exige revisão e bloqueia a sincronização automática.
- Cancelamentos por Squad vêm de `squad_months.finance_month_data` / `closed_snapshot.financeMonthData`; não duplicar no Estratégico nem inventar cancelamentos para o Squad C.
- Fechamento exige todas as reconciliações e dados operacionais oficiais resolvidos. Snapshot estratégico original permanece intacto; V2.63.8 grava fotografia complementar por revisão em ledger próprio.
- Testes SQL locais são estáticos; sempre homologar migration, RLS, função de fechamento e custos reais em Supabase antes de produção.

## Fase 8 concluída — V2.63.9
A Fase 8 precisa preservar: `Vl Atual Ativo` = incremento de MRR, `vlTotalItem` = total da linha avulsa sem multiplicar quantidade, origem MRR distinta de mercadorias, cada linha comercial representando venda, ocorrências idênticas preservadas, comissão apurada uma vez, Pré-atendimento somente Squad C, nada sem grupo contabilizado, auditoria imutável e snapshots oficiais sem fallback para dados editáveis. Não tratar testes SQL estáticos como homologação Supabase real. Antes de fechamento, conferir pessoal/Bonificação, cancelamentos e snapshots, inclusive competência sem fontes.
