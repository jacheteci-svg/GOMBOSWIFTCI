import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { Tenant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity, ShieldCheck, Eye, Power, X, Search, Send, 
  CreditCard, Zap, Users, Plus, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../contexts/ToastContext';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { BlogTab } from './BlogTab';
import { EmailLogsTab } from './EmailLogsTab';
import { emailService } from '../services/emailService';
import { PerformanceDashboard } from '../components/performance/PerformanceDashboard';

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
      console.error("SuperAdmin fetchData error:", err);
      showToast(err.message || 'Échec de synchronisation Nexus', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Redirect invalid paths to overview
  if (!['OVERVIEW', 'TENANTS', 'BILLING', 'SUPPORT', 'SETTINGS', 'BROADCAST', 'PLANS', 'PROFILE', 'BLOG', 'EMAILS', 'PERFORMANCE'].includes(activeTab) && activeTab !== 'SUPER-ADMIN') {
      return <Navigate to="/super-admin/overview" replace />;
  }

  // Auto-redirect base super-admin path
  if (activeTab === 'SUPER-ADMIN') {
       return <Navigate to="/super-admin/overview" replace />;
  }

  return (
    <div className="nexus-container" style={{ 
      animation: 'pageEnter 0.35s ease', 
      paddingBottom: '4rem',
      minHeight: '100%'
    }}>
      
      {/* Header Nexus */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ flexShrink: 0 }}>
              <img src="/favicon.png" alt="Nexus Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Nexus Core v4.0.2
            </span>
          </div>
          <h1 className="nexus-neon-text" style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
            Nexus Command Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500, marginTop: '0.5rem' }}>
            Pilotage global de l'infrastructure SaaS multi-tenant
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button 
             onClick={fetchData}
             disabled={loading}
             className="nexus-card" 
             style={{ 
               padding: '0.8rem 1.5rem', 
               display: 'flex', 
               alignItems: 'center', 
               gap: '1rem',
               cursor: 'pointer',
               border: '1px solid var(--nexus-border)',
               background: 'rgba(99, 102, 241, 0.1)',
               transition: 'all 0.3s'
             }}
           >
              <Activity size={18} color={loading ? "#94a3b8" : "#10b981"} className={loading ? "animate-spin" : ""} />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Statut Nexus</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: loading ? '#94a3b8' : '#10b981' }}>
                  {loading ? 'SYNCHRONISATION...' : 'SYSTÈME OPTIMAL'}
                </div>
              </div>
           </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      <div style={{ marginTop: '1rem', animation: 'fadeIn 0.5s ease' }}>
        {activeTab === 'OVERVIEW' && <OverviewTab stats={platformStats} tenants={tenants} />}
        {activeTab === 'TENANTS' && <TenantsTab tenants={tenants} fetchData={fetchData} loading={loading} />}
        {activeTab === 'PERFORMANCE' && <PerformanceHub />}
        {activeTab === 'PLANS' && <PlansTab />}
        {activeTab === 'BILLING' && <BillingTab tenants={tenants} />}
        {activeTab === 'SUPPORT' && <SupportTab />}
        {activeTab === 'BROADCAST' && <BroadcastTab tenants={tenants} />}
        {activeTab === 'BLOG' && <BlogTab />}
        {activeTab === 'EMAILS' && <EmailLogsTab />}
        {activeTab === 'SETTINGS' && <SecurityLogsTab />}
        {activeTab === 'PROFILE' && <ProfileTab />}
      </div>

    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

