import { Commande, User } from '../types';
import { insforge } from '../lib/insforge';

export const getAvailableLivreurs = async (): Promise<User[]> => {
  const { data, error } = await insforge.database
    .from('users')
    .select('*')
    .eq('role', 'LIVREUR')
    .eq('actif', true);
  
  if (error) throw error;
  return data || [];
};

export const creerFeuilleRoute = async (livreurId: string, commandeIds: string[]): Promise<string> => {
  const { data: cmdData, error: cmdFetchError } = await insforge.database
    .from('commandes')
    .select('*, clients(nom_complet, telephone)')
    .in('id', commandeIds);

  if (cmdFetchError) throw cmdFetchError;
  
  const mappedCmds = (cmdData || []).map((c: any) => ({
    ...c,
    nom_client: c.clients?.nom_complet,
    telephone_client: c.clients?.telephone
  }));
  
  const total_montant = mappedCmds.reduce((acc, c) => acc + (Number(c.montant_total) || 0), 0);
  const communes = Array.from(new Set(mappedCmds.map(c => c.commune_livraison)));

  const { data: frData, error: frError } = await insforge.database
    .from('feuilles_route')
    .insert([{
      date: new Date(),
      livreur_id: livreurId,
      statut_feuille: 'en_cours',
      communes_couvertes: communes,
      total_commandes: cmdData.length,
      total_montant_theorique: total_montant
    }])
    .select();

  if (frError) throw frError;
  const feuilleId = frData?.[0]?.id;

  for (const cid of commandeIds) {
    const { error } = await insforge.database
      .from('commandes')
      .update({ 
        statut_commande: 'en_cours_livraison', 
        livreur_id: livreurId, 
        feuille_route_id: feuilleId 
      })
      .eq('id', cid);
    
    if (error) throw error;
  }

  return feuilleId;
};

export const getFeuillesRoute = async () => {
  const { data, error } = await insforge.database
    .from('feuilles_route')
    .select('*, users(*)')
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getCommandesByFeuille = async (feuilleId: string): Promise<Commande[]> => {
  const { data, error } = await insforge.database
    .from('commandes')
    .select('*, clients(nom_complet, telephone)')
    .eq('feuille_route_id', feuilleId);

  if (error) throw error;
  
  return (data || []).map((c: any) => ({
    ...c,
    nom_client: c.clients?.nom_complet,
    telephone_client: c.clients?.telephone
  }));
};

export const supprimerFeuilleRoute = async (feuilleId: string): Promise<void> => {
  // 1. Reset orders that were still 'en_cours_livraison' back to 'validee'
  await insforge.database
    .from('commandes')
    .update({ 
      statut_commande: 'validee', 
      livreur_id: null, 
      feuille_route_id: null 
    })
    .eq('feuille_route_id', feuilleId)
    .eq('statut_commande', 'en_cours_livraison');

  // 2. Clear feuille_route_id for any other orders
  await insforge.database
    .from('commandes')
    .update({ 
      feuille_route_id: null 
    })
    .eq('feuille_route_id', feuilleId);

  // 3. Delete the sheet
  const { error } = await insforge.database
    .from('feuilles_route')
    .delete()
    .eq('id', feuilleId);

  if (error) throw error;
};
