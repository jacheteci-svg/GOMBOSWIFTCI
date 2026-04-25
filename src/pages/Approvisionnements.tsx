import { useState, useEffect } from 'react';
import { getApprovisionnements, createApprovisionnement, updateApprovisionnementStatut, getApprovisionnementLignes } from '../services/approvisionnementService';
import { getFournisseurs } from '../services/fournisseurService';
import { getProduits } from '../services/produitService';
import { Approvisionnement, Fournisseur, Produit, LigneApprovisionnement } from '../types';
import { useSaas } from '../saas/SaasProvider';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  ShoppingBag, 
  ChevronRight, 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  Trash2,
  X,
  Save,
  Package,
  Calculator
} from 'lucide-react';

export const Approvisionnements = () => {
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [approvisionnements, setApprovisionnements] = useState<Approvisionnement[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAppro, setSelectedAppro] = useState<Approvisionnement | null>(null);
  const [selectedLignes, setSelectedLignes] = useState<LigneApprovisionnement[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    fournisseur_id: '',
    mode_paiement: 'Espèces',
    notes: '',
    statut: 'en_attente' as const
  });
  const [formLignes, setFormLignes] = useState<{ produit_id: string, quantite: number, prix_unitaire: number }[]>([]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [appros, fours, prods] = await Promise.all([
        getApprovisionnements(tenant.id),
        getFournisseurs(tenant.id),
        getProduits(tenant.id)
      ]);
      setApprovisionnements(appros);
      setFournisseurs(fours);
      setProduits(prods);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  const handleOpenModal = () => {
    setFormData({
      fournisseur_id: '',
      mode_paiement: 'Espèces',
      notes: '',
      statut: 'en_attente'
    });
    setFormLignes([]);
    setIsModalOpen(true);
  };

  const handleAddLigne = () => {
    setFormLignes([...formLignes, { produit_id: '', quantite: 1, prix_unitaire: 0 }]);
  };

  const handleRemoveLigne = (idx: number) => {
    setFormLignes(formLignes.filter((_, i) => i !== idx));
  };

  const handleLigneChange = (idx: number, field: string, value: any) => {
    const newLignes = [...formLignes];
    (newLignes[idx] as any)[field] = value;
    
    // Auto-fill price if product changes
    if (field === 'produit_id') {
      const prod = produits.find(p => p.id === value);
      if (prod) {
        newLignes[idx].prix_unitaire = prod.prix_achat;
      }
    }
    
    setFormLignes(newLignes);
  };

  const calculateTotal = () => {
    return formLignes.reduce((acc, l) => acc + (l.quantite * l.prix_unitaire), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;
    if (formLignes.length === 0) {
      showToast("Veuillez ajouter au moins un produit", "warning");
      return;
    }

    try {
      const total = calculateTotal();
      const lignesData = formLignes.map(l => ({
        ...l,
        montant_ligne: l.quantite * l.prix_unitaire
      }));

      await createApprovisionnement(tenant.id, {
        ...formData,
        montant_total: total,
        date: new Date().toISOString()
      }, lignesData);

      showToast("Approvisionnement enregistré", "success");
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleViewAppro = async (appro: Approvisionnement) => {
    setSelectedAppro(appro);
    try {
      const lignes = await getApprovisionnementLignes(tenant!.id, appro.id);
      setSelectedLignes(lignes);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors du chargement des lignes", "error");
    }
  };

  const handleUpdateStatut = async (id: string, newStatut: 'recu' | 'annule') => {
    if (!tenant?.id) return;
    const confirmMsg = newStatut === 'recu' 
      ? "Confirmer la réception ? Cela mettra à jour le stock et la comptabilité." 
      : "Annuler cet approvisionnement ?";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await updateApprovisionnementStatut(tenant.id, id, newStatut);
      showToast(newStatut === 'recu' ? "Réception validée" : "Approvisionnement annulé", "success");
      loadData();
      if (selectedAppro?.id === id) {
        setIsViewModalOpen(false);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Erreur lors de la mise à jour", "error");
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'recu': return <span className="badge badge-success"><CheckCircle size={12} /> Reçu</span>;
      case 'annule': return <span className="badge badge-danger"><XCircle size={12} /> Annulé</span>;
      default: return <span className="badge badge-warning"><Clock size={12} /> En attente</span>;
    }
  };

  return (
    <div style={{ animation: 'pageEnter 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gombo-module-h1">Approvisionnements</h1>
          <p className="gombo-module-lead">Entrées de stock et impact comptable automatique.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={20} /> Nouvel Approvisionnement
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fournisseur</th>
                  <th>Montant Total</th>
                  <th>Statut</th>
                  <th>Mode Paiement</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvisionnements.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {format(new Date(a.date), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td style={{ fontWeight: 700 }}>{a.fournisseur?.nom || 'Inconnu'}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{Number(a.montant_total).toLocaleString()} F</td>
                    <td>{getStatutBadge(a.statut)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{a.mode_paiement}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline" style={{ minHeight: '36px', padding: '0.5rem' }} onClick={() => handleViewAppro(a)}>
                        Détails <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {approvisionnements.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Aucun approvisionnement enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Appro Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Nouvel Approvisionnement</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Fournisseur</label>
                  <select 
                    className="form-select" 
                    required 
                    style={{ width: '100%' }}
                    value={formData.fournisseur_id}
                    onChange={e => setFormData({ ...formData, fournisseur_id: e.target.value })}
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Mode de Paiement</label>
                  <select 
                    className="form-select" 
                    style={{ width: '100%' }}
                    value={formData.mode_paiement}
                    onChange={e => setFormData({ ...formData, mode_paiement: e.target.value })}
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Virement">Virement</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={18} color="var(--primary)" /> Produits & Quantités
                  </h3>
                  <button type="button" className="btn btn-outline" style={{ minHeight: '36px', fontSize: '0.8rem' }} onClick={handleAddLigne}>
                    <Plus size={14} /> Ajouter un produit
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {formLignes.map((l, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px' }}>
                      <select 
                        className="form-select" 
                        required 
                        value={l.produit_id}
                        onChange={e => handleLigneChange(idx, 'produit_id', e.target.value)}
                      >
                        <option value="">Produit...</option>
                        {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="Qté" 
                        min="1" 
                        required 
                        value={l.quantite}
                        onChange={e => handleLigneChange(idx, 'quantite', parseInt(e.target.value))}
                      />
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="Prix Unitaire" 
                          style={{ width: '100%', paddingRight: '2rem' }}
                          value={l.prix_unitaire}
                          onChange={e => handleLigneChange(idx, 'prix_unitaire', parseFloat(e.target.value))}
                        />
                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>F</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveLigne(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formLignes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: 'var(--primary-soft)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Notes internes</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Ex: Arrivage cargaison #45..."
                    style={{ width: '300px', minHeight: '60px', background: 'rgba(0,0,0,0.2)' }}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total à payer</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{calculateTotal().toLocaleString()} F</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                  <Save size={20} /> Valider l'Approvisionnement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Appro Modal */}
      {isViewModalOpen && selectedAppro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', animation: 'scaleUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Approvisionnement #{selectedAppro.id.substring(0, 8).toUpperCase()}</h2>
                <div style={{ marginTop: '0.5rem' }}>{getStatutBadge(selectedAppro.statut)}</div>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Fournisseur</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedAppro.fournisseur?.nom}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedAppro.fournisseur?.telephone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Détails Paiement</div>
                <div style={{ fontWeight: 700 }}>{selectedAppro.mode_paiement}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{format(new Date(selectedAppro.date), 'dd MMMM yyyy')}</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <table style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <thead>
                  <tr style={{ background: 'none' }}>
                    <th style={{ padding: '0.75rem' }}>Produit</th>
                    <th style={{ padding: '0.75rem' }}>Qté</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Prix Un.</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLignes.map(l => (
                    <tr key={l.id}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{l.nom_produit}</td>
                      <td style={{ padding: '0.75rem' }}>{l.quantite}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{Number(l.prix_unitaire).toLocaleString()} F</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>{Number(l.montant_ligne).toLocaleString()} F</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 800, padding: '1rem' }}>Total Général</td>
                    <td style={{ textAlign: 'right', fontWeight: 900, padding: '1rem', color: 'var(--primary)', fontSize: '1.2rem' }}>
                      {Number(selectedAppro.montant_total).toLocaleString()} F
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedAppro.notes && (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Notes</div>
                {selectedAppro.notes}
              </div>
            )}

            {selectedAppro.statut === 'en_attente' && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleUpdateStatut(selectedAppro.id, 'annule')}>
                  <XCircle size={18} /> Annuler
                </button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => handleUpdateStatut(selectedAppro.id, 'recu')}>
                  <CheckCircle size={18} /> Valider la Réception & Compta
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
