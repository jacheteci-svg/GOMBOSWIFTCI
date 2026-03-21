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
    <div className="login-wrapper" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at top left, #4f46e5 0%, #1e1b4b 100%)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Éléments décoratifs en arrière-plan */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'rgba(99, 102, 255, 0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '30vw', height: '30vw', background: 'rgba(79, 70, 229, 0.15)', borderRadius: '50%', filter: 'blur(100px)' }}></div>

      <div className="card glass-effect" style={{ 
        width: '100%', 
        maxWidth: '480px', 
        padding: '3.5rem', 
        border: '1px solid rgba(255,255,255,0.15)', 
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        animation: 'modalEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', 
            borderRadius: '24px', 
            margin: '0 auto 1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 15px 25px -5px rgba(99, 102, 255, 0.4)',
            transform: 'rotate(-5deg)'
          }}>
            <LogIn size={40} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 900, 
            margin: 0, 
            color: 'white', 
            letterSpacing: '-0.03em',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>ECOM-360</h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '1.1rem', 
            marginTop: '0.5rem',
            fontWeight: 500
          }}>Plateforme Logistique Intégrée</p>
        </div>

        {isVerifying ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>Code secret (reçu par email)</label>
              <input
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="form-input"
                style={{ height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.5em', fontWeight: 900 }}
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ height: '60px', borderRadius: '18px', fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 10px 15px -3px rgba(99, 102, 255, 0.5)' }}
            >
              {loading ? <Loader2 className="animate-spin" /> : "VÉRIFIER LE COMPTE"}
            </button>
            <button 
              type="button" 
              onClick={() => setIsVerifying(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Retour au formulaire
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                {isSignUp ? 'VOTRE ADRESSE EMAIL' : 'IDENTIFIANT D\'ACCÈS'}
              </label>
              <input
                type={isSignUp ? 'email' : 'text'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="form-input"
                style={{ height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}
                placeholder={isSignUp ? 'contact@entreprise.com' : 'Email ou Mobile'}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>CLÉ DE SÉCURITÉ</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 600 }}
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ height: '60px', borderRadius: '18px', fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 10px 15px -3px rgba(99, 102, 255, 0.5)' }}
            >
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "CRÉER MON ACCÈS" : "DÉVERROUILLER L'ACCÈS")}
            </button>
          </form>
        )}

        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em' }}
          >
            {isSignUp ? 'DÉJÀ RÉFÉRENCÉ ? SE CONNECTER' : 'PAS ENCORE DE COMPTE ? S\'INSCRIRE'}
          </button>
          <div style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: 500 }}>
             Accès restreint. Monitoring de sécurité actif.
          </div>
        </div>
      </div>
    </div>
  );
};
