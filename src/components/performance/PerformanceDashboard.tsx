import { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area, CartesianGrid, PieChart, Pie
} from 'recharts';
import { 
  Truck, PhoneCall, Package, Lightbulb, TrendingUp, 
  Target, ShieldCheck, Zap, AlertTriangle, Coins,
  Clock, Activity, PieChart as PieChartIcon, 
  ArrowUpRight, ArrowDownRight, Layers, FileText
} from 'lucide-react';

type TabType = 'logistique' | 'call-center' | 'inventaire';
type FilterType = 'mois' | '7jours' | 'aujourdhui' | 'toujours';

interface PerformanceDashboardProps {
  tenantId?: string;
  isSuperAdmin?: boolean;
}

export const PerformanceDashboard = ({ tenantId, isSuperAdmin }: PerformanceDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('logistique');
  const [filter, setFilter] = useState<FilterType>('mois');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ logistique: [], callCenter: [], inventaire: [] });

  const fetchData = async () => {
    const effectiveTenantId = tenantId;
    if (!effectiveTenantId && !isSuperAdmin) return;
    
    setLoading(true);
    try {
      let queryLog = insforge.database.from('logistics_performance_summary').select('*');
      let queryCall = insforge.database.from('staff_performance_summary').select('*');
      let queryInv = insforge.database.from('inventory_performance_summary').select('*');

      if (effectiveTenantId) {
        queryLog = queryLog.eq('tenant_id', effectiveTenantId);
        queryCall = queryCall.eq('tenant_id', effectiveTenantId);
        queryInv = queryInv.eq('tenant_id', effectiveTenantId);
      }

      const [logData, callData, invData] = await Promise.all([
        queryLog,
        queryCall,
        queryInv
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
  }, [tenantId, filter]);

  const renderFilterButtons = () => (
    <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-[20px] shadow-sm border border-slate-200/50 gap-1">
      {[
        { id: 'mois', label: 'Ce Mois' },
        { id: '7jours', label: '7 Jours' },
        { id: 'aujourdhui', label: 'Aujourd\'hui' },
        { id: 'toujours', label: 'Toujours' }
      ].map((f) => (
        <button
          key={f.id}
          onClick={() => setFilter(f.id as FilterType)}
          className={`px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
            filter === f.id 
              ? 'bg-[#5e5ce6] text-white shadow-lg shadow-[#5e5ce6]/30' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  const renderStatsRow = (items: { label: string, value: string | number, icon: any, color: string, trend?: string }[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all duration-500 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity bg-slate-400 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color.replace('text-', 'bg-').replace('600', '50/80')}`}>
               <item.icon size={26} className={item.color} strokeWidth={2.2} />
            </div>
            {item.trend && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 font-black text-[10px] tracking-tight ${item.trend.startsWith('+') ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                {item.trend.startsWith('+') ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                {item.trend}
              </div>
            )}
          </div>
          <div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</div>
            <div className="text-3xl font-black text-slate-900 tracking-tighter" style={{ letterSpacing: '-0.04em' }}>{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const Ship = (props: any) => (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2.2 9l-.5 4c-.1.7.4 1 1 1h18.6c.6 0 1.1-.3 1-1l-.5-4a1 1 0 0 0-1-1H3.2a1 1 0 0 0-1 1z" />
      <path d="M6 8V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4" />
      <path d="M12 3v5" />
      <path d="M8 18c0 1.1-.9 2-2 2s-2-.9-2-2" />
      <path d="M18 18c0 1.1-.9 2-2 2s-2-.9-2-2" />
    </svg>
  );

  const renderLogistics = () => {
    const data = stats.logistique;
    const totalSorties = data.reduce((acc: number, s: any) => acc + (Number(s.sorties) || 0), 0);
    const totalReussies = data.reduce((acc: number, s: any) => acc + (Number(s.reussies) || 0), 0);
    const totalRetours = data.reduce((acc: number, s: any) => acc + (Number(s.retours) || 0), 0);
    const totalGains = data.reduce((acc: number, s: any) => acc + (Number(s.ca_frais) || 0), 0);
    const avgSuccess = totalSorties > 0 ? Math.round((totalReussies / totalSorties) * 100) : 0;

    return (
      <div className="space-y-12">
        {renderStatsRow([
          { label: 'Taux de Succès Global', value: `${avgSuccess}%`, icon: Target, color: 'text-[#10b981]', trend: '+2.4%' },
          { label: 'Volume d\'Expédition', value: totalSorties, icon: Layers, color: 'text-[#5e5ce6]', trend: '+12%' },
          { label: 'Efficacité Livraisons', value: totalReussies, icon: Ship, color: 'text-[#0ea5e9]' },
          { label: 'CA Potentiel Frais', value: `${totalGains.toLocaleString()} F`, icon: Coins, color: 'text-[#f59e0b]', trend: '+8.1%' }
        ])}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center px-4">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Détail des Agents</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Audit de performance en temps réel</p>
               </div>
               <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Sync Active</span>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden group transition-all duration-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-widest text-slate-400 font-extrabold bg-slate-50/50">
                      <th className="p-8">Livreur</th>
                      <th className="p-8 text-center">Missions</th>
                      <th className="p-8 text-center text-emerald-600">Succès</th>
                      <th className="p-8 text-center text-rose-500">Retours</th>
                      <th className="p-8 text-right">CA Livraison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.map((s: any) => (
                      <tr key={s.livreur_id} className="hover:bg-[#5e5ce6]/[0.02] transition-colors group/row">
                        <td className="p-8">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5e5ce6] to-[#afacff] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#5e5ce6]/20">
                                 {s.nom?.charAt(0)}
                              </div>
                              <div>
                                 <div className="font-black text-slate-800 text-lg leading-tight group-hover/row:text-[#5e5ce6] transition-colors">{s.nom}</div>
                                 <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${s.success_rate >= 85 ? 'bg-emerald-500' : s.success_rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase">{s.success_rate}% de réussite</span>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="p-8 text-center font-black text-slate-800 text-lg">{s.sorties}</td>
                        <td className="p-8 text-center font-black text-emerald-500 text-lg">{s.reussies}</td>
                        <td className="p-8 text-center font-black text-rose-400 text-lg">{s.retours}</td>
                        <td className="p-8 text-right font-black text-slate-900 text-xl tracking-tighter">{s.ca_frais?.toLocaleString()} <span className="text-xs text-slate-400 font-bold ml-1">F</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30 border border-slate-100 h-full relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                      <Zap className="text-[#5e5ce6]" size={24} strokeWidth={2.5} /> Impact Succès
                   </h3>
                   <div style={{ height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                               dataKey="nom" 
                               hide 
                            />
                            <YAxis 
                               axisLine={false} 
                               tickLine={false} 
                               tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}}
                               domain={[0, 100]}
                            />
                            <Tooltip 
                               cursor={{fill: 'rgba(94, 92, 230, 0.05)'}} 
                               contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', padding: '1.25rem'}} 
                            />
                            <Bar dataKey="success_rate" barSize={32} radius={[10, 10, 10, 10]}>
                               {data.map((_: any, index: number) => (
                                  <Cell key={index} fill={index % 2 === 0 ? '#5e5ce6' : '#10b981'} />
                               ))}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="mt-8 pt-8 border-t border-slate-50">
                      <div className="flex justify-between items-center mb-5">
                         <span className="text-xs font-black text-slate-500 tracking-widest uppercase">Efficacité Moyenne</span>
                         <span className="text-xl font-black text-[#5e5ce6]">{avgSuccess}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-gradient-to-r from-[#5e5ce6] to-[#10b981] transition-all duration-1000"
                           style={{ width: `${avgSuccess}%` }}
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCallCenter = () => {
    const data = stats.callCenter;
    const totalHandled = data.reduce((acc: number, s: any) => acc + (Number(s.total_handled) || 0), 0);
    const totalValidations = data.reduce((acc: number, s: any) => acc + (Number(s.total_validations) || 0), 0);
    const totalDelivered = data.reduce((acc: number, s: any) => acc + (Number(s.total_delivered) || 0), 0);
    const avgConv = totalHandled > 0 ? Math.round((totalDelivered / totalHandled) * 100) : 0;

    return (
      <div className="space-y-12">
        {renderStatsRow([
          { label: 'Conversion Client', value: `${avgConv}%`, icon: Zap, color: 'text-[#8b5cf6]', trend: '+1.8%' },
          { label: 'Appels Qualifiés', value: totalHandled, icon: Activity, color: 'text-[#3b82f6]', trend: '+5%' },
          { label: 'Validations Fermes', value: totalValidations, icon: ShieldCheck, color: 'text-[#10b981]' },
          { label: 'Pertes Opérationnelles', value: `${100-avgConv}%`, icon: AlertTriangle, color: 'text-[#f43f5e]', trend: '-0.5%' }
        ])}

        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 relative overflow-hidden">
           <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Staff Centre d'Appel</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Conversions Réelles / Validations</p>
              </div>
              <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-2xl flex items-center justify-center text-[#8b5cf6]">
                 <PhoneCall size={24} strokeWidth={2.5} />
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-10">
                 {data.map((agent: any) => (
                    <div key={agent.agent_id} className="group cursor-default">
                       <div className="flex justify-between items-end mb-4">
                          <div>
                             <h4 className="text-xl font-black text-slate-900 leading-tight group-hover:text-[#8b5cf6] transition-colors">{agent.staff_name || 'Agent Nexus'}</h4>
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{agent.total_handled} Dossiers Traités</p>
                          </div>
                          <div className="text-right">
                             <div className="text-3xl font-black text-slate-900 tracking-tighter">{agent.success_rate}%</div>
                             <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Conversion</p>
                          </div>
                       </div>
                       <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1">
                          <div 
                             className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] rounded-full transition-all duration-1000 shadow-lg shadow-[#8b5cf6]/20"
                             style={{ width: `${agent.success_rate}%` }}
                          />
                       </div>
                    </div>
                 ))}
                 {data.length === 0 && <div className="p-12 text-center text-slate-400 font-bold italic">Aucune donnée disponible.</div>}
              </div>

              <div className="bg-slate-50/50 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
                 <div className="w-32 h-32 mb-10 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                       <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                       <circle cx="50" cy="50" r="45" fill="none" stroke="#8b5cf6" strokeWidth="10" strokeDasharray={`${avgConv * 2.82}, 282`} strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-3xl font-black text-slate-900 tracking-tighter">{avgConv}%</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global</span>
                    </div>
                 </div>
                 <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Efficacité Conversationnelle</h4>
                 <p className="text-sm text-slate-400 font-semibold max-w-[280px] leading-relaxed">
                    Ce score mesure la capacité de votre équipe à transformer une validation en livraison réussie sur le terrain.
                 </p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    const data = stats.inventaire;
    const itemsAlert = data.filter((i: any) => i.stock_actuel <= (i.stock_minimum || 5)).length;

    return (
      <div className="space-y-12">
        {renderStatsRow([
          { label: 'Santé des Stocks', value: `${data.length > 0 ? Math.round((1 - itemsAlert/data.length)*100) : 0}%`, icon: Layers, color: 'text-[#6366f1]', trend: '+4%' },
          { label: 'Articles Alertés', value: itemsAlert, icon: AlertTriangle, color: 'text-[#f43f5e]', trend: itemsAlert > 5 ? '+2' : '-1' },
          { label: 'Rotation Globale', value: `${data.length > 0 ? Math.round(data.reduce((acc: any, i: any) => acc + (Number(i.rotation_index)||0), 0)/data.length) : 0}%`, icon: TrendingUp, color: 'text-[#06b6d4]' },
          { label: 'Ruptures Totales', value: data.filter((i: any) => i.stock_actuel === 0).length, icon: Package, color: 'text-[#1e293b]' }
        ])}

        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
           <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Moniteur de Stocks</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Audit des niveaux critiques et rotation</p>
              </div>
              <div className="flex gap-3">
                 <div className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-black text-slate-500 uppercase tracking-widest">
                    {data.length} Références
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[11px] uppercase tracking-widest text-slate-400 font-extrabold bg-slate-50/50">
                       <th className="p-8">Produit</th>
                       <th className="p-8 text-center">Quantité Actuelle</th>
                       <th className="p-8 text-center">Seuil Alerte</th>
                       <th className="p-8 text-center">Indice de Rotation</th>
                       <th className="p-8 text-right">Statut Vital</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {data.map((item: any) => (
                       <tr key={item.sku} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-8">
                             <div>
                                <div className="font-black text-slate-800 text-lg leading-tight">{item.nom}</div>
                                <div className="text-[11px] font-bold text-[#5e5ce6] uppercase tracking-widest mt-1">SKU: {item.sku}</div>
                             </div>
                          </td>
                          <td className="p-8 text-center">
                             <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-2xl font-black text-lg ${item.stock_actuel <= (item.stock_minimum || 5) ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {item.stock_actuel}
                             </div>
                          </td>
                          <td className="p-8 text-center font-bold text-slate-400 text-sm">{item.stock_minimum || 5} u.</td>
                          <td className="p-8 text-center">
                             <div className="flex items-center justify-center gap-3">
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                   <div 
                                      className="h-full bg-[#06b6d4] transition-all duration-1000"
                                      style={{ width: `${item.rotation_index}%` }}
                                   />
                                </div>
                                <span className="font-black text-slate-700 text-sm whitespace-nowrap">{item.rotation_index}%</span>
                             </div>
                          </td>
                          <td className="p-8 text-right">
                             <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.stock_actuel > (item.stock_minimum || 5) ? 'bg-emerald-100 text-emerald-700' : item.stock_actuel > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                {item.stock_actuel > (item.stock_minimum || 5) ? 'Optimal' : item.stock_actuel > 0 ? 'Réapprovisionner' : 'Rupture'}
                             </span>
                          </td>
                       </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">Aucun produit configuré pour le suivi des performances.</td></tr>}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-14 font-sans overflow-x-hidden selection:bg-[#5e5ce6]/20">
      <div className="max-w-[1700px] mx-auto pb-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-10 animate-pageEnter">
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-1.5 bg-gradient-to-r from-[#5e5ce6] to-[#10b981] rounded-full"></div>
              <span className="text-[#5e5ce6] font-black uppercase tracking-[0.4em] text-[10px]">Intelligence Performance Monitoring</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-6" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.05em' }}>
              Nexus Hub Performance
            </h1>
            <p className="text-slate-400 font-bold text-xl max-w-2xl leading-relaxed">
              Tableau de bord décisionnel automatisé pour le pilotage de vos départements logistiques et ventes.
            </p>
          </div>
          <div className="flex flex-col items-end gap-6">
             {renderFilterButtons()}
             <div className="flex items-center gap-4 text-xs font-black text-slate-400 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <Clock size={16} />
                <span>Mis à jour le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-pageEnter" style={{ animationDelay: '0.1s' }}>
          {[
            { id: 'logistique', label: 'Département Logistique', sub: 'Livraisons & Capacités Terrain', icon: Truck, color: 'text-[#5e5ce6]', bg: 'bg-[#5e5ce6]/10' },
            { id: 'call-center', label: 'Centre de Validation', sub: 'Efficacité & Conversions', icon: PhoneCall, color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
            { id: 'inventaire', label: 'Gestion Inventaire', sub: 'Rotation & Ruptures', icon: Package, color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10' }
          ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as TabType)}
               className={`group flex items-center gap-6 p-10 rounded-[2.5rem] text-left transition-all duration-700 bg-white border-4 relative overflow-hidden ${
                  activeTab === tab.id 
                    ? 'border-[#5e5ce6] shadow-2xl shadow-[#5e5ce6]/20 scale-[1.03]' 
                    : 'border-transparent shadow-xl shadow-slate-200/40 hover:border-[#5e5ce6]/20'
               }`}
             >
                <div className={`absolute -right-10 -bottom-10 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700 ${tab.color}`}>
                   <tab.icon size={150} />
                </div>
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-transform duration-700 group-hover:scale-110 ${tab.bg}`}>
                   <tab.icon size={32} strokeWidth={2.5} className={tab.color} />
                </div>
                <div className="relative z-10">
                   <div className="text-xl font-black text-slate-900 leading-tight tracking-tight mb-2 group-hover:text-[#5e5ce6] transition-colors">{tab.label}</div>
                   <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{tab.sub}</div>
                </div>
             </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-48 bg-white/50 backdrop-blur-2xl rounded-[4rem] shadow-inner border border-white/50 animate-pulse">
             <div className="w-16 h-16 border-4 border-[#5e5ce6] border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-8 text-slate-500 font-black tracking-[0.3em] uppercase text-xs">Analyse des flux opérationnels...</p>
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
