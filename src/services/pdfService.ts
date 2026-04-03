import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Commande, LigneCommande } from '../types';
import {
  loadImageDataUrl,
  sanitizeFileSegment,
  type TenantPdfBranding,
} from '../lib/tenantPdfBranding';

/**
 * Standardized Price Formatter for PDFs
 * Uses '.' as thousands separator and ensures bold formatting.
 */
const fP = (num: number) => {
  if (num === undefined || num === null) return "0";
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/** Aligné sur la palette app (--primary cyan ~ rgb(6,182,212)) */
const PDF_PRIMARY: [number, number, number] = [6, 182, 212];

// Extend jsPDF type to include autotable
interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

async function drawTenantHeaderLeft(
  doc: jsPDF,
  branding: TenantPdfBranding | undefined,
  pageWidth: number,
  top: number
): Promise<number> {
  const b = branding;
  let textX = 20;
  let cursorY = top;

  if (b?.logo_url) {
    const img = await loadImageDataUrl(b.logo_url);
    if (img) {
      doc.addImage(img.dataUrl, img.format, 20, top, 30, 22);
      textX = 54;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(PDF_PRIMARY[0], PDF_PRIMARY[1], PDF_PRIMARY[2]);
  doc.text(b?.nom?.trim() || 'Entreprise', textX, top + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  let lineY = top + 15;
  if (b?.email_contact) {
    doc.text(b.email_contact, textX, lineY);
    lineY += 4.5;
  }
  if (b?.telephone_contact) {
    doc.text(`Tél. ${b.telephone_contact}`, textX, lineY);
    lineY += 4.5;
  }
  if (b?.adresse_siege?.trim()) {
    const addrLines = doc.splitTextToSize(b.adresse_siege.trim(), pageWidth - textX - 25);
    doc.text(addrLines, textX, lineY);
    lineY += 4.2 * addrLines.length;
  }

  cursorY = Math.max(top + 26, lineY + 2);
  return cursorY;
}

/**
 * Facture PDF : en-tête = société du tenant (nom, contacts, adresse, logo), pas la marque SaaS.
 */
export const generateInvoicePDF = async (
  commande: Commande & { lignes: LigneCommande[] },
  branding?: TenantPdfBranding
) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.width;

  const headerBottom = await drawTenantHeaderLeft(doc, branding, pageWidth, 16);

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', pageWidth - 20, 22, { align: 'right' });

  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: #${(commande.id || '0000').substring(0, 8).toUpperCase()}`, pageWidth - 20, 30, { align: 'right' });
  doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 20, 36, { align: 'right' });

  const sepY = headerBottom + 6;
  doc.setDrawColor(241, 245, 249);
  doc.line(20, sepY, pageWidth - 20, sepY);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATAIRE :', 20, sepY + 10);

  doc.setFontSize(12);
  doc.text(commande.nom_client || 'Client', 20, sepY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tel: ${commande.telephone_client || 'Non renseigné'}`, 20, sepY + 24);
  doc.text(`Zone: ${commande.commune_livraison || ''}`, 20, sepY + 30);
  doc.text(`Adresse: ${commande.adresse_livraison || ''}`, 20, sepY + 36);

  const tableRows = (commande.lignes || []).map((l, index) => [
    index + 1,
    l.nom_produit,
    l.quantite,
    `${fP(l.prix_unitaire || 0)} CFA`,
    `${fP(l.montant_ligne || 0)} CFA`,
  ]);

  autoTable(doc, {
    startY: sepY + 44,
    head: [['#', 'Désignation', 'Qté', 'Prix Unitaire', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: PDF_PRIMARY,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
      4: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  const subtotal = (commande.lignes || []).reduce((acc, l) => acc + (l.montant_ligne || 0), 0);
  const delivery = commande.frais_livraison || 0;
  const total = subtotal + delivery;

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total :', pageWidth - 80, finalY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${fP(subtotal)} CFA`, pageWidth - 20, finalY + 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Frais de livraison :', pageWidth - 80, finalY + 17);
  doc.setFont('helvetica', 'bold');
  doc.text(`${fP(delivery)} CFA`, pageWidth - 20, finalY + 17, { align: 'right' });

  doc.setDrawColor(PDF_PRIMARY[0], PDF_PRIMARY[1], PDF_PRIMARY[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 85, finalY + 22, pageWidth - 20, finalY + 22);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL À PAYER :', pageWidth - 85, finalY + 32);
  doc.text(`${fP(total)} CFA`, pageWidth - 20, finalY + 32, { align: 'right' });

  let footerY = finalY + 42;
  if (branding?.document_visuel_url) {
    const vis = await loadImageDataUrl(branding.document_visuel_url);
    if (vis) {
      const w = 75;
      const h = 22;
      doc.addImage(vis.dataUrl, vis.format, (pageWidth - w) / 2, footerY, w, h);
      footerY += h + 6;
    }
  }

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  doc.text('Merci pour votre confiance.', pageWidth / 2, Math.min(footerY, 255), { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 190, 200);
  const legal = doc.splitTextToSize(
    'Document généré par la plateforme GomboSwiftCI — les coordonnées du haut sont celles de votre entreprise.',
    pageWidth - 36
  );
  doc.text(legal, pageWidth / 2, 282, { align: 'center' });

  const slug = sanitizeFileSegment(branding?.nom || 'facture');
  doc.save(`Facture_${slug}_${(commande.id || '0000').substring(0, 8).toUpperCase()}.pdf`);
};

export const generateDeliverySlipPDF = async (
  feuilleRoute: any,
  commandes: Commande[],
  branding?: TenantPdfBranding
) => {
  if (!feuilleRoute || !feuilleRoute.id) {
    console.error('Impossible de générer le PDF : ID de feuille de route manquant.');
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a4') as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const lightGrey: [number, number, number] = [226, 232, 240];
  const darkText: [number, number, number] = [30, 41, 59];

  const displayDate = feuilleRoute.date ? new Date(feuilleRoute.date) : new Date();

  let startY = 12;
  if (branding?.logo_url) {
    const img = await loadImageDataUrl(branding.logo_url);
    if (img) {
      doc.addImage(img.dataUrl, img.format, 15, 8, 26, 18);
      startY = 14;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PDF_PRIMARY[0], PDF_PRIMARY[1], PDF_PRIMARY[2]);
  doc.text(branding?.nom?.trim() || 'Entreprise', branding?.logo_url ? 44 : 15, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  let infoY = 19;
  if (branding?.telephone_contact) {
    doc.text(`Tél. ${branding.telephone_contact}`, branding?.logo_url ? 44 : 15, infoY);
    infoY += 4;
  }
  if (branding?.email_contact) {
    doc.text(branding.email_contact, branding?.logo_url ? 44 : 15, infoY);
    infoY += 4;
  }
  if (branding?.adresse_siege?.trim()) {
    const lines = doc.splitTextToSize(branding.adresse_siege.trim(), 90);
    doc.text(lines, branding?.logo_url ? 44 : 15, infoY);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(`Feuille de route — ${format(displayDate, 'dd/MM/yyyy')}`, pageWidth - 15, 12, { align: 'right' });

  const livreurUser = feuilleRoute.users;
  const livreurObj = Array.isArray(livreurUser) ? livreurUser[0] : livreurUser;
  const livreurNom =
    livreurObj?.nom_complet || feuilleRoute.nom_livreur || 'Livreur';
  const livreurTel = livreurObj?.telephone || '-';

  const totalObjectif = (commandes || []).reduce((acc, c) => acc + (Number(c.montant_total) || 0), 0);

  autoTable(doc, {
    startY: Math.max(startY + 22, 28),
    margin: { left: 15, right: 15 },
    head: [['Nom & Prénoms du Livreur', 'Téléphone', 'Nombre de colis', 'Somme totale à encaisser (CFA)']],
    body: [[livreurNom.toUpperCase(), livreurTel, commandes.length.toString(), fP(totalObjectif)]],
    theme: 'grid',
    headStyles: { fillColor: lightGrey, textColor: darkText, fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 2, textColor: darkText },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 },
      3: { cellWidth: 'auto', fontStyle: 'bold', fontSize: 12 },
    },
  });

  const lastY1 = (doc as any).lastAutoTable.finalY + 5;
  autoTable(doc, {
    startY: lastY1,
    margin: { left: 15, right: 15 },
    head: [['Colis retournés', 'Colis livrés', 'Somme à verser à la caisse', 'Reste à percevoir']],
    body: [[' ', ' ', ' ', ' ']],
    theme: 'grid',
    headStyles: { fillColor: lightGrey, textColor: darkText, fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 2, textColor: darkText },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 65 },
      2: { cellWidth: 85 },
      3: { cellWidth: 'auto' },
    },
  });

  const lastY2 = (doc as any).lastAutoTable.finalY + 8;
  const tableRows = (commandes || []).map((c) => {
    const itemsStr = (c.lignes || [])
      .map((l: LigneCommande) => `${l.nom_produit} (x${l.quantite})`)
      .join('\n');

    const puStr = (c.lignes || []).map((l: LigneCommande) => `${fP(l.prix_unitaire || 0)}`).join('\n');

    const qtyStr = (c.lignes || []).map((l: LigneCommande) => `${l.quantite}`).join('\n');

    return [
      `#${(c.id || '').substring(0, 8).toUpperCase()}`,
      itemsStr || 'SANS ARTICLES',
      ' ',
      c.nom_client || 'Client',
      puStr || '0',
      `${fP(c.frais_livraison || 0)}`,
      qtyStr || '0',
      `${fP(c.montant_total || 0)}`,
      c.telephone_client || '-',
      `${c.commune_livraison || ''} - ${c.adresse_livraison || ''}`.trim() || '-',
      ' ',
    ];
  });

  autoTable(doc, {
    startY: lastY2,
    margin: { left: 15, right: 15 },
    head: [
      [
        'N°',
        'Articles commandés',
        'Taille',
        'Client',
        'P.U.',
        'Frais',
        'Qté',
        'Net à payer',
        'Téléphone',
        'Zone / Lieu',
        'Observation',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: lightGrey, textColor: darkText, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: darkText },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 60 },
      2: { cellWidth: 15 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20, fontStyle: 'bold' },
      5: { cellWidth: 20, fontStyle: 'bold' },
      6: { cellWidth: 10 },
      7: { cellWidth: 25, fontStyle: 'bold', fontSize: 10 },
      8: { cellWidth: 30 },
      9: { cellWidth: 25 },
      10: { cellWidth: 'auto' },
    },
  });

  const tableEndY = (doc as any).lastAutoTable.finalY;

  if (branding?.document_visuel_url) {
    const vis = await loadImageDataUrl(branding.document_visuel_url);
    if (vis) {
      const w = 70;
      const h = 20;
      doc.addImage(vis.dataUrl, vis.format, 15, tableEndY + 6, w, h);
    }
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Signature livreur (précédée de « Reçu »)", 15, tableEndY + 32);
  doc.text('Cachet & signature logistique', pageWidth - 15, tableEndY + 32, { align: 'right' });

  const footerY = pageHeight - 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  const contactLine = [branding?.telephone_contact ? `Tél. ${branding.telephone_contact}` : '', branding?.email_contact || '']
    .filter(Boolean)
    .join(' · ');
  doc.text(contactLine || '—', pageWidth / 2, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  if (branding?.adresse_siege?.trim()) {
    const fa = doc.splitTextToSize(branding.adresse_siege.trim(), pageWidth - 40);
    doc.text(fa, pageWidth / 2, footerY + 5, { align: 'center' });
  }

  const slug = sanitizeFileSegment(branding?.nom || 'route');
  doc.save(`FeuilleRoute_${slug}_${format(displayDate, 'dd_MM_yyyy')}.pdf`);
};

export const generateAnalyticalReportPDF = (data: any, dateString: string) => {
  try {
    const doc = new jsPDF() as jsPDFWithPlugin;
    const pageWidth = doc.internal.pageSize.width;

    if (!data || !data.commandes) {
      throw new Error("Données de rapport incomplètes");
    }

    // Header Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 255);
    doc.text("gomboswiftciCI Analysis", 20, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    
    const formattedDate = dateString ? format(new Date(dateString), 'dd MMMM yyyy', { locale: fr }) : "Date inconnue";
    doc.text(`Rapport Analytique Business du ${formattedDate}`, 20, 32);

    // Financial Summary
    const getFrais = (c: any) => {
      if (c.frais_livraison !== undefined && c.frais_livraison !== null) return Number(c.frais_livraison);
      if (['terminee', 'livree'].includes(c.statut_commande)) return 1000;
      return 0;
    };

    const succesCmds = (data.commandes || []).filter((c: any) => c.statut_commande === 'terminee' || c.statut_commande === 'livree');
    const totalEncaisseBrut = (data.retours || []).reduce((acc: number, r: any) => acc + (r.montant_remis_par_livreur || 0), 0);
    const totalFraisLivraison = succesCmds.reduce((acc: number, c: any) => acc + getFrais(c), 0);
    const totalNetProduits = totalEncaisseBrut - totalFraisLivraison;
    
    const countTotal = (data.commandes || []).length;
    const successRate = countTotal > 0 ? (succesCmds.length / countTotal) * 100 : 0;

    doc.setDrawColor(241, 245, 249);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 45, pageWidth - 40, 40, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("RÉSUMÉ FINANCIER (CFA)", 25, 53);
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(`CA Produits Net: ${fP(totalNetProduits)}`, 25, 63);
    doc.text(`Logistique: ${fP(totalFraisLivraison)}`, 25, 73);
    doc.text(`Total Encaissé: ${fP(totalEncaisseBrut)}`, pageWidth - 25, 63, { align: 'right' });
    doc.text(`Taux de Succès: ${successRate.toFixed(1)}%`, pageWidth - 25, 73, { align: 'right' });

    // Detailed Table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Détails des Opérations de Caisse", 20, 100);

    const tableRows = (data.retours || []).map((r: any) => {
      const frId = String(r.feuille_route_id || "");
      return [
        frId ? `#${frId.substring(0, 8).toUpperCase()}` : "N/A",
        fP(r.montant_remis_par_livreur || 0),
        fP(r.montant_attendu || 0),
        fP(r.ecart || 0),
        r.commentaire || "-"
      ];
    });

    autoTable(doc, {
      startY: 105,
      head: [['Bordereau', 'Reçu (Cash)', 'Théorique', 'Écart', 'Observations']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 255] },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Save
    doc.save(`Rapport_Analytique_${dateString || 'journee'}_gomboswiftciCI.pdf`);
  } catch (err) {
    console.error("Critical error inside generateAnalyticalReportPDF:", err);
    throw err;
  }
};

export const generateAuditReportPDF = (
  metrics: any, 
  transactions: any[], 
  dateRange: { start: string, end: string }
) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.width;

  // --- 1. HEADER & BRANDING ---
  doc.setFillColor(30, 41, 59); // Dark Slate
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("gomboswiftciCI Finance", 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("RAPPORT D'AUDIT ET D'EXPERTISE COMPTABLE", pageWidth - 20, 25, { align: 'right' });
  
  // --- 2. PERIOD INFO ---
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Synthèse Financière Périodique`, 20, 55);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Période du ${dateRange.start} au ${dateRange.end}`, 20, 62);

  // --- 3. METRICS GRID ---
  autoTable(doc, {
    startY: 70,
    head: [['Indicateur de Performance', 'Valeur (CFA)', 'Observation']],
    body: [
      ['Chiffre d\'Affaires Brut', fP(metrics.ca_brut), 'Total des ventes enregistrées'],
      ['Coût des Marchandises (COGS)', fP(metrics.cogs_total), 'Prix d\'achat des produits vendus'],
      ['Marge Brute d\'Exploitation', fP(metrics.ca_brut - metrics.cogs_total), `${metrics.marge_brute_percent}% du CA`],
      ['Charges Fixes & Dépenses', fP(metrics.depenses_fixes_total), 'Logistique et frais administratifs'],
      ['BÉNÉFICE NET (EBITDA)', fP(metrics.profit_net), `Marge nette: ${metrics.marge_nette_percent}%`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], fontSize: 10 },
    styles: { cellPadding: 5 },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold', fontSize: 11 } // Valeurs en gras
    }
  });

  // --- 4. TRANSACTION RESUME ---
  const finalY1 = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("helvetica", "bold");
  doc.text("Journal des Opérations Majeures", 20, finalY1);

  const tableRows = transactions.slice(0, 30).map(t => [
    format(new Date(t.date), 'dd/MM/yyyy'),
    t.description.substring(0, 45),
    t.categorie,
    fP(t.montant)
  ]);

  autoTable(doc, {
    startY: finalY1 + 5,
    head: [['Date', 'Description', 'Catégorie', 'Montant']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 255] },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' } // Montant en gras
    }
  });

  // --- FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text("Ce document est certifié conforme aux écritures comptables enregistrées dans le système gomboswiftciCI.", pageWidth / 2, 285, { align: 'center' });

  doc.save(`Bilan_Expertise_${dateRange.start}_${dateRange.end}.pdf`);
};
