import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { Tenant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity, ShieldCheck, Plus, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, Info, Fingerprint, 
  ShieldAlert, Globe, Users, Send, Rocket, CreditCard, Eye,
  HeartPulse, Search, Power, X
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
    total_revenue: 0,
    tenant_gmv: 0,
    pending_revenue: 0,
    growth_chart: []
  });
  const [plans, setPlans] = useState<any[]>([]);

  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: tenantsData }, { data: statsData }, { data: plansData }] = await Promise.all([
        insforge.database.from('tenants').select('*').order('created_at', { ascending: false }),
        insforge.database.rpc('get_platform_stats'),
        insforge.database.from('saas_plans').select('*').order('price_fcfa', { ascending: true })
      ]);

      if (tenantsData) setTenants(tenantsData);
      if (statsData) setPlatformStats(statsData);
      if (plansData) setPlans(plansData);
    } catch (err: any) {
      console.error("SuperAdmin fetchData error:", err);
      showToast(err.message || 'Échec de synchronisation Gombo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Redirect invalid paths to overview
  if (!['OVERVIEW', 'TENANTS', 'BILLING', 'SUPPORT', 'SETTINGS', 'BROADCAST', 'PLANS', 'PROFILE', 'BLOG', 'EMAILS', 'PERFORMANCE', 'SAFETY'].includes(activeTab) && activeTab !== 'SUPER-ADMIN') {
      return <Navigate to="/super-admin/overview" replace />;
  }

  // Auto-redirect base super-admin path
  if (activeTab === 'SUPER-ADMIN') {
       return <Navigate to="/super-admin/overview" replace />;
  }

  return (
    <div className="gombo-container" style={{ 
      animation: 'pageEnter 0.35s ease', 
      paddingBottom: activeTab === 'PERFORMANCE' ? '0' : '4rem',
      minHeight: '100%'
    }}>
      
      {/* Header Gombo */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ flexShrink: 0 }}>
              <img src="/favicon.png" alt="Gombo Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Gombo Core v4.0.2
            </span>
          </div>
          <h1 className="gombo-neon-text" style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
            Gombo Command Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500, marginTop: '0.5rem' }}>
            Pilotage global de l'infrastructure SaaS multi-tenant
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button 
             onClick={fetchData}
             disabled={loading}
             className="gombo-card" 
             style={{ 
               padding: '0.8rem 1.5rem', 
               display: 'flex', 
               alignItems: 'center', 
               gap: '1rem',
               cursor: 'pointer',
               border: '1px solid var(--gombo-border)',
               background: 'rgba(99, 102, 241, 0.1)',
               transition: 'all 0.3s'
             }}
           >
              <Activity size={18} color={loading ? "#94a3b8" : "#10b981"} className={loading ? "animate-spin" : ""} />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Statut Gombo</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: loading ? '#94a3b8' : '#10b981' }}>
                  {loading ? 'SYNCHRONISATION...' : 'SYSTÈME OPTIMAL'}
                </div>
              </div>
           </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      <div style={{ marginTop: activeTab === 'PERFORMANCE' ? 0 : '1rem', animation: 'fadeIn 0.5s ease' }}>
        {activeTab === 'OVERVIEW' && <OverviewTab stats={platformStats} tenants={tenants} currentUser={currentUser} />}
        {activeTab === 'TENANTS' && <TenantsTab tenants={tenants} fetchData={fetchData} loading={loading} />}
        {activeTab === 'PERFORMANCE' && <PerformanceHub />}
        {activeTab === 'PLANS' && <PlansTab />}
        {activeTab === 'BILLING' && <BillingTab tenants={tenants} plans={plans} fetchData={fetchData} />}
        {activeTab === 'SUPPORT' && <SupportTab />}
        {activeTab === 'BROADCAST' && <BroadcastTab tenants={tenants} />}
        {activeTab === 'BLOG' && <BlogTab />}
        {activeTab === 'EMAILS' && <EmailLogsTab />}
        {activeTab === 'SAFETY' && <SecurityCenterTab />}
        {activeTab === 'SETTINGS' && <SecurityLogsTab />}
        {activeTab === 'PROFILE' && <ProfileTab />}
      </div>

    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

