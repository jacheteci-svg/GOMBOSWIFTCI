-- ============================================================
-- FINAL GLOBAL MODULES REPAIR (LOGISTICS & FINANCE)
-- This script ensures ALL advanced modules (Caisse, Profit, Audit) 
-- have tenant_id and strict RLS isolation.
-- ============================================================

DO $$ 
DECLARE
  t text;
  -- Full list of tables that must be tenant-isolated
  tables text[] := ARRAY[
    'produits', 
    'clients', 
    'commandes', 
    'lignes_commandes', 
    'mouvements_stock', 
    'feuilles_route', 
    'caisse_retours', 
    'depenses', 
    'communes', 
    'appel_commandes'
  ];
BEGIN
  -- 1. Create tables if they are completely missing
  CREATE TABLE IF NOT EXISTS depenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    categorie TEXT NOT NULL,
    montant NUMERIC(15, 2) DEFAULT 0,
    description TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS feuilles_route (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT now(),
    livreur_id UUID REFERENCES users(id),
    statut_feuille TEXT DEFAULT 'en_cours',
    total_commandes INTEGER DEFAULT 0,
    montant_encaisse NUMERIC(15, 2) DEFAULT 0,
    ecart_caisse NUMERIC(15, 2) DEFAULT 0,
    date_traitement TIMESTAMPTZ,
    tenant_id UUID REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS caisse_retours (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT now(),
    feuille_route_id UUID REFERENCES feuilles_route(id),
    livreur_id UUID REFERENCES users(id),
    caissiere_id UUID REFERENCES users(id),
    montant_remis_par_livreur NUMERIC(15, 2) DEFAULT 0,
    montant_attendu NUMERIC(15, 2) DEFAULT 0,
    ecart NUMERIC(15, 2) DEFAULT 0,
    commentaire_caissiere TEXT,
    tenant_id UUID REFERENCES tenants(id)
  );

  -- 2. Ensure tenant_id exists on all tables and add RLS
  FOREACH t IN ARRAY tables
  LOOP
    -- Add tenant_id if missing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'tenant_id') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID REFERENCES tenants(id)', t);
        END IF;

        -- Force RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation %I" ON %I', t, t);
        EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()))', t, t);
    END IF;
  END LOOP;
END $$;

-- 3. Update 'commandes' to include missing financial columns if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commandes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'date_livraison_effective') THEN
            ALTER TABLE commandes ADD COLUMN date_livraison_effective TIMESTAMPTZ;
        END IF;
    END IF;
END $$;

-- Refresh cache
NOTIFY pgrst, 'reload schema';
