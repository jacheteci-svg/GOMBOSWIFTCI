import { Produit, MouvementStock } from '../types';
import { insforge } from '../lib/insforge';

export const getProduits = async (tenantId: string): Promise<Produit[]> => {
  const { data, error } = await insforge.database
    .from('produits')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nom', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const subscribeToProduits = (tenantId: string, callback: (produits: Produit[]) => void) => {
  const fetchAndCallback = () => getProduits(tenantId).then(callback).catch(e => {
    console.error("Error in subscribeToProduits:", e);
    callback([]); 
  });
  fetchAndCallback();
  const interval = setInterval(fetchAndCallback, 3000);
  return () => clearInterval(interval);
};

export const createProduit = async (tenantId: string, produit: Omit<Produit, 'id'>): Promise<string> => {
  const { data, error } = await insforge.database
    .from('produits')
    .insert([{ ...produit, tenant_id: tenantId }])
    .select();
  
  if (error) throw error;
  return data?.[0]?.id;
};

export const updateProduit = async (tenantId: string, id: string, data: Partial<Produit>): Promise<void> => {
  const { error } = await insforge.database
    .from('produits')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};

export const addMouvementStock = async (tenantId: string, mouvement: Omit<MouvementStock, 'id'>): Promise<void> => {
  mouvement.date = new Date().toISOString();
  
  // 1. Insert the movement record
  const { error: moveError } = await insforge.database
    .from('mouvements_stock')
    .insert([{ ...mouvement, tenant_id: tenantId }]);
  
  if (moveError) {
    console.error("Error inserting movement:", moveError);
    throw new Error("Impossible d'enregistrer le mouvement dans l'historique.");
  }

  // 2. Fetch current stock to calculate new value
  const { data: prod, error: fetchError } = await insforge.database
    .from('produits')
    .select('stock_actuel, nom')
    .eq('id', mouvement.produit_id)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !prod) {
    console.error("Error fetching product for stock update:", fetchError);
    throw new Error("Produit non trouvé pour la mise à jour du stock.");
  }

  // 3. Calculate and update
  const modifier = mouvement.type_mouvement === 'sortie' ? -mouvement.quantite : mouvement.quantite;
  const newStock = (prod.stock_actuel || 0) + modifier;

  // Prevent negative stock if it's a sortie
  if (newStock < 0 && mouvement.type_mouvement === 'sortie') {
     throw new Error(`Stock insuffisant pour ${prod.nom}. Stock actuel: ${prod.stock_actuel}`);
  }

  const { error: updateError } = await insforge.database
    .from('produits')
    .update({ stock_actuel: newStock })
    .eq('id', mouvement.produit_id)
    .eq('tenant_id', tenantId);

  if (updateError) {
    console.error("Error updating product stock:", updateError);
    throw new Error("Erreur lors de la mise à jour du niveau de stock final.");
  }
};

export const getHistoriqueStock = async (tenantId: string, produit_id: string): Promise<MouvementStock[]> => {
  const { data, error } = await insforge.database
    .from('mouvements_stock')
    .select('*')
    .eq('produit_id', produit_id)
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};
