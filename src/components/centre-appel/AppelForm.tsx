import { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, XCircle, MessageCircle, Plus, Trash2 } from 'lucide-react';
import {
  getCommandeWithLines,
  replaceCommandeLignesCentreAppel,
  updateCommandeStatus,
} from '../../services/commandeService';
import { subscribeToProduits } from '../../services/produitService';
import { insforge } from '../../lib/insforge';
import { useAuth } from '../../contexts/AuthContext';
import { getCommunes } from '../../services/adminService';
import { useSaas } from '../../saas/SaasProvider';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../lib/errorUtils';
import {
  buildCentreAppelWhatsAppMessage,
  buildWhatsAppWebUrl,
  normalizePhoneForWhatsApp,
} from '../../lib/whatsappCentreAppel';
import type { Commande, AppelCommande, Commune, LigneCommande, Produit } from '../../types';

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
  const [catalogue, setCatalogue] = useState<Produit[]>([]);
  const [lignesLocal, setLignesLocal] = useState<Partial<LigneCommande>[]>([]);

  useEffect(() => {
    if (!tenant?.id) return;
    getCommunes(tenant.id).then(setCommunesDb);
  }, [tenant?.id]);

  useEffect(() => {
    if (!tenant?.id) return;
    const unsub = subscribeToProduits(tenant.id, (prods) => {
      setCatalogue(prods.filter((p) => p.actif));
    });
    return () => unsub();
  }, [tenant?.id]);

  useEffect(() => {
    setDetailCommande(commande);
  }, [commande.id]);

  useEffect(() => {
    if (!tenant?.id) return;
    let cancelled = false;
    getCommandeWithLines(tenant.id, commande.id)
      .then((c) => {
        if (!cancelled) {
          setDetailCommande(c);
          const rows = (c.lignes || []).map((l) => ({ ...l }));
          setLignesLocal(
            rows.length > 0
              ? rows
              : [{ produit_id: '', quantite: 1, prix_unitaire: 0, montant_ligne: 0 }]
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetailCommande(commande);
          const rows = (commande.lignes || []).map((l) => ({ ...l }));
          setLignesLocal(
            rows.length > 0
              ? rows
              : [{ produit_id: '', quantite: 1, prix_unitaire: 0, montant_ligne: 0 }]
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenant?.id, commande.id]);

  const parsePrice = (p: Produit): number => {
    const fields = ['prix_vente', 'prixVente', 'prix_unitaire', 'prixUnitaire', 'prix', 'price', 'prix_achat'] as const;
    let raw: unknown;
    for (const f of fields) {
      if ((p as any)[f] !== undefined && (p as any)[f] !== null) {
        raw = (p as any)[f];
        break;
      }
    }
    if (raw === undefined) return 0;
    const val = typeof raw === 'string' ? parseFloat(raw.replace(/[^0-9.-]+/g, '')) : Number(raw);
    return isNaN(val) ? 0 : val;
  };

  const updateLigne = (index: number, field: keyof LigneCommande, value: unknown) => {
    const next = [...lignesLocal];
    if (field === 'produit_id') {
      const prod = catalogue.find((p) => p.id === value);
      if (!prod) return;
      let prixActif = parsePrice(prod);
      const pr = prod as unknown as Record<string, unknown>;
      const promoRaw = pr.prix_promo ?? pr.prixPromo;
      if (promoRaw !== undefined && promoRaw !== null && promoRaw !== 0) {
        const now = Date.now();
        const debut = prod.promo_debut ? new Date(prod.promo_debut).getTime() : 0;
        const fin = prod.promo_fin ? new Date(prod.promo_fin).getTime() : Infinity;
        if (now >= debut && now <= fin) {
          const pv =
            typeof promoRaw === 'string'
              ? parseFloat(promoRaw.replace(/[^0-9.-]+/g, ''))
              : Number(promoRaw);
          if (!isNaN(pv)) prixActif = pv;
        }
      }
      const q = Math.max(1, Number(next[index].quantite) || 1);
      next[index] = {
        ...next[index],
        produit_id: value as string,
        nom_produit: prod.nom,
        prix_unitaire: prixActif,
        montant_ligne: prixActif * q,
      };
    } else if (field === 'quantite') {
      const qte = Math.max(1, Number(value));
      const prix = Number(next[index].prix_unitaire) || 0;
      next[index] = { ...next[index], quantite: qte, montant_ligne: prix * qte };
    }
    setLignesLocal(next);
  };

  const addLigne = () => {
    setLignesLocal([...lignesLocal, { produit_id: '', quantite: 1, prix_unitaire: 0, montant_ligne: 0 }]);
  };

  const removeLigne = (index: number) => {
    if (lignesLocal.length <= 1) {
      showToast('Au moins une ligne produit est obligatoire.', 'error');
      return;
    }
    setLignesLocal(lignesLocal.filter((_, i) => i !== index));
  };

  const openWhatsAppClient = () => {
    const phone = normalizePhoneForWhatsApp(detailCommande.telephone_client);
    if (!phone) {
      showToast('Numéro de téléphone client manquant ou invalide pour WhatsApp.', 'error');
      return;
    }
    const merged: Commande = {
      ...detailCommande,
      lignes: lignesLocal.filter((l) => l.produit_id) as LigneCommande[],
    };
    const msg = buildCentreAppelWhatsAppMessage(merged, tenant?.nom || '');
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
    if (!tenant?.id) return;

    const linesPayload = lignesLocal
      .filter((l) => l.produit_id && Number(l.quantite) >= 1)
      .map((l) => ({
        produit_id: l.produit_id as string,
        nom_produit: l.nom_produit || '',
        quantite: Number(l.quantite),
        prix_unitaire: Number(l.prix_unitaire) || 0,
        montant_ligne: Number(l.montant_ligne) || 0,
      }));

    if (resultat !== 'annulee' && linesPayload.length === 0) {
      showToast('Ajoutez au moins une ligne produit avec un article et une quantité.', 'error');
      return;
    }

    setLoading(true);
    try {
      let subtotalArticles = lignesLocal.reduce((acc, l) => acc + Number(l.montant_ligne || 0), 0);

      if (resultat !== 'annulee') {
        const { subtotal } = await replaceCommandeLignesCentreAppel(tenant.id, commande.id, linesPayload);
        subtotalArticles = subtotal;
      }

      const fee =
        typeof fraisLivraison === 'number'
          ? fraisLivraison
          : Number(commande.frais_livraison) || 0;

      await insforge.database.from('appels_commandes').insert([
        {
          commande_id: commande.id,
          agent_appel_id: currentUser.id,
          date_appel: new Date(),
          resultat_appel: resultat,
          commentaire_agent: commentaire,
          tenant_id: tenant.id,
        },
      ]);

      const nextStatusMap: Record<string, string> = {
        validee: 'validee',
        a_rappeler: 'a_rappeler',
        annulee: 'annulee',
        injoignable: 'a_rappeler',
      };

      const payload: Record<string, unknown> = { statut_commande: nextStatusMap[resultat] };

      if (resultat !== 'annulee') {
        const feeFinal =
          resultat === 'validee' && typeof fraisLivraison === 'number'
            ? fraisLivraison
            : fee;
        payload.montant_total = subtotalArticles + feeFinal;
      }

      if (resultat === 'validee') {
        payload.date_validation_appel = new Date();
        payload.commune_livraison = communeLocal;
        payload.adresse_livraison = adresseLocal;
        if (typeof fraisLivraison === 'number') {
          payload.frais_livraison = fraisLivraison;
        }
      }

      await updateCommandeStatus(tenant.id, commande.id, nextStatusMap[resultat], payload);
      onSave();
    } catch (error: unknown) {
      console.error('Erreur lors de la validation :', error);
      showToast(getErrorMessage(error, 'Erreur lors de la validation.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const feeDisplay =
    typeof fraisLivraison === 'number'
      ? fraisLivraison
      : Number(commande.frais_livraison) || 0;
  const subtotalLignes = lignesLocal.reduce((acc, l) => acc + Number(l.montant_ligne || 0), 0);
  const totalEncaisser = subtotalLignes + feeDisplay;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content modal-nexus modal-nexus-wide card glass-effect"
        style={{ maxWidth: '720px', padding: 0, maxHeight: '92vh', overflow: 'hidden', position: 'relative', borderRadius: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-nexus-accent" />
        <div style={{ padding: '2.5rem', maxHeight: '92vh', overflowY: 'auto' }}>
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
          <div className="modal-panel-light" style={{ marginTop: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
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

        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            background: '#f0fdf4',
            borderRadius: '16px',
            border: '1px solid #86efac',
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: '0.75rem', color: '#166534' }}>Articles & quantités</div>
          <p style={{ fontSize: '0.8rem', color: '#15803d', marginBottom: '1rem', lineHeight: 1.45 }}>
            Ajustez les quantités ou ajoutez des produits du catalogue. Les montants et le stock sont mis à jour à
            l’enregistrement.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lignesLocal.map((ligne, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 88px 36px',
                  gap: '0.5rem',
                  alignItems: 'center',
                  background: 'white',
                  padding: '0.65rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <select
                  className="form-select"
                  style={{ height: '40px', fontSize: '0.85rem' }}
                  value={ligne.produit_id || ''}
                  onChange={(e) => updateLigne(idx, 'produit_id', e.target.value)}
                >
                  <option value="">Produit…</option>
                  {catalogue.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  style={{ height: '40px', textAlign: 'center' }}
                  value={ligne.quantite ?? 1}
                  onChange={(e) => updateLigne(idx, 'quantite', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeLigne(idx)}
                  style={{
                    border: 'none',
                    background: '#fee2e2',
                    borderRadius: '10px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#b91c1c',
                  }}
                  title="Retirer la ligne"
                >
                  <Trash2 size={18} />
                </button>
                <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#64748b' }}>
                  {ligne.nom_produit ? (
                    <>
                      <strong>{ligne.nom_produit}</strong> —{' '}
                      {(Number(ligne.prix_unitaire) || 0).toLocaleString()} CFA × {ligne.quantite ?? 1} ={' '}
                      <strong style={{ color: 'var(--primary)' }}>
                        {(Number(ligne.montant_ligne) || 0).toLocaleString()} CFA
                      </strong>
                    </>
                  ) : (
                    <span style={{ fontStyle: 'italic' }}>Choisissez un produit</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLigne}
            className="btn btn-outline"
            style={{
              marginTop: '0.75rem',
              width: '100%',
              height: '44px',
              fontWeight: 700,
              borderStyle: 'dashed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Plus size={18} /> Ajouter un article
          </button>
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'white',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#166534',
            }}
          >
            Sous-total articles : {subtotalLignes.toLocaleString()} CFA
          </div>
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
              <div className="modal-panel-light" style={{ padding: '1.25rem', background: 'white', borderRadius: '16px', border: '1px solid #f0abfc' }}>
                 <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Montant total à encaisser</div>
                 <div className="brand-glow" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)' }}>
                   {totalEncaisser.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>CFA</span>
                 </div>
              </div>
            </div>
          )}

          <div className="form-group modal-panel-light" style={{ padding: '1rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Note d'appel</label>
            <textarea 
              className="form-input" 
              rows={3}
              required
              style={{ borderRadius: '16px', padding: '1rem' }}
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
    </div>
  );
};
