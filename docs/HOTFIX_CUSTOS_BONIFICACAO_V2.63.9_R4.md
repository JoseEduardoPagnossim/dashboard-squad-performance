# Hotfix V2.63.9 R4 — Custos operacionais, folha e Bonificação

**Base obrigatória: V2.63.9 R2.** O hotfix R3 (desconsiderar produtos) foi descartado e **não faz parte desta entrega**.

## Recursos

1. **Excluir custo operacional** na própria linha da tabela, com confirmação, justificativa, auditoria e remoção dos rateios vinculados. Competências fechadas e custos vinculados a lançamentos manuais revisionados permanecem protegidos.
2. **Importar planilha mensal XLSX/XLS de custos pessoais**, com prévia, conciliação por nome exato (normalização de caixa/acento), escolha manual para nomes divergentes, seleção de linhas e confirmação. A competência da planilha deve ser a mesma da tela; não serão criadas pessoas nem competências implicitamente.
3. **Variável da Bonificação**: botão coletivo utiliza a sincronização oficial V2.63.8 e nunca substitui automaticamente valores manuais conflitantes. Botão individual **↻ Oficial** exige confirmação e registra a conciliação no banco. O campo Variável continua editável normalmente.
4. **Origem do variável na importação**: por padrão, preserva o valor já informado. Há opções explícitas para usar o `Prêmio Variável` do Excel ou o valor oficial validado da Bonificação. O modo oficial exige mês operacional fechado (ou aprovação do Pré-atendimento) e deixa vínculo auditável. O modo planilha pode gerar divergência no fechamento, exigindo conciliação posterior.

## Mapeamento (planilha Custo Out-26 - Suporte)

| Planilha | Banco | Observação |
|---|---|---|
| Competência | `strategy_competences.competence` | Uma competência por arquivo |
| Colaborador | `strategy_people.id` | Vínculo exato ou manual; nunca por ordem |
| Salário-base | `strategy_employee_costs.salary` | Em reais, 2 casas |
| Total de encargos | `employer_charges` | Não somar INSS/RAT/FGTS novamente |
| Beneficios | `benefits` | Em reais |
| Prêmio Variável | `variable_pay` se escolhida origem planilha | Padrão = preservar atual |
| Provisões mensais de 13º e 1/3 de férias + Encargos sobre provisões (sem prêmio) | parcela controlada de `other_costs` | Somente os dois componentes, não o custo médio |

**Não importar como parcelas:** Base de remuneração, INSS patronal, RAT, Terceiros, FGTS (já compõem encargos), Custo direto do mês, Custo médio com provisões, Média Prêmio/Comissão de meses anteriores (indicadores, não custos adicionais).

A planilha de referência tem **35 nomes e 34 linhas financeiras completas**. Uma linha possui traços (`-`) em vez de valores: é marcada para revisão, não gravada como zero. Linhas não conciliadas também ficam desmarcadas.

## Segurança e deduplicação

- SQL exigida: `supabase/migrations/MIGRACAO_V2.63.9_R4.sql` (executar após V2.63.9 R2).
- Exclusão de custos só por RPC `strategy_delete_operational_cost_v2639_r4`; `DELETE` direto revogado do papel autenticado. Isolamento organizacional, permissão de edição e competência aberta validados no servidor.
- A planilha é lida localmente no navegador. Apenas campos financeiros selecionados são gravados, não o arquivo inteiro.
- RPC `strategy_import_person_costs_v2639_r4` confere pessoa ativa, organização, status aberto, competências, valores não negativos, duplicidades por pessoa e token idempotente do lote.
- Provisões importadas são controladas por pessoa/competência, aplicando: `outros novos = outros atuais - provisões importadas anteriormente + provisões deste arquivo`. Assim, outros custos já lançados são preservados e uma reimportação não duplica provisões.
- Auditoria armazena lotes e os valores anteriores/novos, acessíveis apenas a gestores com permissões financeiras. Não há reversão automática de um lote: eventuais correções devem gerar nova importação conferida.
- FTE, disponibilidade, horas extras e Squad de pessoas existentes são preservados na importação. Total é calculado pelo motor financeiro já existente. Alterações manuais do variável podem gerar pendência para fechamento enquanto não forem reconciliadas.
- **Atenção:** a Bonificação oficial é a fonte prioritária do variável; a coluna da planilha é opção explícita, não somada à comissão oficial.

## Instalação

1. Backups do banco e do código na V2.63.9 R2.
2. Em **homologação**, executar `MIGRACAO_V2.63.9_R4.sql`; testar exclusão, importação e Bonificação com perfis diferentes e competência fechada. Só então executar em produção.
3. Extrair o ZIP incremental sobre a raiz do projeto R2, preservando a estrutura de pastas. Não instalar o R3.
4. Executar `npm run check`, publicar no GitHub e recarregar com Ctrl+Shift+R (assetVersion `2.63.9-r4`).
5. Na Gestão Estratégica > **Custos**, conferir a planilha em competência **2026-10**, reconciliar os 34 colaboradores com valores, deixar o caso incompleto pendente, conferir os custos e salvar.
6. Na Bonificação, fechar o mês operacional; depois utilizar **↻ Buscar variável da Bonificação** ou o botão individual **↻ Oficial**. Conferir diferenças antes de fechar a competência estratégica.

Nenhuma Edge Function nova é necessária. **Esta entrega foi validada localmente; as RPCs e políticas precisam de homologação no Supabase real.**

Commit: `feat(strategy): implementa exclusao de custos, importacao de folha e bonus V2.63.9 R4`
