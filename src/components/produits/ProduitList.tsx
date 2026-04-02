import { Produit } from '../../types';
import { Edit, PackagePlus, Image as ImageIcon } from 'lucide-react';
import { updateProduit } from '../../services/produitService';
import { useSaas } from '../../saas/SaasProvider';

interface ProduitListProps {
  produits: Produit[];
  onEdit: (produit: Produit) => void;
  onStock: (produit: Produit) => void;
}

export const ProduitList = ({ produits, onEdit, onStock }: ProduitListProps) => {
  const { tenant } = useSaas();
  const toggleActive = async (produit: Produit) => {
    try {
      if (!tenant?.id) return;
      await updateProduit(tenant.id, produit.id, { actif: !produit.actif });
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const getPrixActif = (produit: Produit) => {
    if (produit.prix_promo) {
      const now = new Date().getTime();
      const debut = produit.promo_debut ? new Date(produit.promo_debut).getTime() : 0;
      const fin = produit.promo_fin ? new Date(produit.promo_fin).getTime() : Infinity;
      if (now >= debut && now <= fin) {
        return (
          <div>
            <span style={{ color: 'var(--danger-color)', fontWeight: 600 }}>{produit.prix_promo.toLocaleString()} {produit.devise}</span>
            <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{produit.prix_vente.toLocaleString()}</span>
          </div>
        );
      }
    }
    return <span style={{ fontWeight: 600 }}>{produit.prix_vente?.toLocaleString()} {produit.devise}</span>;
  };

  if (produits.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
        <p>Aucun produit trouvé dans le catalogue.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Visuel</th>
            <th>ID / SKU</th>
            <th>Désignation Article</th>
            <th>Modèle Économique</th>
            <th>Niveau Stock</th>
            <th>Visibilité</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {produits.map((produit) => {
            // Robust image resolution
            const resolvedImage = produit.image_url || (Array.isArray(produit.images) && produit.images.length > 0 ? produit.images[0] : null);
            
            return (
              <tr key={produit.id} style={{ opacity: produit.actif ? 1 : 0.55, transition: 'all 0.3s ease' }} className="hover-row-premium">
                <td>
                  <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '2px solid rgba(255, 255, 255, 0.1)' }}>
                    {resolvedImage ? (
                      <img 
                        src={resolvedImage} 
                        alt={produit.nom} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.onerror = null; 
                          e.currentTarget.src = 'https://placehold.co/400x400?text=Format+Invalide';
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={20} color="var(--text-muted)" />
                      </div>
                    )}
                  </div>
                </td>
              <td>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>#{produit.sku || produit.id.slice(0, 8).toUpperCase()}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>SKU INDIVIDUEL</div>
              </td>
              <td>
                <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1.05rem' }}>{produit.nom}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Inventaire Logistique</div>
              </td>
              <td>
                <div style={{ fontWeight: 950, color: 'var(--text-main)' }}>{getPrixActif(produit)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.2rem' }}>
                  Achat: <span style={{ color: 'var(--text-muted)' }}>{produit.prix_achat?.toLocaleString()} {produit.devise}</span>
                </div>
              </td>
              <td>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '0.5rem 1rem', 
                  background: produit.stock_actuel <= (produit.stock_minimum || 5) ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '14px', 
                  border: `1px solid ${produit.stock_actuel <= (produit.stock_minimum || 5) ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                  transition: 'all 0.2s ease' 
                }}>
                   <div style={{ 
                     width: '8px', 
                     height: '8px', 
                     borderRadius: '50%', 
                     background: produit.stock_actuel <= (produit.stock_minimum || 5) ? '#f43f5e' : '#10b981',
                     animation: produit.stock_actuel <= (produit.stock_minimum || 5) ? 'nexusPulse 2s infinite' : 'none'
                   }}></div>
                   <span style={{ fontWeight: 950, fontSize: '0.85rem', color: produit.stock_actuel <= (produit.stock_minimum || 5) ? '#f43f5e' : '#10b981' }}>
                     {produit.stock_actuel} {produit.stock_actuel > 1 ? 'UNITÉS' : 'UNITÉ'}
                   </span>
                </div>
                {produit.stock_actuel <= (produit.stock_minimum || 5) && (
                   <div style={{ fontSize: '0.65rem', color: '#f43f5e', fontWeight: 900, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                     ⚠️ STOCK CRITIQUE
                   </div>
                )}
              </td>
              <td>
                <div 
                  onClick={() => toggleActive(produit)}
                  style={{ 
                    width: '48px', 
                    height: '24px', 
                    background: produit.actif ? 'var(--primary)' : 'rgba(255,255,255,0.1)', 
                    borderRadius: '30px', 
                    padding: '2px', 
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    background: 'white', 
                    borderRadius: '50%', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    transform: produit.actif ? 'translateX(24px)' : 'translateX(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}></div>
                </div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-outline" 
                    style={{ padding: '0.5rem', borderRadius: '12px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => onStock(produit)}
                    title="Mouvement de stock"
                  >
                    <PackagePlus size={18} strokeWidth={2.5} color="var(--primary)" />
                  </button>
                  <button 
                    className="btn-outline" 
                    style={{ padding: '0.5rem', borderRadius: '12px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => onEdit(produit)}
                    title="Modifier l'article"
                  >
                    <Edit size={18} strokeWidth={2.5} color="#818cf8" />
                  </button>
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
};
