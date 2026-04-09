import { Menu, Home, ShieldCheck } from 'lucide-react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '../../contexts/AuthContext';
import { insforge } from '../../lib/insforge';
import { useState, useEffect } from 'react';
import { useSaas } from '../../saas/SaasProvider';

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { tenantSlug } = useParams();
  const { isSubdomain } = useSaas();
  const [tenantName, setTenantName] = useState<string>('');

  useEffect(() => {
    const fetchTenantName = async () => {
      // Prioritize name from currentUser if already fetched
      if (currentUser?.tenant_name) {
        setTenantName(currentUser.tenant_name);
        return;
      }

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
    const path = location.pathname;
    
    // Exact matches vs suffix matches for slug paths
    if (path === '/' || path === `/${tenantSlug}`) return 'Portail';
    if (path.endsWith('/dashboard')) return 'Business 360°';
    if (path.endsWith('/produits')) return 'Produits & Stock';
    if (path.endsWith('/commandes')) return 'Commandes';
    if (path.endsWith('/centre-appel')) return 'Centre d\'Appel';
    if (path.endsWith('/logistique')) return 'Logistique';
    if (path.endsWith('/livraison')) return 'Mes Livraisons';
    if (path.endsWith('/caisse')) return 'Caisse & Retours';
    if (path.endsWith('/rapport-financier')) return 'Rapport Journalier';
    if (path.endsWith('/clients')) return 'CRM & Clients';
    if (path.endsWith('/historique')) return 'Historique';
    if (path.endsWith('/admin')) return 'Administration';
    if (path.endsWith('/profil')) return 'Mon Profil';
    if (path.endsWith('/net-profit')) return 'Profit & Finances';
    if (path.endsWith('/admin/tresorerie')) return 'Trésorerie';
    if (path.endsWith('/audit-tresorerie')) return 'Audit Comptable';
    if (path.endsWith('/performance-staff')) return 'Performance';
    
    if (path.includes('/super-admin/performance')) return 'Performance boutiques';
    if (path.startsWith('/super-admin')) return 'Gombo Portal';
    return 'GomboSwiftCI';
  };

  const initials = currentUser?.nom_complet
    ? currentUser.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="header gombo-header-bar">
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
          {location.pathname.startsWith('/super-admin') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 950, color: 'white' }}>
                <ShieldCheck size={14} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>
                Administrateur Système
              </span>
            </div>
          ) : (
            tenantName && (
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: 950, 
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}></div>
                {tenantName}
              </span>
            )
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <Link 
          to={isSubdomain ? "/" : (tenantSlug ? `/${tenantSlug}` : "/")} 
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
