import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useSaas } from '../../saas/SaasProvider';
import { monerooService } from '../../services/monerooService';
import { Lock, CreditCard, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { AppLoadingScreen } from '../AppLoadingScreen';

export const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { tenant, isActive, planConfig, loading: saasLoading } = useSaas();
  const { logout, currentUser } = useAuth();
  const { showToast } = useToast();
  const [paying, setPaying] = useState(false);

  const handlePayActivation = async () => {
    console.log("Triggering payment for tenant:", tenant?.nom, "Plan:", planConfig?.id);
    
    if (!tenant) {
      showToast("Erreur : Données du compte introuvables.", "error");
      return;
    }

    setPaying(true);
    try {
      // Use fallback price if planConfig is missing
      const amount = planConfig?.price_fcfa || (tenant.plan === 'BASIC' ? 15000 : 25000);
      
      console.log("Initializing Moneroo with amount:", amount);

      const checkoutUrl = await monerooService.initializeSubscription({
        amount: amount,
        currency: 'XOF',
        customer: { name: tenant.nom, email: tenant.email_contact },
        reference_id: tenant.plan || 'BASIC',
        type: 'SUBSCRIPTION',
        tenant_id: tenant.id
      });

      if (checkoutUrl) {
        console.log("Checkout URL created:", checkoutUrl);
        window.location.href = checkoutUrl;
      } else {
        showToast("Impossible de générer le lien de paiement.", "error");
      }
    } catch (e: any) {
      console.error("Payment initialization failed:", e);
      showToast("Erreur d'initialisation : " + (e.message || "vérifiez votre connexion"), "error");
    } finally {
      setPaying(false);
    }
  };

  if (saasLoading) {
    return (
      <div className="main-content">
        <AppLoadingScreen variant="embedded" message="Préparation de votre espace…" />
      </div>
    );
  }

  // GLOBAL LOCK SCREEN IF TENANT IS INACTIVE (and not SUPER_ADMIN)
  if (!isActive && currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ 
        height: '100vh', width: '100vw', background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
      }}>
        <div className="card glass-effect" style={{ 
          maxWidth: '550px', width: '100%', padding: '3.5rem', textAlign: 'center',
          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.1)', borderRadius: '32px'
        }}>
          <div style={{ 
            width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(217,119,6,0.1)',
            color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem'
          }}>
            <Lock size={45} strokeWidth={2.5} />
          </div>
          
          <h2 style={{ fontSize: '2.2rem', fontWeight: 950, marginBottom: '1rem', color: '#1e293b', letterSpacing: '-0.02em' }}>
            Compte Suspendu
          </h2>
          
          <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem', fontWeight: 500 }}>
            L'accès à votre espace <strong>{tenant?.nom}</strong> a été suspendu suite à un défaut de paiement ou une désactivation de votre forfait {planConfig?.name || tenant?.plan}.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={handlePayActivation}
              disabled={paying}
              className="btn btn-primary"
              style={{ 
                height: '65px', borderRadius: '18px', fontWeight: 850, fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem'
              }}
            >
              {paying ? <Loader2 className="animate-spin" /> : <>RÉGLER MA FACTURE <CreditCard size={20} /></>}
            </button>
            
            <button 
              onClick={logout}
              className="btn btn-outline"
              style={{ height: '55px', borderRadius: '18px', fontWeight: 700, gap: '0.6rem' }}
            >
              <LogOut size={16} /> Me déconnecter
            </button>
          </div>
          
          <div style={{ marginTop: '2.5rem', padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>
              Besoin d'aide ? Contactez <a href="mailto:finance@gomboswiftci.app" style={{ color: 'var(--primary)', textDecoration: 'none' }}>finance@gomboswiftci.app</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="page-content nexus-page-bg custom-scroll">
          <Outlet />
        </div>
      </main>
      <BottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
    </div>
  );
};
