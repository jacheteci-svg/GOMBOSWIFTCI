import { insforge } from '../lib/insforge';
import type { Commande, StatutCommande } from '../types';

export type PerformanceFilter = 'mois' | '7jours' | 'aujourdhui' | 'toujours';

export interface LogisticsPerfRow {
  livreur_id: string;
  nom: string;
  sorties: number;
  reussies: number;
  retours: number;
  annules: number;
  reportes: number;
  ca_frais: number;
  success_rate: number;
}

export interface CallCenterPerfRow {
  agent_id: string;
  staff_name: string;
  total_handled: number;
  total_validations: number;
  total_delivered: number;
  success_rate: number;
}

export interface InventoryPerfRow {
  sku: string;
  nom: string;
  stock_actuel: number;
  stock_minimum: number;
  rotation_index: number;
  ventes_periode?: number;
}

/** Ligne agrégée par boutique (vue Super Admin — suivi des tenants) */
export interface TenantPerfRow {
  tenant_id: string;
  nom: string;
  slug: string;
  plan: string;
  actif: boolean;
  users_count: number;
  commandes: number;
  livrees: number;
  annules: number;
  ca_gmv: number;
  /** Missions terrain (statuts logistique) sur la période */
  sorties_terrain: number;
  /** % de livraisons réussies parmi les sorties terrain */
  success_rate: number;
}

const norm = (s: string | undefined) => (s || '').toLowerCase();

/** Même logique que le Dashboard : création ou livraison effective dans la fenêtre */
export function commandeInDateRange(
  c: Pick<Commande, 'date_creation' | 'date_livraison_effective'>,
  start: Date,
  end: Date
): boolean {
  const dCreated = new Date(c.date_creation);
  const dDelivered = c.date_livraison_effective ? new Date(c.date_livraison_effective as any) : null;
  const createdInRange = dCreated >= start && dCreated <= end;
  const deliveredInRange = dDelivered && dDelivered >= start && dDelivered <= end;
  return createdInRange || !!deliveredInRange;
}

