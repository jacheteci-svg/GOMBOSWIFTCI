-- FINAL RLS AND PERMISSIONS FIX FOR GOMBOSWIFTCI
-- Run this to ensure the SaaS registration flow works correctly.

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant Table Privileges (Required for INSERT during registration)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 3. Tenant Policies
DROP POLICY IF EXISTS tenant_insert_public ON tenants;
CREATE POLICY tenant_insert_public ON tenants 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

-- 4. User Policies
DROP POLICY IF EXISTS user_insert_public ON users;
CREATE POLICY user_insert_public ON users 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

-- 5. Verification
SELECT policyname FROM pg_policies WHERE tablename IN ('tenants', 'users');
SELECT has_table_privilege('anon', 'tenants', 'insert');
