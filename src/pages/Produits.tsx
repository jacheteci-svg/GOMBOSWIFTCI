import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { ProduitList } from '../components/produits/ProduitList';
import { ProduitForm } from '../components/produits/ProduitForm';
import { StockForm } from '../components/produits/StockForm';
import { subscribeToProduits } from '../services/produitService';
import { Produit } from '../types';
import { useSaas } from '../saas/SaasProvider';
import { GomboModuleFrame } from '../components/layout/GomboModuleFrame';

export const Produits = () => {
  const { tenant, planConfig } = useSaas();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isProduitFormOpen, setIsProduitFormOpen] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  
  const [isStockFormOpen, setIsStockFormOpen] = useState(false);
  const [stockProduit, setStockProduit] = useState<Produit | null>(null);

  useEffect(() => {
    if (!tenant?.id) return;
    setLoading(true);
    const unsubscribe = subscribeToProduits(tenant.id, (data) => {
      setProduits(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenant?.id]);

  const handleEdit = (produit: Produit) => {
    setSelectedProduit(produit);
    setIsProduitFormOpen(true);
  };

  const handleStock = (produit: Produit) => {
    setStockProduit(produit);
    setIsStockFormOpen(true);
  };

  return (
    <>
    <GomboModuleFrame
      badge="Inventory Intelligence"
      title="Catalogue Inventaire"
      description="Pilotez votre catalogue, vos marges et vos niveaux de stock stratégiques."
      actions={
        <button 
          className="btn btn-primary" 
          style={{ 
              height: '64px', 
              padding: '0 2.5rem', 
              borderRadius: '20px', 
              fontWeight: 950, 
              fontSize: '1.1rem', 
              boxShadow: '0 20px 40px -10px rgba(6, 182, 212, 0.4)',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              border: 'none',
              opacity: (planConfig?.max_products && planConfig.max_products !== -1 && produits.length >= planConfig.max_products) ? 0.6 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
          onClick={() => { 
              if (planConfig?.max_products && planConfig.max_products !== -1 && produits.length >= planConfig.max_products) {
                  alert(`Limite de produits atteinte (${planConfig.max_products} pour votre forfait ${planConfig.name}). Veuillez passer au forfait supérieur.`);
                  return;
              }
              setSelectedProduit(null); 
              setIsProduitFormOpen(true); 
          }}
        >
          <Plus size={24} strokeWidth={3} style={{ marginRight: '0.75rem' }} />
          Nouveau Produit
        </button>
      }
    >
      <div className="card glass-effect" style={{ marginBottom: '3.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '28px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ position: 'relative', maxWidth: '800px' }}>
          <Search size={24} strokeWidth={3} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
          <input 
            type="text" 
            placeholder="Rechercher une référence, un nom ou une catégorie..." 
            className="form-input input-futuristic"
            style={{ paddingLeft: '4rem', height: '64px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.02)', color: 'white' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card glass-effect" style={{ padding: '0', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '32px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
             <div className="spinner" style={{ margin: '0 auto 2rem', width: '50px', height: '50px', borderTopColor: 'var(--primary)' }}></div>
             <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Synchronisation du Gombo...</p>
          </div>
        ) : (
          <ProduitList 
            produits={produits.filter(p => 
              p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.id.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEdit={handleEdit}
            onStock={handleStock}
          />
        )}
      </div>
    </GomboModuleFrame>

      {isProduitFormOpen && (
        <ProduitForm 
          produit={selectedProduit} 
          onClose={() => setIsProduitFormOpen(false)} 
          onSave={() => setIsProduitFormOpen(false)} 
        />
      )}

      {isStockFormOpen && stockProduit && (
        <StockForm 
          produit={stockProduit} 
          onClose={() => setIsStockFormOpen(false)} 
          onSave={() => setIsStockFormOpen(false)} 
        />
      )}
    </>
  );
};
