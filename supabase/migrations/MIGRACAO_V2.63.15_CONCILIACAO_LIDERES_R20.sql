-- R20: provisiona identidade estrategica de lideres vinculados financeiramente.
-- Requer migrations V2.63.10 e V2.63.11; nao altera as metricas operacionais.
BEGIN;

-- Correcao de dados confirmados pelo administrador: HEITOR DRAGO, outubro de 2026, Squad A.
-- Escopo restrito a organizacao conhecida; impede associar homonimos ou outras contas.
DO $$
DECLARE v_user uuid; v_count int;
BEGIN
 SELECT count(*),min(user_id) INTO v_count,v_user
 FROM public.profiles
 WHERE organization_id='10000000-0000-0000-0000-000000000001'::uuid
   AND role='super_admin' AND active=true AND upper(btrim(full_name))='HEITOR DRAGO';
 IF v_count <> 1 THEN RAISE EXCEPTION 'R20: HEITOR DRAGO deve possuir exatamente uma conta ativa na organizacao (encontradas %).',v_count; END IF;
 UPDATE public.super_admin_commissions SET squad_code='A'
 WHERE organization_id='10000000-0000-0000-0000-000000000001'::uuid
   AND user_id=v_user AND year=2026 AND month=10
   AND (squad_code IS NULL OR squad_code='A');
 IF NOT FOUND THEN RAISE EXCEPTION 'R20: comissao de Heitor 10/2026 ausente ou vinculada a outro Squad; conferir antes de continuar.'; END IF;
END $$;

-- Idempotente e multi-organizacao: nao cria pessoa duplicada nem altera equipe operacional.
-- Apenas lideres com Squad financeiro explicitamente configurado sao elegiveis.
INSERT INTO public.strategy_people
 (organization_id,user_id,name,role_label,functional_team,default_squad_code,active,source)
SELECT p.organization_id,p.user_id,coalesce(nullif(btrim(p.full_name),''),'Lider'),
       'Lider','other',NULL,true,'manual'
FROM public.profiles p
WHERE p.role='super_admin' AND p.active=true
  AND EXISTS (SELECT 1 FROM public.super_admin_commissions c
              WHERE c.organization_id=p.organization_id AND c.user_id=p.user_id
                AND c.squad_code IN ('A','B','D','E'))
  AND NOT EXISTS (SELECT 1 FROM public.strategy_people sp
                  WHERE sp.organization_id=p.organization_id AND sp.user_id=p.user_id);

-- Reativa o vinculo estrategico preexistente, caso esteja inativo, sem alterar os demais dados.
UPDATE public.strategy_people sp SET active=true, updated_at=now()
FROM public.profiles p
WHERE sp.organization_id=p.organization_id AND sp.user_id=p.user_id
  AND p.role='super_admin' AND p.active=true AND sp.active=false
  AND EXISTS (SELECT 1 FROM public.super_admin_commissions c
              WHERE c.organization_id=p.organization_id AND c.user_id=p.user_id
                AND c.squad_code IN ('A','B','D','E'));

COMMIT;
