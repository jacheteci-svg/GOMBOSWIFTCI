import { Commande, LigneCommande } from '../types';
import { insforge } from '../lib/insforge';
import { getErrorMessage } from '../lib/errorUtils';
import { addMouvementStock } from './produitService';

export const getCommandeWithLines = async (tenantId: string, id: string): Promise<Commande & { lignes: LigneCommande[] }> => {
  const { data: cmd, error: cmdError } = await insforge.database
    .from('commandes')
    .select('*, clients(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (cmdError) throw cmdError;

  const { data: lines, error: linesError } = await insforge.database
    .from('lignes_commandes')
    .select('*')
    .eq('commande_id', id);

  if (linesError) throw linesError;

  return {
    ...cmd,
    nom_client: cmd.clients?.nom_complet ?? (cmd as { client_nom?: string }).client_nom,
    telephone_client: cmd.clients?.telephone ?? (cmd as { client_telephone?: string }).client_telephone,
    lignes: lines || []
  };
};

export const getCommandes = async (tenantId: string): Promise<Commande[]> => {
  const { data, error } = await insforge.database
    .from('commandes')
    .select('*, clients(*)')
    .eq('tenant_id', tenantId)
    .order('date_creation', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map((c: any) => ({
    ...c,
    nom_client: c.clients?.nom_complet ?? c.client_nom,
    telephone_client: c.clients?.telephone ?? c.client_telephone
  }));
};

export const subscribeToCommandes = (tenantId: string, callback: (commandes: Commande[]) => void) => {
  const fetchAndCallback = () => getCommandes(tenantId).then(callback).catch(e => {
    console.error("Error in subscribeToCommandes:", e);
    callback([]); 
  });
  fetchAndCallback();
  const interval = setInterval(fetchAndCallback, 3000);
  return () => clearInterval(interval);
};

export const getCommandesByStatus = async (tenantId: string, statusList: string[]): Promise<(Commande & { lignes: LigneCommande[] })[]> => {
  const { data: orders, error: orderError } = await insforge.database
    .from('commandes')
    .select('*, clients(nom_complet, telephone)')
    .eq('tenant_id', tenantId)
    .in('statut_commande', statusList)
    .order('date_creation', { ascending: false });

  if (orderError) throw orderError;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);

  // Fetch only lines for the retrieved orders and for this tenant
  const { data: lines, error: linesError } = await insforge.database
    .from('lignes_commandes')
    .select('*')
    .in('commande_id', orderIds)
    .eq('tenant_id', tenantId);

  if (linesError) throw linesError;
  
  return orders.map((o: any) => ({
    ...o,
    nom_client: o.clients?.nom_complet ?? o.client_nom,
    telephone_client: o.clients?.telephone ?? o.client_telephone,
    lignes: (lines || []).filter((l: any) => l.commande_id === o.id)
  }));
};

export const subscribeToCommandesByStatus = (tenantId: string, statusList: string[], callback: (commandes: Commande[]) => void) => {
  const fetchAndCallback = () => getCommandesByStatus(tenantId, statusList).then(callback);
  fetchAndCallback();
  const interval = setInterval(fetchAndCallback, 3000);
  return () => clearInterval(interval);
};

function generateCommandeReference(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `CMD-${crypto.randomUUID()}`;
  }
  return `CMD-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Colonnes d’insertion commandes : liste explicite (évite clés fantômes / mismatch schéma PostgREST).
 * reference : obligatoire sur certaines BDD (NOT NULL) — toujours renseignée à la création.
 * agent_appel_id : volontairement omis (traçabilité dans notes_client si besoin).
 */
function buildInsertCommandePayload(tenantId: string, commande: Omit<Commande, 'id'>): Record<string, unknown> {
  const dateCreation =
    commande.date_creation instanceof Date
      ? commande.date_creation
      : new Date();
  const reference =
    commande.reference?.trim() || generateCommandeReference();
  const clientNom =
    (commande as { client_nom?: string }).client_nom?.trim() ||
    commande.nom_client?.trim() ||
    'Client';
  const clientTelephone =
    (commande as { client_telephone?: string }).client_telephone?.trim() ||
    commande.telephone_client?.trim() ||
    '';
  return {
    tenant_id: tenantId,
    client_id: commande.client_id,
    client_nom: clientNom,
    client_telephone: clientTelephone,
    reference,
    statut_commande: 'en_attente_appel',
    date_creation: dateCreation.toISOString(),
    montant_total: commande.montant_total,
    frais_livraison: commande.frais_livraison ?? 0,
    source_commande: commande.source_commande,
    mode_paiement: commande.mode_paiement,
    commune_livraison: commande.commune_livraison ?? '',
    adresse_livraison: commande.adresse_livraison ?? '',
    notes_client: commande.notes_client ?? '',
  };
}

export const createCommandeBase = async (tenantId: string, commande: Omit<Commande, 'id'>, lignes: Omit<LigneCommande, 'id' | 'commande_id'>[]): Promise<string> => {
  if (!commande.client_id || String(commande.client_id).trim() === '') {
    throw new Error('Client obligatoire : identifiant client manquant.');
  }
  const nomOk =
    (commande as { client_nom?: string }).client_nom?.trim() ||
    commande.nom_client?.trim();
  if (!nomOk) {
    throw new Error('Nom du client obligatoire pour enregistrer la commande.');
  }
  const telOk =
    (commande as { client_telephone?: string }).client_telephone?.trim() ||
    commande.telephone_client?.trim();
  if (!telOk) {
    throw new Error('Téléphone client obligatoire pour enregistrer la commande.');
  }

  const payload = buildInsertCommandePayload(tenantId, {
    ...commande,
    date_creation: new Date() as any,
    statut_commande: 'en_attente_appel',
    tenant_id: tenantId,
  });

  const { data: cmdData, error: cmdError } = await insforge.database
    .from('commandes')
    .insert([payload as any])
    .select();

  if (cmdError) {
    console.error("Erreur création commande:", cmdError);
    throw new Error(`Erreur insertion commande: ${getErrorMessage(cmdError)}`);
  }
  
  const id = cmdData?.[0]?.id;
  if (!id) throw new Error("ID de commande non généré par la base de données.");

  // Fetch all products involved once to get purchase prices
  const productIds = Array.from(new Set(lignes.map(l => l.produit_id)));
  const { data: productsData } = await insforge.database
    .from('produits')
    .select('id, prix_achat')
    .in('id', productIds)
    .eq('tenant_id', tenantId);

  const priceMap = new Map((productsData || []).map(p => [p.id, p.prix_achat || 0]));

  const lignePayloads = lignes.map(l => ({
    commande_id: id,
    produit_id: l.produit_id,
    nom_produit: l.nom_produit ?? '',
    quantite: Number(l.quantite) || 0,
    prix_unitaire: Number(l.prix_unitaire) || 0,
    montant_ligne: Number(l.montant_ligne) || 0,
    prix_achat_unitaire: priceMap.get(l.produit_id) || 0,
    tenant_id: tenantId,
  }));

  const { error: lineError } = await insforge.database.from('lignes_commandes').insert(lignePayloads);
  
  if (lineError) {
    console.error("Erreur lignes commande:", lineError);
    throw new Error(`Erreur insertion lignes: ${getErrorMessage(lineError)}`);
  }

  // Stock movements
  for (const l of lignes) {
    try {
      await addMouvementStock(tenantId, {
        produit_id: l.produit_id,
        type_mouvement: 'sortie',
        quantite: l.quantite,
        reference: `Sortie Cmd #${id.substring(0, 8)}`
      } as any);
    } catch (stkErr) {
      console.warn("Erreur mise à jour stock (non bloquant):", stkErr);
    }
  }
  return id;
};

