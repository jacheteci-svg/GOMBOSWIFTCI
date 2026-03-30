import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Menu as MenuIcon,
  UserCircle,
  Package
} from 'lucide-react';

interface BottomNavProps {
  onMenuClick: () => void;
}

export const BottomNav = ({ onMenuClick }: BottomNavProps) => {
  const { currentUser, hasPermission } = useAuth();
  const location = useLocation();
  const { tenantSlug } = useParams();

  if (currentUser?.role === 'SUPER_ADMIN') return null;

  const effectiveSlug = tenantSlug || currentUser?.tenant_slug || 'nexus';

  // Role-aware nav items — show only what matters most
  const getNavItems = () => {
    const base = [];

    if (hasPermission('DASHBOARD')) {
      base.push({ path: `/${effectiveSlug}/dashboard`, label: 'Dashboard', icon: LayoutDashboard });
    }

    if (hasPermission('COMMANDES') || hasPermission('CENTRE_APPEL')) {
      base.push({ path: `/${effectiveSlug}/commandes`, label: 'Commandes', icon: ShoppingCart });
    }

    if (hasPermission('LOGISTIQUE')) {
      base.push({ path: `/${effectiveSlug}/logistique`, label: 'Logistique', icon: Truck });
    } else if (hasPermission('LIVREUR')) {
      base.push({ path: `/${effectiveSlug}/livraison`, label: 'Livraisons', icon: Truck });
    } else if (hasPermission('PRODUITS')) {
      base.push({ path: `/${effectiveSlug}/produits`, label: 'Produits', icon: Package });
    }

    if (hasPermission('PROFIL')) {
      base.push({ path: `/${effectiveSlug}/profil`, label: 'Profil', icon: UserCircle });
    }

    return base;
  };

  const navItems = getNavItems();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="bottom-nav-icon">
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          className="bottom-nav-item"
          onClick={onMenuClick}
          type="button"
        >
          <span className="bottom-nav-icon">
            <MenuIcon size={22} strokeWidth={1.8} />
          </span>
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
};
