import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Loader2, 
  ArrowRight, 
  Terminal,
  Cpu,
  Zap,
  CheckCircle2
} from 'lucide-react';

/* Master Key for Setup - Security check */
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
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [masterKey, setMasterKey] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    /* Trim whitespace to avoid copy-paste issues */
    if (masterKey.trim() !== MASTER_KEY.trim()) {
      showToast(`Code Maître invalide. Vous avez entré: "${masterKey.trim()}"`, "error");
      return;
    }

    setLoading(true);
    try {
      /* 1. Create Auth User */
      const { data: authData, error: authError } = await insforge.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;
      const userId = authData?.user?.id;
      if (!userId) throw new Error("Erreur de session");

      /* 2. Create Profile with SUPER_ADMIN role */
      const { error: profileError } = await insforge.database.from('users').insert([{
        id: userId,
        email,
        role: 'SUPER_ADMIN',
        nom_complet: name,
        tenant_id: null, // Global access
        actif: true
      }]);

      if (profileError) throw profileError;

      setIsSuccess(true);
      showToast("Compte SuperAdmin créé avec succès !", "success");
    } catch (err: any) {
      showToast(err.message || "Erreur de configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await insforge.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      showToast("Accès autorisé. Bienvenue au centre de contrôle.", "success");
      navigate('/super-admin');
    } catch (err: any) {
      showToast("Identifiants incorrects ou accès refusé.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#020617', 
      color: '#f8fafc', 
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Nexus Cyber Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 10 }}>
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.3)', 
            borderRadius: '24px', 
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            {mode === 'setup' ? <Cpu size={38} color="#818cf8" /> : <ShieldCheck size={38} color="#818cf8" />}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0, textTransform: 'uppercase' }}>
             {mode === 'setup' ? 'Platform Setup' : 'Nexus Portal'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>
            System Administration Center
          </p>
        </div>

        {isSuccess ? (
          <div className="card glass-effect" style={{ padding: '3rem', borderRadius: '32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Identité Confirmée</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Le compte SuperAdmin a été initialisé. Vous avez désormais un accès total à l'infrastructure logistique.</p>
            <Link to="/platform/login" className="btn btn-primary" style={{ height: '56px', borderRadius: '14px', width: '100%', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              SE CONNECTER AU NEXUS
            </Link>
          </div>
        ) : (
          <div className="card glass-effect" style={{ 
            padding: '3.5rem 3rem', 
            borderRadius: '32px', 
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)'
          }}>
            <form onSubmit={mode === 'setup' ? handleSetup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {mode === 'setup' && (
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Master Access Key</label>
                  <div style={{ position: 'relative' }}>
                    <Zap size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                    <input 
                      type="text"
                      className="form-input" 
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', height: '52px', borderRadius: '12px', color: 'white', paddingLeft: '3rem', fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      placeholder="GOMBO-EXPRESS-2026"
                      required
                      value={masterKey}
                      onChange={e => setMasterKey(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {mode === 'setup' && (
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Platform Admin Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', height: '52px', borderRadius: '12px', color: 'white', paddingLeft: '3rem' }}
                      placeholder="Root Operator"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Identity (Email)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', height: '52px', borderRadius: '12px', color: 'white', paddingLeft: '3rem' }}
                    placeholder="nexus-admin@gomboswiftci.app"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Security Vault Key</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', height: '52px', borderRadius: '12px', color: 'white', paddingLeft: '3rem' }}
                    placeholder="••••••••••••"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary" 
                style={{ 
                  height: '60px', 
                  borderRadius: '16px', 
                  fontWeight: 900, 
                  fontSize: '1.2rem', 
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)'
                }}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    {mode === 'setup' ? 'INITIALIZE NEXUS' : 'AUTHORIZE ACCESS'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
               <Link to={mode === 'setup' ? '/platform/login' : '/platform/setup'} style={{ textDecoration: 'none', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {mode === 'setup' ? 'Return to Identity Verification' : "New Infrastructure? Deploy Admin Hub"}
               </Link>
            </div>
          </div>
        )}

        {/* Security Badges */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '2rem', opacity: 0.4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
              <Terminal size={14} /> Encrypted Session
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
              <Zap size={14} /> Delta Shield Active
            </div>
        </div>
      </div>

      <style>{`
        .glass-effect {
          background: rgba(2, 6, 23, 0.8) !important;
          backdrop-filter: blur(24px) !important;
        }
      `}</style>
    </div>
  );
};
