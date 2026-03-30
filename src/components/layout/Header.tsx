import { Menu, Home, Building2, Bell } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '../../contexts/AuthContext';
import { insforge } from '../../lib/insforge';
import { useState, useEffect } from 'react';

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [tenantName, setTenantName] = useState<string>('');

  useEffect(() => {
    const fetchTenantName = async () => {
      if (currentUser?.tenant_id && currentUser.tenant_id !== 'default') {
        try {
          const { data, error } = await insforge.database
            .from('tenants')
            .select('nom')
            .eq('id', currentUser.tenant_id)
            .single();
          
          if (data && !error) {
            setTenantName(data.nom);
          }
        } catch (err) {
          console.error("Error fetching tenant name:", err);
        }
      }
    };

    fetchTenantName();
  }, [currentUser]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Portail';
      case '/dashboard': return 'Business 360°';
      case '/produits': return 'Produits & Stock';
      case '/commandes': return 'Commandes';
      case '/centre-appel': return 'Centre d\'Appel';
      case '/logistique': return 'Logistique';
      case '/livraison': return 'Mes Livraisons';
      case '/caisse': return 'Caisse & Retours';
      case '/rapport-financier': return 'Rapport Journalier';
      case '/clients': return 'CRM & Clients';
      case '/historique': return 'Historique';
      case '/admin': return 'Administration';
      case '/profil': return 'Mon Profil';
      case '/net-profit': return 'Profit & Finances';
      case '/admin/tresorerie': return 'Trésorerie';
      case '/audit-tresorerie': return 'Audit Comptable';
      case '/performance-staff': return 'Performance';
      default: 
        if (location.pathname.startsWith('/super-admin')) return 'Nexus Portal';
        return 'GomboSwiftCI';
    }
  };

  const initials = currentUser?.nom_complet
    ? currentUser.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Menu">
           <Menu size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ 
            fontSize: '1.1rem', 
            margin: 0, 
            fontWeight: 800,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} className="text-premium">
            {getPageTitle()}
          </h2>
          {tenantName && (
            <span style={{ 
              fontSize: '0.68rem', 
              color: 'var(--primary)', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.04em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.3rem',
              opacity: 0.8
            }}>
              <Building2 size={9} /> {tenantName}
            </span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <Link 
          to="/" 
          style={{ 
            width: 36, height: 36,
            borderRadius: 10,
            background: 'var(--primary-soft)', 
            color: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            transition: 'var(--transition-smooth)',
          }}
        >
          <Home size={17} />
        </Link>

        <NotificationCenter />

        {/* Avatar — visible on desktop, hidden on mobile */}
        <div className="mobile-hide" style={{
          width: 34, height: 34,
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '0.75rem',
          letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>
          {initials}
        </div>
      </div>
    </header>
  );
};
