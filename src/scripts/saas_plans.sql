CREATE TABLE IF NOT EXISTS saas_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_fcfa INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT '/mois',
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT NOT NULL DEFAULT '#94a3b8',
  icon_name TEXT NOT NULL DEFAULT 'Zap',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  max_orders_month INTEGER,
  max_users INTEGER,
  module_caisse BOOLEAN NOT NULL DEFAULT false,
  module_audit BOOLEAN NOT NULL DEFAULT false,
  module_api BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_saas_plans" ON saas_plans;
CREATE POLICY "public_read_saas_plans" ON saas_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "superadmin_all_saas_plans" ON saas_plans;
CREATE POLICY "superadmin_all_saas_plans" ON saas_plans USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
CREATE POLICY "superadmin_all_saas_plans_insert" ON saas_plans FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
CREATE POLICY "superadmin_all_saas_plans_delete" ON saas_plans FOR DELETE USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Seed initial data if not exists
INSERT INTO saas_plans (id, name, price_fcfa, period, description, features, color, icon_name, is_popular, module_caisse, module_audit, module_api) VALUES 
('FREE', 'Essentiel', 0, '/mois', 'Parfait pour débuter votre activité logistique.', '["Jusqu''à 50 commandes / mois", "Gestion de stock basique", "1 Utilisateur", "Support par communauté"]'::jsonb, '#94a3b8', 'Zap', false, false, false, false),
('BASIC', 'Croissance', 15000, '/mois', 'Pour les boutiques en pleine expansion.', '["Commandes illimitées", "Gestion de stock avancée", "Jusqu''à 5 Utilisateurs", "Rapports journaliers", "Support Prioritaire"]'::jsonb, '#3b82f6', 'Rocket', true, true, false, false),
('PREMIUM', 'Professionnel', 45000, '/mois', 'La solution complète pour les pros de la logistique.', '["Mêmes avantages que Croissance", "Utilisateurs illimités", "Module Trésorerie & Audit", "Multi-entrepôts", "API & Intégrations", "Account Manager dédié"]'::jsonb, '#8b5cf6', 'Crown', false, true, true, true),
('CUSTOM', 'Sur Mesure', -1, '', 'Une version unique, personnalisée à 100%.', '["Code source dédié", "Serveur privé", "Identité exclusive", "VIP 24/7"]'::jsonb, '#0f172a', 'Settings', false, true, true, true)
ON CONFLICT (id) DO NOTHING;
