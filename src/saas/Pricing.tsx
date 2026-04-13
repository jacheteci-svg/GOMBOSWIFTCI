import React from 'react';
import { Check, Zap, Rocket, Crown, Settings, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { insforge } from '../lib/insforge';

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

// Fallback plans if DB is unavailable
const FALLBACK_PLANS: PricingPlan[] = [
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
    color: '#64748b',
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

// Build features list from DB plan modules
function buildFeaturesFromDB(plan: any): string[] {
  const features: string[] = [];

  // Add text features from the features array if present
  if (Array.isArray(plan.features) && plan.features.length > 0) {
    return plan.features;
  }

  // Build from module toggles
  if (plan.module_crm_clients) features.push('CRM & Clients');
  if (plan.module_suivi_terrain) features.push('Suivi Terrain');
  if (plan.module_logistique_pro) features.push('Logistique Pro');
  if (plan.module_staff_perf) features.push('Performance Staff');
  if (plan.module_livraisons_app) features.push('Mes Livraisons');
  if (plan.module_tresorerie_audit) features.push('Trésorerie & Audit');
  if (plan.module_caisse_retour_expert) features.push('Caisse / Retour');
  if (plan.module_rapport_journalier) features.push('Rapport Journalier');
  if (plan.module_profit_finances) features.push('Profit & Finances');
  if (plan.module_tresorerie_admin) features.push('Trésorerie Admin');
  if (plan.module_expertise_comptable) features.push('Expertise Comptable');
  if (plan.module_caisse) features.push('Gestion Caisse');
  if (plan.module_audit) features.push('Module Audit');
  if (plan.module_api) features.push('API & Intégrations');
  if (plan.module_whatsapp) features.push('Notifications WhatsApp');

  // Add user limits
  if (plan.max_users === -1) {
    features.push('Utilisateurs illimités');
  } else if (plan.max_users) {
    features.push(`Jusqu'à ${plan.max_users} Utilisateurs`);
  }

  // Promise of Bonus Days
  if (plan.id === 'BASIC' || plan.name?.toLowerCase().includes('croissance')) {
    features.push('🎁 +10 Jours Bonus (1er mois)');
  } else if (plan.id === 'PREMIUM' || plan.id === 'ELITE' || plan.name?.toLowerCase().includes('elite')) {
    features.push('💎 +15 Jours Bonus (1er mois)');
  }

  return features.length > 0 ? features : ['Accès de base à la plateforme'];
}

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [dbPlans, setDbPlans] = React.useState<PricingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data, error } = await insforge.database.from('saas_plans').select('*').eq('is_active', true);
        if (error) throw error;

        if (data && data.length > 0) {
          data.sort((a: any, b: any) => {
            if (a.id === 'CUSTOM') return 1;
            if (b.id === 'CUSTOM') return -1;
            return (a.price_fcfa ?? 0) - (b.price_fcfa ?? 0);
          });

          setDbPlans(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price_fcfa === -1 ? 'Contactez-nous' : `${Number(p.price_fcfa).toLocaleString()} FCFA`,
            period: p.price_fcfa === -1 ? '' : (p.period || '/mois'),
            description: p.description || '',
            features: buildFeaturesFromDB(p),
            icon: iconMap[p.icon_name] || Zap,
            color: p.color || '#6366f1',
            popular: p.is_popular
          })));
        }
      } catch (err) {
        console.error('Error loading plans from DB, using fallback:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();

    // REAL-TIME SYNCHRONISATION
    const channel = insforge.database
      .channel('saas_plans_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saas_plans' }, () => {
        loadPlans();
      })
      .subscribe();

    return () => {
      insforge.database.removeChannel(channel);
    };
  }, []);

  const handleSelectPlan = (planId: string) => {
    navigate(`/register?plan=${planId}`);
  };

  const displayPlans = dbPlans.length > 0 ? dbPlans : FALLBACK_PLANS;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={40} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontWeight: 700 }}>Chargement des offres...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1.25rem',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '50px',
          fontSize: '0.8rem',
          fontWeight: 800,
          color: '#818cf8',
          marginBottom: '2rem',
          letterSpacing: '0.08em'
        }}>
          💎 TARIFICATION TRANSPARENTE
        </div>
        <h2 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 950,
          marginBottom: '1.5rem',
          letterSpacing: '-0.04em',
          background: 'linear-gradient(to bottom, #ffffff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1
        }}>
          Investissez dans votre<br/>croissance logistique
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '650px', margin: '0 auto', lineHeight: 1.7 }}>
          Choisissez le plan qui correspond à la taille de votre entreprise. Toute modification SuperAdmin est synchronisée instantanément.
        </p>
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        alignItems: 'stretch',
        marginTop: '3rem'
      }}>
        {displayPlans.map((plan) => {
          const isPop = plan.popular;
          return (
            <div
              key={plan.id}
              style={{
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: '32px',
                background: isPop
                  ? 'linear-gradient(145deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: isPop
                  ? '2px solid rgba(129, 140, 248, 0.8)'
                  : '1px solid rgba(255,255,255,0.1)',
                transform: isPop ? 'scale(1.04)' : 'none',
                zIndex: isPop ? 2 : 1,
                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: isPop
                  ? '0 35px 100px -15px rgba(99,102,241,0.5), 0 0 30px rgba(99,102,241,0.2)'
                  : '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                overflow: 'hidden'
              }}
              className="pricing-card"
            >
              {/* Popular Glow Effect */}
              {isPop && (
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 0
                }} />
              )}

              {/* Popular Badge */}
              {isPop && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  padding: '0.6rem 1.8rem',
                  borderRadius: '0 0 20px 20px',
                  fontSize: '0.75rem',
                  fontWeight: 950,
                  letterSpacing: '0.12em',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 10px 25px rgba(99,102,241,0.5)',
                  zIndex: 10
                }}>
                  ⭐ RECOMMANDÉ
                </div>
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Icon */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: isPop ? 'white' : `${plan.color}20`,
                  border: isPop ? 'none' : `1px solid ${plan.color}40`,
                  color: isPop ? '#6366f1' : plan.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '2rem',
                  boxShadow: isPop ? '0 10px 25px rgba(99,102,241,0.4)' : 'none'
                }}>
                  <plan.icon size={32} strokeWidth={2.5} />
                </div>

                {/* Plan Name */}
                <h3 style={{
                  fontSize: '1.7rem',
                  fontWeight: 950,
                  marginBottom: '0.75rem',
                  color: '#ffffff',
                  letterSpacing: '-0.02em'
                }}>
                  {plan.name}
                </h3>

                {/* Description */}
                <p style={{
                  color: isPop ? '#cbd5e1' : '#94a3b8',
                  fontSize: '1rem',
                  marginBottom: '2.5rem',
                  lineHeight: 1.6,
                  minHeight: '3.5rem',
                  fontWeight: 500
                }}>
                  {plan.description}
                </p>

                {/* Price */}
                <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                  <span style={{
                    fontSize: plan.id === 'CUSTOM' ? '2.2rem' : '3.2rem',
                    fontWeight: 950,
                    color: '#ffffff',
                    letterSpacing: '-0.04em',
                    lineHeight: 1
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{
                      color: '#94a3b8',
                      fontWeight: 700,
                      fontSize: '1.1rem'
                    }}>
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)',
                  marginBottom: '2.5rem'
                }} />

                {/* Features (Modules) */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: isPop ? '#a5b4fc' : '#64748b', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.1em' }}>
                    SERVICES INCLUS
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {plan.features.map((feature: string, i: number) => (
                      <li key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#f8fafc' 
                      }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: isPop ? 'rgba(255,255,255,0.15)' : `${plan.color}20`,
                          border: `1px solid ${isPop ? 'rgba(255,255,255,0.2)' : `${plan.color}40`}`,
                          color: isPop ? '#fff' : plan.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          <Check size={14} strokeWidth={4} />
                        </div>
                        <span style={{ opacity: 0.95 }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: '3rem' }}>
                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    style={{
                      width: '100%',
                      padding: '1.25rem',
                      borderRadius: '18px',
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: 'none',
                      letterSpacing: '0.02em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      ...(isPop ? {
                        background: 'white',
                        color: '#020617',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                      } : plan.id === 'CUSTOM' ? {
                        background: 'rgba(255,255,255,0.05)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255,255,255,0.15)',
                      } : {
                        background: `${plan.color}15`,
                        color: 'white',
                        border: `1px solid ${plan.color}40`,
                      })
                    }}
                    className="pricing-btn"
                  >
                    {plan.id === 'FREE'
                      ? <>🚀 Commencer Gratuitement <Rocket size={20}/></>
                      : plan.id === 'CUSTOM'
                        ? <>📞 Contacter nos Experts <Settings size={20}/></>
                        : <>⚡ Activer l'Infrastructure <Zap size={20}/></>}
                  </button>
                  
                  {/* No Credit Card Note */}
                  <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: isPop ? '#a5b4fc' : '#64748b', fontWeight: 600 }}>
                    {plan.id === 'FREE' ? 'Sans carte bancaire requise' : 'Activation instantanée'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Note */}
      <div style={{
        textAlign: 'center',
        marginTop: '6rem',
        padding: '3rem 2rem',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        borderRadius: '32px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
         <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', opacity: 0.8 }}>
            {[
              { l: 'Pas de frais cachés', i: '💳' },
              { l: 'Annulation en 1 clic', i: '⏳' },
              { l: 'Sécurité bancaire', i: '🔒' }
            ].map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                <span style={{ fontSize: '1.2rem' }}>{n.i}</span> {n.l}
              </div>
            ))}
         </div>
      </div>

      <style>{`
        .pricing-card:hover {
          transform: translateY(-12px) scale(1.02) !important;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.6) !important;
          border-color: rgba(255,255,255,0.3) !important;
        }
        .pricing-btn:hover {
          transform: translateY(-3px) scale(1.02);
          filter: brightness(1.1);
        }
        @media (max-width: 768px) {
          .pricing-card { transform: none !important; margin-bottom: 2rem; }
        }
      `}</style>
    </div>
  );
};
