import { insforge } from './insforge';

/** Snapshot session admin avant signUp (le SDK InsForge n’expose pas setSession style Supabase). */
export type AdminSessionSnapshot = {
  accessToken: string;
  user: unknown;
};

type Client = typeof insforge;

type ForgeInternal = {
  tokenManager: {
    getSession?: () => { accessToken?: string; user?: unknown } | null;
    saveSession: (s: { accessToken: string; user: unknown }) => void;
    getUser?: () => { id?: string; email?: string } | null;
  };
  getHttpClient: () => { setAuthToken: (t: string) => void };
};

function asForge(client: Client): ForgeInternal {
  return client as unknown as ForgeInternal;
}

export function snapshotAdminSession(client: Client): AdminSessionSnapshot | null {
  const tm = asForge(client).tokenManager;
  if (!tm?.getSession) return null;
  const s = tm.getSession();
  if (!s?.accessToken || !s?.user) return null;
  return { accessToken: s.accessToken, user: s.user };
}

export function restoreAdminSession(client: Client, snap: AdminSessionSnapshot | null): void {
  if (!snap?.accessToken) return;
  const c = asForge(client);
  c.tokenManager.saveSession({ accessToken: snap.accessToken, user: snap.user });
  c.getHttpClient().setAuthToken(snap.accessToken);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isLikelyUserUuid(s: string): boolean {
  return typeof s === 'string' && s.length >= 32 && UUID_RE.test(s.trim());
}

function readUserIdFromUserObject(u: unknown): string {
  if (!u || typeof u !== 'object') return '';
  const o = u as Record<string, unknown>;
  const id = o.id ?? o.userId ?? o.uuid ?? o.sub;
  if (typeof id === 'string' && id.length > 0) return id;
  const profile = o.profile;
  if (profile && typeof profile === 'object') {
    const p = profile as Record<string, unknown>;
    const pid = p.id ?? p.userId;
    if (typeof pid === 'string' && pid.length > 0) return pid;
  }
  return '';
}

/**
 * Extrait l’UUID depuis la réponse InsForge (signUp / signIn).
 * Même sans accessToken (ex. confirmation e-mail), l’API peut renvoyer `user.id`.
 */
export function extractUserIdFromAuthPayload(authData: unknown): string {
  if (!authData || typeof authData !== 'object') return '';
  const r = authData as Record<string, unknown>;

  let id = readUserIdFromUserObject(r.user ?? r.User);
  if (id) return id;

  const session = r.session;
  if (session && typeof session === 'object') {
    id = readUserIdFromUserObject((session as Record<string, unknown>).user);
    if (id) return id;
  }

  const data = r.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    id = readUserIdFromUserObject(d.user ?? d.User);
    if (id) return id;
  }

  for (const k of ['userId', 'user_id']) {
    const v = r[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }

  // Corps brut POST /api/auth/users (InsForge) : parfois id au niveau racine
  if (typeof r.id === 'string' && isLikelyUserUuid(r.id)) return r.id;

  const account = r.account;
  if (account && typeof account === 'object') {
    id = readUserIdFromUserObject(account);
    if (id) return id;
  }

  const createdUser = r.createdUser ?? r.created_user;
  if (createdUser) {
    id = readUserIdFromUserObject(createdUser);
    if (id) return id;
  }

  return '';
}

/** ID session courante uniquement si l’e-mail correspond (évite de réutiliser l’ID admin). */
export function getUserIdFromSessionIfEmailMatches(
  client: Client,
  expectedEmail: string
): string {
  const u = asForge(client).tokenManager.getUser?.();
  if (!u?.id || !expectedEmail) return '';
  const a = String(u.email || '').toLowerCase();
  const b = expectedEmail.toLowerCase();
  if (a && a === b) return u.id;
  return '';
}
