import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight,
  Zap,
  ChevronDown,
  PieChart,
  Target,
  TrendingUp,
  ShieldCheck,
  Rocket,
  Layout
} from 'lucide-react';
import { Pricing } from './Pricing';
import { LandingNavbar } from '../components/layout/LandingNavbar';

export const LandingPage: React.FC = () => {
  console.log("LandingPage rendering on path:", window.location.pathname);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Scroll Reveal Logic
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: '#020617', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <LandingNavbar />
      
      {/* Dynamic Background Noise/Glows */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>


      {/* Immersive Hero Section */}
      <header style={{ 
        padding: '6rem 2rem 10rem', 
        textAlign: 'center', 
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            padding: '0.6rem 1.25rem', 
            background: 'rgba(99, 102, 241, 0.1)', 
            color: '#818cf8', 
            borderRadius: '50px', 
            fontSize: '0.85rem', 
            fontWeight: 800, 
            marginBottom: '2.5rem',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <Zap size={14} fill="currentColor" />
            VOTRE LOGISTIQUE SOUS STÉROÏDES : DISPONIBLE MAINTENANT
          </div>
          
          <h1 style={{ 
            fontSize: '5rem', 
            fontWeight: 950, 
            lineHeight: 1, 
            marginBottom: '1.5rem', 
            letterSpacing: '-0.05em',
            background: 'linear-gradient(to bottom, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '1200px',
            margin: '0 auto 1.5rem'
          }}>
            Ne Gérez Plus. <br/> <span style={{ color: '#6366f1' }}>Maîtrisez</span> votre Croissance.
          </h1>
          
          <p style={{ fontSize: '1.3rem', color: '#94a3b8', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '850px', margin: '0 auto 3rem' }}>
            L'infrastructure logistique intelligente n°1 en Côte d'Ivoire. 
            Maîtrisez votre stock, vos livreurs et votre trésorerie avec une précision chirurgicale. 
            <span style={{ color: 'white', display: 'block', marginTop: '0.5rem', fontWeight: 600 }}>Déjà 45 000+ commandes traitées en toute sécurité.</span>
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '4rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="hero-cta" style={{ 
              padding: '1.2rem 2.5rem', 
              borderRadius: '16px', 
              fontSize: '1.1rem', 
              fontWeight: 800, 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
              color: 'white', 
              boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.5)',
              transition: 'transform 0.3s ease'
            }}>
              DÉMARRER MAINTENANT <ArrowRight size={20} />
            </Link>
            <Link to="/demo" style={{ padding: '1.2rem 2.5rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', textDecoration: 'none' }}>
              Voir la Démo Live
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', opacity: 0.6, marginBottom: '5rem', flexWrap: 'wrap' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                <ShieldCheck size={18} /> ISOLATION DES DONNÉES
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                <Zap size={18} /> DÉPLOIEMENT INSTANTANÉ
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                <PieChart size={18} /> RAPPORTS AUDITÉS
             </div>
          </div>

          {/* Perspective Dashboard Mockup */}
          <div style={{ position: 'relative', marginTop: '4rem', padding: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(to right, #6366f1, #a855f7)', 
              padding: '2px', 
              borderRadius: '24px', 
              transform: 'perspective(1500px) rotateX(15deg) translateY(-50px)',
              boxShadow: '0 100px 100px -30px rgba(0,0,0,0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
              animation: 'mockupIn 1.5s ease-out forwards'
            }}>
              <img 
                src="dashboard_mockup_premium_1774751906087.png" 
                alt="Infrastructure Dashboard" 
                style={{ width: '100%', height: 'auto', borderRadius: '22px', display: 'block' }}
              />
            </div>
            {/* Floating Card */}
            <div style={{ position: 'absolute', top: '20%', left: '-5%', padding: '1.5rem', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', animation: 'float 6s ease-in-out infinite' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ background: '#10b98120', color: '#10b981', padding: '0.4rem', borderRadius: '8px' }}><Zap size={20}/></div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>99.9%</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Livraisons Réussies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Ribbon */}
      <section style={{ padding: '6rem 2rem', background: 'rgba(99, 102, 241, 0.05)', borderTop: '1px solid rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.02)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10rem', flexWrap: 'wrap' }}>
          {[
            { v: "+250%", l: "ROI Moyenné", c: "#10b981" },
            { v: "24/7", l: "Uptime Système", c: "#6366f1" },
            { v: "0ms", l: "Latence Données", c: "#a855f7" }
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '3rem', fontWeight: 950, color: s.c, marginBottom: '0.5rem' }}>{s.v}</div>
              <div style={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow: How it Works */}
      <section style={{ padding: '10rem 2rem', background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '8rem' }} className="reveal">
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2.5rem' }}>Une révolution en 4 étapes</h2>
            <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto' }}>Passez de l'anarchie logistique à l'excellence opérationnelle en moins de 24 heures.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', position: 'relative' }}>
            {/* Connecting Line (Desktop) */}
            <div className="mobile-hide" style={{ position: 'absolute', top: '35%', left: '10%', right: '10%', height: '2px', background: 'linear-gradient(to right, transparent, rgba(99, 102, 241, 0.3), transparent)', zIndex: 0 }}></div>
            
            {[
              { n: '01', t: 'Déploiement', d: 'Réservez votre instance SaaS. Vos données sont isolées et sécurisées instantanément.', i: Rocket },
              { n: '02', t: 'Configuration', d: 'Importez vos stocks et configurez vos livreurs. Notre IA optimise vos zones.', i: Layout },
              { n: '03', t: 'Exploitation', d: 'Gérez vos flux en temps réel. Notifications WhatsApp automatiques partent.', i: Zap },
              { n: '04', t: 'Analyse', d: 'Auditez votre trésorerie et vos marges avec des rapports de précision.', i: PieChart }
            ].map((step, i) => (
              <div key={i} className="reveal" style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s ease' }}>
                <div style={{ fontSize: '4rem', fontWeight: 950, color: 'rgba(99, 102, 241, 0.1)', marginBottom: '-2rem', position: 'relative' }}>{step.n}</div>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                  <step.i size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>{step.t}</h3>
                <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6 }}>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section id="features" style={{ padding: '12rem 2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '8rem' }} className="reveal">
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem' }}>La logistique traditionnelle est <span style={{ color: '#f43f5e' }}>Morte</span>.</h2>
            <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto' }}>Arrêtez de lutter avec des Excel obsolètes et des livreurs en retard. Adoptez l'intelligence GomboSwiftCI.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
            {[
              { t: 'Perte de Traçabilité ?', d: 'GomboSwiftCI suit chaque mouvement, du pick-up à l\'encaissement final, avec une précision chirurgicale.', i: PieChart },
              { t: 'Trésorerie dans le Flou ?', d: 'Nos rapports en temps réel éliminent les écarts de caisse. Chaque franc est audité automatiquement.', i: TrendingUp },
              { t: 'Clients Insatisfaits ?', d: 'Notifications WhatsApp pro-actives et notifications de livraison automatiques pour une fidélisation sans effort.', i: Target }
            ].map((item, i) => (
              <div key={i} className="reveal premium-card" style={{ padding: '3.5rem 3rem', borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem', color: 'white', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}>
                  <item.i size={35} />
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem' }}>{item.t}</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '1.1rem' }}>{item.d}</p>
                <div className="card-shine"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '6rem 2rem', background: '#0a0f1e' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Propulsé par le succès de nos partenaires</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {[
              { name: "Yaya Touré", role: "Directeur Logistique", company: "CI-Business", text: "On a triplé notre nombre de commandes quotidiennes sans embaucher un seul agent administratif de plus. La CAISSE est magique.", initial: "YT" },
              { name: "Marie-Louise", role: "Fondatrice", company: "E-Boutique Luxe", text: "Enfin une interface que mon équipe adore utiliser. Moderne, rapide et surtout fiable.", initial: "ML" },
              { name: "Koffi Serge", role: "Propriétaire", company: "Swift Express", text: "Le module WhatsApp est notre arme secrète. Nos clients nous recommandent pour notre sérieux.", initial: "KS" }
            ].map((t, i) => (
              <div key={i} style={{ padding: '3rem', borderRadius: '32px', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
                <div style={{ fontSize: '4rem', color: '#6366f120', position: 'absolute', top: '1rem', left: '2rem', fontFamily: 'serif' }}>“</div>
                <p style={{ fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6, color: '#f8fafc', position: 'relative', zIndex: 1 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(to bottom, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white' }}>{t.initial}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{t.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{t.role}, {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
         </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '10rem 2rem', background: '#020617' }}>
        <Pricing />
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '10rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, textAlign: 'center', marginBottom: '6rem' }}>Questions Fréquentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { q: 'Est-ce vraiment facile à prendre en main ?', a: 'Oui. GomboSwiftCI est conçu comme une application grand public. 15 minutes suffisent pour former un agent.' },
              { q: 'Puis-je utiliser mon propre domaine ?', a: 'Absolument. Nos offres Premium et Custom permettent un hébergement entièrement personnalisé.' },
              { q: 'Mes données sont-elles vraiment en sécurité ?', a: 'Plus que n\'importe où. Nous utilisons l\'infrastructure cloud leader mondiale avec isolation cryptographique totale.' },
              { q: 'Comment fonctionne le module WhatsApp ?', a: 'Il est intégré nativement. Vous pouvez envoyer des confirmations de commande et des rappels de livraison en un clic.' }
            ].map((faq, i) => (
              <div key={i} 
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                style={{ 
                   padding: '2rem', 
                  borderRadius: '20px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>{faq.q}</h4>
                  <ChevronDown size={24} style={{ transform: activeFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                </div>
                {activeFaq === i && (
                  <p style={{ marginTop: '1.5rem', color: '#94a3b8', lineHeight: 1.6, fontSize: '1.05rem' }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '12rem 2rem', textAlign: 'center', position: 'relative' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '8rem 4rem', 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
          borderRadius: '4rem',
          boxShadow: '0 50px 100px -20px rgba(99, 102, 241, 0.5)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <h2 style={{ fontSize: '4.5rem', fontWeight: 950, marginBottom: '2rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
            Rejoignez l'élite Logistique. <br/> <span style={{ color: 'rgba(255,255,255,0.7)' }}>Maintenant.</span>
          </h2>
          <p style={{ fontSize: '1.4rem', marginBottom: '4rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto 4.5rem' }}>
            Chaque minute passée sur un autre outil est une minute de profit perdue.
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <Link to="/register" style={{ padding: '1.5rem 4rem', borderRadius: '20px', fontSize: '1.4rem', fontWeight: 900, textDecoration: 'none', background: 'white', color: '#6366f1', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              Démarrer le Futur Gratuitement
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
