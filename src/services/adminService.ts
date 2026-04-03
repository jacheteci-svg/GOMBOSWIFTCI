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

export const createAdminUser = async (user: Omit<User, 'id'>, id?: string): Promise<User> => {
  const rowId = id || crypto.randomUUID();
  const { data, error } = await insforge.database
    .from('users')
    .insert([{ ...user, id: rowId }])
    .select()
    .single();

  if (error) throw error;
  return data as User;
};

/** Profil déjà présent (même id auth) : mise à jour ; sinon insertion. Toujours utiliser l’UUID auth réel. */
export const upsertAdminUserProfile = async (
  tenantId: string,
  authUserId: string,
  user: Omit<User, 'id' | 'password' | 'tenant_slug' | 'tenant_name' | 'tenant'>
): Promise<User> => {
  const emailNorm = user.email.trim().toLowerCase();

  const { data: existing, error: exErr } = await insforge.database
    .from('users')
    .select('id, tenant_id')
    .eq('id', authUserId)
    .maybeSingle();

  if (exErr) throw exErr;

  if (existing?.id) {
    if (existing.tenant_id && existing.tenant_id !== tenantId) {
      throw new Error('Ce compte est déjà rattaché à un autre espace client.');
    }
    const { data, error } = await insforge.database
      .from('users')
      .update({
        nom_complet: user.nom_complet,
        email: emailNorm,
        role: user.role,
        telephone: user.telephone,
        permissions: user.permissions ?? [],
        actif: user.actif ?? true,
        tenant_id: tenantId,
      })
      .eq('id', authUserId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  return createAdminUser(
    {
      ...user,
      email: emailNorm,
      tenant_id: tenantId,
    },
    authUserId
  );
};

/** Si l’inscription a créé le profil sans tenant_id visible, retrouver l’UUID par e-mail (même tenant ou sans tenant). */
export const tryResolveUserIdByEmail = async (
  tenantId: string,
  email: string
): Promise<string | null> => {
  const emailNorm = email.trim().toLowerCase();
  const { data, error } = await insforge.database
    .from('users')
    .select('id, tenant_id')
    .eq('email', emailNorm)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) return null;
  if (data.tenant_id && data.tenant_id !== tenantId) {
    throw new Error('Cet e-mail est déjà utilisé dans un autre espace client.');
  }
  return data.id;
};

export type FinalizeUserInviteRpcResult = {
  userId: string | null;
  /** True si la fonction Postgres n’est pas déployée (PostgREST / erreur « does not exist »). */
  rpcMissing: boolean;
  /** True si la RPC existe mais a renvoyé NULL (aucune ligne auth.users pour cet e-mail). */
  noAuthUserRow: boolean;
};

/**
 * RPC serveur : lit auth.users par e-mail et upsert public.users (voir rpc_admin_finalize_user_invite.sql).
 */
export const finalizeUserInviteViaRpc = async (
  tenantId: string,
  payload: {
    email: string;
    nom_complet: string;
    role: string;
    telephone: string;
    permissions: string[];
  }
): Promise<FinalizeUserInviteRpcResult> => {
  const empty = (flags: Partial<FinalizeUserInviteRpcResult>): FinalizeUserInviteRpcResult => ({
    userId: null,
    rpcMissing: false,
    noAuthUserRow: false,
    ...flags,
  });

  try {
    const { data, error } = await insforge.database.rpc('admin_finalize_user_invite', {
      p_email: payload.email.trim().toLowerCase(),
      p_tenant_id: tenantId,
      p_nom_complet: payload.nom_complet,
      p_role: payload.role,
      p_telephone: payload.telephone || '',
      p_permissions: payload.permissions ?? [],
    });

    if (error) {
      const msg = (error as { message?: string }).message || '';
      const code = (error as { code?: string }).code || '';
      if (
        code === '42883' ||
        msg.includes('does not exist') ||
        msg.includes('introuvable') ||
        msg.includes('Could not find') ||
        msg.includes('function public.admin_finalize_user_invite')
      ) {
        return empty({ rpcMissing: true });
      }
      throw error;
    }

    if (data === null || data === undefined) {
      return empty({ noAuthUserRow: true });
    }
    const userId = typeof data === 'string' ? data : String(data);
    return { userId, rpcMissing: false, noAuthUserRow: false };
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : '';
    if (msg.includes('does not exist') || msg.includes('42883')) {
      return empty({ rpcMissing: true });
    }
    throw e;
  }
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
