import React from 'react';
import { Check, Zap, Rocket, Crown, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { SaasPlanDb } from '../types';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  icon: any;
  color: string;
  popular?: boolean;
}

const iconMap: Record<string, any> = {
  'Zap': Zap,
  'Rocket': Rocket,
  'Crown': Crown,
  'Settings': Settings
};

const plans: PricingPlan[] = [
  {
    id: 'FREE',
    name: 'Essentiel',
    price: '0 FCFA',
    period: '/mois',
    description: 'Parfait pour débuter votre activité logistique.',
    icon: Zap,
    color: '#94a3b8',
    features: [
      'Jusqu\'à 50 commandes / mois',
      'Gestion de stock basique',
      '1 Utilisateur',
      'Support par communauté'
    ]
  },
  {
    id: 'BASIC',
    name: 'Croissance',
    price: '15,000 FCFA',
    period: '/mois',
    description: 'Pour les boutiques en pleine expansion.',
    icon: Rocket,
    color: '#6366f1',
    popular: true,
    features: [
      'Commandes illimitées',
      'Gestion de stock avancée',
      'Jusqu\'à 5 Utilisateurs',
      'Rapports journaliers',
      'Support Prioritaire'
    ]
  },
  {
    id: 'PREMIUM',
    name: 'Professionnel',
    price: '45,000 FCFA',
    period: '/mois',
    description: 'La solution complète pour les pros de la logistique.',
    icon: Crown,
    color: '#8b5cf6',
    features: [
      'Tout ce qu\'il y a dans Croissance',
      'Utilisateurs illimités',
      'Module Trésorerie & Audit',
      'Multi-entrepôts',
      'API & Intégrations',
      'Account Manager dédié'
    ]
  },
  {
    id: 'CUSTOM',
    name: 'Sur Mesure',
    price: 'Contactez-nous',
    period: '',
    description: 'Une version unique, non-SaaS, personnalisée à 100% pour vos besoins spécifiques.',
    icon: Settings,
    color: '#0f172a',
    features: [
      'Code source dédié & unique',
      'Hébergement privé',
      'Fonctionnalités sur demande',
      'Identité visuelle exclusive',
      'Maintenance VIP 24/7',
      'Formation sur site'
    ]
  }
];

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [dbPlans, setDbPlans] = React.useState<PricingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data, error } = await insforge.database.from('saas_plans').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Sort by price (or a specific order, CUSTOM at end)
          data.sort((a, b) => {
            if (a.id === 'CUSTOM') return 1;
            if (b.id === 'CUSTOM') return -1;
            return a.price_fcfa - b.price_fcfa;
          });

          setDbPlans(data.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price_fcfa === -1 ? 'Contactez-nous' : `${p.price_fcfa.toLocaleString()} FCFA`,
            period: p.period,
            description: p.description,
            features: p.features || [],
            icon: iconMap[p.icon_name] || Zap,
            color: p.color,
            popular: p.is_popular
          })));
        }
      } catch (err) {
        console.error("Error loading plans:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  const handleSelectPlan = (planId: string) => {
    navigate(`/register?plan=${planId}`);
  };

  const displayPlans = dbPlans.length > 0 ? dbPlans : plans;

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner"></div></div>;
  }

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="text-premium" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>
          Propulsez votre logistique avec GomboSwiftCI
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto' }}>
          Choisissez le plan qui correspond à la taille de votre entreprise et passez au niveau supérieur.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '2rem',
        alignItems: 'stretch'
      }}>
        {displayPlans.map((plan) => (
          <div 
            key={plan.id}
            className={`card glass-effect ${plan.popular ? 'popular-card' : ''}`}
            style={{ 
              padding: '2.5rem', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              border: plan.popular ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.05)',
              transform: plan.popular ? 'scale(1.05)' : 'none',
              zIndex: plan.popular ? 2 : 1,
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {plan.popular && (
              <div style={{ 
                position: 'absolute', 
                top: '-15px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                background: 'var(--primary)',
                color: 'white',
                padding: '0.4rem 1.25rem',
                borderRadius: '50px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                boxShadow: '0 10px 20px -5px var(--primary-glow)'
              }}>
                LE PLUS POPULAIRE
              </div>
            )}

            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '12px', 
              background: `${plan.color}15`, 
              color: plan.color, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <plan.icon size={24} strokeWidth={2.5} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{plan.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '3.5rem' }}>
              {plan.description}
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a' }}>{plan.price}</span>
              <span style={{ color: '#64748b', fontWeight: 700, marginLeft: '0.25rem' }}>{plan.period}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', flex: 1 }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#334155'
                }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${plan.color}15`, color: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span style={{ textAlign: 'left' }}>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSelectPlan(plan.id)}
              className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: '100%', padding: '1.1rem', borderRadius: '16px', fontWeight: 800, fontSize: '1rem' }}
            >
              {plan.id === 'FREE' ? 'Commencer Gratuitement' : (plan.id === 'CUSTOM' ? 'Demander un Devis' : 'Choisir ce Plan')}
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .popular-card {
          box-shadow: 0 40px 80px -20px var(--primary-glow) !important;
        }
        .popular-card:hover {
          transform: scale(1.07) translateY(-5px) !important;
        }
      `}</style>
    </div>
  );
};
