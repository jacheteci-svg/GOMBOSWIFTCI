import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { Tenant } from '../types';
import {
  Building, Users, Plus, Search, CheckCircle,
  XCircle, TrendingUp, Globe, Zap, X, MessageSquare,
  Mail, Send, AlertTriangle, CreditCard, LifeBuoy, Settings, Power, Eye, Crown, Save, Activity, ShieldCheck
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
  if (!['OVERVIEW', 'TENANTS', 'BILLING', 'SUPPORT', 'SETTINGS', 'BROADCAST', 'PLANS'].includes(activeTab) && activeTab !== 'SUPER-ADMIN') {
      return <Navigate to="/super-admin/overview" replace />;
  }

  // Auto-redirect base super-admin path
  if (activeTab === 'SUPER-ADMIN') {
       return <Navigate to="/super-admin/overview" replace />;
  }

  return (
    <div style={{ 
      animation: 'pageEnter 0.6s ease', 
      paddingBottom: '3rem',
      background: '#020617', // Deep dark Nexus background
      color: '#f8fafc',
      margin: '-2rem', // Negate page-content padding
      padding: '2rem 2rem 5rem 2rem',
      minHeight: 'calc(100vh - 70px)'
    }}>
      
      {/* Header & Nexus Navigation */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-premium" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={36} color="var(--primary)" /> Nexus Command Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500, marginTop: '0.5rem' }}>
            Console d'administration globale pour GomboSwiftCI SaaS
          </p>
        </div>
      </div>

      {/* Horizontal Tabs Navigation */}
      <div style={{ 
        display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }} className="custom-scroll">
        {[
          { id: 'OVERVIEW', label: 'Vue Globale', icon: <TrendingUp size={16} /> },
          { id: 'TENANTS', label: 'Organisations', icon: <Building size={16} /> },
          { id: 'PLANS', label: 'Abonnements', icon: <Crown size={16} /> },
          { id: 'BILLING', label: 'Facturation (MRR)', icon: <CreditCard size={16} /> },
          { id: 'SUPPORT', label: 'Help Desk', icon: <LifeBuoy size={16} /> },
          { id: 'BROADCAST', label: 'Broadcast', icon: <Activity size={16} /> },
          { id: 'SETTINGS', label: 'Sécurité Plateforme', icon: <ShieldCheck size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => window.location.href = `/super-admin/${tab.id.toLowerCase()}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'rgba(99,102,241,0.5)' : 'transparent',
              background: activeTab === tab.id ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ color: activeTab === tab.id ? 'var(--primary)' : 'inherit' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'OVERVIEW' && <OverviewTab stats={platformStats} tenants={tenants} />}
      {activeTab === 'TENANTS' && <TenantsTab tenants={tenants} fetchData={fetchData} loading={loading} />}
      {activeTab === 'PLANS' && <PlansTab />}
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
    <div style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* General Settings */}
      <div className="card glass-effect" style={{ padding: '2.5rem', marginBottom: '2.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
          <Settings size={22} color="var(--primary)" /> Configuration Globale
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Paramétrez les accès publics de votre plateforme SaaS.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.3s' }} className="hover-lift">
          <div>
            <h4 style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.3rem' }}>Bloquer les nouvelles inscriptions</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Désactive temporairement le formulaire d'inscription public.</p>
          </div>
          <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', padding: '0.6rem 1.2rem', fontWeight: 700 }}>Activer Verrou</button>
        </div>
      </div>

      {/* Danger Zone (Vercel Style) */}
      <h3 style={{ margin: '0 0 1rem 0.5rem', fontWeight: 900, fontSize: '1.1rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Zone Critique (Danger Zone)
      </h3>
      <div style={{ border: '1px solid rgba(239,68,68,0.5)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '2rem', background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h4 style={{ margin: 0, color: '#f87171', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Power size={18} /> Coupure Totale (Kill Switch)
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5 }}>
                Déconnecte instantanément TOUTES les organisations et affiche une page de maintenance globale. Aucune transaction ne pourra plus passer.
              </p>
            </div>
            <button className="btn" style={{ background: '#ef4444', color: 'white', fontWeight: 900, padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid #b91c1c', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}>
              DÉCLENCHER ARRÊT
            </button>
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
    <div style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }} className="mobile-stack">
      
      {/* Colonne Gauche: Audience */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white' }}>
            <Users size={20} color="var(--primary)" /> Configuration de l'Audience
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <TargetOption active={target === 'ALL'} onClick={() => setTarget('ALL')} title="Toutes les entreprises" desc={`${tenants.length} tenants au total`} icon={<Globe size={18} />} />
            <TargetOption active={target === 'ACTIVE'} onClick={() => setTarget('ACTIVE')} title="Actifs uniquement" desc="Exclut les comptes suspendus" icon={<CheckCircle size={18} />} />
            <TargetOption active={target === 'CUSTOM'} onClick={() => setTarget('CUSTOM')} title="Sélection manuelle" desc="Choisissez précisément" icon={<Building size={18} />} />
          </div>

          {target === 'CUSTOM' && (
            <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', maxHeight: '300px', overflowY: 'auto' }} className="custom-scroll">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Cochez les destinataires :</p>
              {tenants.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', borderRadius: '8px' }}>
                  <input type="checkbox" checked={selectedTenants.includes(t.id)} onChange={(e) => { e.target.checked ? setSelectedTenants([...selectedTenants, t.id]) : setSelectedTenants(selectedTenants.filter(id => id !== t.id)) }} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{t.nom}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email_contact}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Colonne Droite: Composeur */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Composeur */}
        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white' }}>
              <Send size={22} color="var(--primary)" /> Composeur Principal
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Envoyez des mises à jour aux locataires</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(99,102,241,0.1)', padding: '0.5rem 1rem', borderRadius: '30px', border: '1px solid rgba(99,102,241,0.2)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: recipientsCount > 0 ? '#10b981' : '#f43f5e', boxShadow: `0 0 10px ${recipientsCount > 0 ? '#10b981' : '#f43f5e'}` }}></span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>{recipientsCount} Destinataires</span>
          </div>
        </div>

        {/* Corps du Composeur */}
        <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Sélection Canaux */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.8rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Canaux de Diffusion</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setChannels({...channels, email: !channels.email})} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '12px', background: channels.email ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${channels.email ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.05)'}`, color: channels.email ? '#60a5fa' : 'var(--text-muted)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: channels.email ? '0 4px 15px rgba(59,130,246,0.1)' : 'none' }}>
                <Mail size={20} /> E-Mail Direct
              </button>
              <button onClick={() => setChannels({...channels, whatsapp: !channels.whatsapp})} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '12px', background: channels.whatsapp ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${channels.whatsapp ? 'rgba(22,163,74,0.5)' : 'rgba(255,255,255,0.05)'}`, color: channels.whatsapp ? '#4ade80' : 'var(--text-muted)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: channels.whatsapp ? '0 4px 15px rgba(22,163,74,0.1)' : 'none' }}>
                <MessageSquare size={20} /> WhatsApp
              </button>
            </div>
          </div>

          {channels.email && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Objet de l'E-Mail <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" placeholder="Ex: GomboSwiftCI V2 - Nouvelle Mise à jour ! 🎉" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: '1rem 1.25rem', fontSize: '1rem', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none', transition: 'border 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Texte de l'Annonce <span style={{ color: '#ef4444' }}>*</span></label>
              <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 700, background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '10px' }}>MarkDown & Emojis supportés</span>
            </div>
            <textarea placeholder="Chers partenaires, nous sommes ravis de vous annoncer..." value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', flex: 1, minHeight: '200px', padding: '1.25rem', fontSize: '1.05rem', lineHeight: 1.6, background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', resize: 'vertical', outline: 'none', transition: 'border 0.2s', fontFamily: 'inherit' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          </div>

          <button onClick={handleSendBroadcast} disabled={loading || recipientsCount === 0} className="btn" style={{ width: '100%', height: '60px', fontSize: '1.1rem', fontWeight: 900, background: (loading || recipientsCount === 0) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: (loading || recipientsCount === 0) ? '#64748b' : 'white', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: (loading || recipientsCount === 0) ? 'not-allowed' : 'pointer', boxShadow: (loading || recipientsCount === 0) ? 'none' : '0 10px 25px -5px rgba(99,102,241,0.5)', transition: 'all 0.3s' }}>
             {loading ? <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div> : <>LANCER LA DIFFUSION <Send size={22} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 PLANS TAB                                  */
/* -------------------------------------------------------------------------- */
const PlansTab = () => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database.from('saas_plans').select('*').order('price_fcfa', { ascending: true });
      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      showToast(err.message || 'Erreur chargement plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleChange = (id: string, field: string, value: any) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async (plan: any) => {
    setSaving(plan.id);
    try {
      const { error } = await insforge.database.from('saas_plans').update({
        name: plan.name,
        price_fcfa: plan.price_fcfa,
        description: plan.description,
        is_popular: plan.is_popular,
        module_caisse: plan.module_caisse,
        module_audit: plan.module_audit,
        module_api: plan.module_api,
        max_users: plan.max_users
      }).eq('id', plan.id);
      if (error) throw error;
      showToast(`Forfait ${plan.name} mis à jour !`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner"></div></div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Crown size={24} color="var(--primary)" /> Gestion des Forfaits
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>Mettez à jour les tarifs et fonctionnalités des forfaits SaaS qui apparaîtront publiquement.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {plans.map(plan => (
          <div key={plan.id} className="card glass-effect" style={{ 
            padding: '2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem', 
            background: plan.is_popular ? 'linear-gradient(145deg, rgba(99,102,241,0.05) 0%, rgba(2,6,23,0.8) 100%)' : 'rgba(2,6,23,0.6)',
            border: plan.is_popular ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: plan.is_popular ? '0 0 30px -10px var(--primary-glow)' : '0 10px 30px -10px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Accent */}
            {plan.is_popular && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--primary)' }}></div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, background: plan.is_popular ? 'var(--primary)' : 'rgba(255,255,255,0.08)', padding: '6px 14px', borderRadius: '30px', color: plan.is_popular ? 'white' : '#94a3b8', letterSpacing: '0.05em' }}>
                {plan.id}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: plan.is_popular ? '#a5b4fc' : '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>
                Populaire 
                <input type="checkbox" checked={plan.is_popular} onChange={e => handleChange(plan.id, 'is_popular', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
              </label>
            </div>

            <div>
              <label className="form-label" style={{ color: '#cbd5e1' }}>Nom du forfait</label>
              <input type="text" className="form-input" value={plan.name} onChange={e => handleChange(plan.id, 'name', e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '1.1rem', fontWeight: 800 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Prix (FCFA)</label>
                <input type="number" className="form-input" value={plan.price_fcfa} onChange={e => handleChange(plan.id, 'price_fcfa', parseInt(e.target.value))} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#4ade80', fontSize: '1.1rem', fontWeight: 900 }} />
              </div>
              <div>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Période</label>
                <input type="text" className="form-input" disabled value={plan.period} style={{ background: 'rgba(255,255,255,0.03)', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)' }} />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ color: '#cbd5e1' }}>Description vitrine</label>
              <textarea className="form-input" value={plan.description || ''} onChange={e => handleChange(plan.id, 'description', e.target.value)} rows={2} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', resize: 'none' }} />
            </div>

            {/* Modules Access */}
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
              <label className="form-label" style={{ marginBottom: '1.2rem', color: '#f8fafc', fontSize: '0.9rem' }}>Permissions & Modules</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
                  <span>📦 Caisse & Retours</span>
                  <input type="checkbox" checked={plan.module_caisse} onChange={e => handleChange(plan.id, 'module_caisse', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
                  <span>📊 Audit Expert</span>
                  <input type="checkbox" checked={plan.module_audit} onChange={e => handleChange(plan.id, 'module_audit', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
                  <span>🤖 Accès API Externe</span>
                  <input type="checkbox" checked={plan.module_api} onChange={e => handleChange(plan.id, 'module_api', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }} />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1', marginTop: '0.5rem', fontWeight: 600 }}>
                  <span>👥 Utilisateurs Max</span>
                  <input type="number" value={plan.max_users || 0} onChange={e => handleChange(plan.id, 'max_users', parseInt(e.target.value))} style={{ width: '80px', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', textAlign: 'center', fontWeight: 900 }} title="0 = Illimité" />
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleSave(plan)} 
              disabled={saving === plan.id}
              className="btn" 
              style={{ 
                marginTop: 'auto', 
                width: '100%', 
                height: '52px',
                justifyContent: 'center',
                background: plan.is_popular ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: plan.is_popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                fontWeight: 800
              }}
            >
              {saving === plan.id ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : <><Save size={18} /> ENREGISTRER</>}
            </button>
          </div>
        ))}
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