export type LigneCommandeCentreAppelInput = {
  produit_id: string;
  nom_produit: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
};

/**
 * Remplace les lignes d’une commande depuis le centre d’appel : ajuste le stock (delta par produit),
 * puis supprime et réinsère les lignes. Le total articles retourné sert à recalculer `montant_total`.
 */
export const replaceCommandeLignesCentreAppel = async (
  tenantId: string,
  commandeId: string,
  lignes: LigneCommandeCentreAppelInput[]
): Promise<{ subtotal: number }> => {
  if (!lignes.length) {
    throw new Error('Au moins une ligne produit est requise.');
  }
  for (const l of lignes) {
    if (!l.produit_id?.trim()) {
      throw new Error('Chaque ligne doit avoir un produit sélectionné.');
    }
    if (!Number(l.quantite) || Number(l.quantite) < 1) {
      throw new Error('Chaque ligne doit avoir une quantité d’au moins 1.');
    }
  }

  const { data: oldLines, error: oldErr } = await insforge.database
    .from('lignes_commandes')
    .select('*')
    .eq('commande_id', commandeId)
    .eq('tenant_id', tenantId);

  if (oldErr) throw new Error(getErrorMessage(oldErr));

  const sumByProduct = (rows: { produit_id: string; quantite: number }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const pid = r.produit_id;
      const q = Number(r.quantite) || 0;
      m.set(pid, (m.get(pid) || 0) + q);
    }
    return m;
  };

  const oldMap = sumByProduct(oldLines || []);
  const newMap = sumByProduct(lignes);

  const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);
  for (const pid of allIds) {
    const oldQ = oldMap.get(pid) || 0;
    const newQ = newMap.get(pid) || 0;
    const delta = newQ - oldQ;
    if (delta === 0) continue;
    if (delta > 0) {
      await addMouvementStock(tenantId, {
        produit_id: pid,
        type_mouvement: 'sortie',
        quantite: delta,
        reference: `Ajustement appel Cmd #${commandeId.slice(0, 8)}`,
      } as any);
    } else {
      await addMouvementStock(tenantId, {
        produit_id: pid,
        type_mouvement: 'entree',
        quantite: -delta,
        reference: `Ajustement appel Cmd #${commandeId.slice(0, 8)}`,
      } as any);
    }
  }

  const { error: delErr } = await insforge.database
    .from('lignes_commandes')
    .delete()
    .eq('commande_id', commandeId)
    .eq('tenant_id', tenantId);

  if (delErr) throw new Error(getErrorMessage(delErr));

  const subtotal = lignes.reduce((acc, l) => acc + Number(l.montant_ligne || 0), 0);

  // Fetch all involved products once
  const productIds = Array.from(new Set(lignes.map(l => l.produit_id)));
  const { data: productsData } = await insforge.database
    .from('produits')
    .select('id, prix_achat')
    .in('id', productIds)
    .eq('tenant_id', tenantId);

  const priceMap = new Map((productsData || []).map(p => [p.id, p.prix_achat || 0]));

  const insPayloads = lignes.map(l => ({
    commande_id: commandeId,
    produit_id: l.produit_id,
    nom_produit: l.nom_produit,
    quantite: Number(l.quantite),
    prix_unitaire: Number(l.prix_unitaire),
    montant_ligne: Number(l.montant_ligne),
    prix_achat_unitaire: priceMap.get(l.produit_id) || 0,
    tenant_id: tenantId,
  }));

  const { error: insErr } = await insforge.database.from('lignes_commandes').insert(insPayloads);
  if (insErr) throw new Error(getErrorMessage(insErr));

  return { subtotal };
};

