import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  loadPerformanceDashboardData,
  loadSuperAdminTenantPerformance,
  type TenantPerfRow,
  type InventoryStaffPerfRow,
  type PlatformTimelinePoint,
} from '../../services/performanceService';
import { GomboModuleFrame } from '../layout/GomboModuleFrame';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Area,
  Line,
  Cell,
} from 'recharts';
import {
  Truck,
  PhoneCall,
  Package,
  TrendingUp,
  Lightbulb,
  Users,
  Sparkles,
  Activity,
  Medal,
  RefreshCw,
  Download,
  AlertCircle,
  ExternalLink,
  Zap,
  Rocket,
  PieChart as PieIcon,
  ShieldCheck,
  Search,
} from 'lucide-react';

type TabType = 'logistique' | 'call-center' | 'inventaire';
type FilterType = 'mois' | '7jours' | 'aujourdhui' | 'toujours';
type SuperAdminSortKey = 'ca_gmv' | 'commandes' | 'success_rate' | 'sorties_terrain';
type SuperAdminScope = 'all' | 'active_only' | 'with_orders';

/** Livraisons terrain : sous ce seuil de réussite avec volume significatif → priorité support / terrain */
const SA_LOGISTICS_RISK_THRESHOLD = 65;
const SA_MIN_SORTIES_FOR_RISK = 5;

function tenantLogisticsAtRisk(r: TenantPerfRow): boolean {
  return r.sorties_terrain >= SA_MIN_SORTIES_FOR_RISK && r.success_rate < SA_LOGISTICS_RISK_THRESHOLD;
}



