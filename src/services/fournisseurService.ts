import { insforge } from '../lib/insforge';
import { Fournisseur } from '../types';

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
    .insert([{ ...fournisseur, tenant_id: tenantId }])
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
