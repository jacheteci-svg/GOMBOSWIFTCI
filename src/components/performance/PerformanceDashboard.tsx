import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useId,
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
import { NexusModuleFrame } from '../layout/NexusModuleFrame';
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Truck,
  PhoneCall,
  Package,
  TrendingUp,
  Clock,
  Lightbulb,
  Users,
  Banknote,
  Sparkles,
  LayoutDashboard,
  ArrowUpRight,
  Activity,
  Target,
  Medal,
  RefreshCw,
  Download,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Store,
  Percent,
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

const SUPER_ADMIN_SORT_DEFS: { id: SuperAdminSortKey; label: string; color: string }[] = [
  { id: 'ca_gmv', label: 'CA (GMV)', color: '#06b6d4' },
  { id: 'commandes', label: 'Commandes', color: '#3b82f6' },
  { id: 'success_rate', label: 'Taux succès', color: '#10b981' },
  { id: 'sorties_terrain', label: 'Missions terrain', color: '#a78bfa' },
];

const SUPER_ADMIN_SCOPE_DEFS: { id: SuperAdminScope; label: string; hint: string }[] = [
  { id: 'all', label: 'Toutes', hint: 'Catalogue complet' },
  { id: 'active_only', label: 'Comptes actifs', hint: 'Abonnement / compte actif' },
  { id: 'with_orders', label: 'Avec activité', hint: 'Au moins une commande sur la période' },
];

interface PerformanceDashboardProps {
  tenantId?: string;
  isSuperAdmin?: boolean;
  /** Aligne la page sur Admin : NexusModuleFrame, onglets, cartes et tables */
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

/** Aligné sur Commandes.tsx : conteneur de pastilles */
const NEXUS_TAB_BAR_WRAP: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  padding: '0.4rem',
  background: 'rgba(255,255,255,0.02)',
  borderRadius: '18px',
  border: '1px solid rgba(255,255,255,0.05)',
  height: 'fit-content',
  backdropFilter: 'blur(10px)',
  flexWrap: 'wrap',
};

function nexusPillButtonStyle(active: boolean, color: string): CSSProperties {
  return {
    padding: '0.8rem 1.5rem',
    borderRadius: '14px',
    fontSize: '0.85rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    background: active ? color : 'transparent',
    color: active ? 'white' : 'var(--text-muted)',
    boxShadow: active ? `0 10px 20px ${color}44` : 'none',
  };
}

const BTN_PRIMARY_INLINE: CSSProperties = {
  height: '64px',
  padding: '0 2.5rem',
  borderRadius: '20px',
  fontWeight: 950,
  fontSize: '1.1rem',
  boxShadow: '0 20px 40px -10px rgba(6, 182, 212, 0.4)',
  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const BTN_OUTLINE_INLINE: CSSProperties = {
  height: '64px',
  padding: '0 2rem',
  borderRadius: '20px',
  fontWeight: 800,
  fontSize: '0.95rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
};

function NexusTableSkeleton({ rows = 5, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4 sm:p-5" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 animate-pulse"
        >
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.08]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded bg-white/[0.08] sm:w-48" />
            <div className="h-3 w-24 rounded bg-white/[0.05]" />
          </div>
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-8 w-12 rounded-lg bg-white/[0.08] sm:w-14" />
          ))}
        </div>
      ))}
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

