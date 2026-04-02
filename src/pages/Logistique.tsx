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
    <div className="animate-pageEnter">
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Supply Chain Nexus</span>
        </div>
        <h1 className="text-premium" style={{ fontSize: '2.8rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>Gestion Logistique</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: 600 }}>Coordination des tournées, affectation des livreurs et suivi terrain en temps réel.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* NEW ROUTE SECTION */}
        <div className="card glass-effect" style={{ padding: '2.5rem', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--primary-soft)', borderRadius: '14px', border: '1px solid var(--primary-border)' }}>
              <Truck size={24} color="var(--primary)" strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'white' }}>Nouvelle Tournée</h2>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Affecter à un Livreur Responsable *</label>
            <select 
              className="form-select input-futuristic" 
              value={selectedLivreur} 
              onChange={e => setSelectedLivreur(e.target.value)}
              style={{ height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', fontWeight: 700, fontSize: '0.95rem' }}
            >
              <option value="">Sélectionner le livreur...</option>
              {livreurs.map(l => <option key={l.id} value={l.id}>{l.nom_complet} ({l.telephone})</option>)}
            </select>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Colis en attente ({commandes.length})</label>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '0.3rem 0.75rem', borderRadius: '10px', border: '1px solid var(--primary-border)' }}>
                {selectedCommands.size} sélectionné(s)
              </span>
            </div>
            
            <div className="table-container custom-scroll" style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', background: 'rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-light)', backdropFilter: 'blur(10px)' }}>
                  <tr>
                    <th style={{ width: '50px', padding: '1rem' }}></th>
                    <th style={{ padding: '1rem' }}>Destination & Client</th>
                    <th style={{ textAlign: 'right', padding: '1rem' }}>Montant Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {commandes.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Aucun colis en attente de sortie.</td></tr>
                  ) : commandes.map(c => (
                    <tr key={c.id} onClick={() => toggleCommand(c.id)} style={{ cursor: 'pointer', background: selectedCommands.has(c.id) ? 'rgba(6, 182, 212, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ 
                          width: '22px', height: '22px', border: '2px solid var(--glass-border)', borderRadius: '6px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: selectedCommands.has(c.id) ? 'var(--primary)' : 'transparent',
                          borderColor: selectedCommands.has(c.id) ? 'var(--primary)' : 'var(--glass-border)'
                        }}>
                          {selectedCommands.has(c.id) && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '1px' }}></div>}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <div style={{ fontWeight: 850, color: 'white', fontSize: '1rem' }}>{c.commune_livraison}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Agent: {c.nom_client}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem', padding: '1rem' }}>{c.montant_total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', marginTop: '2.5rem', height: '64px', borderRadius: '20px', fontWeight: 950, 
              fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', 
              boxShadow: '0 20px 40px -10px rgba(6, 182, 212, 0.4)',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              border: 'none'
            }}
            onClick={handleGenerateFeuille}
            disabled={loading || selectedCommands.size === 0 || !selectedLivreur}
          >
            {loading ? 'DÉPLOIEMENT...' : 'VALIDER LA FEUILLE DE ROUTE'}
          </button>
        </div>

        {/* ACTIVE ROUTES SECTION */}
        <div className="card glass-effect" style={{ padding: '2.5rem', background: 'rgba(2, 6, 23, 0.4)', border: '1px dashed var(--glass-border)', borderRadius: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Clock size={24} color="#10b981" strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'white' }}>Tournées Actives</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeFeuilles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 2.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <p style={{ color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Toutes les tournées sont closes.</p>
              </div>
            ) : activeFeuilles.map(f => (
              <div key={f.id} className="nexus-card-lite hover-scale" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>Responsable Logistique</div>
                    <div style={{ fontWeight: 950, color: 'white', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                      {livreurs.find(l => l.id === f.livreur_id)?.nom_complet || 'Livreur Inconnu'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#10b981' }}>{format(new Date(f.date), 'HH:mm')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{format(new Date(f.date), 'dd MMM yyyy')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  {f.communes_couvertes?.map(commune => (
                    <span key={commune} style={{ fontSize: '0.7rem', fontWeight: 900, background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '8px', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {commune}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1, height: '48px', fontWeight: 900, borderRadius: '14px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }} onClick={() => setSelectedFeuille(f)}>
                    <Eye size={18} strokeWidth={2.5} /> Détails
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, height: '48px', fontWeight: 900, borderRadius: '14px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => handlePrint(f)}>
                    <Printer size={18} strokeWidth={2.5} /> Imprimer
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
    <div className="modal-backdrop animate-fadeIn" onClick={onClose} style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.85)' }}>
      <div className="card glass-effect animate-modalUp" style={{ maxWidth: '900px', width: '95%', padding: '3.5rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '40px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0, color: 'white', letterSpacing: '-0.02em' }}>Tournée Opérationnelle</h2>
            <p style={{ color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.4rem' }}>Récapitulatif des ordres de livraison pour ce secteur.</p>
          </div>
          <button className="btn btn-outline" onClick={onClose} style={{ borderRadius: '14px', height: '48px', padding: '0 1.5rem' }}>Fermer</button>
        </div>

        {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
                <p style={{ color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Synchronisation des données...</p>
            </div>
        ) : (
          <div className="table-container" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <table className="table-responsive-cards">
              <thead>
                <tr>
                  <th style={{ padding: '1.25rem' }}>Client & Contact</th>
                  <th style={{ padding: '1.25rem' }}>Secteur</th>
                  <th style={{ padding: '1.25rem' }}>État Actuel</th>
                  <th style={{ textAlign: 'right', padding: '1.25rem' }}>Net à Encaisser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: 850, color: 'white' }}>{o.nom_client}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{o.telephone_client}</div>
                    </td>
                    <td style={{ padding: '1.25rem', fontWeight: 700 }}>{o.commune_livraison}</td>
                    <td style={{ padding: '1.25rem' }}>
                        <span style={{ 
                            fontSize: '0.65rem', padding: '0.3rem 0.75rem', borderRadius: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
                            background: o.statut_commande === 'livree' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: o.statut_commande === 'livree' ? '#10b981' : '#f59e0b',
                            border: o.statut_commande === 'livree' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                            {o.statut_commande}
                        </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'white', fontSize: '1.1rem', padding: '1.25rem' }}>{o.montant_total?.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>CFA</span></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
                  <td colSpan={3} style={{ fontWeight: 900, padding: '1.75rem', color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.85rem' }}>VALEUR TOTALE DE LA CARGAISON</td>
                  <td style={{ textAlign: 'right', fontWeight: 950, color: 'var(--primary)', fontSize: '1.4rem', padding: '1.75rem' }}>
                    {feuille.total_montant_theorique?.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>CFA</span>
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
