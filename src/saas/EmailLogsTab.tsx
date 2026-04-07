import { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const EmailLogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await insforge.database
          .from('email_logs')
          .select(`
            *,
            tenants!left (nom)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setLogs(data || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="reveal">
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0 }}>Journal des Emails</h2>
            <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontWeight: 500 }}>Suivi en temps réel des communications transactionnelles via Mailzeet</p>
          </div>
       </div>

       <div className="gombo-card-elite" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive-cards px-0">
            <table className="gombo-table">
               <thead>
                  <tr>
                    <th>DESTINATAIRE</th>
                    <th>OBJET / TEMPLATE</th>
                    <th>ORGANISATION</th>
                    <th>STATUT</th>
                    <th style={{ textAlign: 'right' }}>HORODATAGE</th>
                  </tr>
               </thead>
               <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td data-label="DESTINATAIRE">
                        <div style={{ fontWeight: 950, fontSize: '0.95rem' }}>{log.recipient_email}</div>
                      </td>
                      <td data-label="OBJET">
                        <div>
                          <div style={{ fontWeight: 800 }}>{log.subject}</div>
                          {log.template_id && (
                            <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 900 }}>Template: {log.template_id}</span>
                          )}
                        </div>
                      </td>
                      <td data-label="ORG">
                         <span style={{ color: '#cbd5e1', fontWeight: 800 }}>{log.tenants?.nom || 'GOMBO SYSTEM'}</span>
                      </td>
                      <td data-label="STATUT">
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {log.status === 'sent' ? (
                              <><CheckCircle size={14} color="#10b981" /> <span style={{ color: '#10b981', fontWeight: 900, fontSize: '0.75rem' }}>ENVOYÉ</span></>
                            ) : log.status === 'failed' ? (
                              <><AlertTriangle size={14} color="#f43f5e" /> <span style={{ color: '#f43f5e', fontWeight: 900, fontSize: '0.75rem' }}>ÉCHEC</span></>
                            ) : (
                               <><Clock size={14} color="#f59e0b" /> <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: '0.75rem' }}>EN ATTENTE</span></>
                            )}
                         </div>
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontWeight: 800 }}>
                        Aucune communication transactionnelle détectée.
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};
