-- ============================================================
-- REPAIR GOMBOSWIFTCI CALL CENTER & SAAS INFRASTRUCTURE
-- ============================================================

-- 1. Create Core SaaS tables if missing
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  email_contact TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'FREE',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Default Tenant if none exists
INSERT INTO tenants (nom, email_contact, slug, plan)
SELECT 'JACHETE.CI', 'contact@jachete.ci', 'jachete-ci', 'PREMIUM'
WHERE NOT EXISTS (SELECT 1 FROM tenants LIMIT 1);

-- 3. Create missing tables
CREATE TABLE IF NOT EXISTS communes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  tarif_livraison NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mouvements_stock (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produit_id UUID REFERENCES produits(id),
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'retour')),
  quantite INTEGER NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  reference TEXT,
  commentaire TEXT,
  fait_par UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS feuilles_route (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT now(),
  livreur_id UUID REFERENCES users(id),
  statut_feuille TEXT NOT NULL DEFAULT 'en_cours',
  communes_couvertes TEXT[],
  total_commandes INTEGER DEFAULT 0,
  total_montant_theorique NUMERIC(15, 2) DEFAULT 0,
  montant_encaisse NUMERIC(15, 2) DEFAULT 0,
  ecart_caisse NUMERIC(15, 2) DEFAULT 0,
  lien_pdf TEXT,
  date_traitement TIMESTAMPTZ,
  tenant_id UUID REFERENCES tenants(id)
);

-- 4. Add tenant_id to all core business tables if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE users SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;

ALTER TABLE produits ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE produits SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE clients SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;

ALTER TABLE commandes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE commandes SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;

ALTER TABLE lignes_commandes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE lignes_commandes SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;

ALTER TABLE appels_commandes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE appels_commandes SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;

-- 5. Enable RLS and add isolation policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation users" ON users;
CREATE POLICY "Tenant isolation users" ON users 
FOR ALL TO authenticated 
USING (id = auth.uid() OR tenant_id = (SELECT u.tenant_id FROM users u WHERE u.id = auth.uid()));

-- Apply for business tables
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation produits" ON produits;
CREATE POLICY "Tenant isolation produits" ON produits FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation clients" ON clients;
CREATE POLICY "Tenant isolation clients" ON clients FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation commandes" ON commandes;
CREATE POLICY "Tenant isolation commandes" ON commandes FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

ALTER TABLE lignes_commandes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation lignes_commandes" ON lignes_commandes;
CREATE POLICY "Tenant isolation lignes_commandes" ON lignes_commandes FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

ALTER TABLE appels_commandes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation appels_commandes" ON appels_commandes;
CREATE POLICY "Tenant isolation appels_commandes" ON appels_commandes FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation communes" ON communes;
CREATE POLICY "Tenant isolation communes" ON communes FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation mouvements_stock" ON mouvements_stock;
CREATE POLICY "Tenant isolation mouvements_stock" ON mouvements_stock FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));
