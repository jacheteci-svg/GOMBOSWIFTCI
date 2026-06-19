import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSaas } from '../../saas/SaasProvider';
import { useToast } from '../../contexts/ToastContext';
import { Produit } from '../../types';
import { searchClientByPhone, createClient } from '../../services/clientService';
import { createCommandeBase } from '../../services/commandeService';
import { subscribeToProduits } from '../../services/produitService';

interface ImportExcelModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportExcelModal = ({ onClose, onImportSuccess }: ImportExcelModalProps) => {
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [produits, setProduits] = useState<Produit[]>([]);

  useEffect(() => {
    if (!tenant?.id) return;
    const unsub = subscribeToProduits(tenant.id, setProduits);
    return () => unsub();
  }, [tenant?.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let errors = 0;
        const mappedData = data.map((row: any) => {
          const nom = row['Nom'] || row['Client'] || '';
          const tel = row['Téléphone'] || row['Telephone'] || row['Contact'] || '';
          const commune = row['Commune'] || row['Zone'] || '';
          const adresse = row['Adresse'] || row['Lieu'] || '';
          const produitNom = row['Produit'] || row['Article'] || '';
          const qte = parseInt(row['Quantité'] || row['Qte'] || '1', 10);
          const frais = parseFloat(row['Frais Livraison'] || row['Frais'] || '0');

          const matchedProduit = produits.find(p => p.nom.toLowerCase() === String(produitNom).toLowerCase() || p.id === String(produitNom));
          if (!matchedProduit || !nom || !tel) errors++;

          return { nom, tel, commune, adresse, produitNom, matchedProduit, qte, frais, hasError: !matchedProduit || !nom || !tel };
        });

        setPreview(mappedData);
        setErrorCount(errors);
      } catch (err) {
        showToast("Erreur lors de la lecture du fichier", "error");
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleImport = async () => {
    if (!tenant?.id) return;
    const validRows = preview.filter(r => !r.hasError);
    if (validRows.length === 0) {
      showToast("Aucune ligne valide à importer.", "error");
      return;
    }

    setLoading(true);
    let successCount = 0;

    for (const row of validRows) {
      try {
        let client = await searchClientByPhone(tenant.id, row.tel);
        let clientId = client?.id;
        if (!clientId) {
          clientId = await createClient(tenant.id, {
            nom_complet: row.nom,
            telephone: row.tel,
            commune: row.commune,
            adresse: row.adresse
          } as any);
        }

        const commandeObj = {
          client_id: clientId,
          nom_client: row.nom,
          telephone_client: row.tel,
          commune_livraison: row.commune,
          adresse_livraison: row.adresse,
          frais_livraison: row.frais,
          remise_globale: 0
        };

        const lignes = [{
          produit_id: row.matchedProduit.id,
          nom_produit: row.matchedProduit.nom,
          quantite: row.qte,
          prix_unitaire: row.matchedProduit.prix,
          montant_ligne: row.matchedProduit.prix * row.qte,
          prix_achat_unitaire: row.matchedProduit.prix_achat || 0
        }];

        await createCommandeBase(tenant.id, commandeObj as any, lignes, false);
        successCount++;
      } catch (err) {
        console.error("Erreur import ligne:", row, err);
      }
    }

    setLoading(false);
    showToast(`${successCount} commandes importées avec succès !`, "success");
    onImportSuccess();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Nom': 'Jean Dupont',
      'Téléphone': '0102030405',
      'Commune': 'Cocody',
      'Adresse': 'Angré',
      'Produit': produits[0]?.nom || 'Mon Produit',
      'Quantité': 1,
      'Frais Livraison': 1500
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modèle");
    XLSX.writeFile(wb, "Modele_Import_Commandes.xlsx");
  };

  return (
    <div className="modal-overlay" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="modal-content gombo-card-elite" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileSpreadsheet size={28} className="gombo-neon-cyan" />
            Importer via Excel
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        {!file ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div 
              style={{ 
                border: '2px dashed rgba(6, 182, 212, 0.3)', 
                borderRadius: '24px', 
                padding: '4rem 2rem', 
                textAlign: 'center',
                background: 'rgba(6, 182, 212, 0.05)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
              />
              <Upload size={48} className="gombo-neon-cyan" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Cliquez ou glissez votre fichier ici</h3>
              <p style={{ color: 'var(--text-muted)' }}>Formats supportés : .xlsx, .csv</p>
            </div>
            
            <button className="btn btn-outline" onClick={downloadTemplate} style={{ width: '100%', padding: '1rem', borderRadius: '16px' }}>
              Télécharger le modèle Excel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'white', margin: 0 }}>Aperçu de l'import</h3>
                <span className="badge badge-primary">{preview.length} lignes détectées</span>
              </div>
              
              {errorCount > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={20} />
                  <span>{errorCount} ligne(s) avec des erreurs (Nom/Tel manquant ou Produit introuvable). Elles seront ignorées.</span>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={{ color: 'var(--text-muted)' }}>Client</th>
                      <th style={{ color: 'var(--text-muted)' }}>Téléphone</th>
                      <th style={{ color: 'var(--text-muted)' }}>Produit identifié</th>
                      <th style={{ color: 'var(--text-muted)' }}>Qte</th>
                      <th style={{ color: 'var(--text-muted)' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ color: 'white', padding: '0.75rem 0' }}>{row.nom}</td>
                        <td style={{ color: 'var(--text-muted)', padding: '0.75rem 0' }}>{row.tel}</td>
                        <td style={{ color: 'var(--text-muted)', padding: '0.75rem 0' }}>
                          {row.matchedProduit ? <span style={{ color: '#10b981' }}>{row.matchedProduit.nom}</span> : <span style={{ color: '#ef4444' }}>{row.produitNom || 'Vide'}</span>}
                        </td>
                        <td style={{ color: 'white', padding: '0.75rem 0' }}>{row.qte}</td>
                        <td style={{ padding: '0.75rem 0' }}>
                          {!row.hasError ? <CheckCircle size={20} color="#10b981" /> : <X size={20} color="#ef4444" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>... et {preview.length - 5} autres lignes</p>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setFile(null)} disabled={loading} style={{ borderRadius: '14px', padding: '0.75rem 1.5rem' }}>Annuler</button>
              <button className="gombo-glow-button" onClick={handleImport} disabled={loading || preview.filter(r => !r.hasError).length === 0} style={{ padding: '0.75rem 2rem' }}>
                {loading ? 'Importation en cours...' : `Importer ${preview.filter(r => !r.hasError).length} commandes`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
