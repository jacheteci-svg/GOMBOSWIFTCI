import { useState, useEffect } from 'react';
import { Users, Search, MessageCircle, Gift, Phone, MapPin, Calendar, ExternalLink, X } from 'lucide-react';
import { getAllClients, getClientCommandes } from '../services/clientService';
import type { Client, Commande } from '../types';
import { format } from 'date-fns';

export const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<{ client: Client, commandes: Commande[] } | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getAllClients();
      // On les trie, potentiellement par date d'inscription s'ils en ont une, 
      // ici on va charger tous les clients.
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openClientDetails = async (client: Client) => {
    const cmds = await getClientCommandes(client.id);
    // Trier les commandes par date décroissante
    cmds.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
    setSelectedClient({ client, commandes: cmds });
  };

  // WhatsApp Templates
  const sendWhatsApp = (client: Client, templateName: 'friendly' | 'promo' | 'reminder', commandes?: Commande[]) => {
    let message = '';
    const nom = client.nom_complet.split(' ')[0] || 'Cher client';
    
    if (templateName === 'friendly') {
      message = `Bonjour ${nom} ! 🌟\nComment allez-vous ? J'espère que vous êtes satisfait de nos services. Si vous avez besoin de quoi que ce soit, nous sommes à votre disposition !\n- L'équipe`;
    } 
    else if (templateName === 'promo') {
      message = `Coucou ${nom} ! 🎉\nEn tant que client fidèle, nous vous offrons une remise spéciale sur votre prochaine commande chez nous ! Utilisez ce code PROMO VIP.\nDécouvrez nos nouveautés dès maintenant : [Lien]`;
    } 
    else if (templateName === 'reminder' && commandes && commandes.length > 0) {
      const lastCmdDesc = `${commandes[0].montant_total.toLocaleString()} CFA`;
      message = `Bonjour ${nom} ! 😊\nCela fait un moment depuis votre dernière commande chez nous (${lastCmdDesc}). \nNous voulions prendre de vos nouvelles et vous informer que de nouveaux articles sont disponibles en stock ! Besoin de quelque chose aujourd'hui ?`;
    }

    // Nettoyer et formater le numéro
    let phone = client.telephone.replace(/\D/g, '');
    if (!phone.startsWith('225') && phone.length === 10) phone = '225' + phone; // prefix CI default if needed

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filteredClients = clients.filter(c => 
    c.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.telephone.includes(searchTerm)
  );

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  return (
    <div style={{ animation: 'pageEnter 0.6s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-premium" style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={36} strokeWidth={2.5} />
            Espace CRM Clients
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.4rem', fontWeight: 500 }}>Gérez votre base client et lancez des campagnes WhatsApp ciblées.</p>
        </div>
        <div style={{ background: 'var(--glass)', padding: '0.75rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Audience Totale</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{clients.length} <span style={{ fontSize: '0.9rem' }}>leads</span></div>
        </div>
      </div>

      {/* Barre de recherche Premium */}
      <div className="card glass-effect" style={{ marginBottom: '2.5rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={22} strokeWidth={2.5} style={{ position: 'absolute', top: '50%', left: '1.25rem', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Rechercher un client (Nom, Mobile...)" 
            style={{ paddingLeft: '3.5rem', height: '56px', fontSize: '1.05rem', fontWeight: 600, borderRadius: '18px', border: '2px solid #f1f5f9' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Liste des clients */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Identité & Contact</th>
                <th>Zone Géographique</th>
                <th>Remarques de l'Agent</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => openClientDetails(client)} className="hover-card">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                         {client.nom_complet.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.05rem' }}>{client.nom_complet}</div>
                         <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                           <Phone size={12} strokeWidth={2.5} /> {client.telephone}
                         </div>
                       </div>
                    </div>
                  </td>
                  <td>
                    {client.commune || client.ville ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                        <MapPin size={16} strokeWidth={2.5} color="var(--primary)" /> {client.commune} {client.ville ? `(${client.ville})` : ''}
                      </div>
                    ) : <span style={{ color: '#cbd5e1' }}>Non renseigné</span>}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'inline-block', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {client.remarques || '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ borderRadius: '12px', height: '40px', fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); openClientDetails(client); }}>
                      <ExternalLink size={16} strokeWidth={2.5} style={{ marginRight: '0.4rem' }} /> Dossier
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                    <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Aucun client dans les radars.</p>
                    <p style={{ fontSize: '0.9rem' }}>Ajustez vos filtres de recherche.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Details Modal Premium */}
      {selectedClient && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} onClick={() => setSelectedClient(null)}>
          <div className="card glass-effect" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '3rem', border: '1px solid rgba(255,255,255,0.2)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedClient(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} className="hover-card">
              <X size={22} fill="currentColor" />
            </button>
            
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2.5rem' }}>
               <div style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)', color: 'white', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, boxShadow: '0 20px 25px -5px rgba(99, 102, 255, 0.3)' }}>
                 {selectedClient.client.nom_complet.charAt(0).toUpperCase()}
               </div>
               <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>{selectedClient.client.nom_complet}</h2>
                    <span style={{ padding: '0.4rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Client Actif</span>
                 </div>
                 <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Phone size={18} strokeWidth={2.5} color="var(--primary)" /> {selectedClient.client.telephone}
                    </div>
                    {selectedClient.client.commune && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <MapPin size={18} strokeWidth={2.5} color="var(--primary)" /> {selectedClient.client.commune}
                      </div>
                    )}
                 </div>
               </div>
            </div>

            {/* FIDÉLISATION WHATSAPP - SECTEUR STRATÉGIQUE */}
            <div style={{ background: '#f0fdf4', padding: '2rem', borderRadius: '24px', border: '1px solid #bbf7d0', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#166534' }}>
                  <MessageCircle size={24} strokeWidth={2.5} />
                  Actions de Fidélisation Directe
                </h3>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', background: 'rgba(22, 101, 52, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '8px' }}>VIA WHATSAPP BUSINESS</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <button className="btn" style={{ height: '60px', borderRadius: '16px', backgroundColor: '#25D366', color: 'white', fontWeight: 800, display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 10px 15px -3px rgba(37, 211, 102, 0.3)' }} onClick={() => sendWhatsApp(selectedClient.client, 'friendly')}>
                  Message Amical 👋
                </button>
                <button className="btn" style={{ height: '60px', borderRadius: '16px', backgroundColor: '#128C7E', color: 'white', fontWeight: 800, display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 10px 15px -3px rgba(18, 140, 126, 0.3)' }} onClick={() => sendWhatsApp(selectedClient.client, 'promo')}>
                  <Gift size={20} strokeWidth={2.5} /> Offrir une Remise
                </button>
                <button className="btn" style={{ height: '60px', borderRadius: '16px', backgroundColor: '#075E54', color: 'white', fontWeight: 800, display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 10px 15px -3px rgba(7, 94, 84, 0.3)' }} onClick={() => sendWhatsApp(selectedClient.client, 'reminder', selectedClient.commandes)} disabled={selectedClient.commandes.length === 0}>
                   Relancer (Historique)
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#166534', marginTop: '1rem', fontWeight: 600, opacity: 0.8 }}>
                * Messages pré-formatés pour maximiser le taux de conversion et la satisfaction client.
              </p>
            </div>

            {/* HISTORIQUE DES ACHATS PREMIUM */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={22} strokeWidth={2.5} />
                  Journal des Commandes
                </h3>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{selectedClient.commandes.length} achats</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
                {selectedClient.commandes.length === 0 ? (
                  <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                    <p style={{ fontWeight: 700, margin: 0 }}>Ardoise vierge.</p>
                    <p style={{ fontSize: '0.85rem' }}>Ce prospect n'a pas encore validé de commande.</p>
                  </div>
                ) : (
                  selectedClient.commandes.map(cmd => (
                    <div key={cmd.id} style={{ padding: '1.5rem', borderRadius: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', transition: 'transform 0.2s ease' }} className="hover-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-main)' }}>#{cmd.id.slice(0, 8).toUpperCase()}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.2rem' }}>
                            {format(new Date(cmd.date_creation), 'dd MMMM yyyy')}
                          </div>
                        </div>
                        <span className={`badge badge-${cmd.statut_commande === 'livree' ? 'success' : cmd.statut_commande.includes('retour') || cmd.statut_commande === 'annulee' ? 'danger' : 'info'}`} style={{ fontWeight: 800, padding: '0.4rem 0.8rem', borderRadius: '10px' }}>
                          {cmd.statut_commande.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem' }}>
                        <div>
                           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Volume Transaction</div>
                           <div style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary)' }}>
                             {Number(cmd.montant_total).toLocaleString()} <span style={{ fontSize: '0.8rem' }}>CFA</span>
                           </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Source: {cmd.source_commande}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
          background-color: rgba(99, 102, 255, 0.02) !important;
        }
      `}</style>
    </div>
  );
};
