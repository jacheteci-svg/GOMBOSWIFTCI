-- ============================================================
-- EMERGENCY FIX: MONEROO RLS POLICY
-- Relaxes the RLS for the tracking table to ensure inactive tenants
-- can initiate payments without being blocked by strict user-linked checks.
-- ============================================================

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS moneroo_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moneroo_id TEXT UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'XOF',
    status TEXT DEFAULT 'pending',
    type TEXT DEFAULT 'SUBSCRIPTION',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Relax RLS for INSERT
ALTER TABLE moneroo_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view their own transactions" ON moneroo_transactions;
DROP POLICY IF EXISTS "Tenants can insert their own transactions" ON moneroo_transactions;
DROP POLICY IF EXISTS "Allow authenticated insert on moneroo_transactions" ON moneroo_transactions;

-- Selective SELECT based on user's tenant_id
CREATE POLICY "Tenants can view their own transactions" 
ON moneroo_transactions FOR SELECT 
TO authenticated 
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Simpler INSERT: If you are authenticated, you can insert. 
-- The backend tracking handles the security from there.
CREATE POLICY "Allow authenticated insert on moneroo_transactions" 
ON moneroo_transactions FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Ensure the RPC function for processing payments is secure but callable
-- (This should already be in your moneroo_setup.sql or equivalent)

NOTIFY pgrst, 'reload schema';
