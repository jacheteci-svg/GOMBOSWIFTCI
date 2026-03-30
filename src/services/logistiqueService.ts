import { Commande, User } from '../types';
import { insforge } from '../lib/insforge';

export const getAvailableLivreurs = async (tenantId: string): Promise<User[]> => {
  const { data, error } = await insforge.database
    .from('users')
    .select('*')
    .eq('role', 'LIVREUR')
    .eq('actif', true)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
  return data || [];
};

export const creerFeuilleRoute = async (livreurId: string, commandeIds: string[], tenantId: string): Promise<string> => {
  // 1. Fetch commands to verify they exist and get totals
  const { data: cmdData, error: cmdFetchError } = await insforge.database
    .from('commandes')
    .select('*, clients(nom_complet, telephone)')
    .in('id', commandeIds)
    .eq('tenant_id', tenantId);

  if (cmdFetchError) throw new Error(`Erreur lors de la récupération des commandes : ${cmdFetchError.message}`);
  if (!cmdData || cmdData.length === 0) throw new Error("Aucune commande valide trouvée pour cette feuille de route.");
  
  const mappedCmds = cmdData.map((c: any) => ({
    ...c,
    nom_client: c.clients?.nom_complet,
    telephone_client: c.clients?.telephone
  }));
  
  const total_montant = mappedCmds.reduce((acc, c) => acc + (Number(c.montant_total) || 0), 0);
  const communes = Array.from(new Set(mappedCmds.map(c => c.commune_livraison).filter(Boolean)));

  // 2. Insert the delivery sheet
  const { data: frData, error: frError } = await insforge.database
    .from('feuilles_route')
    .insert([{
      date: new Date().toISOString(),
      livreur_id: livreurId,
      statut_feuille: 'en_cours',
      communes_couvertes: communes,
      total_commandes: cmdData.length,
      total_montant_theorique: total_montant,
      tenant_id: tenantId
    }])
    .select();

  if (frError) throw new Error(`Erreur lors de la création de la feuille de route : ${frError.message}`);
  
  const feuilleId = frData?.[0]?.id;
  if (!feuilleId) throw new Error("Échec de la récupération de l'ID de la nouvelle feuille de route.");

  // 3. Batch update all orders in one request (Atomic and efficient)
  const { error: batchUpdateError } = await insforge.database
    .from('commandes')
    .update({ 
      statut_commande: 'en_cours_livraison', 
      livreur_id: livreurId, 
      feuille_route_id: feuilleId 
    })
    .in('id', commandeIds)
    .eq('tenant_id', tenantId);
  
  if (batchUpdateError) throw new Error(`Erreur lors de l'affectation des commandes : ${batchUpdateError.message}`);

  return feuilleId;
};

export const getFeuillesRoute = async (tenantId: string) => {
  const { data, error } = await insforge.database
    .from('feuilles_route')
    .select('*, users(*)')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getCommandesByFeuille = async (tenantId: string, feuilleId: string): Promise<Commande[]> => {
  const { data: orders, error: orderError } = await insforge.database
    .from('commandes')
    .select('*, clients(nom_complet, telephone)')
    .eq('feuille_route_id', feuilleId)
    .eq('tenant_id', tenantId);

  if (orderError) throw orderError;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);
  
  // Fetch associated lines
  const { data: lines, error: linesError } = await insforge.database
    .from('lignes_commandes')
    .select('*')
    .in('commande_id', orderIds)
    .eq('tenant_id', tenantId);

  if (linesError) throw linesError;

  return orders.map((o: any) => ({
    ...o,
    nom_client: o.clients?.nom_complet,
    telephone_client: o.clients?.telephone,
    lignes: (lines || []).filter((l: any) => l.commande_id === o.id)
  }));
};

export const getCommandeByReference = async (tenantId: string, id: string): Promise<Commande | null> => {
  const { data, error } = await insforge.database
    .from('commandes')
    .select('*, clients(nom_complet, telephone)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) return null;
  
  return {
    ...data,
    nom_client: data.clients?.nom_complet,
    telephone_client: data.clients?.telephone
  };
};

export const supprimerFeuilleRoute = async (tenantId: string, feuilleId: string): Promise<void> => {
  // 1. Reset orders that were still 'en_cours_livraison' back to 'validee'
  await insforge.database
    .from('commandes')
    .update({ 
      statut_commande: 'validee', 
      livreur_id: null, 
      feuille_route_id: null 
    })
    .eq('feuille_route_id', feuilleId)
    .eq('statut_commande', 'en_cours_livraison')
    .eq('tenant_id', tenantId);

  // 2. Clear feuille_route_id for any other orders
  await insforge.database
    .from('commandes')
    .update({ 
      feuille_route_id: null 
    })
    .eq('feuille_route_id', feuilleId)
    .eq('tenant_id', tenantId);

  // 3. Delete the sheet
  const { error } = await insforge.database
    .from('feuilles_route')
    .delete()
    .eq('id', feuilleId)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};
