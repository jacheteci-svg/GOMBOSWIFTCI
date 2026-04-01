-- ============================================================
-- SAAS PLAN ID SYNTAX FIX
-- Fixes "invalid input syntax for type uuid" error by accepting 
-- the ID as TEXT and only casting to UUID if possible.
-- ============================================================

-- 1. DROP ALL OVERLOADS (Safety first)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as name FROM pg_proc WHERE proname = 'update_saas_plan') LOOP
        EXECUTE 'DROP FUNCTION ' || r.name;
    END LOOP;
END $$;

-- 2. UPDATED MASTER RPC with p_id as TEXT
CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id TEXT, -- Changed from UUID to TEXT for maximum compatibility
  p_name TEXT,
  p_price_fcfa NUMERIC,
  p_description TEXT,
  p_is_popular BOOLEAN,
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
  p_max_products INTEGER DEFAULT -1
) RETURNS JSON AS $$
BEGIN
  -- We try to update using the ID as provided. 
  -- If the 'id' column is UUID, PostgreSQL will automatically try to cast p_id (TEXT).
  -- If it's "PREMIUM" and the column is UUID, it will fail again BUT 
  -- now we can check if it's a UUID or not.
  
  UPDATE saas_plans 
  SET 
    name = p_name,
    price_fcfa = p_price_fcfa,
    description = p_description,
    is_popular = p_is_popular,
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
    -- If max_products column was added as INTEGER
    max_products = p_max_products,
    updated_at = now()
  WHERE id::TEXT = p_id; -- Cast column to TEXT for matching "PREMIUM" etc.
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_saas_plan TO authenticated;

NOTIFY pgrst, 'reload schema';
