# V2.63.7 - Lancamentos manuais e correcoes auditaveis

## Objetivo

Adicionar em **Gestao Estrategica > Automacao > Lancamentos manuais** um registro complementar para vendas, receitas e custos sem duplicar as estruturas economicas oficiais existentes. A origem e exclusivamente **manual**, separada dos CSVs. Os lancamentos manuais nunca modificam `strategy_recurring_sales`, `strategy_merchandise_sales`, `strategy_sales_commissions` ou Bonificacao.

## Tipos habilitados

- **Venda direta**: receita comercial confirmada; exige pessoa estrategica ativa vinculada a conta ativa no Squad correspondente. `amount` e o valor economico do evento na competencia e `mrr` (opcional) representa SOMENTE novo valor mensal adicionado. `ARR = MRR x 12`, indicador separado. Uma venda manual nao gera comissao automatica na V2.63.6: homologar regra comercial/origem antes de integrar ao motor.
- **Receita influenciada confirmada**: exige referencia comprovavel. Contabilizada apenas no indicador influenciado; nao entra como Receita Direta, nem no ROI.
- **Receita protegida confirmada**: exige referencia comprovavel e evidencia de permanencia validada. Contabilizada apenas como Receita Protegida; nao se confunde com cancelamento e nao entra como Receita Direta nem no ROI.
- **Custo de terceiros**: custo operacional direto do Squad escolhido, criado em `strategy_operational_costs` e alocado 100% no proprio Squad em `strategy_cost_allocations`. Nao altera automaticamente o custo de terceiros usado na regra de comissao de um produto. Nao altera bonus e salarios.

Nao informar o mesmo fato em duas telas (por exemplo, Receita Direta manual na tela Resultado e novamente na Automacao). A dupla origem do mesmo fato economico continuaria causando duplicacao, pois as entradas independentes nao compartilham um identificador externo garantido.

## Revisoes, cancelamento e efeitos economicos

- Cada lancamento possui `entry_group_id`, numero de revisao, competencia, usuario autor, justificativa, data civil, referencia e identificador individual.
- Salvar uma **correcao** na mesma competencia primeiro desativa a projecao anterior (`status='cancelled'` no Resultado ou `amount=0` no custo com alocacao zerada) e gera nova projecao confirmada, tudo em uma mesma transacao PostgreSQL.
- **Cancelar** cria uma revisao com `status='cancelled'`, sem apagar a memoria de calculo anterior. Na tabela, use `R1`, `R2` etc. para consultar o historico e as justificativas.
- Cada gravacao recebe um `requestToken` unico, persistido em `strategy_manual_entries`. Retentar a mesma requisicao retorna o resultado anterior em vez de inserir uma segunda venda. Dupla confirmacao de um novo registro intencional utiliza outra chave.
- Somente competencias ja criadas e **abertas** aceitam criacao, correcao e cancelamento. Reabrir competencia fechada deve seguir fluxo autorizado; nenhum snapshot historico e reescrito diretamente.
- Mudanca de competencia por correcao e proibida: cancele o registro antigo com justificativa e crie um novo registro na competencia correta mediante abertura autorizada.
- Os eventos de CSV importados sao imutaveis e nunca sao afetados pelos novos procedimentos.

## Seguranca

`supabase/migrations/MIGRACAO_V2.63.7.sql` cria `strategy_manual_entries` com RLS por `organization_id` e permissoes estrategicas `people_costs`+`edit_costs`. A tabela permite apenas `SELECT` aos usuarios autenticados autorizados; `INSERT` e permitido apenas atraves de `save_strategy_manual_entry_v2637` e `cancel_strategy_manual_entry_v2637`, RPCs `SECURITY DEFINER` que revalidam tenant, competencia, data, colaborador, Squad, valor e justificativa.

`strategy_manual_projection_guard_v2637` impede que um usuario corrija ou exclua diretamente as projecoes vinculadas ao ledger. O motor faz as mudancas como parte da mesma transacao, preservando auditoria e evitando edicao silenciosa. Squad C so admite perfil `pre_attendance`; Squads A, B, D e E so aceitam `technician` nos registros associados a pessoas.

## Instalacao e homologacao

1. Backup dos arquivos da V2.63.6 e banco de dados. Aplique a migration V2.63.7 **depois** das anteriores no SQL Editor do Supabase, primeiro em homologacao.
2. Aplique o ZIP incremental (ou patch) sobre a V2.63.6; execute `npm run check` e publique.
3. Execute um teste com venda direta de R$ 150,00 e novo MRR de R$ 150,00 no Squad C, com conta ativa de Pre-atendimento. Confira os indicadores e a atribuicao.
4. Cadastre custo de terceiros de R$ 50,00 no mesmo mes/Squad, confira a alocacao direta. Ajuste o custo para R$ 40,00; verifique que a versao anterior deixou de compor o custo e que a justificativa aparece em R2.
5. Cancele um lancamento e verifique que o efeito economico foi revertido. Repita uma mesma requisicao com o mesmo `requestToken`: o sistema deve devolver o identificador original.
6. Teste usuario sem permissao, outro tenant, competencia fechada, pessoa de Squad diferente, tecnico indevidamente apontado ao Squad C e referencia ausente em receita influenciada/protegida.
7. Confira a Receita Direta, Influenciada, Protegida e custos por competencia para impedir lancamento duplo entre telas existentes.

**Limitacao de homologacao:** os testes locais verificam logica de validacao, integracao de interface, versoes e contratos SQL estaticamente. Nao executam as RPCs em um Supabase de homologacao; essa etapa e obrigatoria antes do uso financeiro em producao.

## Pendencias para V2.63.8

Aprovacao/fechamento proprio de Bonificacao do Pre-atendimento, reconciliacao com o valor **oficial** de Bonificacao nos custos pessoais (sem duplicar comissao), cancelamentos por Squad provenientes da Bonificacao, reconciliacao de snapshots e fechamento estrategico da Fase 8. Vendas manuais ainda nao disparam comissao automaticamente.
