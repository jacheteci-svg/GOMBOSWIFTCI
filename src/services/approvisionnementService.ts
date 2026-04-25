import { insforge } from '../lib/insforge';
import { Approvisionnement, LigneApprovisionnement } from '../types';
import { addMouvementStock } from './produitService';
import { addDepense } from './financialService';

export const getApprovisionnements = async (tenantId: string): Promise<Approvisionnement[]> => {
  const { data, error } = await insforge.database
    .from('approvisionnements')
    .select('*, fournisseur:fournisseurs(*)')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getApprovisionnementLignes = async (tenantId: string, approvisionnementId: string): Promise<LigneApprovisionnement[]> => {
  const { data, error } = await insforge.database
    .from('lignes_approvisionnements')
    .select('*, produit:produits(nom)')
    .eq('approvisionnement_id', approvisionnementId)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
  return (data || []).map(l => ({
    ...l,
    nom_produit: l.produit?.nom
  }));
};

export const createApprovisionnement = async (
  tenantId: string, 
  appro: Omit<Approvisionnement, 'id' | 'tenant_id' | 'lignes' | 'fournisseur'>,
  lignes: Omit<LigneApprovisionnement, 'id' | 'approvisionnement_id' | 'tenant_id'>[]
): Promise<string> => {
  // 1. Create Approvisionnement
  const { data, error } = await insforge.database
    .from('approvisionnements')
    .insert([{ ...appro, tenant_id: tenantId }])
    .select();
  
  if (error) throw error;
  const approId = data?.[0]?.id;

  // 2. Create Lignes
  const lignesWithMeta = lignes.map(l => ({
    ...l,
    approvisionnement_id: approId,
    tenant_id: tenantId
  }));

  const { error: lignesError } = await insforge.database
    .from('lignes_approvisionnements')
    .insert(lignesWithMeta);
  
  if (lignesError) throw lignesError;

  // 3. If statut is 'recu', trigger stock and accounting impact
  if (appro.statut === 'recu') {
    await applyApprovisionnementImpact(tenantId, approId, appro, lignesWithMeta as LigneApprovisionnement[]);
  }

  return approId;
};

export const updateApprovisionnementStatut = async (
  tenantId: string, 
  id: string, 
  newStatut: 'recu' | 'annule'
): Promise<void> => {
  // Get existing appro and its lines
  const { data: appro, error: approError } = await insforge.database
    .from('approvisionnements')
    .select('*, fournisseur:fournisseurs(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
  
  if (approError || !appro) throw new Error("Approvisionnement non trouvé");
  if (appro.statut === 'recu') throw new Error("Cet approvisionnement est déjà réceptionné.");

  const lignes = await getApprovisionnementLignes(tenantId, id);

  // Update statut
  const { error } = await insforge.database
    .from('approvisionnements')
    .update({ statut: newStatut })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;

  // Impact logic
  if (newStatut === 'recu') {
    await applyApprovisionnementImpact(tenantId, id, appro, lignes);
  }
};

const applyApprovisionnementImpact = async (
  tenantId: string, 
  approId: string, 
  appro: any, 
  lignes: LigneApprovisionnement[]
) => {
  // 1. Update Stock for each product
  for (const ligne of lignes) {
    await addMouvementStock(tenantId, {
      produit_id: ligne.produit_id,
      type_mouvement: 'entree',
      quantite: ligne.quantite,
      date: new Date().toISOString(),
      reference: `APPRO-${approId.substring(0, 8).toUpperCase()}`,
      commentaire: `Approvisionnement via fournisseur ${appro.fournisseur?.nom || 'Inconnu'}`
    });
  }

  // 2. Financial Impact
  const total = Number(appro.montant_total || 0);
  const paid = Number(appro.montant_paye ?? total); // Default to total if not specified
  const debt = total - paid;

  // A. Record the actual payment as an expense
  if (paid > 0) {
    await addDepense(tenantId, {
      date: new Date().toISOString(),
      categorie: 'Achat de stock',
      montant: paid,
      description: `Paiement appro #${approId.substring(0, 8).toUpperCase()} - ${appro.fournisseur?.nom || 'Fournisseur'}`,
      mode_paiement: appro.mode_paiement || 'Cash'
    });
  }

  // B. Record the debt if any and if supplier exists
  if (debt > 0 && appro.fournisseur_id) {
    const { data: f } = await insforge.database
      .from('fournisseurs')
      .select('solde_dette')
      .eq('id', appro.fournisseur_id)
      .eq('tenant_id', tenantId)
      .single();
    
    const currentDebt = Number(f?.solde_dette || 0);
    await insforge.database
      .from('fournisseurs')
      .update({ solde_dette: currentDebt + debt })
      .eq('id', appro.fournisseur_id)
      .eq('tenant_id', tenantId);
  }
};
