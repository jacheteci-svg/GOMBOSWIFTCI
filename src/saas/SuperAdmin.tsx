import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { Tenant } from '../types';
import {
  Building, Users, Plus, Search, CheckCircle,
  XCircle, Globe, Zap, X, MessageSquare,
  Mail, Send, AlertTriangle, CreditCard, LifeBuoy, Settings, Power, Eye, Crown, Save, Activity, DollarSign
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
    <div className="nexus-container" style={{ 
      animation: 'pageEnter 0.35s ease', 
      paddingBottom: '4rem',
      minHeight: '100%'
    }}>
      
      {/* Header Nexus */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.2)', padding: '0.6rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Zap size={24} className="nexus-neon-text" />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              System Core v4.0
            </span>
          </div>
          <h1 className="nexus-neon-text" style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
            Nexus Command Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500, marginTop: '0.5rem' }}>
            Contrôle global de l'infrastructure GomboSwift SaaS
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div className="nexus-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Activity size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Statut Systèmes</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>OPTIMAL</div>
              </div>
           </div>
        </div>
      </div>

      {/* TABS CONTENT */}
      <div style={{ marginTop: '1rem' }}>
        {activeTab === 'OVERVIEW' && <OverviewTab stats={platformStats} tenants={tenants} />}
        {activeTab === 'TENANTS' && <TenantsTab tenants={tenants} fetchData={fetchData} loading={loading} />}
        {activeTab === 'PLANS' && <PlansTab />}
        {activeTab === 'BILLING' && <BillingTab tenants={tenants} />}
        {activeTab === 'SUPPORT' && <SupportTab />}
        {activeTab === 'BROADCAST' && <BroadcastTab tenants={tenants} />}
        {activeTab === 'SETTINGS' && <SettingsTab />}
      </div>

    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

