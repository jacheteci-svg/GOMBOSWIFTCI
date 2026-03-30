-- 1. Ensure SUPER_ADMIN (or any user) can UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 2. Create RPC to forcefully create/update SuperAdmin profile (bypassing all RLS issues)
-- This ensures the profile gets created even if RLS is messy during the setup phase
CREATE OR REPLACE FUNCTION force_create_superadmin(
  p_id UUID,
  p_email TEXT,
  p_nom TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert or Update the profile with SUPER_ADMIN role
  INSERT INTO public.users (id, email, role, nom_complet, tenant_id, actif)
  VALUES (p_id, p_email, 'SUPER_ADMIN', p_nom, null, true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'SUPER_ADMIN',
    nom_complet = EXCLUDED.nom_complet,
    tenant_id = null,
    actif = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION force_create_superadmin(UUID, TEXT, TEXT) TO authenticated;
