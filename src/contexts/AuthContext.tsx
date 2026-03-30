import { createContext, useContext, useEffect, useState } from 'react';
import { User, Role } from '../types';
import { useToast } from './ToastContext';
import { insforge } from '../lib/insforge';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
  hasPermission: (permissions: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  logout: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
});

export const useAuth = () => useContext(AuthContext);

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ['DASHBOARD', 'PRODUITS', 'COMMANDES', 'CENTRE_APPEL', 'LOGISTIQUE', 'LIVREUR', 'CAISSE', 'CLIENTS', 'HISTORIQUE', 'ADMIN', 'FINANCE', 'PROFIL', 'TRESORERIE', 'GESTION_LIVREURS'],
  GESTIONNAIRE: ['PRODUITS', 'COMMANDES', 'CLIENTS', 'PROFIL', 'COMMUNES', 'GESTION_LIVREURS', 'FINANCE'],
  AGENT_APPEL: ['COMMANDES', 'CENTRE_APPEL', 'CLIENTS', 'PROFIL'],
  AGENT_MIXTE: ['COMMANDES', 'CENTRE_APPEL', 'CLIENTS', 'CAISSE', 'FINANCE', 'PROFIL'],
  LOGISTIQUE: ['COMMANDES', 'LOGISTIQUE', 'PROFIL'],
  LIVREUR: ['LIVREUR', 'PROFIL'],
  CAISSIERE: ['CAISSE', 'FINANCE', 'PROFIL'],
  SUPER_ADMIN: ['DASHBOARD', 'PRODUITS', 'COMMANDES', 'CENTRE_APPEL', 'LOGISTIQUE', 'LIVREUR', 'CAISSE', 'CLIENTS', 'HISTORIQUE', 'ADMIN', 'FINANCE', 'PROFIL', 'SUPER_ADMIN', 'TRESORERIE', 'GESTION_LIVREURS']
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, email: string): Promise<User | null> => {
    try {
      /* Step 1: Try the SECURITY DEFINER RPC (bypasses RLS — works for SUPER_ADMIN) */
      const { data: rpcData, error: rpcError } = await insforge.database.rpc('get_own_profile');
      
      if (!rpcError && rpcData) {
        const profileData = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
        if (profileData?.id) {
          return {
            ...profileData,
            email: profileData.email || email,
            nom_complet: profileData.nom_complet || 'Administrateur',
            permissions: profileData.permissions?.length > 0
              ? profileData.permissions
              : (ROLE_PERMISSIONS[profileData.role as Role] || ROLE_PERMISSIONS['ADMIN'])
          } as User;
        }
      }

      /* Step 2: Fallback — direct table query */
      const { data, error } = await insforge.database
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        return {
          ...data,
          email: data.email || email,
          nom_complet: data.nom_complet || 'Utilisateur GomboSwiftCI',
          role: data.role || 'ADMIN',
          tenant_id: data.tenant_id ?? null,
          permissions: data.permissions?.length > 0
            ? data.permissions
            : (ROLE_PERMISSIONS[data.role as Role] || ROLE_PERMISSIONS['ADMIN'])
        } as User;
      }

      console.warn('Profile not found for user:', userId, error?.message);
      return null;
    } catch (err) {
      console.error('fetchUserProfile error:', err);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const { data, error: authError } = await insforge.auth.getCurrentUser();

        if (authError || !data?.user) {
          setCurrentUser(null);
          return;
        }

        const userId = data.user.id;
        const email = data.user.email || '';
        
        const profile = await fetchUserProfile(userId, email);

        if (profile) {
          setCurrentUser(profile);
        } else {
          /* Auth session valid but no profile found — only reject in non-dev */
          console.warn('No profile found for authenticated user. Clearing session.');
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('Auth initialization failed:', e);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const { error } = await insforge.auth.signOut();
    if (!error) {
      setCurrentUser(null);
      showToast('Déconnexion réussie.', 'success');
      window.location.href = isSuperAdmin ? '/platform/login' : '/login';
    } else {
      showToast('Erreur lors de la déconnexion.', 'error');
    }
  };

  const hasPermission = (perms: string | string[]) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') return true;

    // Safely check length using optional chaining and fallback to empty array
    const userPerms = (currentUser.permissions && currentUser.permissions.length > 0)
      ? currentUser.permissions
      : (ROLE_PERMISSIONS[currentUser.role] || []);

    const required = Array.isArray(perms) ? perms : [perms];
    return required.some(p => userPerms.includes(p));
  };

  const hasRole = (roles: Role[]) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') return true;
    return roles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, hasRole, hasPermission }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
