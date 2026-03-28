import React, { useState } from 'react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { Building, User, Mail, Lock, Globe, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const RegisterTenant: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the Tenant first
      // In a real app, you might want to check if slug is unique first
      const { data: tenantData, error: tenantError } = await insforge.database
        .from('tenants')
        .insert([{
          nom: tenantName,
          slug: tenantSlug.toLowerCase().replace(/[^a-z0-9]/g, ''),
          email_contact: email,
          plan: 'FREE',
          actif: true
        }])
        .select()
        .single();

      if (tenantError) throw new Error("Erreur lors de la création de l'organisation: " + tenantError.message);

      const tenantId = tenantData.id;

      // 2. Sign up the Admin User
      const { data: authData, error: authError } = await insforge.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;

      const userId = authData?.user?.id;
      if (!userId) throw new Error("Erreur d'authentification lors de la création du compte.");

      // 3. Create the User Profile linked to the Tenant
      const { error: profileError } = await insforge.database.from('users').insert([{
        id: userId,
        email,
        role: 'ADMIN',
        nom_complet: adminName,
        tenant_id: tenantId,
        actif: true
      }]);

      if (profileError) throw profileError;

      showToast("Organisation créée avec succès ! Veuillez vérifier votre email pour confirmer votre compte.", "success");
      
      // Auto-login or redirect to login
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Une erreur est survenue lors de l'inscription.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top left, #f8fafc 0%, #ffffff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', maxWidth: '1100px', width: '100%', gap: '4rem', alignItems: 'center' }}>
        
        {/* Left Side: Brand & Info */}
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '14px', color: 'white' }}>
              <Building size={32} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.04em' }}>GomboSwiftCI SaaS</span>
          </div>
          
          <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', color: '#0f172a' }}>
            Créez votre espace logistique en 60 secondes.
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Rejoignez des centaines d'entreprises qui optimisent leur livraison avec GomboSwiftCI. 
            Pas de carte bancaire requise pour commencer.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { icon: ShieldCheck, title: "Isolation Totale", desc: "Vos données sont strictement séparées et sécurisées." },
              { icon: Globe, title: "Déploiement Instantané", desc: "Votre instance est prête dès la validation du compte." }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
                  <item.icon size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1rem' }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="card glass-effect" style={{ padding: '3rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>Détails de l'Organisation</h2>
          
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Nom de l'entreprise</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Ex: Ivoire Express" 
                  style={{ paddingLeft: '3rem', height: '52px', borderRadius: '14px' }}
                  value={tenantName}
                  onChange={e => {
                    setTenantName(e.target.value);
                    if (!tenantSlug) setTenantSlug(e.target.value.toLowerCase().replace(/ /g, '-'));
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Identifiant URL (Slug)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="nom-entreprise" 
                  style={{ paddingRight: '120px', height: '52px', borderRadius: '14px' }}
                  value={tenantSlug}
                  onChange={e => setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                  .gomboswiftci.ci
                </span>
              </div>
            </div>

            <div style={{ height: '1px', background: '#f1f5f9', margin: '1rem 0' }}></div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Compte Administrateur</h2>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Nom complet de l'admin</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Prénom et Nom" 
                  style={{ paddingLeft: '3rem', height: '52px', borderRadius: '14px' }}
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Email professionnel</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  placeholder="contact@entreprise.ci" 
                  style={{ paddingLeft: '3rem', height: '52px', borderRadius: '14px' }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  placeholder="Min. 6 caractères" 
                  style={{ paddingLeft: '3rem', height: '52px', borderRadius: '14px' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary" 
              style={{ height: '60px', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', marginTop: '1rem', gap: '0.75rem', width: '100%' }}
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>CRÉER MON ESPACE <ArrowRight size={20} /></>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
              En vous inscrivant, vous acceptez nos <Link to="/terms" style={{ color: 'var(--primary)', fontWeight: 600 }}>Conditions d'Utilisation</Link>.
            </p>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
            Déjà client ? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