export function getDateRangeForFilter(f: PerformanceFilter): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  if (f === 'aujourdhui') {
    start.setHours(0, 0, 0, 0);
  } else if (f === '7jours') {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (f === 'mois') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setFullYear(start.getFullYear() - 5);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

const STATUT_TERRAIN: StatutCommande[] = [
  'en_cours_livraison',
  'livree',
  'terminee',
  'echouee',
  'retour_livreur',
  'retour_stock',
  'annulee',
];

function isTerrainLivreur(s: string | undefined): boolean {
  return STATUT_TERRAIN.includes((s || '') as StatutCommande);
}

export async function fetchUserNameMap(
  tenantId: string | null,
  isSuperAdmin: boolean
): Promise<Map<string, string>> {
  let q = insforge.database.from('users').select('id, nom_complet');
  if (!isSuperAdmin && tenantId) q = q.eq('tenant_id', tenantId);
  const { data, error } = await q;
  if (error) console.error('fetchUserNameMap', error);
  const m = new Map<string, string>();
  (data || []).forEach((u: { id: string; nom_complet: string }) => m.set(u.id, u.nom_complet || '—'));
  return m;
}

async function fetchCommandesForPerformance(
  tenantId: string | null,
  isSuperAdmin: boolean
): Promise<Commande[]> {
  let q = insforge.database
    .from('commandes')
    .select(
      'id, tenant_id, livreur_id, agent_appel_id, statut_commande, frais_livraison, date_creation, date_livraison_effective, date_validation_appel'
    );
  if (!isSuperAdmin && tenantId) q = q.eq('tenant_id', tenantId);
  const { data, error } = await q;
  if (error) {
    console.error('fetchCommandesForPerformance', error);
    return [];
  }
  return (data || []) as Commande[];
}

function aggregateLogistics(
  commandes: Commande[],
  range: { start: Date; end: Date },
  livreurNames: Map<string, string>
): LogisticsPerfRow[] {
  const byLiv = new Map<
    string,
    { sorties: number; reussies: number; retours: number; annules: number; reportes: number; ca: number }
  >();

  const ensure = (id: string) => {
    if (!byLiv.has(id)) {
      byLiv.set(id, { sorties: 0, reussies: 0, retours: 0, annules: 0, reportes: 0, ca: 0 });
    }
    return byLiv.get(id)!;
  };

  for (const c of commandes) {
    if (!c.livreur_id) continue;
    if (!commandeInDateRange(c, range.start, range.end)) continue;
    const st = norm(c.statut_commande);
    if (!isTerrainLivreur(c.statut_commande)) continue;

    const row = ensure(c.livreur_id);
    row.sorties += 1;

    if (st === 'livree' || st === 'terminee') {
      row.reussies += 1;
      const frais = Number(c.frais_livraison);
      row.ca += Number.isFinite(frais) ? frais : 0;
    } else if (st === 'retour_livreur' || st === 'retour_stock') {
      row.retours += 1;
    } else if (st === 'annulee') {
      row.annules += 1;
    } else if (st === 'echouee') {
      row.reportes += 1;
    }
  }

  const out: LogisticsPerfRow[] = [];
  byLiv.forEach((v, livreurId) => {
    const success_rate = v.sorties > 0 ? Math.round((v.reussies / v.sorties) * 100) : 0;
    out.push({
      livreur_id: livreurId,
      nom: livreurNames.get(livreurId) || 'Livreur',
      sorties: v.sorties,
      reussies: v.reussies,
      retours: v.retours,
      annules: v.annules,
      reportes: v.reportes,
      ca_frais: Math.round(v.ca),
      success_rate,
    });
  });

  return out.sort((a, b) => b.success_rate - a.success_rate);
}

function aggregateCallCenter(
  commandes: Commande[],
  range: { start: Date; end: Date },
  agentNames: Map<string, string>
): CallCenterPerfRow[] {
  const byAgent = new Map<string, { handled: number; validations: number; delivered: number }>();

  const ensure = (id: string) => {
    if (!byAgent.has(id)) {
      byAgent.set(id, { handled: 0, validations: 0, delivered: 0 });
    }
    return byAgent.get(id)!;
  };

  const postAppel = (st: string) =>
    !['en_attente_appel', 'a_rappeler', 'nouvelle'].includes(st);

  for (const c of commandes) {
    if (!c.agent_appel_id) continue;
    if (!commandeInDateRange(c, range.start, range.end)) continue;
    const st = norm(c.statut_commande);
    const row = ensure(c.agent_appel_id);
    row.handled += 1;
    if (postAppel(st)) row.validations += 1;
    if (st === 'livree' || st === 'terminee') row.delivered += 1;
  }

  const out: CallCenterPerfRow[] = [];
  byAgent.forEach((v, agentId) => {
    const success_rate = v.handled > 0 ? Math.round((v.delivered / v.handled) * 100) : 0;
    out.push({
      agent_id: agentId,
      staff_name: agentNames.get(agentId) || 'Agent',
      total_handled: v.handled,
      total_validations: v.validations,
      total_delivered: v.delivered,
      success_rate,
    });
  });

  return out.sort((a, b) => b.success_rate - a.success_rate);
}

async function fetchInventoryFromSources(
  tenantId: string | null,
  isSuperAdmin: boolean,
  commandes: Commande[],
  range: { start: Date; end: Date }
): Promise<InventoryPerfRow[]> {
  let pq = insforge.database
    .from('produits')
    .select('id, sku, nom, stock_actuel, stock_minimum, tenant_id');
  if (!isSuperAdmin && tenantId) pq = pq.eq('tenant_id', tenantId);
  const { data: produits, error: pe } = await pq;
  if (pe) {
    console.error('produits performance', pe);
    return [];
  }

  const cmdsInRange = commandes.filter((c) => commandeInDateRange(c, range.start, range.end));
  const cmdIds = cmdsInRange.map((c) => c.id);
  if (cmdIds.length === 0) {
    return (produits || []).map((p: any) => ({
      sku: p.sku || p.id,
      nom: p.nom,
      stock_actuel: Number(p.stock_actuel) || 0,
      stock_minimum: Number(p.stock_minimum) || 0,
      rotation_index: 0,
      ventes_periode: 0,
    }));
  }

  const chunk = <T,>(arr: T[], size: number) => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const ventesByProduct = new Map<string, number>();
  for (const part of chunk(cmdIds, 80)) {
    const { data: lignes, error: le } = await insforge.database
      .from('lignes_commandes')
      .select('produit_id, quantite')
      .in('commande_id', part);
    if (le) {
      console.error('lignes performance', le);
      continue;
    }
    for (const l of lignes || []) {
      const pid = (l as any).produit_id;
      const q = Number((l as any).quantite) || 0;
      ventesByProduct.set(pid, (ventesByProduct.get(pid) || 0) + q);
    }
  }

  return (produits || []).map((p: any) => {
    const ventes = ventesByProduct.get(p.id) || 0;
    const stock = Number(p.stock_actuel) || 0;
    const smin = Number(p.stock_minimum) || 0;
    const denom = stock + ventes;
    const rotation_index = denom > 0 ? Math.min(100, Math.round((ventes / denom) * 100)) : 0;
    return {
      sku: p.sku || p.id,
      nom: p.nom,
      stock_actuel: stock,
      stock_minimum: smin,
      rotation_index,
      ventes_periode: ventes,
    };
  });
}

/**
 * Chiffres réels à partir des commandes, utilisateurs et produits (hors vues matérialisées).
 */
export async function loadPerformanceDashboardData(
  tenantId: string | undefined,
  isSuperAdmin: boolean | undefined,
  filter: PerformanceFilter
): Promise<{
  logistique: LogisticsPerfRow[];
  callCenter: CallCenterPerfRow[];
  inventaire: InventoryPerfRow[];
}> {
  const range = getDateRangeForFilter(filter);
  const [commandes, names] = await Promise.all([
    fetchCommandesForPerformance(tenantId || null, !!isSuperAdmin),
    fetchUserNameMap(tenantId || null, !!isSuperAdmin),
  ]);

  const logistique = aggregateLogistics(commandes, range, names);
  const callCenter = aggregateCallCenter(commandes, range, names);
  const inventaire = await fetchInventoryFromSources(tenantId || null, !!isSuperAdmin, commandes, range);

  return { logistique, callCenter, inventaire };
}

/**
 * Performance multi-tenant : une ligne par boutique (commandes réelles sur la période).
 * Réservé au Super Admin.
 */
export async function loadSuperAdminTenantPerformance(
  filter: PerformanceFilter
): Promise<TenantPerfRow[]> {
  const range = getDateRangeForFilter(filter);

  const [{ data: tenantsData, error: te }, { data: usersData, error: ue }, { data: cmdData, error: ce }] =
    await Promise.all([
      insforge.database.from('tenants').select('id, nom, slug, plan, actif').order('nom', { ascending: true }),
      insforge.database.from('users').select('tenant_id'),
      insforge.database
        .from('commandes')
        .select(
          'tenant_id, statut_commande, montant_total, montant_encaisse, date_creation, date_livraison_effective'
        ),
    ]);

  if (te) console.error('tenants performance', te);
  if (ue) console.error('users performance', ue);
  if (ce) console.error('commandes performance SA', ce);

  const usersByTenant = new Map<string, number>();
  for (const u of usersData || []) {
    const tid = (u as { tenant_id: string }).tenant_id;
    if (!tid) continue;
    usersByTenant.set(tid, (usersByTenant.get(tid) || 0) + 1);
  }

  type Acc = {
    commandes: number;
    livrees: number;
    annules: number;
    sorties: number;
    ca: number;
  };
  const byTenant = new Map<string, Acc>();

  const ensure = (tid: string): Acc => {
    if (!byTenant.has(tid)) {
      byTenant.set(tid, { commandes: 0, livrees: 0, annules: 0, sorties: 0, ca: 0 });
    }
    return byTenant.get(tid)!;
  };

  const cmds = (cmdData || []) as Commande[];
  for (const c of cmds) {
    if (!c.tenant_id) continue;
    if (!commandeInDateRange(c, range.start, range.end)) continue;

    const row = ensure(c.tenant_id);
    row.commandes += 1;

    const st = norm(c.statut_commande);

    if (st === 'livree' || st === 'terminee') {
      row.livrees += 1;
      const m =
        Number(c.montant_encaisse) > 0
          ? Number(c.montant_encaisse)
          : Number(c.montant_total) || 0;
      row.ca += Number.isFinite(m) ? m : 0;
    } else if (st === 'annulee') {
      row.annules += 1;
    }

    if (isTerrainLivreur(c.statut_commande)) {
      row.sorties += 1;
    }
  }

  const rows: TenantPerfRow[] = (tenantsData || []).map((t: any) => {
    const acc = byTenant.get(t.id) || {
      commandes: 0,
      livrees: 0,
      annules: 0,
      sorties: 0,
      ca: 0,
    };
    const liv = acc.livrees;
    const sortiesTerrain = acc.sorties;
    const success_rate =
      sortiesTerrain > 0 ? Math.min(100, Math.round((liv / sortiesTerrain) * 100)) : liv > 0 ? 100 : 0;

    return {
      tenant_id: t.id,
      nom: t.nom || 'Sans nom',
      slug: t.slug || '',
      plan: t.plan || '—',
      actif: !!t.actif,
      users_count: usersByTenant.get(t.id) || 0,
      commandes: acc.commandes,
      livrees: acc.livrees,
      annules: acc.annules,
      ca_gmv: Math.round(acc.ca),
      sorties_terrain: acc.sorties,
      success_rate,
    };
  });

  return rows.sort((a, b) => b.ca_gmv - a.ca_gmv || b.commandes - a.commandes);
}
