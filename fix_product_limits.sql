-- ============================================================
-- SAAS LIMITS EXTENSION: PRODUCT COUNT
-- Adds product quotas to the SaaS plans.
-- ============================================================

DO $$ 
BEGIN
  -- 1. Add max_products to saas_plans if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'max_products') THEN
    ALTER TABLE saas_plans ADD COLUMN max_products INTEGER DEFAULT -1; -- -1 = unlimited
  END IF;
END $$;

-- 2. Update RPC update_saas_plan to reflect NEW limit column
CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id UUID,
  p_name TEXT,
  p_price_fcfa NUMERIC,
  p_description TEXT,
  p_is_popular BOOLEAN,
  -- Existing modules
  p_module_caisse BOOLEAN,
  p_module_audit BOOLEAN,
  p_module_api BOOLEAN,
  p_module_whatsapp BOOLEAN,
  p_module_multi_depot BOOLEAN,
  p_module_livreurs BOOLEAN,
  p_module_rapport_avance BOOLEAN,
  p_module_white_label BOOLEAN,
  -- Granular modules
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
  -- NEW LIMITS
  p_max_products INTEGER DEFAULT -1
) RETURNS JSON AS $$
BEGIN
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
    -- NEW
    max_products = p_max_products
  WHERE id = p_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
