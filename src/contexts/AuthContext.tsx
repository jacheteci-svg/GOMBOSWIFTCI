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

// --- Role to Permission Mapping for Fallback ---
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ['DASHBOARD', 'PRODUITS', 'COMMANDES', 'CENTRE_APPEL', 'LOGISTIQUE', 'LIVREUR', 'CAISSE', 'CLIENTS', 'HISTORIQUE', 'ADMIN', 'FINANCE', 'PROFIL'],
  GESTIONNAIRE: ['PRODUITS', 'COMMANDES', 'CLIENTS', 'PROFIL', 'COMMUNES', 'GESTION_LIVREURS', 'FINANCE'],
  AGENT_APPEL: ['COMMANDES', 'CENTRE_APPEL', 'CLIENTS', 'PROFIL'],
  AGENT_MIXTE: ['COMMANDES', 'CENTRE_APPEL', 'CLIENTS', 'CAISSE', 'FINANCE', 'PROFIL'],
  LOGISTIQUE: ['COMMANDES', 'LOGISTIQUE', 'PROFIL'],
  LIVREUR: ['LIVREUR', 'PROFIL'],
  CAISSIERE: ['CAISSE', 'FINANCE', 'PROFIL'],
  SUPER_ADMIN: ['DASHBOARD', 'PRODUITS', 'COMMANDES', 'CENTRE_APPEL', 'LOGISTIQUE', 'LIVREUR', 'CAISSE', 'CLIENTS', 'HISTORIQUE', 'ADMIN', 'FINANCE', 'PROFIL', 'SUPER_ADMIN']
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, email: string) => {
    try {
      const { data, error } = await insforge.database
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('Profile not found in users table, using fallback:', error);
        return {
          id: userId,
          email,
          role: 'ADMIN',
          nom_complet: 'Admin (Recouvrement)',
          telephone: '',
          permissions: ROLE_PERMISSIONS['ADMIN'],
          actif: true,
          tenant_id: 'default'
        } as User;
      }

      // Final check: Ensure name and role are never null/empty to avoid blank UI
      const processedUser = {
        ...data,
        email: data.email || email,
        nom_complet: data.nom_complet || 'Utilisateur GomboSwiftCI',
        role: data.role || 'ADMIN', // Default to ADMIN if role is missing in DB
        tenant_id: data.tenant_id || 'default',
        permissions: data.permissions && data.permissions.length > 0 
          ? data.permissions 
          : (ROLE_PERMISSIONS[data.role as Role] || ROLE_PERMISSIONS['ADMIN'])
      } as User;

      console.log("Processed user profile:", processedUser);
      return processedUser;
    } catch (err) {
      console.error('Critical error in fetchUserData:', err);
      // Absolute fallback to prevent white screen/no access page
      return {
        id: userId,
        email,
        role: 'ADMIN',
        nom_complet: 'Admin (Secours)',
        telephone: '',
        permissions: ROLE_PERMISSIONS['ADMIN'],
        actif: true,
        tenant_id: 'default'
      } as User;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        console.log("Checking user session...");
        const { data, error: authError } = await insforge.auth.getCurrentUser();
        
        if (authError || !data?.user) {
          console.log("No valid user session found or auth error:", authError);
          setCurrentUser(null);
        } else {
          console.log("Found user session for:", data.user.id);
          const userData = await fetchUserData(data.user.id, data.user.email || '');
          
          // If profile fetch failed and returned a fallback but we suspect auth or config issue
          if (userData && userData.tenant_id === 'default') {
             // In production, we don't want phantom users if the database is unreachable
             if (window.location.hostname !== 'localhost') {
                console.warn("DB connection issue detected on production, resetting user.");
                setCurrentUser(null);
                return;
             }
          }
          setCurrentUser(userData);
        }
      } catch (e) {
        console.error("Auth initialization failed:", e);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    const { error } = await insforge.auth.signOut();
    if (!error) {
      setCurrentUser(null);
      showToast("Déconnexion réussie.", "success");
      window.location.href = '/login';
    } else {
      showToast("Erreur lors de la déconnexion.", "error");
    }
  };

  const hasPermission = (perms: string | string[]) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true; 

    const userPerms = currentUser.permissions && currentUser.permissions.length > 0
      ? currentUser.permissions
      : ROLE_PERMISSIONS[currentUser.role] || [];

    const required = Array.isArray(perms) ? perms : [perms];
    return required.some(p => userPerms.includes(p));
  };

  const hasRole = (roles: Role[]) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true; 
    return roles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, hasRole, hasPermission }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
