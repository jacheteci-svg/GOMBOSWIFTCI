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
  mouvement.date = new Date();
  
  const { error: moveError } = await insforge.database
    .from('mouvements_stock')
    .insert([{ ...mouvement, tenant_id: tenantId }]);
  
  if (moveError) throw moveError;

  // Update product stock
  const { data: prod, error: fetchError } = await insforge.database
    .from('produits')
    .select('stock_actuel')
    .eq('id', mouvement.produit_id)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError) throw fetchError;

  const modifier = mouvement.type_mouvement === 'sortie' ? -mouvement.quantite : mouvement.quantite;
  const newStock = (prod?.stock_actuel || 0) + modifier;

  await updateProduit(tenantId, mouvement.produit_id, { stock_actuel: newStock });
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
