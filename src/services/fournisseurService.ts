import { insforge } from '../lib/insforge';
import { Fournisseur } from '../types';
import { addDepense } from './financialService';

export const getFournisseurs = async (tenantId: string): Promise<Fournisseur[]> => {
  const { data, error } = await insforge.database
    .from('fournisseurs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nom', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const createFournisseur = async (tenantId: string, fournisseur: Omit<Fournisseur, 'id' | 'tenant_id'>): Promise<string> => {
  const { data, error } = await insforge.database
    .from('fournisseurs')
    .insert([{ 
      ...fournisseur, 
      tenant_id: tenantId,
      solde_dette: 0
    }])
    .select();
  
  if (error) throw error;
  return data?.[0]?.id;
};

export const updateFournisseur = async (tenantId: string, id: string, data: Partial<Fournisseur>): Promise<void> => {
  const { error } = await insforge.database
    .from('fournisseurs')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};

export const deleteFournisseur = async (tenantId: string, id: string): Promise<void> => {
  const { error } = await insforge.database
    .from('fournisseurs')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};

export const payDebt = async (tenantId: string, id: string, amount: number): Promise<void> => {
  // 1. Fetch current debt
  const { data: f } = await insforge.database
    .from('fournisseurs')
    .select('solde_dette')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (!f) throw new Error("Fournisseur introuvable");

  const newDebt = Number(f.solde_dette || 0) - amount;

  // 2. Update debt
  await insforge.database
    .from('fournisseurs')
    .update({ solde_dette: newDebt })
    .eq('id', id)
    .eq('tenant_id', tenantId);

  // 3. Create expense
  await addDepense(tenantId, {
    date: new Date().toISOString(),
    categorie: 'Règlement Fournisseur',
    montant: amount,
    description: `Paiement dette fournisseur (ID: \${id.substring(0,8)})`,
    mode_paiement: 'Cash'
  });
};
