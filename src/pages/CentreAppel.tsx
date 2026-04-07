import { useState, useEffect } from 'react';
import { CommandeList } from '../components/commandes/CommandeList';
import { AppelForm } from '../components/centre-appel/AppelForm';
import { CommandeDetails } from '../components/commandes/CommandeDetails';
import { subscribeToCommandesByStatus } from '../services/commandeService';
import { useSaas } from '../saas/SaasProvider';
import type { Commande } from '../types';
import { GomboModuleFrame } from '../components/layout/GomboModuleFrame';

export const CentreAppel = () => {
  const { tenant } = useSaas();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [viewingCommandeId, setViewingCommandeId] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant?.id) return;
    setLoading(true);
    const unsubscribe = subscribeToCommandesByStatus(tenant.id, ['en_attente_appel', 'a_rappeler'], (data) => {
      setCommandes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenant?.id]);

  return (
    <>
      <GomboModuleFrame
        badge="Gombo Voice"
        title="Centre d'appel"
        description="Gestion des flux de validation client et relances téléphoniques."
        tight
      >
        <div className="card glass-effect" style={{ marginBottom: '2.5rem', padding: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
              Flux à Traiter 
              <span style={{ marginLeft: '1rem', padding: '0.2rem 0.8rem', background: 'rgba(99, 102, 255, 0.1)', borderRadius: '10px', fontSize: '0.9rem' }}>
                {commandes.length} commandes
              </span>
            </h3>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ fontWeight: 600 }}>Récupération des appels prioritaires...</p>
            </div>
          ) : (
            <CommandeList 
              commandes={[...commandes].sort((a, b) => {
                if (a.statut_commande === 'a_rappeler' && b.statut_commande !== 'a_rappeler') return -1;
                if (a.statut_commande !== 'a_rappeler' && b.statut_commande === 'a_rappeler') return 1;
                return 0;
              })} 
              onActionClick={setSelectedCommande}
              onViewClick={(c) => setViewingCommandeId(c.id)}
              actionIcon="PhoneCall"
              actionLabel="Lancer l'appel"
            />
          )}
        </div>
      </GomboModuleFrame>

      {selectedCommande && (
        <AppelForm 
          commande={selectedCommande}
          onClose={() => setSelectedCommande(null)}
          onSave={() => setSelectedCommande(null)}
        />
      )}

      {viewingCommandeId && (
        <CommandeDetails 
          commandeId={viewingCommandeId} 
          onClose={() => setViewingCommandeId(null)} 
        />
      )}
    </>
  );
};
