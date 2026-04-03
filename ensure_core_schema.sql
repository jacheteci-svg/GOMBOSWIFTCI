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
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS client_nom TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS client_telephone TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS source_commande TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS mode_paiement TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS commune_livraison TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS adresse_livraison TEXT;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS notes_client TEXT;
-- Référence métier (certaines instances : NOT NULL sans défaut — l’app envoie toujours une valeur à la création)
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS reference TEXT;
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

-- =============================================================================
-- Création de comptes utilisateurs (tenant) depuis l’admin web
-- Sans cette fonction, signUp + confirmation e-mail peut ne pas renvoyer d’UUID au navigateur.
-- Après exécution : recharger le cache API / PostgREST si la plateforme le propose.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_finalize_user_invite(
  p_email text,
  p_tenant_id uuid,
  p_nom_complet text,
  p_role text,
  p_telephone text,
  p_permissions text[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_tenant uuid;
  v_uid uuid;
BEGIN
  SELECT tenant_id INTO v_actor_tenant
  FROM public.users
  WHERE id = auth.uid();

  IF v_actor_tenant IS NULL OR v_actor_tenant <> p_tenant_id THEN
    RAISE EXCEPTION 'Accès refusé (tenant).';
  END IF;

  SELECT u.id INTO v_uid
  FROM auth.users u
  WHERE lower(trim(u.email)) = lower(trim(p_email))
  LIMIT 1;

  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.users (
    id, email, nom_complet, role, telephone, permissions, tenant_id, actif
  )
  VALUES (
    v_uid,
    lower(trim(p_email)),
    p_nom_complet,
    p_role,
    p_telephone,
    COALESCE(p_permissions, '{}'),
    p_tenant_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    nom_complet = EXCLUDED.nom_complet,
    role = EXCLUDED.role,
    telephone = EXCLUDED.telephone,
    permissions = EXCLUDED.permissions,
    tenant_id = EXCLUDED.tenant_id,
    actif = EXCLUDED.actif,
    email = EXCLUDED.email;

  RETURN v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_finalize_user_invite(text, uuid, text, text, text, text[]) TO authenticated;
