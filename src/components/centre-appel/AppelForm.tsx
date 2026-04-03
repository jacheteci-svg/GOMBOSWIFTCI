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
        style={{
          maxWidth: '720px',
          padding: 0,
          maxHeight: 'min(92vh, 900px)',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '28px',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-nexus-accent" />
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '2.25rem 2.25rem 2rem',
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
        <button 
          type="button"
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem', 
            zIndex: 2,
            background: 'rgba(15, 23, 42, 0.75)', 
            border: '1px solid rgba(255,255,255,0.12)', 
            borderRadius: '12px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer', 
            color: '#f1f5f9',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        
        <div style={{ marginBottom: '2rem', paddingRight: '2.75rem' }}>
          <h2 className="text-premium" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Traitement d&apos;appel</h2>
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
          className="modal-panel-light"
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            background: 'linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 100%)',
            borderRadius: '16px',
            border: '1px solid #6ee7b7',
            boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset',
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#14532d', fontSize: '1rem' }}>Articles & quantités</div>
          <p style={{ fontSize: '0.82rem', color: '#166534', marginBottom: '1rem', lineHeight: 1.5, fontWeight: 600 }}>
            Ajustez les quantités ou ajoutez des produits du catalogue. Les montants et le stock sont mis à jour à
            l’enregistrement.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lignesLocal.map((ligne, idx) => (
              <div
                key={idx}
                className="modal-panel-light"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 88px 40px',
                  gap: '0.5rem',
                  alignItems: 'center',
                  background: '#ffffff',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                }}
              >
                <select
                  className="form-select"
                  style={{ height: '42px', fontSize: '0.85rem', fontWeight: 600 }}
                  value={ligne.produit_id || ''}
                  onChange={(e) => updateLigne(idx, 'produit_id', e.target.value)}
                >
                  <option value="">Choisir un produit…</option>
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
                  style={{ height: '42px', textAlign: 'center', fontWeight: 700 }}
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
                    height: '42px',
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
                <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#475569', lineHeight: 1.45 }}>
                  {ligne.nom_produit ? (
                    <>
                      <strong style={{ color: '#0f172a' }}>{ligne.nom_produit}</strong>
                      {' — '}
                      {(Number(ligne.prix_unitaire) || 0).toLocaleString()} CFA × {ligne.quantite ?? 1} ={' '}
                      <strong style={{ color: '#0e7490' }}>
                        {(Number(ligne.montant_ligne) || 0).toLocaleString()} CFA
                      </strong>
                    </>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: '#64748b' }}>Choisissez un produit</span>
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
              height: '46px',
              fontWeight: 700,
              borderStyle: 'dashed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '12px',
            }}
          >
            <Plus size={18} strokeWidth={2.5} /> Ajouter un article
          </button>
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.85rem 1rem',
              background: '#ffffff',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#14532d',
              border: '1px solid #bbf7d0',
            }}
          >
            Sous-total articles : {subtotalLignes.toLocaleString()} CFA
          </div>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="modal-panel-light" style={{ padding: '1.25rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <label className="form-label" style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: '1rem', display: 'block' }}>Résultat de l&apos;échange</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={{ 
                border: `2px solid ${resultat === 'validee' ? '#06b6d4' : '#cbd5e1'}`, 
                borderRadius: '14px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s ease',
                background: resultat === 'validee' ? 'rgba(6, 182, 212, 0.08)' : '#ffffff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem',
                boxShadow: resultat === 'validee' ? '0 4px 14px rgba(6, 182, 212, 0.2)' : '0 1px 2px rgba(15,23,42,0.06)'
              }}>
                <input type="radio" checked={resultat === 'validee'} onChange={() => setResultat('validee')} style={{ display: 'none' }} />
                <CheckCircle size={28} color={resultat === 'validee' ? '#0891b2' : '#94a3b8'} strokeWidth={2.5} />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: resultat === 'validee' ? '#0e7490' : '#64748b' }}>Valider</span>
              </label>
              
              <label style={{ 
                border: `2px solid ${resultat === 'a_rappeler' ? '#f59e0b' : '#cbd5e1'}`, 
                borderRadius: '14px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s ease',
                background: resultat === 'a_rappeler' ? 'rgba(245, 158, 11, 0.1)' : '#ffffff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem',
                boxShadow: resultat === 'a_rappeler' ? '0 4px 14px rgba(245, 158, 11, 0.2)' : '0 1px 2px rgba(15,23,42,0.06)'
              }}>
                <input type="radio" checked={resultat === 'a_rappeler'} onChange={() => setResultat('a_rappeler')} style={{ display: 'none' }} />
                <Clock size={28} color={resultat === 'a_rappeler' ? '#d97706' : '#94a3b8'} strokeWidth={2.5} />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: resultat === 'a_rappeler' ? '#b45309' : '#64748b' }}>À rappeler</span>
              </label>

              <label style={{ 
                border: `2px solid ${resultat === 'annulee' ? '#ef4444' : '#cbd5e1'}`, 
                borderRadius: '14px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s ease',
                background: resultat === 'annulee' ? 'rgba(239, 68, 68, 0.08)' : '#ffffff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem',
                gridColumn: 'span 2',
                boxShadow: resultat === 'annulee' ? '0 4px 14px rgba(239, 68, 68, 0.18)' : '0 1px 2px rgba(15,23,42,0.06)'
              }}>
                <input type="radio" checked={resultat === 'annulee'} onChange={() => setResultat('annulee')} style={{ display: 'none' }} />
                <XCircle size={28} color={resultat === 'annulee' ? '#ef4444' : '#94a3b8'} strokeWidth={2.5} />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: resultat === 'annulee' ? '#dc2626' : '#64748b' }}>Annuler la commande</span>
              </label>
            </div>
          </div>

          {resultat === 'validee' && (
            <div className="modal-panel-light" style={{ padding: '1.35rem', background: 'linear-gradient(180deg, #faf5ff 0%, #f5f3ff 100%)', borderRadius: '16px', border: '1px solid #c4b5fd', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#334155' }}>Zone de livraison finale</label>
                <select className="form-select" required value={communeLocal} onChange={e => handleCommuneChange(e.target.value)} style={{ height: '48px', fontWeight: 600 }}>
                  <option value="">Sélectionner une commune...</option>
                  {communesDb.map(c => <option key={c.id} value={c.nom}>{c.nom} ({c.tarif_livraison} CFA)</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#334155' }}>Lieu exact (confirmation)</label>
                <input type="text" className="form-input" required value={adresseLocal} onChange={e => setAdresseLocal(e.target.value)} style={{ height: '48px', fontWeight: 600 }} placeholder="Quartier, repère, instructions…" />
              </div>
              <div className="modal-panel-light" style={{ padding: '1.15rem 1.25rem', background: '#ffffff', borderRadius: '14px', border: '1px solid #ddd6fe' }}>
                 <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Montant total à encaisser</div>
                 <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0e7490', letterSpacing: '-0.02em' }}>
                   {totalEncaisser.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>CFA</span>
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

          <div className="modal-footer-bar" style={{ marginTop: '1rem', borderRadius: '16px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading} style={{ flex: 1, minHeight: '52px', fontWeight: 700, borderRadius: '14px' }}>Abandonner</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, minHeight: '52px', fontWeight: 800, borderRadius: '14px', boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.35)' }}>
              {loading ? 'Traitement...' : 'Enregistrer le résultat'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
