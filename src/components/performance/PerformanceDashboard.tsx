import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  loadPerformanceDashboardData,
  loadSuperAdminTenantPerformance,
  type TenantPerfRow,
  type InventoryStaffPerfRow,
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
  Sparkles,
  LayoutDashboard,
  ArrowUpRight,
  Activity,
  Target,
  Medal,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  Plug,
  Undo2,
  BarChart3,
  Download,
  AlertCircle,
} from 'lucide-react';

type TabType = 'logistique' | 'call-center' | 'inventaire';
type FilterType = 'mois' | '7jours' | 'aujourdhui' | 'toujours';

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

const chartTooltipLight = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '10px 14px',
    boxShadow: '0 12px 28px rgba(15,23,42,0.12)',
  },
  labelStyle: { color: '#0f172a', fontWeight: 700 },
  itemStyle: { color: '#475569' },
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

/** Thème « Hub » clair (captures produit) */
const HUB = {
  purple: '#5b21b6',
  purpleSoft: '#ede9fe',
  border: '#e2e8f0',
  muted: '#64748b',
};

function HubMetricPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'green' | 'purple' | 'red' | 'amber' | 'slate';
}) {
  const map: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
    red: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
    amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
    slate: 'bg-slate-50 text-slate-800 ring-1 ring-slate-100',
  };
  return (
    <span
      className={`inline-flex min-w-[2rem] justify-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function HubEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center shadow-sm sm:py-14">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-200/80">
        <Icon size={26} strokeWidth={2} />
      </div>
      <p className="m-0 text-base font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mb-0 mt-2 max-w-lg text-sm leading-relaxed text-slate-500">{description}</p>
      {action ? (
        <Link
          to={action.to}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function HubTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4 sm:p-5" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 animate-pulse"
        >
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded bg-slate-200 sm:w-48" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-8 w-12 rounded-lg bg-slate-200 sm:w-14" />
          ))}
        </div>
      ))}
    </div>
  );
}

type HubKpiItem = {
  key: string;
  label: string;
  value: ReactNode;
  sub: string;
  Icon: LucideIcon;
};

function HubKpiStrip({ items }: { items: HubKpiItem[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((k) => {
        const Icon = k.Icon;
        return (
          <div
            key={k.key}
            className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                <Icon size={18} strokeWidth={2} aria-hidden />
              </div>
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{k.label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums leading-tight text-slate-900 sm:text-xl">{k.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">{k.sub}</p>
          </div>
        );
      })}
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
}: {
  accent: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub: string;
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
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] p-4 sm:p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:border-cyan-500/25">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ring} opacity-80`} aria-hidden />
      <div className="relative flex flex-col gap-3 h-full">
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (isSuperAdmin) {
        const rows = await loadSuperAdminTenantPerformance(filter);
        setTenantRows(rows);
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

  /** Synthèse contextualisée pour le bandeau KPI (vue hub clair) */
  const hubStripeItems = useMemo((): HubKpiItem[] | null => {
    if (!moduleChrome || isSuperAdmin) return null;
    if (activeTab === 'logistique') {
      const log = logisticsSorted;
      const logSorties = log.reduce((a, s: any) => a + (Number(s.sorties) || 0), 0);
      const logReuss = log.reduce((a, s: any) => a + (Number(s.reussies) || 0), 0);
      const logAvg = logSorties > 0 ? Math.round((logReuss / logSorties) * 100) : 0;
      const logCa = log.reduce((a, s: any) => a + (Number(s.ca_frais) || 0), 0);
      return [
        {
          key: 'sorties',
          label: 'Sorties',
          value: logSorties.toLocaleString('fr-FR'),
          sub: 'Missions terrain sur la période',
          Icon: Truck,
        },
        {
          key: 'livr',
          label: 'Livrés',
          value: logReuss.toLocaleString('fr-FR'),
          sub: 'Colis délivrés avec succès',
          Icon: Target,
        },
        {
          key: 'taux',
          label: 'Taux succès',
          value: `${logAvg}%`,
          sub: 'Moyenne équipe (pondérée)',
          Icon: TrendingUp,
        },
        {
          key: 'ca',
          label: 'Gains livreurs',
          value: `${logCa.toLocaleString('fr-FR')} CFA`,
          sub: 'Frais sur livraisons',
          Icon: Banknote,
        },
      ];
    }
    if (activeTab === 'call-center') {
      const cc = callCenterSorted;
      const th = cc.reduce((a, s: any) => a + (Number(s.total_handled) || 0), 0);
      const td = cc.reduce((a, s: any) => a + (Number(s.total_delivered) || 0), 0);
      const tv = cc.reduce((a, s: any) => a + (Number(s.total_validations) || 0), 0);
      const avg = th > 0 ? Math.round((td / th) * 100) : 0;
      return [
        {
          key: 'th',
          label: 'Dossiers',
          value: th.toLocaleString('fr-FR'),
          sub: 'Traités par les agents',
          Icon: ClipboardList,
        },
        {
          key: 'val',
          label: 'Validations',
          value: tv.toLocaleString('fr-FR'),
          sub: 'Étapes post-appel',
          Icon: CheckCircle2,
        },
        {
          key: 'livr',
          label: 'Livrées',
          value: td.toLocaleString('fr-FR'),
          sub: 'Commandes finalisées',
          Icon: Package,
        },
        {
          key: 'conv',
          label: 'Conversion',
          value: `${avg}%`,
          sub: 'Livrées / dossiers',
          Icon: TrendingUp,
        },
      ];
    }
    const inv = inventoryStaffSorted;
    const totalP = inv.reduce((a, r) => a + r.produits_crees, 0);
    const activeContributors = inv.filter((r) => r.produits_crees > 0).length;
    const avgPer = inv.length > 0 ? (totalP / inv.length).toFixed(1) : '0';
    const top = inv[0];
    return [
      {
        key: 'tot',
        label: 'Produits créés',
        value: totalP.toLocaleString('fr-FR'),
        sub: 'Total sur la période',
        Icon: Package,
      },
      {
        key: 'contrib',
        label: 'Contributeurs',
        value: String(activeContributors),
        sub: 'Avec au moins une création',
        Icon: Users,
      },
      {
        key: 'avg',
        label: 'Moy. / collaborateur',
        value: avgPer,
        sub: 'Moyenne arithmétique',
        Icon: TrendingUp,
      },
      {
        key: 'top',
        label: 'Meilleur volume',
        value: top ? String(top.produits_crees) : '—',
        sub: top
          ? top.staff_name.length > 24
            ? `${top.staff_name.slice(0, 24)}…`
            : top.staff_name
          : '—',
        Icon: Medal,
      },
    ];
  }, [
    moduleChrome,
    isSuperAdmin,
    activeTab,
    logisticsSorted,
    callCenterSorted,
    inventoryStaffSorted,
  ]);

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
      inventaire: [
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
      ],
    };
  }, [isSuperAdmin, logisticsSorted, callCenterSorted, inventorySorted]);

  const renderLogistics = () => {
    const data = logisticsSorted;

    if (moduleChrome) {
      const totalSorties = data.reduce((acc: number, s: any) => acc + (Number(s.sorties) || 0), 0);
      const totalReussies = data.reduce((acc: number, s: any) => acc + (Number(s.reussies) || 0), 0);
      const avgSuccess = totalSorties > 0 ? Math.round((totalReussies / totalSorties) * 100) : 0;
      const hubHint = (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Medal size={15} className="text-violet-500 shrink-0" strokeWidth={2} />
          Classé par efficacité
        </div>
      );
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)] overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between px-4 py-4 sm:px-5 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80">
              <h2 className="text-base sm:text-lg font-bold text-violet-900 m-0 tracking-tight pr-2">
                Détails des performances : <span className="text-violet-600">Logistique</span>
              </h2>
              {hubHint}
            </div>
            {data.length === 0 ? (
              <div className="p-4 sm:p-6">
                <HubEmptyState
                  icon={Truck}
                  title="Aucune activité logistique"
                  description="Aucune sortée terrain sur la période choisie. Élargissez la fenêtre (7 jours, Toujours…) ou vérifiez que des livreurs ont des missions en cours."
                  action={tenantBase ? { to: `${tenantBase}/logistique`, label: 'Ouvrir la logistique' } : undefined}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-responsive-cards w-full min-w-[720px] text-left text-sm">
                  <caption className="sr-only">
                    Détail logistique par livreur, trié par efficacité, pour la période sélectionnée
                  </caption>
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.1em] text-slate-500 bg-slate-100/90 border-b border-slate-200">
                      <th className="px-4 py-3.5 text-left font-bold">Livreur</th>
                      <th className="px-3 py-3.5 text-center font-bold">Sorties</th>
                      <th className="px-3 py-3.5 text-center font-bold text-emerald-700">Livrés</th>
                      <th className="px-3 py-3.5 text-center font-bold text-violet-700">Retours</th>
                      <th className="px-3 py-3.5 text-center font-bold text-rose-700">Annulés</th>
                      <th className="px-3 py-3.5 text-center font-bold text-amber-700">Reports</th>
                      <th className="px-4 py-3.5 text-right font-bold">Gains livr.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((s: any) => (
                      <tr key={s.livreur_id} className="border-slate-100 transition-colors hover:bg-violet-50/50">
                        <td data-label="Livreur" className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, ${HUB.purple} 0%, #8b5cf6 100%)`,
                              }}
                            >
                              {s.nom?.charAt(0) ?? '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{s.nom}</div>
                              <div
                                className={`mt-0.5 text-xs font-semibold ${
                                  s.success_rate >= 70
                                    ? 'text-emerald-600'
                                    : s.success_rate >= 45
                                      ? 'text-amber-600'
                                      : 'text-rose-600'
                                }`}
                              >
                                {s.success_rate}% réussite
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          data-label="Sorties"
                          className="px-3 py-3 text-center font-semibold text-slate-800 tabular-nums sm:py-4"
                        >
                          {s.sorties}
                        </td>
                        <td data-label="Livrés" className="px-3 py-3 text-center sm:py-4">
                          <HubMetricPill tone="green">{s.reussies}</HubMetricPill>
                        </td>
                        <td data-label="Retours" className="px-3 py-3 text-center sm:py-4">
                          <HubMetricPill tone="purple">{s.retours}</HubMetricPill>
                        </td>
                        <td data-label="Annulés" className="px-3 py-3 text-center sm:py-4">
                          <HubMetricPill tone="red">{s.annules ?? 0}</HubMetricPill>
                        </td>
                        <td data-label="Reports" className="px-3 py-3 text-center sm:py-4">
                          <HubMetricPill tone="amber">{s.reportes ?? 0}</HubMetricPill>
                        </td>
                        <td
                          data-label="Gains livr."
                          className="px-4 py-3 text-right font-bold tabular-nums text-slate-900 sm:py-4"
                        >
                          {s.ca_frais != null ? Number(s.ca_frais).toLocaleString('fr-FR') : '—'}{' '}
                          <span className="text-xs font-semibold text-slate-500">CFA</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)] md:p-6">
            <div className="mb-5">
              <h3 className="m-0 flex items-center gap-2 text-base font-bold text-violet-900">
                <Activity size={18} className="shrink-0 text-violet-600" />
                Impact livraison (succès %)
              </h3>
              <p className="mt-1 text-xs text-slate-500">Comparatif du taux de succès par livreur</p>
            </div>
            {data.length === 0 ? (
              <HubEmptyState
                icon={BarChart3}
                title="Graphique indisponible"
                description="Ajoutez des missions terrain sur la période pour visualiser le comparatif de succès."
              />
            ) : (
              <>
                <div className="h-[260px] min-h-[220px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="staffLogBarGradHub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="nom"
                        tick={{ fill: HUB.muted, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={data.length > 5 ? -25 : 0}
                        textAnchor={data.length > 5 ? 'end' : 'middle'}
                        height={data.length > 5 ? 56 : 32}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: HUB.muted, fontSize: 11 }}
                        domain={[0, 100]}
                        width={36}
                      />
                      <Tooltip {...chartTooltipLight} formatter={(v) => [`${v ?? 0}%`, 'Succès']} />
                      <Bar
                        dataKey="success_rate"
                        fill="url(#staffLogBarGradHub)"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={48}
                        animationDuration={500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">Moyenne équipe (pondérée)</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 font-bold tabular-nums text-violet-800">
                    {avgSuccess}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

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

    if (moduleChrome) {
      const th = data.reduce((acc: number, s: any) => acc + (Number(s.total_handled) || 0), 0);
      const td = data.reduce((acc: number, s: any) => acc + (Number(s.total_delivered) || 0), 0);
      const avgConv = th > 0 ? Math.round((td / th) * 100) : 0;
      const hubHint = (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Medal size={15} className="text-violet-500 shrink-0" strokeWidth={2} />
          Classé par efficacité
        </div>
      );
      const thCell = (label: string, Icon: LucideIcon) => (
        <span className="inline-flex flex-col items-center gap-0.5">
          <Icon size={13} className="shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
          <span>{label}</span>
        </span>
      );
      return (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
              <h2 className="m-0 pr-2 text-base font-bold tracking-tight text-violet-900 sm:text-lg">
                Détails des performances : <span className="text-violet-600">Centre d&apos;appel</span>
              </h2>
              {hubHint}
            </div>
            {data.length === 0 ? (
              <div className="p-4 sm:p-6">
                <HubEmptyState
                  icon={PhoneCall}
                  title="Aucune activité centre d'appel"
                  description="Aucune commande associée à un agent sur cette période. Élargissez les dates ou vérifiez les attributions d'agents."
                  action={tenantBase ? { to: `${tenantBase}/centre-appel`, label: "Ouvrir le centre d'appel" } : undefined}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-responsive-cards min-w-[1000px] w-full text-left text-sm">
                  <caption className="sr-only">
                    Détail centre d&apos;appel par agent, trié par conversion, pour la période sélectionnée
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/90 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      <th className="min-w-[11rem] px-3 py-3 text-left align-bottom">Agent</th>
                      <th className="px-1.5 py-3 text-center align-bottom sm:px-2">{thCell('Traitées', ClipboardList)}</th>
                      <th className="px-1.5 py-3 text-center align-bottom sm:px-2">{thCell('Validées', CheckCircle2)}</th>
                      <th className="px-1.5 py-3 text-center align-bottom text-emerald-700 sm:px-2">
                        {thCell('Livrées', Package)}
                      </th>
                      <th className="px-1.5 py-3 text-center align-bottom text-violet-700 sm:px-2">
                        {thCell('Retours', Undo2)}
                      </th>
                      <th className="px-1.5 py-3 text-center align-bottom text-rose-700 sm:px-2">
                        {thCell('Échecs', XCircle)}
                      </th>
                      <th className="px-1.5 py-3 text-center align-bottom text-amber-700 sm:px-2">
                        {thCell('Reprog.', RefreshCw)}
                      </th>
                      <th className="px-1.5 py-3 text-center align-bottom text-rose-800 sm:px-2">
                        {thCell('Annulées', Ban)}
                      </th>
                      <th className="px-1.5 py-3 text-center align-bottom text-slate-600 sm:px-2">
                        {thCell('Connex.', Plug)}
                      </th>
                      <th className="min-w-[4.5rem] px-2 py-3 text-center align-bottom text-violet-800">Taux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((agent: any) => {
                      const r = Number(agent.success_rate) || 0;
                      const convColor =
                        r >= 60 ? 'text-emerald-600' : r >= 45 ? 'text-amber-600' : 'text-rose-600';
                      return (
                        <tr key={agent.agent_id} className="transition-colors hover:bg-violet-50/50">
                          <td data-label="Agent" className="px-3 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-bold text-white shadow-sm">
                                {(agent.staff_name || 'A').charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{agent.staff_name || 'Agent'}</div>
                                <div className={`mt-0.5 text-xs font-semibold ${convColor}`}>
                                  {r}% conversion réelle
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            data-label="Traitées"
                            className="px-2 py-3 text-center text-sm font-medium tabular-nums text-slate-800 sm:py-4"
                          >
                            {agent.total_handled}
                          </td>
                          <td data-label="Validées" className="px-2 py-3 text-center sm:py-4">
                            <HubMetricPill tone="slate">{agent.total_validations}</HubMetricPill>
                          </td>
                          <td data-label="Livrées" className="px-2 py-3 text-center sm:py-4">
                            <HubMetricPill tone="green">{agent.total_delivered}</HubMetricPill>
                          </td>
                          <td data-label="Retours" className="px-2 py-3 text-center sm:py-4">
                            <HubMetricPill tone="purple">{Number(agent.retours) || 0}</HubMetricPill>
                          </td>
                          <td data-label="Échecs" className="px-2 py-3 text-center sm:py-4">
                            <HubMetricPill tone="red">{Number(agent.echouees) || 0}</HubMetricPill>
                          </td>
                          <td data-label="Reprog." className="px-2 py-3 text-center sm:py-4">
                            <HubMetricPill tone="amber">{Number(agent.reprogrammes) || 0}</HubMetricPill>
                          </td>
                          <td data-label="Annulées" className="px-2 py-3 text-center sm:py-4">
                            <HubMetricPill tone="red">{Number(agent.annulees) || 0}</HubMetricPill>
                          </td>
                          <td data-label="Connex." className="px-2 py-3 text-center sm:py-4">
                            <HubMetricPill tone="slate">{Number(agent.connexions) || 0}</HubMetricPill>
                          </td>
                          <td data-label="Taux conv." className="px-2 py-3 text-center sm:py-4">
                            <span className={`text-base font-bold tabular-nums sm:text-lg ${convColor}`}>{r}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)] md:p-6">
            <div className="mb-5">
              <h3 className="m-0 flex items-center gap-2 text-base font-bold text-violet-900">
                <PhoneCall size={18} className="shrink-0 text-violet-600" />
                Courbe de conversion
              </h3>
              <p className="mt-1 text-xs text-slate-500">Taux de conversion par agent (dossiers → livraisons)</p>
            </div>
            {data.length === 0 ? (
              <HubEmptyState
                icon={BarChart3}
                title="Graphique indisponible"
                description="Les données d'agents apparaîtront ici dès qu'il y aura des dossiers traités sur la période."
              />
            ) : (
              <>
                <div className="h-[260px] min-h-[220px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="barCallGradHub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#6d28d9" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="staff_name"
                        tick={{ fill: HUB.muted, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={data.length > 4 ? -22 : 0}
                        textAnchor={data.length > 4 ? 'end' : 'middle'}
                        height={data.length > 4 ? 64 : 36}
                      />
                      <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: HUB.muted, fontSize: 11 }}
                        width={34}
                      />
                      <Tooltip {...chartTooltipLight} formatter={(v) => [`${v ?? 0}%`, 'Conversion']} />
                      <Bar dataKey="success_rate" fill="url(#barCallGradHub)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <PhoneCall size={18} className="shrink-0 text-violet-500" aria-hidden />
                  <span>
                    Moyenne équipe :{' '}
                    <span className="font-bold tabular-nums text-violet-800">{avgConv}%</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

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
      const hubHint = (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Medal size={15} className="text-violet-500 shrink-0" strokeWidth={2} />
          Classé par efficacité
        </div>
      );
      const chartStaff = staffData.map((r) => ({
        nom: r.staff_name.length > 14 ? `${r.staff_name.slice(0, 14)}…` : r.staff_name,
        produits: r.produits_crees,
      }));
      return (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
              <h2 className="m-0 pr-2 text-base font-bold tracking-tight text-violet-900 sm:text-lg">
                Détails des performances : <span className="text-violet-600">Inventaire</span>
              </h2>
              {hubHint}
            </div>
            {staffData.length === 0 ? (
              <div className="p-4 sm:p-6">
                <HubEmptyState
                  icon={Package}
                  title="Aucune donnée sur cette période"
                  description="Aucun collaborateur avec produits créés ou aucune création enregistrée. Élargissez la fenêtre temporelle ou créez des fiches produits depuis le module Produits."
                  action={tenantBase ? { to: `${tenantBase}/produits`, label: 'Gérer les produits' } : undefined}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-responsive-cards min-w-[560px] w-full text-left text-sm">
                  <caption className="sr-only">
                    Créations de produits par membre du staff sur la période sélectionnée
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/90 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                      <th className="px-4 py-3.5 text-left">Staff</th>
                      <th className="px-3 py-3.5 text-center">Produits créés</th>
                      <th className="px-3 py-3.5 text-center">Connexions</th>
                      <th className="px-4 py-3.5 text-right text-violet-800">Fréquence hebdo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffData.map((row) => (
                      <tr key={row.staff_id} className="transition-colors hover:bg-violet-50/50">
                        <td data-label="Staff" className="px-4 py-3 sm:py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-100 text-sm font-bold text-violet-800 shadow-sm">
                              {row.staff_name?.charAt(0) ?? '?'}
                            </div>
                            <div className="font-semibold text-slate-800">{row.staff_name}</div>
                          </div>
                        </td>
                        <td
                          data-label="Produits créés"
                          className="px-3 py-3 text-center text-base font-bold tabular-nums text-slate-900 sm:py-4"
                        >
                          {row.produits_crees}
                        </td>
                        <td
                          data-label="Connexions"
                          className="px-3 py-3 text-center tabular-nums text-slate-600 sm:py-4"
                        >
                          {row.connexions}
                        </td>
                        <td
                          data-label="Fréq. hebdo"
                          className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-violet-700 sm:py-4"
                        >
                          {row.freq_hebdo_label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {chartStaff.length > 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)] md:p-6">
              <div className="mb-5">
                <h3 className="m-0 flex items-center gap-2 text-base font-bold text-violet-900">
                  <TrendingUp size={18} className="shrink-0 text-violet-600" />
                  Créations de produits par collaborateur
                </h3>
                <p className="mt-1 text-xs text-slate-500">Volume sur la période sélectionnée</p>
              </div>
              <div
                className="min-h-[240px]"
                style={{ height: Math.max(240, Math.min(520, chartStaff.length * 44)) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartStaff} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="staffInvHubGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#6d28d9" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="nom"
                      tick={{ fill: HUB.muted, fontSize: 10 }}
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
                      tick={{ fill: HUB.muted, fontSize: 11 }}
                      width={36}
                      allowDecimals={false}
                    />
                    <Tooltip {...chartTooltipLight} formatter={(v) => [`${v ?? 0}`, 'Produits créés']} />
                    <Bar
                      dataKey="produits"
                      fill="url(#staffInvHubGrad)"
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
    const rows = tenantRows;
    const totalCmd = rows.reduce((a, r) => a + r.commandes, 0);
    const totalGmv = rows.reduce((a, r) => a + r.ca_gmv, 0);
    const withActivity = rows.filter((r) => r.commandes > 0).length;
    const inactiveTenants = rows.filter((r) => !r.actif).length;
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
        nom: r.nom.length > 18 ? `${r.nom.slice(0, 18)}…` : r.nom,
        ca: r.ca_gmv,
      }));

    const topTenant = rows[0];

    const BentoKpi = ({
      accent,
      icon,
      label,
      value,
      sub,
    }: {
      accent: 'cyan' | 'emerald' | 'violet' | 'amber';
      icon: ReactNode;
      label: string;
      value: ReactNode;
      sub: string;
    }) => {
      const ring =
        accent === 'cyan'
          ? 'from-cyan-500/25 to-transparent'
          : accent === 'emerald'
            ? 'from-emerald-500/20 to-transparent'
            : accent === 'violet'
              ? 'from-violet-500/20 to-transparent'
              : 'from-amber-500/20 to-transparent';
      return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 sm:p-6 transition-transform duration-300 hover:-translate-y-0.5 hover:border-cyan-500/25">
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ring} opacity-80`}
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 text-cyan-300 shadow-inner">
                {icon}
              </div>
              <ArrowUpRight
                size={18}
                className="text-slate-600 opacity-0 transition-opacity group-hover:opacity-100"
                strokeWidth={2}
              />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl sm:text-[1.65rem] font-bold tracking-tight text-white tabular-nums leading-none">
                {value}
              </p>
              <p className="mt-2 text-xs text-slate-500 leading-snug">{sub}</p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-8 lg:space-y-10">
        {/* Grille bento — métriques clés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          <BentoKpi
            accent="cyan"
            icon={<ShoppingCart size={22} strokeWidth={2} />}
            label="Volume commandes"
            value={totalCmd.toLocaleString('fr-FR')}
            sub="Toutes organisations · période sélectionnée"
          />
          <BentoKpi
            accent="emerald"
            icon={<Banknote size={22} strokeWidth={2} />}
            value={
              <span className="text-[1.35rem] sm:text-[1.65rem]">
                {totalGmv.toLocaleString('fr-FR')}{' '}
                <span className="text-sm font-semibold text-slate-400">CFA</span>
              </span>
            }
            label="CA livré (GMV)"
            sub="Sur commandes livrées / terminées"
          />
          <BentoKpi
            accent="violet"
            icon={<Building2 size={22} strokeWidth={2} />}
            value={
              <span>
                {withActivity}
                <span className="text-slate-500 text-lg font-semibold"> / {rows.length}</span>
              </span>
            }
            label="Boutiques actives"
            sub={`${inactiveTenants} compte(s) inactif(s) au catalogue`}
          />
          <BentoKpi
            accent="amber"
            icon={<TrendingUp size={22} strokeWidth={2} />}
            value={
              <span>
                {avgSuccPlat}
                <span className="text-cyan-400/90">%</span>
              </span>
            }
            label="Taux livraison"
            sub="Moyenne pondérée par missions terrain"
          />
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
              <div className="rounded-2xl border border-dashed border-slate-600/50 p-8 text-center text-slate-500 text-sm">
                Aucune activité sur cette période — élargissez la fenêtre temporelle.
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
                        <linearGradient id="gmvBarGrad" x1="0" y1="0" x2="1" y2="0">
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
                        fill="url(#gmvBarGrad)"
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
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-cyan-950/30 to-transparent">
                <div>
                  <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Matrice <span style={{ color: C.primary }}>tenants</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tri par CA décroissant · données temps réel</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-slate-800/80 border border-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-400">
                  <Lightbulb size={14} className="text-amber-400/90 shrink-0" />
                  Vue opérationnelle
                </div>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-[13px] min-w-[880px]">
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
                      <th className="pl-2 pr-5 py-3.5 font-bold text-right">CA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr
                        key={r.tenant_id}
                        className="border-b border-white/[0.04] transition-colors hover:bg-cyan-500/[0.04]"
                      >
                        <td className="pl-5 pr-2 py-3.5 text-slate-600 font-mono text-xs tabular-nums">{idx + 1}</td>
                        <td className="px-2 py-3.5">
                          <div className="font-semibold text-slate-100">{r.nom}</div>
                          <div className="text-[11px] text-cyan-500/75 font-medium mt-0.5">/{r.slug || '—'}</div>
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
                        <td className="pl-2 pr-5 py-3.5 text-right font-semibold tabular-nums text-white">
                          {r.ca_gmv.toLocaleString('fr-FR')}{' '}
                          <span className="text-slate-500 text-[11px] font-medium">CFA</span>
                        </td>
                      </tr>
                    ))}
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

  const tabDefs: { id: TabType; label: string; sub: string; icon: typeof Truck }[] = [
    { id: 'logistique', label: 'Logistique', sub: 'Livraisons & retours', icon: Truck },
    { id: 'call-center', label: "Centre d'appel", sub: 'Validations & relances', icon: PhoneCall },
    { id: 'inventaire', label: 'Inventaire', sub: 'Création de produits', icon: Package },
  ];

  const renderPeriodFiltersHubLight = () => (
    <div
      className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200 shadow-sm"
      role="group"
      aria-label="Période"
    >
      {(
        [
          { id: 'mois' as const, label: 'Ce mois' },
          { id: '7jours' as const, label: '7 jours' },
          { id: 'aujourdhui' as const, label: "Aujourd'hui" },
          { id: 'toujours' as const, label: 'Toujours' },
        ] as const
      ).map((f) => {
        const on = filter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              'px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[38px]',
              on
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                : 'text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );

  if (moduleChrome) {
    return (
      <div className="nexus-module-frame mx-auto w-full max-w-[1400px] animate-pageEnter px-0">
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)]">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-200/90 bg-violet-100 text-violet-700 shadow-sm">
                  <Target size={22} strokeWidth={2} aria-hidden />
                </div>
                <h1
                  className="m-0 text-2xl font-bold tracking-tight text-violet-900 sm:text-[1.65rem]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Hub Performance Équipe
                </h1>
              </div>
              <p className="m-0 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 sm:text-[0.95rem]">
                {subtitle}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end lg:pt-1">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {renderPeriodFiltersHubLight()}
                <button
                  type="button"
                  onClick={() => fetchData()}
                  disabled={loading}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Actualiser les données"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden />
                  Actualiser
                </button>
                <button
                  type="button"
                  onClick={exportHubTableCsv}
                  disabled={loading || !!loadError}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Exporter le tableau visible en CSV"
                >
                  <Download size={15} aria-hidden />
                  CSV
                </button>
              </div>
              {dataUpdatedAt && !loadError ? (
                <p className="m-0 text-right text-[11px] text-slate-400">
                  Mis à jour :{' '}
                  {dataUpdatedAt.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {loadError ? (
          <div
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-red-900 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0" size={20} aria-hidden />
              <div>
                <p className="m-0 font-semibold">Chargement impossible</p>
                <p className="mt-1 mb-0 text-sm text-red-800/90">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchData()}
              className="shrink-0 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Réessayer
            </button>
          </div>
        ) : null}

        {!tenantId ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Initialisation…</p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Départements">
              {tabDefs.map((tab) => {
                const active = activeTab === tab.id;
                const Icon = tab.icon;
                const iconBg =
                  tab.id === 'logistique'
                    ? 'border-sky-200/80 bg-sky-100 text-sky-700'
                    : tab.id === 'call-center'
                      ? 'border-blue-200/80 bg-blue-100 text-blue-700'
                      : 'border-fuchsia-200/80 bg-fuchsia-100 text-fuchsia-800';
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'flex min-h-[5.5rem] items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all sm:min-h-0 sm:p-5',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                      active
                        ? 'border-violet-500 bg-violet-50/95 shadow-md ring-1 ring-violet-200/90'
                        : 'border-slate-200/90 bg-white shadow-sm hover:border-slate-300 hover:shadow-md',
                    ].join(' ')}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}
                    >
                      <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-bold text-slate-900">{tab.label}</div>
                      <div className="mt-0.5 text-[13px] leading-snug text-slate-500">{tab.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>

              {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                  <p className="m-0 text-sm font-medium text-slate-600">Chargement des indicateurs…</p>
                </div>
                <HubTableSkeleton rows={6} cols={3} />
              </div>
            ) : loadError ? null : (
              <div style={{ animation: 'fadeIn 0.35s ease' }}>
                {hubStripeItems ? <HubKpiStrip items={hubStripeItems} /> : null}
                {activeTab === 'logistique' && renderLogistics()}
                {activeTab === 'call-center' && renderCallCenter()}
                {activeTab === 'inventaire' && renderInventory()}
              </div>
            )}
          </>
        )}
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
      <div
        className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 pb-16 ${
          isSuperAdmin ? 'max-w-[1400px]' : 'max-w-[1400px]'
        }`}
      >
        {isSuperAdmin ? (
          <header className="relative mb-10 lg:mb-12 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0c1222] via-[#0a0f1a] to-[#060911] px-6 py-8 sm:px-10 sm:py-10 shadow-[0_0_0_1px_rgba(6,182,212,0.08),0_40px_80px_-20px_rgba(0,0,0,0.65)]">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-indigo-600/10 blur-[80px]"
              aria-hidden
            />
            <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/95">
                  <Sparkles size={12} className="text-cyan-400" strokeWidth={2.5} />
                  Nexus · Intelligence multi-tenant
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
                    Performance des boutiques
                  </span>
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                  Tableau de bord opérationnel : comparez le volume, le CA (GMV) et la qualité de livraison de chaque
                  organisation sur la période sélectionnée.
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
        ) : (
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
        )}

        {isSuperAdmin ? null : (
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
        )}

        {loading ? (
          <div
            className={`flex flex-col items-center justify-center py-20 sm:py-28 rounded-2xl border border-white/[0.08] ${
              isSuperAdmin ? '' : 'bg-gradient-to-b from-slate-900/40 to-transparent'
            }`}
            style={{ background: isSuperAdmin ? 'var(--surface)' : undefined }}
          >
            <div className="relative">
              <div className="w-12 h-12 border-2 border-cyan-500/25 border-t-cyan-400 rounded-full animate-spin" />
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" aria-hidden />
            </div>
            <p className="mt-6 text-sm font-medium text-slate-400">Chargement des indicateurs…</p>
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
