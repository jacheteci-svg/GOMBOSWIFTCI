-- ============================================================
-- GLOBAL SAAS PLAN UPDATE FIX (v5) - TEXT ID SUPPORT
-- Corrects data types to match the saas_plans schema (TEXT ID)
-- ============================================================

-- 1. DROP ALL OVERLOADS (Safety)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as name FROM pg_proc WHERE proname IN ('update_saas_plan', 'delete_saas_plan')) LOOP
        EXECUTE 'DROP FUNCTION ' || r.name;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors du nettoyage : %', SQLERRM;
END $$;

-- 2. Master RPC function with TEXT p_id
CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id TEXT,
  p_name TEXT,
  p_price_fcfa NUMERIC,
  p_description TEXT,
  p_is_popular BOOLEAN,
  p_is_active BOOLEAN,
  p_module_caisse BOOLEAN,
  p_module_audit BOOLEAN,
  p_module_api BOOLEAN,
  p_module_whatsapp BOOLEAN,
  p_module_multi_depot BOOLEAN,
  p_module_livreurs BOOLEAN,
  p_module_rapport_avance BOOLEAN,
  p_module_white_label BOOLEAN,
  p_module_crm_clients BOOLEAN,
  p_module_suivi_terrain BOOLEAN,
  p_module_logistique_pro BOOLEAN,
  p_module_staff_perf BOOLEAN,
  p_module_livraisons_app BOOLEAN,
  p_module_tresorerie_audit BOOLEAN,
  p_module_caisse_retour_expert BOOLEAN,
  p_module_rapport_journalier BOOLEAN,
  p_module_profit_finances BOOLEAN,
  p_module_tresorerie_admin BOOLEAN,
  p_module_expertise_comptable BOOLEAN,
  p_max_products INTEGER DEFAULT -1,
  p_max_users INTEGER DEFAULT -1,
  p_max_orders_month INTEGER DEFAULT -1
) RETURNS JSON AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN') THEN
    RETURN json_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  UPDATE saas_plans 
  SET 
    name = p_name,
    price_fcfa = p_price_fcfa,
    description = p_description,
    is_popular = p_is_popular,
    is_active = p_is_active,
    module_caisse = p_module_caisse,
    module_audit = p_module_audit,
    module_api = p_module_api,
    module_whatsapp = p_module_whatsapp,
    module_multi_depot = p_module_multi_depot,
    module_livreurs = p_module_livreurs,
    module_rapport_avance = p_module_rapport_avance,
    module_white_label = p_module_white_label,
    module_crm_clients = p_module_crm_clients,
    module_suivi_terrain = p_module_suivi_terrain,
    module_logistique_pro = p_module_logistique_pro,
    module_staff_perf = p_module_staff_perf,
    module_livraisons_app = p_module_livraisons_app,
    module_tresorerie_audit = p_module_tresorerie_audit,
    module_caisse_retour_expert = p_module_caisse_retour_expert,
    module_rapport_journalier = p_module_rapport_journalier,
    module_profit_finances = p_module_profit_finances,
    module_tresorerie_admin = p_module_tresorerie_admin,
    module_expertise_comptable = p_module_expertise_comptable,
    max_products = p_max_products,
    max_users = p_max_users,
    max_orders_month = p_max_orders_month,
    updated_at = now()
  WHERE id = p_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete function with TEXT p_id
CREATE OR REPLACE FUNCTION delete_saas_plan(p_id TEXT) RETURNS JSON AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN') THEN
    RETURN json_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  DELETE FROM saas_plans WHERE id = p_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_saas_plan TO authenticated;
GRANT EXECUTE ON FUNCTION delete_saas_plan TO authenticated;

NOTIFY pgrst, 'reload schema';
