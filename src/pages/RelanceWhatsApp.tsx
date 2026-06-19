import { useState, useEffect } from 'react';
import { useSaas } from '../saas/SaasProvider';
import { getCommandesByStatus, updateCommandeGlobale } from '../services/commandeService';
import type { Commande } from '../types';
import { GomboModuleFrame } from '../components/layout/GomboModuleFrame';
import { MessageCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const RelanceWhatsApp = () => {
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommandes = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const cmds = await getCommandesByStatus(tenant.id, ['a_rappeler', 'echouee', 'nouveau']);
      setCommandes(cmds as Commande[]);
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la récupération des commandes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandes();
  }, [tenant?.id]);

  const sendWhatsApp = async (c: Commande) => {
    const phone = c.telephone_client?.replace(/\D/g, '') || '';
    if (!phone) {
      showToast("Numéro invalide", "error");
      return;
    }
    const message = encodeURIComponent(`Bonjour ${c.nom_client},\n\nNous vous contactons concernant votre commande #${c.id.slice(0, 8).toUpperCase()} chez ${tenant?.nom || 'notre boutique'}. \n\nPouvons-nous reprogrammer la livraison ?`);
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
    
    try {
      if (tenant?.id) {
        const logMsg = `\n[${new Date().toLocaleString()}] Relance WhatsApp envoyée.`;
        const newNotes = (c.notes_client || '') + logMsg;
        await updateCommandeGlobale(tenant.id, c.id, { notes_client: newNotes, statut_commande: 'a_rappeler' });
        showToast("Message ouvert et historique mis à jour", "success");
        fetchCommandes();
      }
    } catch (e) {
      showToast("Erreur lors de la mise à jour de l'historique", "error");
    }
  };

  return (
    <GomboModuleFrame
      badge="Communication"
      title="Relances WhatsApp"
      description="Gérez les relances pour les commandes échouées ou à rappeler."
    >
      <div className="card glass-effect" style={{ padding: '0', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '32px', overflow: 'hidden', background: 'transparent' }}>
        <div className="table-container custom-scroll">
          <table style={{ width: '100%', fontSize: '0.9rem' }}>
            <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Client</th>
                <th style={{ padding: '1rem' }}>Téléphone</th>
                <th style={{ padding: '1rem' }}>Montant</th>
                <th style={{ padding: '1rem' }}>Statut</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commandes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ fontWeight: 800, color: 'white' }}>{c.nom_client || 'Client Inconnu'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{c.id.slice(0,8).toUpperCase()}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>{c.telephone_client}</td>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: 800, color: 'var(--primary)' }}>{c.montant_total?.toLocaleString()} CFA</td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)' }}>
                      {c.statut_commande}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                    <button 
                      className="btn"
                      onClick={() => sendWhatsApp(c)}
                      style={{ 
                        background: '#25D366', color: 'white', border: 'none', borderRadius: '12px', padding: '0.6rem 1.2rem', 
                        fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' 
                      }}
                    >
                      <MessageCircle size={18} /> Relancer
                    </button>
                  </td>
                </tr>
              ))}
              {commandes.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Aucune commande à relancer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GomboModuleFrame>
  );
};
