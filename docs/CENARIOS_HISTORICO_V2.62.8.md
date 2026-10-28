# V2.62.8 — Cenários salvos e histórico

## Implantação

1. Aplicar `supabase/migrations/MIGRACAO_V2.62.8.sql` no SQL Editor Supabase antes de publicar o frontend.
2. Publicar apenas o pacote incremental sobre a V2.62.7.
3. Executar `npm run check` e validar a página Gestão Estratégica > Cenários > Comparativo entre cenários.
4. Salvar uma simulação nova, criar a revisão 2 do mesmo ID, recuperar premissas e comparar as revisões.

## Contrato

- Tabela `strategy_scenario_revisions`: uma linha por revisão; `scenario_id` identifica o mesmo planejamento, `revision` cresce a cada gravação.
- Sem `UPDATE` ou `DELETE` para clientes autenticados. Gravação somente via `save_strategy_scenario_revision`, função que valida organização, permissão, competência e identidade do cenário.
- Leitura sob RLS por organização e permissão `aggregates`. Escrita requer `aggregates`, `edit_costs` e `people_costs`.
- Revisions associadas a uma competência e a um Squad; não é possível mudar o escopo de um cenário existente.
- `assumptions` registra as quatro alternativas, inclusive todos os campos do personalizado; `projection` guarda métricas, status de fonte e diferenças **como foram projetados no instante do salvamento**.
- Premissas de negócio opcionais (justificativa) e identificação de usuário criador, horário e regra do motor acompanham o registro.
- Os resultados são fornecidos pelo cliente e explicitamente não oficiais; o servidor valida escopo, estrutura e permissões, não recalcula a projeção. Este histórico não substitui o fechamento nem o snapshot da Fase 6.
- Com fontes faltantes, os indicadores permanecem `null`; não são convertidos em zero ou em alegações de precisão.
- As comparações entre revisões usam dados armazenados, nunca dados atuais recalculados. O usuário pode recuperar as premissas customizadas para simular novamente, criando **nova revisão**.
- O limite da consulta é de 150 revisões por recorte. Paginação adicional poderá ser incluída em versões posteriores.
- Mudanças de dados oficiais depois do salvamento não reescrevem o histórico. O campo `baseline_revision` preserva qual revisão oficial serviu de base, quando existente.

## Limites

- Não há execução automática de decisões nem reconciliação no banco dos números projetados; para governança, a validação em produção deve conferir o motor e o cálculo antes do salvamento.
- Migration é nova e exige teste integrado de RLS/RPC com usuários de organizações e permissões diferentes.
