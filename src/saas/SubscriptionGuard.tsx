import { useSaas } from './SaasProvider';
import { Plan } from '../types';
import { Crown, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan: Plan;
  fallback?: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  children, 
  requiredPlan, 
  fallback 
}) => {
  const { isPlanAtLeast, loading } = useSaas();

  if (loading) return null;

  if (isPlanAtLeast(requiredPlan)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div style={{ 
      padding: '3rem', 
      textAlign: 'center', 
      background: 'white', 
      borderRadius: '24px', 
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      maxWidth: '600px',
      margin: '2rem auto'
    }}>
      <div style={{ 
        width: '80px', 
        height: '80px', 
        borderRadius: '50%', 
        background: '#fef3c7', 
        color: '#d97706', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Crown size={40} strokeWidth={2.5} />
      </div>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>
        Fonctionnalité Premium
      </h2>
      
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Cette section nécessite un abonnement <strong>{requiredPlan}</strong>. 
        Mettez à jour votre forfait pour débloquer ces fonctionnalités avancées et booster votre productivité.
      </p>

      <Link to="/saas/pricing" className="btn btn-primary" style={{ padding: '0.9rem 2rem', gap: '0.75rem' }}>
        <Zap size={18} fill="currentColor" />
        Découvrir les Forfaits
      </Link>
    </div>
  );
};
