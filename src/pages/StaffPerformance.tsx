import { useState, useEffect } from 'react';
import { useSaas } from '../saas/SaasProvider';
import { insforge } from '../lib/insforge';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  TrendingUp, Target, Coins, PhoneCall, Truck, Package, 
  ArrowDownRight, Zap, Repeat, Ban, AlertTriangle,
  ShieldCheck
} from 'lucide-react';

type TabType = 'logistique' | 'call-center' | 'inventaire';

const COLORS = {
  primary: '#06b6d4',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#f43f5e',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  slate: '#94a3b8'
};

export const StaffPerformance = () => {
  const { tenant } = useSaas();
  const [activeTab, setActiveTab] = useState<TabType>('logistique');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ logistique: [], callCenter: [], inventaire: [] });

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [logData, callData, invData] = await Promise.all([
        insforge.database.from('logistics_performance_summary').select('*').eq('tenant_id', tenant.id),
        insforge.database.from('staff_performance_summary').select('*').eq('tenant_id', tenant.id),
        insforge.database.from('inventory_performance_summary').select('*').eq('tenant_id', tenant.id)
      ]);

      setStats({
        logistique: logData.data || [],
        callCenter: callData.data || [],
        inventaire: invData.data || []
      });
    } catch (err) {
      console.error("Hub Performance Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenant?.id]);

  const renderLogistics = () => {
    const data = stats.logistique;
    const totalCA = data.reduce((acc: number, s: any) => acc + (Number(s.ca_frais) || 0), 0);
    
    // Precise Success Rate: Réussies / (Réussies + Retours + Annulées + Échouées)
    const totalReussies = data.reduce((acc: number, s: any) => acc + (Number(s.reussies) || 0), 0);
    const totalEchecs = data.reduce((acc: number, s: any) => acc + (Number(s.retours) || 0) + (Number(s.annulations) || 0) + (Number(s.echouees) || 0), 0);
    const avgSuccess = (totalReussies + totalEchecs) > 0 ? Math.round((totalReussies / (totalReussies + totalEchecs)) * 100) : 0;

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <NexusPerfCard 
            title="Taux de Succès Réel" 
            value={`${avgSuccess}%`} 
            sub="Basé sur les sorties terrain" 
            icon={Target}
            color={COLORS.success}
            trend="+3.2%"
          />
          <NexusPerfCard 
            title="CA Livraison" 
            value={`${totalCA.toLocaleString()} F`} 
            sub="Généré par les frais" 
            icon={Coins}
            color={COLORS.primary}
            trend="+15%"
          />
          <NexusPerfCard 
            title="Sorties Colis" 
            value={data.reduce((acc: number, s: any) => acc + (Number(s.sorties) || 0), 0)} 
            sub="Volume total expédié" 
            icon={Truck}
            color={COLORS.indigo}
          />
          <NexusPerfCard 
            title="Retours / Echecs" 
            value={totalEchecs} 
            sub="Anomalies logistiques" 
            icon={AlertTriangle}
            color={COLORS.danger}
            trend="-2.1%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 nexus-card-elite p-10" style={{ background: 'rgba(2, 6, 23, 0.4)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-3xl font-black nexus-gradient-text-cyan" style={{ letterSpacing: '-0.02em' }}>Performance Terrain</h3>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mt-2">Corrélation Succès / Mission par Agent</p>
               </div>
            </div>
            <div style={{ height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nom" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 900}} width={130} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                    contentStyle={{background: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: '1rem'}} 
                  />
                  <Bar dataKey="success_rate" radius={[0, 14, 14, 0]} barSize={28}>
                    {data.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.success_rate > 85 ? COLORS.success : entry.success_rate > 60 ? COLORS.primary : COLORS.danger} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="nexus-card-lite p-10 flex flex-col" style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <h3 className="text-xl font-black mb-10 flex items-center gap-3">
               <ShieldCheck className="text-primary" size={24} strokeWidth={2.5} /> elite_squad
            </h3>
            <div className="space-y-6 flex-1">
               {data.sort((a: any, b: any) => b.success_rate - a.success_rate).slice(0, 5).map((s: any, idx: number) => (
                 <div key={s.livreur_id} className="flex items-center gap-5 p-5 rounded-[28px] bg-white/2 border border-white/2 hover:border-primary/20 transition-all group">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl bg-primary/10 text-primary shadow-lg border border-primary/10">
                       {idx + 1}
                    </div>
                    <div className="flex-1">
                       <div className="font-black text-slate-100 text-lg">{s.nom}</div>
                       <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{s.reussies} Objectifs</div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400">{s.success_rate}%</div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="nexus-card-elite p-0 overflow-hidden" style={{ borderRadius: '40px', background: 'rgba(2, 6, 23, 0.3)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="p-10 border-b border-white/5 flex justify-between items-center">
             <h3 className="text-2xl font-black flex items-center gap-4">
                <Truck className="text-primary" size={28} strokeWidth={2.5} /> Détail Opérationnel Livreurs
             </h3>
             <div className="flex gap-6">
                <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-widest uppercase">Livrées ✅</div>
                <div className="px-5 py-2.5 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-[10px] font-black tracking-widest uppercase">Retours 🔙</div>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black bg-white/2">
                  <th className="p-8">Agent Terrain</th>
                  <th className="p-8 text-center">Sorties</th>
                  <th className="p-8 text-center">Réussites</th>
                  <th className="p-8 text-center">Reports</th>
                  <th className="p-8 text-center">Taux Réel</th>
                  <th className="p-8 text-right">CA Livraison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((s: any) => (
                  <tr key={s.livreur_id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-8">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 flex items-center justify-center font-black text-lg border border-indigo-500/10">
                             {s.nom?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-100 text-lg">{s.nom}</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">ID: {s.livreur_id?.slice(0, 8)}</div>
                          </div>
                       </div>
                    </td>
                    <td className="p-8 text-center font-black text-slate-300 text-lg">{s.sorties}</td>
                    <td className="p-8 text-center font-black text-emerald-400 text-lg">{s.reussies}</td>
                    <td className="p-8 text-center font-black text-amber-400 text-lg">{s.reports || 0}</td>
                    <td className="p-8 text-center">
                       <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/50 border border-white/5">
                          <div className={`w-2.5 h-2.5 rounded-full ${s.success_rate > 70 ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30' : 'bg-rose-400 shadow-lg shadow-rose-400/30'}`}></div>
                          <span className="text-sm font-black text-white">{s.success_rate}%</span>
                       </div>
                    </td>
                    <td className="p-8 text-right font-black text-primary text-xl" style={{ letterSpacing: '-0.02em' }}>{s.ca_frais?.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>F</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCallCenter = () => {
    const data = stats.callCenter;
    const totalHandled = data.reduce((acc: number, s: any) => acc + (Number(s.total_handled) || 0), 0);
    const totalDelivered = data.reduce((acc: number, s: any) => acc + (Number(s.total_delivered) || 0), 0);
    const avgConversion = totalHandled > 0 ? Math.round((totalDelivered / totalHandled) * 100) : 0;

    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <NexusPerfCard 
            title="Conversion Réelle" 
            value={`${avgConversion}%`} 
            sub="Traités v/s Livrés" 
            icon={Repeat}
            color={COLORS.violet}
          />
          <NexusPerfCard 
            title="Dossiers Traités" 
            value={totalHandled} 
            sub="Engagement global agents" 
            icon={PhoneCall}
            color={COLORS.secondary}
          />
          <NexusPerfCard 
            title="Validations" 
            value={data.reduce((acc: number, s: any) => acc + (Number(s.total_validations) || 0), 0)} 
            sub="Promesses de livraison" 
            icon={Zap}
            color={COLORS.warning}
          />
          <NexusPerfCard 
            title="Taux de Perte" 
            value={`${100 - avgConversion}%`} 
            sub="Abandons et Annulations" 
            icon={Ban}
            color={COLORS.danger}
          />
        </div>

        <div className="nexus-card-elite p-10">
           <div className="flex justify-between items-center mb-16">
              <div>
                <h3 className="text-3xl font-black nexus-gradient-text-cyan">Efficacité Conversationnelle</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Corrélation entre volume traité et conversion finale</p>
              </div>
           </div>
           
           <div className="space-y-12">
              {data.map((agent: any) => (
                <div key={agent.agent_id} className="group">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-100">{agent.staff_name || 'Agent Nexus'}</h4>
                      <div className="flex items-center gap-3 mt-1">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Traitement:</span>
                         <span className="text-xs font-black text-indigo-400">{agent.total_handled} Dossiers</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-primary">{agent.success_rate}%</div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{agent.total_delivered} LIVRAISONS RÉELLES</p>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-white/2 rounded-full overflow-hidden border border-white/5 p-1 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-primary to-cyan-400 rounded-full transition-all duration-1000 relative z-10"
                      style={{ width: `${agent.success_rate}%` }}
                    >
                       <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    const data = stats.inventaire;
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 nexus-card-elite p-8">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
               <Package className="text-primary" /> Etat de Santé des Stocks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.map((item: any) => (
                <div key={item.produit_id} className={`p-6 rounded-[32px] border transition-all hover:scale-[1.02] ${item.stock_actuel <= (item.stock_minimum || 5) ? 'bg-rose-500/10 border-rose-500/20 shadow-lg shadow-rose-500/5' : 'bg-white/2 border-white/5 shadow-xl'}`}>
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-slate-100 text-lg leading-tight">{item.nom}</h4>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">{item.sku || 'N/A'}</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${item.stock_actuel <= (item.stock_minimum || 5) ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                         {item.stock_actuel <= (item.stock_minimum || 5) ? 'CRITIQUE ⚠️' : 'OPTIMAL'}
                      </div>
                   </div>
                   <div className="flex items-center gap-6 mt-6">
                      <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all duration-1000 ${item.stock_actuel <= (item.stock_minimum || 5) ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}
                           style={{ width: `${Math.min((item.stock_actuel / (Math.max(item.stock_minimum || 5, 1) * 3)) * 100, 100)}%` }}
                         ></div>
                      </div>
                      <span className={`text-2xl font-black ${item.stock_actuel <= (item.stock_minimum || 5) ? 'text-rose-400' : 'text-slate-100'}`}>{item.stock_actuel}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="nexus-card-premium p-10 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-[40px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-8">
               <Repeat size={48} className="text-primary nexus-pulse" />
            </div>
            <h3 className="text-2xl font-black mb-2">Index de Rotation</h3>
            <div className="text-7xl font-black nexus-gradient-text-cyan mb-6">
              {data.length ? Math.round(data.reduce((acc: number, i: any) => acc + (Number(i.rotation_index) || 0), 0) / data.length) : 0}%
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">Vitesse moyenne de sortie du catalogue actif</p>
            
            <div className="mt-12 w-full space-y-4">
               <div className="flex justify-between text-xs font-black uppercase text-slate-500 border-b border-white/5 pb-4">
                  <span>Ruptures de stock</span>
                  <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg">{data.filter((i: any) => i.stock_actuel === 0).length}</span>
               </div>
               <div className="flex justify-between text-xs font-black uppercase text-slate-500 border-b border-white/5 pb-4">
                  <span>Articles alertés</span>
                  <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg">{data.filter((i: any) => i.stock_actuel <= (i.stock_minimum || 5) && i.stock_actuel > 0).length}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-10 max-w-[1700px] mx-auto min-h-screen bg-[#020617]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-10">
        <div className="animate-pageEnter">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-1.5 bg-primary rounded-full shadow-lg shadow-primary/40"></div>
             <span className="text-primary font-black uppercase tracking-[0.4em] text-[11px]">Nexus Performance Monitoring</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-6">Hub Performance Équipe</h1>
          <p className="text-slate-400 font-bold text-xl max-w-3xl leading-relaxed">Visualisation stratégique des indicateurs de conversion et d'efficacité opérationnelle par département.</p>
        </div>

        <div className="flex gap-3 p-3 bg-white/2 backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-2xl animate-pageEnter" style={{ animationDelay: '0.1s' }}>
          {(['logistique', 'call-center', 'inventaire'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-4 ${activeTab === tab ? 'bg-primary text-white shadow-2xl shadow-primary/40 scale-105 border border-white/10' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
            >
              {tab === 'logistique' && <Truck size={18} strokeWidth={2.5} />}
              {tab === 'call-center' && <PhoneCall size={18} strokeWidth={2.5} />}
              {tab === 'inventaire' && <Package size={18} strokeWidth={2.5} />}
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-40 bg-white/2 backdrop-blur-3xl border border-white/5 rounded-[80px] shadow-inner">
             <div className="w-24 h-24 border-b-4 border-l-4 border-primary rounded-full animate-spin"></div>
             <p className="mt-12 text-slate-500 font-black tracking-[0.5em] uppercase text-xs animate-pulse">Synchronisation des flux Nexus...</p>
          </div>
        ) : (
          <div className="animate-pageEnter" style={{ animationDelay: '0.2s' }}>
            {activeTab === 'logistique' && renderLogistics()}
            {activeTab === 'call-center' && renderCallCenter()}
            {activeTab === 'inventaire' && renderInventory()}
          </div>
        )}
      </div>
    </div>
  );
};

const NexusPerfCard = ({ title, value, sub, icon: Icon, color, trend }: any) => (
  <div className="nexus-card-elite p-10 group hover:translate-y--3 transition-all duration-700 relative overflow-hidden" style={{ background: 'rgba(2, 6, 23, 0.4)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
    <div className="absolute -right-6 -top-6 w-32 h-32 opacity-[0.03] rounded-full" style={{ background: color, filter: 'blur(30px)' }}></div>
    <div className="flex justify-between items-start mb-10 relative z-10">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon size={32} style={{ color: color }} strokeWidth={2.5} />
      </div>
      {trend && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[10px] tracking-[0.15em] ${trend.startsWith('+') ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>
           {trend.startsWith('+') ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />}
           {trend}
        </div>
      )}
    </div>
    <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">{title}</div>
    <div className="text-5xl font-black mb-4 text-white tracking-tighter" style={{ letterSpacing: '-0.04em' }}>{value}</div>
    {sub && <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-3">
       <div className="w-1 h-1 rounded-full bg-slate-700"></div> {sub}
    </div>}
  </div>
);
