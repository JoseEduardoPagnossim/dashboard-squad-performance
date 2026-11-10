# R22 — Carregamento paginado da Qualidade Completa

## Diagnóstico

O gráfico de Qualidade Completa lê `quality_full_daily` em ordem crescente de `metric_date`, mas a versão R21 não fazia paginação. Com limite de linhas na API PostgREST/Supabase, os dados mais recentes (inclusive novembro/2026) poderiam ficar fora do resultado apesar de importação concluída.

## Correção

A leitura agora percorre páginas de 500 registros, com ordenação estável por `metric_date` e `squad_id`, até a última página. Preserva filtros por organização, agregação ponderada e ausência de deduplicação. Não altera nem reimporta dados. **Sem migration.**

## Validação em produção (SQL Editor, apenas leitura)

```sql
SELECT to_char(metric_date, 'YYYY-MM') AS competencia,
       squad_code,
       COUNT(*) AS registros_diarios,
       SUM(source_rows) AS respostas
FROM public.quality_full_daily
WHERE metric_date >= DATE '2026-11-01'
  AND metric_date < DATE '2026-12-01'
GROUP BY 1, 2 ORDER BY 1, 2;
```

Se esse SQL retornar dados de novembro, mas o gráfico continuar vazio, conferir filtro de análise (datas inicial e final), cache de `app.js` (Ctrl+F5), erros de navegador e políticas RLS para a organização. O status `CONCLUÍDA` no histórico não substitui essa conferência.

## Aplicação

Substituir `js/app.js` pelo arquivo desta entrega, publicar e atualizar a página com Ctrl+F5. Rodar `npm run check` antes de publicar. Não executar SQL de escrita ou migration.
