-- ============================================================
-- RECONCILIATION MULTI-TENANT (SÉCURITÉ & STRUCTURE)
-- Exécutez ce script dans l'éditeur SQL pour corriger les bugs
-- de création de produits et les erreurs de Dashboard.
-- ============================================================

DO $$ 
BEGIN
  -- 1. Ajout de tenant_id aux tables manquantes
  
  -- PRODUITS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produits' AND column_name = 'tenant_id') THEN
    ALTER TABLE produits ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  -- COMMANDES
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'tenant_id') THEN
    ALTER TABLE commandes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

  -- USERS (Déjà censé exister mais on vérifie)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
    ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;

END $$;

-- 2. Ré-activation de l'isolation RLS (Tenant Isolation)
-- On boucle sur toutes les tables pour forcer l'isolation par tenant_id.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['produits', 'clients', 'commandes', 'lignes_commandes', 'mouvements_stock', 'communes', 'feuilles_route', 'caisse_retours', 'appels_commandes'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Nettoyage des anciennes politiques pour éviter les conflits
    EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation %I" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Public access %I" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Staff access %I" ON %I', t, t);
    
    -- Création d'une politique UNIQUE et ROBUSTE
    EXECUTE format('CREATE POLICY "Tenant isolation %I" ON %I FOR ALL TO authenticated USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()))', t, t);
  END LOOP;
END $$;

-- 3. Correction spécifique pour les Produits (SKU unique par tenant)
-- Le SKU doit être unique AU SEIN d'un tenant, pas sur toute la plateforme.
ALTER TABLE produits DROP CONSTRAINT IF EXISTS produits_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_produit_sku_tenant ON produits(sku, tenant_id);

-- 4. Attribution des produits orphelins (si admin fait des tests sans tenant)
-- UPDATE produits SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;
-- UPDATE commandes SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL;
