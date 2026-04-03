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

/** Extrait l’UUID depuis la réponse brute POST /api/auth/users (formes variables). */
export function extractUserIdFromAuthPayload(authData: unknown): string {
  if (!authData || typeof authData !== 'object') return '';
  const r = authData as Record<string, unknown>;
  const u = (r.user ?? r.User) as Record<string, unknown> | undefined;
  if (u && typeof u === 'object') {
    const id = u.id ?? u.userId ?? u.sub;
    if (typeof id === 'string' && id.length > 0) return id;
  }
  for (const k of ['userId', 'user_id']) {
    const v = r[k];
    if (typeof v === 'string' && v.length > 0) return v;
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