function StaffKpiCard({
  accent,
  icon,
  label,
  value,
  sub,
  layout = 'card',
}: {
  accent: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub: string;
  /** `strip` : ligne compacte (bandeau), idéal pour plusieurs blocs sur une rangée */
  layout?: 'card' | 'strip';
}) {
  const ring =
    accent === 'cyan'
      ? 'from-cyan-500/25 to-transparent'
      : accent === 'emerald'
        ? 'from-emerald-500/20 to-transparent'
        : accent === 'violet'
          ? 'from-violet-500/20 to-transparent'
          : accent === 'amber'
            ? 'from-amber-500/20 to-transparent'
            : 'from-rose-500/18 to-transparent';

  if (layout === 'strip') {
    return (
      <div className="group relative min-h-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/50 p-3 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:border-cyan-500/30 sm:p-3.5">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ring} opacity-70`} aria-hidden />
        <div className="relative flex min-w-0 flex-row items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 text-cyan-300 shadow-inner">
            {icon}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-white tabular-nums sm:text-xl">
              {value}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{sub}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] p-4 sm:p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:border-cyan-500/25">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ring} opacity-80`} aria-hidden />
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-cyan-300 shadow-inner">
            {icon}
          </div>
          <ArrowUpRight
            size={16}
            className="text-slate-600 opacity-0 transition-opacity group-hover:opacity-100"
            strokeWidth={2}
          />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-white tabular-nums leading-none">
            {value}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">{sub}</p>
        </div>
      </div>
    </div>
  );
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<Date | null>(null);
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
  /** Id unique pour le dégradé du graphique temporel (évite collisions SVG) */
  const superAdminLineGradId = useId().replace(/:/g, '');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (isSuperAdmin) {
        const { rows, timeline } = await loadSuperAdminTenantPerformance(filter);
        setTenantRows(rows);
        setPlatformTimeline(timeline);
        setDataUpdatedAt(new Date());
        return;
      }
      const effectiveTenantId = tenantId;
      if (!effectiveTenantId) {
        setLoading(false);
        return;
      }
      const loaded = await loadPerformanceDashboardData(effectiveTenantId, false, filter);
      setStats(loaded);
      setDataUpdatedAt(new Date());
    } catch (err) {
      console.error('Hub Performance Error:', err);
      setLoadError(
        err instanceof Error ? err.message : 'Impossible de charger les indicateurs. Réessayez dans un instant.'
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId, filter, isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const exportHubTableCsv = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (activeTab === 'logistique') {
      const rows = logisticsSorted;
      const h = [
        'Livreur',
        'Sorties',
        'Livrés',
        'Retours',
        'Annulés',
        'Reports',
        'Réussite %',
        'Gains CFA',
      ];
      const lines = rows.map((s: any) => [
        String(s.nom ?? ''),
        String(s.sorties ?? ''),
        String(s.reussies ?? ''),
        String(s.retours ?? ''),
        String(s.annules ?? ''),
        String(s.reportes ?? ''),
        String(s.success_rate ?? ''),
        String(s.ca_frais ?? ''),
      ]);
      downloadCsv(`performance-logistique-${stamp}.csv`, h, lines);
      return;
    }
    if (activeTab === 'call-center') {
      const rows = callCenterSorted;
      const h = [
        'Agent',
        'Traitées',
        'Validées',
        'Livrées',
        'Retours',
        'Échecs',
        'Reprog.',
        'Annulées',
        'Connex.',
        'Conversion %',
      ];
      const lines = rows.map((a: any) => [
        String(a.staff_name ?? ''),
        String(a.total_handled ?? ''),
        String(a.total_validations ?? ''),
        String(a.total_delivered ?? ''),
        String(a.retours ?? ''),
        String(a.echouees ?? ''),
        String(a.reprogrammes ?? ''),
        String(a.annulees ?? ''),
        String(a.connexions ?? ''),
        String(a.success_rate ?? ''),
      ]);
      downloadCsv(`performance-centre-appel-${stamp}.csv`, h, lines);
      return;
    }
    const rows = inventoryStaffSorted;
    const h = ['Staff', 'Produits créés', 'Connexions', 'Fréquence hebdo'];
    const lines = rows.map((r) => [
      r.staff_name,
      String(r.produits_crees),
      String(r.connexions),
      r.freq_hebdo_label,
    ]);
    downloadCsv(`performance-inventaire-staff-${stamp}.csv`, h, lines);
  }, [activeTab, logisticsSorted, callCenterSorted, inventoryStaffSorted]);

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

  const staffKpiBundle = useMemo(() => {
    if (isSuperAdmin) return null;
    const log = logisticsSorted;
    const cc = callCenterSorted;
    const inv = inventorySorted;

    const logSorties = log.reduce((a, s: any) => a + (Number(s.sorties) || 0), 0);
    const logReuss = log.reduce((a, s: any) => a + (Number(s.reussies) || 0), 0);
    const logAvg = logSorties > 0 ? Math.round((logReuss / logSorties) * 100) : 0;
    const logCa = log.reduce((a, s: any) => a + (Number(s.ca_frais) || 0), 0);

    const ccTh = cc.reduce((a, s: any) => a + (Number(s.total_handled) || 0), 0);
    const ccTd = cc.reduce((a, s: any) => a + (Number(s.total_delivered) || 0), 0);
    const ccVal = cc.reduce((a, s: any) => a + (Number(s.total_validations) || 0), 0);
    const ccAvg = ccTh > 0 ? Math.round((ccTd / ccTh) * 100) : 0;

    const invN = inv.length;
    const invAlert = inv.filter((i: any) => i.stock_actuel <= (i.stock_minimum || 5)).length;
    const invRotAvg =
      invN > 0
        ? Math.round(inv.reduce((a, i: any) => a + (Number(i.rotation_index) || 0), 0) / invN)
        : 0;
    const invCrit = inv.filter((i: any) => (Number(i.stock_actuel) || 0) <= 0).length;

    const staffInv = inventoryStaffSorted;
    const staffTotalP = staffInv.reduce((a, r) => a + r.produits_crees, 0);
    const staffContributors = staffInv.filter((r) => r.produits_crees > 0).length;
    const staffAvgPer = staffInv.length > 0 ? (staffTotalP / staffInv.length).toFixed(1) : '0';
    const staffTop = staffInv[0];

    const inventaireKpisEmbedded = [
      {
        key: 'tot',
        label: 'Produits créés',
        value: staffTotalP.toLocaleString('fr-FR'),
        sub: 'Total sur la période',
        accent: 'cyan' as const,
        Icon: Package,
      },
      {
        key: 'contrib',
        label: 'Contributeurs',
        value: String(staffContributors),
        sub: 'Avec au moins une création',
        accent: 'emerald' as const,
        Icon: Users,
      },
      {
        key: 'avg',
        label: 'Moy. / collaborateur',
        value: staffAvgPer,
        sub: 'Moyenne arithmétique',
        accent: 'violet' as const,
        Icon: TrendingUp,
      },
      {
        key: 'top',
        label: 'Meilleur volume',
        value: staffTop ? String(staffTop.produits_crees) : '—',
        sub: staffTop
          ? staffTop.staff_name.length > 28
            ? `${staffTop.staff_name.slice(0, 28)}…`
            : staffTop.staff_name
          : '—',
        accent: 'amber' as const,
        Icon: Medal,
      },
    ];

    const inventaireKpisFull = [
      {
        key: 'refs',
        label: 'Références',
        value: invN.toLocaleString('fr-FR'),
        sub: 'Articles suivis',
        accent: 'cyan' as const,
        Icon: Package,
      },
      {
        key: 'alert',
        label: 'Alertes stock',
        value: invAlert.toLocaleString('fr-FR'),
        sub: 'Sous le seuil minimum',
        accent: 'amber' as const,
        Icon: Lightbulb,
      },
      {
        key: 'rot',
        label: 'Rotation moy.',
        value: (
          <span>
            {invRotAvg}
            <span className="text-cyan-400/90">%</span>
          </span>
        ),
        sub: 'Indice moyen sur le catalogue',
        accent: 'violet' as const,
        Icon: TrendingUp,
      },
      {
        key: 'rupt',
        label: 'Ruptures',
        value: invCrit.toLocaleString('fr-FR'),
        sub: 'Stock à zéro',
        accent: 'rose' as const,
        Icon: Target,
      },
    ];

    return {
      logistique: [
        {
          key: 'sorties',
          label: 'Sorties',
          value: logSorties.toLocaleString('fr-FR'),
          sub: 'Missions sur la période',
          accent: 'cyan' as const,
          Icon: Truck,
        },
        {
          key: 'livrés',
          label: 'Livrés',
          value: logReuss.toLocaleString('fr-FR'),
          sub: 'Colis délivrés avec succès',
          accent: 'emerald' as const,
          Icon: Target,
        },
        {
          key: 'taux',
          label: 'Taux succès',
          value: (
            <span>
              {logAvg}
              <span className="text-cyan-400/90">%</span>
            </span>
          ),
          sub: 'Moyenne équipe (pondérée)',
          accent: 'violet' as const,
          Icon: TrendingUp,
        },
        {
          key: 'ca',
          label: 'Gains livreurs',
          value: (
            <span className="text-[1.15rem] sm:text-2xl">
              {logCa.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-semibold text-slate-400">CFA</span>
            </span>
          ),
          sub: 'CA frais sur livraisons',
          accent: 'amber' as const,
          Icon: Banknote,
        },
      ],
      'call-center': [
        {
          key: 'dossiers',
          label: 'Dossiers',
          value: ccTh.toLocaleString('fr-FR'),
          sub: 'Traités par les agents',
          accent: 'cyan' as const,
          Icon: PhoneCall,
        },
        {
          key: 'valid',
          label: 'Validations',
          value: ccVal.toLocaleString('fr-FR'),
          sub: 'Validations enregistrées',
          accent: 'violet' as const,
          Icon: Activity,
        },
        {
          key: 'livr',
          label: 'Livrées',
          value: ccTd.toLocaleString('fr-FR'),
          sub: 'Commandes finalisées',
          accent: 'emerald' as const,
          Icon: Package,
        },
        {
          key: 'conv',
          label: 'Conversion',
          value: (
            <span>
              {ccAvg}
              <span className="text-cyan-400/90">%</span>
            </span>
          ),
          sub: 'Moyenne centre d’appel',
          accent: 'amber' as const,
          Icon: TrendingUp,
        },
      ],
      inventaire: moduleChrome ? inventaireKpisEmbedded : inventaireKpisFull,
    };
  }, [isSuperAdmin, moduleChrome, logisticsSorted, callCenterSorted, inventorySorted, inventoryStaffSorted]);

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

  const subtitle = "Suivez l'efficacité opérationnelle de tous les départements.";

  /** Vue Nexus — refonte UI : bento KPI, tableau dense, graphique GMV (couleurs natives) */
  const renderSuperAdminTenants = () => {
    const PIE_PX = 220;
    const LINE_PX = 280;
    const rowsAll = tenantRows;
    const rows = superAdminDisplayRows;
    const ins = superAdminInsights;
    const totalCmd = rowsAll.reduce((a, r) => a + r.commandes, 0);
    const totalGmv = rowsAll.reduce((a, r) => a + r.ca_gmv, 0);
    const withActivity = rowsAll.filter((r) => r.commandes > 0).length;
    const inactiveTenants = rowsAll.filter((r) => !r.actif).length;
    const totalSorties = rowsAll.reduce((a, r) => a + r.sorties_terrain, 0);
    const avgSuccPlat =
      totalSorties > 0
        ? Math.round(
            rowsAll.reduce((a, r) => a + r.success_rate * r.sorties_terrain, 0) / Math.max(1, totalSorties)
          )
        : 0;

    const chartData = [...rowsAll]
      .filter((r) => r.ca_gmv > 0 || r.commandes > 0)
      .sort((a, b) => b.ca_gmv - a.ca_gmv)
      .slice(0, 12)
      .map((r) => ({
        nom: r.nom.length > 18 ? `${r.nom.slice(0, 18)}…` : r.nom,
        ca: r.ca_gmv,
      }));

    const topTenant = rowsAll[0];
    const tl = platformTimeline;

    const sansCmdBoutiques = Math.max(0, rowsAll.length - withActivity);
    /** Évite un camembert vide (0+0) côté Recharts ; si aucune boutique en base, segment gris explicite */
    const boutiquePieData =
      rowsAll.length === 0
        ? [{ name: 'Aucune boutique enregistrée', value: 1, color: '#334155' }]
        : [
            { name: 'Avec commandes', value: withActivity, color: '#22d3ee' },
            { name: 'Sans commande', value: sansCmdBoutiques, color: '#475569' },
          ];
    const concTop3Clamped = Math.min(100, Math.max(0, ins.concentrationTop3));
    const concPieData = [
      { name: 'Top 3 CA', value: concTop3Clamped, color: '#06b6d4' },
      { name: 'Autres boutiques', value: Math.max(0, 100 - concTop3Clamped), color: '#1e293b' },
    ];

      return (
      <div className="space-y-8 lg:space-y-10">
        <div
          className="perf-super-synth-root relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-900/70 via-slate-950/80 to-[#05080f] p-4 sm:p-6 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(6,182,212,0.18)] ring-1 ring-cyan-400/15"
          role="region"
          aria-label="Synthèse plateforme"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl"
            aria-hidden
          />
          <div className="relative mb-4 flex flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-slate-900/80 text-cyan-300 shadow-inner">
                <Target size={20} strokeWidth={2} aria-hidden />
            </div>
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Synthèse plateforme</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  KPI, camemberts et courbe temporelle — toujours visibles pour la période choisie
                </p>
            </div>
          </div>
              <div className="perf-super-badge-row flex-shrink-0 sm:justify-end">
                {ins.atRiskCount > 0 ? (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100"
                    title={`≥${SA_MIN_SORTIES_FOR_RISK} missions terrain et succès <${SA_LOGISTICS_RISK_THRESHOLD}%`}
                  >
                    <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                    Livraison · {ins.atRiskCount}
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200/95">
                    Livraison OK
                  </span>
                )}
                {ins.dormantActiveCount > 0 ? (
                  <span
                    className="inline-flex shrink-0 items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200"
                    title="Comptes actifs sans commande sur la période"
                  >
                    Relance · {ins.dormantActiveCount}
                  </span>
                ) : null}
        </div>
            </div>

            <div className="relative z-10 space-y-5">
            <div className="perf-super-kpi-grid">
              <div className="perf-super-kpi-card">
                <div className="perf-super-kpi-icon">
                  <Package className="size-4 text-cyan-300" aria-hidden />
                </div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Commandes</p>
                <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-white">{totalCmd}</p>
              </div>
              <div className="perf-super-kpi-card">
                <div className="perf-super-kpi-icon">
                  <Banknote className="size-4 text-cyan-300" aria-hidden />
                </div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">GMV</p>
                <p className="mt-1 text-lg font-bold tabular-nums leading-tight text-cyan-200/95 sm:text-xl">
                  {totalGmv.toLocaleString('fr-FR')}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">CFA</p>
              </div>
              <div className="perf-super-kpi-card">
                <div className="perf-super-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  <Store className="size-4 text-emerald-300" aria-hidden />
                </div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Boutiques actives</p>
                <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-white">
                  {withActivity}
                  <span className="text-base font-semibold text-slate-500">/{rowsAll.length}</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-500/80"
                    style={{
                      width: `${rowsAll.length ? Math.min(100, (withActivity / rowsAll.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="perf-super-kpi-card">
                <div className="perf-super-kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.25)' }}>
                  <Truck className="size-4 text-violet-300" aria-hidden />
                </div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Livraison</p>
                <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-white">{avgSuccPlat}%</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-violet-500/75"
                    style={{ width: `${Math.min(100, Math.max(0, avgSuccPlat))}%` }}
                  />
                </div>
              </div>
              <div className="perf-super-kpi-card">
                <div className="perf-super-kpi-icon" style={{ background: 'rgba(251, 113, 133, 0.1)', borderColor: 'rgba(251, 113, 133, 0.22)' }}>
                  <Percent className="size-4 text-rose-300" aria-hidden />
                </div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Annulations</p>
                <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-rose-200/95">
                  {ins.tauxAnnulPlateforme}%
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-rose-500/70"
                    style={{ width: `${Math.min(100, Math.max(0, ins.tauxAnnulPlateforme))}%` }}
                  />
                </div>
              </div>
              <div className="perf-super-kpi-card">
                <div className="perf-super-kpi-icon" style={{ background: 'rgba(148, 163, 184, 0.1)', borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                  <AlertCircle className="size-4 text-slate-300" aria-hidden />
                </div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Inactifs</p>
                <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-slate-100">{inactiveTenants}</p>
                {ins.panierMoyen > 0 ? (
                  <p className="mt-1 text-[10px] text-slate-500">
                    Panier moy.{' '}
                    <span className="font-semibold tabular-nums text-slate-400">
                      {ins.panierMoyen.toLocaleString('fr-FR')} CFA
              </span>
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-slate-600">—</p>
                )}
              </div>
            </div>

            <div className="perf-super-chart-pair mb-1">
              <div className="perf-super-chart-box nexus-chart-dark">
                <h4>Répartition boutiques</h4>
                <div className="perf-super-chart-inner">
                  <ResponsiveContainer width="100%" height={PIE_PX}>
                    <PieChart>
                      <Pie
                        data={boutiquePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={74}
                        paddingAngle={2}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={1}
                      >
                        {boutiquePieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        {...chartTooltip}
                        formatter={(value) => {
                          const v = typeof value === 'number' ? value : Number(value ?? 0);
                          return [Number.isFinite(v) ? v : 0, 'Boutiques'];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        wrapperStyle={{ fontSize: '11px', paddingTop: 6, color: '#94a3b8' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="perf-super-chart-box nexus-chart-dark">
                <h4>Concentration CA — top 3</h4>
                <div className="perf-super-chart-inner">
                  <ResponsiveContainer width="100%" height={PIE_PX}>
                    <PieChart>
                      <Pie
                        data={concPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={74}
                        paddingAngle={2}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={1}
                      >
                        {concPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        {...chartTooltip}
                        formatter={(value) => {
                          const v = typeof value === 'number' ? value : Number(value ?? 0);
                          return [`${Number.isFinite(v) ? v : 0} %`, 'Part'];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        wrapperStyle={{ fontSize: '11px', paddingTop: 6, color: '#94a3b8' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="perf-super-line-box nexus-chart-dark">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-3">
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Suivi dans le temps
                  </p>
                  <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-slate-500">
                    Agrégation par jour (≤ 90 j) ou par semaine · commandes créées dans la fenêtre · CA = montants
                    livrées / terminées
                  </p>
                </div>
              </div>
              {tl.length > 0 ? (
                <div className="perf-super-line-inner">
                  <ResponsiveContainer width="100%" height={LINE_PX}>
                    <ComposedChart data={tl} margin={{ top: 8, right: 14, left: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id={`saCaAreaGrad-${superAdminLineGradId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: C.textMuted, fontSize: 10 }}
                        interval="preserveStartEnd"
                        tickMargin={6}
                        height={36}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: C.textMuted, fontSize: 10 }}
                        width={36}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: C.textMuted, fontSize: 10 }}
                        width={44}
                        tickFormatter={(v) => `${Number(v) >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                      />
                      <Tooltip
                        {...chartTooltip}
                        formatter={(value, name) => {
                          const n = typeof value === 'number' ? value : Number(value);
                          if (String(name) === 'CA (GMV)')
                            return [`${Number.isFinite(n) ? n.toLocaleString('fr-FR') : '0'} CFA`, name];
                          return [String(value ?? '0'), name];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: 8 }} />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="ca_gmv"
                        name="CA (GMV)"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill={`url(#saCaAreaGrad-${superAdminLineGradId})`}
                        fillOpacity={1}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="commandes"
                        name="Commandes"
                        stroke="#a78bfa"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="annules"
                        name="Annulations"
                        stroke="#fb7185"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="relative flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-cyan-500/15 bg-gradient-to-b from-slate-950/40 to-slate-900/20 py-10">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                    <Activity className="size-7 text-cyan-400/80" aria-hidden />
                  </div>
                  <p className="max-w-sm px-4 text-center text-sm font-semibold text-slate-300">
                    Aucune activité sur cette période
                  </p>
                  <p className="mt-2 max-w-md px-4 text-center text-xs leading-relaxed text-slate-500">
                    Élargissez la période ou vérifiez les filtres (périmètre, dates).
                  </p>
                </div>
              )}
            </div>

            </div>
        </div>

        {/* Carte "leader" + grille 2 colonnes */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
          <div className="xl:col-span-2 space-y-4">
            {topTenant && (topTenant.ca_gmv > 0 || topTenant.commandes > 0) ? (
              <div
                className="relative overflow-hidden rounded-2xl border border-cyan-500/30 p-6 sm:p-7"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.98) 45%, #0f172a 100%)',
                  boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.12), 0 25px 50px -12px rgba(0,0,0,0.5)',
                }}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden />
                <div className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400/95">
                  <Sparkles size={14} strokeWidth={2.5} />
                  Leader période
                </div>
                <p className="relative mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {topTenant.nom}
                </p>
                <p className="relative text-sm text-slate-400 mt-1">/{topTenant.slug || '—'}</p>
                <div className="relative mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">CA (GMV)</p>
                    <p className="text-lg font-bold text-white tabular-nums mt-1">
                      {topTenant.ca_gmv.toLocaleString('fr-FR')}{' '}
                      <span className="text-xs text-slate-500">CFA</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Succès livr.</p>
                    <p className="text-lg font-bold text-cyan-300 tabular-nums mt-1">{topTenant.success_rate}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-600/40 px-4 py-3 text-center text-xs text-slate-500">
                Aucune activité sur cette période — élargir la période ou vérifier les filtres.
              </div>
            )}

            {chartData.length > 0 && (
              <div
                className="rounded-2xl border border-white/[0.08] p-5 sm:p-6 overflow-hidden"
                style={{ background: 'linear-gradient(180deg, rgba(18, 24, 43, 0.95) 0%, #0b1120 100%)' }}
              >
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <h3
                      className="text-base font-bold text-white flex items-center gap-2"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      <LayoutDashboard size={18} className="text-cyan-400" strokeWidth={2} />
                      Répartition CA (top 12)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Barres horizontales · même échelle pour comparer</p>
                  </div>
                </div>
                <div style={{ height: Math.max(280, chartData.length * 36) }} className="min-h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="gmvBarGradSuperAdmin" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="55%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        type="number"
                        tick={{ fill: C.textMuted, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="nom"
                        width={118}
                        tick={{ fill: '#cbd5e1', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        {...chartTooltip}
                        formatter={(v) => [`${Number(v ?? 0).toLocaleString('fr-FR')} CFA`, 'CA livré']}
                      />
                      <Bar
                        dataKey="ca"
                        fill="url(#gmvBarGradSuperAdmin)"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={32}
                        animationDuration={600}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-3">
            <div
              className="rounded-2xl border border-white/[0.08] overflow-hidden h-full flex flex-col min-h-[420px]"
              style={{
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(8, 11, 20, 0.99) 100%)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div className="flex flex-col gap-4 px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-cyan-950/30 to-transparent">
                <div>
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Matrice <span style={{ color: C.primary }}>tenants</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rows.length} boutique{rows.length > 1 ? 's' : ''} affichée{rows.length > 1 ? 's' : ''} · ligne ambre
                    = livraison à surveiller (≥{SA_MIN_SORTIES_FOR_RISK} missions, {'<'}
                    {SA_LOGISTICS_RISK_THRESHOLD}% succès)
                  </p>
                </div>
                <div className="flex flex-col gap-4 border-t border-white/[0.05] pt-4 md:flex-row md:items-end md:justify-between md:gap-6 md:pt-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:max-w-[min(100%,440px)]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Périmètre
                    </span>
                    <div style={NEXUS_TAB_BAR_WRAP} role="group" aria-label="Périmètre boutique">
                      {SUPER_ADMIN_SCOPE_DEFS.map((def) => (
                        <button
                          key={def.id}
                          type="button"
                          title={def.hint}
                          onClick={() => setSuperAdminScope(def.id)}
                          style={nexusPillButtonStyle(superAdminScope === def.id, '#6366f1')}
                        >
                          {def.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 md:max-w-[min(100%,580px)] md:items-end">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 md:text-right">
                      Tri du tableau
                    </span>
                    <div
                      style={{
                        ...NEXUS_TAB_BAR_WRAP,
                        justifyContent: 'flex-end',
                        width: '100%',
                        maxWidth: '100%',
                      }}
                      role="group"
                      aria-label="Colonne de tri"
                    >
                      {SUPER_ADMIN_SORT_DEFS.map((def) => (
                        <button
                          key={def.id}
                          type="button"
                          onClick={() => setSuperAdminSort(def.id)}
                          style={nexusPillButtonStyle(superAdminSort === def.id, def.color)}
                        >
                          {def.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-[13px] min-w-[960px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-500 border-b border-white/[0.06] bg-black/20">
                      <th className="pl-5 pr-2 py-3.5 font-bold w-10">#</th>
                      <th className="px-2 py-3.5 font-bold">Boutique</th>
                      <th className="px-2 py-3.5 font-bold">Plan</th>
                      <th className="px-2 py-3.5 font-bold text-center">État</th>
                      <th className="px-2 py-3.5 font-bold text-center">
                        <Users className="inline size-3.5 opacity-50 mr-0.5" />
                        Équipe
                      </th>
                      <th className="px-2 py-3.5 font-bold text-center">Cmd</th>
                      <th className="px-2 py-3.5 font-bold text-center" style={{ color: C.livres }}>
                        OK
                      </th>
                      <th className="px-2 py-3.5 font-bold text-center text-slate-400">Terrain</th>
                      <th className="px-2 py-3.5 font-bold text-center">%</th>
                      <th className="px-2 py-3.5 font-bold text-center" style={{ color: C.annules }}>
                        Annul.
                      </th>
                      <th className="px-2 py-3.5 font-bold text-center text-slate-400">Ann. %</th>
                      <th className="pl-2 pr-5 py-3.5 font-bold text-right">CA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const annulPctLigne = r.commandes > 0 ? Math.round((r.annules / r.commandes) * 100) : 0;
                      const atRisk = tenantLogisticsAtRisk(r);
                      return (
                      <tr
                        key={r.tenant_id}
                        className={[
                          'border-b border-white/[0.04] transition-colors hover:bg-cyan-500/[0.04]',
                          atRisk ? 'bg-amber-500/[0.06]' : '',
                        ].join(' ')}
                      >
                        <td className="pl-5 pr-2 py-3.5 text-slate-600 font-mono text-xs tabular-nums">{idx + 1}</td>
                        <td className="px-2 py-3.5">
                          <div className="font-semibold text-slate-100">{r.nom}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-cyan-500/75 font-medium">/{r.slug || '—'}</span>
                            {r.slug ? (
                              <Link
                                to={`/${r.slug}`}
                                className="inline-flex text-slate-500 hover:text-cyan-400 transition-colors"
                                title="Ouvrir l'espace boutique"
                                aria-label={`Ouvrir la boutique ${r.nom}`}
                              >
                                <ExternalLink size={13} strokeWidth={2} />
                              </Link>
                            ) : null}
                            {atRisk ? (
                              <span
                                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-200 border border-amber-500/25"
                                title="Charge terrain avec taux de succès sous le seuil"
                              >
                                <AlertTriangle className="size-3" aria-hidden />
                                Liv.
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-2 py-3.5">
                          <span className="inline-flex rounded-lg bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-300 border border-white/5">
                            {r.plan}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[3.25rem] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              r.actif ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/60 text-slate-400'
                            }`}
                          >
                            {r.actif ? 'On' : 'Off'}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-center tabular-nums text-slate-300">{r.users_count}</td>
                        <td className="px-2 py-3.5 text-center tabular-nums text-slate-300">{r.commandes}</td>
                        <td className="px-2 py-3.5 text-center font-semibold tabular-nums" style={{ color: C.livres }}>
                          {r.livrees}
                        </td>
                        <td className="px-2 py-3.5 text-center tabular-nums text-slate-500">{r.sorties_terrain}</td>
                        <td className="px-2 py-3.5 text-center">
                          <span className="inline-flex min-w-[2.75rem] justify-center rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-xs font-bold tabular-nums text-cyan-200 border border-cyan-500/20">
                            {r.success_rate}%
                          </span>
                        </td>
                        <td className="px-2 py-3.5 text-center tabular-nums" style={{ color: C.annules }}>
                          {r.annules}
                        </td>
                        <td className="px-2 py-3.5 text-center tabular-nums text-slate-400 text-xs">
                          {r.commandes > 0 ? `${annulPctLigne}%` : '—'}
                        </td>
                        <td className="pl-2 pr-5 py-3.5 text-right font-semibold tabular-nums text-white">
                          {r.ca_gmv.toLocaleString('fr-FR')}{' '}
                          <span className="text-slate-500 text-[11px] font-medium">CFA</span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length === 0 && (
                <p className="p-12 text-center text-slate-500 text-sm">Aucune boutique enregistrée.</p>
              )}
            </div>
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
    /** Couleur pastille active (alignement Commandes) */
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

  if (moduleChrome) {
    return (
      <NexusModuleFrame
        badge="Performance Intelligence"
        title="Performance équipe"
        description={subtitle}
        actions={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fetchData()}
              disabled={loading}
              aria-label="Actualiser les données"
              style={{
                ...BTN_PRIMARY_INLINE,
                opacity: loading ? 0.75 : 1,
              }}
            >
              <RefreshCw size={22} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} aria-hidden />
              Actualiser
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={exportHubTableCsv}
              disabled={loading || !!loadError}
              aria-label="Exporter le tableau visible en CSV"
              style={BTN_OUTLINE_INLINE}
            >
              <Download size={20} strokeWidth={2.2} aria-hidden />
              Export CSV
            </button>
          </div>
        }
      >
        {loadError ? (
          <div
            className="mb-8 flex flex-col gap-3 rounded-2xl border border-red-500/35 bg-red-950/35 p-4 text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.12)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0 text-red-400" size={20} aria-hidden />
              <div>
                <p className="m-0 font-semibold text-red-100">Chargement impossible</p>
                <p className="mt-1 mb-0 text-sm text-red-200/85">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchData()}
              className="btn btn-primary shrink-0"
              style={{ ...BTN_PRIMARY_INLINE, height: '52px', fontSize: '0.95rem', padding: '0 1.75rem' }}
            >
              Réessayer
            </button>
          </div>
        ) : null}

        {!tenantId ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[var(--surface)] py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
            <p className="mt-4 text-sm font-medium text-slate-400">Initialisation du module…</p>
          </div>
        ) : (
          <>
            {/* Période (gauche) + Pôle (droite) sur une même ligne — responsive */}
            <nav
              style={{ marginBottom: '2rem' }}
              aria-label="Filtres période et département"
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem 1.5rem',
                }}
          >
            <div
              style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    flex: '1 1 auto',
                    minWidth: 'min(100%, 260px)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                fontWeight: 800,
                      color: 'var(--text-muted)',
                textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      flexShrink: 0,
                    }}
                  >
                    Période
                  </span>
                  <div style={NEXUS_TAB_BAR_WRAP} role="group" aria-label="Période">
                    {periodFilterDefs.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        style={nexusPillButtonStyle(filter === f.id, f.color)}
                      >
                        {f.label}
                      </button>
                    ))}
          </div>
                </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    flex: '1 1 auto',
                    minWidth: 'min(100%, 260px)',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      flexShrink: 0,
                    }}
                  >
                    Pôle
                  </span>
                  <div style={NEXUS_TAB_BAR_WRAP}>
                {tabDefs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                          role="tab"
                          aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                          style={nexusPillButtonStyle(active, tab.color)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  marginTop: '0.85rem',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    maxWidth: '42rem',
                  }}
                >
                  {tabDefs.find((t) => t.id === activeTab)?.sub} — sélectionnez un pôle pour afficher les indicateurs
                  détaillés.
                </p>
                {dataUpdatedAt && !loadError ? (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    Mis à jour :{' '}
                    {dataUpdatedAt.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                ) : null}
            </div>
            </nav>

            {staffKpiBundle && !loading && !loadError ? (
              <div
                className="card glass-effect"
                style={{
                  marginBottom: '3.5rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '28px',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 1rem 0',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  Synthèse indicateurs
                </p>
                <div className="perf-embedded-kpi-grid w-full">
                {staffKpiBundle[activeTab].map((k) => {
                  const IconComp = k.Icon;
                  return (
                    <StaffKpiCard
                      key={k.key}
                        layout="strip"
                      accent={k.accent}
                      icon={<IconComp size={20} strokeWidth={2} />}
                      label={k.label}
                      value={k.value}
                      sub={k.sub}
                    />
                  );
                })}
              </div>
              </div>
            ) : null}

              {loading ? (
                <div
                className="card glass-effect overflow-hidden"
                    style={{
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '32px',
                  background: 'transparent',
                }}
              >
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/25 border-t-cyan-400" />
                  <p className="m-0 text-sm font-medium text-slate-400">Chargement des indicateurs…</p>
                </div>
                <NexusTableSkeleton rows={6} cols={3} />
              </div>
            ) : loadError ? null : (
              <div className="card glass-effect" style={{ padding: 0, border: '1px solid rgba(255,255,255,0.03)', borderRadius: '32px', overflow: 'hidden', background: 'transparent' }}>
                <div style={{ animation: 'fadeIn 0.35s ease' }}>
                  {activeTab === 'logistique' && renderLogistics()}
                  {activeTab === 'call-center' && renderCallCenter()}
                  {activeTab === 'inventaire' && renderInventory()}
                </div>
            </div>
            )}
          </>
        )}
      </NexusModuleFrame>
    );
  }

  if (isSuperAdmin) {
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
          <NexusModuleFrame
            badge="Nexus Intelligence"
            title="Performance des boutiques"
            description="Pilotage multi-boutiques : volume, CA (GMV) et indicateurs de livraison."
            actions={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fetchData()}
                  disabled={loading}
                  aria-label="Actualiser les données"
                  style={{
                    ...BTN_PRIMARY_INLINE,
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  <RefreshCw size={22} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} aria-hidden />
                  Actualiser
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={exportSuperAdminTenantsCsv}
                  disabled={loading || !!loadError || superAdminDisplayRows.length === 0}
                  aria-label="Exporter la matrice affichée en CSV"
                  style={BTN_OUTLINE_INLINE}
                >
                  <Download size={20} strokeWidth={2.2} aria-hidden />
                  Export CSV
                </button>
              </div>
            }
          >
            {loadError ? (
              <div
                className="mb-8 flex flex-col gap-3 rounded-2xl border border-red-500/35 bg-red-950/35 p-4 text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.12)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 shrink-0 text-red-400" size={20} aria-hidden />
                  <div>
                    <p className="m-0 font-semibold text-red-100">Chargement impossible</p>
                    <p className="mt-1 mb-0 text-sm text-red-200/85">{loadError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="btn btn-primary shrink-0"
                  style={{ ...BTN_PRIMARY_INLINE, height: '52px', fontSize: '0.95rem', padding: '0 1.75rem' }}
                >
                  Réessayer
                </button>
              </div>
            ) : null}

            <nav style={{ marginBottom: '2rem' }} aria-label="Période">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem 1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    flex: '1 1 auto',
                    minWidth: 'min(100%, 260px)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      flexShrink: 0,
                    }}
                  >
                    Période
                  </span>
                  <div style={NEXUS_TAB_BAR_WRAP} role="group" aria-label="Période">
                    {periodFilterDefs.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        style={nexusPillButtonStyle(filter === f.id, f.color)}
                      >
                        {f.label}
                      </button>
                    ))}
              </div>
                </div>
                {dataUpdatedAt && !loadError ? (
                <div
                    className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 px-3 py-2 rounded-xl border border-white/10"
                  style={{ background: 'rgba(8, 11, 20, 0.75)', backdropFilter: 'blur(12px)' }}
                >
                    <Clock size={16} className="shrink-0 text-cyan-400/90" strokeWidth={2} aria-hidden />
                    <span className="font-semibold tabular-nums">
                      Données :{' '}
                      {dataUpdatedAt.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                ) : null}
              </div>
              <p
                style={{
                  margin: '0.85rem 0 0 0',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  maxWidth: '48rem',
                  lineHeight: 1.45,
                }}
              >
                La synthèse plateforme utilise toujours toutes les boutiques ; le périmètre et le tri agissent uniquement
                sur le tableau.
              </p>
            </nav>

            {loading ? (
              <div
                className="card glass-effect overflow-hidden"
                style={{
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '32px',
                  background: 'transparent',
                }}
              >
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/25 border-t-cyan-400" />
                  <p className="m-0 text-sm font-medium text-slate-400">Chargement des indicateurs…</p>
            </div>
                <NexusTableSkeleton rows={6} cols={4} />
              </div>
            ) : loadError ? null : (
              <div
                className="card glass-effect"
                style={{
                  padding: 0,
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '32px',
                  overflow: 'visible',
                  background: 'transparent',
                }}
              >
                <div style={{ animation: 'fadeIn 0.35s ease', padding: '0.5rem 0.25rem 1rem' }}>
                  {renderSuperAdminTenants()}
                </div>
              </div>
            )}
          </NexusModuleFrame>
        </div>
      </div>
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
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 lg:py-10 pb-16">
          <header className="relative mb-10 lg:mb-12 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0c1222] via-[#0a0f1a] to-[#060911] px-6 py-8 sm:px-10 sm:py-10 shadow-[0_0_0_1px_rgba(6,182,212,0.08),0_40px_80px_-20px_rgba(0,0,0,0.65)]">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-600/10 blur-[80px]"
              aria-hidden
            />
            <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/95">
                  <Activity size={12} className="text-cyan-400" strokeWidth={2.5} />
                  Nexus · Hub équipe terrain
                </span>
                <h1
                  className="mt-4 text-3xl sm:text-4xl lg:text-[2.35rem] font-bold tracking-tight leading-[1.15]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #22d3ee 35%, #a78bfa 70%, #818cf8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Performance équipe
                  </span>
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                  {subtitle}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row xl:flex-col xl:items-end gap-4 shrink-0">
                {renderFilterButtons()}
                <div
                  className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 px-4 py-3 rounded-2xl border border-white/10"
                  style={{ background: 'rgba(8, 11, 20, 0.75)', backdropFilter: 'blur(12px)' }}
                >
                  <Clock size={17} className="shrink-0 text-cyan-400" strokeWidth={2} aria-hidden />
                  <span className="font-medium tabular-nums">
                    {new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <>
            <nav
              className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              aria-label="Départements"
            >
              <div className="inline-flex flex-wrap gap-2 p-1.5 rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-md shadow-inner">
                {tabDefs.map((tab) => {
                  const active = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        'inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',
                        active
                          ? 'text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
                      ].join(' ')}
                      style={
                        active
                          ? {
                              background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
                              boxShadow: '0 4px 18px rgba(6, 182, 212, 0.35)',
                            }
                          : undefined
                      }
                    >
                      <Icon size={18} strokeWidth={2} className="shrink-0 opacity-90" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 max-w-md sm:text-right">
                {tabDefs.find((t) => t.id === activeTab)?.sub} — sélectionnez un pôle pour afficher les indicateurs
                détaillés.
              </p>
            </nav>

            {staffKpiBundle && !loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-10">
                {staffKpiBundle[activeTab].map((k) => {
                  const IconComp = k.Icon;
                  return (
                    <StaffKpiCard
                      key={k.key}
                      accent={k.accent}
                      icon={<IconComp size={20} strokeWidth={2} />}
                      label={k.label}
                      value={k.value}
                      sub={k.sub}
                    />
                  );
                })}
              </div>
            )}
          </>

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
              <>
                {activeTab === 'logistique' && renderLogistics()}
                {activeTab === 'call-center' && renderCallCenter()}
                {activeTab === 'inventaire' && renderInventory()}
              </>
          </div>
        )}
      </div>
    </div>
  );
};
