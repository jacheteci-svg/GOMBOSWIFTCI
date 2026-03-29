-- SUPERADMIN FINAL FIXES AND RPCs FOR GOMBOSWIFTCI
-- Run this in your SQL Editor to enable SuperAdmin functionalities.

-- 1. SUPER_ADMIN RLS BYPASS (Allowing SuperAdmins to see everything)
-- We need to update existing policies or add new ones.
-- Since Supabase/PostgreSQL evaluates all policies (OR), adding a new policy for SUPER_ADMIN works.

DO $$
DECLARE
  t text;
  /* Define the list of tables we WANT to apply SuperAdmin bypass to */
  target_tables text[] := ARRAY[
    'tenants', 'users', 'produits', 'clients', 'commandes', 
    'lignes_commandes', 'mouvements_stock', 'communes', 
    'feuilles_route', 'caisse_retours', 'appels_commandes', 
    'zones_livraison', 'versements', 'depenses'
  ];
BEGIN
  FOREACH t IN ARRAY target_tables
  LOOP
    /* Check if the table exists before trying to create a policy on it */
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS "SuperAdmin bypass %I" ON %I', t, t);
      EXECUTE format('CREATE POLICY "SuperAdmin bypass %I" ON %I FOR ALL TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = ''SUPER_ADMIN'')', t, t);
    END IF;
  END LOOP;
END $$;

-- 2. FUNCTION: get_platform_stats()
-- Aggregates data across the entire platform.
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSONB AS $$
DECLARE
  result CHARACTER VARYING;
  total_t INTEGER;
  active_t INTEGER;
  total_u INTEGER;
  total_o INTEGER;
  total_rev NUMERIC(15,2);
BEGIN
  SELECT count(*) INTO total_t FROM tenants;
  SELECT count(*) INTO active_t FROM tenants WHERE actif = true;
  SELECT count(*) INTO total_u FROM users;
  SELECT count(*) INTO total_o FROM commandes;
  SELECT COALESCE(sum(montant_encaisse), 0) INTO total_rev FROM commandes;

  RETURN jsonb_build_object(
    'total_tenants', total_t,
    'active_tenants', active_t,
    'total_users', total_u,
    'total_orders', total_o,
    'total_revenue', total_rev
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNCTION: update_tenant_plan(t_id UUID, new_plan TEXT)
CREATE OR REPLACE FUNCTION update_tenant_plan(t_id UUID, new_plan TEXT)
RETURNS VOID AS $$
BEGIN
  /* Security check: only SUPER_ADMIN can run this */
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Accès refusé. Réservé aux SuperAdmins.';
  END IF;

  UPDATE tenants SET plan = new_plan, updated_at = now() WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCTION: create_new_tenant_full(t_nom TEXT, t_slug TEXT, t_email TEXT, admin_email TEXT, admin_nom TEXT, admin_pass TEXT)
-- This is a helper for manual creation. 
-- Note: admin_pass here is just for reference as password management is usually handled by Auth, 
-- but we can at least create the tenant and user entry.
CREATE OR REPLACE FUNCTION create_new_tenant_full(
  t_nom TEXT, 
  t_slug TEXT, 
  t_email TEXT, 
  admin_nom TEXT
)
RETURNS UUID AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  /* Security check */
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  INSERT INTO tenants (nom, slug, email_contact)
  VALUES (t_nom, t_slug, t_email)
  RETURNING id INTO new_tenant_id;

  -- Create first admin entry in public.users (Auth entry must be created via SDK or Trigger)
  /* For this tool, we assume the SuperAdmin will use the frontend to handle auth creation. */
  
  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Final check of permissions
GRANT EXECUTE ON FUNCTION get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION update_tenant_plan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_new_tenant_full(TEXT, TEXT, TEXT, TEXT) TO authenticated;
