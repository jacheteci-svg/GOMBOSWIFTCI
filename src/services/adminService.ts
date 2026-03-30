import { User, Commune } from '../types';
import { insforge } from '../lib/insforge';

// --- USERS MANAGEMENT ---

export const getAdminUsers = async (tenantId: string): Promise<User[]> => {
  const { data, error } = await insforge.database
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nom_complet', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const createAdminUser = async (user: Omit<User, 'id'>, id?: string): Promise<void> => {
  const { error } = await insforge.database
    .from('users')
    .insert([{ ...user, id: id || crypto.randomUUID() }]);
  
  if (error) throw error;
};

export const updateAdminUser = async (tenantId: string, id: string, data: Partial<User>): Promise<void> => {
  const { error } = await insforge.database
    .from('users')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};

export const deleteAdminUser = async (tenantId: string, id: string): Promise<void> => {
  const { error } = await insforge.database
    .from('users')
    .update({ actif: false }) // Soft delete
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};


// --- COMMUNES MANAGEMENT ---

export const getCommunes = async (tenantId?: string): Promise<Commune[]> => {
  let query = insforge.database
    .from('communes')
    .select('*');
  
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query.order('nom', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getCommuneByName = async (tenantId: string, nom: string): Promise<Commune | undefined> => {
  const { data, error } = await insforge.database
    .from('communes')
    .select('*')
    .ilike('nom', nom)
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
};

export const createCommune = async (commune: Omit<Commune, 'id'>): Promise<string> => {
  const { data, error } = await insforge.database
    .from('communes')
    .insert([commune])
    .select();

  if (error) throw error;
  return data?.[0]?.id;
};

export const updateCommune = async (tenantId: string, id: string, data: Partial<Commune>): Promise<void> => {
  const { error } = await insforge.database
    .from('communes')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};

export const deleteCommune = async (tenantId: string, id: string): Promise<void> => {
  const { error } = await insforge.database
    .from('communes')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
};
