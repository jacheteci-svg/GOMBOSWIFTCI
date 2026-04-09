-- SEED DATA FOR JACHETE CI TENANT
-- Tenant ID: ef16e4fe-a3d6-4b38-8cea-d618b002063a

-- 1. Communes d'Abidjan
INSERT INTO communes (tenant_id, nom, tarif_livraison) VALUES
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Cocody', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Marcory', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Koumassi', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Adjamé', 1000),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Plateau', 1000),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Attécoubé', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Port-Bouët', 2000),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Bingerville', 2500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Anyama', 3000)
ON CONFLICT DO NOTHING;

-- 2. Zones de Livraison correspondantes
INSERT INTO zones_livraison (tenant_id, nom, tarif) VALUES
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Cocody Angré', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Cocody Riviera', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Marcory Zone 4', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Marcory Résidentiel', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Koumassi Remblais', 1500),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Port-Bouët Centre', 2000),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Bingerville Centre', 2500)
ON CONFLICT DO NOTHING;

-- 3. Produits types
INSERT INTO produits (tenant_id, nom, description, prix_achat, prix_vente, stock_actuel, image_url) VALUES
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Smartphone Android X1', 'Écran 6.5 pouces, 128Go stockage', 75000, 95000, 50, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Écouteurs Bluetooth Pro', 'Réduction de bruit active, 24h autonomie', 12000, 18000, 100, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Montre Connectée Sport', 'Suivi cardiaque, GPS, étanche', 25000, 35000, 30, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'),
('ef16e4fe-a3d6-4b38-8cea-d618b002063a', 'Powerbank 20000mAh', 'Charge rapide, double port USB', 8000, 15000, 80, 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74')
ON CONFLICT DO NOTHING;
