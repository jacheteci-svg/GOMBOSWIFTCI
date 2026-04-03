-- Optionnel : lier la commande à l’utilisateur ayant passé l’appel / la saisie (PostgREST / schéma cache).
-- À exécuter une fois sur la base InsForge / Postgres du projet.

ALTER TABLE commandes ADD COLUMN IF NOT EXISTS agent_appel_id UUID REFERENCES users(id);
