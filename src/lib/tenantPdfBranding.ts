import type { Tenant } from '../types';

/** Données affichées sur factures / feuilles de route (tenant, pas la marque SaaS). */
export interface TenantPdfBranding {
  nom: string;
  email_contact?: string;
  telephone_contact?: string;
  adresse_siege?: string;
  logo_url?: string;
  /** Bandeau / visuel complémentaire (charte, logo secondaire, etc.) — cf. settings.document_visuel_url */
  document_visuel_url?: string;
}

export function tenantToPdfBranding(t: Tenant | null | undefined): TenantPdfBranding | undefined {
  if (!t) return undefined;
  const s =
    t.settings && typeof t.settings === 'object' && !Array.isArray(t.settings)
      ? (t.settings as Record<string, unknown>)
      : {};
  const logoFromSettings = (s.logo_url as string) || (s.logo as string);
  const visuel =
    (s.document_visuel_url as string) ||
    (s.cv_url as string) ||
    (s.logo_document_url as string) ||
    undefined;
  return {
    nom: (t.nom || 'Entreprise').trim(),
    email_contact: t.email_contact,
    telephone_contact: t.telephone_contact,
    adresse_siege: [s.adresse_siege, s.adresse].find((x) => typeof x === 'string' && String(x).trim()) as string | undefined,
    logo_url: t.logo_url || logoFromSettings,
    document_visuel_url: visuel,
  };
}

export async function loadImageDataUrl(
  url: string
): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  const u = url?.trim();
  if (!u) return null;
  try {
    const res = await fetch(u, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type || '';
    const format: 'PNG' | 'JPEG' = mime.includes('png') ? 'PNG' : 'JPEG';
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => reject(new Error('read'));
      r.readAsDataURL(blob);
    });
    return { dataUrl, format };
  } catch {
    return null;
  }
}

export function sanitizeFileSegment(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'doc';
}
