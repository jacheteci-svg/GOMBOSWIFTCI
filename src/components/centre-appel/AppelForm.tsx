import { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, XCircle, MessageCircle } from 'lucide-react';
import { getCommandeWithLines, updateCommandeStatus } from '../../services/commandeService';
import { insforge } from '../../lib/insforge';
import { useAuth } from '../../contexts/AuthContext';
import { getCommunes } from '../../services/adminService';
import { useSaas } from '../../saas/SaasProvider';
import { useToast } from '../../contexts/ToastContext';
import {
  buildCentreAppelWhatsAppMessage,
  buildWhatsAppWebUrl,
  normalizePhoneForWhatsApp,
} from '../../lib/whatsappCentreAppel';
import type { Commande, AppelCommande, Commune } from '../../types';

interface AppelFormProps {
  commande: Commande;
  onClose: () => void;
  onSave: () => void;
}

export const AppelForm = ({ commande, onClose, onSave }: AppelFormProps) => {
  const { currentUser } = useAuth();
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [detailCommande, setDetailCommande] = useState<Commande>(commande);
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<AppelCommande['resultat_appel']>('validee');
  const [commentaire, setCommentaire] = useState('');
  const [fraisLivraison, setFraisLivraison] = useState<number | ''>(commande.frais_livraison || '');
  const [communeLocal, setCommuneLocal] = useState(commande.commune_livraison || '');
  const [adresseLocal, setAdresseLocal] = useState(commande.adresse_livraison || '');
  const [communesDb, setCommunesDb] = useState<Commune[]>([]);

  useEffect(() => {
    if (!tenant?.id) return;
    getCommunes(tenant.id).then(setCommunesDb);
  }, [tenant?.id]);

  useEffect(() => {
    setDetailCommande(commande);
  }, [commande.id]);

  useEffect(() => {
    if (!tenant?.id) return;
    let cancelled = false;
    getCommandeWithLines(tenant.id, commande.id)
      .then((c) => {
        if (!cancelled) setDetailCommande(c);
      })
      .catch(() => {
        if (!cancelled) setDetailCommande(commande);
      });
    return () => {
      cancelled = true;
    };
  }, [tenant?.id, commande.id]);

  const openWhatsAppClient = () => {
    const phone = normalizePhoneForWhatsApp(detailCommande.telephone_client);
    if (!phone) {
      showToast('Numéro de téléphone client manquant ou invalide pour WhatsApp.', 'error');
      return;
    }
    const msg = buildCentreAppelWhatsAppMessage(detailCommande, tenant?.nom || '');
    const url = buildWhatsAppWebUrl(phone, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCommuneChange = (nom: string) => {
    setCommuneLocal(nom);
    const selected = communesDb.find(c => c.nom === nom);
    if (selected) {
      setFraisLivraison(selected.tarif_livraison);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // 1. Enregistrer l'appel dans l'historique
      await insforge.database
        .from('appels_commandes')
        .insert([{
          commande_id: commande.id,
          agent_appel_id: currentUser.id,
          date_appel: new Date(),
          resultat_appel: resultat,
          commentaire_agent: commentaire,
          tenant_id: tenant?.id
        }]);

      // 2. Mettre à jour le statut de la commande
      const nextStatusMap: Record<string, string> = {
        'validee': 'validee',
        'a_rappeler': 'a_rappeler',
        'annulee': 'annulee',
        'injoignable': 'a_rappeler' // if unreachable, needs callback
      };
      
      const payload: any = { statut_commande: nextStatusMap[resultat] };
      if (resultat === 'validee') {
        payload.date_validation_appel = new Date();
        payload.commune_livraison = communeLocal;
        payload.adresse_livraison = adresseLocal;
        if (typeof fraisLivraison === 'number') {
          payload.frais_livraison = fraisLivraison;
          // Robust subtotal: always remove what's currently marked as delivery fee
          const currentFee = Number(commande.frais_livraison) || 0;
          const subtotal = Number(commande.montant_total) - currentFee;
          payload.montant_total = subtotal + fraisLivraison;
        }
      }

      if (!tenant?.id) return;
      await updateCommandeStatus(tenant.id, commande.id, nextStatusMap[resultat], payload);
      onSave();
    } catch (error) {
      console.error("Erreur lors de la validation :", error);
    } finally {
      setLoading(false);
    }
  };

  const currentSubtotal = Number(commande.montant_total) - (Number(commande.frais_livraison) || 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content card" style={{ maxWidth: '550px', padding: '2.5rem' }} onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '1.5rem', 
            right: '1.5rem', 
            background: '#f1f5f9', 
            border: 'none', 
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer', 
            color: 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="text-premium" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Traitement d'Appel</h2>
          <div style={{ marginTop: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Référence Commande</span>
              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>#{commande.id.slice(0, 8).toUpperCase()}</strong>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {commande.nom_client || 'Client Anonyme'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              📞 {commande.telephone_client}
            </div>
          </div>
          <button
            type="button"
            onClick={openWhatsAppClient}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.9rem 1rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(180deg, #25D366 0%, #128C7E 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              boxShadow: '0 8px 20px rgba(37, 211, 102, 0.35)',
            }}
          >
            <MessageCircle size={22} strokeWidth={2.5} />
            WhatsApp — confirmation & livraison
          </button>
          <p style={{ margin: '0.55rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Message prérempli : enregistrement de la commande, récap produits et montants (en gras), demande de
            confirmation de livraison et des informations encore manquantes dans la base.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label className="form-label" style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }}>Résultat de l'échange</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={{ 
                border: `2px solid ${resultat === 'validee' ? 'var(--primary)' : '#e2e8f0'}`, 
                borderRadius: '16px', padding: '1rem', cursor: 'pointer', transition: 'all 0.3s ease',
                background: resultat === 'validee' ? 'rgba(99, 102, 255, 0.05)' : 'white',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                boxShadow: resultat === 'validee' ? '0 10px 15px -3px rgba(99, 102, 255, 0.2)' : 'none'
              }}>
                <input type="radio" checked={resultat === 'validee'} onChange={() => setResultat('validee')} style={{ display: 'none' }} />
                <CheckCircle size={28} color={resultat === 'validee' ? 'var(--primary)' : '#94a3b8'} strokeWidth={2.5} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: resultat === 'validee' ? 'var(--primary)' : '#64748b' }}>Valider</span>
              </label>
              
              <label style={{ 
                border: `2px solid ${resultat === 'a_rappeler' ? '#f59e0b' : '#e2e8f0'}`, 
                borderRadius: '16px', padding: '1rem', cursor: 'pointer', transition: 'all 0.3s ease',
                background: resultat === 'a_rappeler' ? 'rgba(245, 158, 11, 0.05)' : 'white',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                boxShadow: resultat === 'a_rappeler' ? '0 10px 15px -3px rgba(245, 158, 11, 0.2)' : 'none'
              }}>
                <input type="radio" checked={resultat === 'a_rappeler'} onChange={() => setResultat('a_rappeler')} style={{ display: 'none' }} />
                <Clock size={28} color={resultat === 'a_rappeler' ? '#f59e0b' : '#94a3b8'} strokeWidth={2.5} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: resultat === 'a_rappeler' ? '#d97706' : '#64748b' }}>À rappeler</span>
              </label>

              <label style={{ 
                border: `2px solid ${resultat === 'annulee' ? '#ef4444' : '#e2e8f0'}`, 
                borderRadius: '16px', padding: '1rem', cursor: 'pointer', transition: 'all 0.3s ease',
                background: resultat === 'annulee' ? 'rgba(239, 68, 68, 0.05)' : 'white',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                gridColumn: 'span 2',
                boxShadow: resultat === 'annulee' ? '0 10px 15px -3px rgba(239, 68, 68, 0.2)' : 'none'
              }}>
                <input type="radio" checked={resultat === 'annulee'} onChange={() => setResultat('annulee')} style={{ display: 'none' }} />
                <XCircle size={28} color={resultat === 'annulee' ? '#ef4444' : '#94a3b8'} strokeWidth={2.5} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: resultat === 'annulee' ? '#dc2626' : '#64748b' }}>Annuler la commande</span>
              </label>
            </div>
          </div>

          {resultat === 'validee' && (
            <div style={{ padding: '1.5rem', background: '#fdf4ff', borderRadius: '20px', border: '2px solid #f5d0fe', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Zone de livraison finale</label>
                <select className="form-select" required value={communeLocal} onChange={e => handleCommuneChange(e.target.value)} style={{ background: 'white', height: '44px' }}>
                  <option value="">Sélectionner une commune...</option>
                  {communesDb.map(c => <option key={c.id} value={c.nom}>{c.nom} ({c.tarif_livraison} CFA)</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Lieu exact (Confirmation)</label>
                <input type="text" className="form-input" required value={adresseLocal} onChange={e => setAdresseLocal(e.target.value)} style={{ background: 'white', height: '44px' }} />
              </div>
              <div style={{ padding: '1.25rem', background: 'white', borderRadius: '16px', border: '1px solid #f0abfc' }}>
                 <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Montant total à encaisser</div>
                 <div className="brand-glow" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)' }}>
                   {(currentSubtotal + (Number(fraisLivraison) || 0)).toLocaleString()} <span style={{ fontSize: '0.8rem' }}>CFA</span>
                 </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Note d'appel</label>
            <textarea 
              className="form-input" 
              rows={3}
              required
              style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem' }}
              placeholder="Ex: Client confirmé, livraison OK pour demain matin..."
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading} style={{ flex: 1, height: '52px', fontWeight: 700, borderRadius: '14px' }}>Abandonner</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, height: '52px', fontWeight: 800, borderRadius: '14px', boxShadow: '0 10px 15px -3px rgba(99, 102, 255, 0.4)' }}>
              {loading ? 'Traitement...' : 'Enregistrer le résultat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
