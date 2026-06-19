import { useState, useEffect } from 'react';
import { X, ShoppingBag, User, MapPin, Receipt, Phone } from 'lucide-react';
import { getCommandeWithLines, updateCommandeGlobale } from '../../services/commandeService';
import type { Commande, LigneCommande } from '../../types';
import { useSaas } from '../../saas/SaasProvider';
import { useToast } from '../../contexts/ToastContext';

interface CommandeDetailsProps {
  commandeId: string;
  onClose: () => void;
}

export const CommandeDetails = ({ commandeId, onClose }: CommandeDetailsProps) => {
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [commande, setCommande] = useState<(Commande & { lignes: LigneCommande[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Commande>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenant?.id) return;
    getCommandeWithLines(tenant.id, commandeId)
      .then((data) => {
        setCommande(data);
        if (data) {
          setEditForm({
            nom_client: data.nom_client,
            telephone_client: data.telephone_client,
            commune_livraison: data.commune_livraison,
            adresse_livraison: data.adresse_livraison,
            frais_livraison: data.frais_livraison,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [commandeId, tenant?.id]);

  const handleSaveEdit = async () => {
    if (!tenant?.id || !commande) return;
    setSaving(true);
    try {
      await updateCommandeGlobale(tenant.id, commande.id, editForm);
      setCommande({ ...commande, ...editForm } as any);
      setIsEditing(false);
      showToast('Commande mise à jour', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content modal-gombo card" style={{ maxWidth: '600px', textAlign: 'center', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
          <div className="modal-shell">
            <div className="modal-gombo-accent" />
            <div className="modal-body-scroll" style={{ padding: '2.5rem 2rem' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }}></div>
              <p style={{ fontWeight: 600 }}>Chargement des détails...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!commande) return null;

  const subtotal = (commande.lignes || []).reduce((acc, l) => acc + (l.montant_ligne || 0), 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-gombo modal-gombo-wide card" style={{ maxWidth: '700px', padding: '0', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-shell">
          <div className="modal-gombo-accent" />
          {/* Header Section */}
          <div style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, #0f172a 100%)', color: 'white', position: 'relative', flexShrink: 0 }}>
            <button 
              onClick={onClose} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
            >
              <X size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.6rem', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '12px' }}>
                <Receipt size={24} color="var(--primary)" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Commande #{commande.id.slice(0, 8).toUpperCase()}</h2>
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem', fontWeight: 500 }}>Statut actuel: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{commande.statut_commande.replace(/_/g, ' ')}</span></p>
              </div>
            </div>
          </div>

          <div className="modal-body-scroll">
            <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="responsive-grid">
              {/* Client Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                      <User size={18} /> Informations Client
                    </h4>
                    {!isEditing ? (
                      <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => setIsEditing(true)}>Éditer</button>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => setIsEditing(false)}>Annuler</button>
                        <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '8px' }} onClick={handleSaveEdit} disabled={saving}>{saving ? '...' : 'Enregistrer'}</button>
                      </div>
                    )}
                  </div>

                  <div className="modal-panel-light" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    {!isEditing ? (
                      <>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{commande.nom_client}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>
                           <Phone size={14} /> {commande.telephone_client}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                           <MapPin size={16} style={{ marginTop: '0.2rem' }} /> 
                           <div>
                             <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{commande.commune_livraison}</div>
                             <div>{commande.adresse_livraison}</div>
                           </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input type="text" className="form-input" value={editForm.nom_client || ''} onChange={e => setEditForm({...editForm, nom_client: e.target.value})} placeholder="Nom complet" style={{ padding: '0.6rem', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <input type="text" className="form-input" value={editForm.telephone_client || ''} onChange={e => setEditForm({...editForm, telephone_client: e.target.value})} placeholder="Téléphone" style={{ padding: '0.6rem', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <input type="text" className="form-input" value={editForm.commune_livraison || ''} onChange={e => setEditForm({...editForm, commune_livraison: e.target.value})} placeholder="Commune" style={{ padding: '0.6rem', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <textarea className="form-input" value={editForm.adresse_livraison || ''} onChange={e => setEditForm({...editForm, adresse_livraison: e.target.value})} placeholder="Adresse complète" rows={2} style={{ padding: '0.6rem', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Meta */}
                <div>
                   <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Détails Logistique</h4>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                     <div className="modal-panel-light" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Source</div>
                       <div style={{ fontWeight: 700 }}>{commande.source_commande}</div>
                     </div>
                     <div className="modal-panel-light" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paiement</div>
                       <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{commande.mode_paiement}</div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  <ShoppingBag size={18} /> Articles Commandés
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {commande.lignes.map((l, idx) => (
                    <div key={idx} className="modal-panel-light" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{l.nom_produit}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{l.quantite} x {l.prix_unitaire?.toLocaleString()} CFA</div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {(l.montant_ligne || 0).toLocaleString()} <span style={{ fontSize: '0.6rem' }}>CFA</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-panel-light" style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                     <span>Sous-total produits</span>
                     <span>{subtotal.toLocaleString()} CFA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, alignItems: 'center' }}>
                     <span>Livraison</span>
                     {!isEditing ? (
                       <span>{commande.frais_livraison?.toLocaleString()} CFA</span>
                     ) : (
                       <input 
                         type="number" 
                         className="form-input" 
                         style={{ width: '100px', padding: '0.3rem', fontSize: '0.9rem', textAlign: 'right', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                         value={editForm.frais_livraison !== undefined ? editForm.frais_livraison : ''} 
                         onChange={e => setEditForm({...editForm, frais_livraison: Number(e.target.value) || 0})}
                       />
                     )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed #cbd5e1', paddingTop: '1rem' }}>
                     <span style={{ fontWeight: 800, fontSize: '1rem' }}>TOTAL À ENCAISSER</span>
                     <span style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary)' }}>{(subtotal + (isEditing && editForm.frais_livraison !== undefined ? editForm.frais_livraison : (commande.frais_livraison || 0))).toLocaleString()} CFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Footer actions */}
        <div className="modal-footer-bar" style={{ flexShrink: 0 }}>
          <button type="button" className="btn btn-outline" onClick={onClose} style={{ borderRadius: '12px', fontWeight: 700 }}>Fermer</button>
        </div>
        </div>
      </div>
    </div>
  );
};
