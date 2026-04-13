-- ============================================================
-- MASTER SAAS PLAN SYSTEM FIX (v6 FINAL)
-- Resolves deactivation, modification, deletion, and creation bugs.
-- Ensures strict SuperAdmin security and TEXT ID compatibility.
-- ============================================================

-- 1. Infrastructure Hardening (Ensure Columns)
ALTER TABLE saas_plans 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS module_crm_clients BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_suivi_terrain BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_logistique_pro BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_staff_perf BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_livraisons_app BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_tresorerie_audit BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_caisse_retour_expert BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_rapport_journalier BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_profit_finances BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_tresorerie_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS module_expertise_comptable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT -1,
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT -1,
  ADD COLUMN IF NOT EXISTS max_orders_month INTEGER DEFAULT -1,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS icon_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Cleanup Legacy Signatures to prevent "Function already exists" errors
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as name FROM pg_proc WHERE proname IN ('update_saas_plan', 'delete_saas_plan', 'create_saas_plan')) LOOP
        EXECUTE 'DROP FUNCTION ' || r.name;
    END LOOP;
END $$;

-- 3. Definitive Update RPC (Synchronized with SuperAdmin.tsx)
CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id TEXT,
  p_name TEXT,
  p_price_fcfa BIGINT,
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
) RETURNS JSONB AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  -- Security check: Must be SuperAdmin
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUPER_ADMIN') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé: droits SuperAdmin requis');
  END IF;

  UPDATE saas_plans SET
    name = p_name,
    price_fcfa = p_price_fcfa,
    description = p_description,
    is_popular = p_is_popular,
    is_active = p_is_active,
    module_caisse = p_module_caisse,
    module_audit = p_module_audit,
    module_api = p_module_api,
    module_whatsapp = COALESCE(p_module_whatsapp, FALSE),
    module_multi_depot = COALESCE(p_module_multi_depot, FALSE),
    module_livreurs = COALESCE(p_module_livreurs, FALSE),
    module_rapport_avance = COALESCE(p_module_rapport_avance, FALSE),
    module_white_label = COALESCE(p_module_white_label, FALSE),
    module_crm_clients = COALESCE(p_module_crm_clients, FALSE),
    module_suivi_terrain = COALESCE(p_module_suivi_terrain, FALSE),
    module_logistique_pro = COALESCE(p_module_logistique_pro, FALSE),
    module_staff_perf = COALESCE(p_module_staff_perf, FALSE),
    module_livraisons_app = COALESCE(p_module_livraisons_app, FALSE),
    module_tresorerie_audit = COALESCE(p_module_tresorerie_audit, FALSE),
    module_caisse_retour_expert = COALESCE(p_module_caisse_retour_expert, FALSE),
    module_rapport_journalier = COALESCE(p_module_rapport_journalier, FALSE),
    module_profit_finances = COALESCE(p_module_profit_finances, FALSE),
    module_tresorerie_admin = COALESCE(p_module_tresorerie_admin, FALSE),
    module_expertise_comptable = COALESCE(p_module_expertise_comptable, FALSE),
    max_products = p_max_products,
    max_users = p_max_users,
    max_orders_month = p_max_orders_month,
    updated_at = now()
  WHERE id = p_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan non trouvé: ' || p_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'rows_v5', v_rows_updated);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Plan RPC (Replaces raw .insert() to handle ID generation)
CREATE OR REPLACE FUNCTION create_saas_plan(
  p_name TEXT,
  p_price_fcfa BIGINT,
  p_description TEXT
) RETURNS JSONB AS $$
DECLARE
  v_new_id TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUPER_ADMIN') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  -- Generate a human-readable but unique ID
  v_new_id := 'PLAN_' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO saas_plans (id, name, price_fcfa, description, is_active, is_popular, icon_name, color)
  VALUES (v_new_id, p_name, p_price_fcfa, p_description, false, false, 'Zap', '#6366f1');

  RETURN jsonb_build_object('success', true, 'id', v_new_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Delete Plan RPC
CREATE OR REPLACE FUNCTION delete_saas_plan(p_id TEXT) RETURNS JSONB AS $$
DECLARE
  v_rows_deleted INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUPER_ADMIN') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  DELETE FROM saas_plans WHERE id = p_id;
  
  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
  
  IF v_rows_deleted = 0 THEN
     RETURN jsonb_build_object('success', false, 'error', 'Plan non trouvé');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Permissions & Real-time setup
GRANT EXECUTE ON FUNCTION update_saas_plan TO authenticated;
GRANT EXECUTE ON FUNCTION create_saas_plan TO authenticated;
GRANT EXECUTE ON FUNCTION delete_saas_plan TO authenticated;

-- Ensure RLS is correctly bypassing read for anonymous but protecting write
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view plans" ON saas_plans;
CREATE POLICY "Public can view plans" ON saas_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only Superadmins can modify" ON saas_plans;
CREATE POLICY "Only Superadmins can modify" ON saas_plans FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

NOTIFY pgrst, 'reload schema';
