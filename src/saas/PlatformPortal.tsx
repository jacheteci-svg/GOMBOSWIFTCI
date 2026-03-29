import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { ShieldCheck, Lock, Mail, User, Loader2, ArrowRight, Terminal, Cpu, Zap, CheckCircle2 } from 'lucide-react';

const MASTER_KEY = 'GOMBO-EXPRESS-2026';

interface PlatformPortalProps {
  mode?: 'login' | 'setup';
}

export const PlatformPortal: React.FC<PlatformPortalProps> = ({ mode: propMode }) => {
  const [searchParams] = useSearchParams();
  const mode = propMode || searchParams.get('mode') || 'login';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify' | 'success'>('form');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [otp, setOtp] = useState('');

  /* ── SETUP: Step 1 ─────────────────────── */
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKey.trim() !== MASTER_KEY) {
      showToast(`Code Maître invalide. Reçu : "${masterKey.trim()}"`, 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await insforge.auth.signUp({ email, password });
      if (error) throw error;
      showToast('Code envoyé à votre email !', 'success');
      setStep('verify');
    } catch (err: any) {
      showToast(err.message || "Erreur d'inscription", 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── SETUP: Step 2 (OTP) ────────────────── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await insforge.auth.verifyEmail({ email, otp });
      if (error) throw error;
      const userId = data?.user?.id;
      if (!userId) throw new Error('Session invalide après vérification.');

      const { error: profileErr } = await insforge.database.from('users').insert([{
        id: userId, email, role: 'SUPER_ADMIN', nom_complet: name, tenant_id: null, actif: true
      }]);

      if (profileErr) {
        await insforge.database.from('users')
          .update({ role: 'SUPER_ADMIN', nom_complet: name, actif: true })
          .eq('id', userId);
      }

      setStep('success');
      showToast('Compte SuperAdmin créé avec succès !', 'success');
    } catch (err: any) {
      showToast(err.message || 'Code incorrect ou erreur de session', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── LOGIN ──────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await insforge.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Accès autorisé. Bienvenue au centre de contrôle.', 'success');
      navigate('/super-admin');
    } catch {
      showToast('Identifiants incorrects ou accès refusé.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── STYLES ─────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    height: '52px',
    borderRadius: '12px',
    color: 'white',
    paddingLeft: '3rem',
    fontSize: '1rem',
    width: '100%',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
    display: 'block'
  };

  const btnStyle: React.CSSProperties = {
    height: '60px', borderRadius: '16px', fontWeight: 900,
    fontSize: '1.1rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    marginTop: '1rem', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.75rem',
    boxShadow: '0 20px 40px -10px rgba(99,102,241,0.4)',
    border: 'none', cursor: 'pointer', color: 'white', width: '100%'
  };

  /* ── RENDER ─────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '24px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            {mode === 'setup' ? <Cpu size={38} color="#818cf8" /> : <ShieldCheck size={38} color="#818cf8" />}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0, textTransform: 'uppercase' }}>
            {mode === 'setup' ? (step === 'verify' ? 'Vérification' : 'Platform Setup') : 'Nexus Portal'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>
            System Administration Center
          </p>
        </div>

        {/* Card */}
        <div style={{ padding: '3rem', borderRadius: '32px', background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)' }}>

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Compte Créé !</h2>
              <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Votre compte <strong>SuperAdmin</strong> est prêt. Connectez-vous maintenant.</p>
              <Link to="/platform/login" style={{ ...btnStyle, textDecoration: 'none', display: 'flex' }}>
                SE CONNECTER AU NEXUS <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* ── SETUP: OTP ── */}
          {mode === 'setup' && step === 'verify' && (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                Code envoyé à <strong style={{ color: 'white' }}>{email}</strong>
              </p>
              <div>
                <label style={labelStyle}>Code de Vérification</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ ...inputStyle, paddingLeft: '1rem', fontSize: '1.8rem', textAlign: 'center', letterSpacing: '0.5em', fontWeight: 900, height: '64px' }}
                  placeholder="000000"
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle} className="btn btn-primary">
                {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle2 size={20} /> CONFIRMER L'IDENTITÉ</>}
              </button>
              <button type="button" onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                ← Retour
              </button>
            </form>
          )}

          {/* ── SETUP: Form ── */}
          {mode === 'setup' && step === 'form' && (
            <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>🔑 Master Access Key</label>
                <div style={{ position: 'relative' }}>
                  <Zap size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                  <input type="text" className="form-input" style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.05em' }} placeholder="GOMBO-EXPRESS-2026" required value={masterKey} onChange={e => setMasterKey(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Votre Nom Complet</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" className="form-input" style={inputStyle} placeholder="Ex: Koffi Armand" required value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Administrateur</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="email" className="form-input" style={inputStyle} placeholder="admin@gomboswiftci.app" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Mot de Passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="password" className="form-input" style={inputStyle} placeholder="Min. 6 caractères" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnStyle} className="btn btn-primary">
                {loading ? <Loader2 className="animate-spin" size={22} /> : <><ArrowRight size={20} /> INITIALISER LE NEXUS</>}
              </button>
            </form>
          )}

          {/* ── LOGIN: Form ── */}
          {mode === 'login' && step === 'form' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Email Administrateur</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="email" className="form-input" style={inputStyle} placeholder="admin@gomboswiftci.app" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Mot de Passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="password" className="form-input" style={inputStyle} placeholder="••••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnStyle} className="btn btn-primary">
                {loading ? <Loader2 className="animate-spin" size={22} /> : <><ShieldCheck size={20} /> AUTHORIZE ACCESS</>}
              </button>
            </form>
          )}

          {/* Footer link */}
          {step !== 'success' && (
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <Link to={mode === 'setup' ? '/platform/login' : '/platform/setup'} style={{ textDecoration: 'none', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {mode === 'setup' ? 'Déjà configuré ? Se connecter →' : 'Première utilisation ? Initialiser →'}
              </Link>
            </div>
          )}
        </div>

        {/* Security badges */}
        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '2rem', opacity: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
            <Terminal size={14} /> Encrypted Session
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
            <Zap size={14} /> Delta Shield Active
          </div>
        </div>
      </div>
    </div>
  );
};
