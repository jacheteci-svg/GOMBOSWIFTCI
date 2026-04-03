import { useState, useEffect } from 'react';
import { Building2, ImageIcon, MapPin, Save } from 'lucide-react';
import { insforge } from '../../lib/insforge';
import type { Tenant } from '../../types';
import { useSaas } from '../../saas/SaasProvider';

type Props = {
  tenant: Tenant;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
};

export const TenantIdentityPanel = ({ tenant, showToast }: Props) => {
  const { refreshSaasData } = useSaas();
  const [loading, setLoading] = useState(false);
  const [nom, setNom] = useState(tenant.nom || '');
  const [email, setEmail] = useState(tenant.email_contact || '');
  const [telephone, setTelephone] = useState(tenant.telephone_contact || '');
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url || '');
  const [adresse, setAdresse] = useState('');
  const [visuelUrl, setVisuelUrl] = useState('');

  useEffect(() => {
    setNom(tenant.nom || '');
    setEmail(tenant.email_contact || '');
    setTelephone(tenant.telephone_contact || '');
    setLogoUrl(tenant.logo_url || '');
    const s =
      tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
        ? (tenant.settings as Record<string, unknown>)
        : {};
    setAdresse(typeof s.adresse_siege === 'string' ? s.adresse_siege : '');
    const v =
      (typeof s.document_visuel_url === 'string' && s.document_visuel_url) ||
      (typeof s.cv_url === 'string' && s.cv_url) ||
      '';
    setVisuelUrl(v);
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant.id) return;
    setLoading(true);
    try {
      const prev =
        tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
          ? (tenant.settings as Record<string, unknown>)
          : {};
      const settings = {
        ...prev,
        adresse_siege: adresse.trim(),
        document_visuel_url: visuelUrl.trim() || undefined,
        cv_url: visuelUrl.trim() || undefined,
      };

      const { error } = await insforge.database
        .from('tenants')
        .update({
          nom: nom.trim() || tenant.nom,
          email_contact: email.trim(),
          telephone_contact: telephone.trim() || null,
          logo_url: logoUrl.trim() || null,
          settings,
        })
        .eq('id', tenant.id);

      if (error) throw error;
      showToast('Identité entreprise enregistrée.', 'success');
      await refreshSaasData();
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Erreur enregistrement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card glass-effect" style={{ padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(59,130,246,0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <Building2 size={26} strokeWidth={2.2} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>
            Identité sur documents
          </h3>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
            Ces informations figurent sur les factures et feuilles de route PDF (pas les coordonnées du logiciel SaaS).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>
            Nom de l&apos;entreprise
          </label>
          <input
            className="form-input"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            style={{ borderRadius: '14px', minHeight: '52px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>
              E-mail de contact
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ borderRadius: '14px', minHeight: '52px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>
              Téléphone
            </label>
            <input
              className="form-input"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+225 …"
              style={{ borderRadius: '14px', minHeight: '52px' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <MapPin size={16} /> Adresse / siège (factures & feuilles de route)
          </label>
          <textarea
            className="form-input"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            rows={3}
            placeholder="Quartier, ville, pays…"
            style={{ borderRadius: '14px', resize: 'vertical', minHeight: '88px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <ImageIcon size={16} /> URL du logo
            </label>
            <input
              className="form-input"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://… (image PNG/JPG accessible en HTTPS)"
              style={{ borderRadius: '14px', minHeight: '52px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <ImageIcon size={16} /> Visuel document (optionnel)
            </label>
            <input
              className="form-input"
              value={visuelUrl}
              onChange={(e) => setVisuelUrl(e.target.value)}
              placeholder="Bandeau / charte — même principe (URL HTTPS)"
              style={{ borderRadius: '14px', minHeight: '52px' }}
            />
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Affiché sur les PDF (facture et feuille de route) si l&apos;URL est joignable (CORS).
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            alignSelf: 'flex-start',
            minHeight: '54px',
            padding: '0 2rem',
            borderRadius: '16px',
            fontWeight: 900,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          {loading ? <span className="spinner" style={{ width: 22, height: 22 }} /> : <Save size={20} />}
          Enregistrer
        </button>
      </form>
    </div>
  );
};
