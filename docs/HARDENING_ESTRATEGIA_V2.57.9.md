# V2.57.9 — Hardening, segurança e regressões

## Objetivo
Encerrar a Fase 2 da Gestão Estratégica com defesa em profundidade, integridade de cálculos e regressões automáticas antes de avançar para Eficiência.

## Alterações
- Permissões estratégicas passam a ser **fail-closed**: quando o payload contém o campo oficial do banco (snake_case), ele é autoritativo, inclusive quando é `false`.
- Qualquer alteração/revogação de acesso limpa imediatamente o contexto financeiro em memória e força nova carga antes de reutilizar dados.
- A UI executiva não calcula nem renderiza composição de custos, consolidação por Squad, insights ou gráficos agregados quando `can_view_aggregates` não está ativo.
- `total_cost` explícito negativo é normalizado para zero.
- Percentuais persistidos de rateio são limitados a 0..1.
- O motor de rateio consolida códigos equivalentes após normalização (ex.: `a` e `A`) antes de distribuir centavos, evitando sobrescrita/perda de valor.
- Motor de custo passa de `SC-0.6.0-snapshot` para `SC-0.6.1`.
- CI/validador passa a exigir consistência entre `package.json`, `package-lock.json`, `APP_VERSION` e cache-busters do HTML.
- Nova suíte `strategy-hardening-v2579.test.js` cobre permissão, limpeza de memória, limites financeiros, rateio e guarda da UI.

## Banco de dados
Não há nova migration nesta versão. As proteções desta entrega são de aplicação, normalização, renderização e regressão. As RLS/RPCs já existentes continuam sendo a camada autoritativa no servidor.

## Checklist de regressão
1. Usuário sem Gestão Estratégica não vê a rota.
2. Usuário com Estratégia, mas sem agregados, vê valores protegidos e nenhuma composição/consolidação antiga.
3. Revogar acesso do próprio usuário limpa a tela sem depender de refresh.
4. Custos individuais continuam disponíveis somente com `can_view_people_costs`.
5. Edição continua exigindo `can_edit_costs` + visualização de pessoas.
6. Fechamento/reabertura e snapshots da V2.57.6 permanecem sem alteração funcional.
7. Reimportação/saneamento das V2.57.7/V2.57.8 permanece sem alteração funcional.
8. Rateios somam exatamente o valor do custo, inclusive com aliases de Squad que normalizam para o mesmo código.
9. `npm run check` deve finalizar sem falhas.

## Critério de saída da Fase 2
A Fase 2 pode ser considerada encerrada quando `npm run check` estiver verde e os cenários de permissão acima forem validados em ambiente conectado ao Supabase.
