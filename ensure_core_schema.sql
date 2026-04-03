-- =============================================================================
-- Réconciliation schéma Postgres / PostgREST (InsForge) — clients, commandes, lignes
-- À exécuter UNE FOIS dans la console SQL du projet (même base que l’app).
-- Corrige définitivement les erreurs du type « Could not find the '…' column … in the schema cache »
-- lorsque des tables ont été créées partiellement ou sans toutes les colonnes métier.
-- Après exécution : recharger le cache PostgREST si la plateforme ne le fait pas automatiquement.
-- =============================================================================

-- clients : champs optionnels UI
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS remarques TEXT;

-- commandes : lien client + champs utilisés par l’app (voir schema.sql)
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS source_commande TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS mode_paiement TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS commune_livraison TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS adresse_livraison TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS notes_client TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS agent_appel_id UUID REFERENCES users(id);
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS livreur_id UUID REFERENCES users(id);
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS feuille_route_id UUID;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS date_validation_appel TIMESTAMPTZ;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS date_livraison_effective TIMESTAMPTZ;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS montant_encaisse NUMERIC(15, 2);
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS notes_livreur TEXT;

-- lignes_commandes
ALTER TABLE lignes_commandes ADD COLUMN IF NOT EXISTS prix_achat_unitaire NUMERIC(15, 2) DEFAULT 0;

-- mouvements_stock (addMouvementStock envoie tenant_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mouvements_stock')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mouvements_stock' AND column_name = 'tenant_id') THEN
    ALTER TABLE mouvements_stock ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;
