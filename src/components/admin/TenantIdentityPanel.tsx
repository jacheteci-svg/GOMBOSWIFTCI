import { useState, useEffect, useRef } from 'react';
import { Building2, ImageIcon, MapPin, Save, Upload, Loader2, Link as LinkIcon } from 'lucide-react';
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
  const [uploading, setUploading] = useState<'logo' | 'visuel' | null>(null);
  
  const [nom, setNom] = useState(tenant.nom || '');
  const [email, setEmail] = useState(tenant.email_contact || '');
  const [telephone, setTelephone] = useState(tenant.telephone_contact || '');
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url || '');
  const [adresse, setAdresse] = useState('');
  const [visuelUrl, setVisuelUrl] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const visuelInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'visuel') => {
    const file = e.target.files?.[0];
    if (!file || !tenant.id) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Fichier trop lourd (max 2Mo)", "error");
      return;
    }

    setUploading(target);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${target}_${Date.now()}.${ext}`;
      const filePath = `branding/${tenant.id}/${fileName}`;

      const { error } = await insforge.storage
        .from('public')
        .upload(filePath, file);

      if (error) throw error;

      const publicUrl = insforge.storage
        .from('public')
        .getPublicUrl(filePath);

      if (target === 'logo') setLogoUrl(publicUrl);
      else setVisuelUrl(publicUrl);

      showToast(`${target === 'logo' ? 'Logo' : 'Visuel'} prêt à être enregistré.`, "success");
    } catch (err: any) {
      console.error(err);
      showToast("Erreur lors de l'upload.", "error");
    } finally {
      setUploading(null);
    }
  };

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
      showToast('Configuration enregistrée avec succès.', 'success');
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
            Documents & Marque
          </h3>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
            Personnalisez vos factures et documents officiels avec votre propre identité visuelle.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>
            Nom Commercial (S’affiche sur vos documents)
          </label>
          <input
            className="form-input"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            placeholder="Nom officiel de votre entreprise"
            style={{ borderRadius: '14px', minHeight: '52px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>
              E-mail Support
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
              Téléphone Contact
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
            <MapPin size={16} /> Adresse du Siège (Bas de page PDF)
          </label>
          <textarea
            className="form-input"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            rows={3}
            placeholder="Imm, Quartier, Ville, Pays..."
            style={{ borderRadius: '14px', resize: 'vertical', minHeight: '88px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {/* LOGO SECTION */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <ImageIcon size={16} /> Logo Officiel
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <div 
                 style={{ 
                   width: '80px', 
                   height: '80px', 
                   background: 'rgba(255,255,255,0.03)', 
                   borderRadius: '16px', 
                   border: '2px dashed rgba(255,255,255,0.1)', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   overflow: 'hidden',
                   flexShrink: 0
                 }}
               >
                 {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={24} style={{ opacity: 0.2 }} />}
               </div>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="file" hidden ref={logoInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                  <button 
                    type="button"
                    onClick={() => logoInputRef.current?.click()} 
                    disabled={!!uploading}
                    className="btn btn-outline" 
                    style={{ borderRadius: '10px', height: '36px', minHeight: '36px', gap: '0.4rem', fontSize: '0.85rem' }}
                  >
                    {uploading === 'logo' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {logoUrl ? 'Changer Photo' : 'Uploader Photo'}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem' }}>
                    <LinkIcon size={12} style={{ opacity: 0.4 }} />
                    <input 
                      value={logoUrl} 
                      onChange={e => setLogoUrl(e.target.value)} 
                      placeholder="Ou lien HTTPS..." 
                      style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', width: '100%', outline: 'none' }} 
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* VISUAL SECTION */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <ImageIcon size={16} /> Visuel / Bandeau (PDF)
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <div 
                 style={{ 
                   width: '80px', 
                   height: '80px', 
                   background: 'rgba(255,255,255,0.03)', 
                   borderRadius: '16px', 
                   border: '2px dashed rgba(255,255,255,0.1)', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   overflow: 'hidden',
                   flexShrink: 0
                 }}
               >
                 {visuelUrl ? <img src={visuelUrl} alt="Visuel" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={24} style={{ opacity: 0.2 }} />}
               </div>
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="file" hidden ref={visuelInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'visuel')} />
                  <button 
                    type="button"
                    onClick={() => visuelInputRef.current?.click()} 
                    disabled={!!uploading}
                    className="btn btn-outline" 
                    style={{ borderRadius: '10px', height: '36px', minHeight: '36px', gap: '0.4rem', fontSize: '0.85rem' }}
                  >
                    {uploading === 'visuel' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {visuelUrl ? 'Changer' : 'Uploader'}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem' }}>
                    <LinkIcon size={12} style={{ opacity: 0.4 }} />
                    <input 
                      value={visuelUrl} 
                      onChange={e => setVisuelUrl(e.target.value)} 
                      placeholder="Ou lien HTTPS..." 
                      style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', width: '100%', outline: 'none' }} 
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <Building2 size={24} style={{ color: 'var(--primary)', opacity: 0.6 }} />
           <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
             Ces modifications seront répercutées immédiatement sur vos prochaines factures et feuilles de route générées.
           </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !!uploading}
          style={{
            alignSelf: 'flex-start',
            minHeight: '60px',
            padding: '0 3rem',
            borderRadius: '16px',
            fontWeight: 950,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.8rem',
            boxShadow: '0 20px 40px -10px rgba(6,182,212,0.3)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {loading ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
          ENREGISTRER LA CONFIGURATION
        </button>
      </form>
      
      <style>{`
        .form-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(6,182,212,0.1); }
        .btn-outline:hover { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
};
