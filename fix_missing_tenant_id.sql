-- ============================================================
-- MASTER INFRASTRUCTURE REPAIR (IDEMPOTENT)
-- This script ensures ALL tables exist, have tenant_id, and RLS.
-- Run this if you get "relation does not exist" errors.
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Core Tables if missing
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  email_contact TEXT NOT NULL,
  telephone_contact TEXT,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT DEFAULT 'FREE',
  actif BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users (Linked to Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  nom_complet TEXT NOT NULL,
  telephone TEXT,
  tenant_id UUID REFERENCES tenants(id),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS produits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT,
  prix_achat NUMERIC(15, 2) DEFAULT 0,
  prix_vente NUMERIC(15, 2) DEFAULT 0,
  devise TEXT DEFAULT 'XOF',
  sku TEXT,
  stock_actuel INTEGER DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom_complet TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT,
  adresse TEXT,
  commune TEXT,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS commandes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_creation TIMESTAMPTZ DEFAULT now(),
  client_id UUID REFERENCES clients(id),
  statut_commande TEXT NOT NULL,
  montant_total NUMERIC(15, 2) DEFAULT 0,
  frais_livraison NUMERIC(15, 2) DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Lines
CREATE TABLE IF NOT EXISTS lignes_commandes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  commande_id UUID REFERENCES commandes(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES produits(id),
  nom_produit TEXT,
  quantite INTEGER,
  prix_unitaire NUMERIC(15, 2),
  montant_ligne NUMERIC(15, 2),
  tenant_id UUID REFERENCES tenants(id)
);

-- 2. Add tenant_id to any existing table that might be missing it (Safe Guard)
DO $$ 
BEGIN
  -- Check for tenant_id on core tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produits' AND column_name = 'tenant_id') THEN
    ALTER TABLE produits ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tenant_id') THEN
    ALTER TABLE clients ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'tenant_id') THEN
    ALTER TABLE commandes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

-- 3. Reset RLS Policies (Tenant Isolation)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['produits', 'clients', 'commandes', 'lignes_commandes'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation %I" ON %I', t, t);
        EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()))', t, t);
    END IF;
  END LOOP;
END $$;
