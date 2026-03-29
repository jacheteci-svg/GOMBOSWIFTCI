import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { 
  ShieldCheck, 
  HelpCircle, 
  Bug, 
  Terminal, 
  Activity, 
  Calculator, 
  CheckCircle2, 
  ArrowLeft,
  Search,
  Package,
  Truck,
  Layout,
  Users,
  MailIcon,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LayoutStatic: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
    <nav style={{ padding: '1.5rem 2rem', background: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: 700 }}>
        <ArrowLeft size={20} /> Retour
      </Link>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{title}</h1>
    </nav>
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
      {children}
    </main>
    <footer style={{ padding: '4rem 2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', marginTop: '4rem', color: '#64748b' }}>
      <p>&copy; {new Date().getFullYear()} GomboSwiftCI S.A.S. Infrastructure Logistique Premium.</p>
    </footer>
  </div>
);

// --- 1. Produit : Fonctionnalités ---
export const FeaturesPage: React.FC = () => (
  <LayoutStatic title="Nos Fonctionnalités">
    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
      <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>L'Arsenal Logistique Ultime</h2>
      <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Tout ce dont vous avez besoin pour dominer votre marché.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
      {[
        { icon: Package, title: 'Gestion de Stock', desc: 'Suivi multi-entrepôts, alertes de seuil et inventaires en temps réel.' },
        { icon: Layout, title: 'Workflow Commandes', desc: 'Du CMS à la livraison, un cycle de vie automatisé et sans erreurs.' },
        { icon: Truck, title: 'Dispatching Elite', desc: 'Gestion des livreurs, calcul d\'itinéraires et feuilles de route digitales.' },
        { icon: Activity, title: 'Audit Financier', desc: 'Rapports de caisse, analyse des marges et dashboard de performance.' },
        { icon: Users, title: 'CRM Expériences', desc: 'Base client, notifications WhatsApp et gestion des retours.' },
        { icon: ShieldCheck, title: 'Sécurité SaaS', desc: 'Isolation des données par entreprise et sauvegardes quotidiennes.' }
      ].map((f, i) => (
        <div key={i} className="card glass-effect" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
          <f.icon size={32} color="var(--primary)" style={{ marginBottom: '1.25rem' }} />
          <h3 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>{f.title}</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
        </div>
      ))}
    </div>
  </LayoutStatic>
);

