# R30.7 — Copiar premissas financeiras do mês anterior

## Objetivo
Evitar digitação repetida dos salários, encargos e benefícios. A cópia é sempre **revisada e explícita**, e o mês anterior não é editado.

## Procedimento
1. Abra **Gestão Estratégica → Premissas** e selecione a competência de destino no seletor principal.
2. Se ela não existir, use **Criar competência**. Não é possível copiar para competência fechada.
3. Em **Pessoas e custos pessoais**, clique **Copiar do mês anterior**.
4. Confira a origem, destino, pessoas e valores. A prévia não grava dados.
5. Desmarque admissões, desligamentos, transferências ou qualquer salário que não deva ser copiado. Pessoas inativas e quem já possui linha no mês de destino são bloqueados automaticamente.
6. A caixa **Copiar também FTE e disponibilidade** começa desligada. Ative apenas se as escalas forem iguais às do mês de origem.
7. Selecione quais despesas operacionais devem ser copiadas. Marcadas como **Recorrente** aparecem selecionadas por padrão; eventuais, desmarcadas. Rateio manual não pode ser copiado automaticamente.
8. Confirme, revise os custos por pessoa e os totais operacionais, ajuste reajustes e entradas/saídas, e reconcilie a Bonificação oficial.

## O que é copiado
- `salary`, `employer_charges`, `benefits` das pessoas ativas e elegíveis.
- `fte` e `availability_factor` somente se solicitado. Sem opção, usa FTE padrão do cadastro e 100% de disponibilidade.
- Despesas operacionais escolhidas com descrição, categoria, valor, escopo, Squad, regra de rateio e indicador recorrente. O rateio é refeito conforme FTE/atendimentos da competência de destino.

## O que NÃO é copiado
- `variable_pay`, `overtime`, `other_costs` e provisões importadas.
- Bonificação, comissões, vendas CSV, receitas, metas, indicadores e snapshots fechados.
- Despesas com rateio manual (requerem lançamento/conferência próprios).
- Pessoas inativas ou linhas já existentes no destino.

## Segurança
A migration instala duas RPCs (`strategy_preview_previous_costs_r307` e `strategy_copy_previous_costs_r307`) com autorização de `edit_costs` e `people_costs`, organização do perfil, destino aberto e transação única. O registro `strategy_cost_copy_audit_r307` guarda origem, destino, seleções e quantidades, sem duplicar valores salariais na auditoria.

A operação é idempotente para itens já existentes no destino: não há sobrescrita. Executá-la novamente pode acrescentar somente itens novos não registrados. A origem e competências fechadas nunca são reescritas.

## Homologação obrigatória
Testar em Supabase de homologação antes da produção:
- Novembro vazio, origem Outubro preenchida, cópia de salários/encargos/benefícios.
- Destino com pessoa previamente salva: deve manter o registro existente, sem substituição.
- Destino fechado: RPC deve falhar sem gravar nenhuma linha.
- Pessoa inativa, IDs inexistentes ou de outra organização: bloquear sem gravar parcialmente.
- Despesas operacionais com rateios por FTE, atendimentos e Squad direto; verificar centavos de rateio e casos sem base (UNALLOCATED).
- Seleção apenas de pessoas, apenas de operações, repetição da cópia e tentativas simultâneas.
- Bonificação oficial e provisões: confirmar que `variable_pay`, `overtime` e `other_costs` não foram copiadas.
- Auditoria e permissões: usuário sem `edit_costs`/`people_costs` não consegue ler a prévia nem gravar.

**Atenção:** `npm run check` valida contratos e sintaxe JavaScript; não executa a migration num banco Postgres real.
