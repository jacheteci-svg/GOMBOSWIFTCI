import { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  Truck, PhoneCall, Package, Lightbulb
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
    <div className="flex bg-[#e2e8f0]/40 p-1.5 rounded-2xl gap-1">
      {[
        { id: 'mois', label: 'Ce Mois' },
        { id: '7jours', label: '7 Jours' },
        { id: 'aujourdhui', label: 'Aujourd\'hui' },
        { id: 'toujours', label: 'Toujours' }
      ].map((f) => (
        <button
          key={f.id}
          onClick={() => setFilter(f.id as FilterType)}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === f.id 
              ? 'bg-[#5e5ce6] text-white shadow-lg' 
              : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  const renderLogistics = () => {
    const data = stats.logistique;
    return (
      <div className="space-y-10 animate-pageEnter">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center px-4">
             <h3 className="text-[1.1rem] font-black text-[#1e293b]">Détails des Performances : Logistique</h3>
             <div className="flex items-center gap-2 text-[#5e5ce6] text-xs font-bold">
                <Lightbulb size={14} />
                <span>Classé par efficacité</span>
             </div>
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f8fafc]">
                  <tr className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-black">
                    <th className="p-6">Livreur</th>
                    <th className="p-6 text-center">Sorties</th>
                    <th className="p-6 text-center">Livrés</th>
                    <th className="p-6 text-center">Retours</th>
                    <th className="p-6 text-center">Annulés</th>
                    <th className="p-6 text-center">Reports</th>
                    <th className="p-6 text-right">Gains Livr.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.length > 0 ? data.map((s: any) => (
                    <tr key={s.livreur_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#5e5ce6] text-white flex items-center justify-center font-black text-sm">
                               {s.nom?.charAt(0)}
                            </div>
                            <div>
                               <div className="font-bold text-slate-800 text-sm">{s.nom}</div>
                               <div className="text-[11px] font-bold text-emerald-500">{s.success_rate}% réussite</div>
                            </div>
                         </div>
                      </td>
                      <td className="p-6 text-center font-black text-slate-800 text-sm">{s.sorties}</td>
                      <td className="p-6 text-center font-black text-emerald-500 text-sm">{s.reussies}</td>
                      <td className="p-6 text-center font-black text-[#5e5ce6] text-sm">{s.retours}</td>
                      <td className="p-6 text-center font-black text-rose-400 text-sm">{s.annulations}</td>
                      <td className="p-6 text-center font-black text-amber-500 text-sm">{s.reports || 0}</td>
                      <td className="p-6 text-right font-black text-slate-900 text-sm">{s.ca_frais?.toLocaleString()} <span className="text-[10px] text-slate-400">CFA</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-bold italic">Aucune donnée de performance enregistrée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100">
           <h3 className="text-lg font-black text-[#1e293b] mb-10">Impact Livraison (Succès %)</h3>
           <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <XAxis 
                       dataKey="nom" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} 
                    />
                    <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}}
                       domain={[0, 100]}
                    />
                    <Tooltip 
                       cursor={{fill: 'rgba(94, 92, 230, 0.03)'}} 
                       contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '1rem'}} 
                    />
                    <Bar dataKey="success_rate" barSize={40} radius={[8, 8, 8, 8]}>
                       {data.map((_: any, index: number) => (
                          <Cell key={index} fill="#10b981" />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    );
  };

  const renderCallCenter = () => {
     return (
        <div className="space-y-8 animate-pageEnter">
           <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-8 text-center text-slate-500 font-bold">
              Interface Centre d'Appel en cours d'optimisation...
           </div>
        </div>
     );
  }

  const renderInventory = () => {
    return (
       <div className="space-y-8 animate-pageEnter">
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-8 text-center text-slate-500 font-bold">
             Interface Inventaire en cours d'optimisation...
          </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-sans overflow-y-auto">
      <div className="max-w-[1700px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-[2.5rem] leading-none mb-3 text-[#5e5ce6]" style={{ fontFamily: 'Outfit, sans-serif' }}>Hub Performance Équipe</h1>
            <p className="text-slate-400 font-semibold text-sm">Suivez l'efficacité opérationnelle de tous les départements.</p>
          </div>
          {renderFilterButtons()}
        </div>

        {/* Department Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { id: 'logistique', label: 'Logistique', sub: 'Livraisons & Retours', icon: Truck, color: 'bg-[#5e5ce6]/10 text-[#5e5ce6]' },
            { id: 'call-center', label: 'Centre d\'Appel', sub: 'Validations & Relances', icon: PhoneCall, color: 'bg-[#5e5ce6]/10 text-[#5e5ce6]' },
            { id: 'inventaire', label: 'Inventaire', sub: 'Création de Produits', icon: Package, color: 'bg-[#5e5ce6]/10 text-[#5e5ce6]' }
          ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as TabType)}
               className={`flex items-center gap-5 p-8 rounded-[1.5rem] text-left transition-all bg-white border-2 ${
                  activeTab === tab.id 
                    ? 'border-[#5e5ce6] shadow-xl shadow-[#5e5ce6]/10 scale-[1.02]' 
                    : 'border-transparent shadow-sm hover:border-[#5e5ce6]/20'
               }`}
             >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tab.color}`}>
                   <tab.icon size={28} />
                </div>
                <div>
                   <div className="text-lg font-black text-[#1e293b] leading-tight">{tab.label}</div>
                   <div className="text-[11px] font-bold text-slate-400 mt-1">{tab.sub}</div>
                </div>
             </button>
          ))}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[3rem] shadow-sm border border-slate-100">
             <div className="w-12 h-12 border-4 border-[#5e5ce6] border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-6 text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">Synchronisation Nexus...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'logistique' && renderLogistics()}
            {activeTab === 'call-center' && renderCallCenter()}
            {activeTab === 'inventaire' && renderInventory()}
          </div>
        )}
      </div>
    </div>
  );
};
