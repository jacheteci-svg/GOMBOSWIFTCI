import { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Truck,
  PhoneCall,
  Package,
  TrendingUp,
  Target,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Coins,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';

type TabType = 'logistique' | 'call-center' | 'inventaire';
type FilterType = 'mois' | '7jours' | 'aujourdhui' | 'toujours';

interface PerformanceDashboardProps {
  tenantId?: string;
  isSuperAdmin?: boolean;
}

const chartTooltip = {
  contentStyle: {
    background: '#12182b',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '12px 16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
  },
  labelStyle: { color: '#f8fafc', fontWeight: 700 },
  itemStyle: { color: '#cbd5e1' },
};

const accentIcon: Record<string, string> = {
  cyan: 'bg-cyan-500/15 text-cyan-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  violet: 'bg-violet-500/15 text-violet-400',
  amber: 'bg-amber-500/15 text-amber-400',
  rose: 'bg-rose-500/15 text-rose-400',
  slate: 'bg-slate-500/15 text-slate-300',
};

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

      const [logData, callData, invData] = await Promise.all([queryLog, queryCall, queryInv]);

      setStats({
        logistique: logData.data || [],
        callCenter: callData.data || [],
        inventaire: invData.data || [],
      });
    } catch (err) {
      console.error('Hub Performance Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId, filter]);

  const renderFilterButtons = () => (
    <div
      className="inline-flex flex-wrap gap-1 p-1 rounded-2xl border border-white/[0.08]"
      style={{ background: 'var(--surface)' }}
    >
      {[
        { id: 'mois' as const, label: 'Ce mois' },
        { id: '7jours' as const, label: '7 jours' },
        { id: 'aujourdhui' as const, label: "Aujourd'hui" },
        { id: 'toujours' as const, label: 'Tout' },
      ].map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setFilter(f.id)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filter === f.id
              ? 'text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          style={
            filter === f.id
              ? {
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  boxShadow: '0 4px 20px rgba(6, 182, 212, 0.35)',
                }
              : undefined
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  const StatCard = ({
    label,
    value,
    icon: Icon,
    accent,
  }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    accent: keyof typeof accentIcon;
  }) => (
    <div
      className="rounded-[var(--radius-xl)] p-6 border border-white/[0.06] flex flex-col gap-4 transition-all duration-300 hover:border-cyan-500/20"
      style={{
        background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentIcon[accent]}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-main)] tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );

  const Ship = (props: React.SVGProps<SVGSVGElement>) => (
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
    const totalGains = data.reduce((acc: number, s: any) => acc + (Number(s.ca_frais) || 0), 0);
    const avgSuccess = totalSorties > 0 ? Math.round((totalReussies / totalSorties) * 100) : 0;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Taux de réussite" value={`${avgSuccess}%`} icon={Target} accent="emerald" />
          <StatCard label="Missions (sorties)" value={totalSorties} icon={Layers} accent="cyan" />
          <StatCard label="Livraisons réussies" value={totalReussies} icon={Ship} accent="violet" />
          <StatCard label="CA frais (estim.)" value={`${totalGains.toLocaleString('fr-FR')} F`} icon={Coins} accent="amber" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <div className="xl:col-span-3 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">Équipe terrain</h3>
                <p className="text-sm text-slate-500 mt-0.5">Livreurs — missions, succès, retours</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Données synchronisées
              </div>
            </div>

            <div
              className="rounded-[var(--radius-xl)] border border-white/[0.06] overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06] bg-white/[0.03]">
                      <th className="px-5 py-4 font-semibold">Livreur</th>
                      <th className="px-5 py-4 font-semibold text-center">Missions</th>
                      <th className="px-5 py-4 font-semibold text-center text-emerald-400/90">Succès</th>
                      <th className="px-5 py-4 font-semibold text-center text-rose-400/90">Retours</th>
                      <th className="px-5 py-4 font-semibold text-right">CA livraison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.map((s: any) => (
                      <tr key={s.livreur_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                              style={{
                                background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.25)',
                              }}
                            >
                              {s.nom?.charAt(0) ?? '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100">{s.nom}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    s.success_rate >= 85
                                      ? 'bg-emerald-500'
                                      : s.success_rate >= 60
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                  }`}
                                />
                                <span className="text-xs text-slate-500">{s.success_rate}% réussite</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-slate-200 tabular-nums">{s.sorties}</td>
                        <td className="px-5 py-4 text-center font-semibold text-emerald-400 tabular-nums">{s.reussies}</td>
                        <td className="px-5 py-4 text-center font-semibold text-rose-400/90 tabular-nums">{s.retours}</td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-100 tabular-nums">
                          {s.ca_frais?.toLocaleString('fr-FR')}{' '}
                          <span className="text-slate-500 text-xs font-medium">F</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.length === 0 && (
                <p className="p-10 text-center text-slate-500 text-sm">Aucune donnée logistique pour cette période.</p>
              )}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div
              className="rounded-[var(--radius-xl)] border border-white/[0.06] p-6 h-full"
              style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' }}
            >
              <h3 className="text-base font-bold text-[var(--text-main)] mb-1 flex items-center gap-2">
                <Zap className="text-cyan-400" size={20} />
                Taux de succès par agent
              </h3>
              <p className="text-xs text-slate-500 mb-6">Comparaison visuelle (%)</p>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="nom" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      {...chartTooltip}
                      formatter={(v) => [`${v ?? 0}%`, 'Succès']}
                    />
                    <Bar dataKey="success_rate" radius={[6, 6, 0, 0]} maxBarSize={36}>
                      {data.map((_: any, index: number) => (
                        <Cell key={index} fill={index % 2 === 0 ? '#06b6d4' : '#34d399'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-500">Moyenne plateforme</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{avgSuccess}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${avgSuccess}%`,
                      background: 'linear-gradient(90deg, #06b6d4, #34d399)',
                    }}
                  />
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
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Conversion (livraisons / dossiers)" value={`${avgConv}%`} icon={Zap} accent="violet" />
          <StatCard label="Dossiers traités" value={totalHandled} icon={Activity} accent="cyan" />
          <StatCard label="Validations fermes" value={totalValidations} icon={ShieldCheck} accent="emerald" />
          <StatCard label="Écart conversion" value={`${Math.max(0, 100 - avgConv)}%`} icon={AlertTriangle} accent="rose" />
        </div>

        <div
          className="rounded-[var(--radius-xl)] border border-white/[0.06] p-6 md:p-8"
          style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">Centre d&apos;appel</h3>
              <p className="text-sm text-slate-500 mt-0.5">Performance par agent</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
              <PhoneCall size={22} strokeWidth={2} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              {data.map((agent: any) => (
                <div key={agent.agent_id}>
                  <div className="flex justify-between items-end gap-4 mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-100">{agent.staff_name || 'Agent'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{agent.total_handled} dossiers</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-100 tabular-nums">{agent.success_rate}%</div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400/90 font-semibold">Conversion</p>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, agent.success_rate)}%`,
                        background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.length === 0 && <p className="text-center text-slate-500 text-sm py-8">Aucune donnée centre d&apos;appel.</p>}
            </div>

            <div
              className="flex flex-col items-center justify-center text-center rounded-2xl border border-white/[0.06] p-8 bg-white/[0.02]"
            >
              <div className="relative w-36 h-36 mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="10"
                    strokeDasharray={`${avgConv * 2.64}, 264`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-100 tabular-nums">{avgConv}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Global</span>
                </div>
              </div>
              <h4 className="text-base font-bold text-slate-100 mb-2">Efficacité conversationnelle</h4>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Part des dossiers ayant abouti à une livraison réussie, sur la période affichée.
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
    const healthPct =
      data.length > 0 ? Math.round((1 - itemsAlert / data.length) * 100) : 0;
    const avgRotation =
      data.length > 0
        ? Math.round(data.reduce((acc: number, i: any) => acc + (Number(i.rotation_index) || 0), 0) / data.length)
        : 0;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Santé des stocks" value={`${healthPct}%`} icon={Layers} accent="cyan" />
          <StatCard label="Articles sous seuil" value={itemsAlert} icon={AlertTriangle} accent="amber" />
          <StatCard label="Rotation moyenne" value={`${avgRotation}%`} icon={TrendingUp} accent="emerald" />
          <StatCard label="Ruptures" value={data.filter((i: any) => i.stock_actuel === 0).length} icon={Package} accent="rose" />
        </div>

        <div
          className="rounded-[var(--radius-xl)] border border-white/[0.06] overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' }}
        >
          <div className="px-6 py-5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">Inventaire</h3>
              <p className="text-sm text-slate-500 mt-0.5">Seuils, rotation et statut</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              {data.length} réf.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06] bg-white/[0.03]">
                  <th className="px-5 py-4 font-semibold">Produit</th>
                  <th className="px-5 py-4 font-semibold text-center">Stock</th>
                  <th className="px-5 py-4 font-semibold text-center">Seuil</th>
                  <th className="px-5 py-4 font-semibold text-center">Rotation</th>
                  <th className="px-5 py-4 font-semibold text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.map((item: any) => (
                  <tr key={item.sku} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-100">{item.nom}</div>
                      <div className="text-[11px] text-cyan-400/80 font-medium mt-0.5">SKU {item.sku}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex min-w-[3rem] justify-center px-3 py-1 rounded-lg text-sm font-semibold tabular-nums ${
                          item.stock_actuel <= (item.stock_minimum || 5)
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {item.stock_actuel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500 tabular-nums">{item.stock_minimum || 5}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full bg-cyan-500/80 rounded-full"
                            style={{ width: `${Math.min(100, item.rotation_index)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 tabular-nums w-9">{item.rotation_index}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          item.stock_actuel > (item.stock_minimum || 5)
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : item.stock_actuel > 0
                              ? 'bg-amber-500/15 text-amber-200'
                              : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {item.stock_actuel > (item.stock_minimum || 5)
                          ? 'OK'
                          : item.stock_actuel > 0
                            ? 'À réappro.'
                            : 'Rupture'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length === 0 && (
            <p className="p-10 text-center text-slate-500 text-sm">Aucun produit suivi pour l&apos;inventaire.</p>
          )}
        </div>
      </div>
    );
  };

  const scopeLine = isSuperAdmin
    ? 'Vue consolidée — toutes les boutiques de la plateforme.'
    : 'Indicateurs de votre activité et de vos équipes.';

  const tabDefs: { id: TabType; label: string; sub: string; icon: typeof Truck }[] = [
    { id: 'logistique', label: 'Logistique', sub: 'Livreurs & missions', icon: Truck },
    { id: 'call-center', label: "Centre d'appel", sub: 'Conversions & dossiers', icon: PhoneCall },
    { id: 'inventaire', label: 'Inventaire', sub: 'Stocks & rotation', icon: Package },
  ];

  return (
    <div
      className="min-h-full w-full font-sans overflow-x-hidden selection:bg-cyan-500/20"
      style={{
        background:
          'linear-gradient(180deg, var(--bg-app) 0%, #0a0f1a 40%, var(--bg-app) 100%)',
        color: 'var(--text-main)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 pb-16">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">Performance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.35rem] font-bold tracking-tight text-[var(--text-main)] mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Pilotage opérationnel
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">{scopeLine}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0">
            {renderFilterButtons()}
            <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <Clock size={14} className="text-slate-500 shrink-0" />
              <span>
                {new Date().toLocaleDateString('fr-FR')} ·{' '}
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        <nav className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10" aria-label="Domaines">
          {tabDefs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-4 p-5 rounded-[var(--radius-xl)] text-left border transition-all duration-300 ${
                  active
                    ? 'border-cyan-500/40 shadow-[0_0_0_1px_rgba(6,182,212,0.15)]'
                    : 'border-white/[0.06] hover:border-white/10'
                }`}
                style={{
                  background: active ? 'rgba(6, 182, 212, 0.08)' : 'var(--surface)',
                  boxShadow: active ? '0 12px 40px rgba(0,0,0,0.35)' : undefined,
                }}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/[0.05] text-slate-400'
                  }`}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div>
                  <div className={`font-bold text-base ${active ? 'text-white' : 'text-slate-200'}`}>{tab.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{tab.sub}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {loading ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-[var(--radius-xl)] border border-white/[0.06]"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"
              aria-hidden
            />
            <p className="mt-6 text-sm font-medium text-slate-500 uppercase tracking-wider">Chargement des indicateurs…</p>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {activeTab === 'logistique' && renderLogistics()}
            {activeTab === 'call-center' && renderCallCenter()}
            {activeTab === 'inventaire' && renderInventory()}
          </div>
        )}
      </div>
    </div>
  );
};
