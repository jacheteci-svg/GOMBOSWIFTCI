import { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, User, Sparkles, MessageCircle, HelpCircle } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useSaas } from '../saas/SaasProvider';
import { useToast } from '../contexts/ToastContext';

type Message = {
  id?: string;
  role: 'user' | 'assistant' | 'admin';
  content: string;
  created_at: string;
};

export const SupportChat = () => {
  const { tenant } = useSaas();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'AI' | 'HUMAN'>('AI');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load human chat history when switching to human mode
  useEffect(() => {
    if (mode === 'HUMAN' && tenant?.id) {
       loadHumanMessages();
       
       const setupRealtime = async () => {
          insforge.realtime.subscribe('support_messages');
          insforge.realtime.on('INSERT_support_messages', (payload: any) => {
            if (payload.new.tenant_id === tenant.id) {
               setMessages(prev => {
                  if (prev.find(m => m.id === payload.new.id)) return prev;
                  return [...prev, {
                    id: payload.new.id,
                    role: payload.new.is_admin_reply ? 'admin' : 'user',
                    content: payload.new.content,
                    created_at: payload.new.created_at
                  }];
               });
               if (payload.new.is_admin_reply && isOpen) {
                  insforge.database.from('support_messages').update({ is_read: true }).eq('id', payload.new.id);
               }
            }
          });
       };

       setupRealtime();

       return () => {
         insforge.realtime.unsubscribe('support_messages');
       };
    } else {
      setMessages([{
        role: 'assistant',
        content: "Bonjour ! Je suis l'assistant intelligent de GomboSwiftCI. Comment puis-je vous aider aujourd'hui ? Je peux répondre à vos questions sur le fonctionnement du logiciel.",
        created_at: new Date().toISOString()
      }]);
    }
  }, [mode, tenant?.id]);

  const loadHumanMessages = async () => {
    if (!tenant?.id) return;
    const { data } = await insforge.database
      .from('support_messages')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.is_admin_reply ? 'admin' : 'user',
        content: m.content,
        created_at: m.created_at
      })));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !tenant?.id) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    if (mode === 'AI') {
      setLoading(true);
      try {
        console.log("Calling InsForge AI with model: openai/gpt-4o-mini...");
        const { data, error } = await insforge.ai.chat.completions.create({
          model: 'openai/gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `Tu es GomboBot, l'expert technique de GomboSwiftCI, le logiciel SaaS n°1 de logistique en Côte d'Ivoire.
              
              CONTEXTE LOGICIEL :
              - Gestion de Commandes : Création, validation par appel, affectation aux livreurs.
              - Logistique : Feuilles de route pour les livreurs.
              - Caisse : Encaissement des livraisons et gestion des écarts.
              - Produits : Gestion du stock (Entrées/Sorties).
              
              TON RÔLE :
              Répondre précisément aux questions des chefs d'entreprise sur l'utilisation du logiciel. 
              Si on te demande comment faire quelque chose :
              1. Identifie le module (ex: Commandes).
              2. Indique le menu dans la barre latérale.
              3. Explique les étapes simples.
              
              Exemple pour créer une commande : "Allez dans le menu 'Commandes', cliquez sur 'Nouvelle Commande', remplissez les infos client et produits, puis validez."
              
              TON STYLE :
              Professionnel, rapide, et local (Côte d'Ivoire).
              Contacts Support : +225 01 00 57 65 26 | bigreussite@gmail.com` 
            },
            ...messages.map(m => ({ 
              role: m.role === 'user' ? 'user' : 'assistant' as any, 
              content: m.content 
            })),
            { role: 'user', content: currentInput }
          ]
        });

        if (error) {
          console.error("InsForge AI Error:", error);
          throw error;
        }

        if (data?.choices?.[0]?.message) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.choices[0].message.content,
            created_at: new Date().toISOString()
          }]);
        } else {
          throw new Error("Réponse vide de l'IA");
        }
      } catch (err: any) {
        console.error("Chatbot Error Instance:", err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Je rencontre une difficulté temporaire pour contacter l'intelligence centrale. Veuillez réessayer dans quelques instants ou basculer en mode 'Humain' pour parler à l'équipe.",
          created_at: new Date().toISOString()
        }]);
      } finally {
        setLoading(false);
      }
    } else {
      // HUMAN MODE: Write to DB
      const { error } = await insforge.database
        .from('support_messages')
        .insert([{
          tenant_id: tenant.id,
          content: currentInput,
          sender_name: tenant.nom || 'Client',
          is_admin_reply: false,
          is_read: false
        }]);
      
      if (error) {
        console.error("Support Insert Error:", error);
        showToast(`Erreur d'envoi: ${error.message}`, "error");
      }
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 15px 35px -5px rgba(99, 102, 241, 0.5)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="hover:scale-110 active:scale-95"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={32} />}
      </button>

      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            bottom: '7rem',
            right: '2rem',
            width: '420px',
            height: '600px',
            background: '#0f172a',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      {mode === 'AI' ? <Bot size={22} /> : <User size={22} />}
                   </div>
                   <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Gombo Support</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{mode === 'AI' ? 'IA Intelligente (Instantané)' : 'Équipe GomboSwift (Humain)'}</p>
                   </div>
                </div>
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '12px' }}>
                   <button 
                     onClick={() => setMode('AI')}
                     style={{ 
                       padding: '0.5rem 1rem', 
                       borderRadius: '10px', 
                       fontSize: '0.7rem', 
                       fontWeight: 800, 
                       border: 'none',
                       background: mode === 'AI' ? '#6366f1' : 'transparent',
                       color: mode === 'AI' ? 'white' : '#64748b',
                       cursor: 'pointer'
                     }}
                   >AI</button>
                   <button 
                     onClick={() => setMode('HUMAN')}
                     style={{ 
                       padding: '0.5rem 1rem', 
                       borderRadius: '10px', 
                       fontSize: '0.7rem', 
                       fontWeight: 800, 
                       border: 'none',
                       background: mode === 'HUMAN' ? '#6366f1' : 'transparent',
                       color: mode === 'HUMAN' ? 'white' : '#64748b',
                       cursor: 'pointer'
                     }}
                   >Humain</button>
                </div>
             </div>
             {mode === 'AI' ? (
                <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', fontSize: '0.8rem', color: '#a5b4fc', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                   <Sparkles size={14} />
                   <span>Posez vos questions sur le logiciel, l'IA vous répond 24/7.</span>
                </div>
             ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', fontSize: '0.8rem', color: '#6ee7b7', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                   <HelpCircle size={14} />
                   <span>Échangez directement avec un membre de notre équipe.</span>
                </div>
             )}
          </div>

          {/* Messages */}
          <div 
             ref={scrollRef}
             style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} 
             className="custom-scrollbar"
          >
             {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                   <div style={{ 
                      padding: '1rem', 
                      borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: m.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                      color: m.role === 'user' ? 'white' : '#e2e8f0',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      fontWeight: 600,
                      border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)'
                   }}>
                      {m.content}
                   </div>
                   <p style={{ margin: '0.4rem 0 0', fontSize: '0.65rem', color: '#475569', textAlign: m.role === 'user' ? 'right' : 'left', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {m.role === 'user' ? 'Vous' : m.role === 'admin' ? 'Support Admin' : 'Assistant AI'} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </p>
                </div>
             ))}
             {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '0.5rem' }}>
                   <div className="dot-pulse"></div>
                   <div className="dot-pulse" style={{ animationDelay: '0.2s' }}></div>
                   <div className="dot-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
             )}
          </div>

          {/* Input */}
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <form 
               onSubmit={e => { e.preventDefault(); handleSend(); }}
               style={{ display: 'flex', gap: '0.75rem' }}
             >
                <input 
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   placeholder="Votre message..."
                   style={{ 
                     flex: 1, 
                     background: 'rgba(0,0,0,0.3)', 
                     border: '1px solid rgba(255,255,255,0.1)', 
                     borderRadius: '14px', 
                     padding: '0 1.25rem', 
                     height: '52px', 
                     color: 'white',
                     fontSize: '0.9rem',
                     outline: 'none',
                     transition: 'all 0.3s ease'
                   }}
                   className="focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  style={{ 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '14px', 
                    background: '#6366f1', 
                    color: 'white', 
                    border: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  className="hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                   <Send size={20} />
                </button>
             </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #64748b;
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
      `}</style>
    </>
  );
};
