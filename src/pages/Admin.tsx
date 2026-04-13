import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Commune, Permission } from '../types';
import {
  getAdminUsers,
  updateAdminUser,
  getCommunes,
  createCommune,
  updateCommune,
  deleteCommune,
  deleteAdminUser,
  upsertAdminUserProfile,
  tryResolveUserIdByEmail,
  finalizeUserInviteViaRpc,
} from '../services/adminService';
import { Plus, Trash2, Users as UsersIcon, Map as MapIcon, CreditCard, CheckCircle, Building2 } from 'lucide-react';
import { monerooService } from '../services/monerooService';
import { useToast } from '../contexts/ToastContext';
import { insforge } from '../lib/insforge';
import {
  extractUserIdFromAuthPayload,
  getUserIdFromSessionIfEmailMatches,
  restoreAdminSession,
  snapshotAdminSession,
} from '../lib/insforgeSession';
import { useAuth } from '../contexts/AuthContext';
import { useSaas } from '../saas/SaasProvider';
import { GomboModuleFrame } from '../components/layout/GomboModuleFrame';
import { TenantIdentityPanel } from '../components/admin/TenantIdentityPanel';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const Admin = () => {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const { tenant } = useSaas();
  
  const canManageUsers = hasPermission('ADMIN') || hasPermission('GESTION_LIVREURS');
  const canManageCommunes = hasPermission('ADMIN') || hasPermission('COMMUNES');
  const canManageEntreprise = hasPermission('ADMIN');

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [activeTab, setActiveTab] = useState<'utilisateurs' | 'communes' | 'abonnement' | 'entreprise'>(
    (tabParam && ['utilisateurs', 'communes', 'abonnement', 'entreprise'].includes(tabParam)) 
      ? tabParam 
      : (canManageUsers ? 'utilisateurs' : 'communes')
  );

  return (
    <GomboModuleFrame
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
        {canManageEntreprise && (
          <button 
            className="btn"
            onClick={() => setActiveTab('entreprise')}
            style={{ 
              background: activeTab === 'entreprise' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'transparent',
              color: activeTab === 'entreprise' ? 'white' : 'var(--text-muted)',
              boxShadow: activeTab === 'entreprise' ? '0 10px 20px rgba(6, 182, 212, 0.3)' : 'none',
              border: 'none', padding: '0.8rem 1.8rem', borderRadius: '16px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Building2 size={18} strokeWidth={activeTab === 'entreprise' ? 3 : 2} /> Documents &amp; marque
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

      <div className="gombo-main-area">
        {!tenant ? (
          <div className="card glass-effect animate-pulse" style={{ padding: '5rem', textAlign: 'center', borderRadius: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto 2rem', width: '50px', height: '50px', borderTopColor: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--text-main)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Initialisation du Gombo...</p>
          </div>
        ) : (
          activeTab === 'utilisateurs' ? <UsersManager showToast={showToast} tenantId={tenant.id} /> : 
          activeTab === 'communes' ? <CommunesManager showToast={showToast} tenantId={tenant.id} /> :
          activeTab === 'entreprise' ? <TenantIdentityPanel tenant={tenant} showToast={showToast} /> :
          <SubscriptionManager showToast={showToast} tenant={tenant} />
        )}
      </div>
    </GomboModuleFrame>
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

  /** Liste complète (tenant) — le filtre métier s’applique à l’affichage pour éviter les états incohérents si les permissions changent avant le 2e rendu. */
  const visibleUsers = useMemo(
    () => (!isAdmin ? users.filter((u) => u.role === 'LIVREUR') : users),
    [users, isAdmin]
  );

  const isLimitReached =
    planConfig?.max_users && planConfig.max_users > 0 ? users.length >= planConfig.max_users : false;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(tenantId);
      setUsers(data || []);
    } catch (e) {
      showToast("Erreur chargement.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [tenantId, isAdmin]);

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
        const adminSnap = snapshotAdminSession(insforge);

        const { data: authData, error: signUpError } = await insforge.auth.signUp({
          email: email as string,
          password: password as string,
        });

        if (signUpError) {
          const msg = signUpError.message || '';
          if (msg.includes('already registered') || msg.includes('already been registered')) {
            const { data: existingUsers } = await insforge.database
              .from('users')
              .select('id')
              .eq('email', email)
              .eq('tenant_id', tenantId)
              .single();

            if (existingUsers?.id) {
              throw new Error('Cet email/téléphone est déjà utilisé.');
            }
            throw signUpError;
          }
          throw signUpError;
        }

        let userId =
          extractUserIdFromAuthPayload(authData) ||
          getUserIdFromSessionIfEmailMatches(insforge, email);

        if (!userId) {
          const { data: signInData, error: signInErr } = await insforge.auth.signInWithPassword({
            email: email as string,
            password: password as string,
          });
          if (!signInErr && signInData) {
            userId =
              extractUserIdFromAuthPayload(signInData) ||
              getUserIdFromSessionIfEmailMatches(insforge, email);
          }
        }

        restoreAdminSession(insforge, adminSnap);

        if (!userId) {
          const fromDb = await tryResolveUserIdByEmail(tenantId, email);
          if (fromDb) userId = fromDb;
        }

        const profilePayload = {
          nom_complet: form.nom_complet || '',
          email: email as string,
          role: form.role as any,
          telephone: sanitizedTel,
          permissions: form.permissions || [],
          actif: true,
          tenant_id: tenantId,
        };

        let inviteRpc: Awaited<ReturnType<typeof finalizeUserInviteViaRpc>> | null = null;
        if (!userId) {
          inviteRpc = await finalizeUserInviteViaRpc(tenantId, {
            email: profilePayload.email,
            nom_complet: profilePayload.nom_complet,
            role: profilePayload.role,
            telephone: profilePayload.telephone,
            permissions: profilePayload.permissions || [],
          });
          if (inviteRpc.userId) {
            userId = inviteRpc.userId;
          } else if (import.meta.env.DEV && authData) {
            console.warn('[Admin] Création utilisateur : impossible d’extraire l’UUID depuis signUp. Aperçu réponse :', authData);
          }
        }

        if (!userId) {
          if (inviteRpc?.rpcMissing) {
            throw new Error(
              "La fonction SQL « admin_finalize_user_invite » est absente sur la base InsForge. Dans le tableau de bord : SQL → exécutez tout le fichier « ensure_core_schema.sql » du dépôt (recommandé), ou « rpc_admin_finalize_user_invite.sql » seul. Si besoin, rechargez le cache schéma / API, puis réessayez la création du compte."
            );
          }
          if (inviteRpc?.noAuthUserRow) {
            throw new Error(
              "Aucun compte trouvé dans l’authentification pour cet e-mail (souvent : confirmation e-mail obligatoire avant création du compte). Dans la console InsForge (Auth), désactivez la confirmation obligatoire pour les inscriptions, ou exécutez le script SQL du projet puis réessayez après que le collaborateur ait confirmé son e-mail."
            );
          }
          throw new Error(
            "Impossible d’obtenir l’identifiant du nouveau compte. Exécutez « rpc_admin_finalize_user_invite.sql » sur la base InsForge, ou désactivez la confirmation e-mail obligatoire pour les inscriptions."
          );
        }

        await upsertAdminUserProfile(tenantId, userId, profilePayload);

        restoreAdminSession(insforge, adminSnap);
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
      showToast('Enregistré avec succès !', 'success');
      setEditingId(null);
      setForm({});
      await loadUsers();
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
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
            {visibleUsers.length} compte(s) affiché(s) sur cette instance.
          </p>
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
            {(editingId === 'new' || (editingId && users.find((u) => u.id === editingId))) && (
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

            {visibleUsers.map((u) => (
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
                  <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                     <button 
                        className="btn btn-outline" 
                        style={{ height: '36px', minHeight: '36px', padding: '0 0.8rem', fontSize: '0.8rem', borderRadius: '10px' }} 
                        onClick={() => {setEditingId(u.id); setForm(u);}}
                     >
                        Modifier
                     </button>
                     <button 
                        className="btn btn-outline" 
                        style={{ height: '36px', minHeight: '36px', padding: '0 0.6rem', borderRadius: '10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.1)' }} 
                        onClick={async () => {
                           if (confirm(`Souhaitez-vous vraiment désactiver ${u.nom_complet} ?`)) {
                              await deleteAdminUser(tenantId, u.id);
                              showToast('Utilisateur désactivé.');
                              await loadUsers();
                           }
                        }}
                     >
                        <Trash2 size={16} />
                     </button>
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

// --- COMMUNES MANAGER COMPONENT ---
const CommunesManager = ({ showToast, tenantId }: { showToast: any, tenantId: string }) => {
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Commune>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const confirmDeleteZone = async () => {
    if (!deleteId) return;
    try {
      await deleteCommune(tenantId, deleteId);
      showToast("Zone supprimée.");
      loadCommunes();
    } catch (e) {
      showToast("Erreur.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="card glass-effect" style={{ padding: '2.5rem', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '32px' }}>
      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer cette zone ?"
        message="Les nouvelles commandes ne pourront plus utiliser ce secteur tel quel. Cette action est définitive."
        variant="danger"
        confirmLabel="Supprimer"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDeleteZone}
      />
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
                    <button className="btn btn-outline" style={{ height: '36px', minHeight: '36px', padding: '0 0.8rem', borderRadius: '10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.1)' }} onClick={() => setDeleteId(c.id)}><Trash2 size={16} /></button>
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

// Fallback plans if DB is unavailable
const FALLBACK_PLANS = [
  {
    id: 'FREE',
    name: 'Essentiel (Gratuit)',
    price_fcfa: 0,
    description: 'Parfait pour débuter votre activité logistique.',
    max_users: 1,
    max_products: 100,
    max_orders_month: 50,
  },
  {
    id: 'BASIC',
    name: 'Croissance',
    price_fcfa: 15000,
    is_popular: true,
    description: 'Pour les boutiques en pleine expansion.',
    max_users: 5,
    max_products: -1,
    max_orders_month: -1,
    module_caisse: true,
    module_logistique_pro: true,
    module_suivi_terrain: true,
  },
  {
    id: 'PRO',
    name: 'Gombo Pro',
    price_fcfa: 35000,
    description: 'La solution complète pour les pros de la logistique.',
    max_users: -1,
    max_products: -1,
    max_orders_month: -1,
    module_caisse: true,
    module_audit: true,
    module_api: true,
    module_tresorerie_audit: true,
    module_logistique_pro: true,
    module_suivi_terrain: true,
  }
];

// --- SUBSCRIPTION MANAGER COMPONENT ---
const SubscriptionManager = ({ showToast, tenant }: { showToast: any, tenant: any }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [billingContext, setBillingContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { planConfig } = useSaas();

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, contextRes, txRes] = await Promise.all([
        insforge.database.from('saas_plans').select('*').eq('is_active', true).order('price_fcfa', { ascending: true }),
        insforge.database.rpc('get_tenant_billing_context', { t_id: tenant.id }),
        insforge.database.from('moneroo_transactions').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(5)
      ]);

      if (plansRes.error) throw plansRes.error;
      if (contextRes.error) throw contextRes.error;

      if (plansRes.data && plansRes.data.length > 0) {
        setPlans(plansRes.data);
      } else {
        setPlans(FALLBACK_PLANS);
      }
      setBillingContext(contextRes.data);
      setTransactions(txRes.data || []);
    } catch (e: any) {
      console.error("Billing load error:", e);
      setPlans(FALLBACK_PLANS); // Fallback on error too
      showToast("Sync SaaS : Affichage des offres standard.", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant.id]);

  const handleUpgrade = async (plan: any) => {
    if (plan.id === tenant.plan) {
      showToast("Vous utilisez déjà ce forfait.", "info");
      return;
    }

    if (plan.price_fcfa === 0) {
        showToast("Veuillez contacter le support au +225 01 00 57 65 26 pour passer sur le plan Gratuit.", "info");
        return;
    }

    try {
      showToast("Initialisation du paiement sécurisé...", "info");
      const checkoutUrl = await monerooService.initializeSubscription({
        amount: plan.price_fcfa,
        currency: 'XOF',
        customer: {
          name: tenant.nom,
          email: tenant.email_contact
        },
        reference_id: plan.id,
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>;

  const usage = billingContext?.usage || { users_count: 0, products_count: 0, monthly_orders_count: 0 };
  const currentPlan = plans.find(p => p.id === tenant.plan) || planConfig;

  return (
    <div style={{ animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} className="space-y-12">
      {/* SECTION 1: SUBSCRIPTION STATUS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card glass-effect overflow-hidden" style={{ padding: 0, borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '3rem', background: 'linear-gradient(135deg, rgba(6,182,212,0.1), transparent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Abonnement Actif</span>
                  </div>
                  <h2 style={{ fontSize: '3rem', fontWeight: 950, margin: 0, letterSpacing: '-0.04em' }}>{currentPlan?.name || tenant.plan}</h2>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 950 }}>{currentPlan?.price_fcfa?.toLocaleString() || 0} <span style={{ fontSize: '1rem', color: '#64748b' }}>F/MOIS</span></div>
                  <p style={{ margin: 0, color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>Prochaine facture : {tenant.next_billing_at ? new Date(tenant.next_billing_at).toLocaleDateString() : 'Non définie'}</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Utilisateurs</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 950 }}>{usage.users_count}</span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>/ {currentPlan?.max_users === -1 ? '∞' : currentPlan?.max_users}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${currentPlan?.max_users === -1 ? 10 : (usage.users_count / currentPlan?.max_users) * 100}%` }}></div>
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Produits</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 950 }}>{usage.products_count}</span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>/ {currentPlan?.max_products === -1 ? '∞' : currentPlan?.max_products}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${currentPlan?.max_products === -1 ? 10 : (usage.products_count / currentPlan?.max_products) * 100}%` }}></div>
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Commandes</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 950 }}>{usage.monthly_orders_count}</span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>/ {currentPlan?.max_orders_month === -1 ? '∞' : currentPlan?.max_orders_month}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${currentPlan?.max_orders_month === -1 ? 10 : (usage.monthly_orders_count / currentPlan?.max_orders_month) * 100}%` }}></div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="card glass-effect flex flex-col justify-between" style={{ padding: '2.5rem', borderRadius: '40px', background: 'rgba(15, 23, 42, 0.4)' }}>
           <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '1.5rem' }}>Historique Facturation</h4>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>Aucune transaction récente.</p>
                ) : transactions.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.7rem', color: tx.statut === 'success' ? '#10b981' : '#f59e0b', fontWeight: 800, textTransform: 'uppercase' }}>{tx.statut}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.9rem', fontWeight: 950 }}>{tx.montant.toLocaleString()} F</div>
                       <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{tx.moneroo_id?.slice(0, 10)}...</div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
           
           <button 
             onClick={() => showToast("Génération du relevé complet en cours...", "info")}
             style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
           >
             TÉLÉCHARGER TOUT LE RELEVÉ
           </button>
        </div>
      </div>

      {/* SECTION 2: PLANS COMPARISON */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1))' }}></div>
          <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>Faites Décoller Votre Entreprise</h3>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.1))' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
           {plans.filter(p => !p.id.includes('CUSTOM') && p.price_fcfa >= 0).map(plan => {
              const isCurrent = plan.id === tenant.plan;
              const isPopular = plan.is_popular;

              return (
                <div 
                  key={plan.id}
                  className={`card transition-all duration-500 hover:scale-[1.02] ${isCurrent ? 'border-cyan-500/50' : 'border-white/5'}`}
                  style={{ 
                    padding: '3rem', 
                    borderRadius: '40px', 
                    background: isCurrent ? 'rgba(6, 182, 212, 0.03)' : 'rgba(15, 23, 42, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '600px'
                  }}
                >
                  {isPopular && (
                    <div style={{ position: 'absolute', top: '24px', right: '-35px', background: '#3b82f6', color: 'white', padding: '0.5rem 3rem', transform: 'rotate(45deg)', fontSize: '0.65rem', fontWeight: 950, letterSpacing: '0.1em' }}>
                      POPULAIRE
                    </div>
                  )}

                  <div style={{ marginBottom: '2.5rem' }}>
                    <h4 style={{ fontSize: '1.75rem', fontWeight: 950, margin: 0, color: 'white' }}>{plan.name}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.75rem 0', lineHeight: 1.6, fontWeight: 500, minHeight: '4.8rem' }}>{plan.description}</p>
                  </div>

                  <div style={{ marginBottom: '3rem' }}>
                    <span style={{ fontSize: '3rem', fontWeight: 950 }}>{plan.price_fcfa.toLocaleString()} <span style={{ fontSize: '1rem', color: '#64748b' }}>F/MOIS</span></span>
                  </div>

                  <div style={{ flex: 1 }} className="space-y-4">
                     {plan.max_users !== 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                           <CheckCircle size={18} className="text-cyan-500" />
                           <span>Jusqu'à {plan.max_users === -1 ? 'Utilisateurs illimités' : `${plan.max_users} Utilisateurs`}</span>
                        </div>
                     )}
                     {Object.entries({
                        module_crm_clients: 'CRM Clients & Relances',
                        module_suivi_terrain: 'Suivi Terrain Temps Réel',
                        module_logistique_pro: 'Outils Logistiques Pro',
                        module_livraisons_app: 'Application Livreurs Dédiée',
                        module_tresorerie_audit: 'Trésorerie & Audit Expert',
                        module_whatsapp: 'Alertes Client WhatsApp',
                        module_white_label: 'Solution Marque Blanche',
                        module_api: 'API Développeur Ouverte'
                     }).filter(([key]) => plan[key] === true).map(([key, label]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>
                           <CheckCircle size={18} className="text-cyan-500" />
                           <span>{label}</span>
                        </div>
                     ))}
                     {/* Features non incluses */}
                     {Object.entries({
                        module_whatsapp: 'Alertes Client WhatsApp',
                        module_white_label: 'Solution Marque Blanche',
                        module_api: 'API Développeur Ouverte'
                     }).filter(([key]) => plan[key] !== true).map(([key, label]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#475569', opacity: 0.6 }}>
                           <CheckCircle size={18} />
                           <span style={{ textDecoration: 'line-through' }}>{label}</span>
                        </div>
                     ))}
                  </div>

                  <button 
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(plan)}
                    style={{ 
                      width: '100%', 
                      height: '65px', 
                      borderRadius: '20px', 
                      background: isCurrent ? 'rgba(255,255,255,0.05)' : isPopular ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'white', 
                      color: isCurrent ? '#64748b' : isPopular ? 'white' : 'black', 
                      border: 'none', 
                      fontWeight: 950, 
                      fontSize: '0.9rem', 
                      marginTop: '2.5rem',
                      cursor: isCurrent ? 'default' : 'pointer',
                      boxShadow: isPopular ? '0 10px 25px rgba(59, 130, 246, 0.4)' : 'none',
                      transition: 'all 0.3s'
                    }}
                  >
                    {isCurrent ? 'FORFAIT ACTUEL' : 'S\'ABONNER MAINTENANT'}
                  </button>
                </div>
              );
           })}
        </div>

        <div className="card" style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', borderRadius: '24px' }}>
         <p style={{ fontWeight: 600, color: '#94a3b8', margin: 0 }}>Besoin d'un plan custom (Multi-entrepôts, White-label) ? 📧 Contactez bigreussite@gmail.com ou Appelez le +225 01 00 57 65 26</p>
      </div>
      </div>
    </div>
  );
};
