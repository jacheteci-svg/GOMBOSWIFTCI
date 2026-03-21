import React, { useState } from 'react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { LogIn, Loader2 } from 'lucide-react';

export const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await insforge.auth.verifyEmail({
        email: identifier,
        otp: verificationCode
      });

      if (error) throw error;

      // After verification, create profile and promote to admin
      const userId = data?.user?.id;
      if (userId) {
        await insforge.database.from('users').insert([{
          id: userId,
          email: identifier,
          role: 'ADMIN',
          nom_complet: 'Admin Principal',
          telephone: '0757228731',
          actif: true
        }]);
      }

      showToast('Compte vérifié avec succès !', 'success');
      window.location.href = '/dashboard';
    } catch (err: any) {
      showToast(err.message || 'Code incorrect', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { error } = await insforge.auth.signUp({
          email: identifier,
          password
        });

        if (error) throw error;
        showToast('Compte créé ! Veuillez entrer le code reçu par e-mail.', 'success');
        setIsVerifying(true);
      } else {
        // Sign In
        let finalEmail = identifier;
        
        if (!identifier.includes('@')) {
          // Try phone first
          let { data: userRecord, error: lookupError } = await insforge.database
            .from('users')
            .select('email')
            .eq('telephone', identifier)
            .single();

          // Try name if phone fails
          if (lookupError || !userRecord) {
            const { data: nameRecord, error: nameError } = await insforge.database
              .from('users')
              .select('email')
              .ilike('nom_complet', identifier)
              .single();
            
            if (nameError || !nameRecord) {
              showToast('Identifiant (Email, Tel ou Nom) non trouvé.', 'error');
              setLoading(false);
              return;
            }
            userRecord = nameRecord;
          }
          finalEmail = userRecord.email;
        }

        const { error } = await insforge.auth.signInWithPassword({
          email: finalEmail,
          password,
        });

        if (error) {
          showToast('Identifiant ou mot de passe incorrect.', 'error');
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur d\'authentification', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-v2" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* BACKGROUND BLOBS ENGINE */}
      <div className="blob-container">
        <div className="blob" style={{ width: '600px', height: '600px', background: '#4f46e5', top: '-200px', left: '-200px', animationDelay: '0s' }}></div>
        <div className="blob" style={{ width: '500px', height: '500px', background: '#9333ea', bottom: '-150px', right: '-150px', animationDelay: '-5s' }}></div>
        <div className="blob" style={{ width: '400px', height: '400px', background: '#6366f1', top: '20%', right: '10%', animationDelay: '-10s' }}></div>
      </div>

      <div className="glass-card-futuristic floating" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '4rem', 
        zIndex: 10,
        margin: '1.5rem'
      }}>
        {/* LOGO & TITRE FUTURISTE */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem', position: 'relative', zIndex: 2 }}>
          <div style={{ 
            width: '90px', 
            height: '90px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
            borderRadius: '28px', 
            margin: '0 auto 2rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99, 102, 255, 0.6), inset 0 0 15px rgba(255,255,255,0.3)',
            transform: 'rotate(-8deg)',
            border: '1px solid rgba(255,255,255,0.4)'
          }}>
            <LogIn size={44} color="white" strokeWidth={2.5} />
          </div>
          
          <h1 className="text-neon" style={{ 
            fontSize: '3rem', 
            fontWeight: 900, 
            margin: 0, 
            letterSpacing: '-0.04em',
            textTransform: 'uppercase'
          }}>GomboSwift</h1>
          
          <div style={{ 
            marginTop: '0.75rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px' 
          }}>
            <div style={{ height: '1px', width: '30px', background: 'rgba(255,255,255,0.2)' }}></div>
            <p style={{ 
              color: 'rgba(255,255,255,0.8)', 
              fontSize: '0.9rem', 
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em'
            }}>Nexus Logistique</p>
            <div style={{ height: '1px', width: '30px', background: 'rgba(255,255,255,0.2)' }}></div>
          </div>
        </div>

        {isVerifying ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', zIndex: 2 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Code d'Authentification</label>
              <input
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="form-input input-futuristic"
                style={{ height: '64px', borderRadius: '20px', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.4em', fontWeight: 900 }}
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ height: '64px', borderRadius: '20px', fontWeight: 900, fontSize: '1.2rem', background: 'linear-gradient(90deg, #6366f1, #a855f7)', border: 'none', boxShadow: '0 15px 30px -5px rgba(99, 102, 255, 0.5)' }}
            >
              {loading ? <Loader2 className="animate-spin" /> : "VÉRIFIER LE SIGNAL"}
            </button>
            
            <button 
              type="button" 
              onClick={() => setIsVerifying(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}
            >
              Annuler la demande
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', position: 'relative', zIndex: 2 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {isSignUp ? 'Identité Digitale (Email)' : 'Identifiant de Connexion'}
              </label>
              <input
                type={isSignUp ? 'email' : 'text'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="form-input input-futuristic"
                style={{ height: '60px', borderRadius: '18px', fontWeight: 600 }}
                placeholder={isSignUp ? 'nom@secteur.ci' : 'Email ou Mobile'}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Clé d'Accès</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input input-futuristic"
                style={{ height: '60px', borderRadius: '18px', fontWeight: 600 }}
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ height: '64px', borderRadius: '20px', fontWeight: 900, fontSize: '1.2rem', background: 'linear-gradient(90deg, #6366f1, #a855f7)', border: 'none', boxShadow: '0 15px 30px -5px rgba(99, 102, 255, 0.5)', marginTop: '1rem' }}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (isSignUp ? "INITIALISER L'ACCÈS" : "DÉVERROUILLER L'ACCÈS")}
            </button>
          </form>
        )}

        <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem', position: 'relative', zIndex: 2 }}>
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', 
              padding: '0.75rem 1.5rem',
              borderRadius: '14px',
              cursor: 'pointer', 
              fontWeight: 800, 
              fontSize: '0.85rem', 
              letterSpacing: '0.05em',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {isSignUp ? 'FLUX VERS CONNEXION' : 'PAS DE COMPTE ? CRÉER SIGNAL'}
          </button>
          
          <div style={{ 
            marginTop: '2rem', 
            color: 'rgba(255,255,255,0.4)', 
            fontSize: '0.75rem', 
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
             <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
             Système Sécurisé & Chiffré
          </div>
        </div>
      </div>
    </div>
  );
};
