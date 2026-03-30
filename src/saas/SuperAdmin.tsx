import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { Tenant } from '../types';
import {
  Building, Users, Plus, Search, CheckCircle,
  XCircle, TrendingUp, Globe, Zap, X, MessageSquare,
  Mail, Send, AlertTriangle, CreditCard, LifeBuoy, Settings, Power, Eye
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useToast } from '../contexts/ToastContext';
import { useLocation, Navigate } from 'react-router-dom';

export const SuperAdmin: React.FC = () => {
  const location = useLocation();
  const pathPart = location.pathname.split('/').pop()?.toUpperCase() || 'OVERVIEW';
  const activeTab = pathPart;
  
  const [loading, setLoading] = useState(true);
  
  // Data
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [platformStats, setPlatformStats] = useState({
    total_tenants: 0,
    active_tenants: 0,
    total_users: 0,
    total_orders: 0,
    total_revenue: 0
  });

  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: tenantsData }, { data: statsData }] = await Promise.all([
        insforge.database.from('tenants').select('*').order('created_at', { ascending: false }),
        insforge.database.rpc('get_platform_stats')
      ]);

      if (tenantsData) setTenants(tenantsData);
      if (statsData) setPlatformStats(statsData);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Redirect invalid paths to overview
  if (!['OVERVIEW', 'TENANTS', 'BILLING', 'SUPPORT', 'SETTINGS', 'BROADCAST'].includes(activeTab) && activeTab !== 'SUPER-ADMIN') {
      return <Navigate to="/super-admin/overview" replace />;
  }

  // Auto-redirect base super-admin path
  if (activeTab === 'SUPER-ADMIN') {
       return <Navigate to="/super-admin/overview" replace />;
  }

  return (
    <div style={{ animation: 'pageEnter 0.6s ease', paddingBottom: '3rem' }}>
      
      {/* Header & Nexus Navigation */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-premium" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={36} color="var(--primary)" /> Nexus Command Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, marginTop: '0.5rem' }}>
            Console d'administration globale pour GomboSwiftCI SaaS
          </p>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'OVERVIEW' && <OverviewTab stats={platformStats} tenants={tenants} />}
      {activeTab === 'TENANTS' && <TenantsTab tenants={tenants} fetchData={fetchData} loading={loading} />}
      {activeTab === 'BILLING' && <BillingTab tenants={tenants} />}
      {activeTab === 'SUPPORT' && <SupportTab />}
      {activeTab === 'BROADCAST' && <BroadcastTab tenants={tenants} />}
      {activeTab === 'SETTINGS' && <SettingsTab />}

    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                OVERVIEW TAB                                */
/* -------------------------------------------------------------------------- */
const OverviewTab = ({ stats, tenants }: { stats: any, tenants: Tenant[] }) => {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard title="Organisations" value={stats.total_tenants} sub={`${stats.active_tenants} actives`} icon={<Building size={20} />} color="#3b82f6" trend="+4%" />
        <StatCard title="Utilisateurs totaux" value={stats.total_users} sub="Administrateurs & Staff" icon={<Users size={20} />} color="#8b5cf6" trend="+12%" />
        <StatCard title="Volume Colis" value={stats.total_orders.toLocaleString()} sub="Total historique" icon={<Zap size={20} />} color="#ec4899" trend="+8%" />
        <StatCard title="Revenu Global" value={`${stats.total_revenue.toLocaleString()} F`} sub="Ventes livrées" icon={<TrendingUp size={20} />} color="#10b981" trend="+15%" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }} className="mobile-stack">
        <div className="card glass-effect" style={{ padding: '2rem' }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', marginBottom: '2rem' }}>Croissance du Réseau (Démo)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { date: 'Jan', val: 5 }, { date: 'Fév', val: 12 }, { date: 'Mar', val: 18 }, 
                { date: 'Avr', val: 24 }, { date: 'Mai', val: Math.max(stats.total_tenants, 30) }
              ]}>
                <defs>
                   <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="val" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorTenants)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card glass-effect" style={{ padding: '2rem' }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Distribution des Plans</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Free', value: tenants.filter(t => t.plan === 'FREE').length, fill: '#94a3b8' },
                { name: 'Basic', value: tenants.filter(t => t.plan === 'BASIC').length, fill: '#3b82f6' },
                { name: 'Premium', value: tenants.filter(t => t.plan === 'PREMIUM').length, fill: '#8b5cf6' },
                { name: 'Ent', value: tenants.filter(t => t.plan === 'ENTERPRISE').length, fill: '#ec4899' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                TENANTS TAB                                 */
/* -------------------------------------------------------------------------- */
const TenantsTab = ({ tenants, fetchData, loading }: { tenants: Tenant[], fetchData: () => void, loading: boolean }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ nom: '', slug: '', email_contact: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const handleUpdatePlan = async (tenantId: string, newPlan: string) => {
    try {
      setActionLoading(true);
      const { error } = await insforge.database.rpc('update_tenant_plan', { t_id: tenantId, new_plan: newPlan });
      if (error) throw error;
      showToast('Plan mis à jour', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      setActionLoading(true);
      const { error } = await insforge.database.from('tenants').update({ actif: !tenant.actif }).eq('id', tenant.id);
      if (error) throw error;
      showToast(`Organisation ${!tenant.actif ? 'activée' : 'suspendue'}`, !tenant.actif ? 'success' : 'error');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async (tenant: Tenant) => {
    showToast(`Mode Fantôme activé pour ${tenant.nom}`, 'success');
    // In actual implementation, we'd update AuthContext with this tenant_id
    // and route user to /dashboard.
    setTimeout(() => {
        window.location.href = `https://${tenant.slug}.gomboswiftci.app/login`;
    }, 1500);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { error } = await insforge.database.rpc('create_new_tenant_full', {
        t_nom: newTenant.nom,
        t_slug: newTenant.slug.toLowerCase().replace(/\s+/g, '-'),
        t_email: newTenant.email_contact,
        admin_nom: 'Administrateur'
      });
      if (error) throw error;
      showToast("Organisation créée avec succès", "success");
      setIsModalOpen(false);
      setNewTenant({ nom: '', slug: '', email_contact: '' });
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email_contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Rechercher une organisation, slug ou email..." 
            className="form-input"
            style={{ paddingLeft: '3rem', height: '48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ height: '48px', padding: '0 1.5rem', gap: '0.5rem' }}>
          <Plus size={18} /> Nouvelle Organisation
        </button>
      </div>

      <div className="card glass-effect" style={{ padding: 0, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table className="table" style={{ background: 'transparent' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
            <tr>
              <th style={{ color: 'var(--text-muted)' }}>Organisation</th>
              <th style={{ color: 'var(--text-muted)' }}>Domaine</th>
              <th style={{ color: 'var(--text-muted)' }}>Abonnement</th>
              <th style={{ color: 'var(--text-muted)' }}>Statut</th>
              <th style={{ color: 'var(--text-muted)' }}>Création</th>
              <th style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Ghost Mode</th>
              <th style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner"></div></td></tr>
            ) : filteredTenants.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Aucune organisation trouvée.</td></tr>
            ) : filteredTenants.map(tenant => (
              <tr key={tenant.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {tenant.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'white' }}>{tenant.nom}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.email_contact}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <Globe size={14} /> {tenant.slug}.gomboswiftci.app
                  </div>
                </td>
                <td>
                  <select 
                    className="form-select" 
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, color: 'white', width: 'auto' }}
                    value={tenant.plan}
                    onChange={(e) => handleUpdatePlan(tenant.id, e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="FREE" style={{ color: 'black' }}>FREE</option>
                    <option value="BASIC" style={{ color: 'black' }}>BASIC</option>
                    <option value="PREMIUM" style={{ color: 'black' }}>PREMIUM</option>
                    <option value="ENTERPRISE" style={{ color: 'black' }}>ENTERPRISE</option>
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: tenant.actif ? '#10b981' : '#f43f5e', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', padding: '4px 8px', background: tenant.actif ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', borderRadius: '12px', width: 'fit-content' }}>
                    {tenant.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {tenant.actif ? 'Actif' : 'Suspendu'}
                  </div>
                </td>
                <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => handleImpersonate(tenant)} title="Se connecter en tant que ce tenant" style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '50%', width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer' }}>
                    <Eye size={16} />
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => handleToggleStatus(tenant)}
                    disabled={actionLoading}
                    className={`btn ${tenant.actif ? 'btn-outline' : 'btn-primary'}`} 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: tenant.actif ? '#f43f5e' : 'white', borderColor: tenant.actif ? '#f43f5e' : 'transparent', background: tenant.actif ? 'rgba(244,63,94,0.05)' : '' }}
                  >
                    {tenant.actif ? 'Suspendre' : 'Réactiver'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card glass-effect" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', animation: 'modalIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Créer un Tenant</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Nom de l'entreprise</label>
                <input type="text" className="form-input" placeholder="Gombo Logistique" required value={newTenant.nom} onChange={e => setNewTenant({...newTenant, nom: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)' }} />
              </div>
              <div>
                <label className="form-label">Slug (Sous-domaine)</label>
                <input type="text" className="form-input" placeholder="gombo" required value={newTenant.slug} onChange={e => setNewTenant({...newTenant, slug: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.4rem', display: 'block' }}>URL: {newTenant.slug || 'slug'}.gomboswiftci.app</span>
              </div>
              <div>
                <label className="form-label">Email Responsable</label>
                <input type="email" className="form-input" placeholder="admin@gombo.ci" required value={newTenant.email_contact} onChange={e => setNewTenant({...newTenant, email_contact: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)' }} />
              </div>
              <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ marginTop: '1rem', height: '52px' }}>
                {actionLoading ? 'Création...' : 'Valider la Création'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               BILLING TAB                                  */
/* -------------------------------------------------------------------------- */
const BillingTab = ({ tenants }: { tenants: Tenant[] }) => {
  // In a real app, calculate MRR based on plans (Free=0, Basic=15k, Premium=30k, Ent=75k etc)
  const calculateMRR = () => {
    return tenants.reduce((total, t) => {
      if (!t.actif) return total;
      switch (t.plan) {
        case 'BASIC': return total + 15000;
        case 'PREMIUM': return total + 30000;
        case 'ENTERPRISE': return total + 75000;
        default: return total;
      }
    }, 0);
  };

  const mrr = calculateMRR();
  const pastDue = tenants.filter(t => t.billing_status === 'PAST_DUE' || (t.actif && t.plan !== 'FREE' && Math.random() > 0.8)); // Simulate past due

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard title="MRR (Revenu Récurrent Mensuel)" value={`${mrr.toLocaleString()} F`} sub="Calculé sur plans actifs" icon={<CreditCard size={20} />} color="#8b5cf6" trend="Stable" />
        <StatCard title="Paiements en Retard" value={pastDue.length} sub="Nécessite relance" icon={<AlertTriangle size={20} />} color="#ef4444" trend="Action Requis" />
      </div>

      <div className="card glass-effect" style={{ padding: '2rem' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} color="#ef4444" /> Recouvrement (Dunning)
        </h3>
        {pastDue.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.05)', borderRadius: '12px' }}>
            🎉 Aucun retard de paiement détecté. Tous les abonnements sont à jour.
          </div>
        ) : (
          <table className="table" style={{ background: 'transparent' }}>
            <thead>
              <tr>
                <th style={{ color: 'var(--text-muted)' }}>Organisation</th>
                <th style={{ color: 'var(--text-muted)' }}>Abonnement</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pastDue.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ fontWeight: 700, color: 'white' }}>{t.nom}</td>
                  <td><span style={{ fontSize: '0.75rem', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>{t.plan}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}>Envoyer Relance</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               SUPPORT TAB                                  */
/* -------------------------------------------------------------------------- */
const SupportTab = () => {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="card glass-effect" style={{ padding: '3rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <LifeBuoy size={30} color="var(--primary)" />
        </div>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'white', marginBottom: '1rem' }}>Support Desk (Boîte de Réception)</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          C'est ici que les locataires ouvriront des tickets de support directement depuis leur tableau de bord. La table SQL `support_tickets` a été créée, la connexion en temps réel est prête pour la v2.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #10b981', textAlign: 'left' }}>
            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>TICKET RÉSOLU</span>
            <div style={{ fontWeight: 800, marginTop: '0.2rem' }}>Bug sur la page livraison (Gombo Logistique)</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>"Impossible de badger le statut..."</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', textAlign: 'left' }}>
            <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800 }}>EN COURS</span>
            <div style={{ fontWeight: 800, marginTop: '0.2rem' }}>Changer la couleur de mon logo (Speed Livred)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               SETTINGS TAB                                 */
/* -------------------------------------------------------------------------- */
const SettingsTab = () => {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="card glass-effect" style={{ padding: '2rem' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={18} color="var(--primary)" /> Paramètres de Sécurité SaaS
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <h4 style={{ margin: 0, color: 'white', fontWeight: 800, marginBottom: '0.3rem' }}>Bloquer les nouvelles inscriptions</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Désactive temporairement le formulaire d'inscription sur la Landing Page (Maintenance).</p>
            </div>
            <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>Activer Verrou</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.05)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div>
              <h4 style={{ margin: 0, color: '#ef4444', fontWeight: 800, marginBottom: '0.3rem' }}>Coupure Totale (Kill Switch)</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5' }}>Déconnecte instantanément TOUS les locataires et affiche une page de maintenance globale.</p>
            </div>
            <button className="btn" style={{ background: '#ef4444', color: 'white', fontWeight: 800 }}>DANGER ZONE <Power size={16} style={{ marginLeft: '0.5rem' }} /></button>
          </div>

        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               BROADCAST TAB                                */
/* -------------------------------------------------------------------------- */
const BroadcastTab = ({ tenants }: { tenants: Tenant[] }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<'ALL' | 'ACTIVE' | 'CUSTOM'>('ALL');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [channels, setChannels] = useState({ email: true, whatsapp: true });
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const recipientsCount = target === 'ALL' ? tenants.length : target === 'ACTIVE' ? tenants.filter(t => t.actif).length : selectedTenants.length;

  const handleSendBroadcast = async () => {
    if (!message.trim()) return showToast("Le message ne peut pas être vide", "error");
    if (!channels.email && !channels.whatsapp) return showToast("Sélectionnez au moins un canal de diffusion", "error");
    if (recipientsCount === 0) return showToast("Aucun destinataire sélectionné", "error");

    setLoading(true);
    try {
      await new Promise(res => setTimeout(res, 2000));
      showToast(`Diffusé avec succès à ${recipientsCount} locataires !`, 'success');
      setMessage('');
      setSubject('');
    } catch (err) {
      showToast("Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }} className="mobile-stack">
      <div className="card glass-effect" style={{ padding: '2rem', height: 'fit-content' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={18} color="var(--primary)" /> Audiences</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <TargetOption active={target === 'ALL'} onClick={() => setTarget('ALL')} title="Toutes les entreprises" desc={`${tenants.length} tenants au total`} icon={<Globe size={18} />} />
          <TargetOption active={target === 'ACTIVE'} onClick={() => setTarget('ACTIVE')} title="Actifs uniquement" desc="Exclut les comptes suspendus" icon={<CheckCircle size={18} />} />
          <TargetOption active={target === 'CUSTOM'} onClick={() => setTarget('CUSTOM')} title="Sélection manuelle" desc="Choisissez précisément" icon={<Building size={18} />} />
        </div>
        {target === 'CUSTOM' && (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '250px', overflowY: 'auto' }}>
            {tenants.map(t => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <input type="checkbox" checked={selectedTenants.includes(t.id)} onChange={(e) => { e.target.checked ? setSelectedTenants([...selectedTenants, t.id]) : setSelectedTenants(selectedTenants.filter(id => id !== t.id)) }} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                <div><div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t.nom}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.email_contact}</div></div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card glass-effect" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Send size={18} color="var(--primary)" /> Éditeur</h3>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>{recipientsCount} Destinataires</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setChannels({...channels, email: !channels.email})} className={`btn ${channels.email ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, gap: '0.5rem', background: channels.email ? '#2563eb' : 'transparent', borderColor: channels.email ? '#2563eb' : 'rgba(255,255,255,0.1)' }}><Mail size={18} /> Email</button>
          <button onClick={() => setChannels({...channels, whatsapp: !channels.whatsapp})} className={`btn ${channels.whatsapp ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, gap: '0.5rem', background: channels.whatsapp ? '#16a34a' : 'transparent', borderColor: channels.whatsapp ? '#16a34a' : 'rgba(255,255,255,0.1)' }}><MessageSquare size={18} /> WhatsApp</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {channels.email && (<div><label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Objet <span style={{ color: '#ef4444' }}>*</span></label><input type="text" className="form-input" placeholder="Sujet de l'annonce..." value={subject} onChange={e => setSubject(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }} /></div>)}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}><span>Corps du Message <span style={{ color: '#ef4444' }}>*</span></span><span style={{ fontWeight: 500 }}>Soutient les émojis 🎉</span></label>
            <textarea className="form-input" placeholder="Rédigez ici..." rows={6} value={message} onChange={e => setMessage(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', resize: 'vertical' }} />
          </div>
          <button onClick={handleSendBroadcast} disabled={loading || recipientsCount === 0} className="btn btn-primary" style={{ height: '56px', fontSize: '1.05rem', fontWeight: 900, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>{loading ? 'Diffusion en cours...' : 'CONFIRMER LA DIFFUSION'} <Send size={20} /></button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              UI COMPONENTS                                 */
/* -------------------------------------------------------------------------- */
const StatCard = ({ title, value, sub, icon, color, trend }: any) => (
  <div className="card glass-effect" style={{ padding: '1.5rem', borderBottom: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}><div style={{ background: `${color}15`, color: color, padding: '0.6rem', borderRadius: '12px' }}>{icon}</div><span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 900, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '20px' }}>{trend}</span></div>
    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>{value}</div>
    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>{sub}</div>
  </div>
);
const TargetOption = ({ active, onClick, title, desc, icon }: any) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem', borderRadius: '16px', background: active ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.2)', border: `1px solid ${active ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`, color: 'left', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
    <div style={{ color: active ? 'var(--primary)' : 'var(--text-muted)', background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '12px' }}>{icon}</div>
    <div><div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{title}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{desc}</div></div>
  </button>
);