// --- 2. Produit : Calculateur de Coût ---
export const CostCalculatorPage: React.FC = () => {
  const [volume, setVolume] = useState<number>(500);
  const [costPerDelivery, setCostPerDelivery] = useState<number>(1500);
  const [activeTab, setActiveTab] = useState<'ROI' | 'STOCK' | 'CALL'>('ROI');

  // ROI Math: Current Manual Cost (estimated 2500) vs Gombo (optimized 1500)
  const currentCost = volume * 2500;
  const gomboCost = volume * costPerDelivery;
  const savings = currentCost - gomboCost;

  return (
    <LayoutStatic title="Calculateur d'Impact">
      <div className="card glass-effect" style={{ padding: '2.5rem', borderRadius: '32px' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { id: 'ROI', label: 'ROI Logistique', icon: Calculator },
            { id: 'STOCK', label: 'Simulation Stock', icon: Package },
            { id: 'CALL', label: 'Efficacité Call', icon: PhoneCall }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '14px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--primary)' : 'white',
                color: activeTab === tab.id ? 'white' : '#64748b',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab.id ? '0 10px 20px -5px var(--primary-shadow)' : '0 2px 5px rgba(0,0,0,0.05)'
              }}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'ROI' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Volume de commandes (mensuel)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  style={{ height: '50px' }} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Coût actuel par livraison (moyenne FCFA)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={costPerDelivery}
                  onChange={(e) => setCostPerDelivery(Number(e.target.value))}
                  style={{ height: '50px' }} 
                />
              </div>
            </div>
            <div style={{ background: 'var(--primary-glow)', padding: '2rem', borderRadius: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.5rem' }}>ÉCONOMIES ESTIMÉES</h3>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {savings.toLocaleString()} <span style={{ fontSize: '1.2rem' }}>FCFA</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                Soit environ <strong>{Math.round((savings / currentCost) * 100)}%</strong> de réduction sur vos coûts opérationnels.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'STOCK' && (
          <div style={{ textAlign: 'center' }}>
            <Package size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem' }}>Simulation d'Inventaire Intelligente</h3>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Avec GomboSwiftCI, réduisez vos ruptures de stock de <strong>35%</strong>.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>-22%</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Pertes de péremption</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>+15%</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Rotation de stock</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CALL' && (
          <div style={{ textAlign: 'center' }}>
            <Users size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem' }}>Optimisation de la Conversion</h3>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Le module Callcenter booste vos confirmations de <strong>20%</strong> dès le premier mois.</p>
            <div style={{ padding: '2rem', background: '#eff6ff', borderRadius: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span>Temps de traitement moyen</span>
                <strong style={{ color: '#d946ef' }}>-45%</strong>
              </div>
              <div style={{ height: '8px', background: '#dbeafe', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '55%', height: '100%', background: 'var(--primary)' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutStatic>
  );
};

// --- 3. Produit : API Developer ---
export const ApiDocsPage: React.FC = () => (
  <LayoutStatic title="API Developer">
    <div style={{ background: '#0f172a', color: '#38bdf8', padding: '3rem', borderRadius: '24px', fontFamily: 'Fira Code, monospace', overflow: 'hidden' }}>
      <Terminal size={40} style={{ marginBottom: '2rem', color: 'white' }} />
      <h2 style={{ color: 'white', fontWeight: 800 }}>Intégrez GomboSwiftCI partout</h2>
      <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Notre API RESTful vous permet de connecter vos propres outils.</p>
      <div style={{ marginTop: '2.5rem', background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
        <code style={{ fontSize: '0.9rem' }}>GET https://api.gomboswiftci.ci/v1/orders</code>
        <div style={{ marginTop: '1rem', color: '#94a3b8' }}>{`{ "status": "operational", "version": "2.4.0" }`}</div>
      </div>
      <button className="btn btn-primary" style={{ marginTop: '2rem', background: 'white', color: '#0f172a', fontWeight: 800 }}>ACCÉDER À LA DOC COMPLÈTE</button>
    </div>
  </LayoutStatic>
);

// --- 4. Produit : Statut Système ---
export const SystemStatusPage: React.FC = () => (
  <LayoutStatic title="Statut Système">
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        background: '#dcfce7', 
        color: '#15803d', 
        padding: '2rem', 
        borderRadius: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '1rem',
        fontWeight: 800,
        fontSize: '1.5rem',
        marginBottom: '3rem'
      }}>
        <CheckCircle2 size={32} /> TOUS LES SYSTÈMES SONT OPÉRATIONNELS
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {['Base de données', 'Serveurs API', 'Moteur de stockage', 'Interface Dashboard', 'Notifications WA'].map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: 700 }}>{s}</span>
            <span style={{ color: '#10b981', fontWeight: 800 }}>99.9% Uptime</span>
          </div>
        ))}
      </div>
    </div>
  </LayoutStatic>
);

// --- 5. Support : Centre d'aide ---
export const HelpCenterPage: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const topics = [
    {
      q: "Comment créer mon premier livreur ?",
      steps: [
        "Connectez-vous à votre dashboard administrateur.",
        "Allez dans l'onglet 'Livraison' via la barre latérale.",
        "Cliquez sur le bouton 'Nouveau Livreur' en haut à droite.",
        "Remplissez les informations (Nom, Téléphone, Zone assignée) et validez."
      ]
    },
    {
      q: "Comment intégrer WhatsApp à mon tableau de bord ?",
      steps: [
        "Accédez à la section 'Paramètres' de votre organisation.",
        "Sélectionnez 'Notifications WhatsApp'.",
        "Scannez le QR Code généré avec votre application WhatsApp Business.",
        "Configurez vos modèles de messages automatiques pour les clients."
      ]
    },
    {
      q: "Configuration des tarifs par commune",
      steps: [
        "Allez dans la gestion des 'Zones de livraison'.",
        "Cliquez sur 'Ajouter une commune' ou modifiez une zone existante.",
        "Définissez le tarif forfaitaire (ex: 1500 FCFA) pour cette localité.",
        "Enregistrez : les tarifs seront appliqués automatiquement lors de la création de commandes."
      ]
    },
    {
      q: "Dépannage : Problèmes de synchronisation de stock",
      steps: [
        "Vérifiez que le nom du produit correspond exactement dans votre CMS et GomboSwiftCI.",
        "Consultez l'historique des 'Mouvements de stock' pour identifier d'éventuelles erreurs manuelles.",
        "Si le problème persiste, cliquez sur 'Forcer la resynchronisation' dans les réglages de l'inventaire."
      ]
    }
  ];

  if (selectedTopic !== null) {
    const topic = topics[selectedTopic];
    return (
      <LayoutStatic title="Guide Détail">
        <button 
          onClick={() => setSelectedTopic(null)}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Retour au centre d'aide
        </button>
        <div className="card glass-effect" style={{ padding: '3rem', borderRadius: '32px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem' }}>{topic.q}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {topic.steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 900,
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.6, fontSize: '1.05rem', paddingTop: '4px' }}>{step}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#64748b' }}>Vous ne trouvez pas la solution ? <Link to="/contact-sales" style={{ color: 'var(--primary)', fontWeight: 700 }}>Contactez le support</Link></p>
          </div>
        </div>
      </LayoutStatic>
    );
  }

  return (
    <LayoutStatic title="Centre d'aide">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: '3rem' }}>
          <Search size={22} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Comment pouvons-nous vous aider ?" 
            style={{ width: '100%', height: '70px', borderRadius: '20px', border: '2px solid #e2e8f0', padding: '0 4rem', fontSize: '1.1rem', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {topics.map((topic, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedTopic(i)}
              style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', cursor: 'pointer', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
            >
              <span style={{ fontWeight: 600 }}>{topic.q}</span>
              <HelpCircle size={18} color="#94a3b8" />
            </div>
          ))}
        </div>
      </div>
    </LayoutStatic>
  );
};

