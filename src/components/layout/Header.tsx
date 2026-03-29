import { Search, Menu, Home, Building2 } from 'lucide-react';
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
      case '/': return 'Portail gomboswiftciCI';
      case '/dashboard': return 'Business 360°';
      case '/produits': return 'Produits & Stock';
      case '/commandes': return 'Gestion des Commandes';
      case '/centre-appel': return 'Centre d\'Appel';
      case '/logistique': return 'Logistique & Feuilles de Route';
      case '/livraison': return 'Mes Livraisons';
      case '/caisse': return 'Caisse & Point de Retour';
      case '/rapport-financier': return 'Rapport Journalier & Analyses';
      default: return 'Nexus Logistics';
    }
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="mobile-menu-btn" onClick={onMenuClick}>
           <Menu size={22} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }} className="text-premium">
            {getPageTitle()}
          </h2>
          {tenantName && (
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={10} /> {tenantName}
            </span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="search-premium mobile-hide">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Recherche globale..." 
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>
        
        <Link to="/" className="btn btn-outline" style={{ border: 'none', padding: '0.6rem', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
          <Home size={20} />
        </Link>

        <NotificationCenter />
      </div>
    </header>
  );
};
