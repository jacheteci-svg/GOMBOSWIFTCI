import { useState, useEffect } from 'react';
import { getAvailableLivreurs, getFeuillesRoute, getCommandesByFeuille } from '../services/logistiqueService';
import { updateCommandeStatus } from '../services/commandeService';
import type { Commande, User, FeuilleRoute } from '../types';
import { History, Printer, Lock, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';

export const Historique = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [feuilles, setFeuilles] = useState<FeuilleRoute[]>([]);
  const [impression, setImpression] = useState<{feuille: any, commandes: Commande[]} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [livs, hist] = await Promise.all([
        getAvailableLivreurs(),
        getFeuillesRoute()
      ]);
      setLivreurs(livs);
      
      // Sort by descending date
      const sortedHist = hist.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFeuilles(sortedHist);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = async (feuille: any) => {
    try {
      const cmds = await getCommandesByFeuille(feuille.id);
      setImpression({ feuille, commandes: cmds });
      setTimeout(() => window.print(), 500);
    } catch(e) {
      showToast("Erreur lors de l'impression", "error");
    }
  };

  const handleDeleteFeuille = async (feuille: FeuilleRoute) => {
    if (feuille.statut_feuille === 'terminee') {
      showToast("Impossible de supprimer une archive classée.", "error");
      return;
    }
    
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette feuille de route en cours ?")) {
      try {
        await updateCommandeStatus(feuille.id, 'annulee'); 
        // Note: Check if you need to update feuille_route_id in orders or just the status
        showToast("Feuille de route annulée.", "success");
        fetchData();
      } catch (e) {
        showToast("Erreur lors de la suppression.", "error");
      }
    }
  };

  const feuillesEnCours = feuilles.filter(f => f.statut_feuille !== 'terminee');
  const feuillesTraitees = feuilles.filter(f => f.statut_feuille === 'terminee');

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ animation: 'pageEnter 0.6s ease' }}>
      <div style={{ marginBottom: '2.5rem' }} className="no-print">
        <h1 className="text-premium" style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History size={36} strokeWidth={2.5} />
          Historique & Archives
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.4rem', fontWeight: 500 }}>Consultez et réimprimez les feuilles de route passées ou en cours.</p>
      </div>

      {/* SECTION EN COURS */}
      <div className="card glass-effect no-print" style={{ marginBottom: '2.5rem', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245, 158, 11, 0.03)' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={22} strokeWidth={2.5} />
            Tournées en cours d'exécution
            <span style={{ marginLeft: '1rem', padding: '0.2rem 0.6rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', fontSize: '0.8rem' }}>
              {feuillesEnCours.length} actives
            </span>
          </h2>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date / Heure</th>
                <th>Réf. ID</th>
                <th>Agent de Livraison</th>
                <th>Flux Colis</th>
                <th>Valeur Théorique</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feuillesEnCours.map(h => {
                const livreur = livreurs.find(l => l.id === h.livreur_id);
                return (
                  <tr key={h.id}>
                    <td>
                       <div style={{ fontWeight: 700 }}>{format(new Date(h.date), 'dd MMM yyyy')}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(new Date(h.date), 'HH:mm')}</div>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>#{h.id.slice(0, 8).toUpperCase()}</td>
                    <td>
                       <div style={{ fontWeight: 700 }}>{livreur?.nom_complet || 'Livreur inconnu'}</div>
                    </td>
                    <td>
                      <span className="badge badge-warning" style={{ fontWeight: 800 }}>{h.total_commandes} commandes</span>
                    </td>
                    <td style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1.05rem' }}>{Number(h.total_montant_theorique).toLocaleString()} <span style={{ fontSize: '0.7rem' }}>CFA</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '10px', height: '40px', width: '40px' }} title="Imprimer pour le livreur" onClick={() => handlePrint(h)}>
                          <Printer size={18} strokeWidth={2.5} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '10px', height: '40px', width: '40px', color: '#ef4444', borderColor: '#fee2e2' }} title="Annuler la feuille" onClick={() => handleDeleteFeuille(h)}>
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {feuillesEnCours.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Libre comme l'air !</p>
                    <p style={{ fontSize: '0.9rem' }}>Aucune feuille de route active n'a été trouvée.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION ARCHIVES */}
      <div className="card glass-effect no-print" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.03)' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={22} strokeWidth={2.5} />
            Archives Scellées & Clôturées
            <span style={{ marginLeft: '1rem', padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', fontSize: '0.8rem' }}>
              {feuillesTraitees.length} terminées
            </span>
          </h2>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th>Clôturé le</th>
                <th>Réf. ID</th>
                <th>Livreur</th>
                <th>Performance</th>
                <th style={{ textAlign: 'right' }}>Caisse Reçue</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feuillesTraitees.map(h => {
                const livreur = livreurs.find(l => l.id === h.livreur_id);
                return (
                  <tr key={h.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#059669' }}>
                        {h.date_traitement ? format(new Date(h.date_traitement), 'dd MMM yyyy') : '---'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                         {h.date_traitement ? format(new Date(h.date_traitement), 'HH:mm') : ''}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{h.id.slice(0, 8).toUpperCase()}</td>
                    <td>
                       <div style={{ fontWeight: 700 }}>{livreur?.nom_complet || 'Livreur inconnu'}</div>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 800, padding: '0.3rem 0.7rem' }}>Succès total</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                       <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-main)' }}>{(h as any).montant_encaisse?.toLocaleString() || '0'} <span style={{ fontSize: '0.7rem' }}>CFA</span></div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline" style={{ borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem' }} onClick={() => handlePrint(h)}>
                        <Printer size={16} strokeWidth={2.5} style={{ marginRight: '0.4rem' }} /> Revoir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {feuillesTraitees.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontWeight: 600 }}>Le coffre est vide !</p>
                    <p style={{ fontSize: '0.9rem' }}>Aucune feuille de route n'a encore été clôturée en caisse.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Impression View Optimized */}
      {impression && (
        <div id="print-area">
           <style>{`
            @media print {
              @page { size: landscape; margin: 15mm; }
              body * { visibility: hidden; }
              #print-area, #print-area * { visibility: visible; }
              #print-area { display: block !important; position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 0; background: white; color: black; font-family: 'Inter', sans-serif; }
              .no-print { display: none !important; }
              table { border-collapse: collapse; width: 100%; margin-top: 1.5rem; table-layout: fixed; }
              th, td { border: 1px solid #1a1a1a; padding: 12px 8px; text-align: left; font-size: 11px; word-wrap: break-word; }
              th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; font-weight: 800; text-transform: uppercase; }
              .print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #000; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
              .print-logo { font-size: 24px; font-weight: 900; letter-spacing: -0.05em; }
              .print-title { font-size: 18px; font-weight: 800; color: #6366f1; text-transform: uppercase; margin-top: 0.5rem; }
            }
          `}</style>
          
          <div className="print-header">
            <div>
              <div className="print-logo">MIXLOGISTIC <span style={{ color: '#6366f1' }}>PRO</span></div>
              <div className="print-title">FEUILLE DE ROUTE LOGISTIQUE</div>
              <p style={{ margin: '0.75rem 0 0 0', fontSize: '12px', fontWeight: 600 }}>RÉFÉRENCE : #{impression.feuille.id.toUpperCase()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '0.5rem' }}>LIVREUR : {(livreurs.find(l => l.id === impression.feuille.livreur_id)?.nom_complet || 'INCONNU').toUpperCase()}</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>DATE DE SORTIE : {format(new Date(impression.feuille.date), 'dd/MM/yyyy HH:mm')}</div>
              {impression.feuille.date_traitement && (
                 <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', marginTop: '0.4rem' }}>CLÔTURÉE LE : {format(new Date(impression.feuille.date_traitement), 'dd/MM/yyyy HH:mm')}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
             <div style={{ flex: 1, padding: '1rem', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Volume de chargement</span>
                <div style={{ fontSize: '20px', fontWeight: 900 }}>{impression.feuille.total_commandes} <span style={{ fontSize: '12px' }}>Colis</span></div>
             </div>
             <div style={{ flex: 1, padding: '1rem', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Valeur Marchande Théorique</span>
                <div style={{ fontSize: '20px', fontWeight: 900 }}>{Number(impression.feuille.total_montant_theorique).toLocaleString()} <span style={{ fontSize: '12px' }}>CFA</span></div>
             </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: '10%' }}>ID</th>
                <th style={{ width: '20%' }}>Nom du Client</th>
                <th style={{ width: '15%' }}>Téléphone</th>
                <th style={{ width: '15%' }}>Zone / Ville</th>
                <th style={{ width: '20%' }}>Adresse Exacte</th>
                <th style={{ width: '10%' }}>Net à Payer</th>
                <th style={{ width: '10%' }}>Signature</th>
              </tr>
            </thead>
            <tbody>
              {impression.commandes.map(cmd => (
                <tr key={cmd.id}>
                  <td style={{ fontWeight: 800 }}>#{cmd.id.slice(0,5).toUpperCase()}</td>
                  <td style={{ fontWeight: 600 }}>{cmd.nom_client || 'Client Privé'}</td>
                  <td style={{ fontWeight: 900, fontSize: '13px' }}>{cmd.telephone_client}</td>
                  <td style={{ fontWeight: 600 }}>{cmd.commune_livraison}</td>
                  <td>{cmd.adresse_livraison}</td>
                  <td style={{ fontWeight: 900, fontSize: '12px' }}>{Number(cmd.montant_total).toLocaleString()}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
             <div style={{ borderTop: '2px solid black', width: '280px', textAlign: 'center', paddingTop: '1rem' }}>
                <div style={{ fontWeight: 900, fontSize: '12px' }}>VISA CONTRÔLE LOGISTIQUE</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '0.2rem' }}>Date et Heure de vérification</div>
             </div>
             <div style={{ borderTop: '2px solid black', width: '280px', textAlign: 'center', paddingTop: '1rem' }}>
                <div style={{ fontWeight: 900, fontSize: '12px' }}>SIGNATURE CHARGEMENT LIVREUR</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '0.2rem' }}>Prière de vérifier l'intégrité des colis</div>
             </div>
          </div>
          
          <div style={{ position: 'fixed', bottom: '10mm', left: '15mm', right: '15mm', fontSize: '9px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', textAlign: 'center' }}>
            Document généré automatiquement le {format(new Date(), 'dd/MM/yyyy HH:mm')} par MIXLOGISTIC PRO. 
            Une fois clôturée, cette archive devient inviolable et certifiée conforme aux encaissements caisse.
          </div>
        </div>
      )}
    </div>
  );
};
