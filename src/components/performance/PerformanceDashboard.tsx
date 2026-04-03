import { useState, useEffect, useMemo } from 'react';
import { loadPerformanceDashboardData } from '../../services/performanceService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Truck, PhoneCall, Package, TrendingUp, Clock, Lightbulb } from 'lucide-react';

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

  const fetchData = async () => {
    const effectiveTenantId = tenantId;
    if (!effectiveTenantId && !isSuperAdmin) return;

    setLoading(true);
    try {
      const loaded = await loadPerformanceDashboardData(effectiveTenantId, isSuperAdmin, filter);
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
      className="inline-flex flex-wrap gap-1 p-1 rounded-xl border border-white/[0.08]"
      style={{ background: 'var(--surface)' }}
    >
      {[
        { id: 'mois' as const, label: 'Ce mois' },
        { id: '7jours' as const, label: '7 jours' },
        { id: 'aujourdhui' as const, label: "Aujourd'hui" },
        { id: 'toujours' as const, label: 'Toujours' },
      ].map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setFilter(f.id)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
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

  const subtitle = isSuperAdmin
    ? "Suivez l'efficacité opérationnelle de tous les départements."
    : "Suivez l'efficacité opérationnelle de vos départements.";

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
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 pb-16">
        {/* En-tête type maquette */}
        <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
          <div className="max-w-xl">
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
              Hub Performance Équipe
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{subtitle}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4 shrink-0">
            {renderFilterButtons()}
            <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <Clock size={14} className="shrink-0 opacity-80" />
              {new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
        </header>

        {/* Cartes départements — horizontal, état actif bordure cyan */}
        <nav className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8" aria-label="Départements">
          {tabDefs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-4 p-5 rounded-[12px] text-left border transition-all duration-300 ${
                  active ? 'shadow-lg' : 'hover:border-white/12'
                }`}
                style={{
                  background: active ? C.primarySoft : 'var(--surface)',
                  borderColor: active ? 'rgba(6, 182, 212, 0.45)' : 'rgba(255,255,255,0.08)',
                  boxShadow: active ? '0 8px 32px rgba(6, 182, 212, 0.12)' : undefined,
                }}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    active ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300' : 'border-white/[0.06] bg-white/[0.04] text-slate-500'
                  }`}
                >
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div>
                  <div className={`font-bold text-[15px] ${active ? 'text-white' : 'text-slate-200'}`}>{tab.label}</div>
                  <div className="text-xs text-slate-500 mt-1 leading-snug">{tab.sub}</div>
                </div>
              </button>
            );
          })}
        </nav>

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
            {activeTab === 'logistique' && renderLogistics()}
            {activeTab === 'call-center' && renderCallCenter()}
            {activeTab === 'inventaire' && renderInventory()}
          </div>
        )}
      </div>
    </div>
  );
};