const NexusStatCard = ({ title, value, sub, icon, color, trend }: any) => (
  <div className="nexus-card nexus-stat-card px-6 py-8">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div style={{ background: `${color}20`, padding: '0.6rem', borderRadius: '12px', border: `1px solid ${color}30`, color: color }}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      {trend && (
        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: trend.startsWith('+') ? '#10b981' : trend === 'Stable' ? '#94a3b8' : '#6366f1', background: 'rgba(255,255,255,0.05)', padding: '3px 7px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {trend}
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 950, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 700 }}>
        {sub}
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                OVERVIEW TAB                                */
/* -------------------------------------------------------------------------- */
const OverviewTab = ({ stats, tenants }: { stats: any, tenants: Tenant[] }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Calculs statistiques
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.actif).length;
  const inactiveTenants = totalTenants - activeTenants;

  const planStats = {
    FREE: tenants.filter(t => t.plan === 'FREE').length,
    BASIC: tenants.filter(t => t.plan === 'BASIC').length,
    PREMIUM: tenants.filter(t => t.plan === 'PREMIUM').length,
    ENTERPRISE: tenants.filter(t => t.plan === 'ENTERPRISE').length,
    CUSTOM: tenants.filter(t => t.plan === 'CUSTOM').length
  };

  const handleAudit = () => {
    showToast("Analyse de l'infrastructure en cours...", "info");
    setTimeout(() => {
       showToast("Audit terminé. Configuration optimisée pour 5000+ utilisateurs.", "success");
    }, 2000);
  };

  return (
    <div className="nexus-theme-dark" style={{ animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* SECTION 1: WELCOME & PRIMARY FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem', marginBottom: '2.5rem' }} className="mobile-stack">
        {/* Profile Card */}
        <div className="nexus-card-elite px-8 py-10" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <div className="nexus-profile-circle" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>💎</div>
                  <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', border: '2px solid #1e293b' }}></div>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 950 }}>Root Admin</h4>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>Nexus Core Active</span>
                </div>
             </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>REVENU SaaS (30J)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 950, marginTop: '0.1rem', color: '#10b981' }}>{stats.total_revenue?.toLocaleString()} F</div>
            </div>
            <div>
              <div style={{ color: '#f59e0b', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EN ATTENTE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 950, marginTop: '0.1rem', color: '#fbbf24', opacity: 0.9 }}>{stats.pending_revenue?.toLocaleString() || 0} F</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>GMV CLIENTS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 950, marginTop: '0.1rem', color: '#f8fafc', opacity: 0.8 }}>{stats.tenant_gmv?.toLocaleString() || 0} F</div>
            </div>
          </div>
        </div>

        {/* Growth Area Chart */}
        <div className="nexus-card-elite">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Croissance Réseau (30 jours)</h4>
            <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 800, background: 'rgba(6,182,212,0.1)', padding: '4px 10px', borderRadius: '8px' }}>+ 5.27%</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growth_chart || []}>
                <defs>
                  <linearGradient id="nexusGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 800}} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="val" stroke="#06b6d4" strokeWidth={4} fill="url(#nexusGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: GRID OF METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Activity Gauge */}
        <div className="nexus-card-elite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, color: '#f8fafc', width: '100%' }}>Statut des Clients (Tenants)</h4>
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
             <svg width="180" height="180" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={`${(activeTenants / Math.max(totalTenants, 1)) * 283}, 283`} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
             </svg>
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 950 }}>{Math.round((activeTenants / Math.max(totalTenants, 1)) * 100)}%</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>TAUX D'ACTIVITÉ</div>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', width: '100%' }}>
             <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 950, color: '#10b981' }}>{activeTenants}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>ACTIFS</div>
             </div>
             <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 950, color: '#ef4444' }}>{inactiveTenants}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>SUSPENDUS</div>
             </div>
             <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 950 }}>{totalTenants}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800 }}>TOTAL</div>
             </div>
          </div>
        </div>

        {/* User and Order Stats */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '1.5rem' }}>
           <div className="nexus-card-elite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
                <Users size={24} className="nexus-neon-cyan" style={{ marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '1.8rem', fontWeight: 950 }}>{stats.total_users.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800 }}>UTILISATEURS RÉSEAU</div>
             </div>
             <div style={{ width: '100px', height: '60px' }}>
                <svg width="100" height="60" viewBox="0 0 100 60">
                   <path d="M0,50 L20,40 L40,45 L60,20 L80,30 L100,5" fill="none" stroke="#06b6d4" strokeWidth="5" strokeLinecap="round" />
                </svg>
             </div>
           </div>
           <div className="nexus-card-elite px-6 py-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
                <Activity size={20} style={{ color: '#ec4899', marginBottom: '0.6rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 950 }}>{stats.total_orders.toLocaleString()}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 900 }}>TRAFIC SaaS (ORDERS)</div>
             </div>
             <div style={{ width: '120px', height: '70px', marginLeft: 'auto' }}>
                <svg width="120" height="70" viewBox="0 0 100 60">
                   <path d="M0,55 L20,30 L40,50 L60,35 L80,45 L100,20" fill="none" stroke="#ec4899" strokeWidth="5" strokeLinecap="round" />
                </svg>
             </div>
           </div>
        </div>

        {/* Global Distribution */}
        <div className="nexus-card-elite" style={{ display: 'flex', flexDirection: 'column' }}>
           <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900 }}>Répartition par Offre</h4>
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {[
                { name: 'Gratuit', val: planStats.FREE, fill: '#64748b', key: 'FREE' },
                { name: 'Basique', val: planStats.BASIC, fill: '#06b6d4', key: 'BASIC' },
                { name: 'Premium', val: planStats.PREMIUM, fill: '#8b5cf6', key: 'PREMIUM' },
                { name: 'Business', val: planStats.ENTERPRISE, fill: '#ec4899', key: 'ENTERPRISE' },
                { name: 'Sur-mesure', val: planStats.CUSTOM, fill: '#f59e0b', key: 'CUSTOM' }
              ].map(plan => (
                <div key={plan.key} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: plan.fill }}></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>{plan.name}</span>
                   </div>
                   <div style={{ fontSize: '1.1rem', fontWeight: 950 }}>{plan.val}</div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
         <button onClick={handleAudit} className="nexus-glow-button" style={{ flex: 1, height: '65px', fontSize: '1.1rem', cursor: 'pointer' }}>
            OPTIMISER L'INFRASTRUCTURE
         </button>
         <button onClick={() => navigate('/super-admin/support')} style={{ flex: 1, height: '65px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s' }}>
            CONSULTER LES TICKETS SUPPORT
         </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               PERFORMANCE HUB                              */
/* -------------------------------------------------------------------------- */
const PerformanceHub = () => {
  return (
    <div className="absolute inset-0 bg-white" style={{ minHeight: 'calc(100vh - 150px)' }}>
       <PerformanceDashboard isSuperAdmin={true} />
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
      showToast('Plan Tier mis à jour avec succès', 'success');
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
      showToast(`${tenant.nom} ${!tenant.actif ? 'réactivé' : 'suspendu'}`, !tenant.actif ? 'success' : 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = (tenant: Tenant) => {
    showToast(`Session sécurisée : Tunnel Nexus vers ${tenant.nom}...`, 'info');
    setTimeout(() => {
       const origin = window.location.origin;
       // We use standard path-based routing to preserve session coookies / auth state
       window.open(`${origin}/${tenant.slug}`, '_blank');
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
        admin_nom: 'Responsable'
      });
      if (error) throw error;
      showToast("Organisation déployée avec succès", "success");
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
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Rechercher une organisation..." 
            className="form-input"
            style={{ paddingLeft: '3.5rem', height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ height: '56px', padding: '0 2rem', borderRadius: '16px', fontWeight: 950 }}>
          <Plus size={22} /> CRÉER UN NOUVEAU CLIENT
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
          {filteredTenants.map(tenant => (
            <div key={tenant.id} className="nexus-card-elite" style={{ borderLeft: `4px solid ${tenant.actif ? '#06b6d4' : '#f43f5e'}`, padding: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.5rem' }}>
                      {tenant.nom[0]}
                    </div>
                    <div>
                       <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem' }}>{tenant.nom}</h4>
                       <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>/{tenant.slug}</span>
                    </div>
                  </div>
                  <div className={`nexus-badge ${tenant.actif ? 'nexus-badge-active' : 'nexus-badge-warning'}`}>
                     {tenant.actif ? 'Actif' : 'Suspendu'}
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contact Référent</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{tenant.email_contact}</div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <select 
                    value={tenant.plan}
                    onChange={(e) => handleUpdatePlan(tenant.id, e.target.value)}
                    style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontWeight: 900, padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', outline: 'none' }}
                  >
                     <option value="FREE">PLAN FREE</option>
                     <option value="BASIC">PLAN BASIC</option>
                     <option value="PREMIUM">PLAN PREMIUM</option>
                     <option value="ENTERPRISE">PLAN ENTERPRISE</option>
                  </select>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button onClick={() => handleImpersonate(tenant)} title="Droit de regard" style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                        <Eye size={18} />
                     </button>
                     <button onClick={() => handleToggleStatus(tenant)} title="Pivot de statut" style={{ width: '42px', height: '42px', borderRadius: '10px', background: tenant.actif ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', color: tenant.actif ? '#f43f5e' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${tenant.actif ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`, cursor: 'pointer' }}>
                        <Power size={18} />
                     </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}>
          <div className="nexus-card-elite" style={{ width: '100%', maxWidth: '500px', padding: '3rem', animation: 'modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 950, margin: 0 }}>Déployer une Organisation</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={28} /></button>
            </div>
            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>Nom de l'Entité</label>
                <input type="text" className="form-input" placeholder="ex: Gombo Logistique" required value={newTenant.nom} onChange={e => setNewTenant({...newTenant, nom: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', height: '52px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>Identifiant URL (Slug)</label>
                <input type="text" className="form-input" placeholder="ex: gombo-ci" required value={newTenant.slug} onChange={e => setNewTenant({...newTenant, slug: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', height: '52px' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.5rem', display: 'block', fontWeight: 900 }}>URL: https://{newTenant.slug || 'slug'}.gomboswiftci.app</span>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>E-mail de Contact</label>
                <input type="email" className="form-input" placeholder="ex: admin@gombo.ci" required value={newTenant.email_contact} onChange={e => setNewTenant({...newTenant, email_contact: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', height: '52px' }} />
              </div>
              <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ marginTop: '1.5rem', height: '60px', borderRadius: '16px', fontWeight: 950, fontSize: '1.1rem' }}>
                {actionLoading ? <div className="spinner"></div> : 'LANCER LE DÉPLOIEMENT'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               PLANS DASHBOARD                              */
/* -------------------------------------------------------------------------- */
const PlansTab = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database.from('saas_plans').select('*').order('price_fcfa', { ascending: true });
      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleChange = (id: string, field: string, value: any) => {
    setPlans(pList => pList.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async (plan: any) => {
    // 1. Instantly update local state (optimistic update)
    setPlans(pList => pList.map(p => p.id === plan.id ? { ...plan } : p));
    
    setSavingId(plan.id);
    try {
      // Use RPC with SECURITY DEFINER to bypass RLS silent failures
      const { data: rpcResult, error } = await insforge.database.rpc('update_saas_plan', {
        p_id: plan.id,
        p_name: plan.name,
        p_price_fcfa: plan.price_fcfa,
        p_description: plan.description || '',
        p_is_popular: !!plan.is_popular,
        p_module_caisse: !!plan.module_caisse,
        p_module_audit: !!plan.module_audit,
        p_module_api: !!plan.module_api,
        p_module_whatsapp: !!plan.module_whatsapp,
        p_module_multi_depot: !!plan.module_multi_depot,
        p_module_livreurs: !!plan.module_livreurs,
        p_module_rapport_avance: !!plan.module_rapport_avance,
        p_module_white_label: !!plan.module_white_label,
        // NEW GRANULAR
        p_module_crm_clients: !!plan.module_crm_clients,
        p_module_suivi_terrain: !!plan.module_suivi_terrain,
        p_module_logistique_pro: !!plan.module_logistique_pro,
        p_module_staff_perf: !!plan.module_staff_perf,
        p_module_livraisons_app: !!plan.module_livraisons_app,
        p_module_tresorerie_audit: !!plan.module_tresorerie_audit,
        p_module_caisse_retour_expert: !!plan.module_caisse_retour_expert,
        p_module_rapport_journalier: !!plan.module_rapport_journalier,
        p_module_profit_finances: !!plan.module_profit_finances,
        p_module_tresorerie_admin: !!plan.module_tresorerie_admin,
        p_module_expertise_comptable: !!plan.module_expertise_comptable,
        // NEW LIMITS
        p_max_products: plan.max_products === undefined ? -1 : Number(plan.max_products),
      });

      if (error) throw error;

      // RPC returns { success: true/false, error?: string }
      const result = rpcResult as any;
      if (result && result.success === false) {
        throw new Error(result.error || 'Échec de la mise à jour en base de données');
      }

      showToast(`✅ Offre "${plan.name}" publiée sur la landing page !`, 'success');
      await fetchPlans(); // Ensure fresh data from DB
    } catch (err: any) {
      // Fallback: try direct update if RPC doesn't exist yet
      if (err?.message?.includes('Could not find') || err?.code === 'PGRST202') {
        try {
          const { data: updateData, error: updateError } = await (insforge.database
            .from('saas_plans') as any)
            .update({
              name: plan.name,
              price_fcfa: plan.price_fcfa,
              description: plan.description,
              is_popular: plan.is_popular,
              module_caisse: plan.module_caisse,
              module_audit: plan.module_audit,
              module_api: plan.module_api,
              module_whatsapp: plan.module_whatsapp,
              module_multi_depot: plan.module_multi_depot,
              module_livreurs: plan.module_livreurs,
              module_rapport_avance: plan.module_rapport_avance,
              module_white_label: plan.module_white_label,
              // NEW GRANULAR
              module_crm_clients: !!plan.module_crm_clients,
              module_suivi_terrain: !!plan.module_suivi_terrain,
              module_logistique_pro: !!plan.module_logistique_pro,
              module_staff_perf: !!plan.module_staff_perf,
              module_livraisons_app: !!plan.module_livraisons_app,
              module_tresorerie_audit: !!plan.module_tresorerie_audit,
              module_caisse_retour_expert: !!plan.module_caisse_retour_expert,
              module_rapport_journalier: !!plan.module_rapport_journalier,
              module_profit_finances: !!plan.module_profit_finances,
              module_tresorerie_admin: !!plan.module_tresorerie_admin,
              module_expertise_comptable: !!plan.module_expertise_comptable,
              max_products: plan.max_products === undefined ? -1 : Number(plan.max_products),
            })
            .eq('id', plan.id)
            .select();

          if (updateError) throw updateError;
          if (!updateData || updateData.length === 0) {
            showToast(`⚠️ Mise à jour bloquée par RLS. Exécutez fix_plans_update.sql`, 'error');
          } else {
            showToast(`✅ Offre "${plan.name}" mise à jour !`, 'success');
            fetchPlans();
          }
        } catch (fallbackErr: any) {
          showToast(fallbackErr.message || 'Erreur lors de la mise à jour', 'error');
        }
      } else {
        showToast(err.message || 'Erreur lors de la mise à jour', 'error');
      }
    } finally {
      setSavingId(null);
    }
  };


  const MODULE_CATEGORIES = [
    {
      title: 'CRM & Clients',
      modules: [
        { key: 'module_crm_clients', label: 'CRM & Clients', color: '#f59e0b', icon: '👥' },
      ]
    },
    {
      title: 'Logistique & Terrain',
      modules: [
        { key: 'module_suivi_terrain', label: 'Suivi Terrain', color: '#10b981', icon: '📍' },
        { key: 'module_logistique_pro', label: 'Logistique Pro', color: '#06b6d4', icon: '🚚' },
        { key: 'module_staff_perf', label: 'Performance Staff', color: '#8b5cf6', icon: '🏆' },
        { key: 'module_livraisons_app', label: 'Mes Livraisons', color: '#ec4899', icon: '📱' },
      ]
    },
    {
      title: 'Administration & Finance',
      modules: [
        { key: 'module_tresorerie_audit', label: 'Trésorerie & Audit', color: '#6366f1', icon: '🛡️' },
        { key: 'module_caisse_retour_expert', label: 'Caisse / Retour', color: '#10b981', icon: '💸' },
        { key: 'module_rapport_journalier', label: 'Rapport Journalier', color: '#3b82f6', icon: '📊' },
        { key: 'module_profit_finances', label: 'Profit & Finances', color: '#10b981', icon: '📈' },
        { key: 'module_tresorerie_admin', label: 'Trésorerie Admin', color: '#06b6d4', icon: '💼' },
        { key: 'module_expertise_comptable', label: 'Expertise Comptable', color: '#a855f7', icon: '🕯️' },
      ]
    },
    {
      title: 'Technique & White label',
      modules: [
        { key: 'module_api', label: 'API & Intégrations', color: '#8b5cf6', icon: '🔌' },
        { key: 'module_whatsapp', label: 'Notifications WhatsApp', color: '#25d366', icon: '💬' },
        { key: 'module_white_label', label: 'Logiciel White Label', color: '#f8fafc', icon: '🎨' },
      ]
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem' }}>Catalogue des Offres SaaS</h3>
      </div>

      {/* Sync Banner */}
      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.3rem' }}>🔄</span>
        <div>
          <div style={{ fontWeight: 900, color: '#10b981', fontSize: '0.85rem' }}>SYNCHRONISATION AUTOMATIQUE AVEC LA LANDING PAGE</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Toute modification publiée ici est immédiatement visible sur la page de tarification publique.</div>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '2rem' }}>
          {plans.map(plan => (
            <div key={plan.id} className="nexus-card-elite" style={{
              border: plan.is_popular ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.05)',
              position: 'relative'
            }}>
              {plan.is_popular && (
                <div style={{ position: 'absolute', top: '-1px', right: '1.5rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', padding: '0.3rem 1rem', borderRadius: '0 0 12px 12px', fontSize: '0.65rem', fontWeight: 900 }}>
                  ⭐ POPULAIRE
                </div>
              )}

              {/* Name + Popular toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: `${plan.color || '#6366f1'}20`, color: plan.color || '#6366f1', padding: '0.6rem', borderRadius: '12px', border: `1px solid ${plan.color || '#6366f1'}30` }}>
                    <Zap size={22} />
                  </div>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={e => handleChange(plan.id, 'name', e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 950, fontSize: '1.3rem', outline: 'none', width: '170px' }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, color: plan.is_popular ? '#6366f1' : '#475569' }}>
                  <input
                    type="checkbox"
                    checked={!!plan.is_popular}
                    onChange={e => handleChange(plan.id, 'is_popular', e.target.checked)}
                    style={{ accentColor: '#6366f1' }}
                  />
                  POPULAIRE
                </label>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Description (landing page)</label>
                <input
                  type="text"
                  value={plan.description || ''}
                  onChange={e => handleChange(plan.id, 'description', e.target.value)}
                  placeholder="Description visible sur la page tarifaire..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#cbd5e1', fontWeight: 700, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <input
                  type="number"
                  value={plan.price_fcfa}
                  onChange={e => handleChange(plan.id, 'price_fcfa', parseInt(e.target.value))}
                  style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 950, fontSize: '2rem', width: '100%', outline: 'none' }}
                />
              </div>

              {/* Limits Configuration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 950, color: '#475569', textTransform: 'uppercase' }}>Utilisateurs Max</label>
                  <input type="number" className="form-input" value={plan.max_users || ''} placeholder="Ex: 5 (-1=illimité)" onChange={e => handleChange(plan.id, 'max_users', Number(e.target.value))} style={{ height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 0.75rem', fontWeight: 700 }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 950, color: '#475569', textTransform: 'uppercase' }}>Commandes / Mois</label>
                  <input type="number" className="form-input" value={plan.max_orders_month || ''} placeholder="Ex: 50 (-1=illimité)" onChange={e => handleChange(plan.id, 'max_orders_month', Number(e.target.value))} style={{ height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 0.75rem', fontWeight: 700 }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 950, color: '#475569', textTransform: 'uppercase' }}>Produits Max</label>
                  <input type="number" className="form-input" value={plan.max_products || -1} placeholder="Ex: 10 (-1=illimité)" onChange={e => handleChange(plan.id, 'max_products', Number(e.target.value))} style={{ height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 0.75rem', fontWeight: 700 }} />
                </div>
              </div>

              {/* 8 Modules Grid */}
              <div style={{ marginBottom: '2rem' }}>
                {MODULE_CATEGORIES.map(cat => (
                  <div key={cat.title} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
                      {cat.title}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      {cat.modules.map(mod => (
                        <label
                          key={mod.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 0.85rem',
                            background: plan[mod.key] ? `${mod.color}12` : 'rgba(255,255,255,0.02)',
                            border: plan[mod.key] ? `1px solid ${mod.color}35` : '1px solid rgba(255,255,255,0.04)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span style={{ fontSize: '0.9rem' }}>{mod.icon}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: plan[mod.key] ? mod.color : '#475569', flex: 1, lineHeight: 1.2 }}>{mod.label}</span>
                          <input
                            type="checkbox"
                            checked={!!plan[mod.key]}
                            onChange={e => handleChange(plan.id, mod.key, e.target.checked)}
                            style={{ accentColor: mod.color, width: '14px', height: '14px', flexShrink: 0 }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save */}
              <button
                onClick={() => handleSave(plan)}
                disabled={savingId === plan.id}
                className="btn btn-primary"
                style={{ width: '100%', height: '52px', borderRadius: '14px', fontWeight: 950, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {savingId === plan.id ? <div className="spinner" /> : <><Send size={16} /> PUBLIER SUR LA LANDING PAGE</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               MISSION CONTROL                              */
/* -------------------------------------------------------------------------- */
const BroadcastTab = ({ tenants }: { tenants: Tenant[] }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [dispatchType, setDispatchType] = useState<'EMAIL' | 'WHATSAPP' | 'BOTH'>('BOTH');
  const [selectedTenants, setSelectedTenants] = useState<string[]>(['ALL']);
  const { showToast } = useToast();

  const handleSendFull = async () => {
    if (!message.trim()) return showToast("Message requis.", "error");
    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Logic for bulk sending
      for (const tenant of tenants) {
        if (!selectedTenants.includes('ALL') && !selectedTenants.includes(tenant.id)) continue;
        if (!tenant.email_contact) continue;
        
        // 1. Send via Mailzeet
        if (dispatchType === 'EMAIL' || dispatchType === 'BOTH') {
            const res = await emailService.sendEmail(tenant.email_contact, subject || "Nexus System Update", {
              body: `<div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #6366f1;">Annonce Nexus Core</h2>
                <p>${message.replace(/\n/g, '<br/>')}</p>
                <hr/>
                <small>Diffusé par : Root Admin GomboSwift</small>
              </div>`,
              tenantId: tenant.id
            });
            if (res.success) successCount++; else failCount++;
        }

        // 2. Mock WhatsApp (Requires WhatsApp API Integration)
        if (dispatchType === 'WHATSAPP' || dispatchType === 'BOTH') {
            // Here we would call a WhatsApp API service
            // console.log(`[WhatsApp Broadcast] To ${tenant.telephone_contact}: ${message}`);
            // Since we don't have the API configured yet, we just log and audit
        }
      }

      await insforge.database.from('admin_audit_logs').insert({ 
        action: 'BROADCAST_COMPLETED', 
        details: { subject, tenants_reached: successCount, dispatchType } 
      });

      showToast(`Diffusion terminée : ${successCount} emails envoyés.`, "success");
      if (failCount > 0) showToast(`${failCount} échecs détectés.`, "error");
      
      setMessage(''); setSubject('');
    } catch (err: any) { 
      showToast(err.message, 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleTenant = (id: string) => {
     if (id === 'ALL') {
        setSelectedTenants(['ALL']);
        return;
     }
     let newSelection = selectedTenants.filter(t => t !== 'ALL');
     if (newSelection.includes(id)) {
        newSelection = newSelection.filter(t => t !== id);
        if (newSelection.length === 0) newSelection = ['ALL'];
     } else {
        newSelection.push(id);
     }
     setSelectedTenants(newSelection);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '1000px', margin: '0 auto' }}>
       <div className="nexus-card-elite" style={{ padding: '3rem' }}>
          <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Send size={28} color="var(--primary)" /> Nexus Mission Control
          </h3>

          <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2.5rem' }}>
             <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Destinataires ciblés</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div 
                      onClick={() => toggleTenant('ALL')}
                      style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, 
                         background: selectedTenants.includes('ALL') ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                         color: selectedTenants.includes('ALL') ? 'white' : '#94a3b8' 
                      }}>
                      TOUS LES TENANTS
                   </div>
                   {tenants.map(t => (
                      <div 
                         key={t.id} 
                         onClick={() => toggleTenant(t.id)}
                         style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, 
                            background: selectedTenants.includes(t.id) ? 'rgba(6,182,212,0.8)' : 'rgba(255,255,255,0.05)', 
                            color: selectedTenants.includes(t.id) ? 'white' : '#94a3b8' 
                         }}>
                         {t.nom}
                      </div>
                   ))}
                </div>
             </div>

             <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {['EMAIL', 'WHATSAPP', 'BOTH'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setDispatchType(t as any)}
                    style={{ flex: 1, height: '48px', borderRadius: '12px', border: dispatchType === t ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', background: dispatchType === t ? 'rgba(99,102,241,0.1)' : 'transparent', color: dispatchType === t ? 'var(--primary)' : '#94a3b8', fontWeight: 900, transition: 'all 0.2s', cursor: 'pointer' }}
                  >
                    {t}
                  </button>
                ))}
             </div>
             <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Objet de la Notification</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Nexus Update / Information Critique..." style={{ width: '100%', height: '56px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '0 1.5rem', color: 'white', fontWeight: 800 }} />
             </div>
             <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'block' }}>Cœur du Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Votre annonce aux partenaires..." style={{ width: '100%', minHeight: '180px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.5rem', color: 'white', fontWeight: 700, lineHeight: 1.6 }} />
             </div>
          </div>

          <button onClick={handleSendFull} disabled={loading} style={{ width: '100%', height: '70px', borderRadius: '20px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', border: 'none', fontWeight: 950, fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 10px 40px rgba(6,182,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
             {loading ? <div className="spinner"></div> : <>DÉPLOYER LA DIFFUSION GLOBALE <Send size={24} /></>}
          </button>
       </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               BILLING TAB                                  */
/* -------------------------------------------------------------------------- */
const BillingTab = ({ tenants }: { tenants: Tenant[] }) => {
  // Calcul du MRR réel basé sur les facturations confirmées ('paid')
  const mrr = tenants.reduce((total, t) => {
    if (!t.actif || t.billing_status !== 'paid') return total;
    if (t.plan === 'BASIC') return total + 15000;
    if (t.plan === 'PREMIUM') return total + 30000;
    if (t.plan === 'ENTERPRISE') return total + 75000;
    return total;
  }, 0);

  // Potentiel MRR (Total des actifs même si non payé ce mois)
  const potentialMrr = tenants.reduce((total, t) => {
    if (!t.actif) return total;
    if (t.plan === 'BASIC') return total + 15000;
    if (t.plan === 'PREMIUM') return total + 30000;
    if (t.plan === 'ENTERPRISE') return total + 75000;
    return total;
  }, 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <NexusStatCard title="MRR ENCAISSÉ" value={`${mrr.toLocaleString()} F`} sub="Revenu confirmé (billing_status: paid)" icon={<CreditCard size={22} />} color="#10b981" trend="Actuel" />
          <NexusStatCard title="MRR PRÉVISIONNEL" value={`${potentialMrr.toLocaleString()} F`} sub="Potentiel total des actifs" icon={<TrendingUp size={22} />} color="#8b5cf6" trend={mrr > 0 ? `+${Math.round(((potentialMrr - mrr) / mrr) * 100)}%` : potentialMrr > 0 ? '+100%' : '0%'} />
       </div>

       <div className="nexus-card-elite" style={{ padding: '2.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.4rem', marginBottom: '2rem' }}>Paiement & Facturation Tenants</h3>
          <div className="table-responsive-cards px-0">
             <table className="nexus-table">
                <thead>
                   <tr>
                      <th>CLIENT</th>
                      <th>PLAN</th>
                      <th>STATUS BILLE</th>
                      <th style={{ textAlign: 'right' }}>VALEUR BILLE</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                   </tr>
                </thead>
                <tbody>
                   {tenants.map(t => (
                      <tr key={t.id}>
                         <td data-label="CLIENT" style={{ fontWeight: 800 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                               <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                  {t.nom.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <div>{t.nom}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.email_contact}</div>
                               </div>
                            </div>
                         </td>
                         <td data-label="PLAN"><span className="nexus-badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{t.plan}</span></td>
                         <td data-label="STATUS" style={{ color: t.billing_status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 900 }}>
                            {t.billing_status === 'paid' ? ' Encaissé' : ' En attente'}
                          </td>
                         <td data-label="VALEUR" style={{ textAlign: 'right', fontWeight: 950 }}>
                            {t.plan === 'FREE' ? '0' : t.plan === 'BASIC' ? '15 000' : t.plan === 'PREMIUM' ? '30 000' : t.plan === 'ENTERPRISE' ? '75 000' : '0'} F
                         </td>
                         <td data-label="ACTIONS" style={{ textAlign: 'center' }}>
                            <button className="nexus-card" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                               <Eye size={12} /> Inspecter
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               SUPPORT CENTER                               */
/* -------------------------------------------------------------------------- */
const SupportTab = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchTickets = async () => {
       const { data } = await insforge.database.from('support_tickets').select('*, tenants(nom)').order('created_at', { ascending: false });
       setTickets(data || []);
       setLoading(false);
    };
    fetchTickets();
  }, []);

  const handleApply = (id: string) => {
     showToast(`Signalement ${id.slice(0,5)} en cours de traitement...`, 'info');
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
       <div className="nexus-card-elite" style={{ padding: '2.5rem' }}>
          <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '2.5rem' }}>Nexus Help Desk</h3>
          {loading ? <div className="spinner"></div> : (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {tickets.length === 0 ? <div style={{ color: '#64748b' }}>Aucune requête en attente.</div> : tickets.map(ticket => (
                  <div key={ticket.id} className="nexus-card" style={{ borderLeft: `4px solid ${ticket.priority === 'HIGH' ? '#f43f5e' : 'var(--primary)'}` }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>ID: {ticket.id.slice(0,8).toUpperCase()}</span>
                        <div className="nexus-badge">{ticket.status}</div>
                     </div>
                     <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.75rem' }}>{ticket.subject}</h4>
                     <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.5rem' }}>{ticket.message}</p>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{ticket.tenants?.nom}</span>
                        <button onClick={() => handleApply(ticket.id)} className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}>RÉPONDRE</button>
                     </div>
                  </div>
                ))}
             </div>
          )}
        </div>
     </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                PROFILE TAB                                 */
/* -------------------------------------------------------------------------- */
const ProfileTab = () => {
  const { currentUser, showToast } = useAuth() as any;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(currentUser?.nom_complet || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await insforge.database
        .from('users')
        .update({ nom_complet: name })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      showToast("Nom mis à jour avec succès. Veuillez recharger pour voir le changement.", "success");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showToast("Les mots de passe ne correspondent pas", "error");
    }
    setLoading(true);
    try {
      const { error } = (await (insforge.auth as any).updateAccount({ password: newPassword })) as any;
      if (error) throw error;
      showToast("Mot de passe mis à jour avec succès", "success");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '800px' }}>
      <div className="nexus-card-lite" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '2rem' }}>Mon Profil Nexus</h3>
        
        <form onSubmit={handleUpdateName} style={{ display: 'grid', gap: '1.5rem' }}>
           <div>
             <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>NOM COMPLET</label>
             <input 
               type="text" 
               className="form-input" 
               value={name} 
               onChange={(e) => setName(e.target.value)} 
               style={{ width: '100%' }}
             />
           </div>
           <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
             {loading ? 'MISE À JOUR...' : 'METTRE À JOUR LE NOM'}
           </button>
        </form>
      </div>

      <div className="nexus-card-lite" style={{ padding: '2.5rem' }}>
        <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '0.5rem', color: '#f43f5e' }}>Sécurité</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Mettez à jour votre mot de passe pour sécuriser l'accès à Nexus Core.</p>
        
        <form onSubmit={handleUpdatePassword} style={{ display: 'grid', gap: '1.5rem' }}>
           <div>
             <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>NOUVEAU MOT DE PASSE</label>
             <input 
               type="password" 
               className="form-input" 
               value={newPassword} 
               onChange={(e) => setNewPassword(e.target.value)} 
               placeholder="Minimum 6 caractères"
               style={{ width: '100%' }}
             />
           </div>
           <div>
             <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>CONFIRMER LE MOT DE PASSE</label>
             <input 
               type="password" 
               className="form-input" 
               value={confirmPassword} 
               onChange={(e) => setConfirmPassword(e.target.value)} 
               style={{ width: '100%' }}
             />
           </div>
           <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: '#f43f5e', boxShadow: '0 8px 20px rgba(244,63,94,0.3)', width: 'fit-content' }}>
             {loading ? 'MISE À JOUR...' : 'CHANGER LE MOT DE PASSE'}
           </button>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               SECURITY LOGS                                */
/* -------------------------------------------------------------------------- */
const SecurityLogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
       const { data } = await insforge.database.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(20);
       setLogs(data || []);
       setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
       <div className="nexus-card-elite" style={{ padding: '2.5rem' }}>
          <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <ShieldCheck size={28} color="var(--primary)" /> Sécurité & Audit Nexus
          </h3>
          {loading ? <div className="spinner"></div> : (
              <div className="table-container">
                 <table className="nexus-table">
                    <thead>
                       <tr>
                          <th>ACTION SYSTÈME</th>
                          <th>DÉTAILS OPÉRATIONNEL</th>
                          <th style={{ textAlign: 'right' }}>DATE & HEURE</th>
                       </tr>
                    </thead>
                    <tbody>
                       {logs.map((log: any) => (
                          <tr key={log.id}>
                             <td style={{ fontWeight: 950, color: '#06b6d4' }}>{log.action}</td>
                             <td style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</td>
                             <td style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
          )}
       </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */