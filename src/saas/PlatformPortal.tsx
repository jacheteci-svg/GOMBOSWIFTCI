import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify' | 'success'>('form');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [otp, setOtp] = useState('');

  /* ── SETUP: Step 1 — Register ───────────── */
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
      showToast('Code OTP envoyé à votre email !', 'success');
      setStep('verify');
    } catch (err: any) {
      showToast(err.message || "Erreur lors de l'inscription", 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── SETUP: Step 2 — Verify OTP ─────────── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await insforge.auth.verifyEmail({ email, otp });
      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error('Session invalide après vérification.');

      /* Create SUPER_ADMIN profile securely using RPC */
      const { error: rpcErr } = await insforge.database.rpc('force_create_superadmin', {
        p_id: userId,
        p_email: email,
        p_nom: name
      });

      if (rpcErr) {
        console.error('RPC Error when creating SuperAdmin profile:', rpcErr);
        throw new Error('Erreur lors de la création du profil admin: ' + rpcErr.message);
      }

      setStep('success');
      showToast('✅ Compte SuperAdmin créé avec succès !', 'success');
    } catch (err: any) {
      showToast(err.message || 'Code OTP incorrect ou erreur de session', 'error');
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

      showToast('✅ Accès autorisé. Bienvenue au Gombo !', 'success');
      /* Full page reload so AuthContext re-fetches fresh profile */
      setTimeout(() => {
        window.location.href = '/super-admin';
      }, 1000);
    } catch {
      showToast('❌ Identifiants incorrects ou accès refusé.', 'error');
      setLoading(false);
    }
  };

  /* ── Shared styles ───────────────────────── */
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    height: '52px',
    borderRadius: '12px',
    color: 'white',
    paddingLeft: '3rem',
    fontSize: '1rem',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.5rem',
    display: 'block'
  };

  const btnStyle: React.CSSProperties = {
    height: '56px', borderRadius: '14px', fontWeight: 900,
    fontSize: '1rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    marginTop: '1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
    boxShadow: '0 16px 32px -8px rgba(99,102,241,0.45)',
    border: 'none', cursor: 'pointer', color: 'white', width: '100%',
    transition: 'opacity 0.2s'
  };

  const iconWrap: React.CSSProperties = {
    position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)'
  };

  /* ── RENDER ──────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '420px', height: '420px', background: 'radial-gradient(circle, #6366f1, transparent 70%)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: '420px', height: '420px', background: 'radial-gradient(circle, #a855f7, transparent 70%)', filter: 'blur(120px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '76px', height: '76px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '22px', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            {mode === 'setup' ? <Cpu size={36} color="#818cf8" /> : <ShieldCheck size={36} color="#818cf8" />}
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0, textTransform: 'uppercase' }}>
            {mode === 'setup' ? (step === 'verify' ? 'Vérification' : 'Platform Setup') : 'Gombo Portal'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.4rem' }}>
            System Administration Center
          </p>
        </div>

        {/* Card */}
        <div style={{ padding: '2.5rem', borderRadius: '28px', background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.9)' }}>

          {/* ── SUCCESS state ── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle2 size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>Compte Créé !</h2>
              <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6 }}>
                Votre compte <strong style={{ color: 'white' }}>SuperAdmin</strong> est prêt.<br />Connectez-vous pour accéder à la console globale.
              </p>
              {/* Use anchor tag for reliable full-page navigation */}
              <a href="/platform/login" style={{ ...btnStyle, textDecoration: 'none', fontSize: '0.95rem' }}>
                SE CONNECTER AU GOMBO <ArrowRight size={17} />
              </a>
            </div>
          )}

          {/* ── SETUP: OTP verification ── */}
          {mode === 'setup' && step === 'verify' && (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: '#94a3b8', textAlign: 'center', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
                Code envoyé à <strong style={{ color: 'white' }}>{email}</strong>
              </p>
              <div>
                <label style={labelStyle}>Code OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  style={{ ...inputStyle, paddingLeft: '1rem', fontSize: '1.8rem', textAlign: 'center', letterSpacing: '0.6em', fontWeight: 900, height: '68px' }}
                  placeholder="000000"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={18} /> CONFIRMER L'IDENTITÉ</>}
              </button>
              <button type="button" onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                ← Retour
              </button>
            </form>
          )}

          {/* ── SETUP: Registration form ── */}
          {mode === 'setup' && step === 'form' && (
            <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={labelStyle}>🔑 Master Access Key</label>
                <div style={{ position: 'relative' }}>
                  <Zap size={16} color="#6366f1" style={iconWrap} />
                  <input type="text" className="form-input" style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.08em' }} placeholder="GOMBO-EXPRESS-2026" required value={masterKey} onChange={e => setMasterKey(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Nom Complet</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#475569" style={iconWrap} />
                  <input type="text" className="form-input" style={inputStyle} placeholder="Ex: Koffi Armand" required value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#475569" style={iconWrap} />
                  <input type="email" className="form-input" style={inputStyle} placeholder="admin@gomboswiftci.app" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Mot de Passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#475569" style={iconWrap} />
                  <input type="password" className="form-input" style={inputStyle} placeholder="Min. 6 caractères" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={18} /> INITIALISER LE GOMBO</>}
              </button>
            </form>
          )}

          {/* ── LOGIN form ── */}
          {mode === 'login' && step === 'form' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={labelStyle}>Email Administrateur</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#475569" style={iconWrap} />
                  <input type="email" className="form-input" style={inputStyle} placeholder="admin@gomboswiftci.app" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Mot de Passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#475569" style={iconWrap} />
                  <input type="password" className="form-input" style={inputStyle} placeholder="••••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={18} /> AUTHORIZE ACCESS</>}
              </button>
            </form>
          )}

          {/* Footer link */}
          {step !== 'success' && (
            <div style={{ marginTop: '1.75rem', paddingTop: '1.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <Link to={mode === 'setup' ? '/platform/login' : '/platform/setup'} style={{ textDecoration: 'none', color: '#475569', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {mode === 'setup' ? 'Déjà configuré ? Se connecter →' : 'Première fois ? Initialiser →'}
              </Link>
            </div>
          )}
        </div>

        {/* Security badges */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', opacity: 0.3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>
            <Terminal size={12} /> Encrypted Session
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>
            <Zap size={12} /> Delta Shield Active
          </span>
        </div>
      </div>
    </div>
  );
};