// --- 6. Support : Contact Sales ---
export const ContactSalesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulating email send to soroboss.bossimpact@gmail.com
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Envoi commercial à: soroboss.bossimpact@gmail.com", formData);
      showToast("Demande envoyée ! Notre équipe vous contactera sous 24h.", "success");
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      showToast("Erreur lors de l'envoi. Veuillez réessayer.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutStatic title="Contact Commercial">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
        <div className="card glass-effect" style={{ padding: '3rem', borderRadius: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '2rem' }}>Parlez-nous de votre projet</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Votre nom" 
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <input 
                type="email" 
                className="form-input" 
                placeholder="Email professionnel" 
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <textarea 
                className="form-input" 
                placeholder="Comment pouvons-nous vous aider ?" 
                style={{ height: '120px', paddingTop: '1rem' }} 
                required
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            <button 
              disabled={loading}
              className="btn btn-primary" 
              style={{ height: '60px', borderRadius: '16px', fontWeight: 800 }}
            >
              {loading ? 'ENVOI EN COURS...' : 'ENVOYER MA DEMANDE'}
            </button>
          </form>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {[
            { icon: MailIcon, title: "Email Commercial", desc: "sales@gomboswiftci.ci" },
            { icon: PhoneCall, title: "Téléphone direct", desc: "+225 07 57 22 87 31" },
            { icon: MessageSquare, title: "WhatsApp Business", desc: "+225 01 00 57 65 26" }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={24} color="var(--primary)" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800 }}>{item.title}</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutStatic>
  );
};

// --- 7. Support : Signaler un Bug ---
export const ReportBugPage: React.FC = () => (
  <LayoutStatic title="Signaler un bug">
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <Bug size={60} color="#f43f5e" style={{ marginBottom: '2rem' }} />
      <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>On va régler ça !</h2>
      <p style={{ color: '#64748b', marginBottom: '3rem' }}>Décrivez le problème rencontré pour que nos ingénieurs puissent intervenir.</p>
      <form style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Titre du bug</label>
          <input type="text" className="form-input" placeholder="Ex: Impossible de valider un retour" />
        </div>
        <div className="form-group">
          <label className="form-label">Description et étapes pour reproduire</label>
          <textarea className="form-input" placeholder="Détaillez le problème..." style={{ height: '150px', paddingTop: '1rem' }} />
        </div>
        <button className="btn btn-primary" style={{ background: '#f43f5e', height: '60px', borderRadius: '16px', fontWeight: 800 }}>SOUMETTRE LE SIGNALEMENT</button>
      </form>
    </div>
  </LayoutStatic>
);

