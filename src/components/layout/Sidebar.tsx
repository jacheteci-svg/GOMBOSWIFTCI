import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSaas } from '../../saas/SaasProvider';
import { useToast } from '../../contexts/ToastContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Headset,
  Truck,
  Users,
  LogOut,
  Settings,
  Calculator,
  History,
  TrendingUp,
  Activity,
  DollarSign,
  Home as HomeIcon,
  User as UserIcon,
  Wallet,
  ShieldCheck,
  Crown,
  X,
  Lock
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { currentUser, logout, hasPermission } = useAuth();
  const { hasModule } = useSaas();
  const { showToast } = useToast();
  const location = useLocation();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const tenantNavItems = [
    { section: 'Principal' },
    { path: '/', label: 'Accueil', icon: HomeIcon, permission: 'PROFIL' },
    { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, permission: 'DASHBOARD' },
    
    { section: 'Opérations' },
    { path: '/produits', label: 'Produits & Stock', icon: Package, permission: 'PRODUITS' },
    { path: '/commandes', label: 'Commandes', icon: ShoppingCart, permission: 'COMMANDES' },
    { path: '/centre-appel', label: 'Centre d\'Appel', icon: Headset, permission: 'CENTRE_APPEL' },
    { path: '/clients', label: 'CRM & Clients', icon: Users, permission: 'CLIENTS' },
    
    { section: 'Terrain' },
    { path: '/logistique', label: 'Logistique', icon: Truck, permission: 'LOGISTIQUE' },
    { path: '/performance-staff', label: 'Performance', icon: Activity, permission: 'GESTION_LIVREURS' },
    { path: '/livraison', label: 'Mes Livraisons', icon: UserIcon, permission: 'LIVREUR' },
    
    { section: 'Finance' },
    { path: '/caisse', icon: Calculator, label: 'Caisse / Retour', permission: 'CAISSE', requiredModule: 'module_caisse' },
    { path: '/rapport-financier', icon: TrendingUp, label: 'Rapport Journalier', permission: 'FINANCE' },
    { path: '/net-profit', icon: DollarSign, label: 'Profit & Finances', permission: 'ADMIN' },
    { path: '/admin/tresorerie', icon: Wallet, label: 'Trésorerie Admin', permission: 'TRESORERIE' },
    { path: '/audit-tresorerie', icon: ShieldCheck, label: 'Expertise Comptable', permission: 'ADMIN', requiredModule: 'module_audit' },
    
    { section: 'Système' },
    { path: '/historique', icon: History, label: 'Historique', permission: 'HISTORIQUE' },
    { path: '/admin', icon: Settings, label: hasPermission('ADMIN') ? 'Administration' : 'Équipe & Zones', permission: 'COMMUNES' },
    { path: '/profil', icon: UserIcon, label: 'Mon Profil', permission: 'PROFIL' },
  ];

  const superAdminNavItems = [
    { section: 'Nexus Portal' },
    { path: '/super-admin/overview', icon: TrendingUp, label: 'Vue Globale', permission: 'SUPER_ADMIN' },
    { path: '/super-admin/tenants', icon: Package, label: 'Organisations', permission: 'SUPER_ADMIN' },
    { path: '/super-admin/plans', icon: Crown, label: 'Abonnements', permission: 'SUPER_ADMIN' },
    { path: '/super-admin/billing', icon: DollarSign, label: 'Facturation', permission: 'SUPER_ADMIN' },
    { path: '/super-admin/support', icon: Headset, label: 'Help Desk', permission: 'SUPER_ADMIN' },
    { path: '/super-admin/broadcast', icon: Activity, label: 'Broadcast', permission: 'SUPER_ADMIN' },
    { path: '/super-admin/settings', icon: ShieldCheck, label: 'Sécurité', permission: 'SUPER_ADMIN' },
  ];

  const navItems = isSuperAdmin ? superAdminNavItems : tenantNavItems;

  const filteredItems = navItems.filter(item => {
    if ('section' in item && !('path' in item)) return true;
    if ('permission' in item && item.permission) {
      if (item.permission === 'SUPER_ADMIN') return isSuperAdmin;
      if (isSuperAdmin) return false;
      return hasPermission(item.permission);
    }
    return true;
  });

  // Remove consecutive or trailing section headers
  const cleanedItems = filteredItems.filter((item, index) => {
    if (!('section' in item) || ('path' in item)) return true;
    const next = filteredItems[index + 1];
    if (!next || ('section' in next && !('path' in next))) return false;
    return true;
  });

  const initials = currentUser?.nom_complet
    ? currentUser.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        
        {/* Brand */}
        <div className="brand-logo">
          <div style={{ 
            background: 'var(--primary)', 
            width: 34, height: 34, 
            borderRadius: 10, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'white',
            flexShrink: 0
          }}>
            <Package size={18} />
          </div>
          <span style={{ 
            fontSize: '1.15rem', 
            fontWeight: 900, 
            color: 'var(--text-main)', 
            letterSpacing: '-0.03em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            GomboSwiftCI
          </span>
          {/* Close button on mobile */}
          <button 
            onClick={onClose}
            className="mobile-menu-btn"
            style={{ 
              marginLeft: 'auto', 
              width: 32, height: 32, 
              border: 'none', 
              background: 'rgba(0,0,0,0.04)', 
              borderRadius: 8,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav custom-scroll">
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {cleanedItems.map((item, index) => {
              if ('section' in item && !('path' in item)) {
                return (
                  <li key={`section-${index}`}>
                    <div className="nav-section-label">{(item as any).section}</div>
                  </li>
                );
              }
              
              const navItem = item as any;
              const isActive = location.pathname === navItem.path || 
                (navItem.path !== '/' && location.pathname.startsWith(navItem.path));
              const IconComponent = navItem.icon;
              const isLocked = navItem.requiredModule ? !hasModule(navItem.requiredModule as any) : false;
              
              const handleClick = (e: React.MouseEvent) => {
                if (isLocked) {
                  e.preventDefault();
                  showToast("Ce module nécessite un abonnement supérieur.", "error");
                } else {
                  onClose();
                }
              };
              
              return (
                <li key={navItem.path}>
                  <Link
                    to={isLocked ? '#' : navItem.path}
                    onClick={handleClick}
                    className={`nav-item ${isActive && !isLocked ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                    style={{ opacity: isLocked ? 0.6 : 1 }}
                  >
                    <span className="nav-icon">
                      <IconComponent size={18} strokeWidth={isActive && !isLocked ? 2.5 : 1.8} />
                    </span>
                    <span style={{ flex: 1 }}>{navItem.label}</span>
                    {isLocked && <Lock size={14} color="#f59e0b" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ 
                fontSize: '0.85rem', fontWeight: 700, 
                color: 'var(--text-main)', 
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentUser?.nom_complet}
              </p>
              <p style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-muted)', 
                fontWeight: 600, 
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {currentUser?.role}
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="btn btn-outline"
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              color: '#ef4444', 
              borderColor: 'rgba(239,68,68,0.15)',
              background: 'rgba(239,68,68,0.04)',
              fontSize: '0.82rem',
              minHeight: 38,
              gap: '0.4rem'
            }}
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};