interface PerformanceDashboardProps {
  tenantId?: string;
  isSuperAdmin?: boolean;
  /** Aligne la page sur Admin : GomboModuleFrame, onglets, cartes et tables */
  embeddedModuleChrome?: boolean;
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

const BTN_PRIMARY_INLINE: CSSProperties = {
  padding: '0 1.5rem',
  borderRadius: '12px',
  fontWeight: 800,
  fontSize: '0.85rem',
  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
};

function IntelligenceCard({ icon, label, value, insight, color, subValue }: { 
  icon: any, 
  label: string, 
  value: string | number, 
  insight: string, 
  color: string,
  subValue?: string 
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-slate-900/40 p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-slate-900/60 group">
      <div className="absolute -right-4 -top-4 size-24 rounded-full blur-[40px] opacity-20" style={{ backgroundColor: color }} />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-white group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          {subValue && (
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{subValue}</span>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 border border-white/[0.03]">
          <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color }} />
          <p className="text-[11px] leading-relaxed text-slate-400 font-medium">{insight}</p>
        </div>
      </div>
    </div>
  );
}

function escapeCsvCell(v: string) {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function downloadCsv(filename: string, headers: string[], lines: string[][]) {
  const bom = '\uFEFF';
  const body = [headers, ...lines].map((row) => row.map(escapeCsvCell).join(';')).join('\r\n');
  const blob = new Blob([bom + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

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

function PerfAdminTableCard({
  title,
  titleAccent,
  subtitle,
  hint,
  children,
}: {
  title: string;
  titleAccent?: string;
  subtitle: string;
  hint: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="card glass-effect"
      style={{
        padding: '2.5rem',
        border: '1px solid rgba(255,255,255,0.03)',
        borderRadius: '32px',
        marginBottom: '2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>
            {title}
            {titleAccent ? <span style={{ color: 'var(--primary)' }}> {titleAccent}</span> : null}
          </h3>
          <p
            style={{
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginTop: '0.35rem',
            }}
          >
            {subtitle}
          </p>
        </div>
        {hint}
      </div>
      <div
        className="table-container"
        style={{
          background: 'rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          overflowX: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const PerformanceDashboard = ({
  tenantId,
  isSuperAdmin,
  embeddedModuleChrome,
}: PerformanceDashboardProps) => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const tenantBase = tenantSlug ? `/${tenantSlug}` : '';

  const moduleChrome = Boolean(embeddedModuleChrome && !isSuperAdmin);
  const [activeTab, setActiveTab] = useState<TabType>('logistique');
  const [filter, setFilter] = useState<FilterType>('mois');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<any>({
    logistique: [],
    callCenter: [],
    inventaire: [],
    inventaireStaff: [],
  });
  const [tenantRows, setTenantRows] = useState<TenantPerfRow[]>([]);
  const [platformTimeline, setPlatformTimeline] = useState<PlatformTimelinePoint[]>([]);
  const [superAdminSort, setSuperAdminSort] = useState<SuperAdminSortKey>('ca_gmv');
  const [superAdminScope, setSuperAdminScope] = useState<SuperAdminScope>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const { rows, timeline } = await loadSuperAdminTenantPerformance(filter);
        setTenantRows(rows);
        setPlatformTimeline(timeline);
        return;
      }
      const effectiveTenantId = tenantId;
      if (!effectiveTenantId) {
        setLoading(false);
        return;
      }
      const loaded = await loadPerformanceDashboardData(effectiveTenantId, false, filter);
      setStats(loaded);
    } catch (err) {
      console.error('Hub Performance Error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filter, isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const panelClass =
    'rounded-2xl border border-white/[0.08] overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-sm)]';

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

  const inventoryStaffSorted = useMemo(() => {
    const data = (stats.inventaireStaff || []) as InventoryStaffPerfRow[];
    return [...data].sort((a, b) => (b.efficiency_score || 0) - (a.efficiency_score || 0));
  }, [stats.inventaireStaff]);

  const superAdminDisplayRows = useMemo(() => {
    if (!isSuperAdmin) return [];
    let r = [...tenantRows];
    if (superAdminScope === 'active_only') r = r.filter((x) => x.actif);
    if (superAdminScope === 'with_orders') r = r.filter((x) => x.commandes > 0);
    const key = superAdminSort;
    return r.sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));
  }, [isSuperAdmin, tenantRows, superAdminSort, superAdminScope]);

  const superAdminInsights = useMemo(() => {
    if (!isSuperAdmin || tenantRows.length === 0) {
      return {
        concentrationTop3: 0,
        panierMoyen: 0,
        tauxAnnulPlateforme: 0,
        atRiskCount: 0,
        dormantActiveCount: 0,
        atRiskTenants: [] as TenantPerfRow[],
      };
    }
    const rows = tenantRows;
    const totalGmv = rows.reduce((a, r) => a + r.ca_gmv, 0);
    const totalCmd = rows.reduce((a, r) => a + r.commandes, 0);
    const totalLiv = rows.reduce((a, r) => a + r.livrees, 0);
    const totalAnn = rows.reduce((a, r) => a + r.annules, 0);
    const sortedByCa = [...rows].sort((a, b) => b.ca_gmv - a.ca_gmv);
    const top3Gmv = sortedByCa.slice(0, 3).reduce((a, r) => a + r.ca_gmv, 0);
    const concentrationTop3 = totalGmv > 0 ? Math.round((top3Gmv / totalGmv) * 100) : 0;
    const panierMoyen = totalLiv > 0 ? Math.round(totalGmv / totalLiv) : 0;
    const tauxAnnulPlateforme = totalCmd > 0 ? Math.round((totalAnn / totalCmd) * 100) : 0;
    const atRiskTenants = rows.filter(tenantLogisticsAtRisk);
    const dormantActiveCount = rows.filter((r) => r.actif && r.commandes === 0).length;
    return {
      concentrationTop3,
      panierMoyen,
      tauxAnnulPlateforme,
      atRiskCount: atRiskTenants.length,
      dormantActiveCount,
      atRiskTenants,
    };
  }, [isSuperAdmin, tenantRows]);

  const totalGmv = useMemo(() => tenantRows.reduce((a, r) => a + r.ca_gmv, 0), [tenantRows]);
  const totalCmd = useMemo(() => tenantRows.reduce((a, r) => a + r.commandes, 0), [tenantRows]);
  const topTenant = useMemo(() => [...tenantRows].sort((a, b) => b.ca_gmv - a.ca_gmv)[0], [tenantRows]);
  const chartData = useMemo(() => [...tenantRows].sort((a, b) => b.ca_gmv - a.ca_gmv).slice(0, 5), [tenantRows]);

  const exportSuperAdminTenantsCsv = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    const rows = superAdminDisplayRows;
    const h = [
      'Rang',
      'Boutique',
      'Slug',
      'Plan',
      'Actif',
      'Utilisateurs',
      'Commandes',
      'Livrées',
      'Terrain',
      'Succès %',
      'Annul.',
      'Annul. % ligne',
      'CA GMV CFA',
    ];
    const lines = rows.map((r, i) => {
      const annulPct = r.commandes > 0 ? Math.round((r.annules / r.commandes) * 100) : 0;
      return [
        String(i + 1),
        r.nom,
        r.slug,
        r.plan,
        r.actif ? 'oui' : 'non',
        String(r.users_count),
        String(r.commandes),
        String(r.livrees),
        String(r.sorties_terrain),
        String(r.success_rate),
        String(r.annules),
        String(annulPct),
        String(r.ca_gmv),
      ];
    });
    downloadCsv(`performance-boutiques-${stamp}-${filter}.csv`, h, lines);
  }, [superAdminDisplayRows, filter]);

  const renderLogistics = () => {
    const data = logisticsSorted;

    const totalSorties = data.reduce((acc: number, s: any) => acc + (Number(s.sorties) || 0), 0);
    const totalReussies = data.reduce((acc: number, s: any) => acc + (Number(s.reussies) || 0), 0);
    const avgSuccess = totalSorties > 0 ? Math.round((totalReussies / totalSorties) * 100) : 0;
    const top = data[0];

    const logHint = (
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Lightbulb size={16} className="text-amber-400/90 shrink-0" strokeWidth={2} />
        {sortHint('logistique')}
      </div>
    );

    const logisticsTable = (
      <table
        className={
          moduleChrome ? 'table-responsive-cards w-full text-left text-sm' : 'w-full text-left text-sm min-w-[720px]'
        }
      >
        <thead>
          <tr
            className={
              moduleChrome
                ? ''
                : 'text-[10px] uppercase tracking-[0.08em] text-slate-500 border-b border-white/[0.06] bg-black/20'
            }
          >
            <th style={moduleChrome ? { padding: '1.5rem' } : undefined} className={moduleChrome ? '' : 'px-5 py-3.5 font-bold'}>
              Livreur
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'center' } : undefined}
              className={moduleChrome ? '' : 'px-3 py-3.5 font-bold text-center'}
            >
              Sorties
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'center', color: C.livres } : undefined}
              className={moduleChrome ? '' : 'px-3 py-3.5 font-bold text-center'}
            >
              Livrés
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'center', color: C.retours } : undefined}
              className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}
            >
              Retours
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'center', color: C.annules } : undefined}
              className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}
            >
              Annulés
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'center', color: C.reports } : undefined}
              className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}
            >
              Reportés
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'right' } : undefined}
              className={moduleChrome ? '' : 'px-5 py-3.5 font-semibold text-right'}
            >
              Gains livr.
            </th>
          </tr>
        </thead>
        <tbody className={moduleChrome ? 'divide-y divide-white/5' : 'divide-y divide-white/[0.05]'}>
          {data.map((s: any) => (
            <tr
              key={s.livreur_id}
              className="hover:bg-cyan-500/[0.04] transition-colors border-b border-white/[0.04]"
            >
              <td data-label="Livreur" style={moduleChrome ? { padding: '1.25rem 1.5rem' } : undefined} className={moduleChrome ? '' : 'px-5 py-4'}>
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
              <td
                data-label="Sorties"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center' } : undefined}
                className={moduleChrome ? '' : 'px-3 py-4 text-center font-medium text-slate-200 tabular-nums'}
              >
                {s.sorties}
              </td>
              <td
                data-label="Livrés"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center', color: C.livres } : undefined}
                className={moduleChrome ? '' : 'px-3 py-4 text-center font-semibold tabular-nums'}
              >
                {s.reussies}
              </td>
              <td
                data-label="Retours"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center', color: C.retours } : undefined}
                className={moduleChrome ? '' : 'px-3 py-4 text-center font-semibold tabular-nums'}
              >
                {s.retours}
              </td>
              <td
                data-label="Annulés"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center', color: C.annules } : undefined}
                className={moduleChrome ? '' : 'px-3 py-4 text-center font-semibold tabular-nums'}
              >
                {s.annules ?? 0}
              </td>
              <td
                data-label="Reportés"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center', color: C.reports } : undefined}
                className={moduleChrome ? '' : 'px-3 py-4 text-center font-semibold tabular-nums'}
              >
                {s.reportes ?? 0}
              </td>
              <td
                data-label="Gains livr."
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'right' } : undefined}
                className={moduleChrome ? '' : 'px-5 py-4 text-right font-bold text-slate-100 tabular-nums'}
              >
                {s.ca_frais != null ? Number(s.ca_frais).toLocaleString('fr-FR') : '—'}{' '}
                <span className="text-slate-500 text-xs font-semibold">CFA</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    const heroTop = top ? (
      <div
        className={
          moduleChrome
            ? 'card glass-effect relative overflow-hidden p-5 sm:p-6'
            : 'relative overflow-hidden rounded-2xl border border-cyan-500/30 p-5 sm:p-6'
        }
        style={
          moduleChrome
            ? { borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' }
            : {
                background:
                  'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.98) 50%, #0f172a 100%)',
                boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.1), 0 25px 50px -12px rgba(0,0,0,0.45)',
              }
        }
      >
        {!moduleChrome && <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden />}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/35 bg-amber-500/15 text-amber-200">
              <Medal size={24} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400/95">Top livreur · période</p>
              <p className="mt-1 text-xl font-bold text-white tracking-tight">{top.nom}</p>
              <p className="text-sm text-slate-400 mt-0.5">
                {top.success_rate}% réussite · {Number(top.sorties) || 0} sorties
              </p>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-xl bg-black/25 border border-white/5 px-4 py-3 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Livrés</p>
              <p className="text-lg font-bold tabular-nums mt-1" style={{ color: C.livres }}>
                {top.reussies}
              </p>
            </div>
            <div className="rounded-xl bg-black/25 border border-white/5 px-4 py-3 min-w-[120px]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Gains</p>
              <p className="text-lg font-bold text-white tabular-nums mt-1">
                {top.ca_frais != null ? Number(top.ca_frais).toLocaleString('fr-FR') : '—'}{' '}
                <span className="text-xs text-slate-500">CFA</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div className="space-y-6 lg:space-y-8">
        {heroTop}

        {moduleChrome ? (
          <PerfAdminTableCard
            title="Détail"
            titleAccent="logistique"
            subtitle="Livreurs · volumes et résultats"
            hint={logHint}
          >
            {logisticsTable}
            {data.length === 0 && (
              <p className="p-10 text-center text-slate-500 text-sm">Aucune donnée logistique pour cette période.</p>
            )}
          </PerfAdminTableCard>
        ) : (
          <div className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-cyan-950/25 to-transparent">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Détail <span style={{ color: C.primary }}>logistique</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Livreurs · volumes et résultats</p>
              </div>
              {logHint}
            </div>
            <div className="overflow-x-auto">{logisticsTable}</div>
            {data.length === 0 && (
              <p className="p-10 text-center text-slate-500 text-sm">Aucune donnée logistique pour cette période.</p>
            )}
          </div>
        )}

        <div
          className={
            moduleChrome
              ? 'card glass-effect p-5 md:p-6'
              : `${panelClass} p-5 md:p-6`
          }
          style={moduleChrome ? { borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' } : undefined}
        >
          <div className="mb-6">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Activity size={18} className="text-cyan-400" />
              Efficacité livraison
            </h3>
            <p className="text-xs text-slate-500">Taux de succès par livreur (0–100 %)</p>
          </div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="staffLogBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
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
                <Bar
                  dataKey="success_rate"
                  fill="url(#staffLogBarGrad)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  animationDuration={500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap justify-between items-center gap-3 text-sm">
            <span className="text-slate-500">Moyenne équipe (pondérée)</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 font-bold tabular-nums text-cyan-200">
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
    const top = data[0];

    const ccHint = (
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Lightbulb size={16} className="text-amber-400/90 shrink-0" strokeWidth={2} />
        {sortHint('call-center')}
      </div>
    );

    const callTable = (
      <table
        className={
          moduleChrome ? 'table-responsive-cards w-full text-left text-sm' : 'w-full text-left text-sm min-w-[640px]'
        }
      >
        <thead>
          <tr className={moduleChrome ? '' : 'text-[10px] uppercase tracking-[0.08em] text-slate-500 border-b border-white/[0.06] bg-black/20'}>
            <th style={moduleChrome ? { padding: '1.5rem' } : undefined} className={moduleChrome ? '' : 'px-5 py-3.5 font-bold'}>
              Agent
            </th>
            <th style={moduleChrome ? { padding: '1.5rem', textAlign: 'center' } : undefined} className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}>
              Dossiers
            </th>
            <th style={moduleChrome ? { padding: '1.5rem', textAlign: 'center' } : undefined} className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}>
              Validations
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'center', color: C.livres } : undefined}
              className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}
            >
              Livrées
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'right', color: C.primary } : undefined}
              className={moduleChrome ? '' : 'px-5 py-3.5 font-semibold text-right'}
            >
              Conversion
            </th>
          </tr>
        </thead>
        <tbody className={moduleChrome ? 'divide-y divide-white/5' : 'divide-y divide-white/[0.05]'}>
          {data.map((agent: any) => (
            <tr key={agent.agent_id} className="hover:bg-violet-500/[0.05] transition-colors border-b border-white/[0.04]">
              <td data-label="Agent" style={moduleChrome ? { padding: '1.25rem 1.5rem' } : undefined} className={moduleChrome ? '' : 'px-5 py-4'}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/20 flex items-center justify-center text-violet-100 font-bold text-sm shrink-0 border border-white/10">
                    {(agent.staff_name || 'A').charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-100">{agent.staff_name || 'Agent'}</span>
                </div>
              </td>
              <td
                data-label="Dossiers"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center' } : undefined}
                className={moduleChrome ? '' : 'px-3 py-4 text-center tabular-nums text-slate-200'}
              >
                {agent.total_handled}
              </td>
              <td
                data-label="Validations"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center' } : undefined}
                className={moduleChrome ? '' : 'px-3 py-4 text-center tabular-nums text-slate-300'}
              >
                {agent.total_validations}
              </td>
              <td
                data-label="Livrées"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center', color: C.livres } : undefined}
                className={moduleChrome ? '' : 'px-3 py-4 text-center font-semibold tabular-nums'}
              >
                {agent.total_delivered}
              </td>
              <td
                data-label="Conversion"
                style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'right', color: C.primary } : undefined}
                className={moduleChrome ? '' : 'px-5 py-4 text-right font-bold tabular-nums'}
              >
                {agent.success_rate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    const heroCc = top ? (
      <div
        className={
          moduleChrome
            ? 'card glass-effect relative overflow-hidden p-5 sm:p-6'
            : 'relative overflow-hidden rounded-2xl border border-violet-500/25 p-5 sm:p-6'
        }
        style={
          moduleChrome
            ? { borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' }
            : {
                background:
                  'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(15, 23, 42, 0.98) 45%, #0f172a 100%)',
                boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.12), 0 25px 50px -12px rgba(0,0,0,0.45)',
              }
        }
      >
        {!moduleChrome && <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl" aria-hidden />}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/35 bg-violet-500/20 text-violet-200">
              <Medal size={24} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300/95">Top agent · conversion</p>
              <p className="mt-1 text-xl font-bold text-white tracking-tight">{top.staff_name || 'Agent'}</p>
              <p className="text-sm text-slate-400 mt-0.5">
                {top.success_rate}% conversion · {top.total_handled} dossiers
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-black/25 border border-white/5 px-4 py-3 min-w-[110px]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Livrées</p>
              <p className="text-lg font-bold tabular-nums mt-1" style={{ color: C.livres }}>
                {top.total_delivered}
              </p>
            </div>
            <div className="rounded-xl bg-black/25 border border-white/5 px-4 py-3 min-w-[110px]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Validations</p>
              <p className="text-lg font-bold text-slate-100 tabular-nums mt-1">{top.total_validations}</p>
            </div>
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div className="space-y-6 lg:space-y-8">
        {heroCc}

        {moduleChrome ? (
          <PerfAdminTableCard
            title="Détail"
            titleAccent="centre d'appel"
            subtitle="Agents · dossiers et conversion"
            hint={ccHint}
          >
            {callTable}
            {data.length === 0 && (
              <p className="p-10 text-center text-slate-500 text-sm">Aucune donnée centre d&apos;appel.</p>
            )}
          </PerfAdminTableCard>
        ) : (
          <div className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-violet-950/30 to-transparent">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Détail <span style={{ color: C.primary }}>centre d&apos;appel</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Agents · dossiers et conversion</p>
              </div>
              {ccHint}
            </div>
            <div className="overflow-x-auto">{callTable}</div>
            {data.length === 0 && (
              <p className="p-10 text-center text-slate-500 text-sm">Aucune donnée centre d&apos;appel.</p>
            )}
          </div>
        )}

        <div
          className={
            moduleChrome
              ? 'card glass-effect p-5 md:p-6'
              : `${panelClass} p-5 md:p-6`
          }
          style={moduleChrome ? { borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' } : undefined}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <PhoneCall size={18} className="text-cyan-400" />
              Courbe de conversion
            </h3>
            <p className="text-xs text-slate-500">Taux de conversion par agent</p>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="barCallGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="55%" stopColor="#06b6d4" />
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

    if (moduleChrome) {
      const staffData = inventoryStaffSorted;
      const chartStaff = staffData.map((r) => ({
        nom: r.staff_name.length > 14 ? `${r.staff_name.slice(0, 14)}…` : r.staff_name,
        produits: r.produits_crees,
      }));
      const invStaffHint = (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Lightbulb size={16} className="text-amber-400/90 shrink-0" strokeWidth={2} />
          {sortHint('inventaire')}
        </div>
      );
      const staffTable = (
        <table className="table-responsive-cards w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">
            Créations de produits par membre du staff sur la période sélectionnée
          </caption>
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.08em] text-slate-500 border-b border-white/[0.06] bg-black/20">
              <th className="px-4 py-3.5 text-left font-bold">Staff</th>
              <th className="px-3 py-3.5 text-center font-semibold" style={{ color: C.primary }}>
                Produits créés
              </th>
              <th className="px-3 py-3.5 text-center font-semibold">Connexions</th>
              <th className="px-4 py-3.5 text-right font-semibold text-slate-300">Fréq. hebdo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {staffData.map((row) => (
              <tr key={row.staff_id} className="border-b border-white/[0.04] transition-colors hover:bg-cyan-500/[0.04]">
                <td data-label="Staff" className="px-4 py-3.5 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${C.primary} 0%, #6366f1 100%)`,
                        boxShadow: `0 4px 14px ${C.primarySoft}`,
                      }}
                    >
                      {row.staff_name?.charAt(0) ?? '?'}
                    </div>
                    <span className="font-semibold text-slate-100">{row.staff_name}</span>
                  </div>
                </td>
                <td
                  data-label="Produits créés"
                  className="px-3 py-3 text-center text-base font-bold tabular-nums text-white sm:py-4"
                >
                  {row.produits_crees}
                </td>
                <td
                  data-label="Connexions"
                  className="px-3 py-3 text-center tabular-nums text-slate-300 sm:py-4"
                >
                  {row.connexions}
                </td>
                <td
                  data-label="Fréq. hebdo"
                  className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-cyan-200/90 sm:py-4"
                >
                  {row.freq_hebdo_label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      return (
        <div className="space-y-6 lg:space-y-8">
          <PerfAdminTableCard
            title="Création"
            titleAccent="produits"
            subtitle="Collaborateurs · volume et fréquence"
            hint={invStaffHint}
          >
            {staffData.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-14 text-center">
                <Package className="mx-auto mb-4 text-cyan-400/40" size={40} strokeWidth={1.5} aria-hidden />
                <p className="m-0 text-base font-semibold text-slate-200">Aucune donnée sur cette période</p>
                <p className="mx-auto mt-2 mb-0 max-w-md text-sm text-slate-500">
                  Élargissez la fenêtre temporelle ou enregistrez des fiches depuis le module Produits.
                </p>
                {tenantBase ? (
                  <Link
                    to={`${tenantBase}/produits`}
                    className="btn btn-primary mt-6 inline-flex min-h-[48px] px-6 text-sm"
                  >
                    Ouvrir Produits
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">{staffTable}</div>
            )}
          </PerfAdminTableCard>

          {chartStaff.length > 0 ? (
            <div
              className="card glass-effect p-5 md:p-6"
              style={{ borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' }}
            >
              <div className="mb-5">
                <h3
                  className="m-0 flex items-center gap-2 text-base font-bold text-white"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  <TrendingUp size={18} className="shrink-0 text-cyan-400" />
                  Volume par collaborateur
                </h3>
                <p className="mt-1 text-xs text-slate-500">Créations de produits sur la période</p>
              </div>
              <div
                className="min-h-[240px]"
                style={{ height: Math.max(240, Math.min(520, chartStaff.length * 44)) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartStaff} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                    <defs>
                      <linearGradient id="staffInvEmbedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="nom"
                      tick={{ fill: C.textMuted, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={chartStaff.length > 4 ? -22 : 0}
                      textAnchor={chartStaff.length > 4 ? 'end' : 'middle'}
                      height={chartStaff.length > 4 ? 64 : 36}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: C.textMuted, fontSize: 11 }}
                      width={36}
                      allowDecimals={false}
                    />
                    <Tooltip {...chartTooltip} formatter={(v) => [`${v ?? 0}`, 'Produits créés']} />
                    <Bar
                      dataKey="produits"
                      fill="url(#staffInvEmbedGrad)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    const itemsAlert = data.filter((i: any) => i.stock_actuel <= (i.stock_minimum || 5)).length;
    const top = data[0];

    const invHint = (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-300 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
          {data.length} réf. · {itemsAlert} alerte(s)
        </span>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Lightbulb size={16} className="text-amber-400/90 shrink-0" strokeWidth={2} />
          {sortHint('inventaire')}
        </div>
      </div>
    );

    const invRows = data.map((item: any) => (
      <tr key={item.sku} className="hover:bg-emerald-500/[0.04] transition-colors border-b border-white/[0.04]">
        <td
          data-label="Produit"
          style={moduleChrome ? { padding: '1.25rem 1.5rem' } : undefined}
          className={moduleChrome ? '' : 'px-5 py-4'}
        >
          <div className="font-semibold text-slate-100">{item.nom}</div>
          <div className="text-[11px] font-medium mt-0.5" style={{ color: C.primary }}>
            SKU {item.sku}
          </div>
        </td>
        <td
          data-label="Stock"
          style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center' } : undefined}
          className={moduleChrome ? '' : 'px-3 py-4 text-center'}
        >
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
        <td
          data-label="Seuil"
          style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center' } : undefined}
          className={moduleChrome ? '' : 'px-3 py-4 text-center text-slate-500 tabular-nums'}
        >
          {item.stock_minimum || 5}
        </td>
        <td
          data-label="Rotation"
          style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'center' } : undefined}
          className={moduleChrome ? '' : 'px-3 py-4 text-center'}
        >
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
            <span className="text-xs font-semibold text-slate-300 tabular-nums w-8">{item.rotation_index}%</span>
          </div>
        </td>
        <td
          data-label="Statut"
          style={moduleChrome ? { padding: '1.25rem 1.5rem', textAlign: 'right' } : undefined}
          className={moduleChrome ? '' : 'px-5 py-4 text-right'}
        >
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
    ));

    const invTable = (
      <table
        className={
          moduleChrome ? 'table-responsive-cards w-full text-left text-sm' : 'w-full text-left text-sm min-w-[640px]'
        }
      >
        <thead>
          <tr className={moduleChrome ? '' : 'text-[10px] uppercase tracking-[0.08em] text-slate-500 border-b border-white/[0.06] bg-black/20'}>
            <th style={moduleChrome ? { padding: '1.5rem' } : undefined} className={moduleChrome ? '' : 'px-5 py-3.5 font-bold'}>
              Produit
            </th>
            <th style={moduleChrome ? { padding: '1.5rem', textAlign: 'center' } : undefined} className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}>
              Stock
            </th>
            <th style={moduleChrome ? { padding: '1.5rem', textAlign: 'center' } : undefined} className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}>
              Seuil
            </th>
            <th
              style={moduleChrome ? { padding: '1.5rem', textAlign: 'center', color: C.primary } : undefined}
              className={moduleChrome ? '' : 'px-3 py-3.5 font-semibold text-center'}
            >
              Rotation
            </th>
            <th style={moduleChrome ? { padding: '1.5rem', textAlign: 'right' } : undefined} className={moduleChrome ? '' : 'px-5 py-3.5 font-semibold text-right'}>
              Statut
            </th>
          </tr>
        </thead>
        <tbody className={moduleChrome ? 'divide-y divide-white/5' : 'divide-y divide-white/[0.05]'}>{invRows}</tbody>
      </table>
    );

    const heroInv = top ? (
      <div
        className={
          moduleChrome
            ? 'card glass-effect relative overflow-hidden p-5 sm:p-6'
            : 'relative overflow-hidden rounded-2xl border border-emerald-500/25 p-5 sm:p-6'
        }
        style={
          moduleChrome
            ? { borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' }
            : {
                background:
                  'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.98) 50%, #0f172a 100%)',
                boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.12), 0 25px 50px -12px rgba(0,0,0,0.45)',
              }
        }
      >
        {!moduleChrome && <div className="absolute -right-6 -bottom-10 h-36 w-36 rounded-full bg-emerald-500/12 blur-3xl" aria-hidden />}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-500/15 text-emerald-200">
              <Package size={24} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300/95">Article le plus dynamique</p>
              <p className="mt-1 text-xl font-bold text-white tracking-tight">{top.nom}</p>
              <p className="text-sm text-slate-400 mt-0.5">
                Rotation {top.rotation_index}% · SKU {top.sku}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-black/25 border border-white/5 px-4 py-3 min-w-[140px]">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Stock actuel</p>
            <p
              className={`text-2xl font-bold tabular-nums mt-1 ${
                top.stock_actuel <= (top.stock_minimum || 5) ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {top.stock_actuel}
            </p>
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div className="space-y-6 lg:space-y-8">
        {heroInv}

        {moduleChrome ? (
          <PerfAdminTableCard
            title="Détail"
            titleAccent="inventaire"
            subtitle="Stocks, seuils et rotation"
            hint={invHint}
          >
            {invTable}
            {data.length === 0 && (
              <p className="p-10 text-center text-slate-500 text-sm">Aucun produit suivi pour l&apos;inventaire.</p>
            )}
          </PerfAdminTableCard>
        ) : (
          <div className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-emerald-950/25 to-transparent">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Détail <span style={{ color: C.primary }}>inventaire</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Stocks, seuils et rotation</p>
              </div>
              {invHint}
            </div>
            <div className="overflow-x-auto">{invTable}</div>
            {data.length === 0 && (
              <p className="p-10 text-center text-slate-500 text-sm">Aucun produit suivi pour l&apos;inventaire.</p>
            )}
          </div>
        )}

        <div
          className={
            moduleChrome
              ? 'card glass-effect p-5 md:p-6'
              : `${panelClass} p-5 md:p-6`
          }
          style={moduleChrome ? { borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' } : undefined}
        >
          <div className="mb-5">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <TrendingUp size={18} className="text-cyan-400" />
              Rotation par article
            </h3>
            <p className="text-xs text-slate-500">Indice 0–100 % — repérez les références à fort flux</p>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="staffInvBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="nom"
                  tick={{ fill: C.textMuted, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                  height={72}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: C.textMuted, fontSize: 11 }}
                  width={32}
                />
                <Tooltip {...chartTooltip} formatter={(v) => [`${v ?? 0}%`, 'Rotation']} />
                <Bar
                  dataKey="rotation_index"
                  fill="url(#staffInvBarGrad)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  animationDuration={500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const tabDefs: {
    id: TabType;
    label: string;
    sub: string;
    icon: typeof Truck;
    color: string;
  }[] = [
    { id: 'logistique', label: 'Logistique', sub: 'Livraisons & retours', icon: Truck, color: '#06b6d4' },
    { id: 'call-center', label: "Centre d'appel", sub: 'Validations & relances', icon: PhoneCall, color: '#8b5cf6' },
    { id: 'inventaire', label: 'Inventaire', sub: 'Création de produits', icon: Package, color: '#10b981' },
  ];
  const periodFilterDefs: { id: FilterType; label: string; color: string }[] = [
    { id: 'mois', label: 'Ce mois', color: '#06b6d4' },
    { id: '7jours', label: '7 jours', color: '#0891b2' },
    { id: 'aujourdhui', label: "Aujourd'hui", color: '#3b82f6' },
    { id: 'toujours', label: 'Toujours', color: '#6366f1' },
  ];

  const subtitle = "Suivez l'efficacité opérationnelle de tous les départements.";

  if (isSuperAdmin && !moduleChrome) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* --- PERFORMANCE HEADER: HARMONIZED WITH TENANTS --- */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap', alignItems: 'center' }}>
           <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2.5 mb-2">
                 <div className="size-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                 <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">Platform Intelligence Engine</span>
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: 'Outfit' }}>
                Global <span className="text-slate-500">Growth Pulse</span>
              </h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                {periodFilterDefs.map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => setFilter(f.id)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button onClick={() => fetchData()} className="size-14 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] text-cyan-400 hover:bg-white/[0.08] transition-all">
                <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>
        </div>

        {/* --- HERO SECTION: PLATFORM PULSE --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8">
             <div 
               className="relative overflow-hidden rounded-[48px] border border-white/[0.08] bg-[#0c1222] p-10 lg:p-12 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]"
               style={{ 
                 background: 'radial-gradient(circle at 0% 0%, rgba(6,182,212,0.1) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(99,102,241,0.08) 0%, transparent 50%), #0c1222',
               }}
             >
                <div className="absolute -right-20 -top-20 size-80 bg-cyan-500/10 blur-[100px] animate-pulse" />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Total Transactions</p>
                    <p className="text-5xl font-black text-white tabular-nums tracking-tight" style={{ fontFamily: 'Outfit' }}>{totalCmd.toLocaleString('fr-FR')}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-bold">
                       <TrendingUp size={14} /> +12.5% <span className="text-slate-600 font-medium">vs last period</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Gross Turnover</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black text-white tabular-nums tracking-tight" style={{ fontFamily: 'Outfit' }}>{totalGmv.toLocaleString('fr-FR')}</p>
                      <span className="text-xs text-slate-500 font-black uppercase">CFA</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                       <Zap size={14} fill="currentColor" /> Premium Yield
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Merchant Base</p>
                    <p className="text-5xl font-black text-white tabular-nums tracking-tight" style={{ fontFamily: 'Outfit' }}>{tenantRows.filter(x => x.actif).length}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold italic">
                       Global Connectivity
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Efficacy Index</p>
                    <p className="text-5xl font-black text-emerald-400 tabular-nums tracking-tight" style={{ fontFamily: 'Outfit' }}>{100 - superAdminInsights.tauxAnnulPlateforme}%</p>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                       <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ width: `${100 - superAdminInsights.tauxAnnulPlateforme}%` }} />
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full mt-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={platformTimeline}>
                      <defs>
                        <linearGradient id="saAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} 
                        dy={15} 
                      />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                      <Tooltip {...chartTooltip} />
                      <Area 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="ca_gmv" 
                        name="Chiffre d'Affaire" 
                        stroke="#22d3ee" 
                        strokeWidth={4} 
                        fill="url(#saAreaGrad)" 
                        animationDuration={1500}
                      />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="commandes" 
                        name="Flux Commandes" 
                        stroke="#818cf8" 
                        strokeWidth={4} 
                        dot={{ r: 4, strokeWidth: 2, fill: '#0c1222' }} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={2000}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="xl:col-span-4 flex flex-col gap-8">
             {topTenant && (
                <div className="relative overflow-hidden rounded-[48px] border border-white/[0.08] bg-slate-900/40 p-10 flex-1 group hover:border-cyan-500/30 transition-all duration-500 shadow-2xl">
                   <div className="absolute -right-20 -top-20 size-64 bg-cyan-500/10 blur-[80px] group-hover:bg-cyan-500/20 transition-all duration-700" />
                   
                   <div className="relative flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="size-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <Rocket size={28} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Market Leader</p>
                            <h4 className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit' }}>{topTenant.nom}</h4>
                         </div>
                      </div>
                      <div className="size-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500 group-hover:text-white transition-colors cursor-pointer">
                         <ExternalLink size={20} />
                      </div>
                   </div>

                   <p className="text-sm text-slate-400 leading-relaxed mb-10 font-medium">
                      Cette boutique génère actuellement <span className="text-white font-black">{Math.round((topTenant.ca_gmv / totalGmv) * 100)}%</span> du volume total de la plateforme sur la période sélectionnée.
                   </p>

                   <div className="space-y-6">
                      <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/[0.06]">
                         <div className="flex justify-between items-end mb-3">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Turnover Performance</p>
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Target Reached</span>
                         </div>
                         <p className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit' }}>{topTenant.ca_gmv.toLocaleString('fr-FR')} <span className="text-xs text-slate-500 font-medium">CFA</span></p>
                      </div>
                      <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/[0.06]">
                         <div className="flex justify-between items-end mb-3">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency Index</p>
                            <span className="text-xs font-black text-emerald-400">{topTenant.success_rate}%</span>
                         </div>
                         <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ width: `${topTenant.success_rate}%` }} />
                         </div>
                      </div>
                   </div>
                </div>
             )}

             <div className="rounded-[48px] border border-white/[0.08] bg-slate-900/20 p-10 flex-shrink-0">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Revenue Distribution</h4>
                   <PieIcon size={18} className="text-slate-600" />
                </div>
                <div style={{ height: 220 }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: -30, right: 30 }}>
                         <XAxis type="number" hide />
                         <YAxis dataKey="nom" type="category" hide />
                         <Tooltip {...chartTooltip} />
                         <Bar dataKey="ca_gmv" radius={[0, 8, 8, 0]} barSize={10}>
                            {chartData.map((_entry, index) => (
                               <Cell key={`cell-${index}`} fill={index === 0 ? '#22d3ee' : index === 1 ? '#818cf8' : 'rgba(255,255,255,0.05)'} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>

        {/* --- INTELLIGENCE GRID: DEEP INSIGHTS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <IntelligenceCard 
              icon={<TrendingUp size={20} />}
              label="Growth Engine"
              value={`${totalGmv.toLocaleString('fr-FR')} CFA`}
              color="#22d3ee"
              insight={`Vitesse d'exécution optimale avec un panier moyen de ${superAdminInsights.panierMoyen.toLocaleString('fr-FR')} CFA.`}
              subValue="Revenue Matrix"
            />
            <IntelligenceCard 
              icon={<ShieldCheck size={20} />}
              label="Network Integrity"
              value={`${100 - superAdminInsights.tauxAnnulPlateforme}%`}
              color="#10b981"
              insight="Faible taux d'attrition opérationnelle. La plateforme maintient ses KPIs de livraison."
              subValue="Health State"
            />
            <IntelligenceCard 
              icon={<AlertCircle size={20} />}
              label="Risk Assessment"
              value={`${superAdminInsights.atRiskCount}`}
              color="#fbbf24"
              insight={`${superAdminInsights.atRiskCount} boutiques nécessitent un audit logistique prioritaire.`}
              subValue="Priority Focus"
            />
            <IntelligenceCard 
              icon={<Users size={20} />}
              label="Merchant Churn"
              value={`${superAdminInsights.dormantActiveCount}`}
              color="#f43f5e"
              insight={`${superAdminInsights.dormantActiveCount} partenaires n'exploitent pas encore leur infrastructure.`}
              subValue="Retention Logic"
            />
        </div>

        {/* --- DATA MATRIX: DETAILED MERCHANT ANALYTICS --- */}
        <div className="relative overflow-hidden rounded-[48px] border border-white/[0.08] bg-[#0c1222] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
           
           <div className="flex flex-col md:flex-row md:items-center justify-between p-10 lg:p-12 gap-8 border-b border-white/[0.05]">
              <div>
                 <h4 className="text-3xl font-black text-white tracking-tight mb-2" style={{ fontFamily: 'Outfit' }}>Merchant Command <span className="text-slate-500 ml-1">Matrix</span></h4>
                 <p className="text-sm font-medium text-slate-500">Analytics granulaire par partenaire contractuel</p>
              </div>
              <div className="flex items-center gap-4 bg-white/[0.03] p-2.5 rounded-[24px] border border-white/[0.06]">
                 <button onClick={() => setSuperAdminScope('all')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${superAdminScope === 'all' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'}`}>Toutes</button>
                 <button onClick={() => setSuperAdminScope('active_only')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${superAdminScope === 'active_only' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'}`}>Actives</button>
                 <button 
                  onClick={exportSuperAdminTenantsCsv}
                  className="size-12 flex items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
                 >
                    <Download size={22} />
                 </button>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                 <thead>
                    <tr className="bg-white/[0.01]">
                       <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] border-b border-white/[0.05]">Partner Infrastructure</th>
                       <th className="px-8 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] border-b border-white/[0.05] cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setSuperAdminSort('ca_gmv')}>Turnover {superAdminSort === 'ca_gmv' && '▼'}</th>
                       <th className="px-8 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] border-b border-white/[0.05] cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setSuperAdminSort('commandes')}>Orders {superAdminSort === 'commandes' && '▼'}</th>
                       <th className="px-8 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] border-b border-white/[0.05] cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setSuperAdminSort('success_rate')}>Efficiency {superAdminSort === 'success_rate' && '▼'}</th>
                       <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] border-b border-white/[0.05]">Account Tier</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/[0.03]">
                    {superAdminDisplayRows.map((r) => (
                       <tr key={r.slug} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-12 py-10">
                             <div className="flex items-center gap-6">
                                <div className="size-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all duration-300">
                                   {r.nom.charAt(0)}
                                </div>
                                <div>
                                   <div className="flex items-center gap-2.5 mb-1.5">
                                      <p className="text-lg font-black text-white" style={{ fontFamily: 'Outfit' }}>{r.nom}</p>
                                      {r.actif ? (
                                         <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                      ) : (
                                         <div className="size-2 rounded-full bg-slate-700" />
                                      )}
                                   </div>
                                   <p className="text-[11px] font-bold text-slate-500 font-mono tracking-tight uppercase">{r.slug}.gomboswiftci.app</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-10">
                             <div>
                                <p className="text-xl font-black text-white tabular-nums tracking-tight" style={{ fontFamily: 'Outfit' }}>{r.ca_gmv.toLocaleString('fr-FR')} <span className="text-[10px] text-slate-500 ml-1 font-medium">CFA</span></p>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1.5">Gross Merchandise Vol.</p>
                             </div>
                          </td>
                          <td className="px-8 py-10">
                             <div>
                                <p className="text-xl font-black text-slate-300 tabular-nums tracking-tight" style={{ fontFamily: 'Outfit' }}>{r.commandes.toLocaleString('fr-FR')}</p>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1.5">Processed Units</p>
                             </div>
                          </td>
                          <td className="px-8 py-10">
                             <div className="flex items-center gap-5">
                                <div className="flex-1 w-40 h-2 rounded-full bg-white/[0.03] overflow-hidden border border-white/5">
                                   <div 
                                      className={`h-full rounded-full transition-all duration-1000 ${Number(r.success_rate) > 85 ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : Number(r.success_rate) > 65 ? 'bg-cyan-500 shadow-[0_0_12px_#06b6d4]' : 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'}`} 
                                      style={{ width: `${r.success_rate}%` }} 
                                   />
                                </div>
                                <span className={`text-sm font-black tabular-nums ${Number(r.success_rate) > 85 ? 'text-emerald-400' : 'text-slate-400'}`}>{r.success_rate}%</span>
                             </div>
                          </td>
                          <td className="px-10 py-10">
                             <div className={`inline-flex px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                r.plan === 'ENTERPRISE' ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' :
                                r.plan === 'PREMIUM' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                                'bg-slate-500/10 border-slate-500/20 text-slate-500'
                             }`}>
                                {r.plan}
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           {superAdminDisplayRows.length === 0 && (
              <div className="p-24 text-center">
                 <Search size={64} className="text-slate-800 mx-auto mb-8" />
                 <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">No partners found for current scope</p>
              </div>
           )}
        </div>
      </div>
    );
  }

  if (moduleChrome) {
    return (
      <GomboModuleFrame
        badge="Performance Intelligence"
        title="Performance équipe"
        description={subtitle}
        actions={
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => fetchData()} 
              disabled={loading} 
              className="btn btn-primary flex items-center gap-2"
              style={{ ...BTN_PRIMARY_INLINE, height: '42px' }}
            >
               <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
               <span>Actualiser</span>
            </button>
          </div>
        }
      >
        <div className="py-2">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/[0.05] bg-slate-900/20">
               <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
               <p className="mt-4 text-xs font-medium text-slate-500">Mise à jour...</p>
             </div>
           ) : (
             <div style={{ animation: 'fadeIn 0.35s ease' }}>
                <nav className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/[0.05]">
                  {tabDefs.map((tab) => {
                    const active = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          active ? 'bg-white/[0.05] text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
                {activeTab === 'logistique' && renderLogistics()}
                {activeTab === 'call-center' && renderCallCenter()}
                {activeTab === 'inventaire' && renderInventory()}
             </div>
           )}
        </div>
      </GomboModuleFrame>
    );
  }

  return (
    <div
      className="min-h-full w-full font-sans overflow-x-hidden selection:bg-cyan-500/20"
      style={{
        background: 'linear-gradient(180deg, var(--bg-app) 0%, #0a0f1a 50%, var(--bg-app) 100%)',
        color: 'var(--text-main)',
        colorScheme: 'dark',
      }}
    >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-16">
          <header className="relative mb-10 lg:mb-12 overflow-hidden rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-[#0c1222] via-[#0a0f1a] to-[#060911] px-8 py-10 shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-cyan-500/10 blur-[100px]" aria-hidden />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-violet-600/10 blur-[80px]" aria-hidden />

            <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-6">
                <div className="relative shrink-0 flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl">
                   <Activity size={32} className="text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 border border-cyan-500/20">
                      <Zap size={12} strokeWidth={2.5} />
                      Performance Intelligence
                    </span>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-1" style={{ fontFamily: 'Outfit' }}>
                    Gombo · <span className="text-slate-500 text-2xl lg:text-3xl">Hub équipe terrain</span>
                  </h1>
                  <p className="max-w-xl text-sm font-medium text-slate-400">
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                  {periodFilterDefs.map(f => (
                    <button 
                      key={f.id} 
                      onClick={() => setFilter(f.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => fetchData()} className="size-12 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] text-cyan-400 hover:bg-white/[0.08] transition-all">
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </header>

          <nav className="mb-10 lg:mb-14 overflow-hidden rounded-[32px] border border-white/[0.08] bg-slate-900/40 p-1.5 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-1">
              {tabDefs.map((tab) => {
                const active = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex flex-1 items-center justify-center gap-4 px-6 py-4 rounded-[24px] transition-all duration-300 ${
                      active 
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_10px_30px_rgba(6,182,212,0.25)]' 
                        : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-all ${active ? 'bg-white/20' : 'bg-slate-800/50 group-hover:bg-slate-800'}`}>
                      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-400'}`}>{tab.label}</p>
                      <p className={`text-[10px] font-medium leading-none mt-1 ${active ? 'text-white/70' : 'text-slate-600'}`}>{tab.sub}</p>
                    </div>
                    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full" />}
                  </button>
                );
              })}
            </div>
          </nav>

          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 sm:py-28 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-slate-900/40 to-transparent">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-cyan-500/25 border-t-cyan-400 rounded-full animate-spin" />
                  <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" aria-hidden />
                </div>
                <p className="mt-6 text-sm font-medium text-slate-400">Chargement des indicateurs…</p>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.35s ease' }}>
                {activeTab === 'logistique' && renderLogistics()}
                {activeTab === 'call-center' && renderCallCenter()}
                {activeTab === 'inventaire' && renderInventory()}
              </div>
            )}
          </>
        </div>
    </div>
  );
};
