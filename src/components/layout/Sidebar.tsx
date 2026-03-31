import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
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
  Lock,
  ChevronRight,
  Building
} from 'lucide-react';

interface NavItem {
  path?: string;
  label: string;
  icon: any;
  permission?: string;
  requiredModule?: string;
  children?: NavItem[];
}

interface NavSection {
  section: string;
  items: NavItem[];
}

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { currentUser, logout, hasPermission } = useAuth();
  const { hasModule } = useSaas();
  const { showToast } = useToast();
  const location = useLocation();
  const { tenantSlug } = useParams();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Ventes & Opérations']);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const effectiveSlug = tenantSlug || currentUser?.tenant_slug || 'nexus';

  const tenantNavSections: NavSection[] = [
    {
      section: 'Principal',
      items: [
        { path: `/${effectiveSlug}`, label: 'Tableau de Bord', icon: LayoutDashboard, permission: 'DASHBOARD' },
        { path: `/${effectiveSlug}/home`, label: 'Menu de Navigation', icon: HomeIcon, permission: 'PROFIL' },
      ]
    },
    {
      section: 'Ventes & Opérations',
      items: [
        {
          label: 'Gestion Commerciale',
          icon: ShoppingCart,
          children: [
            { path: `/${effectiveSlug}/produits`, label: 'Produits & Stock', icon: Package, permission: 'PRODUITS' },
            { path: `/${effectiveSlug}/commandes`, label: 'Commandes', icon: ShoppingCart, permission: 'COMMANDES' },
            { path: `/${effectiveSlug}/centre-appel`, label: 'Centre d\'Appel', icon: Headset, permission: 'CENTRE_APPEL' },
            { path: `/${effectiveSlug}/clients`, label: 'CRM & Clients', icon: Users, permission: 'CLIENTS', requiredModule: 'module_crm_clients' },
          ]
        }
      ]
    },
    {
      section: 'Logistique & Terrain',
      items: [
        {
          label: 'Suivi Terrain',
          icon: Truck,
          children: [
            { path: `/${effectiveSlug}/logistique`, label: 'Logistique', icon: Truck, permission: 'LOGISTIQUE', requiredModule: 'module_logistique_pro' },
            { path: `/${effectiveSlug}/performance-staff`, label: 'Performance Staff', icon: Activity, permission: 'GESTION_LIVREURS', requiredModule: 'module_staff_perf' },
            { path: `/${effectiveSlug}/livraison`, label: 'Mes Livraisons', icon: UserIcon, permission: 'LIVREUR', requiredModule: 'module_livraisons_app' },
          ]
        }
      ]
    },
    {
      section: 'Administration & Finance',
      items: [
        {
          label: 'Trésorerie & Audit',
          icon: Wallet,
          children: [
            { path: `/${effectiveSlug}/caisse`, label: 'Caisse / Retour', icon: Calculator, permission: 'CAISSE', requiredModule: 'module_caisse_retour_expert' },
            { path: `/${effectiveSlug}/rapport-financier`, label: 'Rapport Journalier', icon: TrendingUp, permission: 'FINANCE', requiredModule: 'module_rapport_journalier' },
            { path: `/${effectiveSlug}/net-profit`, label: 'Profit & Finances', icon: DollarSign, permission: 'ADMIN', requiredModule: 'module_profit_finances' },
            { path: `/${effectiveSlug}/admin/tresorerie`, label: 'Trésorerie Admin', icon: Wallet, permission: 'TRESORERIE', requiredModule: 'module_tresorerie_admin' },
            { path: `/${effectiveSlug}/audit-tresorerie`, label: 'Expertise Comptable', icon: ShieldCheck, permission: 'ADMIN', requiredModule: 'module_expertise_comptable' },
            { path: `/${effectiveSlug}/admin?tab=abonnement`, label: 'Abonnement & Forfait', icon: Crown, permission: 'ADMIN' },
          ]
        }
      ]
    },
    {
      section: 'Système',
      items: [
        { path: `/${effectiveSlug}/historique`, icon: History, label: 'Historique d\'Activité', permission: 'HISTORIQUE' },
        { path: `/${effectiveSlug}/admin`, icon: Settings, label: hasPermission('ADMIN') ? 'Administration' : 'Équipe & Zones', permission: 'COMMUNES' },
        { path: `/${effectiveSlug}/profil`, icon: UserIcon, label: 'Mon Profil', permission: 'PROFIL' },
      ]
    }
  ];

  const superAdminNavSections: NavSection[] = [
    {
      section: 'Nexus Management',
      items: [
        { path: '/super-admin/overview', icon: TrendingUp, label: 'Tableau de bord Global', permission: 'SUPER_ADMIN' },
        { path: '/super-admin/tenants', icon: Building, label: 'Gestion des Clients', permission: 'SUPER_ADMIN' },
        { path: '/super-admin/plans', icon: Crown, label: 'Catalogue Offres', permission: 'SUPER_ADMIN' },
      ]
    },
    {
      section: 'Opérations SaaS',
      items: [
        { path: '/super-admin/billing', icon: DollarSign, label: 'Finance & MRR', permission: 'SUPER_ADMIN' },
        { path: '/super-admin/broadcast', icon: Activity, label: 'Mission Control', permission: 'SUPER_ADMIN' },
        { path: '/super-admin/support', icon: Headset, label: 'Centre de Support', permission: 'SUPER_ADMIN' },
      ]
    },
    {
      section: 'Infrastructure',
      items: [
        { path: '/super-admin/settings', icon: ShieldCheck, label: 'Sécurité & Logs', permission: 'SUPER_ADMIN' },
        { path: '/super-admin/profile', icon: UserIcon, label: 'Profil Admin', permission: 'SUPER_ADMIN' },
      ]
    }
  ];

  const isPlatformView = location.pathname.startsWith('/super-admin');
  const sections = isPlatformView ? superAdminNavSections : tenantNavSections;

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  };

  const isItemActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const renderNavItem = (item: NavItem, isSubItem = false) => {
    if (item.permission && !hasPermission(item.permission)) return null;
    
    const isLocked = item.requiredModule ? !hasModule(item.requiredModule as any) : false;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.includes(item.label);
    const active = isItemActive(item.path);
    const Icon = item.icon;

    const handleClick = (e: React.MouseEvent) => {
      if (hasChildren) {
        e.preventDefault();
        toggleGroup(item.label);
      } else if (isLocked) {
        e.preventDefault();
        showToast("Ce module nécessite un abonnement supérieur.", "error");
      } else {
        onClose();
      }
    };

    if (hasChildren) {
      return (
        <div key={item.label} className={`nav-group ${isExpanded ? 'expanded' : ''}`}>
          <button className="nav-group-trigger" onClick={handleClick}>
            <span className="nav-icon"><Icon size={18} /></span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <ChevronRight size={14} className="chevron" />
          </button>
          <div className="nav-sub-menu">
            {item.children?.map(child => renderNavItem(child, true))}
          </div>
        </div>
      );
    }

    return (
      <li key={item.path || item.label}>
        <Link
          to={isLocked ? '#' : (item.path || '#')}
          onClick={handleClick}
          className={`${isSubItem ? 'nav-sub-item' : 'nav-item'} ${active && !isLocked ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
          style={{ opacity: isLocked ? 0.6 : 1 }}
        >
          <span className="nav-icon">
            <Icon size={isSubItem ? 16 : 18} strokeWidth={active && !isLocked ? 2.5 : 1.8} />
          </span>
          <span style={{ flex: 1 }}>{item.label}</span>
          {isLocked && <Lock size={14} color="#f59e0b" />}
        </Link>
      </li>
    );
  };

  const initials = currentUser?.nom_complet
    ? currentUser.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        
        <div className="brand-logo" style={{ borderBottom: '1px solid var(--glass-border)', padding: '1.75rem 1.5rem' }}>
          <div style={{ flexShrink: 0 }}>
            <img src="/favicon.png" alt="Logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 950, 
              color: 'white', 
              letterSpacing: '-0.03em',
              lineHeight: 1
            }}>
              GomboSwift
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Nexus Core
            </span>
          </div>
          <button 
            onClick={onClose}
            className="mobile-menu-btn"
            style={{ marginLeft: 'auto', border: 'none', background: 'transparent' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* --- SuperAdmin Quick Access --- */}
        {isSuperAdmin && !isPlatformView && (
          <div style={{ padding: '0.75rem 1.25rem' }}>
            <Link 
              to="/super-admin/overview" 
              className="btn btn-primary" 
              style={{ width: '100%', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 950, gap: '0.75rem', height: '50px', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', border: 'none', boxShadow: '0 8px 20px rgba(6, 182, 212, 0.3)' }}
            >
              <ShieldCheck size={18} /> MISSION NEXUS
            </Link>
          </div>
        )}

        <nav className="sidebar-nav custom-scroll">
          {sections.map((section) => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {section.items.map(item => renderNavItem(item))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-user-card" style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
          <div className="sidebar-user-info" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="sidebar-avatar" style={{ 
              width: 42, height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 850, color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.nom_complet}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
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
              borderColor: 'rgba(239,68,68,0.1)',
              background: 'rgba(239,68,68,0.02)',
              fontSize: '0.8rem',
              height: 40,
              minHeight: 40,
              borderRadius: '10px'
            }}
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};
