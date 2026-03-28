import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  ShieldCheck, 
  TrendingUp, 
  Smartphone, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Layout
} from 'lucide-react';
import { Pricing } from './Pricing';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ background: '#ffffff', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
      {/* Navigation Bar */}
      <nav style={{ 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'sticky', 
        top: 0, 
        background: 'rgba(255,255,255,0.8)', 
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '10px', color: 'white' }}>
            <Truck size={24} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>GomboSwiftCI</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#features" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>Fonctionnalités</a>
          <a href="#pricing" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>Tarification</a>
          <Link to="/login" className="btn btn-outline" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px' }}>Connexion</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px' }}>Essai Gratuit</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ 
        padding: '8rem 2rem', 
        textAlign: 'center', 
        background: 'radial-gradient(circle at top right, #f5f3ff 0%, #ffffff 50%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', opacity: 0.1 }}>
          <Package size={120} color="var(--primary)" />
        </div>
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', opacity: 0.1 }}>
          <Truck size={150} color="var(--primary)" />
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 1rem', 
            background: '#eff6ff', 
            color: 'var(--primary)', 
            borderRadius: '50px', 
            fontSize: '0.85rem', 
            fontWeight: 800, 
            marginBottom: '2rem',
            border: '1px solid #dbeafe'
          }}>
            <Zap size={14} fill="currentColor" />
            NOUVEAU : GOMBOSWIFTCI SAAS EST DISPONIBLE
          </div>
          <h1 style={{ 
            fontSize: '4.5rem', 
            fontWeight: 900, 
            lineHeight: 1.1, 
            marginBottom: '1.5rem', 
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Dominez votre Logistique <br />avec Élégance et Performance.
          </h1>
          <p style={{ fontSize: '1.4rem', color: '#64748b', marginBottom: '3rem', lineHeight: 1.5 }}>
            La plateforme SaaS ultime pour les e-commerçants et entreprises de transport. 
            Gérez vos stocks, commandes et livreurs en temps réel, partout dans le monde.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <Link to="/login" style={{ padding: '1.25rem 2.5rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--primary)', color: 'white', boxShadow: '0 20px 40px -10px var(--primary-glow)' }}>
              Démarrer Maintenant <ArrowRight size={20} />
            </Link>
            <button style={{ padding: '1.25rem 2.5rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, background: 'white', color: '#1e293b', border: '2px solid #e2e8f0' }}>
              Voir la Démo
            </button>
          </div>
        </div>
      </header>

      {/* Trust Quote / Stats */}
      <section style={{ padding: '4rem 2rem', background: '#f8fafc', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3rem' }}>FAITES CONFIANCE À LA PERFORMANCE</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>+150k</div>
            <div style={{ color: '#64748b', fontWeight: 600 }}>Livraisons Réussies</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>99.9%</div>
            <div style={{ color: '#64748b', fontWeight: 600 }}>Taux de Disponibilité</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b' }}>25%</div>
            <div style={{ color: '#64748b', fontWeight: 600 }}>Gain de Productivité</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '8rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Une Solution à 360°</h2>
          <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
            Tout ce dont vous avez besoin pour gérer votre business, du dispatching à l'audit comptable.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem' }}>
          {[
            { title: 'Gestion de Stock Intuitive', desc: 'Alertes de stock bas, mouvements et historique complet pour ne jamais manquer une vente.', icon: Package, color: '#6366f1' },
            { title: 'Workflow de Commandes CMS', desc: 'Importez et suivez vos commandes avec des statuts clairs et automatisés.', icon: Layout, color: '#8b5cf6' },
            { title: 'Dispatching Intelligent', desc: 'Assignez des colis à vos livreurs et créez des feuilles de route optimisées en un clic.', icon: Truck, color: '#10b981' },
            { title: 'CRM Expériences Client', desc: 'Envoyez des notifications WhatsApp directement depuis le panel pour fidéliser vos clients.', icon: Users, color: '#f59e0b' },
            { title: 'Trésorerie & Audit Expert', desc: 'Rapports financiers détaillés et expertise comptable intégrée pour une transparence totale.', icon: TrendingUp, color: '#ec4899' },
            { title: 'Sécurité Maximale', desc: 'Chiffrement de bout en bout et isolation totale des données entre chaque entreprise.', icon: ShieldCheck, color: '#0ea5e9' }
          ].map((feat, i) => (
            <div key={i} style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', background: 'white', transition: 'all 0.3s ease' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '16px', 
                background: `${feat.color}15`, 
                color: feat.color, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <feat.icon size={32} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{feat.title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '1.05rem' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)', color: 'white', overflow: 'hidden', position: 'relative' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '3rem' }}>"GomboSwiftCI a radicalement changé ma façon de gérer mes livraisons. C'est le jour et la nuit."</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={30} color="var(--primary)" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Abdou Diop</div>
              <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>CEO, Laye Transport & Logistics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ background: '#f8fafc' }}>
        <Pricing />
      </section>

      {/* CTA Section */}
      <section style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
          Prêt à faire passer votre logistique <br />dans le futur ?
        </h2>
        <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '3.5rem' }}>Inscrivez-vous aujourd'hui et commencez à gérer vos opérations comme un pro.</p>
        <Link to="/login" style={{ padding: '1.25rem 3.5rem', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 800, textDecoration: 'none', background: 'var(--primary)', color: 'white', boxShadow: '0 20px 40px -10px var(--primary-glow)' }}>
          Créer un Compte Gratuit
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '5rem 2rem', borderTop: '1px solid #f1f5f9', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Truck size={24} color="var(--primary)" />
              <span style={{ fontSize: '1.3rem', fontWeight: 900 }}>GomboSwiftCI</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              La plateforme logistique leader en Côte d'Ivoire et au-delà. Logiciel en tant que service (SaaS) premium.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Produit</h4>
            <ul style={{ listStyle: 'none', padding: 0, color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>Fonctionnalités</li>
              <li>Calculateur de Coût</li>
              <li>API Developer</li>
              <li>Statut Système</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>Centre d'aide</li>
              <li>Contact Commercial</li>
              <li>Signaler un bug</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Légal</h4>
            <ul style={{ listStyle: 'none', padding: 0, color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>Confidentialité</li>
              <li>Conditions d'utilisation</li>
              <li>RGPD Compliance</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} GomboSwiftCI S.A.S. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
};
