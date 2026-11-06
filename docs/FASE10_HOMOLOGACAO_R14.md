# Fase 10 — Preparação para homologação integrada (R14)

## Correções confirmadas localmente

- Consulta da auditoria de mercadorias agora seleciona apenas colunas existentes em `strategy_merchandise_sales` (não há `customer_name` nem valor MRR nesta tabela). O campo não é inventado.
- Exportação CSV de auditoria escapa células textuais iniciadas por caracteres usados em fórmulas de planilhas.
- O filtro de origem do histórico atualiza a tabela sem nova consulta; o limite dos 50 lotes é explícito.
- Testes cruzam as colunas da consulta com as migrations SQL de MRR e Não MRR, além de preservar o isolamento dos líderes.

## Roteiro obrigatório de homologação no ambiente REAL

1. Aplicar e confirmar as migrations anteriores, especialmente `MIGRACAO_V2.63.10_FASE1_LIDERES.sql` e `MIGRACAO_V2.63.9_R5.sql`.
2. Entrar com cada um dos quatro administradores, configurar o Squad financeiro correto (A/B/D/E) numa competência aberta. Conferir que não integra atendimento, FCR, FTE ou produtividade.
3. Exportar Excel e PDF filtrando cada Squad; conferir comissão base, vendas, bônus, descontos, redistribuição, total e aba de conferência do RH.
4. Importar CSV MRR de homologação; validar campos obrigatórios, opcionais inicialmente desvinculados, `Vl Anterior` como valor vendido e `Vl Atual Ativo` como incremento de MRR; reimportar para verificar idempotência.
5. Importar CSV Não MRR; validar `vlTotalItem` sem multiplicar pela quantidade, repetição legítima de identificadores por item, catálogo, vendedor e Squad.
6. Abrir o histórico e filtrar cada origem; confrontar total por lote, itens exportados e tentativas duplicadas/fechadas com registros reais do Supabase.
7. Testar usuário sem permissões financeiras, competência fechada e dados fora da organização. Nenhuma gravação deve ocorrer.
8. Conferir visualmente no navegador o assistente de quatro etapas, PDF e Excel. Antes da publicação, obter aceite do RH/gestão.

**Limitação:** esta entrega valida o código local e schemas SQL em testes. Sem credenciais e dados reais não há homologação do Supabase, integração RLS, navegador ou valores oficiais. Não declarar a operação pronta para produção apenas por testes automatizados.
