import { useState, useEffect, useMemo, type ReactNode } from 'react';
import {
  loadPerformanceDashboardData,
  loadSuperAdminTenantPerformance,
  type TenantPerfRow,
} from '../../services/performanceService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Truck,
  PhoneCall,
  Package,
  TrendingUp,
  Clock,
  Lightbulb,
  Building2,
  Users,
  ShoppingCart,
  Banknote,
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

/** Couleurs sémantiques alignées sur le thème (cyan primaire + états) */
const C = {
  primary: '#06b6d4',
  primarySoft: 'rgba(6, 182, 212, 0.12)',
  livres: '#34d399',
  retours: '#a78bfa',
  annules: '#fb7185',
  reports: '#fbbf24',
  textMuted: '#94a3b8',
};

function sortHint(tab: TabType): string {
  switch (tab) {
    case 'logistique':
      return 'Classé par efficacité';
    case 'call-center':
      return 'Classé par conversion';
    case 'inventaire':
      return 'Classé par rotation';
    default:
      return '';
  }
}

export const PerformanceDashboard = ({ tenantId, isSuperAdmin }: PerformanceDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('logistique');
  const [filter, setFilter] = useState<FilterType>('mois');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ logistique: [], callCenter: [], inventaire: [] });
  const [tenantRows, setTenantRows] = useState<TenantPerfRow[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const rows = await loadSuperAdminTenantPerformance(filter);
        setTenantRows(rows);
        return;
      }
      const effectiveTenantId = tenantId;
      if (!effectiveTenantId) return;
      const loaded = await loadPerformanceDashboardData(effectiveTenantId, false, filter);
      setStats(loaded);
    } catch (err) {
      console.error('Hub Performance Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId, filter, isSuperAdmin]);

  const renderFilterButtons = () => (
    <div
      role="group"
      aria-label="Période"
      className="inline-flex flex-wrap items-center gap-2 p-2 rounded-2xl border border-white/[0.1] shadow-inner"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.75) 100%)',
      }}
    >
      {[
        { id: 'mois' as const, label: 'Ce mois' },
        { id: '7jours' as const, label: '7 jours' },
        { id: 'aujourdhui' as const, label: "Aujourd'hui" },
        { id: 'toujours' as const, label: 'Toujours' },
      ].map((f) => {
        const on = filter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              'min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]',
              on
                ? 'text-white shadow-md scale-[1.02]'
                : 'text-slate-200 bg-slate-800/90 border border-slate-600/40 hover:bg-slate-700/95 hover:text-white hover:border-slate-500/50',
            ].join(' ')}
            style={
              on
                ? {
                    background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
                    boxShadow: '0 4px 18px rgba(6, 182, 212, 0.4)',
                  }
                : undefined
            }
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );

  const panelClass =
    'rounded-[12px] border border-white/[0.08] overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-sm)]';

  const logisticsSorted = useMemo(() => {
    const data = stats.logistique as any[];
    return [...data].sort((a, b) => (Number(b.success_rate) || 0) - (Number(a.success_rate) || 0));
  }, [stats.logistique]);

  const callCenterSorted = useMemo(() => {
    const data = stats.callCenter as any[];
    return [...data].sort((a, b) => (Number(b.success_rate) || 0) - (Number(a.success_rate) || 0));
  }, [stats.callCenter]);

  const inventorySorted = useMemo(() => {
    const data = stats.inventaire as any[];
    return [...data].sort(
      (a, b) => (Number(b.rotation_index) || 0) - (Number(a.rotation_index) || 0)
    );
  }, [stats.inventaire]);

  const renderLogistics = () => {
    const data = logisticsSorted;
    const totalSorties = data.reduce((acc: number, s: any) => acc + (Number(s.sorties) || 0), 0);
    const totalReussies = data.reduce((acc: number, s: any) => acc + (Number(s.reussies) || 0), 0);
    const avgSuccess = totalSorties > 0 ? Math.round((totalReussies / totalSorties) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Tableau — maquette : détails puis graphique */}
        <div className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[var(--text-main)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Détails des performances :{' '}
              <span style={{ color: C.primary }}>Logistique</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Lightbulb size={16} className="text-amber-400/90 shrink-0" strokeWidth={2} />
              {sortHint('logistique')}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06] bg-white/[0.03]">
                  <th className="px-5 py-3.5 font-semibold">Livreur</th>
                  <th className="px-3 py-3.5 font-semibold text-center">Sorties</th>
                  <th className="px-3 py-3.5 font-semibold text-center" style={{ color: C.livres }}>
                    Livrés
                  </th>
                  <th className="px-3 py-3.5 font-semibold text-center" style={{ color: C.retours }}>
                    Retours
                  </th>
                  <th className="px-3 py-3.5 font-semibold text-center" style={{ color: C.annules }}>
                    Annulés
                  </th>
                  <th className="px-3 py-3.5 font-semibold text-center" style={{ color: C.reports }}>
                    Reportés
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-right">Gains livr.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {data.map((s: any) => (
                    <tr key={s.livreur_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${C.primary} 0%, #6366f1 100%)`,
                              boxShadow: `0 4px 16px ${C.primarySoft}`,
                            }}
                          >
                            {s.nom?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100">{s.nom}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{s.success_rate}% réussite</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center font-medium text-slate-200 tabular-nums">{s.sorties}</td>
                      <td className="px-3 py-4 text-center font-semibold tabular-nums" style={{ color: C.livres }}>
                        {s.reussies}
                      </td>
                      <td className="px-3 py-4 text-center font-semibold tabular-nums" style={{ color: C.retours }}>
                        {s.retours}
                      </td>
                      <td className="px-3 py-4 text-center font-semibold tabular-nums" style={{ color: C.annules }}>
                        {s.annules ?? 0}
                      </td>
                      <td className="px-3 py-4 text-center font-semibold tabular-nums" style={{ color: C.reports }}>
                        {s.reportes ?? 0}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-100 tabular-nums">
                        {s.ca_frais != null ? Number(s.ca_frais).toLocaleString('fr-FR') : '—'}{' '}
                        <span className="text-slate-500 text-xs font-semibold">CFA</span>
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

        {/* Graphique — pleine largeur, barres type maquette (succès %) */}
        <div className={`${panelClass} p-5 md:p-6`}>
          <h3 className="text-base font-bold text-[var(--text-main)] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Impact livraison (succès %)
          </h3>
          <p className="text-xs text-slate-500 mb-6">Comparaison par livreur — échelle 0 à 100</p>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="nom"
                  tick={{ fill: C.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: C.textMuted, fontSize: 11 }}
                  domain={[0, 100]}
                  width={36}
                />
                <Tooltip {...chartTooltip} formatter={(v) => [`${v ?? 0}%`, 'Succès']} />
                <Bar dataKey="success_rate" fill={C.livres} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-between items-center text-sm">
            <span className="text-slate-500">Moyenne équipe</span>
            <span className="font-bold tabular-nums" style={{ color: C.primary }}>
              {avgSuccess}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderCallCenter = () => {
    const data = callCenterSorted;
    const th = data.reduce((acc: number, s: any) => acc + (Number(s.total_handled) || 0), 0);
    const td = data.reduce((acc: number, s: any) => acc + (Number(s.total_delivered) || 0), 0);
    const avgConv = th > 0 ? Math.round((td / th) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[var(--text-main)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Détails des performances :{' '}
              <span style={{ color: C.primary }}>Centre d&apos;appel</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Lightbulb size={16} className="text-amber-400/90 shrink-0" strokeWidth={2} />
              {sortHint('call-center')}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06] bg-white/[0.03]">
                  <th className="px-5 py-3.5 font-semibold">Agent</th>
                  <th className="px-3 py-3.5 font-semibold text-center">Dossiers</th>
                  <th className="px-3 py-3.5 font-semibold text-center">Validations</th>
                  <th className="px-3 py-3.5 font-semibold text-center" style={{ color: C.livres }}>
                    Livrées
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-right" style={{ color: C.primary }}>
                    Conversion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {data.map((agent: any) => (
                  <tr key={agent.agent_id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-sm shrink-0">
                          {(agent.staff_name || 'A').charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-100">{agent.staff_name || 'Agent'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center tabular-nums text-slate-200">{agent.total_handled}</td>
                    <td className="px-3 py-4 text-center tabular-nums text-slate-300">{agent.total_validations}</td>
                    <td className="px-3 py-4 text-center font-semibold tabular-nums" style={{ color: C.livres }}>
                      {agent.total_delivered}
                    </td>
                    <td className="px-5 py-4 text-right font-bold tabular-nums" style={{ color: C.primary }}>
                      {agent.success_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length === 0 && (
            <p className="p-10 text-center text-slate-500 text-sm">Aucune donnée centre d&apos;appel.</p>
          )}
        </div>

        <div className={`${panelClass} p-5 md:p-6`}>
          <h3 className="text-base font-bold text-[var(--text-main)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Synthèse conversion (%)
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="barCallGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="staff_name"
                  tick={{ fill: C.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: C.textMuted, fontSize: 11 }}
                  width={36}
                />
                <Tooltip {...chartTooltip} formatter={(v) => [`${v ?? 0}%`, 'Conversion']} />
                <Bar dataKey="success_rate" fill="url(#barCallGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <PhoneCall size={18} className="text-cyan-400/80" />
              Moyenne équipe :{' '}
              <span className="font-bold text-cyan-400 tabular-nums">{avgConv}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    const data = inventorySorted;
    const itemsAlert = data.filter((i: any) => i.stock_actuel <= (i.stock_minimum || 5)).length;

    return (
      <div className="space-y-6">
        <div className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[var(--text-main)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Détails des performances :{' '}
              <span style={{ color: C.primary }}>Inventaire</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                {data.length} réf. · {itemsAlert} alerte(s)
              </span>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Lightbulb size={16} className="text-amber-400/90 shrink-0" strokeWidth={2} />
                {sortHint('inventaire')}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06] bg-white/[0.03]">
                  <th className="px-5 py-3.5 font-semibold">Produit</th>
                  <th className="px-3 py-3.5 font-semibold text-center">Stock</th>
                  <th className="px-3 py-3.5 font-semibold text-center">Seuil</th>
                  <th className="px-3 py-3.5 font-semibold text-center" style={{ color: C.primary }}>
                    Rotation
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {data.map((item: any) => (
                  <tr key={item.sku} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-100">{item.nom}</div>
                      <div className="text-[11px] font-medium mt-0.5" style={{ color: C.primary }}>
                        SKU {item.sku}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className={`inline-flex min-w-[2.5rem] justify-center px-2.5 py-1 rounded-lg text-sm font-semibold tabular-nums ${
                          item.stock_actuel <= (item.stock_minimum || 5)
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {item.stock_actuel}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center text-slate-500 tabular-nums">{item.stock_minimum || 5}</td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Number(item.rotation_index) || 0)}%`,
                              background: `linear-gradient(90deg, ${C.primary}, #3b82f6)`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 tabular-nums w-8">
                          {item.rotation_index}%
                        </span>
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
                          ? 'Optimal'
                          : item.stock_actuel > 0
                            ? 'Réappro.'
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

        <div className={`${panelClass} p-5 md:p-6`}>
          <h3 className="text-base font-bold text-[var(--text-main)] mb-1 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <TrendingUp size={18} className="text-cyan-400" />
            Indice de rotation par article
          </h3>
          <p className="text-xs text-slate-500 mb-6">Visualisation rapide (0–100 %)</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="nom"
                  tick={{ fill: C.textMuted, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: C.textMuted, fontSize: 11 }}
                  width={32}
                />
                <Tooltip {...chartTooltip} formatter={(v) => [`${v ?? 0}%`, 'Rotation']} />
                <Bar dataKey="rotation_index" fill={C.primary} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const subtitle = "Suivez l'efficacité opérationnelle de vos départements.";

  /** Vue Nexus : performance par tenant (boutiques), pas par livreur */
  const renderSuperAdminTenants = () => {
    const rows = tenantRows;
    const totalCmd = rows.reduce((a, r) => a + r.commandes, 0);
    const totalGmv = rows.reduce((a, r) => a + r.ca_gmv, 0);
    const withActivity = rows.filter((r) => r.commandes > 0).length;
    const totalSorties = rows.reduce((a, r) => a + r.sorties_terrain, 0);
    const avgSuccPlat =
      totalSorties > 0
        ? Math.round(
            rows.reduce((a, r) => a + r.success_rate * r.sorties_terrain, 0) / Math.max(1, totalSorties)
          )
        : 0;

    const chartData = [...rows]
      .filter((r) => r.ca_gmv > 0 || r.commandes > 0)
      .slice(0, 12)
      .map((r) => ({
        nom: r.nom.length > 16 ? `${r.nom.slice(0, 16)}…` : r.nom,
        ca: r.ca_gmv,
      }));

    const kpi = (icon: ReactNode, label: string, value: string | number, hint?: string) => (
      <div
        className="rounded-2xl border border-slate-600/30 p-4 sm:p-5 flex gap-4 items-start"
        style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)' }}
      >
        <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-300 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-0.5">{value}</p>
          {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
        </div>
      </div>
    );

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpi(<ShoppingCart size={20} />, 'Commandes (période)', totalCmd.toLocaleString('fr-FR'), 'Toutes boutiques')}
          {kpi(
            <Banknote size={20} />,
            'CA livré (GMV)',
            `${totalGmv.toLocaleString('fr-FR')} CFA`,
            'Commandes livrées / terminées'
          )}
          {kpi(<Building2 size={20} />, 'Boutiques actives', withActivity, `Sur ${rows.length} organisations`)}
          {kpi(<TrendingUp size={20} />, 'Taux livraison moy.', `${avgSuccPlat}%`, 'Pondéré par le terrain')}
        </div>

        <div className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[var(--text-main)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Détail par{' '}
              <span style={{ color: C.primary }}>boutique (tenant)</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Lightbulb size={16} className="text-amber-400/90 shrink-0" strokeWidth={2} />
              Classé par CA livré sur la période
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/[0.06] bg-white/[0.03]">
                  <th className="px-4 py-3 font-semibold">Boutique</th>
                  <th className="px-3 py-3 font-semibold">Plan</th>
                  <th className="px-3 py-3 font-semibold text-center">Compte</th>
                  <th className="px-3 py-3 font-semibold text-center">
                    <Users className="inline size-3.5 opacity-60 mr-1" />
                    Users
                  </th>
                  <th className="px-3 py-3 font-semibold text-center">Cmd</th>
                  <th className="px-3 py-3 font-semibold text-center" style={{ color: C.livres }}>
                    Livrées
                  </th>
                  <th className="px-3 py-3 font-semibold text-center">Terrain</th>
                  <th className="px-3 py-3 font-semibold text-center">Succès</th>
                  <th className="px-3 py-3 font-semibold text-center" style={{ color: C.annules }}>
                    Annul.
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">CA (GMV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {rows.map((r) => (
                  <tr key={r.tenant_id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{r.nom}</div>
                      <div className="text-[11px] text-cyan-400/80 font-medium mt-0.5">/{r.slug || '—'}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-300 font-medium">{r.plan}</td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          r.actif ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-600/40 text-slate-400'
                        }`}
                      >
                        {r.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums text-slate-200">{r.users_count}</td>
                    <td className="px-3 py-3 text-center tabular-nums text-slate-200">{r.commandes}</td>
                    <td className="px-3 py-3 text-center font-semibold tabular-nums" style={{ color: C.livres }}>
                      {r.livrees}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums text-slate-400">{r.sorties_terrain}</td>
                    <td className="px-3 py-3 text-center font-bold tabular-nums text-cyan-300">{r.success_rate}%</td>
                    <td className="px-3 py-3 text-center tabular-nums" style={{ color: C.annules }}>
                      {r.annules}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-100 tabular-nums">
                      {r.ca_gmv.toLocaleString('fr-FR')} <span className="text-slate-500 text-xs font-semibold">CFA</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <p className="p-10 text-center text-slate-500 text-sm">Aucune boutique enregistrée.</p>
          )}
        </div>

        {chartData.length > 0 && (
          <div className={`${panelClass} p-5 md:p-6`}>
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Top boutiques — CA livré (GMV)
            </h3>
            <p className="text-xs text-slate-500 mb-6">Jusqu&apos;à 12 organisations avec activité sur la période</p>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="nom"
                    width={120}
                    tick={{ fill: C.textMuted, fontSize: 11 }}
                    axisLine={false}
                  />
                  <Tooltip
                    {...chartTooltip}
                    formatter={(v) => [`${Number(v ?? 0).toLocaleString('fr-FR')} CFA`, 'CA']}
                  />
                  <Bar dataKey="ca" fill={C.primary} radius={[0, 6, 6, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabDefs: { id: TabType; label: string; sub: string; icon: typeof Truck }[] = [
    { id: 'logistique', label: 'Logistique', sub: 'Livraisons & retours', icon: Truck },
    { id: 'call-center', label: "Centre d'appel", sub: 'Efficacité & conversions', icon: PhoneCall },
    { id: 'inventaire', label: 'Inventaire', sub: 'Stocks & rotation', icon: Package },
  ];

  return (
    <div
      className="min-h-full w-full font-sans overflow-x-hidden selection:bg-cyan-500/20"
      style={{
        background: 'linear-gradient(180deg, var(--bg-app) 0%, #0a0f1a 50%, var(--bg-app) 100%)',
        color: 'var(--text-main)',
        colorScheme: 'dark',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 pb-16">
        <header className="flex flex-col gap-6 mb-10">
          <div className="max-w-2xl">
            <h1
              className="text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight mb-2"
              style={{
                fontFamily: 'Outfit, sans-serif',
                background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 45%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {isSuperAdmin ? 'Performance des boutiques' : 'Hub Performance Équipe'}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {isSuperAdmin
                ? 'Vue Nexus : volume, CA (GMV) et taux de livraison par organisation (tenant), sur la période choisie.'
                : subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {renderFilterButtons()}
            <div
              className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300 px-4 py-2.5 rounded-xl border border-slate-600/35 shrink-0"
              style={{ background: 'rgba(15, 23, 42, 0.65)' }}
            >
              <Clock size={16} className="shrink-0 text-cyan-400/90" strokeWidth={2} aria-hidden />
              <span className="font-medium tabular-nums text-slate-200">
                {new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          </div>
        </header>

        {isSuperAdmin ? null : (
          <nav className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10" aria-label="Départements">
            {tabDefs.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'group flex items-center gap-4 min-h-[88px] p-4 sm:p-5 rounded-2xl text-left border transition-all duration-300',
                    active
                      ? 'ring-1 ring-cyan-400/35 shadow-[0_12px_40px_-8px_rgba(6,182,212,0.25)]'
                      : 'hover:ring-1 hover:ring-white/10 hover:bg-slate-800/40',
                  ].join(' ')}
                  style={{
                    background: active
                      ? 'linear-gradient(145deg, rgba(6, 182, 212, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)'
                      : 'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.92) 100%)',
                    borderColor: active ? 'rgba(34, 211, 238, 0.45)' : 'rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <div
                    className={[
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors',
                      active
                        ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-500/35 bg-slate-800/90 text-cyan-300/95 group-hover:text-cyan-200',
                    ].join(' ')}
                  >
                    <Icon size={22} strokeWidth={2} className="text-inherit" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-bold text-base sm:text-[17px] leading-tight ${
                        active ? 'text-white' : 'text-slate-100'
                      }`}
                    >
                      {tab.label}
                    </div>
                    <div
                      className={`text-xs sm:text-[13px] mt-1 leading-snug ${
                        active ? 'text-cyan-100/75' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {tab.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        )}

        {loading ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-[12px] border border-white/[0.06]"
            style={{ background: 'var(--surface)' }}
          >
            <div className="w-11 h-11 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="mt-6 text-sm font-medium text-slate-500">Chargement…</p>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.35s ease' }}>
            {isSuperAdmin ? (
              renderSuperAdminTenants()
            ) : (
              <>
                {activeTab === 'logistique' && renderLogistics()}
                {activeTab === 'call-center' && renderCallCenter()}
                {activeTab === 'inventaire' && renderInventory()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
