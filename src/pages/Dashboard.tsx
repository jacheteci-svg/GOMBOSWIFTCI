import { useState, useEffect, useMemo, useCallback } from 'react';
import { subscribeToCommandes, getTopSellingProducts } from '../services/commandeService';
import { useSaas } from '../saas/SaasProvider';
import { calculateLogisticalStats } from '../services/financialService';
import type { Commande } from '../types';
import { Activity, Percent, DollarSign, TrendingUp, Truck, ShoppingBag } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, PieChart, Pie, Cell
} from 'recharts';

type Period = 'today' | '7d' | '30d' | 'all' | 'custom';

export const Dashboard = () => {
  const { tenant } = useSaas();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const fetchTop = useCallback(async (p: Period, start?: string, end?: string) => {
    try {
      if (!tenant?.id) return;
      const days = p === 'today' ? 1 : p === '7d' ? 7 : p === '30d' ? 30 : 0;
      const top = await getTopSellingProducts(tenant.id, 10, days, start, end);
      setTopProducts(top);
    } catch (e) { console.error(e); }
  }, [tenant?.id]);

  useEffect(() => {
    if (!tenant?.id) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToCommandes(tenant.id, (data) => {
      setCommandes(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [tenant?.id]);

  useEffect(() => {
    if (period === 'custom') {
      fetchTop('custom', new Date(startDate).toISOString(), new Date(endDate + 'T23:59:59').toISOString());
    } else {
      fetchTop(period);
    }
    const interval = setInterval(() => {
      if (period === 'custom') fetchTop('custom', new Date(startDate).toISOString(), new Date(endDate + 'T23:59:59').toISOString());
      else fetchTop(period);
    }, 60000);
    return () => clearInterval(interval);
  }, [period, fetchTop, startDate, endDate]);

  const filteredCommandes = useMemo(() => {
    const now = new Date();
    if (period === 'all') return commandes;

    if (period === 'custom') {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      
      return commandes.filter(c => {
        const dCreated = new Date(c.date_creation);
        const dDelivered = c.date_livraison_effective ? new Date(c.date_livraison_effective) : null;
        
        const createdInRange = dCreated >= start && dCreated <= end;
        const deliveredInRange = dDelivered && dDelivered >= start && dDelivered <= end;
        
        return createdInRange || deliveredInRange;
      });
    }

    const start = new Date();
    if (period === 'today') start.setHours(0, 0, 0, 0);
    else if (period === '7d') start.setDate(now.getDate() - 7);
    else if (period === '30d') start.setDate(now.getDate() - 30);

    return commandes.filter(c => {
      const dCreated = new Date(c.date_creation);
      const dDelivered = c.date_livraison_effective ? new Date(c.date_livraison_effective) : null;
      
      const createdInRange = dCreated.getTime() >= start.getTime();
      const deliveredInRange = dDelivered && dDelivered.getTime() >= start.getTime();
      
      return createdInRange || deliveredInRange;
    });
  }, [commandes, period, startDate, endDate]);

  const memoizedAnalytics = useMemo(() => {
    const getFrais = (c: Commande) => {
       if (c.frais_livraison !== undefined && c.frais_livraison !== null) return Number(c.frais_livraison);
       if (c.statut_commande === 'livree' || c.statut_commande === 'terminee') return 1000; 
       return 0;
    };

    const pending = filteredCommandes.filter(c => ['en_attente_appel', 'a_rappeler', 'nouvelle'].includes(c.statut_commande));
    const succes = filteredCommandes.filter(c => ['livree', 'terminee'].includes(c.statut_commande || ''));
    
    const totalEncaisse = succes.reduce((acc, c) => acc + (c.montant_encaisse || c.montant_total), 0);
    const totalFraisLivraison = succes.reduce((acc, c) => acc + getFrais(c), 0);
    const caNetProduits = totalEncaisse - totalFraisLivraison;

    const caPotentiel = filteredCommandes.filter(c => ['validee', 'en_cours_livraison'].includes(c.statut_commande || ''))
                                         .reduce((acc, c) => acc + (c.montant_total - getFrais(c)), 0);
    
    const logStats = calculateLogisticalStats(filteredCommandes);
    const tauxSuccesLivraison = logStats.taux_succes;
    
    // Status Distribution Data
    const statusCounts: Record<string, number> = {};
    filteredCommandes.forEach(c => {
      const s = c.statut_commande || 'Inconnu';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Zone Performance Data
    const zonePerf: Record<string, { total: number, count: number }> = {};
    filteredCommandes.forEach(c => {
      const z = c.commune_livraison || 'Hors Zone';
      if (!zonePerf[z]) zonePerf[z] = { total: 0, count: 0 };
      zonePerf[z].count++;
      if (c.statut_commande === 'livree' || c.statut_commande === 'terminee') {
        zonePerf[z].total += (c.montant_encaisse || c.montant_total) - getFrais(c);
      }
    });
    const zoneData = Object.entries(zonePerf)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Comparative Analytics
    const getPeriodDays = () => {
      if (period === 'today') return 1;
      if (period === '7d') return 7;
      if (period === '30d') return 30;
      if (period === 'custom') {
        const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      return 0;
    };

    const days = getPeriodDays();
    const prevPeriodData = days > 0 ? commandes.filter(c => {
      const d = new Date(c.date_creation);
      const now = new Date();
      const endPrev = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      const startPrev = new Date(now.getTime() - (2 * days * 24 * 60 * 60 * 1000));
      return d >= startPrev && d < endPrev;
    }) : [];

    const succesPrev = prevPeriodData.filter(c => c.statut_commande === 'livree' || c.statut_commande === 'terminee');
    const totalEncaissePrev = succesPrev.reduce((acc, c) => acc + (c.montant_encaisse || c.montant_total), 0);
    const totalFraisPrev = succesPrev.reduce((acc, c) => acc + getFrais(c), 0);
    const caNetPrev = totalEncaissePrev - totalFraisPrev;
    const logStatsPrev = calculateLogisticalStats(prevPeriodData);
    const tauxSuccesPrev = logStatsPrev.taux_succes;

    const diffCA = caNetPrev > 0 ? Math.round(((caNetProduits - caNetPrev) / caNetPrev) * 100) : 0;
    const diffTaux = tauxSuccesPrev > 0 ? Math.round((tauxSuccesLivraison - tauxSuccesPrev)) : 0;

    // Prepare history data based on current period
    const dayCount = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 15;
    const historyPoints = Array.from({length: dayCount}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (dayCount - 1 - i));
      return { date: d.toISOString().split('T')[0], revenue: 0, count: 0 };
    });

    filteredCommandes.forEach(c => {
      const isSucces = c.statut_commande === 'livree' || c.statut_commande === 'terminee';
      // Prioritize actual delivery date for history grouping
      const dString = new Date( (isSucces && c.date_livraison_effective) ? c.date_livraison_effective : c.date_creation).toISOString().split('T')[0];
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
        totalEncaisse,
        diffCA,
        diffTaux,
        logStats
      }, 
      historyData,
      statusData,
      zoneData
    };
  }, [filteredCommandes, period, commandes, startDate, endDate]);

  const { stats, historyData, statusData, zoneData } = memoizedAnalytics;
  const { logStats, tauxSuccesLivraison } = stats;

  if (loading) return (
    <div className="gombo-theme-dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div
      className="gombo-theme-dark gombo-module-frame"
      style={{ animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      
      {/* HEADER SECTION */}
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
              <div style={{ background: 'rgba(6,182,212,0.15)', padding: '0.6rem', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.3)' }}>
                 <Activity size={24} className="gombo-neon-cyan" />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                 {tenant?.nom || 'Propriétaire'} • Live Dashboard
              </span>
           </div>
           <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 950, letterSpacing: '-0.04em', margin: 0, color: 'white' }}>Gombo Command Center</h1>
           <p style={{ color: '#94a3b8', fontSize: '1.1rem', fontWeight: 500, marginTop: '0.5rem' }}>Analyse de performance logistique & financière</p>
        </div>
        
        {/* Period Selector Elite */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '0.5rem' }}>
          {(['today', '7d', '30d', 'all', 'custom'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="btn btn-sm"
              style={{ 
                borderRadius: '14px', 
                border: 'none',
                background: period === p ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'transparent',
                color: period === p ? 'white' : '#94a3b8',
                padding: '0.6rem 1.25rem',
                fontWeight: 900,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                boxShadow: period === p ? '0 4px 15px rgba(6, 182, 212, 0.3)' : 'none'
              }}
            >
              {p === 'today' ? "Jour" : p === '7d' ? '7 Jours' : p === '30d' ? '30 Jours' : p === 'custom' ? 'Date' : 'Tout'}
            </button>
          ))}
        </div>
        
        {period === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
             <input 
                type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.85rem', outline: 'none' }} 
             />
             <span style={{ color: '#06b6d4', fontWeight: 900 }}>→</span>
             <input 
                type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.85rem', outline: 'none' }} 
             />
          </div>
        )}
      </div>

      {/* KPI CARDS ELITE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* CA Net */}
        <div className="gombo-card-elite" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <DollarSign size={24} className="gombo-neon-cyan" />
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenu Net Produits</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'white' }}>{stats.caNetProduits.toLocaleString()}</div>
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>Brut: {stats.totalEncaisse.toLocaleString()}</span>
             <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={14} /> +{stats.diffCA}%
             </span>
          </div>
        </div>

        {/* Taux de Succès */}
        <div className="gombo-card-elite" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <Percent size={24} />
             </div>
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taux de Livraison</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'white' }}>{tauxSuccesLivraison}%</div>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
             <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${tauxSuccesLivraison}%`, height: '100%', background: '#f59e0b', boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}></div>
             </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 700 }}>{logStats.livrees} livrées / {logStats.total_sortis} expédiées</p>
        </div>

        {/* Flux de Sortie */}
        <div className="gombo-card-elite" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Activity size={24} style={{ color: '#8b5cf6' }} />
             <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activités de Vente</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'white' }}>{stats.total}</div>
             </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
             <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '8px', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontWeight: 900 }}>{stats.pending} À TRAITER</span>
             <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '8px', background: 'rgba(236,72,153,0.1)', color: '#ec4899', fontWeight: 900 }}>{logStats.retours} RETOURS</span>
          </div>
        </div>

      </div>

      {/* CHARTS GRID ELITE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2.5rem', marginBottom: '3rem' }} className="mobile-stack">
        
        {/* Area Revenue Chart */}
        <div className="gombo-card-elite" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
             <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.4rem' }}>Optimisation de Flux</h3>
             <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 800 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div> REVENU</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }}></div> COMMANDES</span>
             </div>
          </div>
          <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                   <linearGradient id="gomboRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 800, fill: '#64748b'}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontWeight: 900 }} />
                <Area type="monotone" dataKey="CA" stroke="#10b981" strokeWidth={4} fill="url(#gomboRev)" />
                <Area type="monotone" dataKey="Commandes" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circular Distribution */}
        <div className="gombo-card-elite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 950, color: 'white', width: '100%', textAlign: 'center' }}>Répartition Logistique</h4>
          
          <div style={{ position: 'relative', width: '100%', height: '260px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '16px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
               <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'white' }}>{stats.total}</div>
               <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>FLUX TOTAL</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', marginTop: '2rem' }}>
             {statusData.slice(0, 4).map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 4] }}></div>
                   <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>{s.value} colis</div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem' }}>
         <div className="gombo-card-elite">
            <h3 style={{ marginBottom: '2rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               <Truck size={22} className="gombo-neon-cyan" /> Livraison par Zone
            </h3>
            <div className="table-container" style={{ background: 'transparent', border: 'none' }}>
               <table style={{ borderSpacing: '0 0.8rem', borderCollapse: 'separate' }}>
                  <tbody>
                     {zoneData.map(z => (
                        <tr key={z.name} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
                           <td style={{ border: 'none', borderRadius: '14px 0 0 14px', fontWeight: 850 }}>{z.name}</td>
                           <td style={{ border: 'none', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{z.count} exp.</td>
                           <td style={{ border: 'none', borderRadius: '0 14px 14px 0', textAlign: 'right', fontWeight: 950, color: '#06b6d4' }}>{z.total.toLocaleString()} F</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="gombo-card-elite">
            <h3 style={{ marginBottom: '2rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               <ShoppingBag size={22} color="#ec4899" /> Performances Produits
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {topProducts.slice(0, 5).map((p, i) => (
                  <div key={p.nom}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'white' }}>{i+1}. {p.nom}</span>
                       <span style={{ fontSize: '0.9rem', fontWeight: 950, color: '#ec4899' }}>{p.taux_succes}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                       <div style={{ width: `${p.taux_succes}%`, height: '100%', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius: '6px' }}></div>
                    </div>
                  </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};
