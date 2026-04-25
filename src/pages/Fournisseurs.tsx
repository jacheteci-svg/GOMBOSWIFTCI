import { useState, useEffect } from 'react';
import { getFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur } from '../services/fournisseurService';
import { Fournisseur } from '../types';
import { useSaas } from '../saas/SaasProvider';
import { useToast } from '../contexts/ToastContext';
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
  Truck
} from 'lucide-react';

export const Fournisseurs = () => {
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    notes: ''
  });

  const loadFournisseurs = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await getFournisseurs(tenant.id);
      setFournisseurs(data);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors du chargement des fournisseurs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFournisseurs();
  }, [tenant?.id]);

  const handleOpenModal = (f: Fournisseur | null = null) => {
    setEditingFournisseur(f);
    if (f) {
      setFormData({
        nom: f.nom,
        telephone: f.telephone || '',
        email: f.email || '',
        adresse: f.adresse || '',
        notes: f.notes || ''
      });
    } else {
      setFormData({
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;

    try {
      if (editingFournisseur) {
        await updateFournisseur(tenant.id, editingFournisseur.id, formData);
        showToast("Fournisseur mis à jour", "success");
      } else {
        await createFournisseur(tenant.id, formData);
        showToast("Fournisseur créé", "success");
      }
      setIsModalOpen(false);
      loadFournisseurs();
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
      loadFournisseurs();
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const filteredFournisseurs = fournisseurs.filter(f => 
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.telephone && f.telephone.includes(searchTerm))
  );

  return (
    <div style={{ animation: 'pageEnter 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gombo-module-h1">Fournisseurs</h1>
          <p className="gombo-module-lead">Gérez vos partenaires d'approvisionnement.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Nouveau Fournisseur
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Rechercher un fournisseur..." 
            style={{ width: '100%', paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredFournisseurs.map(f => (
            <div key={f.id} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--primary-soft)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary)' }}>
                  <Truck size={24} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ minHeight: '36px', padding: '0.5rem' }} onClick={() => handleOpenModal(f)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn btn-outline" style={{ minHeight: '36px', padding: '0.5rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDelete(f.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'white' }}>{f.nom}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} color="var(--primary)" />
                  {f.telephone || 'Non renseigné'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} color="var(--primary)" />
                  {f.email || 'Non renseigné'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={14} color="var(--primary)" />
                  {f.adresse || 'Non renseigné'}
                </div>
              </div>

              {f.notes && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  {f.notes}
                </div>
              )}
            </div>
          ))}
          {filteredFournisseurs.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              Aucun fournisseur trouvé.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', animation: 'scaleUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{editingFournisseur ? 'Modifier' : 'Nouveau'} Fournisseur</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Nom du Fournisseur</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  style={{ width: '100%' }}
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Téléphone</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    style={{ width: '100%' }}
                    value={formData.telephone}
                    onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    style={{ width: '100%' }}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Adresse</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%' }}
                  value={formData.adresse}
                  onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Notes / Remarques</label>
                <textarea 
                  className="form-input" 
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={20} /> Enregistrer
                </button>
              </div>
            </form>
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