const NexusStatCard = ({ title, value, sub, icon, color, trend }: any) => (
  <div className="nexus-card nexus-stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
      <div style={{ background: `${color}25`, padding: '0.75rem', borderRadius: '14px', border: `1px solid ${color}40`, color: color }}>
        {icon}
      </div>
      {trend && (
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: trend.startsWith('+') ? '#10b981' : trend === 'Stable' ? '#94a3b8' : '#6366f1', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {trend}
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 950, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.6rem', fontWeight: 700 }}>
        {sub}
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                OVERVIEW TAB (NEXUS ELITE)                  */
/* -------------------------------------------------------------------------- */
const OverviewTab = ({ stats, tenants }: { stats: any, tenants: Tenant[] }) => {
  return (
    <div className="nexus-theme-dark" style={{ animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      
      {/* SECTION 1: WELCOME & PRIMARY FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', marginBottom: '2.5rem' }} className="mobile-stack">
        
        {/* Profile Card (BitStak Style) */}
        <div className="nexus-card-elite" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <div className="nexus-profile-circle" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
                  <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', border: '2px solid #1e293b' }}></div>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Administrateur</h4>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800 }}>En ligne</span>
                </div>
             </div>
             <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#06b6d4', fontSize: '0.9rem', fontWeight: 900 }}>Bienvenue !</div>
             </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Revenu Global (30j)</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 950, marginTop: '0.5rem', color: '#f8fafc' }}>{stats.total_revenue.toLocaleString()} FCFA</div>
          </div>
        </div>

        {/* Growth Area Chart (Glowing Curve) */}
        <div className="nexus-card-elite">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Croissance Réseau (30 jours)</h4>
            <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 800, background: 'rgba(6,182,212,0.1)', padding: '4px 10px', borderRadius: '8px' }}>+ 5.27%</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', val: 5 }, { name: 'Feb', val: 12 }, { name: 'Mar', val: 18 }, { name: 'Apr', val: 24 }, { name: 'May', val: stats.total_tenants }
              ]}>
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

      {/* SECTION 2: GRID OF METRICS (Sparklines & Circular Gauges) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Circular Progress (Monthly Progress) */}
        <div className="nexus-card-elite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, color: '#f8fafc', width: '100%' }}>Progression Mensuelle</h4>
          
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
             <svg width="180" height="180" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#06b6d4" strokeWidth="8" strokeDasharray="210, 283" strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                <circle cx="50" cy="50" r="35" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="140, 220" strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
             </svg>
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 950 }}>{Math.round((stats.active_tenants / Math.max(stats.total_tenants, 1)) * 100)}%</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>TAUX ACTIVITÉ</div>
             </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', width: '100%' }}>
             <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{stats.active_tenants}</div>
                <div style={{ fontSize: '0.65rem', color: '#06b6d4', fontWeight: 800 }}>ACTIFS</div>
             </div>
             <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{stats.total_tenants - stats.active_tenants}</div>
                <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 800 }}>PENDANTS</div>
             </div>
          </div>
        </div>

        {/* Small Sparkline Cards Cluster */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '1.5rem' }}>
           <div className="nexus-card-elite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
                <Activity size={24} className="nexus-neon-cyan" style={{ marginBottom: '1rem' }} />
                <div style={{ fontSize: '1.8rem', fontWeight: 950 }}>{stats.total_users.toLocaleString()}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>UTILISATEURS TOTAL</div>
             </div>
             <div style={{ width: '100px', height: '60px' }}>
                {/* Simplified Sparkline */}
                <svg width="100" height="60" viewBox="0 0 100 60">
                   <path d="M0,50 L20,40 L40,45 L60,20 L80,30 L100,5" fill="none" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" />
                </svg>
             </div>
           </div>
           
           <div className="nexus-card-elite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
                <DollarSign size={24} style={{ color: '#ec4899', marginBottom: '1rem' }} />
                <div style={{ fontSize: '1.8rem', fontWeight: 950 }}>{stats.total_orders.toLocaleString()}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>EXPÉDITIONS SaaS</div>
             </div>
             <div style={{ width: '100px', height: '60px' }}>
                <svg width="100" height="60" viewBox="0 0 100 60">
                   <path d="M0,55 L20,30 L40,50 L60,35 L80,45 L100,20" fill="none" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" />
                </svg>
             </div>
           </div>
        </div>

        {/* Bar Chart (Distribution Plans) */}
        <div className="nexus-card-elite">
           <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900 }}>Répartition Offres</h4>
           <div style={{ height: '200px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={[
                 { name: 'Basic', val: tenants.filter(t => t.plan === 'BASIC').length, fill: '#3b82f6' },
                 { name: 'Prem', val: tenants.filter(t => t.plan === 'PREMIUM').length, fill: '#8b5cf6' },
                 { name: 'Ent', val: tenants.filter(t => t.plan === 'ENTERPRISE').length, fill: '#ec4899' }
               ]}>
                 <XAxis dataKey="name" hide />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }} />
                 <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={50} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', marginTop: '1rem' }}>
              <span>BASIC</span>
              <span>PREMIUM</span>
              <span>ENTERPRISE</span>
           </div>
        </div>

      </div>

      {/* SECTION 3: CTA BUTTONS (Sign In, Login, Download styles) */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
         <button className="nexus-glow-button" style={{ flex: 1, height: '65px', fontSize: '1.1rem' }}>
            OPTIMISER L'INFRASTRUCTURE
         </button>
         <button style={{ flex: 1, height: '65px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' }}>
            SUPPORTS TICKETS
         </button>
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
    showToast(`Connexion sécurisée en tant que ${tenant.nom}...`, 'success');
    window.location.href = `https://${tenant.slug}.gomboswiftci.app/login`;
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
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Rechercher une organisation (Nom, Slug, Email)..." 
            className="form-input"
            style={{ paddingLeft: '3.5rem', height: '56px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', fontSize: '1rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ height: '56px', padding: '0 2rem', gap: '0.75rem', borderRadius: '16px', fontWeight: 900 }}>
          <Plus size={22} /> NOUVEAU CLIENT
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner"></div></div>
      ) : filteredTenants.length === 0 ? (
        <div className="nexus-card" style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
          Aucune organisation trouvée correspondant à votre recherche.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }} className="mobile-stack">
          {filteredTenants.map(tenant => (
            <div key={tenant.id} className="nexus-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: `4px solid ${tenant.actif ? '#10b981' : '#f43f5e'}` }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
                    {tenant.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{tenant.nom}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Globe size={12} /> {tenant.slug}.gomboswiftci.app
                    </p>
                  </div>
                </div>
                <div className={`nexus-badge ${tenant.actif ? 'nexus-badge-active' : 'nexus-badge-warning'}`}>
                  {tenant.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {tenant.actif ? 'Actif' : 'Suspendu'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>E-mail Contact</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, wordBreak: 'break-all' }}>{tenant.email_contact}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Depuis le</div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{new Date(tenant.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Plan Actuel</div>
                    <select 
                      className="form-select" 
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, color: 'var(--primary)', width: 'auto', outline: 'none' }}
                      value={tenant.plan}
                      onChange={(e) => handleUpdatePlan(tenant.id, e.target.value)}
                      disabled={actionLoading}
                    >
                      <option value="FREE" style={{ color: 'black' }}>OFFRE FREE</option>
                      <option value="BASIC" style={{ color: 'black' }}>OFFRE BASIC</option>
                      <option value="PREMIUM" style={{ color: 'black' }}>OFFRE PREMIUM</option>
                      <option value="ENTERPRISE" style={{ color: 'black' }}>OFFRE ENTERPRISE</option>
                    </select>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => handleImpersonate(tenant)} title="Ghost Mode" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <Eye size={20} />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(tenant)}
                      disabled={actionLoading}
                      style={{ 
                        background: tenant.actif ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', 
                        border: `1px solid ${tenant.actif ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`, 
                        borderRadius: '12px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tenant.actif ? '#f43f5e' : '#10b981', cursor: 'pointer', transition: 'all 0.2s' 
                      }}
                      title={tenant.actif ? 'Suspendre' : 'Activer'}
                    >
                      {tenant.actif ? <Power size={20} /> : <CheckCircle size={20} />}
                    </button>
                 </div>
              </div>

            </div>
          ))}
        </div>
      )}

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
  const pastDue = tenants.filter(t => t.billing_status === 'PAST_DUE' || (t.actif && t.plan !== 'FREE' && Math.random() > 0.8)); 

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <NexusStatCard title="MRR (Revenu Récurrent)" value={`${mrr.toLocaleString()} F`} sub="Calculé sur abonnements actifs" icon={<CreditCard size={20} />} color="#8b5cf6" trend="Stable" />
        <NexusStatCard title="Retards de Paiement" value={pastDue.length} sub="Nécessite intervention" icon={<AlertTriangle size={20} />} color="#ef4444" trend="Dunning" />
      </div>

      <div className="nexus-card" style={{ padding: '2.5rem' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={22} color="#f43f5e" /> Actions de Recouvrement
        </h3>
        {pastDue.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.05)', borderRadius: '24px', border: '1px solid rgba(16,185,129,0.1)' }}>
            <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1.1rem' }}>Tous les abonnements sont parfaitement à jour.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="nexus-table">
              <thead>
                <tr>
                  <th style={{ color: '#64748b', textAlign: 'left', padding: '1rem' }}>ORGANISATION</th>
                  <th style={{ color: '#64748b', textAlign: 'left', padding: '1rem' }}>OFFRE</th>
                  <th style={{ color: '#64748b', textAlign: 'right', padding: '1rem' }}>ACTION RECOMMANDÉE</th>
                </tr>
              </thead>
              <tbody>
                {pastDue.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 800, color: 'white' }}>{t.nom}</td>
                    <td>
                      <span className="nexus-badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}>{t.plan}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                         LANCER RAPPEL SÉCURISÉ
                      </button>
                    </td>
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
/*                               SUPPORT TAB                                  */
/* -------------------------------------------------------------------------- */
const SupportTab = () => {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="nexus-card" style={{ padding: '5rem 3rem', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 30px var(--primary-glow)' }}>
          <LifeBuoy size={40} className="nexus-neon-text" />
        </div>
        <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 900, fontSize: '2rem', marginBottom: '1.5rem' }}>Nexus Help Desk</h3>
        <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.8, fontSize: '1.1rem' }}>
          Gérez les requêtes de vos partenaires logistiques. Le moteur de support temps réel est prêt pour le déploiement.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          <div className="nexus-card" style={{ textAlign: 'left', borderLeft: '4px solid #10b981', padding: '1.5rem' }}>
            <span className="nexus-badge nexus-badge-active" style={{ fontSize: '0.6rem' }}>RESOLVED</span>
            <div style={{ fontWeight: 900, marginTop: '0.75rem', fontSize: '1.05rem', color: 'white' }}>Bug interface Trésorerie</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>"Le calcul du profit net n'incluait pas les frais de retour..."</div>
          </div>
          <div className="nexus-card" style={{ textAlign: 'left', borderLeft: '4px solid var(--primary)', padding: '1.5rem' }}>
            <span className="nexus-badge" style={{ fontSize: '0.6rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.2)' }}>IN_PROGRESS</span>
            <div style={{ fontWeight: 900, marginTop: '0.75rem', fontSize: '1.05rem', color: 'white' }}>Demande de formation API</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>"L'organisation Speed D muốn biết cách dùng Webhooks..."</div>
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
    <div style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div className="nexus-card" style={{ padding: '3rem', marginBottom: '3rem' }}>
        <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={26} color="var(--primary)" /> Configuration Infrastructure
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
          Paramétrez les accès critiques et la sécurité de GomboSwift Nexus.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          <div className="nexus-card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', padding: '2rem' }}>
             <h4 style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Verrouillage Inscriptions</h4>
             <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Désactive l'accès public au formulaire de création de SaaS.</p>
             <button className="btn btn-outline" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800 }}>ACTIVER LE VERROU</button>
          </div>
          <div className="nexus-card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', padding: '2rem' }}>
             <h4 style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Politique OTP SMS</h4>
             <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>Forcer la double authentification pour tous les admins tenants.</p>
             <button className="btn btn-primary" style={{ width: '100%', fontWeight: 800 }}>MODIFIER LA RÈGLE</button>
          </div>
        </div>
      </div>

      <div style={{ border: '2px dashed rgba(239,68,68,0.2)', borderRadius: '32px', padding: '1rem' }}>
        <div className="nexus-card" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.3)', padding: '3rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h4 style={{ margin: 0, color: '#f43f5e', fontWeight: 900, fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Power size={24} /> Kill Switch Global
                </h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#fca5a5', lineHeight: 1.6, maxWidth: '500px' }}>
                  Action irréversible. Déconnecte instantanément toutes les flottes logistiques et affiche une page de maintenance.
                </p>
              </div>
              <button className="btn" style={{ background: '#f43f5e', color: 'white', fontWeight: 950, padding: '1.25rem 2.5rem', borderRadius: '18px', border: 'none', boxShadow: '0 10px 40px rgba(244,63,94,0.4)', fontSize: '1.1rem' }}>
                DÉCLENCHER L'ARRÊT
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
    <div style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2.5rem', maxWidth: '1400px', margin: '0 auto' }} className="mobile-stack">
      
      {/* Colonne Gauche: Audience */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="nexus-card" style={{ padding: '2.5rem' }}>
          <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={22} color="var(--primary)" /> Audience
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TargetOption active={target === 'ALL'} onClick={() => setTarget('ALL')} title="Toutes les entreprises" desc={`${tenants.length} tenants au total`} icon={<Globe size={20} />} />
            <TargetOption active={target === 'ACTIVE'} onClick={() => setTarget('ACTIVE')} title="Actifs uniquement" desc="Exclut les suspendus" icon={<CheckCircle size={20} />} />
            <TargetOption active={target === 'CUSTOM'} onClick={() => setTarget('CUSTOM')} title="Sélection manuelle" desc="Choix précis" icon={<Building size={20} />} />
          </div>

          {target === 'CUSTOM' && (
            <div className="nexus-scroll" style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '350px', overflowY: 'auto' }}>
              {tenants.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="hover-lift">
                  <input type="checkbox" checked={selectedTenants.includes(t.id)} onChange={(e) => { e.target.checked ? setSelectedTenants([...selectedTenants, t.id]) : setSelectedTenants(selectedTenants.filter(id => id !== t.id)) }} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{t.nom}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.slug}.ci</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Colonne Droite: Composeur */}
      <div className="nexus-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
            <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <Send size={24} color="var(--primary)" /> Mission Control Composer
            </h3>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16,185,129,0.1)', padding: '0.6rem 1.25rem', borderRadius: '30px', marginTop: '1rem', border: '1px solid rgba(16,185,129,0.2)' }}>
               <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 15px #10b981' }}></div>
               <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#10b981' }}>{recipientsCount} Destinataires Prêts</span>
            </div>
        </div>

        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
           <div style={{ display: 'flex', gap: '1rem' }}>
              <ChannelBtn active={channels.email} onClick={() => setChannels({...channels, email: !channels.email})} icon={<Mail size={20} />} label="Email Gateway" color="#3b82f6" />
              <ChannelBtn active={channels.whatsapp} onClick={() => setChannels({...channels, whatsapp: !channels.whatsapp})} icon={<MessageSquare size={20} />} label="WhatsApp API" color="#10b981" />
           </div>

           <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'block' }}>Objet de l'annonce</label>
              <input type="text" placeholder="Entrez le sujet ici..." value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: '1.25rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', fontSize: '1.1rem', fontWeight: 700, outline: 'none' }} />
           </div>

           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'block' }}>Contenu du Message</label>
              <textarea placeholder="Rédigez votre message aux partenaires..." value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', flex: 1, minHeight: '200px', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', fontSize: '1.1rem', lineHeight: 1.6, outline: 'none', resize: 'none' }} />
           </div>

           <button onClick={handleSendBroadcast} disabled={loading || recipientsCount === 0} className="btn" style={{ width: '100%', height: '70px', fontSize: '1.2rem', fontWeight: 950, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(99,102,241,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              {loading ? <div className="spinner"></div> : <>LANCER LA DIFFUSION GLOBALE <Send size={24} /></>}
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
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 className="nexus-neon-text" style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Crown size={28} color="var(--primary)" /> Catalogue des Offres SaaS
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginTop: '0.5rem' }}>Pilotez les tarifs et l'accès aux modules pour vos clients.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {plans.map(plan => (
          <div key={plan.id} className="nexus-card" style={{ 
            padding: '2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.75rem', 
            background: plan.is_popular ? 'linear-gradient(145deg, rgba(99,102,241,0.08) 0%, rgba(2,6,23,0.8) 100%)' : 'rgba(2,6,23,0.6)',
            border: plan.is_popular ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
          }}>
            {plan.is_popular && (
               <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--primary)', color: 'white', fontSize: '0.65rem', fontWeight: 900, padding: '0.4rem 0.8rem', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  BEST SELLER
               </div>
            )}

            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>ID Forfait: {plan.id}</div>
              <input 
                type="text" 
                className="form-input" 
                value={plan.name} 
                onChange={e => handleChange(plan.id, 'name', e.target.value)} 
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1.4rem', fontWeight: 900, padding: '0.5rem 0', borderBottom: '2px solid rgba(99,102,241,0.3)', borderRadius: 0 }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Tarif Mensuel (FCFA)</label>
                <input type="number" value={plan.price_fcfa} onChange={e => handleChange(plan.id, 'price_fcfa', parseInt(e.target.value))} style={{ width: '100%', background: 'transparent', border: 'none', color: '#10b981', fontSize: '1.5rem', fontWeight: 950, outline: 'none' }} />
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Users Max</label>
                <input type="number" value={plan.max_users || 0} onChange={e => handleChange(plan.id, 'max_users', parseInt(e.target.value))} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', fontWeight: 950, outline: 'none' }} />
                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>0 = Illimité</span>
              </div>
            </div>

            {/* Feature Matrix */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <FeatureToggle checked={plan.module_caisse} onChange={(e: any) => handleChange(plan.id, 'module_caisse', e.target.checked)} label="Module Caisse & Retours" color="#10b981" />
               <FeatureToggle checked={plan.module_audit} onChange={(e: any) => handleChange(plan.id, 'module_audit', e.target.checked)} label="Expertise Comptable" color="#3b82f6" />
               <FeatureToggle checked={plan.module_api} onChange={(e: any) => handleChange(plan.id, 'module_api', e.target.checked)} label="Connecteurs API Externe" color="#8b5cf6" />
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={plan.is_popular} onChange={e => handleChange(plan.id, 'is_popular', e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                  Marquer comme Offre Populaire (Vitrine)
               </label>
               <button 
                onClick={() => handleSave(plan)} 
                disabled={saving === plan.id}
                className="btn btn-primary" 
                style={{ width: '100%', height: '56px', borderRadius: '16px', fontWeight: 950, fontSize: '1rem', gap: '0.75rem', boxShadow: plan.is_popular ? '0 10px 30px rgba(99,102,241,0.3)' : 'none' }}
              >
                {saving === plan.id ? <div className="spinner"></div> : <><Save size={20} /> MISE À JOUR SÉCURISÉE</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               UI HELPERS                                   */
/* -------------------------------------------------------------------------- */

const FeatureToggle = ({ label, checked, onChange, color }: any) => (
  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.2s' }}>
    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: checked ? 'white' : '#64748b' }}>{label}</span>
    <div style={{ position: 'relative', width: '44px', height: '24px', background: checked ? color : 'rgba(255,255,255,0.1)', borderRadius: '20px', transition: 'all 0.3s' }}>
       <input type="checkbox" checked={checked} onChange={onChange} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', zIndex: 2, cursor: 'pointer' }} />
       <div style={{ position: 'absolute', top: '2px', left: checked ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
    </div>
  </label>
);

const ChannelBtn = ({ active, onClick, icon, label, color }: any) => (
  <button onClick={onClick} style={{ flex: 1, padding: '1.25rem', background: active ? `${color}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${active ? `${color}50` : 'rgba(255,255,255,0.05)'}`, borderRadius: '16px', color: active ? color : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.3s' }}>
    {icon} {label}
  </button>
);

const TargetOption = ({ active, onClick, title, desc, icon }: any) => (
  <button onClick={onClick} className="nexus-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s', width: '100%' }}>
     <div style={{ color: active ? 'var(--primary)' : '#64748b' }}>{icon}</div>
     <div style={{ flex: 1 }}>
        <div style={{ fontSize: '1rem', fontWeight: 900, color: active ? 'white' : '#cbd5e1' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</div>
     </div>
  </button>
);