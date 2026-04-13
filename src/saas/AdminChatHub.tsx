import { useState, useEffect } from 'react';
import { 
  MessageCircle, Send, Search, Filter, 
  UserPlus, CheckCircle2, Clock, Bot 
} from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';

interface Message {
  id: string;
  tenant_id: string;
  content: string;
  is_admin_reply: boolean;
  sender_name: string;
  created_at: string;
  is_read: boolean;
  tenants?: {
    nom: string;
    id: string;
    nom_boutique?: string;
  };
}

interface Tenant {
  id: string;
  nom: string;
  nom_boutique?: string;
}

const AdminChatHub = ({ tenants }: { tenants: Tenant[] }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLoading] = useState(true);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchMessages = async () => {
    try {
      const { data, error } = await insforge.database
        .from('support_messages')
        .select('*, tenants(id, nom, nom_boutique)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      showToast("Erreur lors du chargement des messages", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Real-time subscription
    insforge.realtime.subscribe('support_messages');
    insforge.realtime.on('INSERT_support_messages', () => {
      fetchMessages(); // Refresh for now to get joins
      showToast("Nouveau message reçu !", "info");
    });

    return () => {
      insforge.realtime.unsubscribe('support_messages');
    };
  }, []);

  const handleSendReply = async (targetId?: string) => {
    const finalId = targetId || selectedTenantId;
    if (!replyContent.trim() || !finalId) return;

    try {
      const { error } = await insforge.database
        .from('support_messages')
        .insert([{
          tenant_id: finalId,
          content: replyContent,
          is_admin_reply: true,
          sender_name: 'Administrateur Gombo'
        }]);

      if (error) throw error;
      setReplyContent('');
      if (isNewChatModalOpen) setIsNewChatModalOpen(false);
      showToast("Message envoyé avec succès", "success");
      fetchMessages();
    } catch (err: any) {
      showToast("Erreur d'envoi", "error");
    }
  };

  const markAsRead = async (tenantId: string) => {
    try {
      await insforge.database
        .from('support_messages')
        .update({ is_read: true })
        .eq('tenant_id', tenantId)
        .eq('is_admin_reply', false);
    } catch (e) {
      console.error(e);
    }
  };

  // Group messages by tenant
  const sessionsMap = messages.reduce((acc: any, msg) => {
    const tid = msg.tenant_id;
    if (!acc[tid]) {
      acc[tid] = {
        tenant_id: tid,
        tenant_nom: msg.tenants?.nom || 'Inconnu',
        last_message: msg,
        unread_count: 0,
        messages: []
      };
    }
    acc[tid].messages.push(msg);
    if (!msg.is_admin_reply && !msg.is_read) {
      acc[tid].unread_count++;
    }
    return acc;
  }, {});

  const sessionList = Object.values(sessionsMap).sort((a: any, b: any) => 
    new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
  );

  const filteredSessions = sessionList.filter((s: any) => 
    s.tenant_nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeMessages = selectedTenantId ? messages.filter(m => m.tenant_id === selectedTenantId) : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: 'calc(100vh - 250px)', animation: 'fadeIn 0.4s ease' }}>
      
      {/* Sidebar: Session List */}
      <div className="gombo-card-elite" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: 'white' }}>Conversations</h3>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <UserPlus size={18} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              placeholder="Rechercher un tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {filteredSessions.map((session: any) => (
            <div 
              key={session.tenant_id}
              onClick={() => {
                setSelectedTenantId(session.tenant_id);
                markAsRead(session.tenant_id);
              }}
              style={{ 
                padding: '1.25rem', 
                borderRadius: '16px', 
                background: selectedTenantId === session.tenant_id ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: selectedTenantId === session.tenant_id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '0.5rem',
                position: 'relative'
              }}
              className="hover:bg-white/5"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>{session.tenant_nom}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  {new Date(session.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.last_message.content}
              </p>
              {session.unread_count > 0 && (
                <div style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: '#f43f5e', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px', borderRadius: '6px' }}>
                  {session.unread_count}
                </div>
              )}
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
              <MessageCircle size={32} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p>Aucune conversation trouvée</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Chat View */}
      <div className="gombo-card-elite" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {selectedTenantId ? (
          <>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                     <Bot size={22} />
                  </div>
                  <div>
                     <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 950, color: 'white' }}>
                       {sessionsMap[selectedTenantId]?.tenant_nom}
                     </h3>
                     <p style={{ margin: 0, fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>• EN LIGNE / SUPPORT DIRECT</p>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none' }}><Clock size={18} color="#64748b" /></button>
                  <button className="btn" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none' }}><Filter size={18} color="#64748b" /></button>
               </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column-reverse', gap: '1.5rem' }}>
              {activeMessages.map((msg) => (
                <div key={msg.id} style={{ 
                  alignSelf: msg.is_admin_reply ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.is_admin_reply ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{ 
                    padding: '1.25rem', 
                    borderRadius: msg.is_admin_reply ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.is_admin_reply ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    boxShadow: msg.is_admin_reply ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' : 'none'
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>
                      {msg.is_admin_reply ? 'MOI' : 'TENANT'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!msg.is_admin_reply && msg.is_read && <CheckCircle2 size={12} color="#10b981" />}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    className="form-input"
                    placeholder="Tapez votre réponse ici..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.5rem', height: 'auto', minHeight: '54px' }}
                  />
                  <button 
                    onClick={() => handleSendReply()}
                    className="btn btn-primary"
                    style={{ width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    <Send size={22} />
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#64748b' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <MessageCircle size={40} style={{ opacity: 0.3 }} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>Messagerie SaaS Elite</h3>
            <p style={{ maxWidth: '300px', fontSize: '0.9rem', lineHeight: 1.6 }}>Sélectionnez une conversation pour commencer à échanger en temps réel avec vos tenants.</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
           <div className="gombo-card-elite" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', animation: 'scaleUp 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, color: 'white' }}>Nouveau Message</h3>
                 <button onClick={() => setIsNewChatModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><Bot size={24} /></button>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                 <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Destinataire (Tenant)</label>
                 <select 
                   className="form-input" 
                   style={{ width: '100%' }}
                   onChange={(e) => setSelectedTenantId(e.target.value)}
                   value={selectedTenantId || ''}
                 >
                    <option value="">Sélectionner un tenant...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.nom} {t.nom_boutique ? `(${t.nom_boutique})` : ''}</option>
                    ))}
                 </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                 <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Message Initial</label>
                 <textarea 
                   className="form-input"
                   placeholder="Tapez le message à envoyer par le chatbot..."
                   value={replyContent}
                   onChange={e => setReplyContent(e.target.value)}
                   style={{ width: '100%', height: '120px', resize: 'none', background: 'rgba(255,255,255,0.03)' }}
                 />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                 <button onClick={() => setIsNewChatModalOpen(false)} className="btn" style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>ANNULER</button>
                 <button 
                   onClick={() => handleSendReply()}
                   disabled={!selectedTenantId || !replyContent.trim()}
                   className="btn btn-primary" 
                   style={{ flex: 2 }}
                 >Envoyer le message</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default AdminChatHub;
