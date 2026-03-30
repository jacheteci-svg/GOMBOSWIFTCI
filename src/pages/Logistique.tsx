import { useState, useEffect } from 'react';
import { getCommandesByStatus } from '../services/commandeService';
import { getAvailableLivreurs, creerFeuilleRoute, getFeuillesRoute, getCommandesByFeuille } from '../services/logistiqueService';
import { useSaas } from '../saas/SaasProvider';
import type { Commande, User, FeuilleRoute } from '../types';
import { Truck, Printer, Eye, Clock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { generateDeliverySlipPDF } from '../services/pdfService';
import { format } from 'date-fns';
import { CommandeDetails } from '../components/commandes/CommandeDetails';

export const Logistique = () => {
  const { showToast } = useToast();
  const [commandes, setCommandes] = useState<(Commande & { lignes: any[] })[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeuille, setSelectedFeuille] = useState<FeuilleRoute | null>(null);
  const [activeFeuilles, setActiveFeuilles] = useState<FeuilleRoute[]>([]);
  
  const [selectedCommands, setSelectedCommands] = useState<Set<string>>(new Set());
  const [selectedLivreur, setSelectedLivreur] = useState<string>('');
  const { tenant } = useSaas();
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [cmds, livs, allFeuilles] = await Promise.all([
        getCommandesByStatus(tenant.id, ['validee', 'a_rappeler']),
        getAvailableLivreurs(tenant.id),
        getFeuillesRoute(tenant.id)
      ]);
      setCommandes(cmds as any);
      setLivreurs(livs);
      
      const enCours = (allFeuilles || [])
        .filter(f => f.statut_feuille === 'en_cours')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setActiveFeuilles(enCours);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenant?.id]);

  const toggleCommand = (id: string) => {
    const newSet = new Set(selectedCommands);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCommands(newSet);
  };

  const handleGenerateFeuille = async () => {
    if (!selectedLivreur || selectedCommands.size === 0) {
      showToast("Sélectionnez un livreur et au moins une commande.", "error");
      return;
    }

    try {
      setLoading(true);
      const feuilleId = await creerFeuilleRoute(selectedLivreur, Array.from(selectedCommands), tenant?.id || 'default');
      
      if (!feuilleId) {
        throw new Error("L'identifiant de la feuille de route est manquant après la création.");
      }

      showToast("Feuille de route générée avec succès.", "success");
      setSelectedCommands(new Set());
      setSelectedLivreur('');
      fetchData();
    } catch (error: any) {
      showToast(error.message || "Erreur lors de la génération.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (feuille: FeuilleRoute) => {
    try {
      if (!tenant?.id) return;
      const orders = await getCommandesByFeuille(tenant.id, feuille.id);
      generateDeliverySlipPDF(feuille, orders);
    } catch (error) {
      showToast("Erreur lors de l'impression.", "error");
    }
  };

  return (
    <div style={{ animation: 'pageEnter 0.6s ease' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-premium" style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>Gestion Logistique</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.4rem', fontWeight: 500 }}>Coordination des tournées et affectation des livreurs.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* NEW ROUTE SECTION */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ padding: '0.6rem', background: 'rgba(99, 102, 255, 0.1)', borderRadius: '12px' }}>
              <Truck size={24} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Nouvelle Tournée</h2>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Affecter à un Livreur *</label>
            <select 
              className="form-select" 
              value={selectedLivreur} 
              onChange={e => setSelectedLivreur(e.target.value)}
              style={{ height: '52px', borderRadius: '14px', background: '#f8fafc', fontWeight: 600 }}
            >
              <option value="">Sélectionner le livreur responsable...</option>
              {livreurs.map(l => <option key={l.id} value={l.id}>{l.nom_complet} ({l.telephone})</option>)}
            </select>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Commandes Prêtes ({commandes.length})</label>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(99, 102, 255, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                {selectedCommands.size} sélectionnée(s)
              </span>
            </div>
            
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '14px' }}>
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Destination</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {commandes.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Aucun colis en attente de sortie.</td></tr>
                  ) : commandes.map(c => (
                    <tr key={c.id} onClick={() => toggleCommand(c.id)} style={{ cursor: 'pointer', background: selectedCommands.has(c.id) ? 'rgba(99, 102, 255, 0.03)' : 'transparent' }}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedCommands.has(c.id)} 
                          onChange={() => {}} 
                          style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.commune_livraison}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.nom_client}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{c.montant_total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '2rem', height: '56px', borderRadius: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 10px 15px -3px rgba(99, 102, 255, 0.3)' }}
            onClick={handleGenerateFeuille}
            disabled={loading || selectedCommands.size === 0 || !selectedLivreur}
          >
            {loading ? 'GÉNÉRATION...' : 'ÉDITER LA FEUILLE DE ROUTE'}
          </button>
        </div>

        {/* ACTIVE ROUTES SECTION */}
        <div className="card" style={{ padding: '2rem', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <Clock size={24} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Tournées en cours</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activeFeuilles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Toutes les tournées sont closes.</p>
              </div>
            ) : activeFeuilles.map(f => (
              <div key={f.id} className="card hover-card" style={{ background: 'white', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Livreur Affecté</div>
                    <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                      {livreurs.find(l => l.id === f.livreur_id)?.nom_complet || 'Livreur Inconnu'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>{format(new Date(f.date), 'HH:mm')}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{format(new Date(f.date), 'dd MMM')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {f.communes_couvertes?.map(commune => (
                    <span key={commune} style={{ fontSize: '0.7rem', fontWeight: 800, background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', color: 'var(--text-muted)' }}>
                      {commune}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1, height: '44px', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => setSelectedFeuille(f)}>
                    <Eye size={16} /> Détails
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, height: '44px', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#475569', borderColor: '#475569' }} onClick={() => handlePrint(f)}>
                    <Printer size={16} /> Imprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedFeuille && (
        <FeuilleDetail feuille={selectedFeuille} onClose={() => setSelectedFeuille(null)} />
      )}

      {selectedCommandeId && (
        <CommandeDetails 
          commandeId={selectedCommandeId} 
          onClose={() => setSelectedCommandeId(null)} 
        />
      )}
    </div>
  );
};

const FeuilleDetail = ({ feuille, onClose }: { feuille: FeuilleRoute, onClose: () => void }) => {
  const [orders, setOrders] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  const { tenant } = useSaas();

  useEffect(() => {
    if (!tenant?.id) return;
    getCommandesByFeuille(tenant.id, feuille.id).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, [feuille.id, tenant?.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content card" style={{ maxWidth: '800px', padding: '2.5rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontWeight: 900, margin: 0 }}>Récapitulatif de Tournée</h2>
          <button className="btn btn-outline" onClick={onClose}>Fermer</button>
        </div>

        {loading ? <p>Chargement...</p> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Destination</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{o.nom_client}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.telephone_client}</div>
                    </td>
                    <td>{o.commune_livraison}</td>
                    <td><span className={`badge ${o.statut_commande === 'livree' ? 'badge-success' : 'badge-warning'}`}>{o.statut_commande}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{o.montant_total?.toLocaleString()} CFA</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan={3} style={{ fontWeight: 800 }}>TOTAL THÉORIQUE</td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>
                    {feuille.total_montant_theorique?.toLocaleString()} CFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
