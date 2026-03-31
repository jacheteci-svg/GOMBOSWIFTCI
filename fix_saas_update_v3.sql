-- ============================================================
-- GLOBAL SAAS PLAN UPDATE FIX (v3) - ROBUST CLEANUP
-- Fixes "function not unique" error by dropping all overloads 
-- before recreating the unified master function.
-- ============================================================

-- 1. DROP ALL OVERLOADS of update_saas_plan to avoid "not unique" error
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as name FROM pg_proc WHERE proname = 'update_saas_plan') LOOP
        EXECUTE 'DROP FUNCTION ' || r.name;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors du nettoyage des fonctions : %', SQLERRM;
END $$;

-- 2. Ensure Table Structure is Up-to-Date
DO $$ 
BEGIN
    -- Add granular modules if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'module_crm_clients') THEN
        ALTER TABLE saas_plans ADD COLUMN module_crm_clients BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_suivi_terrain BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_logistique_pro BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_staff_perf BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_livraisons_app BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_tresorerie_audit BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_caisse_retour_expert BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_rapport_journalier BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_profit_finances BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_tresorerie_admin BOOLEAN DEFAULT false;
        ALTER TABLE saas_plans ADD COLUMN module_expertise_comptable BOOLEAN DEFAULT false;
    END IF;

    -- Add max_products if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_plans' AND column_name = 'max_products') THEN
        ALTER TABLE saas_plans ADD COLUMN max_products INTEGER DEFAULT -1;
    END IF;
END $$;

-- 3. Master RPC function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id UUID,
  p_name TEXT,
  p_price_fcfa NUMERIC,
  p_description TEXT,
  p_is_popular BOOLEAN,
  -- All Modules (19 params total)
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
    max_products = p_max_products,
    updated_at = now()
  WHERE id = p_id;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-Apply policies for SuperAdmin management
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view plans" ON saas_plans;
DROP POLICY IF EXISTS "SuperAdmin can manage saas_plans" ON saas_plans;

CREATE POLICY "Public can view plans" ON saas_plans FOR SELECT USING (true);
CREATE POLICY "SuperAdmin can manage saas_plans" ON saas_plans 
FOR ALL TO authenticated 
USING ( (SELECT role FROM users WHERE id = auth.uid()) = 'SUPER_ADMIN' );

GRANT EXECUTE ON FUNCTION update_saas_plan TO authenticated;

NOTIFY pgrst, 'reload schema';
