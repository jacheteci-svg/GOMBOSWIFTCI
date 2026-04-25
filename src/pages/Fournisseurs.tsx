import { useState, useEffect, useMemo } from 'react';
import { getFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur } from '../services/fournisseurService';
import { getApprovisionnements } from '../services/approvisionnementService';
import { Fournisseur, Approvisionnement } from '../types';
import { useSaas } from '../saas/SaasProvider';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Edit2, 
  Trash2,
  X,
  Save,
  Truck,
  Building2,
  Info,
  History,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

export const Fournisseurs = () => {
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [allAppros, setAllAppros] = useState<Approvisionnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Omit<Fournisseur, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    notes: ''
  });

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [fours, appros] = await Promise.all([
        getFournisseurs(tenant.id),
        getApprovisionnements(tenant.id)
      ]);
      setFournisseurs(fours);
      setAllAppros(appros);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id]);

  const filteredFournisseurs = useMemo(() => {
    return fournisseurs.filter(f => 
      f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.telephone && f.telephone.includes(searchTerm))
    );
  }, [fournisseurs, searchTerm]);

  const handleOpenAdd = () => {
    setSelectedFournisseur(null);
    setFormData({ nom: '', telephone: '', email: '', adresse: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Fournisseur) => {
    setSelectedFournisseur(f);
    setFormData({
      nom: f.nom,
      telephone: f.telephone || '',
      email: f.email || '',
      adresse: f.adresse || '',
      notes: f.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (f: Fournisseur) => {
    setSelectedFournisseur(f);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;

    try {
      if (selectedFournisseur) {
        await updateFournisseur(tenant.id, selectedFournisseur.id, formData);
        showToast("Fournisseur mis à jour", "success");
      } else {
        await createFournisseur(tenant.id, formData);
        showToast("Fournisseur ajouté", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenant?.id || !window.confirm("Supprimer ce fournisseur ?")) return;
    try {
      await deleteFournisseur(tenant.id, id);
      showToast("Fournisseur supprimé", "success");
      loadData();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const getSupplierStats = (fId: string) => {
    const supplierAppros = allAppros.filter(a => a.fournisseur_id === fId);
    const received = supplierAppros.filter(a => a.statut === 'recu');
    return {
      totalSpent: received.reduce((acc, a) => acc + Number(a.montant_total), 0),
      orderCount: supplierAppros.length,
      lastOrder: supplierAppros.length > 0 ? supplierAppros.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null
    };
  };

  return (
    <div style={{ animation: 'pageEnter 0.4s ease', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="gombo-module-h1" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={36} color="var(--primary)" /> Gestion Fournisseurs
          </h1>
          <p className="gombo-module-lead">Centralisez vos relations fournisseurs et suivez vos volumes d'achats.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd} style={{ height: '56px', padding: '0 2rem', borderRadius: '16px', fontWeight: 800, boxShadow: '0 10px 20px rgba(6, 182, 212, 0.3)' }}>
          <Plus size={20} /> Ajouter un Fournisseur
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '2rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Rechercher un nom ou téléphone..." 
            style={{ paddingLeft: '3rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Chargement des partenaires...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredFournisseurs.map(f => {
              const stats = getSupplierStats(f.id);
              return (
                <div key={f.id} className="card supplier-card" style={{ padding: '1.75rem', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Truck size={24} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="icon-btn" onClick={() => handleOpenEdit(f)} title="Modifier">
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn" style={{ color: '#f87171' }} onClick={() => handleDelete(f.id)} title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.75rem', color: 'white' }}>{f.nom}</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    {f.telephone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <Phone size={14} color="var(--primary)" /> {f.telephone}
                      </div>
                    )}
                    {f.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <Mail size={14} color="var(--primary)" /> {f.email}
                      </div>
                    )}
                    {f.adresse && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <MapPin size={14} color="var(--primary)" /> {f.adresse}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Achats</div>
                      <div style={{ fontSize: '1rem', fontWeight: 900 }}>{stats.totalSpent.toLocaleString()} F</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Commandes</div>
                      <div style={{ fontSize: '1rem', fontWeight: 900 }}>{stats.orderCount}</div>
                    </div>
                  </div>

                  <button className="btn btn-outline" style={{ width: '100%', minHeight: '44px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }} onClick={() => handleOpenDetail(f)}>
                    <History size={16} style={{ marginRight: '0.5rem' }} /> Historique & Détails
                  </button>
                </div>
              );
            })}
            {filteredFournisseurs.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem' }}>
                <Building2 size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Aucun fournisseur ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', animation: 'scaleUp 0.3s ease', padding: '2.5rem', borderRadius: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0 }}>
                {selectedFournisseur ? 'Éditer Fournisseur' : 'Nouveau Fournisseur'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '2.5rem' }}>
                <div className="form-group">
                  <label className="form-label-premium">Nom de l'entreprise / Contact</label>
                  <input 
                    className="form-input" 
                    required 
                    placeholder="Ex: Distribution Express SARL"
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label-premium">Téléphone</label>
                    <input 
                      className="form-input" 
                      placeholder="+225 07..."
                      value={formData.telephone}
                      onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label-premium">Email</label>
                    <input 
                      className="form-input" 
                      type="email" 
                      placeholder="contact@fournisseur.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label-premium">Adresse Physique</label>
                  <input 
                    className="form-input" 
                    placeholder="Ex: Abidjan, Cocody Angré 7e Tranche"
                    value={formData.adresse}
                    onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-premium">Notes & Conditions</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Délais de paiement, produits phares, notes de négociation..."
                    style={{ minHeight: '100px' }}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, height: '54px', borderRadius: '14px', fontWeight: 800 }} onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1.5, height: '54px', borderRadius: '14px', fontWeight: 900 }}>
                  <Save size={20} style={{ marginRight: '0.5rem' }} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedFournisseur && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleUp 0.3s ease', padding: '2.5rem', borderRadius: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0 }}>Profil Fournisseur</h2>
                <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem', marginTop: '0.25rem' }}>{selectedFournisseur.nom}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={18} color="var(--primary)" /> Coordonnées & Infos
                </h4>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Phone size={16} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>TÉLÉPHONE</div>
                      <div style={{ fontWeight: 700 }}>{selectedFournisseur.telephone || '-'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={16} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>EMAIL</div>
                      <div style={{ fontWeight: 700 }}>{selectedFournisseur.email || '-'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={16} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>ADRESSE</div>
                      <div style={{ fontWeight: 700 }}>{selectedFournisseur.adresse || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', padding: '1.5rem', borderRadius: '20px', color: 'white', boxShadow: '0 10px 20px rgba(6, 182, 212, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.5rem' }}>TOTAL INVESTI</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 950 }}>{getSupplierStats(selectedFournisseur.id).totalSpent.toLocaleString()} F</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, opacity: 0.9 }}>
                    <TrendingUp size={14} /> Volume cumulé reçu
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>COMMANDES TOTALES</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 950 }}>{getSupplierStats(selectedFournisseur.id).orderCount}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                    <PackageCheck size={14} /> Toutes périodes confondues
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <h4 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="var(--primary)" /> Historique des Approvisionnements
              </h4>
              <div className="table-container" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', background: 'rgba(0,0,0,0.2)' }}>
                <table>
                  <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th style={{ padding: '1rem' }}>Référence</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Montant</th>
                      <th style={{ padding: '1rem' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAppros.filter(a => a.fournisseur_id === selectedFournisseur.id).map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{format(new Date(a.date), 'dd/MM/yyyy')}</td>
                        <td style={{ padding: '1rem' }}><code style={{ color: 'var(--primary)' }}>#{a.id.substring(0, 8).toUpperCase()}</code></td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800 }}>{Number(a.montant_total).toLocaleString()} F</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '20px',
                            fontWeight: 800,
                            background: a.statut === 'recu' ? 'rgba(16, 185, 129, 0.1)' : a.statut === 'annule' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: a.statut === 'recu' ? '#10b981' : a.statut === 'annule' ? '#f87171' : '#f59e0b'
                          }}>
                            {a.statut.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {allAppros.filter(a => a.fournisseur_id === selectedFournisseur.id).length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucun approvisionnement pour ce fournisseur.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedFournisseur.notes && (
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Notes Particulières</div>
                <div style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '0.95rem' }}>{selectedFournisseur.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .supplier-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary) !important;
          box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        }
        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          background: white;
          color: black;
        }
        .form-label-premium {
          display: block;
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--primary);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
