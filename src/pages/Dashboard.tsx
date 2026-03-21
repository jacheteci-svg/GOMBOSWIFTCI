import { useState, useEffect } from 'react';
import { subscribeToCommandes } from '../services/commandeService';
import type { Commande } from '../types';
import { AlertCircle, Activity, Percent, DollarSign } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export const Dashboard = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCommandes((data) => {
      setCommandes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getStats = () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const caGlobal = commandes.filter(c => c.statut_commande === 'livree' || c.statut_commande === 'terminee')
                              .reduce((acc, c) => acc + (c.montant_encaisse || c.montant_total), 0);
    
    // Potentiel (commandes validées non livrées)
    const caPotentiel = commandes.filter(c => ['validee', 'en_cours_livraison'].includes(c.statut_commande))
                                 .reduce((acc, c) => acc + c.montant_total, 0);

    const pending = commandes.filter(c => c.statut_commande === 'en_attente_appel' || c.statut_commande === 'a_rappeler');
    const succes = commandes.filter(c => c.statut_commande === 'livree' || c.statut_commande === 'terminee');
    const echecs = commandes.filter(c => c.statut_commande === 'echouee' || c.statut_commande === 'retour_stock');
    
    const totalTraitees = succes.length + echecs.length;
    const tauxLivraison = totalTraitees > 0 ? Math.round((succes.length / totalTraitees) * 100) : 0;
    
    // Commandes du jour
    const cmdJour = commandes.filter(c => new Date(c.date_creation).getTime() >= today.getTime());

    return { 
      total: commandes.length, 
      pending: pending.length, 
      succes: succes.length,
      echecs: echecs.length,
      tauxLivraison,
      caGlobal,
      caPotentiel,
      cmdJour: cmdJour.length
    };
  };

  const getChartData = () => {
    return [
      { name: 'En attente', value: commandes.filter(c => c.statut_commande === 'en_attente_appel').length },
      { name: 'Appel (Val / Rappel)', value: commandes.filter(c => c.statut_commande === 'validee' || c.statut_commande === 'a_rappeler').length },
      { name: 'En Expédition', value: commandes.filter(c => c.statut_commande === 'en_cours_livraison').length },
      { name: 'Livrées', value: commandes.filter(c => c.statut_commande === 'livree' || c.statut_commande === 'terminee').length },
      { name: 'Echecs', value: commandes.filter(c => c.statut_commande === 'echouee' || c.statut_commande === 'retour_stock').length },
    ];
  };

  const getRecentHistoryData = () => {
    // Basic aggregation by day for the last 7 days from the available data
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split('T')[0], revenue: 0, count: 0 };
    });

    commandes.forEach(c => {
      const dString = new Date(c.date_creation).toISOString().split('T')[0];
      const match = last7Days.find(d => d.date === dString);
      if (match) {
        match.count++;
        if(c.statut_commande === 'livree' || c.statut_commande === 'terminee') {
          match.revenue += (c.montant_encaisse || c.montant_total);
        }
      }
    });

    return last7Days.map(d => ({
      jour: d.date.slice(-5).replace('-', '/'),
      Commandes: d.count,
      CA_Livre: d.revenue
    }));
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  }

  const stats = getStats();
  const statusData = getChartData();
  const historyData = getRecentHistoryData();
  const PIE_COLORS = ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];

  return (
    <div style={{ animation: 'pageEnter 0.6s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-premium" style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>Business 360°</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.4rem', fontWeight: 500 }}>Supervision générale de la performance et des flux.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chiffre d'Affaires</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0', color: '#10b981' }}>
                {stats.caGlobal.toLocaleString()} <span style={{ fontSize: '1rem' }}>CFA</span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Encaissé</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+ {stats.caPotentiel.toLocaleString()} Potentiel</span>
              </div>
            </div>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={28} color="#10b981" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taux de Livraison</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0' }}>{stats.tauxLivraison} %</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Efficacité</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sur {stats.succes + stats.echecs} traitées</span>
              </div>
            </div>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Percent size={28} color="var(--primary)" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En Souffrance</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0', color: '#f59e0b' }}>{stats.pending}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>A Traiter</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attente Call-Center</span>
              </div>
            </div>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={28} color="#f59e0b" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aujourd'hui</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0' }}>{stats.cmdJour}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Flux</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total: {stats.total} cmd</span>
              </div>
            </div>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={28} color="#8b5cf6" />
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem', fontWeight: 700 }}>Évolution du Chiffre d'Affaires</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 600 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '1rem' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} CFA`, 'CA Encaissé']}
                />
                <Area type="monotone" dataKey="CA_Livre" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorCa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem', fontWeight: 700 }}>Répartition par Statut</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2.5rem' }}>
              {statusData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="card table-responsive-cards">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>Flux des Opérations Récentes</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Origine</th>
                <th>Montant</th>
                <th>État Actuel</th>
              </tr>
            </thead>
            <tbody>
              {commandes.slice(0, 5).map(cmd => (
                <tr key={cmd.id}>
                  <td data-label="Référence" style={{ fontWeight: 700, color: 'var(--primary)' }}>#{cmd.id.slice(0, 8).toUpperCase()}</td>
                  <td data-label="Origine">{cmd.source_commande}</td>
                  <td data-label="Montant" style={{ fontWeight: 800 }}>{cmd.montant_total.toLocaleString()} CFA</td>
                  <td data-label="État Actuel">
                    <span className={`badge ${
                      cmd.statut_commande === 'livree' ? 'badge-success' : 
                      ['echouee', 'retour_stock'].includes(cmd.statut_commande) ? 'badge-danger' : 
                      ['en_attente_appel', 'a_rappeler'].includes(cmd.statut_commande) ? 'badge-warning' : 
                      'badge-info'
                    }`}>
                      {cmd.statut_commande.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {commandes.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Aucun flux de données détecté pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
