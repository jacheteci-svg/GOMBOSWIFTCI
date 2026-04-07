import { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, Download } from 'lucide-react';
import { CommandeList } from '../components/commandes/CommandeList';
import { CommandeForm } from '../components/commandes/CommandeForm';
import { CommandeDetails } from '../components/commandes/CommandeDetails';
import { subscribeToCommandes, deleteCommande, getCommandeWithLines, bulkUpdateCommandeStatus } from '../services/commandeService';
import { generateInvoicePDF } from '../services/pdfService';
import { tenantToPdfBranding } from '../lib/tenantPdfBranding';
import type { Commande } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useSaas } from '../saas/SaasProvider';
import { GomboModuleFrame } from '../components/layout/GomboModuleFrame';

export const Commandes = () => {
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'to_process' | 'in_delivery' | 'done' | 'failed'>('to_process');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleInvoice = async (commande: Commande) => {
    try {
      if (!tenant?.id) return;
      showToast("Génération de la facture...", "info");
      const fullCommande = await getCommandeWithLines(tenant.id, commande.id);
      await generateInvoicePDF(fullCommande, tenantToPdfBranding(tenant));
      showToast("Facture générée !", "success");
    } catch (error) {
      console.error(error);
      showToast("Erreur PDF.", "error");
    }
  };

  const handleDelete = async (commande: Commande) => {
    try {
      if (!tenant?.id) return;
      await deleteCommande(tenant.id, commande.id);
      showToast("Commande supprimée.", "success");
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la suppression.", "error");
    }
  };

  const handleBulkValidate = async () => {
    if (selectedIds.length === 0) return;
    try {
      if (!tenant?.id) return;
      showToast(`Validation de ${selectedIds.length} commandes...`, "info");
      await bulkUpdateCommandeStatus(tenant.id, selectedIds, 'validee');
      showToast(`${selectedIds.length} commandes validées !`, "success");
      setSelectedIds([]);
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de la validation groupée.", "error");
    }
  };

  const handleLogisticsExport = async () => {
    if (selectedIds.length === 0) return;
    try {
      if (!tenant?.id) return;
      showToast("Préparation de l'export logistique...", "info");
      const selectedCommandes = await Promise.all(selectedIds.map(id => getCommandeWithLines(tenant.id, id)));
      
      const headers = ['ID', 'Client', 'Téléphone', 'Commune', 'Adresse', 'Montant à Encaisser', 'Produits'];
      const rows = selectedCommandes.map(c => [
        `#${c.id.slice(0, 8).toUpperCase()}`,
        c.nom_client || '',
        c.telephone_client || '',
        c.commune_livraison || '',
        c.adresse_livraison?.replace(/,/g, ' ') || '',
        `${c.montant_total} CFA`,
        c.lignes.map(l => `${l.quantite}x ${l.nom_produit}`).join(' | ')
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `export_logistique_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Export logistique téléchargé !", "success");
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'export.", "error");
    }
  };

  useEffect(() => {
    if (!tenant?.id) return;
    setLoading(true);
    const unsubscribe = subscribeToCommandes(tenant.id, (data) => {
      setCommandes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenant?.id]);

  const filteredCommandes = commandes.filter(c => {
    const matchesSearch = 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telephone_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nom_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.commune_livraison?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'to_process') return ['nouvelle', 'en_attente_appel', 'a_rappeler'].includes(c.statut_commande);
    if (activeTab === 'in_delivery') return ['validee', 'en_cours_livraison'].includes(c.statut_commande);
    if (activeTab === 'done') return ['livree', 'terminee'].includes(c.statut_commande);
    if (activeTab === 'failed') return ['echouee', 'retour_livreur', 'retour_stock'].includes(c.statut_commande);
    
    return true;
  });

  return (
    <>
    <GomboModuleFrame
      badge="Order Gombo Flow"
      title="Gestion des Commandes"
      description="Pilotez le cycle de vie de vos ventes, de la saisie à la livraison finale."
      actions={
        <button 
          className="btn btn-primary" 
          onClick={() => setIsFormOpen(true)} 
          style={{ 
            height: '64px', 
            padding: '0 2.5rem', 
            borderRadius: '20px', 
            fontWeight: 950, 
            fontSize: '1.1rem',
            boxShadow: '0 20px 40px -10px rgba(6, 182, 212, 0.4)',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Plus size={24} strokeWidth={3} />
          Nouvelle Saisie
        </button>
      }
    >
        {/* BARRE DE RECHERCHE ET TABS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '3.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '320px' }}>
            <Search size={24} strokeWidth={3} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
            <input 
              type="text" 
              placeholder="Rechercher un client, téléphone, ID ou zone de chalandise..." 
              className="form-input input-futuristic"
              style={{ 
                paddingLeft: '4rem', 
                height: '64px',
                fontSize: '1.1rem',
                borderRadius: '20px', 
                background: 'rgba(255,255,255,0.02)',
                border: 'none',
                color: 'white',
                fontWeight: 800,
                transition: 'all 0.3s ease'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', height: 'fit-content', backdropFilter: 'blur(10px)' }}>
            {[
              { id: 'to_process', label: 'À Traiter', color: '#f59e0b' },
              { id: 'in_delivery', label: 'En Livraison', color: 'var(--primary)' },
              { id: 'done', label: 'Terminées', color: '#10b981' },
              { id: 'failed', label: 'Retours/Échecs', color: '#ef4444' },
              { id: 'all', label: 'Tout', color: 'rgba(255,255,255,0.1)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: 'none',
                  background: activeTab === tab.id ? tab.color : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                  boxShadow: activeTab === tab.id ? `0 10px 20px ${tab.color}44` : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card glass-effect" style={{ padding: '0', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '32px', overflow: 'hidden', background: 'transparent' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
               <div className="spinner" style={{ margin: '0 auto 2rem', width: '50px', height: '50px', borderTopColor: 'var(--primary)' }}></div>
               <p style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Synchronisation des flux Atlas...</p>
            </div>
          ) : (
            <CommandeList 
              commandes={filteredCommandes} 
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onActionClick={(c) => setSelectedCommandeId(c.id)}
              onDelete={handleDelete}
              onInvoiceClick={handleInvoice}
            />
          )}

          {selectedIds.length > 0 && (
            <div 
              className="animate-modalUp"
              style={{ 
                position: 'fixed', 
                bottom: '3rem', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                background: 'rgba(2, 6, 23, 0.8)', 
                backdropFilter: 'blur(20px)',
                padding: '1.25rem 2.5rem', 
                borderRadius: '30px', 
                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '2rem',
                border: '1px solid rgba(255,255,255,0.05)',
                zIndex: 1000,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '2rem' }}>
                <div style={{ 
                    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', 
                    color: 'white', width: '36px', height: '36px', borderRadius: '12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 950,
                    boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                }}>
                  {selectedIds.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'white' }}>Commandes Sélectionnées</span>
                    <button 
                      onClick={() => setSelectedIds([])}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, padding: 0 }}
                    >
                      Désélectionner tout
                    </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-sm btn-primary" 
                  onClick={handleBulkValidate}
                  style={{ borderRadius: '12px', padding: '0.6rem 1.2rem' }}
                >
                  <CheckCircle size={18} /> Valider Groupée
                </button>
                <button 
                  className="btn btn-sm btn-outline" 
                  onClick={handleLogisticsExport}
                  style={{ borderRadius: '12px', padding: '0.6rem 1.2rem', border: '1px solid #e2e8f0' }}
                >
                  <Download size={18} /> Export Livreurs
                </button>
              </div>
            </div>
          )}
        </div>
    </GomboModuleFrame>

      {isFormOpen && (
        <CommandeForm 
          onClose={() => setIsFormOpen(false)} 
          onSave={() => setIsFormOpen(false)} 
        />
      )}

      {selectedCommandeId && (
        <CommandeDetails 
          commandeId={selectedCommandeId} 
          onClose={() => setSelectedCommandeId(null)} 
        />
      )}
    </>
  );
};
