import { Commande, FeuilleRoute } from '../types';
import { insforge } from '../lib/insforge';
import { addMouvementStock } from './produitService';

export const getFeuillesEnCours = async (tenantId: string, livreurId: string): Promise<FeuilleRoute[]> => {
  const { data, error } = await insforge.database
    .from('feuilles_route')
    .select('*')
    .eq('livreur_id', livreurId)
    .eq('tenant_id', tenantId)
    .in('statut_feuille', ['en_cours', 'cloturee']);

  if (error) throw error;
  return data || [];
};

export const getCloturedFeuilles = async (tenantId: string): Promise<FeuilleRoute[]> => {
  const { data, error } = await insforge.database
    .from('feuilles_route')
    .select('*, livreurs:livreur_id(nom_complet)')
    .eq('tenant_id', tenantId)
    .eq('statut_feuille', 'terminee')
    .order('date', { ascending: false });

  if (error) throw error;
  
  // Transform to include nom_livreur directly
  return (data || []).map((f: any) => ({
    ...f,
    nom_livreur: f.livreurs?.nom_complet
  }));
};

export const getCommandesConcernees = async (tenantId: string, feuilleRouteId: string): Promise<Commande[]> => {
  const { data, error } = await insforge.database
    .from('commandes')
    .select('*')
    .eq('feuille_route_id', feuilleRouteId)
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return data || [];
};

export const processCaisse = async (
  feuilleRouteId: string, 
  resolutions: {id: string, statut: string, mode_paiement: string}[], 
  montantPhysique: number, 
  ecart: number, 
  commentaire: string,
  caissiereId: string,
  livreurId: string,
  tenantId: string
): Promise<void> => {
  // 1. Update Feuille Route status and summary financials
  const { error: frError } = await insforge.database
    .from('feuilles_route')
    .update({
      statut_feuille: 'terminee',
      date_traitement: new Date().toISOString(),
      montant_encaisse: montantPhysique,
      ecart_caisse: ecart
    })
    .eq('id', feuilleRouteId)
    .eq('tenant_id', tenantId);

  if (frError) throw frError;
  
  const orderIds = resolutions.map(r => r.id);
  const { data: lignesCommandes, error: linesError } = await insforge.database
    .from('lignes_commandes')
    .select('*')
    .in('commande_id', orderIds)
    .eq('tenant_id', tenantId);

  if (linesError) throw linesError;
  
  for (const res of resolutions) {
    let finalStatus = res.statut;
    if (res.statut === 'livree') finalStatus = 'terminee';
    if (res.statut === 'retour_livreur' || res.statut === 'echouee') finalStatus = 'retour_stock';
    
    const isDelivered = finalStatus === 'terminee' || finalStatus === 'livree';
    
    const updateData: any = { 
      statut_commande: finalStatus, 
      mode_paiement: res.mode_paiement, 
      updated_at: new Date() 
    };

    // If not delivered, clear the route sheet ID so it can be re-assigned in Logistics
    if (!isDelivered) {
      updateData.feuille_route_id = null;
    }
    
    // CRITICAL FIX: Ensure date_livraison_effective is set if the command is successful
    if (isDelivered) {
      updateData.date_livraison_effective = new Date().toISOString();
    }
    
    const { error: cmdUpdateError } = await insforge.database
      .from('commandes')
      .update(updateData)
      .eq('id', res.id)
      .eq('tenant_id', tenantId);

    if (cmdUpdateError) throw cmdUpdateError;

    if (finalStatus === 'retour_stock' || finalStatus === 'annulee') {
      const lignes = lignesCommandes.filter((l: any) => l.commande_id === res.id);
      for (const l of lignes) {
        await addMouvementStock(tenantId, {
          produit_id: l.produit_id,
          type_mouvement: 'entree',
          quantite: l.quantite,
          reference: `Retour Echec cmd #${res.id.slice(0,5)}`,
        } as any);
      }
    }
  }
  
  // 2. Log formal Caisse Retour
  const { error: retourError } = await insforge.database
    .from('caisse_retours')
    .insert([{ 
      date: new Date(), 
      feuille_route_id: feuilleRouteId, 
      livreur_id: livreurId,
      caissiere_id: caissiereId,
      montant_remis_par_livreur: montantPhysique, 
      montant_attendu: montantPhysique - ecart,
      ecart, 
      commentaire_caissiere: commentaire,
      tenant_id: tenantId
    }]);

  if (retourError) throw retourError;
};

export const reopenFeuilleRoute = async (tenantId: string, id: string): Promise<void> => {
  const { error } = await insforge.database
    .from('feuilles_route')
    .update({
      statut_feuille: 'en_cours',
      montant_encaisse: 0,
      ecart_caisse: 0,
      date_traitement: null
    })
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw error;
};

const COMMANDES_FINANCE_SELECT =
  'id, montant_total, statut_commande, mode_paiement, frais_livraison, updated_at, date_livraison_effective, lignes:lignes_commandes(*)';

/**
 * Fusionne deux listes de commandes par id (évite les doublons).
 * Les filtres `.or()` avec timestamps ISO dans une seule chaîne cassent souvent PostgREST
 * (caractères `:` et `.` dans la date) — d’où deux requêtes + fusion.
 */
function mergeCommandesById(
  a: Commande[] | null | undefined,
  b: Commande[] | null | undefined
): Commande[] {
  const map = new Map<string, Commande>();
  for (const c of a || []) {
    if (c?.id) map.set(c.id, c);
  }
  for (const c of b || []) {
    if (c?.id) map.set(c.id, c);
  }
  return Array.from(map.values());
}

export const getRangeFinancials = async (tenantId: string, startDateStr: string, endDateStr?: string): Promise<any> => {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
  end.setHours(23, 59, 59, 999);

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  // 1. Caisse retours sur la période
  const { data: retours, error: retoursError } = await insforge.database
    .from('caisse_retours')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('date', startIso)
    .lte('date', endIso);

  if (retoursError) throw retoursError;

  // 2. Commandes : livraison effective dans la période OU dernière mise à jour dans la période (deux requêtes, pas un .or() avec ISO brut)
  const { data: byLivraison, error: errLiv } = await insforge.database
    .from('commandes')
    .select(COMMANDES_FINANCE_SELECT)
    .eq('tenant_id', tenantId)
    .gte('date_livraison_effective', startIso)
    .lte('date_livraison_effective', endIso);

  if (errLiv) throw errLiv;

  const { data: byUpdated, error: errUpd } = await insforge.database
    .from('commandes')
    .select(COMMANDES_FINANCE_SELECT)
    .eq('tenant_id', tenantId)
    .gte('updated_at', startIso)
    .lte('updated_at', endIso);

  if (errUpd) throw errUpd;

  const commandes = mergeCommandesById(
    byLivraison as unknown as Commande[],
    byUpdated as unknown as Commande[]
  );

  return { retours: retours ?? [], commandes };
};
