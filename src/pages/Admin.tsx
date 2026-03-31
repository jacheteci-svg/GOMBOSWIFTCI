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
    <div style={{ animation: 'pageEnter 0.6s ease' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-premium" style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>
          {hasPermission('ADMIN') ? 'Administration' : 'Gestion Équipe & Zones'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '0.4rem', fontWeight: 500 }}>
          {hasPermission('ADMIN') 
            ? 'Gestion globale du système et des accès.' 
            : 'Gestion des zones de livraison et de l\'équipe.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', padding: '0.4rem', background: '#f1f5f9', borderRadius: '16px', width: 'fit-content' }}>
        {canManageUsers && (
          <button 
            className="btn"
            onClick={() => setActiveTab('utilisateurs')}
            style={{ 
              background: activeTab === 'utilisateurs' ? 'white' : 'transparent',
              color: activeTab === 'utilisateurs' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'utilisateurs' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              border: 'none', padding: '0.7rem 1.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <UsersIcon size={18} strokeWidth={activeTab === 'utilisateurs' ? 2.5 : 2} /> 
            {hasPermission('ADMIN') ? 'Utilisateurs' : 'Équipe Livreurs'}
          </button>
        )}
        {canManageCommunes && (
          <button 
            className="btn"
            onClick={() => setActiveTab('communes')}
            style={{ 
              background: activeTab === 'communes' ? 'white' : 'transparent',
              color: activeTab === 'communes' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'communes' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              border: 'none', padding: '0.7rem 1.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <MapIcon size={18} strokeWidth={activeTab === 'communes' ? 2.5 : 2} /> Zones & Tarifs
          </button>
        )}
        <button 
          className="btn"
          onClick={() => setActiveTab('abonnement')}
          style={{ 
            background: activeTab === 'abonnement' ? 'white' : 'transparent',
            color: activeTab === 'abonnement' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'abonnement' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
            border: 'none', padding: '0.7rem 1.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <CreditCard size={18} strokeWidth={activeTab === 'abonnement' ? 2.5 : 2} /> Mon Abonnement
        </button>
      </div>

      <div>
        {!tenant ? (
          <div className="card glass-effect" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Chargement de l'espace boutique...</p>
          </div>
        ) : (
          activeTab === 'utilisateurs' ? <UsersManager showToast={showToast} tenantId={tenant.id} /> : 
          activeTab === 'communes' ? <CommunesManager showToast={showToast} tenantId={tenant.id} /> :
          <SubscriptionManager showToast={showToast} tenant={tenant} />
        )}
      </div>
    </div>
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
        const { data: authData, error } = await insforge.auth.signUp({ 
          email: email as string, 
          password: password as string
        });
        if (error) throw error;
        
        await createAdminUser({
          nom_complet: form.nom_complet || '',
          email: email as string,
          role: form.role as any,
          telephone: sanitizedTel,
          permissions: form.permissions || [],
          actif: true,
          tenant_id: tenantId
        }, authData?.user?.id || '');
      } else if (editingId) {
        await updateAdminUser(tenantId, editingId, { ...form, telephone: sanitizedTel });
      }
      showToast("Enregistré.", "success");
      setEditingId(null); setForm({}); loadUsers();
    } catch (e: any) { 
      showToast(e.message || "Erreur.", "error"); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card table-responsive-cards" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Liste des Utilisateurs</h3>
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
          title={isLimitReached ? "Limite d'utilisateurs atteinte pour votre forfait." : ""}
        >
          <Plus size={18} /> Nouvel Utilisateur
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nom & Tel</th>
              <th>Rôle / Email</th>
              <th>Permissions</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(editingId === 'new' || (editingId && users.find(u => u.id === editingId))) && (
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={4}>
                  <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Nom Complet</label>
                      <input className="form-input" value={form.nom_complet || ''} onChange={e => setForm({...form, nom_complet: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Téléphone</label>
                      <input className="form-input" value={form.telephone || ''} onChange={e => setForm({...form, telephone: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rôle</label>
                      <select className="form-select" value={form.role || ''} onChange={e => setForm({...form, role: e.target.value as any})}>
                        {isAdmin && (
                          <>
                            <option value="ADMIN">Administrateur</option>
                            <option value="GESTIONNAIRE">Gestionnaire</option>
                            <option value="AGENT_APPEL">Call Center (Appels)</option>
                            <option value="LOGISTIQUE">Logistique</option>
                          </>
                        )}
                        <option value="LIVREUR">Livreur</option>
                        {isAdmin && (
                          <>
                            <option value="CAISSIERE">Caissière</option>
                            <option value="AGENT_MIXTE">Agent Mixte (Caisse + Call)</option>
                          </>
                        )}
                      </select>
                    </div>
                    {form.role !== 'LIVREUR' && (
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                      </div>
                    )}
                    {editingId === 'new' && (
                      <div className="form-group">
                        <label className="form-label">Mot de Passe (Optionnel)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder={form.role === 'LIVREUR' ? 'Défaut: Téléphone' : 'Défaut: Admin123!'}
                          value={form.password || ''} 
                          onChange={e => setForm({...form, password: e.target.value})} 
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {form.role === 'LIVREUR' ? 'Par défaut, c\'est son numéro de téléphone.' : 'Par défaut: Admin123!'}
                        </p>
                      </div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Permissions d'Accès</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.75rem', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        {PERMISSIONS_LIST.map(p => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                            <input type="checkbox" checked={form.permissions?.includes(p.id)} onChange={() => togglePermission(p.id)} style={{ width: '18px', height: '18px' }} />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button className="btn btn-outline" onClick={() => setEditingId(null)}>Annuler</button>
                      <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'Sauvegarde...' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {users.map(u => (
              <tr key={u.id}>
                <td data-label="Nom & Tel">
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.nom_complet}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.telephone || 'N/A'}</p>
                  </div>
                </td>
                <td data-label="Rôle / Email">
                  <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}`} style={{ marginBottom: '0.25rem', display: 'inline-block' }}>{u.role}</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</p>
                </td>
                <td data-label="Permissions">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {u.permissions?.slice(0, 3).map(p => (
                      <span key={p} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: '#f1f5f9', borderRadius: '4px', color: 'var(--text-muted)', fontWeight: 600 }}>{p}</span>
                    ))}
                    {(u.permissions?.length || 0) > 3 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{(u.permissions?.length || 0) - 3}</span>}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => {setEditingId(u.id); setForm(u);}}>Modifier</button>
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
    <div className="card table-responsive-cards" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Zones & Tarifs</h3>
        <button 
          className="btn btn-primary" 
          onClick={() => { setEditingId('new'); setForm({ tarif_livraison: 1500 }); }}
          disabled={loading}
        >
          <Plus size={18} /> Ajouter une zone
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Zone / Commune</th>
              <th>Tarif (CFA)</th>
              <th style={{ textAlign: 'right', width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(editingId === 'new' || communes.some(c => c.id === editingId)) && editingId !== null && (
               <tr style={{ background: '#f8fafc' }}>
                 <td colSpan={3}>
                    <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                        <label className="form-label">Nom de la Zone</label>
                        <input className="form-input" value={form.nom || ''} onChange={e => setForm({...form, nom: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label className="form-label">Tarif de Livraison</label>
                        <input className="form-input" type="number" value={form.tarif_livraison ?? ''} onChange={e => setForm({...form, tarif_livraison: Number(e.target.value)})} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>OK</button>
                        <button className="btn btn-outline" onClick={() => setEditingId(null)}>Annuler</button>
                      </div>
                    </div>
                 </td>
               </tr>
            )}

            {communes.filter(c => c.id !== editingId).map(c => (
              <tr key={c.id}>
                <td data-label="Zone" style={{ fontWeight: 700 }}>{c.nom}</td>
                <td data-label="Tarif" style={{ color: 'var(--primary)', fontWeight: 800 }}>{c.tarif_livraison?.toLocaleString()} CFA</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => {setEditingId(c.id); setForm(c);}}>Modifier</button>
                    <button className="btn btn-outline btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
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
          <div style={{ background: 'rgba(255,255,255,0.4)', padding: '1.25rem', borderRadius: '20px', textAlign: 'right' }}>
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
                    border: plan.id === tenant.plan ? '2px solid var(--primary)' : '1px solid #e2e8f0',
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
      
      <div className="card" style={{ marginTop: '3rem', padding: '2rem', background: '#f8fafc', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>Besoin d'un plan custom (Multi-entrepôts, White-label) ? 📧 Contactez support@gomboswiftci.com</p>
      </div>
    </div>
  );
};
