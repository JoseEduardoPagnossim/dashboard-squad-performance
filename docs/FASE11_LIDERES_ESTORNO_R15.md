# Fase 11 — Líderes vendedores e estorno auditável (R15)

## Antes de instalar
- Faça um backup do Supabase (banco e, se aplicável, relatórios oficiais).
- Aplique sobre a versão R14, sem pular nenhuma migration anterior.
- Execute `supabase/migrations/MIGRACAO_V2.63.11_LIDERES_ESTORNO.sql` no SQL Editor do Supabase ANTES de publicar os arquivos JS/HTML.
- Se houver erro na migration, não publique o frontend. A SQL não foi executada no Supabase nesta entrega.
- Execute `npm run check` e valide uma cópia de homologação antes de produzir alterações financeiras reais.

## Para reconhecer o Heitor e outros líderes
1. O próprio líder mantém o Squad financeiro em **Administração → Bonificação → Minha comissão do mês**, por competência.
2. Em **Importação / Comissões comerciais**, use **Reconhecer líderes vendedores**. Isso cadastra apenas a identidade estratégica de líderes elegíveis quando ausente, sem criar técnico nem atendimento.
3. Atualize a conciliação do CSV. Vendas do líder só são elegíveis quando ele tem vínculo financeiro para o Squad E a competência da venda.
4. Importe, apure comissões e use **Sincronizar vendas dos líderes** para preencher a nova parcela automática.
5. A coluna `imported_sales_commission` é automática; o campo `sales_commission` anterior permanece MANUAL. Os relatórios somam ambos sem substituir valores prévios. Revise ajustes manuais anteriores para evitar dupla remuneração por decisão humana.

## Para retirar importações incorretas
1. Em **Histórico de Importações**, abra o lote; exporte as vendas para conferência e backup.
2. Clique **Conferir estorno deste lote**; verifique quantidade, valores, comissões e bloqueios.
3. Se permitido, informe justificativa (12–500 caracteres) e clique **Desfazer lote auditado**.
4. A RPC SQL executa o estorno dentro de uma única transação e registra histórico permanente por venda.
5. O sistema impede estorno de competência fechada, com snapshot financeiro ou com comissão de técnico já sincronizada. Nesses casos, a orientação é conciliar a folha e planejar uma correção autorizada antes de tentar novamente.
6. Reimporte um novo lote com o CSV corrigido e os líderes conciliados. Confirme os resumos e só depois feche a competência.

## Limites e cuidados
- O estorno é por lote, **não** apaga cadastros, regras comerciais ou lançamentos manuais.
- Não há comando de exclusão direta no frontend: somente RPC transacional autorizada.
- No máximo 5.000 vendas por estorno; acima disso, exige tratamento específico.
- Lotes antigos sem identificação confiável não são estornáveis por este botão.
- Registros de tentativas do lote são preservados para auditoria; o lote muda para `reverted`.
- Eventos financeiros e comissões importadas são removidos somente após verificações; o estado anterior é preservado nas tabelas `strategy_commercial_batch_reversals_v26311` e `strategy_commercial_reversed_sales_v26311`.
- Homologação Supabase, RLS, fechamento e testes com dados reais continuam pendentes. Nenhum registro real foi apagado neste trabalho.

## Commit
`feat: integra vendas de lideres e estorno auditado de importacoes`
