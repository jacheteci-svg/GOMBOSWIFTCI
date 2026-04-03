import type { Commande } from '../types';

/** Texte sans astérisques parasites (WhatsApp utilise * pour le gras) */
function safe(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/\*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Gras WhatsApp : *texte* */
export function waBold(s: string | number | undefined | null): string {
  const t = safe(s);
  return t ? `*${t}*` : '';
}

/**
 * Numéro international pour wa.me (ex. CI : 225XXXXXXXXX)
 */
export function normalizePhoneForWhatsApp(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  if (d.length < 8) return null;
  if (d.startsWith('225')) return d;
  if (d.startsWith('0') && d.length >= 10) return `225${d.slice(1)}`;
  return d;
}

function formatCfa(n: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} CFA`;
}

/**
 * Message client : confirmation d’enregistrement, récap (prix / lignes en gras),
 * demande de confirmation livraison + champs manquants détectés sur la commande.
 */
export function buildCentreAppelWhatsAppMessage(commande: Commande, boutiqueName: string): string {
  const nomClient = safe(commande.nom_client) || 'Cliente';
  const ref =
    safe(commande.reference) ||
    `#${commande.id.slice(0, 8).toUpperCase()}`;

  const montantTotal = Number(commande.montant_total) || 0;
  const frais = Number(commande.frais_livraison) || 0;
  const subtotal = Math.max(0, montantTotal - frais);

  const lignes = commande.lignes || [];
  let detailProduits: string;
  if (lignes.length > 0) {
    detailProduits = lignes
      .map((l) => {
        const nom = waBold(l.nom_produit);
        const q = waBold(l.quantite);
        return `• ${nom} × ${q} unité(s)`;
      })
      .join('\n');
  } else {
    detailProduits = '• (lignes de commande non chargées — ouvrez à nouveau la fiche si besoin)';
  }

  const missing: string[] = [];
  if (!commande.commune_livraison?.trim()) {
    missing.push('votre *commune* de livraison');
  }
  if (!commande.adresse_livraison?.trim()) {
    missing.push('votre *adresse précise* (quartier, rue, point de repère)');
  }
  if (!commande.telephone_client?.trim()) {
    missing.push('un *numéro de téléphone* joignable');
  }

  const blocManquant =
    missing.length > 0
      ? `Si vous confirmez la livraison, merci de nous envoyer :\n${missing.map((m) => `• ${m}`).join('\n')}`
      : `Si vous confirmez la livraison, vous n’avez *aucune information manquante* dans notre dossier : indiquez simplement *OK* pour valider.`;

  const boutique = waBold(safe(boutiqueName) || 'Notre équipe');

  return (
    `Bonjour ${waBold(nomClient)},\n\n` +
    `Votre commande ${waBold(ref)} est bien *enregistrée*.\n\n` +
    `*Détail de la commande*\n` +
    `${detailProduits}\n\n` +
    `*Montant des articles* : ${waBold(formatCfa(subtotal))}\n` +
    `*Frais de livraison* : ${waBold(formatCfa(frais))}\n` +
    `*Total à payer* : ${waBold(formatCfa(montantTotal))}\n\n` +
    `*Confirmation de livraison*\n` +
    `Merci de nous confirmer si vous validez bien la livraison de cette commande.\n\n` +
    `${blocManquant}\n\n` +
    `Cordialement,\n` +
    `${boutique}`
  );
}

export function buildWhatsAppWebUrl(phoneE164Digits: string, message: string): string {
  const text = encodeURIComponent(message);
  return `https://wa.me/${phoneE164Digits}?text=${text}`;
}