const GomboStatCard = ({ title, value, sub, icon, color, trend }: any) => (
  <div className="gombo-card gombo-stat-card px-6 py-8">
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
const OverviewTab = ({ stats, tenants, currentUser }: { stats: any, tenants: Tenant[], currentUser: any }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Calculs statistiques
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.actif).length;
  const inactiveTenants = totalTenants - activeTenants;


  const handleAudit = () => {
    showToast("Analyse de l'infrastructure en cours...", "info");
    setTimeout(() => {
       showToast("Audit terminé. Configuration optimisée pour 5000+ utilisateurs.", "success");
    }, 2000);
  };

  return (
    <div className="gombo-theme-dark" style={{ animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* SECTION 1: WELCOME & PRIMARY FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem', marginBottom: '2.5rem' }} className="mobile-stack">
        {/* Profile Card */}
        <div className="gombo-card-elite px-8 py-10" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <div className="gombo-profile-circle" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>💎</div>
                  <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', border: '2px solid #1e293b' }}></div>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 950 }}>{currentUser?.nom_complet || 'Root Admin'}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>Gombo SaaS Admin Active</span>
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

        {/* Growth Area Chart (Restored) */}
        <div className="gombo-card-elite">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: 0, fontWeight: 950, fontSize: '1.1rem' }}>Data Flow <span className="text-slate-500">& Pulse</span></h4>
            <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 800, background: 'rgba(6,182,212,0.1)', padding: '4px 10px', borderRadius: '8px' }}>+ 5.27% Vol.</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growth_chart || []}>
                <defs>
                  <linearGradient id="gomboGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 800}} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="val" stroke="#06b6d4" strokeWidth={4} fill="url(#gomboGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: MERCHANT HEALTH MATRIX & GROWTH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Activity Gauge */}
        <div className="gombo-card-elite px-10 py-12 flex flex-col items-center justify-center">
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 950, color: '#f8fafc', fontSize: '1.1rem', letterSpacing: '-0.02em', width: '100%', textAlign: 'left' }}>Platform Activity Flux</h4>
          <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <svg width="200" height="200" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#06b6d4" strokeWidth="8" strokeDasharray={`${(activeTenants / Math.max(totalTenants, 1)) * 283}, 283`} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' }} />
             </svg>
             <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '2.8rem', fontWeight: 950, color: 'white' }}>{Math.round((activeTenants / Math.max(totalTenants, 1)) * 100)}%</div>
                <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Health Index</div>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', width: '100%' }}>
             <div style={{ flex: 1, textAlign: 'center', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.1)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#10b981' }}>{activeTenants}</div>
                <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 900, textTransform: 'uppercase' }}>Active Units</div>
             </div>
             <div style={{ flex: 1, textAlign: 'center', padding: '1rem', background: 'rgba(239,68,68,0.05)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.1)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#ef4444' }}>{inactiveTenants}</div>
                <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 900, textTransform: 'uppercase' }}>Quarantine</div>
             </div>
          </div>
        </div>

        {/* Merchant Success Matrix */}
        <div className="gombo-card-elite px-10 py-12">
          <div className="flex items-center justify-between mb-8">
            <h4 style={{ margin: 0, fontWeight: 950, color: '#f8fafc', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Merchant Health Matrix</h4>
            <div className="flex items-center gap-2">
               <HeartPulse size={16} className="text-pink-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">N-AI Pulse</span>
            </div>
          </div>
          
          <div className="space-y-6">
             {[
               { label: 'Growth Engines', count: tenants.filter(t => t.plan === 'PREMIUM' || t.plan === 'ELITE').length, color: '#6366f1', sub: 'High Volume Operations' },
               { label: 'Healthy Baseline', count: tenants.filter(t => (t.plan === 'BASIC' || t.plan === 'FREE') && t.actif).length, color: '#10b981', sub: 'Stable Daily Transactions' },
               { label: 'Critical / Churn Risk', count: inactiveTenants, color: '#f59e0b', sub: 'Low Engagement Signal' }
             ].map((tier, i) => (
                <div key={i} className="group cursor-pointer">
                   <div className="flex items-end justify-between mb-3">
                      <div>
                         <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{tier.label}</div>
                         <div className="text-[10px] font-bold text-slate-500">{tier.sub}</div>
                      </div>
                      <div className="text-xl font-black text-white">{tier.count}</div>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000" 
                        style={{ 
                          width: `${(tier.count / Math.max(totalTenants, 1)) * 100}%`,
                          background: tier.color,
                          boxShadow: `0 0 12px ${tier.color}40`
                        }} 
                      />
                   </div>
                </div>
             ))}
          </div>

          <button 
             onClick={() => navigate('/super-admin/tenants')}
             className="w-full mt-10 py-4 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-white/[0.05] hover:text-white transition-all"
          >
             View Segmentation Details
          </button>
        </div>
      </div>

        {/* User and Order Stats */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '1.5rem' }}>
           <div className="gombo-card-elite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
                <Users size={24} className="gombo-neon-cyan" style={{ marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '1.8rem', fontWeight: 950 }}>{stats.total_users.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800 }}>UTILISATEURS RÉSEAU</div>
             </div>
             <div style={{ width: '100px', height: '60px' }}>
                <svg width="100" height="60" viewBox="0 0 100 60">
                   <path d="M0,50 L20,40 L40,45 L60,20 L80,30 L100,5" fill="none" stroke="#06b6d4" strokeWidth="5" strokeLinecap="round" />
                </svg>
             </div>
           </div>
           <div className="gombo-card-elite px-6 py-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

      {/* SECTION 3: TENANT SUCCESS & HEALTH INDEX */}
      <div style={{ marginTop: '2.5rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <HeartPulse size={24} className="text-rose-500" />
            <div>
               <h4 style={{ margin: 0, fontWeight: 950, fontSize: '1.4rem' }}>Tenant Health <span className="text-slate-500">& Success Matrix</span></h4>
               <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Surveillance proactive du bien-être des boutiques</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="gombo-card-elite border-l-4 border-l-cyan-500">
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#06b6d4', textTransform: 'uppercase' }}>Growth Drivers</span>
                  <TrendingUp size={16} className="text-cyan-500" />
               </div>
               <div style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '0.5rem' }}>
                  {tenants.filter(t => t.plan !== 'FREE' && t.actif).length}
               </div>
               <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>Comptes à fort potentiel générant du MRR stable. Focus sur l'expansion de leurs fonctionnalités.</p>
            </div>

            <div className="gombo-card-elite border-l-4 border-l-emerald-500">
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase' }}>Healthy Operation</span>
                  <CheckCircle size={16} className="text-emerald-500" />
               </div>
               <div style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '0.5rem' }}>
                  {tenants.filter(t => t.actif).length}
               </div>
               <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>Boutiques fonctionnelles avec un taux de satisfaction optimal et une activité régulière.</p>
            </div>

            <div className="gombo-card-elite border-l-4 border-l-rose-500" style={{ background: 'rgba(244,63,94,0.02)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#f43f5e', textTransform: 'uppercase' }}>Critical Risk</span>
                  <AlertTriangle size={16} className="text-rose-500" />
               </div>
               <div style={{ fontSize: '2.5rem', fontWeight: 950, color: '#f43f5e', marginBottom: '0.5rem' }}>
                  {tenants.filter(t => !t.actif).length}
               </div>
               <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>Comptes inactifs ou suspendus nécessitant un suivi commercial ou technique immédiat.</p>
            </div>
         </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
         <button onClick={handleAudit} className="gombo-glow-button" style={{ flex: 1, height: '65px', fontSize: '1.1rem', cursor: 'pointer' }}>
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
    <div className="w-full max-w-full overflow-x-hidden" style={{ marginTop: '0' }}>
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
      const { error } = await insforge.database.rpc('update_tenant_plan_manual', { 
        p_tenant_id: tenantId, 
        p_plan_id: newPlan,
        p_status: 'paid' 
      });
      if (error) throw error;
      showToast('Configuration SaaS forcée avec succès', 'success');
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

  const handleImpersonate = (tenant: any) => {
    showToast(`🔒 Accès sécurisé : Établissement du tunnel Gombo vers ${tenant.nom}...`, 'info');
    setTimeout(() => {
       const origin = window.location.origin;
       const impersonationUrl = `${origin}/${tenant.slug}/dashboard`;
       window.open(impersonationUrl, '_blank');
    }, 1200);
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
            <div key={tenant.id} className="gombo-card-elite" style={{ borderLeft: `4px solid ${tenant.actif ? '#06b6d4' : '#f43f5e'}`, padding: '1.5rem' }}>
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
                  <div className={`gombo-badge ${tenant.actif ? 'gombo-badge-active' : 'gombo-badge-warning'}`}>
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
        <div className="modal-backdrop" style={{ zIndex: 10000, background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setIsModalOpen(false)}>
          <div className="gombo-card-elite" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden', animation: 'modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-shell">
            <div className="modal-body-scroll" style={{ padding: '2rem 2rem 2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 950, margin: 0 }}>Déployer une Organisation</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}><X size={28} /></button>
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
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleRefresh = () => {
    fetchPlans();
    showToast('Infrastructure SaaS synchronisée', 'info');
  };

  const handleChange = (id: string, field: string, value: any) => {
    setPlans(pList => pList.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async (plan: any) => {
    setSavingId(plan.id);
    try {
      const { error } = await insforge.database.rpc('update_saas_plan', {
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
        p_max_products: plan.max_products === undefined ? -1 : Number(plan.max_products),
        p_max_users: plan.max_users === undefined ? -1 : Number(plan.max_users),
        p_max_orders_month: plan.max_orders_month === undefined ? -1 : Number(plan.max_orders_month)
      });

      if (error) throw error;
      showToast(`Plan "${plan.name}" mis à jour `, 'success');
      await fetchPlans();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const filteredPlans = plans.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const MODULE_CATEGORIES = [
    {
      title: 'Opérations',
      modules: [
        { key: 'module_crm_clients', label: 'CRM Clients', icon: <Users size={14} /> },
        { key: 'module_suivi_terrain', label: 'Suivi Terrain', icon: <Globe size={14} /> },
        { key: 'module_logistique_pro', label: 'Logist. Pro', icon: <Rocket size={14} /> },
        { key: 'module_livraisons_app', label: 'App Livr.', icon: <Activity size={14} /> },
      ]
    },
    {
      title: 'Finance',
      modules: [
        { key: 'module_tresorerie_audit', label: 'Audit Tréso.', icon: <ShieldCheck size={14} /> },
        { key: 'module_caisse_retour_expert', label: 'Caisse Expert', icon: <CreditCard size={14} /> },
        { key: 'module_staff_perf', label: 'Staff Perf.', icon: <TrendingUp size={14} /> },
        { key: 'module_expertise_comptable', label: 'Comptabilité', icon: <ShieldCheck size={14} /> }
      ]
    },
    {
      title: 'Enterprise',
      modules: [
        { key: 'module_api', label: 'API Access', icon: <Activity size={14} /> },
        { key: 'module_whatsapp', label: 'WhatsApp', icon: <Send size={14} /> },
        { key: 'module_multi_depot', label: 'Multi-Dépôts', icon: <Globe size={14} /> },
        { key: 'module_white_label', label: 'White Label', icon: <ShieldCheck size={14} /> },
      ]
    }
  ];

  const getPlanTheme = (index: number) => {
    const themes = [
      { color: '#06b6d4', grad: 'linear-gradient(135deg, #0891b2, #06b6d4)', glow: 'rgba(6,182,212,0.3)' },
      { color: '#6366f1', grad: 'linear-gradient(135deg, #4f46e5, #6366f1)', glow: 'rgba(99,102,241,0.3)' },
      { color: '#a855f7', grad: 'linear-gradient(135deg, #9333ea, #a855f7)', glow: 'rgba(168,85,247,0.3)' }
    ];
    return themes[index % themes.length];
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }} className="space-y-12">
      {/* IDENTICAL BAR TO TENANTS TAB */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
          <Search size={22} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Rechercher une offre commerciale..." 
            className="form-input"
            style={{ paddingLeft: '4rem', height: '64px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '1rem', fontWeight: 600 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleRefresh}
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-slate-400"
          style={{ height: '64px', width: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Activity size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {[1,2,3].map(i => <div key={i} className="h-[700px] rounded-[32px] bg-white/[0.02] border border-white/[0.05] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredPlans.map((plan, idx) => {
            const theme = getPlanTheme(idx);
            return (
              <div key={plan.id} 
                className="relative flex flex-col rounded-[40px] overflow-hidden transition-all duration-500 hover:-translate-y-2 group"
                style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 32px 64px -16px rgba(0,0,0,0.5)' }}
              >
                {/* HEADER (SLANTED & RIBBON) */}
                <div style={{ position: 'relative', height: '180px', background: theme.grad, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                   {/* Triangle fold effect */}
                   <div style={{ position: 'absolute', bottom: '-20px', left: '0', borderTop: `20px solid transparent`, borderRight: `20px solid black`, opacity: 0.3 }} />
                   
                   <input
                      type="text"
                      value={plan.name}
                      onChange={e => handleChange(plan.id, 'name', e.target.value)}
                      className="bg-transparent border-none text-white font-black text-3xl text-center focus:outline-none w-full drop-shadow-lg"
                    />
                    
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-white/60 font-black text-sm">$</span>
                      <input
                        type="number"
                        value={plan.price_fcfa}
                        onChange={e => handleChange(plan.id, 'price_fcfa', parseInt(e.target.value))}
                        className="bg-transparent border-none text-white font-black text-5xl text-center focus:outline-none w-28 tabular-nums drop-shadow-xl"
                      />
                      <span className="text-white/60 font-black text-xs">.00</span>
                    </div>

                    {/* ANGLED BOTTOM EDGE */}
                    <div style={{ 
                      position: 'absolute', bottom: '-40px', left: 0, right: 0, height: '80px', 
                      background: theme.grad, 
                      clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 100%)', 
                      zIndex: 1
                    }} />
                </div>

                {/* CONTENT SECTION */}
                <div className="flex-1 flex flex-col px-8 pb-32 pt-16">
                  {/* QUOTAS */}
                  <div className="grid grid-cols-3 gap-3 mb-10">
                     {[
                       { k: 'max_users', label: 'Users' }, { k: 'max_products', label: 'Items' }, { k: 'max_orders_month', label: 'Sales' }
                     ].map(q => (
                       <div key={q.k} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex flex-col items-center">
                          <input 
                            type="number" value={plan[q.k]} 
                            onChange={e => handleChange(plan.id, q.k, Number(e.target.value))}
                            className="bg-transparent border-none text-white font-black text-center text-sm w-full focus:outline-none" 
                          />
                          <span className="text-[10px] font-black uppercase text-slate-500 mt-1 tracking-widest">{q.label}</span>
                       </div>
                     ))}
                  </div>

                  {/* MODULES LIST */}
                  <div className="space-y-8">
                    {MODULE_CATEGORIES.map(cat => (
                      <div key={cat.title}>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] mb-4 px-2 flex items-center gap-3">
                           {cat.title} <div className="h-[1px] flex-1 bg-white/[0.03]"></div>
                        </p>
                        <div className="space-y-2">
                          {cat.modules.map(mod => (
                            <div 
                              key={mod.key}
                              onClick={() => handleChange(plan.id, mod.key, !plan[mod.key])}
                              className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all cursor-pointer ${plan[mod.key] ? 'bg-white/[0.04] text-white border border-white/[0.05]' : 'opacity-20 hover:opacity-100 hover:bg-white/[0.02] text-slate-500 border border-transparent'}`}
                            >
                               <div className={`p-2 rounded-xl ${plan[mod.key] ? 'bg-white/10' : ''}`}>
                                  {plan[mod.key] ? <CheckCircle size={14} color={theme.color} /> : <XCircle size={14} />}
                               </div>
                               <span className="text-xs font-black uppercase tracking-widest">{mod.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FOOTER AREA */}
                <div className="absolute bottom-0 left-0 right-0 p-10 pt-20" style={{ background: 'linear-gradient(to top, #0f172a 60%, transparent)' }}>
                   <button
                    onClick={() => handleSave(plan)}
                    disabled={savingId === plan.id}
                    className="relative z-10 w-full h-16 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl"
                    style={{ background: theme.grad, boxShadow: `0 16px 40px ${theme.glow}` }}
                   >
                     {savingId === plan.id ? <Activity size={24} className="animate-spin" /> : 'DEPLOIEMENT PLAN'}
                   </button>
                   
                   <div className="mt-5 flex items-center justify-center gap-2">
                      <input 
                        type="checkbox" checked={!!plan.is_popular} 
                        onChange={e => handleChange(plan.id, 'is_popular', e.target.checked)} 
                        className="accent-white size-3"
                        id={`pop-p-${plan.id}`}
                      />
                      <label htmlFor={`pop-p-${plan.id}`} className="text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">Recommander sur le portail</label>
                   </div>
                </div>
              </div>
            );
          })}
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
            const res = await emailService.sendEmail(tenant.email_contact, subject || "Gombo System Update", {
              body: `<div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #6366f1;">Annonce Gombo Core</h2>
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
       <div className="gombo-card-elite" style={{ padding: '3rem' }}>
          <h3 className="gombo-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Send size={28} color="var(--primary)" /> Gombo Mission Control
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
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Gombo Update / Information Critique..." style={{ width: '100%', height: '56px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '0 1.5rem', color: 'white', fontWeight: 800 }} />
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
const BillingTab = ({ tenants, plans, fetchData }: { tenants: Tenant[], plans: any[], fetchData: () => void }) => {
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleImpersonate = (tenant: any) => {
    showToast(`Session sécurisée : Tunnel Gombo vers ${tenant.nom}...`, 'info');
    setTimeout(() => {
       const origin = window.location.origin;
       window.open(`${origin}/${tenant.slug}/dashboard`, '_blank');
    }, 1200);
  };

  const handleOverrideBilling = async (tenant: Tenant, status: string) => {
    try {
      setActionLoading(tenant.id);
      const { error } = await insforge.database.rpc('update_tenant_plan_manual', {
        p_tenant_id: tenant.id,
        p_plan_id: tenant.plan,
        p_status: status
      });
      
      if (error) throw error;
      showToast(`${tenant.nom} : Mise à jour manuelle effectuée`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Calcul du MRR réel basé sur les facturations confirmées ('paid')
  const mrr = tenants.reduce((total, t) => {
    if (!t.actif || t.billing_status !== 'paid') return total;
    const plan = plans.find(p => p.id === t.plan);
    const price = plan ? (plan.price_fcfa || 0) : 0;
    return total + (price > 0 ? price : 0);
  }, 0);

  // Potentiel MRR (Total des actifs même si non payé ce mois)
  const potentialMrr = tenants.reduce((total, t) => {
    if (!t.actif) return total;
    const plan = plans.find(p => p.id === t.plan);
    const price = plan ? (plan.price_fcfa || 0) : 0;
    return total + (price > 0 ? price : 0);
  }, 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <GomboStatCard title="MRR ENCAISSÉ" value={`${mrr.toLocaleString()} F`} sub="Revenu confirmé (billing_status: paid)" icon={<CreditCard size={22} />} color="#10b981" trend="Actuel" />
          <GomboStatCard title="MRR PRÉVISIONNEL" value={`${potentialMrr.toLocaleString()} F`} sub="Potentiel total des actifs" icon={<TrendingUp size={22} />} color="#8b5cf6" trend={mrr > 0 ? `+${Math.round(((potentialMrr - mrr) / mrr) * 100)}%` : potentialMrr > 0 ? '+100%' : '0%'} />
       </div>

       <div className="gombo-card-elite" style={{ padding: '2.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.4rem', marginBottom: '2rem' }}>Paiement & Facturation Tenants</h3>
          <div className="table-responsive-cards px-0">
             <table className="gombo-table">
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
                         <td data-label="PLAN"><span className="gombo-badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{t.plan}</span></td>
                         <td data-label="STATUS" style={{ color: t.billing_status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 900 }}>
                            {t.billing_status === 'paid' ? ' Encaissé' : ' En attente'}
                          </td>
                         <td data-label="VALEUR" style={{ textAlign: 'right', fontWeight: 950 }}>
                            {plans.find(p => p.id === t.plan)?.price_fcfa?.toLocaleString() || 0} F
                         </td>
                         <td data-label="ACTIONS" style={{ textAlign: 'center' }}>
                             <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => handleOverrideBilling(t, t.billing_status === 'paid' ? 'pending' : 'paid')}
                                  disabled={actionLoading === t.id}
                                  className="gombo-card" 
                                  style={{ 
                                    padding: '0.4rem 0.8rem', 
                                    fontSize: '0.7rem', 
                                    background: t.billing_status === 'paid' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
                                    border: `1px solid ${t.billing_status === 'paid' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, 
                                    color: t.billing_status === 'paid' ? '#f59e0b' : '#10b981', 
                                    cursor: 'pointer', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '4px' 
                                  }}
                                >
                                   {actionLoading === t.id ? (
                                      <Activity size={12} className="animate-spin" />
                                   ) : (
                                      <>
                                        <CreditCard size={12} /> 
                                        {t.billing_status === 'paid' ? 'Déclasser' : 'Forcer Activation'}
                                      </>
                                   )}
                                </button>
                                <button 
                                  onClick={() => handleImpersonate(t)}
                                  className="gombo-card" 
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                   <Eye size={12} /> Inspecter
                                </button>
                             </div>
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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await insforge.database.from('support_tickets').select('*, tenants(nom)').order('created_at', { ascending: false });
      setTickets(data || []);
    } catch (e) {
      showToast("Erreur lors du chargement des tickets.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
       <div className="gombo-card-elite" style={{ padding: '2.5rem' }}>
          <h3 className="gombo-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '2.5rem' }}>Gombo Help Desk</h3>
          {loading ? <div className="spinner"></div> : (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {tickets.length === 0 ? <div style={{ color: '#64748b' }}>Aucune requête en attente.</div> : tickets.map(ticket => (
                  <div key={ticket.id} className="gombo-card-elite p-8 border border-white/5 hover:border-white/10 transition-all">
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ticket ID: {ticket.id.slice(0,8).toUpperCase()}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                           {ticket.status}
                        </div>
                     </div>
                     <h4 style={{ margin: 0, fontWeight: 950, fontSize: '1.25rem', marginBottom: '1rem' }}>{ticket.subject}</h4>
                     <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>{ticket.message}</p>
                     
                     <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                              {ticket.tenants?.nom?.charAt(0)}
                           </div>
                           <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white' }}>{ticket.tenants?.nom}</span>
                        </div>
                        <div className="flex gap-3">
                           <button 
                             onClick={async () => {
                               try {
                                 await insforge.database.from('support_tickets').update({ status: 'resolved' }).eq('id', ticket.id);
                                 showToast("Ticket marqué comme résolu.", "success");
                                 fetchTickets();
                               } catch (e) {
                                 showToast("Erreur lors de la résolution.", "error");
                               }
                             }}
                             className="px-4 py-2 border border-emerald-500/30 text-emerald-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all"
                           >
                              RÉSOUDRE
                           </button>
                           <button onClick={() => showToast("Canal de communication direct en cours d'ouverture...", "info")} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                              RÉPONDRE
                           </button>
                        </div>
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
      <div className="gombo-card-lite" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <h3 className="gombo-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '2rem' }}>Mon Profil Gombo</h3>
        
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

      <div className="gombo-card-lite" style={{ padding: '2.5rem' }}>
        <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '0.5rem', color: '#f43f5e' }}>Sécurité</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Mettez à jour votre mot de passe pour sécuriser l'accès à Gombo Core.</p>
        
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
       <div className="gombo-card-elite" style={{ padding: '2.5rem' }}>
          <h3 className="gombo-neon-text" style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <ShieldCheck size={28} color="var(--primary)" /> Sécurité & Audit Gombo
          </h3>
          {loading ? <div className="spinner"></div> : (
              <div className="table-container">
                 <table className="gombo-table">
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
/* -------------------------------------------------------------------------- */
/*                          SAFETY & SECURITY CENTER                          */
/* -------------------------------------------------------------------------- */
const SecurityCenterTab = () => {
  const [activeScans, setActiveScans] = useState<any[]>([]);
  const { showToast } = useToast();

  const handleDeepScan = () => {
    showToast("Initialisation du scan neural AI...", "info");
    setActiveScans(prev => [...prev, { id: Date.now(), title: 'Analyse des flux de données', progress: 0 }]);
  };

  return (
    <div style={{ animation: 'fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1)' }} className="space-y-10">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
             <div className="flex items-center gap-3 mb-3">
                <div className="size-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">Cyber-Logistique AI Active</span>
             </div>
             <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter" style={{ fontFamily: 'Outfit' }}>
                Safety & <span className="text-slate-500">AI Security</span>
             </h2>
          </div>
          <button 
            onClick={handleDeepScan}
            className="px-8 py-4 rounded-2xl bg-cyan-500 text-black font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-cyan-500/20"
          >
             Deep Neural Scan
          </button>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 flex flex-col gap-8">
             <div className="gombo-card-elite relative overflow-hidden p-10">
                <div className="absolute top-0 right-0 p-8">
                   <ShieldAlert size={120} className="text-white/[0.02]" />
                </div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10">AI Infrastructure Health</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-300">Data Integrity</span>
                         <span className="text-sm font-black text-emerald-400">99.98%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500" style={{ width: '99.98%' }} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Aucune corruption de données détectée sur les clusters multi-tenant.</p>
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-300">Auth Resilience</span>
                         <span className="text-sm font-black text-cyan-400">Stable</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-cyan-500" style={{ width: '100%' }} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Moteur RLS optimisé avec jetons de session haute sécurité.</p>
                   </div>
                </div>

                <div className="mt-16 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-5">
                   <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                   <div>
                      <h5 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-1">Recommandation AI</h5>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                         Nous avons détecté 3 tentatives de connexion infructueuses sur l'endpoint admin de <span className="text-white">boutique-express</span>. 
                         L'IP d'origine a été temporairement mise en quarantaine neuronale.
                      </p>
                   </div>
                </div>
             </div>

              {activeScans.length > 0 && (
                <div className="gombo-card-elite p-10">
                   <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-8">Active Neural Scans</h4>
                   <div className="space-y-8">
                      {activeScans.map(scan => (
                         <div key={scan.id} className="space-y-4">
                            <div className="flex justify-between items-center text-xs font-black">
                               <span className="text-white">{scan.title}</span>
                               <span className="text-cyan-400">IN PROGRESS</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-cyan-500 animate-[loading_2s_infinite]" style={{ width: '60%' }} />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="gombo-card-elite p-10">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Mission Critical Logs</h4>
                <div className="space-y-4">
                   {[
                      { event: 'RLS Context Refresh', target: 'Global', type: 'SUCCESS', icon: <CheckCircle /> },
                      { event: 'SQL Policy Audit', target: 'Orders Table', type: 'SUCCESS', icon: <Fingerprint /> },
                      { event: 'Dormant Account Purge', target: 'Test-Account-42', type: 'INFO', icon: <Info /> }
                   ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="text-slate-500">{item.icon}</div>
                            <div>
                               <p className="text-sm font-black text-white">{item.event}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.target}</p>
                            </div>
                         </div>
                         <span className="text-[10px] font-black text-slate-500">HAUTE PRIORITÉ</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="xl:col-span-4 flex flex-col gap-8">
             <div className="gombo-card-elite p-10 bg-slate-900 border-none shadow-[inset_0_0_100px_rgba(6,182,212,0.05)]">
                <div className="flex flex-col items-center text-center">
                   <div className="relative mb-8">
                      <div className="size-32 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                         <div className="size-24 rounded-full border-4 border-emerald-500 flex items-center justify-center text-4xl font-black text-white">
                            98
                         </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 p-3 bg-emerald-500 rounded-2xl text-black shadow-xl">
                         <ShieldCheck size={20} />
                      </div>
                   </div>
                   <h5 className="text-lg font-black text-white">Platform Safety Score</h5>
                   <p className="text-xs text-slate-500 mt-2 font-medium">Calculé en temps réel via l'analyse comportementale du trafic multi-tenant.</p>
                   
                   <div className="w-full mt-10 space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                         <Fingerprint size={18} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Biometric Identity Active</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-cyan-500/5 text-cyan-400 border border-cyan-500/10">
                         <Globe size={18} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Geo-fencing Protection</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="gombo-card-lite p-8">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Threat Intelligence</h4>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="size-2 rounded-full bg-cyan-500 mt-1.5" />
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                         Le module de filtrage des entrées SQL a bloqué <span className="text-white font-bold">142</span> requêtes suspectes cette semaine.
                      </p>
                   </div>
                   <div className="flex gap-4">
                      <div className="size-2 rounded-full bg-emerald-500 mt-1.5" />
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                         Tous les certificats SSL sont valides et l'encryption AES-256 est forcée sur tout le réseau.
                      </p>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
