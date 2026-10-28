# V2.62.9 — Hardening e fechamento técnico da Fase 7 (Cenários)

## Pré-requisitos / ordem de instalação
1. V2.62.8 já aplicada no frontend e migration `MIGRACAO_V2.62.8.sql` aplicada no Supabase.
2. Executar **`MIGRACAO_V2.62.9.sql` depois da V2.62.8** no SQL Editor ou no mecanismo de migrações, com conta administradora.
3. Publicar os arquivos alterados da V2.62.9 sobre a V2.62.8, limpar cache e executar `npm run check` no código.
4. Repetir em homologação o roteiro de regressões e verificações de RLS abaixo antes de produção.

## O que foi reforçado
- `SoftenStrategyScenarioHistory.validateProjection`: rejeita alternativas incompletas, valores não numéricos, valores negativos onde proibidos, percentuais/contagens/jornadas fora do domínio.
- Custos: **`custo total = custo pessoal + operacional`** (tolerância de 7,5 centavos para reconciliação de arredondamentos).
- Resultado líquido direto: **`receita direta - custo total`**, sem somar as receitas influenciada e protegida.
- ROI direto: **`(receita direta - custo total) / custo total × 100`** quando custo é maior que zero. Com custo zero, o ROI é obrigatoriamente `null`.
- Capacidade: **`gap = FTE disponível - FTE necessário`**; ociosidade = máximo(0, gap); sobrecarga = máximo(0, -gap); utilização = FTE necessário / FTE disponível, quando o denominador é positivo.
- Diferenças: para cada métrica, **`delta = projeção - cenário atual`**; se faltar qualquer parcela, o delta deve ser `null`.
- O histórico registra quatro alternativas e só admite valores `number`/`null` para métricas. Imputação automática de dados ausentes como zero segue proibida.
- Uma revisão local pronta para gravação é clonada e congelada recursivamente para evitar alteração involuntária depois da validação.
- O frontend bloqueia duplo salvamento no mesmo componente e invalida respostas de leitura após perda de acesso.
- O novo trigger `strategy_scenario_revision_guard` valida estrutura, organização/competência, autoria e fórmulas no INSERT. Ele bloqueia UPDATE e DELETE para preservar a trilha de revisões. Direitos de modificação direta permanecem revogados para `authenticated`.
- Os registros **anteriores** não são reescritos nem recebem regra retroativa. Novas revisões recebem `SC-HISTORY-1.1.0`; a regra de projeção permanece `SC-COMPARISON-1.0.0`.

## O que o servidor pode e não pode atestar
O banco verifica consistência **algébrica e estrutural** dos números enviados. Não reexecuta as métricas oficiais nem confirma se premissas de receita, FTE ou crescimento são realizáveis. Projeções são hipóteses, não lançamentos financeiros. O isolamento da Fase 7 não permite alterar custos/pessoas/snapshots oficiais.

## Checklist obrigatório em homologação (não executado nesta entrega)
- [ ] Executar as migrations na ordem e confirmar `strategy_scenario_revision_guard` ativa.
- [ ] Usuário com `aggregates`, `edit_costs`, `people_costs` grava revisão 1 e 2; leitura e comparação confirmadas.
- [ ] Usuário só com `aggregates` vê o histórico mas não consegue salvar.
- [ ] Usuário sem `aggregates` não lê nem grava; usuário de **outra organização** não enxerga revisões alheias.
- [ ] Tentar `INSERT`, `UPDATE`, `DELETE` diretos como `authenticated` e confirmar bloqueio.
- [ ] Via RPC em ambiente de teste, tentar projeção com ROI incorreto, custo total adulterado, delta incorreto, jornadas fora da faixa e competência/squad divergentes. Todas devem falhar.
- [ ] Uma projeção com custo total zero salva com ROI `null`; dados de fonte ausente permanecem `null`.
- [ ] Confirmar revisão anterior preservada após salvar revisão nova; restaurar as premissas não sobrescreve a original.
- [ ] Simular alteração do filtro da competência/Squad ou perda de acesso durante a requisição e confirmar que nenhuma resposta antiga aparece.
- [ ] Regressões nas Fases 2–6: custos, FTE, produtividade, ROI direto, snapshots e fechamento de competência sem mudanças.
- [ ] Verificar layout no navegador (desktop/mobile), botões, notificações, mensagens de erro de migration e consistência das tabelas.

## Testes automatizados
`npm run check` (validade estrutural + testes Node). Há testes de séries determinísticas e cenários adversariais. Os testes SQL são inspeções estáticas, **não** substituem a execução da migration com papéis/JWTs reais.

## Resultado do fechamento
**Fechamento técnico local** após suíte de regressões aprovada. **Homologação Supabase, permissões RLS reais e implantação em produção permanecem pendentes**. Não concluir que a migration foi aplicada pelo simples fato de existir no pacote.

**Commit sugerido:** `fix(strategy): hardening e fechamento da Fase 7 V2.62.9`