export const updateCommandeStatus = async (tenantId: string, id: string, status: string, additionalData: any = {}): Promise<void> => {
  // 1. Fetch current status and lines
  const { data: currentCmd } = await insforge.database
    .from('commandes')
    .select('statut_commande')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (!currentCmd) throw new Error("Commande introuvable");
  const prevStatus = currentCmd.statut_commande;
  const nextStatus = status;

  const resetRouteSheets = ['validee', 'a_rappeler', 'en_attente_appel'];
  const updatePayload: any = { 
    statut_commande: nextStatus, 
    ...additionalData, 
    updated_at: new Date() 
  };

  if (resetRouteSheets.includes(nextStatus?.toLowerCase())) {
    updatePayload.feuille_route_id = null;
    updatePayload.livreur_id = null; // Also clear livreur if it's being re-queued
  }

  // 2. Update status in DB
  const { error } = await insforge.database
    .from('commandes')
    .update(updatePayload)
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;

  // 3. Stock management state machine
  const activeStates = ['en_attente_appel', 'validee', 'en_cours_livraison', 'livree', 'terminee'];

  const wasActive = activeStates.includes(prevStatus?.toLowerCase());
  const isNowActive = activeStates.includes(nextStatus?.toLowerCase());

  // If transition changes active status, move stock
  if (wasActive !== isNowActive) {
    try {
      const { data: lines } = await insforge.database
        .from('lignes_commandes')
        .select('*')
        .eq('commande_id', id)
        .eq('tenant_id', tenantId);

      if (lines && lines.length > 0) {
        for (const l of lines) {
          await addMouvementStock(tenantId, {
            produit_id: l.produit_id,
            type_mouvement: isNowActive ? 'sortie' : 'entree',
            quantite: l.quantite,
            reference: `${isNowActive ? 'Sortie' : 'Retour'} Stock (${nextStatus}) Cmd #${id.substring(0, 8)}`
          } as any);
        }
      }
    } catch (stockErr) {
      console.error("Erreur Stock Flow:", stockErr);
    }
  }
};

