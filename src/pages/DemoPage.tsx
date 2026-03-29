import { 
  ArrowLeft, 
  Package, 
  Truck, 
  TrendingUp, 
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DemoSection: React.FC<{ 
  title: string; 
  desc: string; 
  image: string; 
  icon: any; 
  reversed?: boolean;
  features: string[] 
}> = ({ title, desc, image, icon: Icon, reversed, features }) => (
  <section style={{ 
    padding: '8rem 2rem', 
    display: 'flex', 
    flexDirection: reversed ? 'row-reverse' : 'row', 
    alignItems: 'center', 
    gap: '6rem', 
    flexWrap: 'wrap',
    maxWidth: '1200px',
    margin: '0 auto'
  }}>
    <div style={{ flex: '1 1 500px' }}>
      <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '16px', marginBottom: '2rem' }}>
        <Icon size={32} strokeWidth={2.5} />
      </div>
      <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-0.03em' }}>{title}</h2>
      <p style={{ fontSize: '1.25rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2.5rem' }}>{desc}</p>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 600, color: '#f8fafc' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} />
            </div>
            {f}
          </div>
        ))}
      </div>
    </div>
    <div style={{ flex: '1 1 500px' }}>
      <div style={{ 
        position: 'relative', 
        borderRadius: '32px', 
        overflow: 'hidden', 
        boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.05)',
        background: '#1e293b'
      }}>
        <img 
          src={image} 
          alt={title} 
          style={{ width: '100%', height: 'auto', display: 'block' }} 
        />
        {/* Decorative Blur */}
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 100px rgba(2,6,23,0.3)', pointerEvents: 'none' }} />
      </div>
    </div>
  </section>
);

export const DemoPage: React.FC = () => {
  return (
    <div style={{ background: '#020617', color: '#f8fafc', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      {/* Navbar with Return */}
      <nav style={{ 
        padding: '1.5rem 2rem', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        position: 'sticky', 
        top: 0, 
        background: 'rgba(2, 6, 23, 0.8)', 
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
          <ArrowLeft size={20} /> Retour
        </Link>
        <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>DÉMO GOMBOSWIFTCI</div>
        <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}>Démarrer l'essai</Link>
      </nav>

      {/* Hero Header */}
      <header style={{ padding: '8rem 2rem', textAlign: 'center', background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent 50%)' }}>
        <h1 style={{ fontSize: '4.5rem', fontWeight: 950, letterSpacing: '-0.05em', marginBottom: '2rem' }}>
          Explorez le Futur de la <span style={{ color: '#6366f1' }}>Logistique</span>.
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#94a3b8', maxWidth: '800px', margin: '0 auto' }}>
          Visualisez la puissance de GomboSwiftCI à travers nos modules clés et comprenez comment nous transformons vos opérations.
        </p>
      </header>

      {/* Overview Block */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          padding: '4rem', 
          borderRadius: '4rem',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem' }}>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 950, color: '#6366f1' }}>30sec</div>
              <p style={{ color: '#94a3b8', fontWeight: 700 }}>Configuration Initiale</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 950, color: '#10b981' }}>100%</div>
              <p style={{ color: '#94a3b8', fontWeight: 700 }}>Contrôle Trésorerie</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 950, color: '#a855f7' }}>∞</div>
              <p style={{ color: '#94a3b8', fontWeight: 700 }}>Croissance Illimitée</p>
            </div>
          </div>
        </div>
      </section>

      {/* Module 1: Inventory */}
      <DemoSection 
        title="Maîtrise Totale du Stock"
        desc="Visualisez vos actifs comme jamais auparavant. Notre gestion de stock intelligente anticipe les ruptures et optimise vos espaces d'entreposage."
        image="demo_inventory_mockup_1774786881539.png"
        icon={Package}
        features={[
          "Historique complet des mouvements",
          "Alertes automatiques de stock bas",
          "Multi-entrepôts synchronisés",
          "Valorisation du stock en temps réel"
        ]}
      />

      {/* Module 2: Dispatch */}
      <DemoSection 
        title="Dispatching de Haute Précision"
        desc="La complexité des livraisons à Abidjan ne doit plus être un frein. Automatisez le dispatching et suivez vos coursiers à la trace."
        image="demo_dispatch_mockup_1774786918863.png"
        icon={Truck}
        reversed
        features={[
          "Optimisation d'itinéraires intelligente",
          "Feuilles de route interactives",
          "Assignation automatique des livreurs",
          "Notifications WhatsApp pro-actives"
        ]}
      />

      {/* Module 3: Financials */}
      <DemoSection 
        title="Audit & Trésorerie Sans Faille"
        desc="Éliminez les erreurs comptables et les écarts de caisse. Chaque livraison génère un audit automatique pour une transparence totale."
        image="demo_financial_mockup_1774787050052.png"
        icon={TrendingUp}
        features={[
          "Tableaux de bord financiers dynamiques",
          "Gestion des encaissements en temps réel",
          "Calcul automatique des bénéfices nets",
          "Facturation et rapports PDF instantanés"
        ]}
      />

      {/* CTA Final */}
      <section style={{ padding: '10rem 2rem', textAlign: 'center' }}>
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          padding: '6rem 3rem', 
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
          borderRadius: '4rem',
          boxShadow: '0 50px 100px -20px rgba(99, 102, 241, 0.4)'
        }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '2rem' }}>Prêt à transformer votre entreprise ?</h2>
          <p style={{ fontSize: '1.4rem', opacity: 0.9, marginBottom: '4rem' }}>La démo n'est que le début. Vivez l'expérience GomboSwiftCI avec votre propre compte.</p>
          <Link to="/register" style={{ padding: '1.5rem 4rem', borderRadius: '20px', fontSize: '1.3rem', fontWeight: 900, textDecoration: 'none', background: 'white', color: '#6366f1', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            Lancer mon Essai Gratuit
          </Link>
        </div>
      </section>

      {/* Sub Footer footer */}
      <footer style={{ padding: '4rem 2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#475569', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} GomboSwiftCI. Les captures sont des démonstrations de l'interface logicielle réelle.
      </footer>
    </div>
  );
};
