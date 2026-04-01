import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { Building, User, Mail, Lock, Globe, Loader2, ArrowRight, ShieldCheck, CheckCircle2, Rocket, ExternalLink, CreditCard } from 'lucide-react';
import { monerooService } from '../services/monerooService';
import { Link, useSearchParams } from 'react-router-dom';
import { Plan } from '../types';

export const RegisterTenant: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedPlan = (searchParams.get('plan') as Plan) || 'FREE';

  // Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [createdTenantId, setCreatedTenantId] = useState('');

  // Auto-generate slug from name
  useEffect(() => {
    if (tenantName && !tenantSlug) {
      const generated = tenantName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setTenantSlug(generated);
    }
  }, [tenantName]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedSlug = tenantSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!normalizedSlug) throw new Error("Veuillez choisir un identifiant URL valide.");

      // 1. Check if slug is already taken
      const { data: existingTenant } = await insforge.database
        .from('tenants')
        .select('id')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (existingTenant) {
        throw new Error("Cet identifiant URL (slug) est déjà utilisé par une autre organisation. Veuillez en choisir un autre.");
      }

      // 2. Create the Tenant
      const { data: tenantData, error: tenantError } = await insforge.database
        .from('tenants')
        .insert([{
          nom: tenantName,
          slug: normalizedSlug,
          email_contact: email,
          plan: selectedPlan,
          actif: selectedPlan === 'FREE' // Inactif par défaut pour les plans payants
        }])
        .select()
        .single();

      if (tenantError) throw new Error("Erreur lors de la création de l'organisation: " + tenantError.message);

      setCreatedTenantId(tenantData.id);

      // 3. Sign up the Admin User (triggers email)
      const { error: authError } = await insforge.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;

      showToast("Organisation réservée ! Veuillez entrer le code reçu par email.", "success");
      setIsVerifying(true);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Une erreur est survenue lors de l'inscription.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Verify OTP
      const { data: authData, error: verifyError } = await insforge.auth.verifyEmail({
        email,
        otp: verificationCode
      });

      if (verifyError) throw verifyError;

      const userId = authData?.user?.id;
      if (!userId) throw new Error("Session invalide après vérification.");

      // 2. Create Profile
      const { error: profileError } = await insforge.database.from('users').insert([{
        id: userId,
        email,
        role: 'ADMIN',
        nom_complet: adminName,
        tenant_id: createdTenantId,
        actif: true
      }]);

      if (profileError) throw profileError;

      // Facebook Pixel: Track successful registration
      if ((window as any).fbq) {
        (window as any).fbq('track', 'CompleteRegistration', {
          content_name: 'Tenant Registration',
          status: 'success',
          predicted_ltv: createdTenantId // usage of ID as reference
        });
      }

      setIsSuccess(true);
      showToast("Compte vérifié et prêt ! Bienvenue.", "success");
    } catch (err: any) {
      showToast(err.message || "Code incorrect ou erreur de profil.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data: planData } = await insforge.database
        .from('saas_plans')
        .select('*')
        .eq('id', selectedPlan)
        .maybeSingle();
      
      const price = planData?.price_fcfa || 0;
      
      if (price === 0) {
          window.location.href = `/${tenantSlug}`;
          return;
      }

      const checkoutUrl = await monerooService.initializeSubscription({
        amount: price,
        currency: 'XOF',
        customer: {
          name: adminName,
          email: email
        },
        reference_id: selectedPlan,
        type: 'SUBSCRIPTION',
        tenant_id: createdTenantId
      });

      if (checkoutUrl) {
          window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      showToast(error.message || "Erreur paiement", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await insforge.auth.resendVerificationEmail({ 
        email: email 
      });
      if (error) throw error;
      showToast("Un nouveau code a été envoyé !", "success");
    } catch (err: any) {
      showToast(err.message || "Erreur lors du renvoi du code", "error");
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
            <div style={{ flexShrink: 0 }}>
              <img src="/favicon.png" alt="Logo" style={{ width: 50, height: 50, borderRadius: 14, objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.04em' }}>GomboSwiftCI SaaS</span>
          </div>
          
          <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', color: '#0f172a' }}>
            {isSuccess ? "Félicitations ! Votre espace est prêt." : (selectedPlan === 'CUSTOM' ? "Créez votre version unique de GomboSwiftCI." : "Créez votre espace logistique en 60 secondes.")}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            {isSuccess 
              ? "Votre organisation a été configurée avec succès. Vous pouvez maintenant accéder à votre tableau de bord personnalisé."
              : (selectedPlan === 'CUSTOM' 
                  ? "Bénéficiez d'une instance totalement isolée et personnalisée selon vos processus métiers spécifiques."
                  : "Rejoignez des centaines d'entreprises qui optimisent leur livraison avec GomboSwiftCI. Pas de carte bancaire requise pour commencer.")}
          </p>

          {!isSuccess && (
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
          )}
        </div>

        {/* Right Side: Form / Success */}
        <div className="card glass-effect" style={{ padding: '3rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.05)', textAlign: isSuccess ? 'left' : 'left' }}>
          {isSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={40} />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>Bienvenue à bord, {adminName} !</h2>
                <p style={{ color: '#64748b' }}>Votre infrastructure logistique est prête à l'emploi.</p>
              </div>

              <div style={{ background: 'var(--primary-glow)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--primary-border)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Rocket size={16} /> ÉTAPES DE DÉMARRAGE
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    "Configurez vos zones de livraison",
                    "Ajoutez vos premiers produits au stock",
                    "Créez un compte pour votre premier livreur",
                    "Connectez votre compte WhatsApp Business"
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.95rem', color: '#475569' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: '2px solid #cbd5e1', flexShrink: 0 }}></div>
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ width: '100%', padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Votre URL d'accès direct :</span>
                <code style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 800, wordBreak: 'break-all' }}>
                  https://{tenantSlug}.gomboswiftci.ci
                </code>
              </div>

              {selectedPlan === 'FREE' ? (
                <button 
                  onClick={() => window.location.href = `/${tenantSlug}`}
                  className="btn btn-primary"
                  style={{ height: '60px', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                >
                  LANCER LE DASHBOARD <ExternalLink size={20} />
                </button>
              ) : (
                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ height: '60px', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', border: 'none' }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <> PAYER & ACTIVER MON ESPACE <CreditCard size={20} /> </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                  {isVerifying ? "Vérification" : "Inscription"}
                </h2>
                {!isVerifying && (
                  <span style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                    PLAN: {selectedPlan}
                  </span>
                )}
              </div>
              
              {isVerifying ? (
                <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    Un code de vérification a été envoyé à <strong>{email}</strong>. 
                    Veuillez l'entrer ci-dessous pour activer votre espace.
                  </p>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>Code de vérification</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="000000" 
                      style={{ height: '60px', borderRadius: '16px', fontSize: '1.5rem', textAlign: 'center', fontWeight: 900, letterSpacing: '0.5em' }}
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn btn-primary" 
                    style={{ height: '60px', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', marginTop: '1rem', width: '100%' }}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "CONFIRMER & CRÉER LE COMPTE"}
                  </button>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button 
                      type="button" 
                      onClick={handleResend}
                      disabled={loading}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      Renvoyer le code
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button 
                      type="button" 
                      onClick={() => setIsVerifying(false)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      Retourner aux détails
                    </button>
                  </div>
                </form>
              ) : (
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
                        onChange={e => setTenantName(e.target.value)}
                      />
                    </div>
                    {tenantSlug && (
                      <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Votre lien personnalisé :</span>
                        <code style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 700 }}>
                          https://{tenantSlug}.gomboswiftci.app
                        </code>
                      </div>
                    )}
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
                        .gomboswiftci.app
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
              )}
            </>
          )}
          
          {!isSuccess && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
              Déjà client ? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Se connecter</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