export const bulkUpdateCommandeStatus = async (tenantId: string, ids: string[], status: string, additionalData: any = {}): Promise<void> => {
  for (const id of ids) {
    try {
      await updateCommandeStatus(tenantId, id, status, additionalData);
    } catch (e) {
      console.error(`Error updating order ${id}:`, e);
    }
  }
};

export const getTopSellingProducts = async (tenantId: string, limit = 10, days?: number, start?: string, end?: string): Promise<any[]> => {
  let query = insforge.database
    .from('lignes_commandes')
    .select('*, commandes!inner(statut_commande, date_creation, tenant_id)')
    .eq('commandes.tenant_id', tenantId);

  if (days && days > 0) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const iso = startDate.toISOString();
    // Simplified logic: filter only on creation date for now to eliminate parsing issues with joined table columns in or()
    query = query.gte('commandes.date_creation', iso);
  } else if (start && end) {
    query = query.gte('commandes.date_creation', start).lte('commandes.date_creation', end);
  }

  const { data: lines, error: linesError } = await query;
  
  if (linesError) throw linesError;
  
  const aggregates: Record<string, { nb: number, ca: number, sorties: number, livrees: number, echecs: number, name: string }> = {};
  
  (lines || []).forEach((l: any) => {
    const key = l.nom_produit.trim().toUpperCase();
    
    if (!aggregates[key]) {
      aggregates[key] = { nb: 0, ca: 0, sorties: 0, livrees: 0, echecs: 0, name: l.nom_produit };
    }
    
    // Support both object and array return from PostgREST join
    const cmd = Array.isArray(l.commandes) ? l.commandes[0] : l.commandes;
    if (!cmd) return;

    const status = cmd.statut_commande?.toLowerCase();
    
    const isSortie = ['en_cours_livraison', 'livree', 'terminee', 'echouee', 'retour_stock', 'retour_livreur'].includes(status);
    const isLivree = ['livree', 'terminee'].includes(status);
    const isEchec = ['echouee', 'retour_stock', 'retour_livreur'].includes(status);
    
    if (isLivree) {
      aggregates[key].nb += Number(l.quantite || 0);
      aggregates[key].ca += Number(l.montant_ligne || 0);
      aggregates[key].livrees += Number(l.quantite || 0);
    }
    
    if (isEchec) {
      aggregates[key].echecs += Number(l.quantite || 0);
    }
    
    if (isSortie) {
      aggregates[key].sorties += Number(l.quantite || 0);
    }
  });

  return Object.values(aggregates)
    .map(stats => {
      const finishedAttempts = stats.livrees + stats.echecs;
      return { 
        nom: stats.name, 
        nb_ventes: stats.livrees, 
        total_ca: stats.ca,
        total_sorties: stats.sorties,
        taux_succes: finishedAttempts > 0 ? Math.round((stats.livrees / finishedAttempts) * 100) : 0
      };
    })
    .sort((a, b) => b.nb_ventes - a.nb_ventes)
    .slice(0, limit);
};

export const deleteCommande = async (tenantId: string, id: string): Promise<void> => {
  const { error } = await insforge.database
    .from('commandes')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};

export const getFinancialData = async (tenantId: string, startDate?: string, endDate?: string): Promise<(Commande & { lignes: LigneCommande[] })[]> => {
  // Correct grouping: (date_livraison_effective IN range) OR (updated_at IN range)
  const filterString = `and(date_livraison_effective.gte.${startDate},date_livraison_effective.lte.${endDate}),and(updated_at.gte.${startDate},updated_at.lte.${endDate})`;
  
  let query = insforge.database
    .from('commandes')
    .select('*, clients(nom_complet, telephone)')
    .eq('tenant_id', tenantId)
    .in('statut_commande', ['livree', 'terminee', 'LIVREE', 'TERMINEE'])
    .or(filterString);

  const { data: orders, error: orderError } = await query.order('updated_at', { ascending: false });

  if (orderError) throw orderError;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);
  
  // Optimized: only fetch lines for these orders
  const { data: lines, error: linesError } = await insforge.database
    .from('lignes_commandes')
    .select('*')
    .in('commande_id', orderIds);

  if (linesError) throw linesError;

  return orders.map((o: any) => ({
    ...o,
    nom_client: o.clients?.nom_complet ?? o.client_nom,
    telephone_client: o.clients?.telephone ?? o.client_telephone,
    lignes: (lines || []).filter((l: any) => l.commande_id === o.id)
  }));
};
