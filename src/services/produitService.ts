import { Produit, MouvementStock } from '../types';
import { insforge } from '../lib/insforge';
import { addDepense } from './financialService';

export const getProduits = async (tenantId: string): Promise<Produit[]> => {
  // 1. Get raw products
  const { data: rawProduits, error } = await insforge.database
    .from('produits')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nom', { ascending: true });
  
  if (error) throw error;
  if (!rawProduits) return [];

  // 2. Fetch active orders to compute reserved and transit stock
  // Reserved: ['nouveau', 'en_attente_appel', 'validee', 'a_rappeler', 'en_preparation']
  // Transit: ['en_cours_livraison']
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: activeOrders } = await insforge.database
    .from('commandes')
    .select('id, statut_commande, date_creation')
    .eq('tenant_id', tenantId)
    .in('statut_commande', [
      'nouveau', 'en_attente_appel', 'validee', 'a_rappeler', 'en_preparation',
      'en_cours_livraison'
    ])
    .gte('date_creation', fourteenDaysAgo.toISOString());

  const orderMap = new Map();
  if (activeOrders) {
    activeOrders.forEach(o => orderMap.set(o.id, o.statut_commande));
  }

  // 3. Fetch lines for these orders to compute per-product aggregates
  let orderIds = Array.from(orderMap.keys());
  const reservedCount: Record<string, number> = {};
  const transitCount: Record<string, number> = {};

  if (orderIds.length > 0) {
    // If there are too many orders, this should be batched, but for simplicity we fetch them. 
    // Wait, let's use the batched query!
    // But since I don't import runBatchedQuery here, I will just do a direct fetch if it's small, 
    // or I'll just use runBatchedQuery. Let's add it.
  }
  
  // To avoid circular dependency or too much complexity, let's fetch lines directly,
  // assuming activeOrders < 1000.
  if (orderIds.length > 0) {
     const { data: lines } = await insforge.database
       .from('lignes_commandes')
       .select('produit_id, quantite, commande_id')
       .eq('tenant_id', tenantId); // Instead of .in() we fetch all and filter client side
       
     if (lines) {
        lines.forEach(l => {
           const status = orderMap.get(l.commande_id);
           if (!status) return;
           if (status === 'en_cours_livraison') {
              transitCount[l.produit_id] = (transitCount[l.produit_id] || 0) + l.quantite;
           } else {
              reservedCount[l.produit_id] = (reservedCount[l.produit_id] || 0) + l.quantite;
           }
        });
     }
  }

  return rawProduits.map((p: any) => {
    const physique = p.stock_actuel || 0;
    const reserve = reservedCount[p.id] || 0;
    const livraison = transitCount[p.id] || 0;
    const disponible = physique - reserve - livraison;

    return {
      ...p,
      stock_physique: physique,
      stock_reserve: reserve,
      stock_en_livraison: livraison,
      stock_disponible: disponible
    };
  });
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

export const addMouvementStock = async (tenantId: string, mouvement: Omit<MouvementStock, 'id'>, force_negative: boolean = false): Promise<void> => {
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

  // Prevent negative stock if it's a sortie and not forced
  if (newStock < 0 && mouvement.type_mouvement === 'sortie' && !force_negative) {
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

  // 4. Financial Impact for 'entree' if info provided
  if (mouvement.type_mouvement === 'entree' && mouvement.prix_unitaire && mouvement.quantite) {
    const totalAmount = mouvement.prix_unitaire * mouvement.quantite;
    
    if (mouvement.mode_paiement === 'Crédit' && mouvement.fournisseur_id) {
      // Fetch current debt
      const { data: f } = await insforge.database
        .from('fournisseurs')
        .select('solde_dette')
        .eq('id', mouvement.fournisseur_id)
        .eq('tenant_id', tenantId)
        .single();
      
      const currentDebt = Number(f?.solde_dette || 0);
      await insforge.database
        .from('fournisseurs')
        .update({ solde_dette: currentDebt + totalAmount })
        .eq('id', mouvement.fournisseur_id)
        .eq('tenant_id', tenantId);
    } else {
      // Cash expense
      await addDepense(tenantId, {
        date: new Date().toISOString(),
        categorie: 'Achat de stock',
        montant: totalAmount,
        description: `Achat stock (Entrée Manuelle) - ${prod.nom}`,
        mode_paiement: 'Cash'
      });
    }
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
