import { useState, useEffect, useMemo } from 'react';
import { getApprovisionnements, createApprovisionnement, updateApprovisionnementStatut, getApprovisionnementLignes } from '../services/approvisionnementService';
import { getFournisseurs } from '../services/fournisseurService';
import { getProduits } from '../services/produitService';
import { generateProcurementPDF } from '../services/pdfService';
import { Approvisionnement, Fournisseur, Produit, LigneApprovisionnement } from '../types';
import { useSaas } from '../saas/SaasProvider';
import { useToast } from '../contexts/ToastContext';
import { format, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  Trash2,
  X,
  Save,
  Package,
  FileText,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { tenantToPdfBranding } from '../lib/tenantPdfBranding';

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
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const filteredAppros = useMemo(() => {
    return approvisionnements.filter(a => 
      a.fournisseur?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [approvisionnements, searchTerm]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    
    const thisMonth = approvisionnements.filter(a => new Date(a.date) >= monthStart);
    const pending = approvisionnements.filter(a => a.statut === 'en_attente');
    
    return {
      totalMonth: thisMonth.reduce((acc, a) => acc + Number(a.montant_total), 0),
      countMonth: thisMonth.length,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((acc, a) => acc + Number(a.montant_total), 0)
    };
  }, [approvisionnements]);

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
      showToast("Veuillez ajouter au moins un produit", "info");
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

  const handlePrint = async () => {
    if (!selectedAppro) return;
    try {
      const branding = tenantToPdfBranding(tenant);
      await generateProcurementPDF(selectedAppro, selectedLignes, branding);
      showToast("PDF généré", "success");
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la génération PDF", "error");
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
      case 'recu': return <span className="badge badge-success" style={{ gap: '0.4rem', padding: '0.4rem 0.8rem' }}><CheckCircle size={14} /> Reçu</span>;
      case 'annule': return <span className="badge badge-danger" style={{ gap: '0.4rem', padding: '0.4rem 0.8rem' }}><XCircle size={14} /> Annulé</span>;
      default: return <span className="badge badge-warning" style={{ gap: '0.4rem', padding: '0.4rem 0.8rem' }}><Clock size={14} /> En attente</span>;
    }
  };

  return (
    <div style={{ animation: 'pageEnter 0.4s ease', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="gombo-module-h1" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Truck size={36} color="var(--primary)" /> Approvisionnements
          </h1>
          <p className="gombo-module-lead">Pilotez vos achats et automatisez l'impact sur votre trésorerie.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal} style={{ height: '56px', padding: '0 2rem', borderRadius: '16px', fontWeight: 800, boxShadow: '0 10px 20px rgba(6, 182, 212, 0.3)' }}>
          <Plus size={20} /> Nouvel Appro
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card glass-effect" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Achats ce mois</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{stats.totalMonth.toLocaleString()} F</h3>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>{stats.countMonth} bons enregistrés</p>
          </div>
        </div>

        <div className="card glass-effect" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>En attente de réception</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{stats.pendingAmount.toLocaleString()} F</h3>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>{stats.pendingCount} commandes actives</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Rechercher un fournisseur ou ID..." 
              style={{ paddingLeft: '3rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button className="btn btn-outline" style={{ minHeight: '44px', padding: '0 1rem', fontSize: '0.85rem' }}>
               <Filter size={16} /> Filtres Avancés
             </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Synchronisation des flux logistiques...</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Fournisseur</th>
                  <th>Montant Total</th>
                  <th>Statut</th>
                  <th>Mode</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppros.map(a => (
                  <tr key={a.id} className="table-row-hover" style={{ transition: 'all 0.2s' }}>
                    <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800 }}>#{a.id.substring(0, 8).toUpperCase()}</code></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {format(new Date(a.date), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '0.95rem' }}>{a.fournisseur?.nom || 'Inconnu'}</td>
                    <td style={{ fontWeight: 900, color: 'white', fontSize: '1rem' }}>{Number(a.montant_total).toLocaleString()} F</td>
                    <td>{getStatutBadge(a.statut)}</td>
                    <td style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.8 }}>{a.mode_paiement}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline" style={{ minHeight: '36px', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 }} onClick={() => handleViewAppro(a)}>
                        Détails <ChevronRight size={14} style={{ marginLeft: '0.25rem' }} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAppros.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '5rem' }}>
                      <Package size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                      <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>Aucun mouvement d'approvisionnement trouvé.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>Nouvel Approvisionnement</h2>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontWeight: 600 }}>Configurez une nouvelle entrée de stock.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fournisseur Partenaire</label>
                  <select 
                    className="form-select" 
                    required 
                    style={{ width: '100%', height: '54px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', fontWeight: 700 }}
                    value={formData.fournisseur_id}
                    onChange={e => setFormData({ ...formData, fournisseur_id: e.target.value })}
                  >
                    <option value="">Sélectionner un fournisseur...</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Canal de Paiement</label>
                  <select 
                    className="form-select" 
                    style={{ width: '100%', height: '54px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', fontWeight: 700 }}
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

              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 850, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Package size={20} color="var(--primary)" /> Articles & Volumes
                  </h3>
                  <button type="button" className="btn btn-outline" style={{ minHeight: '40px', fontSize: '0.85rem', fontWeight: 800, padding: '0 1.25rem' }} onClick={handleAddLigne}>
                    <Plus size={16} style={{ marginRight: '0.4rem' }} /> Ajouter une ligne
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formLignes.map((l, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1.5fr auto', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', animation: 'slideIn 0.3s ease' }}>
                      <select 
                        className="form-select" 
                        required 
                        style={{ background: 'rgba(0,0,0,0.2)', height: '48px', borderRadius: '10px' }}
                        value={l.produit_id}
                        onChange={e => handleLigneChange(idx, 'produit_id', e.target.value)}
                      >
                        <option value="">Choisir un produit...</option>
                        {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="Qté" 
                        min="1" 
                        required 
                        style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', height: '48px', borderRadius: '10px' }}
                        value={l.quantite}
                        onChange={e => handleLigneChange(idx, 'quantite', parseInt(e.target.value))}
                      />
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="Prix Unitaire" 
                          style={{ width: '100%', paddingRight: '2.5rem', background: 'rgba(0,0,0,0.2)', height: '48px', borderRadius: '10px', fontWeight: 800 }}
                          value={l.prix_unitaire}
                          onChange={e => handleLigneChange(idx, 'prix_unitaire', parseFloat(e.target.value))}
                        />
                        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)' }}>F</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveLigne(idx)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formLignes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '20px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)' }}>
                      <AlertCircle size={36} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p style={{ fontWeight: 700 }}>Votre liste de produits est vide.</p>
                      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Cliquez sur "Ajouter une ligne" pour commencer votre saisie.</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(6, 182, 212, 0.2)', marginBottom: '2.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Notes internes / Justification</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Précisez ici les détails de la livraison, n° de facture fournisseur..."
                    style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: 'none', padding: '1rem' }}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.5rem', opacity: 0.8 }}>TOTAL DE L'APPROVISIONNEMENT</div>
                  <div style={{ fontSize: '3rem', fontWeight: 950, color: 'white', letterSpacing: '-0.03em' }}>{calculateTotal().toLocaleString()} <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>F</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, height: '56px', borderRadius: '16px', fontWeight: 800 }} onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5, height: '56px', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem' }}>
                  <Save size={22} style={{ marginRight: '0.5rem' }} /> Enregistrer le Bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedAppro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', animation: 'scaleUp 0.3s ease', padding: '2.5rem', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                   <h2 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0 }}>Appro #{selectedAppro.id.substring(0, 8).toUpperCase()}</h2>
                   {getStatutBadge(selectedAppro.statut)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Calendar size={14} /> {format(new Date(selectedAppro.date), 'dd MMMM yyyy HH:mm', { locale: fr })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handlePrint} className="btn btn-outline" style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0 }}>
                  <Printer size={20} />
                </button>
                <button onClick={() => setIsViewModalOpen(false)} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Expéditeur / Fournisseur</div>
                <div style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selectedAppro.fournisseur?.nom}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>{selectedAppro.fournisseur?.telephone || 'Pas de téléphone'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{selectedAppro.fournisseur?.email || 'Pas d\'email'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Informations Paiement</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedAppro.mode_paiement}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Montant HT: {Number(selectedAppro.montant_total).toLocaleString()} F</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Taxe: 0 F</div>
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color="var(--primary)" /> Détails de la cargaison
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <tr>
                      <th style={{ padding: '1rem', fontSize: '0.75rem' }}>Produit</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', textAlign: 'center' }}>Quantité</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', textAlign: 'right' }}>Prix Un.</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLignes.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{l.nom_produit}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>{l.quantite}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', opacity: 0.8 }}>{Number(l.prix_unitaire).toLocaleString()} F</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, color: 'var(--primary)' }}>{Number(l.montant_ligne).toLocaleString()} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.5rem', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '0 0 16px 16px' }}>
                 <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '1rem' }}>TOTAL GÉNÉRAL :</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 950, color: 'white' }}>{Number(selectedAppro.montant_total).toLocaleString()} F</span>
                 </div>
              </div>
            </div>

            {selectedAppro.notes && (
              <div style={{ marginBottom: '2.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', fontSize: '0.9rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Notes & Instructions</div>
                <div style={{ lineHeight: '1.6', opacity: 0.9 }}>{selectedAppro.notes}</div>
              </div>
            )}

            {selectedAppro.statut === 'en_attente' && (
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <button className="btn btn-outline" style={{ flex: 1, borderColor: '#f87171', color: '#f87171', height: '56px', borderRadius: '16px', fontWeight: 800 }} onClick={() => handleUpdateStatut(selectedAppro.id, 'annule')}>
                  <XCircle size={20} /> Annuler
                </button>
                <button className="btn btn-primary" style={{ flex: 2, height: '56px', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }} onClick={() => handleUpdateStatut(selectedAppro.id, 'recu')}>
                  <CheckCircle size={22} /> Confirmer la Réception (Impact Compta)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .table-row-hover:hover {
          background: rgba(255,255,255,0.03) !important;
          transform: translateX(4px);
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
};
