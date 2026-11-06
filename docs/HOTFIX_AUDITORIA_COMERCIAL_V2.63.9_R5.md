# V2.63.9 R5 — Auditoria comercial na Bonificação

**Base obrigatória:** V2.63.9 R4 (sobre R2; R3 excluída).

## Entregue

- Bonificação → Vendas, produtos, comissões e divergências: consulta por competência, técnico e origem, consulta dos registros do Supabase e exportação CSV.
- Comparação do CSV original com as vendas recorrentes já importadas: valor registrado x `Vl Anterior`, usando chave comercial independente do valor. Correspondências duplicadas ou ambíguas ficam pendentes de revisão. Exportação detalhada das diferenças.
- Novas importações recorrentes: `Vl Anterior` como base comercial e `Vl Atual Ativo` como MRR ativo separado. Migration introduz RPC `import_strategy_recurring_sales_v2639_r5` sem substituir a RPC v2634.
- A importação R5 detecta equivalência com venda antiga por data, Squad, vendedor, produto, cliente, CNPJ e ocorrência, mesmo que o valor tenha mudado. Não duplica valores anteriores.

## Limites importantes

**NÃO corrige automaticamente as vendas importadas nas versões antigas ou as comissões lançadas no histórico.** A exportação mostra diferenças para conciliação supervisionada. Isto evita alterar os lançamentos imutáveis, competências fechadas e bonificações pagas. Não confundir comissão estimada com comissão efetivamente calculada/creditada.

O banco `strategy_recurring_sales.monthly_amount` passa a representar a base comercial nas novas importações; em linhas antigas, guarda o valor original. Para registros novos a coluna `active_monthly_amount` guarda o MRR ativo e `annual_equivalent` indica MRR×12.

## Instalação

1. Backup do banco e código R4.
2. Aplicar `supabase/migrations/MIGRACAO_V2.63.9_R5.sql` em homologação.
3. Extrair o ZIP incremental na raiz do projeto R4, substituindo os arquivos.
4. Executar `npm run check`.
5. Publicar o frontend, `Ctrl+Shift+R`; abrir Bonificação → Auditoria comercial.
6. Conferir outubro/2026 com o mesmo CSV e exportar divergências. Não reimporte as vendas antigas como tentativa de correção.

Sem Edge Functions. **SQL não testada contra o Supabase do cliente**; homologação obrigatória.
