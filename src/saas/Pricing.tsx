import React from 'react';
import { Check, Zap, Rocket, Crown, Settings } from 'lucide-react';
import { Plan } from '../types';
import { useNavigate } from 'react-router-dom';

interface PricingPlan {
  id: Plan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  icon: any;
  color: string;
  popular?: boolean;
}

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

  const handleSelectPlan = (planId: Plan) => {
    navigate(`/register?plan=${planId}`);
  };

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
        {plans.map((plan) => (
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
              <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>{plan.price}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{plan.period}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', flex: 1 }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text-main)'
                }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} strokeWidth={3} />
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
