-- Implementation of Supplier and Procurement Module
-- This migration adds tables for managing suppliers and stock procurement with accounting impact.

-- 1. Table: fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  notes TEXT,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table: approvisionnements
CREATE TABLE IF NOT EXISTS approvisionnements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fournisseur_id UUID REFERENCES fournisseurs(id),
  date TIMESTAMPTZ DEFAULT now(),
  montant_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'recu', 'annule')),
  mode_paiement TEXT,
  notes TEXT,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: lignes_approvisionnements
CREATE TABLE IF NOT EXISTS lignes_approvisionnements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  approvisionnement_id UUID REFERENCES approvisionnements(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES produits(id),
  quantite INTEGER NOT NULL,
  prix_unitaire NUMERIC(15, 2) NOT NULL,
  montant_ligne NUMERIC(15, 2) NOT NULL,
  tenant_id UUID REFERENCES tenants(id)
);

-- 4. Enable RLS
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvisionnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_approvisionnements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['fournisseurs', 'approvisionnements', 'lignes_approvisionnements'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation %I" ON %I', t, t);
    EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()))', t, t);
  END LOOP;
END $$;
