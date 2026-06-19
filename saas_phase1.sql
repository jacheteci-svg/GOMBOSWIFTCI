-- Phase 1: Ajout de la table categories et fonction RPC

-- 1. Table Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Relation avec produits
ALTER TABLE produits ADD COLUMN IF NOT EXISTS categorie_id UUID REFERENCES categories(id);

-- 3. RLS sur categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation categories" ON categories;
CREATE POLICY "Tenant isolation categories" ON categories 
  FOR ALL TO authenticated 
  USING (tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid()));

-- 4. Fonction RPC get_user_email_by_identifier
-- Permet de retrouver l'email d'un utilisateur par son ID (utile pour certaines requêtes)
CREATE OR REPLACE FUNCTION get_user_email_by_identifier(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
