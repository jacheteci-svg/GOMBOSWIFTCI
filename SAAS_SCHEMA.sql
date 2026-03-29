-- SAAS MIGRATION SCHEMA FOR GOMBOSWIFTCI (Full Version)
-- This schema introduces Multi-tenancy and Subscriptions

-- 1. Helper function for current tenant (Robust version)
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Tenants Table (Organizations)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  email_contact TEXT NOT NULL,
  telephone_contact TEXT,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE')),
  actif BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Update Existing Tables to include tenant_id (if not exists)
DO $$ 
BEGIN
  -- List of tables to add tenant_id to
  -- (Ignore users, produits, commandes, zones_livraison, versements, depenses if already added)
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tenant_id') THEN
    ALTER TABLE clients ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lignes_commandes' AND column_name = 'tenant_id') THEN
    ALTER TABLE lignes_commandes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mouvements_stock' AND column_name = 'tenant_id') THEN
    ALTER TABLE mouvements_stock ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communes' AND column_name = 'tenant_id') THEN
    ALTER TABLE communes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feuilles_route' AND column_name = 'tenant_id') THEN
    ALTER TABLE feuilles_route ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caisse_retours' AND column_name = 'tenant_id') THEN
    ALTER TABLE caisse_retours ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appels_commandes' AND column_name = 'tenant_id') THEN
    ALTER TABLE appels_commandes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

-- 5. Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feuilles_route ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse_retours ENABLE ROW LEVEL SECURITY;
ALTER TABLE appels_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE versements ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Multi-tenancy

-- Function to check if user belongs to tenant
-- We use a simpler check in USING to avoid recursion issues

-- POLICY: tenants (User sees their own tenant info)
DROP POLICY IF EXISTS "Users can see their own tenant" ON tenants;
CREATE POLICY "Users can see their own tenant" ON tenants 
  FOR SELECT TO authenticated 
  USING (id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- POLICY: users (Special case to avoid recursion)
DROP POLICY IF EXISTS "Tenant isolation users" ON users;
CREATE POLICY "Tenant isolation users" ON users 
  FOR ALL TO authenticated 
  USING (
    id = auth.uid() OR 
    tenant_id = (SELECT u.tenant_id FROM users u WHERE u.id = auth.uid())
  );

-- POLICY: All other business tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['produits', 'clients', 'commandes', 'lignes_commandes', 'mouvements_stock', 'communes', 'feuilles_route', 'caisse_retours', 'appels_commandes', 'zones_livraison', 'versements', 'depenses'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation %I" ON %I', t, t);
    EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()))', t, t);
  END LOOP;
END $$;
