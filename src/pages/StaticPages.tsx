import React from 'react';
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
export const CostCalculatorPage: React.FC = () => (
  <LayoutStatic title="Calculateur de Coût">
    <div className="card glass-effect" style={{ padding: '3rem', borderRadius: '32px', textAlign: 'center' }}>
      <Calculator size={48} color="var(--primary)" style={{ marginBottom: '2rem' }} />
      <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>Estimez votre rentabilité</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
        <div className="form-group">
          <label className="form-label">Volume mensuel (commandes)</label>
          <input type="number" className="form-input" placeholder="Ex: 500" style={{ height: '50px' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Coût moyen par livraison (FCFA)</label>
          <input type="number" className="form-input" placeholder="Ex: 1500" style={{ height: '50px' }} />
        </div>
        <button className="btn btn-primary" style={{ height: '60px', borderRadius: '16px', fontWeight: 800 }}>CALCULER L'OPPORTUNITÉ</button>
      </div>
      <p style={{ marginTop: '2rem', color: '#64748b', fontSize: '0.9rem' }}>Version bêta : Les calculs sont des estimations basées sur nos moyennes régionales.</p>
    </div>
  </LayoutStatic>
);

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
export const HelpCenterPage: React.FC = () => (
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
        {[
          "Comment créer mon premier livreur ?",
          "Comment intégrer WhatsApp à mon tableau de bord ?",
          "Configuration des tarifs par commune",
          "Dépannage : Problèmes de synchronisation de stock"
        ].map((q, i) => (
          <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', cursor: 'pointer', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{q}</span>
            <HelpCircle size={18} color="#94a3b8" />
          </div>
        ))}
      </div>
    </div>
  </LayoutStatic>
);

// --- 6. Support : Contact Sales ---
export const ContactSalesPage: React.FC = () => (
  <LayoutStatic title="Contact Commercial">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
      <div className="card glass-effect" style={{ padding: '3rem', borderRadius: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '2rem' }}>Parlez-nous de votre projet</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <input type="text" className="form-input" placeholder="Votre nom" />
          </div>
          <div className="form-group">
            <input type="email" className="form-input" placeholder="Email professionnel" />
          </div>
          <div className="form-group">
            <textarea className="form-input" placeholder="Comment pouvons-nous vous aider ?" style={{ height: '120px', paddingTop: '1rem' }} />
          </div>
          <button className="btn btn-primary" style={{ height: '60px', borderRadius: '16px', fontWeight: 800 }}>ENVOYER MA DEMANDE</button>
        </form>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[
          { icon: MailIcon, title: "Email", desc: "sales@gomboswiftci.ci" },
          { icon: PhoneCall, title: "Téléphone", desc: "+225 07 00 00 00 00" },
          { icon: MessageSquare, title: "WhatsApp Business", desc: "+225 01 02 03 04 05" }
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
              <item.icon size={24} color="var(--primary)" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800 }}>{item.title}</h4>
              <p style={{ margin: 0, color: '#64748b' }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </LayoutStatic>
);

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
