import { useState, useEffect, useMemo, useCallback } from 'react';
import { subscribeToCommandes, getTopSellingProducts } from '../services/commandeService';
import type { Commande } from '../types';
import { Activity, Percent, DollarSign, TrendingUp, Truck, AlertCircle, ShoppingBag, BarChart2, Calendar } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip
} from 'recharts';

type Period = 'today' | '7d' | '30d' | 'all';

export const Dashboard = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const fetchTop = useCallback(async (p: Period) => {
    try {
      const days = p === 'today' ? 1 : p === '7d' ? 7 : p === '30d' ? 30 : 0;
      const top = await getTopSellingProducts(10, days);
      setTopProducts(top);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCommandes((data) => {
      setCommandes(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchTop(period);
    const interval = setInterval(() => fetchTop(period), 60000);
    return () => clearInterval(interval);
  }, [period, fetchTop]);

  const filteredCommandes = useMemo(() => {
    const now = new Date();
    if (period === 'all') return commandes;

    const start = new Date();
    if (period === 'today') start.setHours(0, 0, 0, 0);
    else if (period === '7d') start.setDate(now.getDate() - 7);
    else if (period === '30d') start.setDate(now.getDate() - 30);

    return commandes.filter(c => new Date(c.date_creation).getTime() >= start.getTime());
  }, [commandes, period]);

  const memoizedAnalytics = useMemo(() => {
    const getFrais = (c: Commande) => {
       if (c.frais_livraison !== undefined && c.frais_livraison !== null) return Number(c.frais_livraison);
       if (c.statut_commande === 'livree' || c.statut_commande === 'terminee') return 1000; 
       return 0;
    };

    const succes = filteredCommandes.filter(c => c.statut_commande === 'livree' || c.statut_commande === 'terminee');
    const echecsLivraison = filteredCommandes.filter(c => ['echouee', 'retour_stock', 'retour_livreur'].includes(c.statut_commande));
    
    const totalEncaisse = succes.reduce((acc, c) => acc + (c.montant_encaisse || c.montant_total), 0);
    const totalFraisLivraison = succes.reduce((acc, c) => acc + getFrais(c), 0);
    const caNetProduits = totalEncaisse - totalFraisLivraison;

    const caPotentiel = filteredCommandes.filter(c => ['validee', 'en_cours_livraison'].includes(c.statut_commande))
                                         .reduce((acc, c) => acc + (c.montant_total - getFrais(c)), 0);
    
    const pending = filteredCommandes.filter(c => ['en_attente_appel', 'a_rappeler'].includes(c.statut_commande));
    
    const totalTentatives = succes.length + echecsLivraison.length;
    const tauxSuccesLivraison = totalTentatives > 0 ? Math.round((succes.length / totalTentatives) * 100) : 0;
    
    // Prepare history data based on current period
    const dayCount = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 15;
    const historyPoints = Array.from({length: dayCount}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (dayCount - 1 - i));
      return { date: d.toISOString().split('T')[0], revenue: 0, count: 0 };
    });

    filteredCommandes.forEach(c => {
      const dString = new Date(c.date_creation).toISOString().split('T')[0];
      const match = historyPoints.find(d => d.date === dString);
      if (match) {
        match.count++;
        if(c.statut_commande === 'livree' || c.statut_commande === 'terminee') {
          const montant = c.montant_encaisse || c.montant_total;
          const frais = getFrais(c);
          match.revenue += (montant - frais);
        }
      }
    });

    const historyData = historyPoints.map(d => ({
      jour: d.date.slice(-5).replace('-', '/'),
      Commandes: d.count,
      CA: d.revenue
    }));

    return { 
      stats: { 
        total: filteredCommandes.length, 
        pending: pending.length, 
        succes: succes.length, 
        tauxSuccesLivraison, 
        caNetProduits, 
        totalFraisLivraison, 
        caPotentiel, 
        totalEncaisse 
      }, 
      historyData 
    };
  }, [filteredCommandes, period]);

  const { stats, historyData } = memoizedAnalytics;

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div style={{ animation: 'pageEnter 0.6s ease' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
           <h1 className="text-premium" style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Tableau de Bord 360°</h1>
           <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.4rem', fontWeight: 600 }}>Performance Analytique & Temps Réel</p>
        </div>
        
        {/* Period Selector */}
        <div style={{ display: 'flex', background: 'rgba(99, 102, 255, 0.05)', padding: '0.4rem', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '0.25rem' }}>
          {(['today', '7d', '30d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`btn btn-sm ${period === p ? 'btn-primary' : ''}`}
              style={{ 
                borderRadius: '12px', 
                border: 'none',
                background: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? 'white' : 'var(--text-muted)',
                padding: '0.5rem 1rem',
                fontWeight: 800,
                fontSize: '0.75rem',
                textTransform: 'uppercase'
              }}
            >
              {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 Jours' : p === '30d' ? '30 Jours' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card glass-effect" style={{ padding: '1.75rem', borderLeft: '5px solid var(--primary)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>CA Net Produits</span>
            <DollarSign size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>{stats.caNetProduits.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>CFA</span></div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total encaissé: {stats.totalEncaisse.toLocaleString()} CFA</p>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>
            <TrendingUp size={14} /> <span>Potentiel : {stats.caPotentiel.toLocaleString()} CFA</span>
          </div>
        </div>

        <div className="card glass-effect" style={{ padding: '1.75rem', borderLeft: '5px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Livraison Encaissé</span>
            <Truck size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#6366f1' }}>{stats.totalFraisLivraison.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>CFA</span></div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Part destinataires finaux</p>
        </div>

        <div className="card glass-effect" style={{ padding: '1.75rem', borderLeft: '5px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Taux de Succès</span>
            <Percent size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>{stats.tauxSuccesLivraison}%</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem' }}>
             <div className="badge badge-success" style={{ borderRadius: '6px' }}>LOGISTIQUE</div>
             <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{stats.succes} livrées</span>
          </div>
        </div>

        <div className="card glass-effect" style={{ padding: '1.75rem', borderLeft: '5px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>À Traiter</span>
            <Activity size={stats.pending > 0 ? 20 : 18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>{stats.pending}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem', color: '#f59e0b' }}>
             <AlertCircle size={14} />
             <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Action requise</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 1fr', gap: '2rem' }} className="responsive-grid">
        {/* Revenue Trend */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontWeight: 800 }}>Tendance des Revenus ({period === 'all' ? '15j' : period === 'today' ? '24h' : period})</h3>
            </div>
          </div>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 800 }}
                  formatter={(v) => [`${Number(v).toLocaleString()} CFA`, 'Revenu Net']}
                />
                <Area type="monotone" dataKey="CA" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorCA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Sellers Section */}
        <div className="card" style={{ padding: '2rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
             <BarChart2 size={24} color="var(--primary)" />
             <h3 style={{ margin: 0, fontWeight: 800 }}>Meilleurs Produits</h3>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {topProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Aucune donnée sur cette période.</p>
                </div>
              ) : topProducts.map((p, i) => (
                <div key={p.nom} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', width: '20px' }}>{i+1}.</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: p.taux_succes >= 70 ? '#10b981' : p.taux_succes >= 40 ? '#f59e0b' : '#ef4444' }}>
                      {p.taux_succes}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${p.taux_succes}%`, 
                        height: '100%', 
                        background: p.taux_succes >= 70 ? '#10b981' : p.taux_succes >= 40 ? '#f59e0b' : '#ef4444', 
                        borderRadius: '4px',
                        transition: 'width 1s ease-out'
                      }}
                    ></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <span>Sortis: {p.total_sorties}</span>
                    <span>Livrées: {p.nb_ventes}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
