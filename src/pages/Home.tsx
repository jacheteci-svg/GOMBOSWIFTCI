import { useAuth } from '../contexts/AuthContext';
import { 
  Package, 
  ShoppingCart, 
  Headset, 
  Truck, 
  Users, 
  Calculator, 
  History, 
  TrendingUp, 
  Settings,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export const Home = () => {
  const { currentUser, hasPermission } = useAuth();
  const { tenantSlug } = useParams();
  const effectiveSlug = tenantSlug || currentUser?.tenant_slug || 'nexus';

  const menuItems = [
    { path: `/${effectiveSlug}/produits`, label: 'Produits', desc: 'Gestion du stock et catalogue', icon: Package, permission: 'PRODUITS', color: '#6366f1' },
    { path: `/${effectiveSlug}/commandes`, label: 'Commandes', desc: 'Suivi et flux des colis', icon: ShoppingCart, permission: 'COMMANDES', color: '#8b5cf6' },
    { path: `/${effectiveSlug}/centre-appel`, label: 'Centre d\'Appel', desc: 'Validation et suivi appels', icon: Headset, permission: 'CENTRE_APPEL', color: '#ec4899' },
    { path: `/${effectiveSlug}/clients`, label: 'Clients CRM', desc: 'Fidélisation et base clients', icon: Users, permission: 'CLIENTS', color: '#f59e0b' },
    { path: `/${effectiveSlug}/logistique`, label: 'Logistique', desc: 'Dispatching et tournées', icon: Truck, permission: 'LOGISTIQUE', color: '#10b981' },
    { path: `/${effectiveSlug}/caisse`, label: 'Caisse', desc: 'Encaissements et retours', icon: Calculator, permission: 'CAISSE', color: '#06b6d4' },
    { path: `/${effectiveSlug}/rapport-financier`, label: 'Rapport Journalier', desc: 'Orientation quotidienne', icon: TrendingUp, permission: 'FINANCE', color: '#6366f1' },
    { path: `/${effectiveSlug}/historique`, label: 'Historique', desc: 'Archives et impressions', icon: History, permission: 'HISTORIQUE', color: '#64748b' },
    { path: `/${effectiveSlug}/admin`, label: 'Admin', desc: 'Paramètres et utilisateurs', icon: Settings, permission: 'ADMIN', color: '#ef4444' },
    { path: '/saas/pricing', label: 'Mon Abonnement', desc: 'Gérer mon forfait SaaS', icon: Zap, permission: 'ADMIN', color: '#10b981' },
  ];

  const allowedItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <div style={{ animation: 'pageEnter 0.6s ease', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="text-premium" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          Bonne arrivée, {currentUser?.nom_complet?.split(' ')[0]} ! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500 }}>
          Ravi de vous revoir sur <span style={{ color: 'var(--primary)', fontWeight: 800 }}>GomboSwiftCI</span>. Où souhaitez-vous travailler aujourd'hui ?
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {allowedItems.map((item, i) => (
          <Link key={i} to={item.path} style={{ textDecoration: 'none' }}>
            <div className="card glass-effect hover-card" style={{ 
              padding: '1.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '16px', 
                background: `${item.color}15`, 
                color: item.color, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <item.icon size={28} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.25rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem' }}>{item.label}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.desc}</p>
              </div>
              <ChevronRight size={20} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              
              {/* Subtle background glow on hover child */}
              <div className="hover-glow" style={{ 
                position: 'absolute', 
                bottom: '-20px', 
                right: '-20px', 
                width: '100px', 
                height: '100px', 
                background: item.color, 
                filter: 'blur(50px)', 
                opacity: 0,
                transition: 'opacity 0.3s ease'
              }}></div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
         <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 700 }}>
            Session sécurisée • Nexus Pulse Active • Rôle : <span style={{ color: '#06b6d4', fontWeight: 950, textTransform: 'uppercase' }}>{currentUser?.role}</span>
         </p>
      </div>
    </div>
  );
};