// --- 8. Légal : Confidentialité ---
export const PrivacyPage: React.FC = () => (
  <LayoutStatic title="Confidentialité">
    <div style={{ lineHeight: 1.8 }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Politique de Confidentialité</h2>
      <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem' }}>Dernière mise à jour : 29 Mars 2026</p>
      
      {[
        { t: "Collecte des données", c: "Nous collectons les données nécessaires à la gestion de vos livraisons : noms, numéros de téléphone et adresses de livraison. Ces données sont isolées cryptographiquement par entreprise." },
        { t: "Utilisation des données", c: "Vos données ne sont jamais vendues. Elles servent uniquement à l'exécution de vos opérations logistiques et aux notifications clients via WhatsApp." },
        { t: "Protection", c: "Toutes les connexions sont chiffrées (TLS) et les accès à la base de données sont restreints selon des politiques de sécurité strictes." }
      ].map((s, i) => (
        <div key={i} style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontWeight: 800, color: '#0f172a' }}>{i + 1}. {s.t}</h3>
          <p style={{ color: '#475569' }}>{s.c}</p>
        </div>
      ))}
    </div>
  </LayoutStatic>
);

// --- 9. Légal : Conditions d'Utilisation ---
export const TermsPage: React.FC = () => (
  <LayoutStatic title="Conditions d'utilisation">
    <div style={{ lineHeight: 1.8 }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Conditions Générales d'Utilisation</h2>
      <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2rem' }}>Dernière mise à jour : 29 Mars 2026</p>

      <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', padding: '2rem', borderRadius: '20px', marginBottom: '3rem' }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1d4ed8' }}>Note importante : En accédant à GomboSwiftCI, vous acceptez de respecter ces conditions d'utilisation SaaS.</p>
      </div>

      {[
        { t: "Compte Utilisateur", c: "L'administrateur est responsable de la sécurité des mots de passe de son équipe et de l'activation des permissions appropriées." },
        { t: "Limites de Service", c: "Les quotas de commandes dépendent de votre abonnement. Tout dépassement pourra faire l'objet d'une facturation complémentaire." },
        { t: "Résiliation", c: "Vous pouvez arrêter votre abonnement à tout moment. Vos données seront conservées pendant 30 jours avant suppression définitive." }
      ].map((s, i) => (
        <div key={i} style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontWeight: 800, color: '#0f172a' }}>Art. {i + 1} - {s.t}</h3>
          <p style={{ color: '#475569' }}>{s.c}</p>
        </div>
      ))}
    </div>
  </LayoutStatic>
);

// --- 10. Légal : RGPD Compliance ---
export const GdprPage: React.FC = () => (
  <LayoutStatic title="RGPD Compliance">
    <div style={{ textAlign: 'center' }}>
      <ShieldCheck size={80} color="var(--primary)" style={{ marginBottom: '2rem' }} />
      <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>Respect de votre vie privée</h2>
      <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '700px', margin: '0 auto 4rem' }}>
        GomboSwiftCI applique les standards RGPD (Règlement Général sur la Protection des Données) pour garantir la souveraineté de vos clients sur leurs données personnelles.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', textAlign: 'left' }}>
        {[
          { t: "Droit à l'oubli", c: "Suppression totale des données client sur simple demande dans l'interface." },
          { t: "Portabilité", c: "Exports CSV/JSON de toutes vos données à tout moment." },
          { t: "Consentement", c: "Opt-in clair pour les notifications WhatsApp automatisées." }
        ].map((item, i) => (
          <div key={i} style={{ padding: '2rem', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <h4 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>{item.t}</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>{item.c}</p>
          </div>
        ))}
      </div>
    </div>
  </LayoutStatic>
);
