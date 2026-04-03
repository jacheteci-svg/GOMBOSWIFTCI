import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Commune, Permission } from '../types';
import { getAdminUsers, createAdminUser, updateAdminUser, getCommunes, createCommune, updateCommune, deleteCommune } from '../services/adminService';
import { Plus, Trash2, Users as UsersIcon, Map as MapIcon, CreditCard, CheckCircle } from 'lucide-react';
import { monerooService } from '../services/monerooService';
import { useToast } from '../contexts/ToastContext';
import { insforge } from '../lib/insforge';
import { useAuth } from '../contexts/AuthContext';
import { useSaas } from '../saas/SaasProvider';
import { NexusModuleFrame } from '../components/layout/NexusModuleFrame';

export const Admin = () => {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const { tenant } = useSaas();
  
  const canManageUsers = hasPermission('ADMIN') || hasPermission('GESTION_LIVREURS');
  const canManageCommunes = hasPermission('ADMIN') || hasPermission('COMMUNES');

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [activeTab, setActiveTab] = useState<'utilisateurs' | 'communes' | 'abonnement'>(
    (tabParam && ['utilisateurs', 'communes', 'abonnement'].includes(tabParam)) 
      ? tabParam 
      : (canManageUsers ? 'utilisateurs' : 'communes')
  );

  return (
    <NexusModuleFrame
      badge="Platform Control"
      title={hasPermission('ADMIN') ? 'Console Administration' : 'Gestion Équipe & Zones'}
      description={
        hasPermission('ADMIN')
          ? 'Architecture globale du système, permissions et configuration du forfait.'
          : 'Pilotez votre équipe de livreurs et vos zones de chalandise.'
      }
    >
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '3rem', 
        padding: '0.5rem', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '20px', 
        width: 'fit-content', 
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        {canManageUsers && (
          <button 
            className="btn"
            onClick={() => setActiveTab('utilisateurs')}
            style={{ 
              background: activeTab === 'utilisateurs' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'transparent',
              color: activeTab === 'utilisateurs' ? 'white' : 'var(--text-muted)',
              boxShadow: activeTab === 'utilisateurs' ? '0 10px 20px rgba(6, 182, 212, 0.3)' : 'none',
              border: 'none', padding: '0.8rem 1.8rem', borderRadius: '16px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <UsersIcon size={18} strokeWidth={activeTab === 'utilisateurs' ? 3 : 2} /> 
            {hasPermission('ADMIN') ? 'Utilisateurs' : 'Équipe Livreurs'}
          </button>
        )}
        {canManageCommunes && (
          <button 
            className="btn"
            onClick={() => setActiveTab('communes')}
            style={{ 
              background: activeTab === 'communes' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'transparent',
              color: activeTab === 'communes' ? 'white' : 'var(--text-muted)',
              boxShadow: activeTab === 'communes' ? '0 10px 20px rgba(6, 182, 212, 0.3)' : 'none',
              border: 'none', padding: '0.8rem 1.8rem', borderRadius: '16px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <MapIcon size={18} strokeWidth={activeTab === 'communes' ? 3 : 2} /> Zones & Tarifs
          </button>
        )}
        <button 
          className="btn"
          onClick={() => setActiveTab('abonnement')}
          style={{ 
            background: activeTab === 'abonnement' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'transparent',
            color: activeTab === 'abonnement' ? 'white' : 'var(--text-muted)',
            boxShadow: activeTab === 'abonnement' ? '0 10px 20px rgba(6, 182, 212, 0.3)' : 'none',
            border: 'none', padding: '0.8rem 1.8rem', borderRadius: '16px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <CreditCard size={18} strokeWidth={activeTab === 'abonnement' ? 3 : 2} /> Forfait SaaS
        </button>
      </div>

      <div className="nexus-main-area">
        {!tenant ? (
          <div className="card glass-effect animate-pulse" style={{ padding: '5rem', textAlign: 'center', borderRadius: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto 2rem', width: '50px', height: '50px', borderTopColor: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--text-main)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Initialisation du Nexus...</p>
          </div>
        ) : (
          activeTab === 'utilisateurs' ? <UsersManager showToast={showToast} tenantId={tenant.id} /> : 
          activeTab === 'communes' ? <CommunesManager showToast={showToast} tenantId={tenant.id} /> :
          <SubscriptionManager showToast={showToast} tenant={tenant} />
        )}
      </div>
    </NexusModuleFrame>
  );
};

// --- USERS MANAGER COMPONENT ---
const PERMISSIONS_LIST: { id: Permission, label: string }[] = [
  { id: 'DASHBOARD', label: 'Tableau de bord' },
  { id: 'PRODUITS', label: 'Produits' },
  { id: 'COMMANDES', label: 'Commandes' },
  { id: 'CENTRE_APPEL', label: 'Appels' },
  { id: 'LOGISTIQUE', label: 'Logistique' },
  { id: 'LIVREUR', label: 'Livreur' },
  { id: 'CAISSE', label: 'Caisse' },
  { id: 'CLIENTS', label: 'CRM' },
  { id: 'HISTORIQUE', label: 'Historique' },
  { id: 'FINANCE', label: 'Rapport Journalier' },
  { id: 'PROFIL', label: 'Mon Profil' },
  { id: 'COMMUNES', label: 'Gestion Zones & Tarifs' },
  { id: 'GESTION_LIVREURS', label: 'Gestion Équipe Livreurs' },
  { id: 'TRESORERIE', label: 'Trésorerie & Dashboard Privé' },
];

const UsersManager = ({ showToast, tenantId }: { showToast: any, tenantId: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<User>>({});

  const { hasPermission } = useAuth();
  const { planConfig } = useSaas();
  const isAdmin = hasPermission('ADMIN');

  const isLimitReached = planConfig?.max_users && planConfig.max_users > 0 ? users.length >= planConfig.max_users : false;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(tenantId);
      // Filter for non-admins if they only have GESTION_LIVREURS
      if (!isAdmin) {
        setUsers(data?.filter(u => u.role === 'LIVREUR') || []);
      } else {
        setUsers(data || []);
      }
    } catch (e) {
      showToast("Erreur chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const togglePermission = (p: Permission) => {
    const current = form.permissions || [];
    if (current.includes(p)) {
      setForm({ ...form, permissions: current.filter((x: string) => x !== p) });
    } else {
      setForm({ ...form, permissions: [...current, p] });
    }
  };

  const handleSave = async () => {
    const sanitizedTel = (form.telephone || '').replace(/\s+/g, '');
    const isLivreur = form?.role === 'LIVREUR';
    const email = isLivreur ? `${sanitizedTel.toLowerCase()}@livreur.com` : (form.email || '').trim();
    
    // Logic: Use provided password, or phone number for Livreurs, or default Admin123!
    const password = form.password || (isLivreur ? sanitizedTel : 'Admin123!');

    if (!form?.nom_complet || !email || !form?.role || (isLivreur && !sanitizedTel)) {
      showToast("Champs obligatoires manquants.", "error"); return;
    }

    setLoading(true);
    try {
      if (editingId === 'new') {
        const { data: currentSession } = await insforge.auth.getCurrentUser();
        const adminAccessToken = (currentSession as any)?.session?.access_token;
        const adminRefreshToken = (currentSession as any)?.session?.refresh_token;

        let userId = '';

        const { data: authData, error: signUpError } = await insforge.auth.signUp({ 
          email: email as string, 
          password: password as string
        });

        if (signUpError) {
          const msg = signUpError.message || '';
          if (msg.includes('already registered') || msg.includes('already been registered')) {
            // Check if user is already in Auth but missing from our DB
            const { data: existingUsers } = await insforge.database
              .from('users')
              .select('id')
              .eq('email', email)
              .eq('tenant_id', tenantId)
              .single();
            
            if (existingUsers?.id) {
               throw new Error("Cet email/téléphone est déjà utilisé.");
            } else {
               // User exists in Auth but NOT in our 'users' table. 
               // We don't have the Auth ID here because signUp failed, 
               // and we shouldn't guess it. Best we can do is ask the user to use a different email or fix it.
               // However, in InsForge, if a user is created in Auth, they MUST be in 'users'.
               throw signUpError; 
            }
          } else {
            throw signUpError;
          }
        } else {
          userId = authData?.user?.id || '';
        }
        
        // Restore admin session immediately after user creation
        if (adminAccessToken && adminRefreshToken) {
          await (insforge.auth as any).setSession({ access_token: adminAccessToken, refresh_token: adminRefreshToken });
        }
        
        if (userId) {
          await createAdminUser({
            nom_complet: form.nom_complet || '',
            email: email as string,
            role: form.role as any,
            telephone: sanitizedTel,
            permissions: form.permissions || [],
            actif: true,
            tenant_id: tenantId
          }, userId);
        }
      } else if (editingId) {
        // Clean form data for update: remove fields that shouldn't be sent
        const updateData: any = {
          nom_complet: form.nom_complet,
          role: form.role,
          telephone: sanitizedTel,
          permissions: form.permissions,
          actif: form.actif
        };
        if (form.email) updateData.email = form.email;
        await updateAdminUser(tenantId, editingId, updateData);
      }
      showToast("Enregistré avec succès !", "success");
      setEditingId(null); setForm({}); loadUsers();
    } catch (e: any) { 
      console.error('User save error:', e);
      const msg = e?.message || '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        showToast("Cet email/téléphone est déjà utilisé. Modifiez les informations.", "error");
      } else {
        showToast(msg || "Erreur lors de l'enregistrement.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card glass-effect" style={{ padding: '2.5rem', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>Membres de l'Organisation</h3>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>{users.length} compte(s) actif(s) sur cette instance.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { 
            if (isLimitReached) {
              showToast(`Limite atteinte (${planConfig?.max_users} max). Veuillez mettre à niveau votre forfait.`, 'error');
              return;
            }
            setEditingId('new'); 
            setForm({ 
              role: isAdmin ? 'AGENT_APPEL' : 'LIVREUR', 
              permissions: isAdmin ? ['DASHBOARD', 'PRODUITS', 'COMMANDES', 'CENTRE_APPEL'] : ['LIVREUR', 'PROFIL'] 
            }); 
          }}
          disabled={loading || isLimitReached}
          style={{ height: '54px', borderRadius: '14px', padding: '0 2rem' }}
          title={isLimitReached ? "Limite d'utilisateurs atteinte pour votre forfait." : ""}
        >
          <Plus size={20} strokeWidth={3} /> Créer un Profil
        </button>
      </div>

      <div className="table-container" style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
        <table className="table-responsive-cards">
          <thead>
            <tr>
              <th style={{ padding: '1.5rem' }}>Agent & Identité</th>
              <th style={{ padding: '1.5rem' }}>Rôle Système</th>
              <th style={{ padding: '1.5rem' }}>Niveau d'Accès</th>
              <th style={{ textAlign: 'right', width: '120px', padding: '1.5rem' }}>Gérer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(editingId === 'new' || (editingId && users.find(u => u.id === editingId))) && (
              <tr style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
                <td colSpan={4}>
                  <div style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nom Complet</label>
                      <input className="form-input" value={form.nom_complet || ''} onChange={e => setForm({...form, nom_complet: e.target.value})} style={{ borderRadius: '12px' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contact Téléphonique</label>
                      <input className="form-input" value={form.telephone || ''} onChange={e => setForm({...form, telephone: e.target.value})} style={{ borderRadius: '12px' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rôle Opérationnel</label>
                      <select className="form-select" value={form.role || ''} onChange={e => setForm({...form, role: e.target.value as any})} style={{ borderRadius: '12px' }}>
                        {isAdmin && (
                          <>
                            <option value="ADMIN">Administrateur</option>
                            <option value="GESTIONNAIRE">Gestionnaire Office</option>
                            <option value="AGENT_APPEL">Agent Call Center</option>
                            <option value="LOGISTIQUE">Superviseur Logistique</option>
                          </>
                        )}
                        <option value="LIVREUR">Agent Livreur (Terrain)</option>
                        {isAdmin && (
                          <>
                            <option value="CAISSIERE">Gestionnaire Caisse</option>
                            <option value="AGENT_MIXTE">Agent Mixte</option>
                          </>
                        )}
                      </select>
                    </div>
                    {form.role !== 'LIVREUR' && (
                      <div className="form-group">
                        <label className="form-label" style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Adresse Email</label>
                        <input className="form-input" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} style={{ borderRadius: '12px' }} />
                      </div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Permissions & Privilèges</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {PERMISSIONS_LIST.map(p => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <input type="checkbox" checked={form.permissions?.includes(p.id)} onChange={() => togglePermission(p.id)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button className="btn btn-outline" onClick={() => setEditingId(null)} style={{ borderRadius: '12px' }}>Retour</button>
                      <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ borderRadius: '12px', padding: '0 2.5rem' }}>
                        {loading ? 'Traitement...' : 'Finaliser le Profil'}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {users.map(u => (
              <tr key={u.id}>
                <td data-label="Identité" style={{ padding: '1.25rem 1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem' }}>
                            {u.nom_complet.charAt(0)}
                        </div>
                        <p style={{ fontWeight: 800, color: 'white', margin: 0 }}>{u.nom_complet}</p>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '2.75rem', fontWeight: 600 }}>{u.telephone || 'N/A'}</p>
                  </div>
                </td>
                <td data-label="Rôle" style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.35rem 0.75rem', 
                    background: u.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)', 
                    borderRadius: '8px', 
                    color: u.role === 'ADMIN' ? '#f87171' : '#67e8f9', 
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    border: u.role === 'ADMIN' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(6, 182, 212, 0.2)'
                  }}>
                    {u.role}
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>{u.email}</p>
                </td>
                <td data-label="Permissions" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {u.permissions?.slice(0, 3).map(p => (
                      <span key={p} style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)' }}>{p}</span>
                    ))}
                    {(u.permissions?.length || 0) > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>+{u.permissions!.length - 3}</span>}
                  </div>
                </td>
                <td style={{ textAlign: 'right', padding: '1.25rem 1.5rem' }}>
                  <button className="btn btn-outline" style={{ height: '36px', minHeight: '36px', padding: '0 1rem', fontSize: '0.8rem', borderRadius: '10px' }} onClick={() => {setEditingId(u.id); setForm(u);}}>Configuration</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- COMMUNES MANAGER COMPONENT ---
const CommunesManager = ({ showToast, tenantId }: { showToast: any, tenantId: string }) => {
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Commune>>({});

  const loadCommunes = async () => {
    setLoading(true);
    try {
      const data = await getCommunes(tenantId);
      setCommunes(data || []);
    } catch (e) {
      showToast("Erreur chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCommunes(); }, []);

  const handleSave = async () => {
    const nom = form?.nom?.trim();
    const tarif = Number(form?.tarif_livraison);

    if (!nom || isNaN(tarif)) {
      showToast("Champs requis.", "error"); return;
    }

    setLoading(true);
    try {
      if (editingId === 'new') {
        await createCommune({ nom, tarif_livraison: tarif, tenant_id: tenantId });
      } else if (editingId) {
        await updateCommune(tenantId, editingId, { nom, tarif_livraison: tarif });
      }
      showToast("Enregistré.", "success");
      setEditingId(null); setForm({}); loadCommunes();
    } catch (e: any) {
      showToast(e.message || "Erreur.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette zone ?")) {
      try {
        await deleteCommune(tenantId, id);
        showToast("Zone supprimée.");
        loadCommunes();
      } catch (e) {
        showToast("Erreur.", "error");
      }
    }
  };

  return (
    <div className="card glass-effect" style={{ padding: '2.5rem', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>Zonage & Tarification</h3>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Définissez vos secteurs et frais de livraison par défaut.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { setEditingId('new'); setForm({ tarif_livraison: 1500 }); }}
          disabled={loading}
          style={{ height: '54px', borderRadius: '14px', padding: '0 2rem' }}
        >
          <Plus size={20} strokeWidth={3} /> Nouvelle Zone
        </button>
      </div>

      <div className="table-container" style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
        <table className="table-responsive-cards">
          <thead>
            <tr>
              <th style={{ padding: '1.5rem' }}>Secteur / Commune</th>
              <th style={{ padding: '1.5rem' }}>Forfait Livraison</th>
              <th style={{ textAlign: 'right', width: '150px', padding: '1.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(editingId === 'new' || communes.some(c => c.id === editingId)) && editingId !== null && (
               <tr style={{ background: 'rgba(6, 182, 212, 0.05)' }}>
                 <td colSpan={3}>
                    <div style={{ padding: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 2, minWidth: '220px' }}>
                        <label className="form-label" style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Libellé de la Zone</label>
                        <input className="form-input" value={form.nom || ''} onChange={e => setForm({...form, nom: e.target.value})} style={{ borderRadius: '12px' }} />
                      </div>
                      <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                        <label className="form-label" style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tarif (CFA)</label>
                        <input className="form-input" type="number" value={form.tarif_livraison ?? ''} onChange={e => setForm({...form, tarif_livraison: Number(e.target.value)})} style={{ borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ borderRadius: '12px', padding: '0 1.5rem' }}>Valider</button>
                        <button className="btn btn-outline" onClick={() => setEditingId(null)} style={{ borderRadius: '12px' }}>Fermer</button>
                      </div>
                    </div>
                 </td>
               </tr>
            )}

            {communes.filter(c => c.id !== editingId).map(c => (
              <tr key={c.id}>
                <td data-label="Secteur" style={{ padding: '1.25rem 1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <MapIcon size={18} />
                      </div>
                      <span style={{ fontWeight: 800, color: 'white' }}>{c.nom}</span>
                   </div>
                </td>
                <td data-label="Tarif" style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.1rem' }}>{c.tarif_livraison?.toLocaleString()}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 900, marginLeft: '0.5rem' }}>CFA</span>
                </td>
                <td style={{ textAlign: 'right', padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" style={{ height: '36px', minHeight: '36px', padding: '0 1rem', fontSize: '0.8rem', borderRadius: '10px' }} onClick={() => {setEditingId(c.id); setForm(c);}}>Modifier</button>
                    <button className="btn btn-outline" style={{ height: '36px', minHeight: '36px', padding: '0 0.8rem', borderRadius: '10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- SUBSCRIPTION MANAGER COMPONENT ---
const SubscriptionManager = ({ showToast, tenant }: { showToast: any, tenant: any }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { planConfig } = useSaas();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await insforge.database
          .from('saas_plans')
          .select('*')
          .order('price_fcfa', { ascending: true });
        if (error) throw error;
        setPlans(data || []);
      } catch (e) {
        showToast("Erreur plans.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleUpgrade = async (plan: any) => {
    if (plan.id === tenant.plan) {
      showToast("Vous utilisez déjà ce forfait.", "info");
      return;
    }

    if (plan.price_fcfa === 0) {
        showToast("Veuillez contacter le support pour passer sur le plan Gratuit.", "info");
        return;
    }

    try {
      showToast("Initialisation du paiement...", "info");
      const checkoutUrl = await monerooService.initializeSubscription({
        amount: plan.price_fcfa,
        currency: 'XOF',
        customer: {
          name: tenant.nom,
          email: tenant.email_contact
        },
        reference_id: plan.id, // Target Plan ID
        type: 'SUBSCRIPTION',
        tenant_id: tenant.id
      });

      if (checkoutUrl) {
          window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      showToast(error.message || "Erreur de paiement", "error");
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s' }}>
      <div className="card glass-effect" style={{ padding: '2.5rem', marginBottom: '2.5rem', borderLeft: '5px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Forfait Actuel</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 850, margin: '0.4rem 0' }}>{planConfig?.name || tenant.plan}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', fontWeight: 700 }}>
              <CheckCircle size={18} /> Statut : ACTIF
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '20px', textAlign: 'right', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-muted)' }}>Prochain renouvellement</p>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-main)' }}>Dans 30 jours (Auto)</p>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 850, marginBottom: '2rem' }}>Débloquez plus de puissance 🚀</h3>

      {loading ? <div className="spinner" /> : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem' 
        }}>
          {plans.filter(p => !p.id.includes('CUSTOM') && p.price_fcfa >= 0).map(plan => (
            <div 
                key={plan.id} 
                className={`card ${plan.id === tenant.plan ? 'active-plan' : ''}`}
                style={{ 
                    padding: '2.5rem', 
                    position: 'relative', 
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    border: plan.id === tenant.plan ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: plan.is_popular ? '0 20px 40px rgba(99,102,241,0.1)' : 'none',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
              {plan.is_popular && (
                <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                   RECOMMANDÉ 
                </div>
              )}
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 850, margin: 0 }}>{plan.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500, minHeight: '3em' }}>{plan.description}</p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--text-main)' }}>{plan.price_fcfa.toLocaleString()}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}> F / mois</span>
              </div>

              <div style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(() => {
                    const MODULE_LABELS: Record<string, string> = {
                      module_crm_clients: 'CRM & Clients',
                      module_suivi_terrain: 'Suivi Terrain',
                      module_logistique_pro: 'Logistique Pro',
                      module_staff_perf: 'Performance Staff',
                      module_livraisons_app: 'Mes Livraisons',
                      module_tresorerie_audit: 'Trésorerie & Audit',
                      module_caisse_retour_expert: 'Caisse / Retour',
                      module_rapport_journalier: 'Rapport Journalier',
                      module_profit_finances: 'Profit & Finances',
                      module_tresorerie_admin: 'Trésorerie Admin',
                      module_expertise_comptable: 'Expertise Comptable',
                      module_api: 'API & Intégrations',
                      module_whatsapp: 'Notifications WhatsApp',
                      module_white_label: 'Logiciel White Label',
                    };
                    
                    const activeFeatures = Object.entries(MODULE_LABELS)
                      .filter(([key]) => plan[key] === true)
                      .map(([, label]) => label);
                      
                    if (activeFeatures.length === 0) return <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Accès de base à la plateforme</li>;
                    
                    return activeFeatures.map((label, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem', fontWeight: 650, color: 'var(--text-main)' }}>
                        <CheckCircle size={16} color="#10b981" strokeWidth={3} /> {label}
                      </li>
                    ));
                  })()}
                </ul>
              </div>

              <button 
                onClick={() => handleUpgrade(plan)}
                disabled={plan.id === tenant.plan}
                className={plan.id === tenant.plan ? "btn btn-outline" : "btn btn-primary"}
                style={{ width: '100%', marginTop: '2.5rem', height: '52px', borderRadius: '12px', fontWeight: 800 }}
              >
                {plan.id === tenant.plan ? 'Forfait Actuel' : 'Choisir ce forfait'}
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="card" style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, color: '#94a3b8', margin: 0 }}>Besoin d'un plan custom (Multi-entrepôts, White-label) ? 📧 Contactez support@gomboswiftci.com</p>
      </div>
    </div>
  );
};
