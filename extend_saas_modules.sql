-- ============================================================
-- EXTENDED SaaS MODULES (GRANULAR CONTROL)
-- This script adds the detailed module control columns to saas_plans.
-- ============================================================

DO $$ 
BEGIN
  -- 1. Add columns to saas_plans if missing
  -- CRM
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_crm_clients') THEN
    ALTER TABLE saas_plans ADD COLUMN module_crm_clients BOOLEAN DEFAULT false;
  END IF;

  -- Logistique & Terrain
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_suivi_terrain') THEN
    ALTER TABLE saas_plans ADD COLUMN module_suivi_terrain BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_logistique_pro') THEN
    ALTER TABLE saas_plans ADD COLUMN module_logistique_pro BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_staff_perf') THEN
    ALTER TABLE saas_plans ADD COLUMN module_staff_perf BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_livraisons_app') THEN
    ALTER TABLE saas_plans ADD COLUMN module_livraisons_app BOOLEAN DEFAULT false;
  END IF;

  -- Admin & Finance
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_tresorerie_audit') THEN
    ALTER TABLE saas_plans ADD COLUMN module_tresorerie_audit BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_caisse_retour_expert') THEN
    ALTER TABLE saas_plans ADD COLUMN module_caisse_retour_expert BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_rapport_journalier') THEN
    ALTER TABLE saas_plans ADD COLUMN module_rapport_journalier BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_profit_finances') THEN
    ALTER TABLE saas_plans ADD COLUMN module_profit_finances BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_tresorerie_admin') THEN
    ALTER TABLE saas_plans ADD COLUMN module_tresorerie_admin BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_expertise_comptable') THEN
    ALTER TABLE saas_plans ADD COLUMN module_expertise_comptable BOOLEAN DEFAULT false;
  END IF;

END $$;

-- 2. Update RPC update_saas_plan to reflect NEW columns
CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id UUID,
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
  -- NEW GRANULAR COLUMNS
  p_module_crm_clients BOOLEAN DEFAULT false,
  p_module_suivi_terrain BOOLEAN DEFAULT false,
  p_module_logistique_pro BOOLEAN DEFAULT false,
  p_module_staff_perf BOOLEAN DEFAULT false,
  p_module_livraisons_app BOOLEAN DEFAULT false,
  p_module_tresorerie_audit BOOLEAN DEFAULT false,
  p_module_caisse_retour_expert BOOLEAN DEFAULT false,
  p_module_rapport_journalier BOOLEAN DEFAULT false,
  p_module_profit_finances BOOLEAN DEFAULT false,
  p_module_tresorerie_admin BOOLEAN DEFAULT false,
  p_module_expertise_comptable BOOLEAN DEFAULT false
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
    -- NEW
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
    module_expertise_comptable = p_module_expertise_comptable
  WHERE id = p_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
