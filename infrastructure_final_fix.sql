-- ============================================================
-- GOMBOSWIFTCI: UNIFIED INFRASTRUCTURE & SCHEMA FIX
-- Use this script to resolve 500 errors, RLS recursion,
-- and SaaS plan schema mismatches.
-- ============================================================

-- 1. ROBUST RLS HELPERS (Prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.get_current_tenant_id() 
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. ENSURE BASE TABLES (Subscriptions & Modules)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.subscriptions TO authenticated;

-- EXTEND SAAS_PLANS SCHEMA (Granular Module Control)
ALTER TABLE saas_plans 
  ADD COLUMN IF NOT EXISTS module_whatsapp BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_multi_depot BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_livreurs BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_rapport_avance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_white_label BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_crm_clients BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_suivi_terrain BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_logistique_pro BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_staff_perf BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_livraisons_app BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_tresorerie_audit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_caisse_retour_expert BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_rapport_journalier BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_profit_finances BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_tresorerie_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_expertise_comptable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT -1;

-- 3. UNIFIED UPDATE RPC (Matches SuperAdmin.tsx)
-- Robust Drop: Drops all existing versions of update_saas_plan to avoid overloading issues
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'update_saas_plan') 
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION update_saas_plan(
  p_id TEXT,
  p_name TEXT,
  p_price_fcfa BIGINT,
  p_description TEXT,
  p_is_popular BOOLEAN,
  p_module_caisse BOOLEAN,
  p_module_audit BOOLEAN,
  p_module_api BOOLEAN,
  p_module_whatsapp BOOLEAN DEFAULT false,
  p_module_multi_depot BOOLEAN DEFAULT false,
  p_module_livreurs BOOLEAN DEFAULT false,
  p_module_rapport_avance BOOLEAN DEFAULT false,
  p_module_white_label BOOLEAN DEFAULT false,
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
  p_module_expertise_comptable BOOLEAN DEFAULT false,
  p_max_products INTEGER DEFAULT -1
) RETURNS JSONB AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  IF NOT public.is_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FIX RECURSIVE POLICIES
-- Clean up all potentially recursive policies first
DROP POLICY IF EXISTS "Tenant isolation users" ON public.users;
DROP POLICY IF EXISTS "Users can see their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Anyone can see users" ON public.users;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['tenants', 'users', 'produits', 'clients', 'commandes', 'lignes_commandes', 'mouvements_stock', 'communes', 'feuilles_route', 'caisse_retours', 'appels_commandes', 'zones_livraison', 'versements', 'depenses', 'subscriptions', 'moneroo_transactions', 'moneroo_plans'];
  p record;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Check if table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      -- Aggressively drop ALL policies for this table to be 100% sure
      FOR p IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p.policyname, t);
      END LOOP;

      -- Super Admin Bypass
      EXECUTE format('CREATE POLICY "SuperAdmin bypass %I" ON %I FOR ALL TO authenticated USING (public.is_superadmin())', t, t);
      
      -- Tenant Isolation (Non-recursive)
      IF t = 'tenants' THEN
        EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR SELECT TO authenticated USING (id = public.get_current_tenant_id())', t, t);
      ELSIF t = 'users' THEN
        EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR SELECT TO authenticated USING (id = auth.uid() OR tenant_id = public.get_current_tenant_id())', t, t);
      ELSIF t = 'subscriptions' THEN
        EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR SELECT TO authenticated USING (tenant_id = public.get_current_tenant_id())', t, t);
      ELSE
        EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR ALL TO authenticated USING (tenant_id = public.get_current_tenant_id())', t, t);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 6. PLATFORM STATS RPC
-- Robust Drop for stats rpc
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'get_platform_stats') 
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSONB AS $$
DECLARE
  total_t INTEGER;
  active_t INTEGER;
  total_u INTEGER;
  total_o INTEGER;
  total_rev NUMERIC(15,2);
  v_saas_rev NUMERIC(15,2);
  v_growth JSONB;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  SELECT count(*) INTO total_t FROM tenants;
  SELECT count(*) INTO active_t FROM tenants WHERE actif = true;
  SELECT count(*) INTO total_u FROM users;
  SELECT count(*) INTO total_o FROM commandes WHERE statut_commande = 'livree';
  
  -- GMV (Client volume)
  SELECT COALESCE(sum(montant_total), 0) INTO total_rev FROM commandes WHERE statut_commande = 'livree';
  
  -- SaaS Revenue (Moneroo success) - handle table missing gracefully
  BEGIN
    SELECT COALESCE(sum(montant), 0) INTO v_saas_rev FROM moneroo_transactions WHERE statut = 'success';
  EXCEPTION WHEN OTHERS THEN
    v_saas_rev := 0;
  END;

  -- Growth chart (last 30 days)
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_growth FROM (
      SELECT to_char(date_trunc('day', created_at), 'DD/MM') as name, count(*) as val
      FROM tenants
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at) ASC
  ) t;

  RETURN jsonb_build_object(
    'total_tenants', total_t,
    'active_tenants', active_t,
    'total_users', total_u,
    'total_orders', total_o,
    'total_revenue', v_saas_rev,
    'tenant_gmv', total_rev,
    'growth_chart', v_growth
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION update_saas_plan TO authenticated;
