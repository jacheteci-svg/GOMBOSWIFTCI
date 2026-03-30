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
            { path: `/${effectiveSlug}/clients`, label: 'CRM & Clients', icon: Users, permission: 'CLIENTS' },
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
            { path: `/${effectiveSlug}/logistique`, label: 'Logistique', icon: Truck, permission: 'LOGISTIQUE' },
            { path: `/${effectiveSlug}/performance-staff`, label: 'Performance Staff', icon: Activity, permission: 'GESTION_LIVREURS' },
            { path: `/${effectiveSlug}/livraison`, label: 'Mes Livraisons', icon: UserIcon, permission: 'LIVREUR' },
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
            { path: `/${effectiveSlug}/caisse`, label: 'Caisse / Retour', icon: Calculator, permission: 'CAISSE', requiredModule: 'module_caisse' },
            { path: `/${effectiveSlug}/rapport-financier`, label: 'Rapport Journalier', icon: TrendingUp, permission: 'FINANCE' },
            { path: `/${effectiveSlug}/net-profit`, label: 'Profit & Finances', icon: DollarSign, permission: 'ADMIN' },
            { path: `/${effectiveSlug}/admin/tresorerie`, label: 'Trésorerie Admin', icon: Wallet, permission: 'TRESORERIE' },
            { path: `/${effectiveSlug}/audit-tresorerie`, label: 'Expertise Comptable', icon: ShieldCheck, permission: 'ADMIN', requiredModule: 'module_audit' },
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
        { path: '/profil', icon: UserIcon, label: 'Profil Admin', permission: 'SUPER_ADMIN' },
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
        
        <div className="brand-logo" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '1.5rem 1.25rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary), #818cf8)', 
            width: 36, height: 36, 
            borderRadius: 12, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Package size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ 
              fontSize: '1.1rem', 
              fontWeight: 900, 
              color: 'var(--text-main)', 
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              GomboSwift
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Logistics Pro
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
              className="btn btn-primary btn-sm" 
              style={{ width: '100%', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, gap: '0.5rem' }}
            >
              <ShieldCheck size={14} /> RETOUR AU NEXUS
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

        <div className="sidebar-user-card" style={{ padding: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <div className="sidebar-user-info" style={{ marginBottom: '1rem' }}>
            <div className="sidebar-avatar" style={{ 
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              border: '1px solid rgba(0,0,0,0.05)',
              color: 'var(--primary)',
              fontWeight: 800
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.nom_complet}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, textTransform: 'uppercase' }}>
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
