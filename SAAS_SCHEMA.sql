-- SAAS MIGRATION SCHEMA FOR GOMBOSWIFTCI
-- This schema introduces Multi-tenancy and Subscriptions

-- 1. Tenants Table (Organizations)
CREATE TABLE tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  email_contact TEXT NOT NULL,
  telephone_contact TEXT,
  slug TEXT UNIQUE NOT NULL, -- For custom subdomains if needed
  logo_url TEXT,
  plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE')),
  actif BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Subscriptions Table
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update Existing Tables to include tenant_id
-- We add tenant_id to separate data between different clients/companies

ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE produits ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE clients ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE commandes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE feuilles_route ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE caisse_retours ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE communes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE mouvements_stock ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- 4. Multi-tenant Row Level Security (RLS)
-- Update RLS policies to ensure users only see data from their tenant

-- Example for produits:
DROP POLICY "Public products access" ON produits;
CREATE POLICY "Tenant products access" ON produits 
  FOR SELECT TO authenticated 
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Tenant manage products" ON produits 
  FOR ALL TO authenticated 
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Repeat similar logic for other tables...

-- 5. Helper function for current tenant
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;
