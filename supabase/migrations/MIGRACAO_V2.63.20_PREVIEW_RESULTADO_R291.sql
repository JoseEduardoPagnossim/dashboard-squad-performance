-- R29.1: devolve a classificacao da pre-validacao sem persistir transacoes.
-- Mantem a mesma assinatura, as autorizacoes e o rollback da R29.
BEGIN;
CREATE OR REPLACE FUNCTION public.preview_strategy_recurring_chunk_r29(p_sales jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_batch uuid; v_result jsonb; v_error text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_strategy_access('people_costs')
 OR NOT public.has_strategy_access('edit_costs') THEN
   RAISE EXCEPTION 'Permissao insuficiente para pre-validar vendas.' USING errcode='42501';
 END IF;
 IF p_sales IS NULL OR jsonb_typeof(p_sales)<>'array' OR jsonb_array_length(p_sales) NOT BETWEEN 1 AND 100 THEN
   RAISE EXCEPTION 'Lista invalida para pre-validacao (1 a 100).';
 END IF;
 BEGIN
   v_batch := public.start_strategy_recurring_batch_v2634('R291_PREVIEW_TEMPORARIO',jsonb_array_length(p_sales),'{}'::jsonb);
   v_result := public.import_strategy_recurring_sales_v2639_r5(v_batch,p_sales);
   RAISE EXCEPTION 'R291_TRANSACTION_ROLLBACK' USING errcode='P0001';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
   IF v_error <> 'R291_TRANSACTION_ROLLBACK' THEN
     RETURN jsonb_build_object('ok',false,'error',left(v_error,500));
   END IF;
 END;
 RETURN jsonb_build_object('ok',true,'imported',coalesce((v_result->>'imported')::integer,0),
 'duplicates',coalesce((v_result->>'duplicates')::integer,0),
 'closed',coalesce((v_result->>'closed')::integer,0),
 'resumed',coalesce((v_result->>'resumed')::integer,0));
END;
$$;
REVOKE ALL ON FUNCTION public.preview_strategy_recurring_chunk_r29(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.preview_strategy_recurring_chunk_r29(jsonb) TO authenticated;
COMMIT;
