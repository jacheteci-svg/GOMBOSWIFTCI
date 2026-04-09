-- Gombo Core v4.1 - Billing & Infrastructure Stabilization
-- This script ensures all action buttons in SuperAdmin (Billing & Plans) work correctly.

-- 1. Cleanup old overloaded functions
DO $$ 
DECLARE r record; 
BEGIN 
  FOR r IN (SELECT oid FROM pg_proc WHERE proname = 'update_saas_plan') LOOP 
    EXECUTE 'DROP FUNCTION ' || r.oid::regprocedure; 
  END LOOP; 
END $$;

-- 2. Ensure columns exist in tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'pending';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 3. Ensure columns exist in saas_plans (Granular modules)
ALTER TABLE saas_plans 
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
  ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT -1;

-- 4. Universal SuperAdmin RLS Bypass
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['tenants', 'saas_plans', 'users', 'commandes', 'produits', 'clients', 'support_tickets', 'admin_audit_logs'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "SuperAdmin Universal Access %I" ON %I', t, t);
      EXECUTE format('CREATE POLICY "SuperAdmin Universal Access %I" ON %I FOR ALL TO authenticated USING (public.is_superadmin())', t, t);
    END IF;
  END LOOP;
END $$;

-- 5. Create update_saas_plan with ALL granular modules
CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id TEXT,
  p_name TEXT,
  p_price_fcfa BIGINT,
  p_description TEXT,
  p_is_popular BOOLEAN,
  p_module_caisse BOOLEAN DEFAULT FALSE,
  p_module_audit BOOLEAN DEFAULT FALSE,
  p_module_api BOOLEAN DEFAULT FALSE,
  p_module_whatsapp BOOLEAN DEFAULT FALSE,
  p_module_multi_depot BOOLEAN DEFAULT FALSE,
  p_module_livreurs BOOLEAN DEFAULT FALSE,
  p_module_rapport_avance BOOLEAN DEFAULT FALSE,
  p_module_white_label BOOLEAN DEFAULT FALSE,
  p_module_crm_clients BOOLEAN DEFAULT FALSE,
  p_module_suivi_terrain BOOLEAN DEFAULT FALSE,
  p_module_logistique_pro BOOLEAN DEFAULT FALSE,
  p_module_staff_perf BOOLEAN DEFAULT FALSE,
  p_module_livraisons_app BOOLEAN DEFAULT FALSE,
  p_module_tresorerie_audit BOOLEAN DEFAULT FALSE,
  p_module_caisse_retour_expert BOOLEAN DEFAULT FALSE,
  p_module_rapport_journalier BOOLEAN DEFAULT FALSE,
  p_module_profit_finances BOOLEAN DEFAULT FALSE,
  p_module_tresorerie_admin BOOLEAN DEFAULT FALSE,
  p_module_expertise_comptable BOOLEAN DEFAULT FALSE,
  p_max_products INTEGER DEFAULT -1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  IF NOT public.is_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès refusé');
  END IF;

  UPDATE saas_plans SET
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

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'rows_updated', v_rows_updated);
END;
$$;

GRANT EXECUTE ON FUNCTION update_saas_plan(TEXT, TEXT, BIGINT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER) TO authenticated;
