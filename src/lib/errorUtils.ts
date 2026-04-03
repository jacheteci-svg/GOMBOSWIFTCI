/**
 * Message lisible pour l’UI à partir d’une erreur API (PostgREST / InsForge / Error).
 * Les SDK renvoient souvent un objet plain, pas une instance de Error.
 */
export function getErrorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (err instanceof Error) return err.message || fallback;
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    const parts: string[] = [];
    if (o.message != null) parts.push(String(o.message));
    if (o.details != null) parts.push(String(o.details));
    if (o.hint != null) parts.push(String(o.hint));
    if (parts.length) return parts.join(' — ');
  }
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}
