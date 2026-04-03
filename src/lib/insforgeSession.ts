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

function readUserIdFromUserObject(u: unknown): string {
  if (!u || typeof u !== 'object') return '';
  const o = u as Record<string, unknown>;
  const id = o.id ?? o.userId ?? o.sub;
  if (typeof id === 'string' && id.length > 0) return id;
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
