-- R27: passagem de Pre-atendimento (C estrategico) para Suporte (A/B/D/E).
-- Executar antes de publicar a Edge Function manage-user R27.
-- Nao reescreve vendas, custos, snapshots ou indicadores de competencias passadas.
BEGIN;

CREATE OR REPLACE FUNCTION public.convert_pre_attendance_to_support_r27(
  p_actor_id uuid,
  p_user_id uuid,
  p_squad_id uuid,
  p_technician_name text,
  p_full_name text,
  p_effective_year integer,
  p_effective_month integer,
  p_permissions jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org uuid;
  v_code text;
  v_old_person uuid;
  v_new_person uuid;
  v_open_count integer;
  v_start date;
BEGIN
  -- Invocacao exclusivamente pela Edge Function autenticada, usando service_role.
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Movimentacao permitida somente pelo servidor.';
  END IF;
  SELECT organization_id INTO v_org FROM public.profiles
    WHERE user_id=p_actor_id AND role='super_admin' AND active=true;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Administrador ativo nao encontrado.'; END IF;

  PERFORM 1 FROM public.profiles
    WHERE user_id=p_user_id AND organization_id=v_org AND role='pre_attendance' AND active=true
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conta de Pre-atendimento ativa nao encontrada.'; END IF;

  SELECT code::text INTO v_code FROM public.squads
    WHERE id=p_squad_id AND organization_id=v_org AND active=true;
  IF v_code IS NULL OR v_code NOT IN ('A','B','D','E') THEN
    RAISE EXCEPTION 'Squad de Suporte invalido.';
  END IF;
  IF NULLIF(BTRIM(p_technician_name),'') IS NULL OR NULLIF(BTRIM(p_full_name),'') IS NULL THEN
    RAISE EXCEPTION 'Nome e identificacao CSV obrigatorios.';
  END IF;
  IF p_effective_year IS NULL OR p_effective_month IS NULL
     OR p_effective_year NOT BETWEEN 2020 AND 2100 OR p_effective_month NOT BETWEEN 1 AND 12 THEN
    RAISE EXCEPTION 'Competencia de movimentacao invalida.';
  END IF;
  v_start := MAKE_DATE(p_effective_year,p_effective_month,1);
  IF v_start <> DATE_TRUNC('month',CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date THEN
    RAISE EXCEPTION 'A passagem de Pre-atendimento para Suporte deve iniciar na competencia atual.';
  END IF;
  IF EXISTS(SELECT 1 FROM public.squad_months
      WHERE squad_id=p_squad_id AND year=p_effective_year AND month=p_effective_month AND is_closed=true) THEN
    RAISE EXCEPTION 'Competencia operacional de destino esta fechada.';
  END IF;
  IF EXISTS(SELECT 1 FROM public.strategy_competences
      WHERE organization_id=v_org AND competence=v_start AND status='closed') THEN
    RAISE EXCEPTION 'Competencia estrategica esta fechada.';
  END IF;
  -- Uma conta originalmente no Pre-atendimento nao pode ter vinculo operacional aberto.
  IF EXISTS(SELECT 1 FROM public.profile_squad_history WHERE organization_id=v_org AND user_id=p_user_id) THEN
    RAISE EXCEPTION 'Historico operacional ja existe. Requer conciliacao antes da movimentacao.';
  END IF;
  SELECT COUNT(*) INTO v_open_count FROM public.strategy_people
    WHERE organization_id=v_org AND user_id=p_user_id;
  IF v_open_count>1 THEN
    RAISE EXCEPTION 'Mais de uma identidade estrategica vinculada. Concilie antes de mover.';
  END IF;
  SELECT id INTO v_old_person FROM public.strategy_people
    WHERE organization_id=v_org AND user_id=p_user_id AND functional_team='pre_attendance'
    FOR UPDATE;
  IF v_open_count=1 AND v_old_person IS NULL THEN
    RAISE EXCEPTION 'Identidade estrategica nao corresponde ao Pre-atendimento.';
  END IF;

  -- Desvincula o login da identidade antiga, mantendo-a ativa para consulta histórica,
  -- mas sem conta autenticada elegivel para novas importacoes. Nao apagar custos, vendas e atribuicoes
  -- que continuam associados ao ID historico da pessoa do Squad C.
  IF v_old_person IS NOT NULL THEN
    UPDATE public.strategy_people
      SET user_id=NULL, role_label='Pré-atendimento (histórico)', updated_by=p_actor_id, updated_at=NOW()
      WHERE id=v_old_person AND organization_id=v_org;
  END IF;

  UPDATE public.profiles SET role='technician',squad_id=p_squad_id,
      technician_name=BTRIM(p_technician_name),full_name=BTRIM(p_full_name),
      permissions=COALESCE(p_permissions,'{}'::jsonb),updated_at=NOW()
    WHERE user_id=p_user_id AND organization_id=v_org AND role='pre_attendance';
  IF NOT FOUND THEN RAISE EXCEPTION 'Falha na atualizacao do perfil.'; END IF;

  INSERT INTO public.strategy_people(
      organization_id,user_id,name,role_label,functional_team,default_squad_code,
      active,source,created_by,updated_by)
    VALUES(v_org,p_user_id,BTRIM(p_full_name),'Tecnico','support',v_code,
      true,'manual',p_actor_id,p_actor_id)
    RETURNING id INTO v_new_person;

  INSERT INTO public.profile_squad_history(
      organization_id,user_id,squad_id,technician_name,
      valid_from_year,valid_from_month,created_by,note)
    VALUES(v_org,p_user_id,p_squad_id,BTRIM(p_technician_name),
      p_effective_year,p_effective_month,p_actor_id,
      'R27: inicio da atuacao no Suporte. Historico anterior de Pre-atendimento preservado na identidade estrategica anterior.');

  RETURN jsonb_build_object('old_person_id',v_old_person,
    'new_person_id',v_new_person,'squad',v_code,'effective_competence',TO_CHAR(v_start,'YYYY-MM'));
END;
$$;

REVOKE ALL ON FUNCTION public.convert_pre_attendance_to_support_r27(uuid,uuid,uuid,text,text,integer,integer,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.convert_pre_attendance_to_support_r27(uuid,uuid,uuid,text,text,integer,integer,jsonb) TO service_role;
COMMIT;
