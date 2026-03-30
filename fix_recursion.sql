-- FIX INFINITE RECURSION ERROR
-- Run this in your SQL Editor on InsForge

-- 1. Create a SECURITY DEFINER function to check if user is SUPER_ADMIN
-- This runs as bypass-RLS because of SECURITY DEFINER, preventing the infinite loop!
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- 2. Update the ALL the SuperAdmin bypass policies to use this safe function
DO $$
DECLARE
  t text;
  target_tables text[] := ARRAY[
    'tenants', 'users', 'produits', 'clients', 'commandes', 
    'lignes_commandes', 'mouvements_stock', 'communes', 
    'feuilles_route', 'caisse_retours', 'appels_commandes', 
    'zones_livraison', 'versements', 'depenses'
  ];
BEGIN
  FOREACH t IN ARRAY target_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      -- Drop the old policy that caused the infinite loop
      EXECUTE format('DROP POLICY IF EXISTS "SuperAdmin bypass %I" ON %I', t, t);
      
      -- Create the new safe policy
      EXECUTE format('CREATE POLICY "SuperAdmin bypass %I" ON %I FOR ALL TO authenticated USING (public.is_superadmin())', t, t);
    END IF;
  END LOOP;
END $$;
