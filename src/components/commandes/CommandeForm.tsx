import { useState, useEffect } from 'react';
import { X, Search, Trash2, Plus } from 'lucide-react';
import type { Produit, Client, LigneCommande, Commande } from '../../types';
import { subscribeToProduits } from '../../services/produitService';
import { searchClientByPhone, createClient } from '../../services/clientService';
import { createCommandeBase } from '../../services/commandeService';
import { getCommunes } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Commune } from '../../types';
import { useSaas } from '../../saas/SaasProvider';
import { getErrorMessage } from '../../lib/errorUtils';

export const CommandeForm = ({ onClose, onSave }: { onClose: () => void, onSave: () => void }) => {
  const { showToast } = useToast();
  const { tenant } = useSaas();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Client Search & State
  const [clientRecherche, setClientRecherche] = useState<Partial<Client>>({ telephone: '', nom_complet: '', email: '', adresse: '', commune: '', ville: '', remarques: '' });
  const [clientId, setClientId] = useState<string | null>(null);

  // Products State
  const [catalogue, setCatalogue] = useState<Produit[]>([]);
  const [lignes, setLignes] = useState<Partial<LigneCommande>[]>([]);
  
  // Order Details
  const [source, setSource] = useState('Facebook');
  const [modePaiement, setModePaiement] = useState('Cash à la livraison');
  const [notes, setNotes] = useState('');
  
  const [communesDb, setCommunesDb] = useState<Commune[]>([]);
  const [fraisLivraison, setFraisLivraison] = useState(0);

  useEffect(() => {
    if (tenant?.id) {
      getCommunes(tenant.id).then(setCommunesDb);
    }
  }, [tenant?.id]);

  useEffect(() => {
    if (!tenant?.id) return;
    const unsubscribe = subscribeToProduits(tenant.id, (prods: Produit[]) => {
      setCatalogue(prods.filter(p => p.actif));
    });
    return () => unsubscribe();
  }, [tenant?.id]);

  const updateFraisLivraison = (communeNom: string) => {
    const commune = communesDb.find(c => c.nom === communeNom);
    setFraisLivraison(commune?.tarif_livraison || 0);
  };

  useEffect(() => {
    if (clientRecherche.commune) {
      updateFraisLivraison(clientRecherche.commune);
    }
  }, [clientRecherche.commune, communesDb]);

  const handleSearchClient = async () => {
    if (!clientRecherche.telephone || !tenant?.id) return;
    const found = await searchClientByPhone(tenant.id, clientRecherche.telephone);
    if (found) {
      setClientId(found.id);
      setClientRecherche(found);
    } else {
      setClientId(null);
      showToast("Aucun client trouvé avec ce numéro. Vous pouvez saisir les informations du nouveau client.", "info");
    }
  };

  const addLigne = () => {
    setLignes([...lignes, { produit_id: '', quantite: 1, prix_unitaire: 0 }]);
  };

  const parsePrice = (p: any): number => {
    if (!p) return 0;
    const fields = ['prix_vente', 'prixVente', 'prix_unitaire', 'prixUnitaire', 'prix', 'price', 'prix_achat'];
    let rawValue = undefined;
    for (const f of fields) {
      if (p[f] !== undefined && p[f] !== null) {
        rawValue = p[f];
        break;
      }
    }
    
    if (rawValue === undefined) return 0;
    const val = typeof rawValue === 'string' ? parseFloat(rawValue.replace(/[^0-9.-]+/g,"")) : Number(rawValue);
    return isNaN(val) ? 0 : val;
  };

  const updateLigne = (index: number, field: keyof LigneCommande, value: any) => {
    const newLignes = [...lignes];
    if (field === 'produit_id') {
      const prod = catalogue.find(p => p.id === value);
      if (!prod) return;

      let prixActif = parsePrice(prod);
      const promoVal = prod.prix_promo !== undefined ? prod.prix_promo : (prod as any).prixPromo;
      if (promoVal !== undefined && promoVal !== null && promoVal !== 0) {
        const now = new Date().getTime();
        const debut = prod.promo_debut ? new Date(prod.promo_debut).getTime() : 0;
        const fin = prod.promo_fin ? new Date(prod.promo_fin).getTime() : Infinity;
        if (now >= debut && now <= fin) {
          prixActif = typeof promoVal === 'string' ? parseFloat(promoVal.replace(/[^0-9.-]+/g,"")) : Number(promoVal);
        }
      }

      newLignes[index] = { 
        ...newLignes[index], 
        produit_id: value, 
        nom_produit: prod.nom, 
        prix_unitaire: prixActif, 
        montant_ligne: prixActif * (newLignes[index].quantite || 1) 
      };
    } else if (field === 'quantite') {
      const qte = Math.max(1, Number(value));
      const prix = Number(newLignes[index].prix_unitaire) || 0;
      newLignes[index] = { 
        ...newLignes[index], 
        quantite: qte, 
        montant_ligne: prix * qte 
      };
    }
    setLignes(newLignes);
  };

  const totalMontant = lignes.reduce((acc, l) => acc + Number(l.montant_ligne || 0), 0) + fraisLivraison;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientRecherche.nom_complet) return showToast("Le nom du client est obligatoire.", "error");
    if (totalMontant <= 0) return showToast("Le montant total de la commande ne peut pas être 0 CFA. Vérifiez le prix des produits.", "error");
    if (lignes.length === 0) return showToast("Ajoutez au moins un produit.", "error");
    if (!lignes.every(l => l.produit_id && l.quantite)) return showToast("Veuillez remplir correctement les produits.", "error");

    setLoading(true);
    try {
      if (!tenant?.id) {
        showToast('Espace boutique introuvable. Rechargez la page ou reconnectez-vous.', 'error');
        setLoading(false);
        return;
      }
      const tenantId = tenant.id;

      let finalClientId = clientId;

      if (!finalClientId && clientRecherche.telephone) {
        const existing = await searchClientByPhone(tenantId, clientRecherche.telephone);
        if (existing) {
          finalClientId = existing.id;
        } else {
          finalClientId = await createClient(tenantId, {
            telephone: clientRecherche.telephone,
            nom_complet: clientRecherche.nom_complet!,
            email: clientRecherche.email || '',
            adresse: clientRecherche.adresse || '',
            commune: clientRecherche.commune || '',
          } as any);
        }
      }
      
      if (!finalClientId) {
        showToast("Veuillez renseigner un numéro de téléphone valide.", "error");
        setLoading(false);
        return;
      }

      const rem = clientRecherche.remarques?.trim();
      const ville = clientRecherche.ville?.trim();
      const villeLine = ville ? `Ville : ${ville}` : '';
      const agentLine = currentUser?.nom_complet
        ? `Saisie : ${currentUser.nom_complet}`
        : currentUser?.id
          ? `Saisie : ${currentUser.id}`
          : '';
      const notesMerged = [rem, villeLine, agentLine, notes.trim()].filter(Boolean).join('\n\n');

      const newCommande: Omit<Commande, 'id' | 'date_creation' | 'statut_commande'> = {
        client_id: finalClientId,
        nom_client: clientRecherche.nom_complet!,
        source_commande: source,
        montant_total: totalMontant,
        frais_livraison: fraisLivraison,
        mode_paiement: modePaiement,
        commune_livraison: clientRecherche.commune || '',
        adresse_livraison: clientRecherche.adresse || '',
        notes_client: notesMerged,
        tenant_id: tenantId,
      };

      await createCommandeBase(tenantId, newCommande as any, lignes as Omit<LigneCommande, 'id' | 'commande_id'>[]);
      showToast('Commande enregistrée.', 'success');
      onSave();
    } catch (error: unknown) {
      console.error(error);
      const msg = getErrorMessage(error, 'Erreur lors de la création.');
      showToast(
        msg.length > 180 ? `${msg.slice(0, 177)}…` : msg,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content card glass-effect" style={{ maxWidth: '900px', padding: '3rem', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '2rem', 
            right: '2rem', 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '2px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '14px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer', 
            color: '#64748b',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={22} strokeWidth={2.5} />
        </button>
        
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Nouvelle Commande</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.5rem', fontWeight: 600 }}>Finalisez la saisie pour lancer le processus logistique.</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
             <div style={{ padding: '2.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '28px', border: '2px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>1</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Profil Client</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Téléphone Mobile *</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input type="text" className="form-input" style={{ background: 'rgba(0, 0, 0, 0.2)', height: '52px', fontWeight: 700, border: '2px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '14px', width: '100%' }} placeholder="Ex: 0707070707" required value={clientRecherche.telephone} onChange={e => { setClientRecherche({...clientRecherche, telephone: e.target.value}); setClientId(null); }} />
                  <button type="button" className="btn btn-primary" style={{ width: '52px', padding: 0, borderRadius: '14px', flexShrink: 0 }} onClick={handleSearchClient} title="Rechercher"><Search size={22} strokeWidth={2.5} /></button>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Nom Complet *</label>
                <input type="text" className="form-input" style={{ background: 'rgba(0, 0, 0, 0.2)', height: '52px', fontWeight: 700, border: '2px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '14px', width: '100%' }} required value={clientRecherche.nom_complet} onChange={e => setClientRecherche({...clientRecherche, nom_complet: e.target.value})} placeholder="Nom et Prénoms" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Commune / Zone de Livraison</label>
                 <select className="form-select" style={{ background: 'rgba(0,0,0,0.2)', height: '52px', fontWeight: 700, border: '2px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '14px', width: '100%' }} value={clientRecherche.commune || ''} onChange={e => setClientRecherche({...clientRecherche, commune: e.target.value})}>
                  <option value="">Où livrer ?</option>
                  {communesDb.map(c => <option key={c.id} value={c.nom}>{c.nom} (+{c.tarif_livraison.toLocaleString()} CFA)</option>)}
                  <option value="Autre">Autre destination</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Adresse Précise</label>
                <input type="text" className="form-input" style={{ background: 'rgba(0,0,0,0.2)', height: '52px', fontWeight: 700, border: '2px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '14px', width: '100%' }} placeholder="Quartier, Repère, Bâtiment..." value={clientRecherche.adresse} onChange={e => setClientRecherche({...clientRecherche, adresse: e.target.value})} />
              </div>
            </div>
          </div>

          <div style={{ padding: '2.5rem', border: '2px solid rgba(255, 255, 255, 0.05)', borderRadius: '32px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>2</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Panier Commande</h3>
              </div>
              <button type="button" className="btn btn-outline" onClick={addLigne} style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, borderRadius: '14px', border: '2px solid var(--primary)', color: 'var(--primary)' }}><Plus size={18} strokeWidth={3} /> Ajouter un article</button>
            </div>
            
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {lignes.map((l, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', borderRadius: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.03)', border: '2px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ flex: '3', minWidth: '240px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block', color: 'var(--text-muted)' }}>Sélection Article</label>
                    <select className="form-select" required value={l.produit_id} onChange={(e) => updateLigne(idx, 'produit_id', e.target.value)} style={{ background: 'rgba(0, 0, 0, 0.2)', height: '52px', border: '2px solid rgba(255, 255, 255, 0.1)', fontWeight: 700, color: 'white', borderRadius: '12px', width: '100%' }}>
                      <option value="">Choisir un produit dans le catalogue...</option>
                      {catalogue.map(p => (
                        <option key={p.id} value={p.id}>{p.nom} ({parsePrice(p).toLocaleString()} CFA)</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '120px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block', color: 'var(--text-muted)' }}>Quantité</label>
                    <input type="number" className="form-input" min="1" value={l.quantite} onChange={e => updateLigne(idx, 'quantite', e.target.value)} style={{ background: 'rgba(0, 0, 0, 0.2)', textAlign: 'center', fontWeight: 800, height: '52px', border: '2px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '12px', width: '100%' }} />
                  </div>
                  <div style={{ flex: '1', textAlign: 'right', minWidth: '150px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block', color: 'var(--text-muted)' }}>Sous-total</label>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>{(l.montant_ligne || 0).toLocaleString()} <span style={{ fontSize: '0.85rem' }}>CFA</span></div>
                  </div>
                  <button type="button" onClick={() => setLignes(lignes.filter((_, i) => i !== idx))} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '2px solid rgba(239, 68, 68, 0.2)', width: '52px', height: '52px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover-danger"><Trash2 size={22} /></button>
                </div>
              ))}
            </div>

            {lignes.length > 0 && (
              <div style={{ marginTop: '2.5rem', padding: '2.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '28px', color: 'white', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', border: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', opacity: 0.8, fontWeight: 700, fontSize: '1.1rem' }}>
                  <span>Frais de livraison ({clientRecherche.commune || 'Standard'})</span>
                  <span>+{fraisLivraison.toLocaleString()} CFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>Total net à encaisser</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--primary)', textShadow: '0 0 20px var(--primary-glow)' }}>{totalMontant.toLocaleString()} CFA</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Provenance Commande</label>
              <select className="form-select" value={source} onChange={e => setSource(e.target.value)} style={{ background: 'rgba(0, 0, 0, 0.2)', height: '52px', border: '2px solid rgba(255, 255, 255, 0.1)', fontWeight: 700, color: 'white', borderRadius: '14px', width: '100%' }}>
                <option value="Facebook">Facebook Ads</option>
                <option value="WhatsApp">WhatsApp Business</option>
                <option value="Site Web">Site E-commerce</option>
                <option value="Appel Entrant">Appel Entrant direct</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Méthode de Paiement</label>
              <select className="form-select" value={modePaiement} onChange={e => setModePaiement(e.target.value)} style={{ background: 'rgba(0, 0, 0, 0.2)', height: '52px', border: '2px solid rgba(255, 255, 255, 0.1)', fontWeight: 700, color: 'white', borderRadius: '14px', width: '100%' }}>
                <option value="Cash à la livraison">Cash à la livraison (COD)</option>
                <option value="Mobile Money">Paiement Mobile (Anticipé)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Observations Logistiques</label>
            <textarea className="form-input" rows={3} style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1.25rem', borderRadius: '18px', border: '2px solid rgba(255, 255, 255, 0.1)', fontWeight: 600, color: 'white', width: '100%' }} placeholder="Ex: Livraison après 17h, appeler avant de venir..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.25rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading} style={{ padding: '0.8rem 2rem', fontWeight: 700, borderRadius: '14px' }}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 3rem', fontWeight: 800, borderRadius: '14px', fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.4)' }}>
              {loading ? 'Traitement...' : 'Confirmer la Commande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
