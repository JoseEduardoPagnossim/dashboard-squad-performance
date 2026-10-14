# V2.50.2 — Preset RH + Apresentação compartilhada

## Relatório para RH

O configurador de bonificação passa a oferecer o preset **RH / Pagamento**.

Esse preset seleciona somente:

- **Grupo**;
- **Técnico**;
- **Comissão base do técnico**;
- **Comissão Venda**;
- **Comissão manual**.

A **Comissão manual** consolida `Bônus manual + Prêmio atendimento + Prêmio Notas 5`, seguindo a composição manual/prêmios já usada no fechamento. A **Comissão base do técnico** é a parcela reconciliada automática do fechamento: `Valor oficial - Comissão Venda - Comissão manual`. Assim, as três colunas financeiras somadas reproduzem exatamente o valor oficial do técnico, incluindo os demais ajustes automáticos do fechamento na parcela base. Ao selecionar o preset RH, a opção **Usar estas colunas também no Excel** fica ativada para que o arquivo possa ser encaminhado ao RH sem as colunas técnicas de auditoria. A configuração personalizada continua salva separadamente em **Minha configuração**.

As informações fixas de cabeçalho continuam presentes no PDF, e a comissão de Administrador permanece em sua seção própria quando houver valor registrado.

## Apresentação igual para todos os usuários

A Apresentação não deve ser personalizada pelo técnico logado. Ela passa a usar o consolidado diário organizacional já disponível no Supabase para usuários autenticados da mesma organização.

O ranking respeita exclusivamente o escopo configurado na própria Apresentação:

- **Todos os Squads**: exibe técnicos de todos os Squads da organização;
- **Squad A/B/D/E**: exibe todos os técnicos do Squad escolhido.

O usuário logado não reduz mais o ranking ao próprio técnico. A atualização manual e automática também recarrega o consolidado organizacional, garantindo o mesmo resultado em sessões diferentes.

## Segurança

A alteração não abre dados entre organizações. O RPC organizacional existente filtra pelos perfis vinculados à mesma `organization_id` do usuário autenticado. A V2.50.2 não exige migration nova.


## R2 — Correção da sincronização da Apresentação

A primeira implementação da V2.50.2 reutilizava `ensureOrgOverviewData({ daily: true, technicians: true })`. Esse carregador dispara quatro RPCs organizacionais em conjunto. Para a Apresentação, somente o consolidado diário por técnico é necessário; se qualquer uma das outras RPCs estivesse ausente, desatualizada ou indisponível, o lote era descartado e a tela podia aparecer com **0 registros**.

A R2 separa a dependência da Apresentação:

- usa `get_presentation_technician_daily_overview()` como fonte dedicada;
- mantém fallback temporário para `get_org_technician_daily_overview()`;
- não usa os meses detalhados do usuário logado como fallback em produção, evitando mostrar apenas os dados do próprio técnico;
- preserva o último conjunto válido se uma atualização remota falhar.

A migration `MIGRACAO_V2.50.2_R2.sql` deve ser aplicada no Supabase para garantir a RPC dedicada em todos os ambientes.

## R3 — Totalizador do RH e recuperação da Apresentação

O preset **RH / Pagamento** passa a exibir, nesta ordem: **Grupo, Técnico, Comissão base do técnico, Comissão Venda, Comissão manual e Bônus total**. A última coluna é calculada por linha como a soma das três parcelas de pagamento.

Na Apresentação, o carregamento principal volta a usar `get_org_technician_daily_overview()` isoladamente, sem o `Promise.all` dos outros consolidados. O RPC dedicado criado na R2 permanece como fallback. Se ambos não entregarem dados, o dashboard tenta montar a visão a partir dos meses detalhados disponíveis, preservando a última visão válida em falhas.


## R4 — Fonte organizacional definitiva

A Apresentação passa a consumir `get_presentation_daily_context_v2502`, um contexto JSON dedicado que usa o mesmo padrão de identificação da organização do `get_initial_dashboard_context`. O RPC recebe o período e o Squad da própria Apresentação e retorna todas as métricas diárias dos técnicos da organização, independentemente de o usuário autenticado ser Administrador ou Técnico.

Os RPCs `get_org_technician_daily_overview` e `get_presentation_technician_daily_overview` permanecem apenas como fallback. O fallback por carregamento detalhado é restrito a Administradores porque as políticas de RLS de um Técnico poderiam reduzir esse detalhamento apenas ao próprio usuário.

Quando existe competência indexada para o período, mas nenhuma fonte compartilhada entrega linhas, a Apresentação deixa de considerar a sincronização saudável e informa estado de atenção. Para diagnóstico técnico, `window.SoftenPresentationDiagnostics` expõe somente metadados de carregamento, sem dados financeiros.
