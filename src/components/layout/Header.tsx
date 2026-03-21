import { Bell, Search, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Tableau de bord';
      case '/produits': return 'Produits & Stock';
      case '/commandes': return 'Gestion des Commandes';
      case '/centre-appel': return 'Centre d\'Appel';
      case '/logistique': return 'Logistique & Feuilles de Route';
      case '/livraison': return 'Mes Livraisons';
      case '/caisse': return 'Caisse & Point de Retour';
      default: return 'Application';
    }
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="mobile-menu-btn" onClick={onMenuClick}>
           <Menu size={22} />
        </button>
        <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }} className="text-premium">
          {getPageTitle()}
        </h2>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="search-premium">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Recherche globale..." 
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>
        
        <button className="btn btn-outline" style={{ border: 'none', padding: '0.6rem', borderRadius: '12px', background: '#f1f5f9' }}>
          <Bell size={20} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </header>
  );
};
