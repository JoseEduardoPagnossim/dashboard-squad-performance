# V2.63.0 — Fundação de automação comercial + Pré-atendimento

## Entregas
- `Gestão Estratégica > Automação`: fontes CSV de Anotação de Venda (MRR), Venda de Mercadorias (sem MRR), e lançamento manual; preparação idempotente e listagem de fontes. Ainda sem importação de arquivos.
- `strategy_import_batches`: contrato futuro de lote com organização, competência, identidade do arquivo, mapeamento e contadores. **Inserção de lotes bloqueada nesta versão**; o importador validado será liberado na V2.63.1.
- `Usuários > Criar`: perfil novo **Pré-atendimento**, conta Auth ativa sem `technician_name` e sem vincular `technician_monthly`; criação vinculada a `strategy_people` com `functional_team='pre_attendance'`, `default_squad_code='C'` e usuário real.
- `Meu Pré-atendimento`: tela inicial sem métricas de Suporte; só consulta a identidade própria através de RLS.
- `Gestão Estratégica > Automação`: conciliação **explícita** de conta Pré-atendimento com pessoa estratégica manual já existente. Bloqueia movimentação se o vínculo atual já possuir custos ou atribuições históricas.
- `get_initial_dashboard_context`: contas Pré-atendimento recebem SOMENTE o perfil, sem squads, competências ou valores de outros técnicos.
- Permissões de edição comercial restritas aos perfis com `can_view_people_costs` e `can_edit_costs` na Gestão Estratégica. Função RPC de vínculo também exige super administrador e escopo da mesma organização.

## Instalação
1. Backup do banco e aplicação sobre V2.62.9.
2. Aplicar `supabase/migrations/MIGRACAO_V2.63.0.sql` no SQL Editor do Supabase, após as anteriores.
3. Publicar frontend e republicar as Edge Functions `create-user` e `manage-user` incluídas no pacote.
4. Executar `npm run check` e homologar: super administrador criando conta Pré-atendimento, primeiro login, vínculo no Squad C, usuário inativo, não acesso ao Suporte, separação de outras organizações, idempotência de fontes e preservação de competências históricas.
5. A fonte manual não gera MRR **por padrão como cadastro de origem**; futuras vendas manuais terão flag MRR configurável por produto/evento. Não bloqueie MRR manual na V2.63.7.

## Restrições / pendências de homologação
- A migration SQL não foi executada em uma instância real do Supabase nesta entrega; valide RLS, RPC, `create-user`, `manage-user` e interface com usuários de homologação antes da produção.
- O cadastro de produtos, o parser de CSV, as comissões e o fechamento financeiro não fazem parte desta versão.
- Migrações futuras não devem converter automaticamente pessoas `PRE` legadas para Squad C; é necessária reconciliação explícita, preservando atribuições passadas.
- A partir desta versão existe Squad C estratégico além do código legado `PRE` (não remapeado automaticamente).

## Contrato de dados
- `strategy_people.functional_team`: `support`, `pre_attendance`, `other`.
- `strategy_import_sources`: `contracted_modules_csv` (MRR), `merchandise_sales_csv` (não MRR), `manual` (sem tipo até produto/evento).
- `strategy_import_batches`: escopo por `organization_id` + `source_id`, metadados e estado de processamento para V2.63.1+, sem reconhecimento de receita nesta versão.
- `profiles.role='pre_attendance'`: autenticado separado da função `technician`; dados sensíveis não são disponibilizados.

## Regras obrigatórias
Ver `docs/FASE8_REGRAS_OBRIGATORIAS_V2.63.0.md` (referência obrigatória para todas as releases até V2.63.9).
