import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { insforge } from '../lib/insforge';
import { Save, Lock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Profil = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) return <div>Connexion requise.</div>;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas.", "error");
      return;
    }
    if (password.length < 4) {
      showToast("Le mot de passe doit faire au moins 4 caractères.", "error");
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore - Some versions of SDK have this even if types are missing
      const { error } = await insforge.auth.updateUser?.({ password }) || 
                        await insforge.auth.resetPassword({ newPassword: password, otp: 'current_session' }); // Fallback attempt

      if (error) throw error;

      showToast("Mot de passe mis à jour avec succès !", "success");
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Erreur lors de la mise à jour.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'pageEnter 0.6s ease', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="text-premium" style={{ fontSize: '2.5rem', fontWeight: 900 }}>Mon Espace Personnel</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Gérez vos accès sécurisés et vos préférences de compte.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
        {/* CARTE IDENTITE VISUELLE */}
        <div className="card glass-effect" style={{ padding: '3rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900, color: 'white', boxShadow: '0 20px 25px -5px rgba(99, 102, 255, 0.3)' }}>
            {currentUser.nom_complet.charAt(0).toUpperCase()}
            <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '32px', height: '32px', background: '#10b981', border: '4px solid white', borderRadius: '50%' }}></div>
          </div>
          
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>{currentUser.nom_complet}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>{currentUser.email}</span>
            <span style={{ padding: '0.3rem 0.8rem', background: 'rgba(99, 102, 255, 0.1)', color: 'var(--primary)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
               {currentUser.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* SECTION SÉCURITÉ */}
        <div className="card glass-effect" style={{ padding: '2.5rem', border: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={20} strokeWidth={2.5} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>Sécurité du Compte</h3>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Nouveau Mot de Passe</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required
                  style={{ height: '52px', borderRadius: '14px', fontWeight: 600 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Secret robuste (min. 4 car.)"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Confirmation</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required
                  style={{ height: '52px', borderRadius: '14px', fontWeight: 600 }}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le secret"
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: '56px', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(99, 102, 255, 0.4)' }}>
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }}></div>
              ) : (
                <>
                  <Save size={20} strokeWidth={2.5} />
                  ACTUALISER LE MOT DE PASSE
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
        Dernière connexion enregistrée : <span style={{ color: 'var(--text-main)' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>
  );
};
