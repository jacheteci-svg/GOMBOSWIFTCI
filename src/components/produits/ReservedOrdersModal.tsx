import { useState, useEffect } from 'react';
import { X, AlertTriangle, XCircle, Search } from 'lucide-react';
import { insforge } from '../../lib/insforge';
import { Produit } from '../../types';
import { useSaas } from '../../saas/SaasProvider';
import { updateCommandeStatus } from '../../services/commandeService';
import { getErrorMessage } from '../../lib/errorUtils';

interface ReservedOrdersModalProps {
  produit: Produit;
  onClose: () => void;
  onOrderCancelled: () => void;
}

export const ReservedOrdersModal = ({ produit, onClose, onOrderCancelled }: ReservedOrdersModalProps) => {
  const { tenant } = useSaas();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchReservedOrders = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data, error } = await insforge.database
        .from('lignes_commandes')
        .select(`
          quantite,
          commandes!inner(
            id, date_creation, statut_commande, reference, client_nom, nom_client
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('produit_id', produit.id)
        .in('commandes.statut_commande', [
          'nouveau', 'en_attente_appel', 'validee', 'a_rappeler', 'en_preparation'
        ])
        .gte('commandes.date_creation', fourteenDaysAgo.toISOString())
        .order('commandes.date_creation', { ascending: false });

      if (error) throw error;
      
      // PostgREST join mapping
      const mapped = (data || []).map((l: any) => ({
        quantite: l.quantite,
        commande: Array.isArray(l.commandes) ? l.commandes[0] : l.commandes
      }));
      
      setOrders(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservedOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, produit.id]);

  const handleCancelOrder = async (orderId: string) => {
    if (!tenant?.id) return;
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette commande d'urgence ? Cela libérera le stock immédiatement.")) return;
    
    setCancelling(orderId);
    try {
      await updateCommandeStatus(tenant.id, orderId, 'annulee', { notes_client: 'Annulée d\'urgence pour libération de stock.' });
      onOrderCancelled();
      await fetchReservedOrders();
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err));
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 100000 }}>
      <div 
        className="modal-content card glass-effect" 
        style={{ maxWidth: '800px', width: '100%', padding: '2.5rem', borderRadius: '24px', position: 'relative' }} 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle color="#f59e0b" size={28} />
            Commandes Réservant ce Produit
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Produit: <strong>{produit.nom}</strong> (SKU: {produit.sku})<br/>
            Ces commandes bloquent actuellement <strong style={{ color: '#f59e0b' }}>{orders.reduce((acc, o) => acc + o.quantite, 0)} unités</strong>.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
             <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
            Aucune commande active ne réserve ce stock actuellement.
          </div>
        ) : (
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Réf Commande</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'center' }}>Qté Bloquée</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
                      #{o.commande.id?.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(o.commande.date_creation).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {o.commande.nom_client || o.commande.client_nom}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{o.commande.statut_commande}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 900, color: '#f59e0b' }}>
                      {o.quantite}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleCancelOrder(o.commande.id)}
                        disabled={cancelling === o.commande.id}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                        title="Annuler d'urgence pour libérer le stock"
                      >
                        {cancelling === o.commande.id ? '...' : <XCircle size={16} />} Annuler
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
