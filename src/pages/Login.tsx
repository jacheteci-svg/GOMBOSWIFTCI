import React, { useState } from 'react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { LogIn, Loader2 } from 'lucide-react';

export const Login = () => {
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalEmail = identifier;

      // Simple check: if it doesn't look like an email, assume it's a phone number
      if (!identifier.includes('@')) {
        const { data: userRecord, error: lookupError } = await insforge.database
          .from('users')
          .select('email')
          .eq('telephone', identifier)
          .single();

        if (lookupError || !userRecord) {
          showToast("Identifiant (Email ou Téléphone) non trouvé.", "error");
          setLoading(false);
          return;
        }
        finalEmail = userRecord.email;
      }

      const { error } = await insforge.auth.signInWithPassword({
        email: finalEmail,
        password
      });

      if (error) {
        showToast("Identifiant ou mot de passe incorrect.", "error");
      } else {
        showToast("Connexion réussie !", "success");
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      showToast("Une erreur est survenue lors de la connexion.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <LogIn size={32} color="white" />
          </div>
          <h1 className="login-title">ECOM-360</h1>
          <p className="login-subtitle">Système de Distribution & Logistique</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Email ou Numéro de téléphone</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="form-input"
              placeholder="votre@email.com ou 0102030405"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Se connecter"}
          </button>
        </form>

        <div className="login-footer">
          Besoin d'aide ? Contactez l'administrateur système.
        </div>
      </div>
    </div>
  );
};
