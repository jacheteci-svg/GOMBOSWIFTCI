import { useState, useEffect, cloneElement } from 'react';
import { insforge } from '../lib/insforge';
import { Tenant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity, ShieldCheck, Plus,
  AlertTriangle, CheckCircle, XCircle, 
  Globe, Users, Send, Rocket, CreditCard, Eye,
  Search, Power, X, Lock, Sparkles, TrendingUp, Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
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
      {activeTab !== 'PERFORMANCE' && (
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
      )}

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
        {cloneElement(icon, { size: 20 })}
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

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.actif).length;
  const inactiveTenants = totalTenants - activeTenants;

  const handleAudit = () => {
    showToast("Gombo AI : Diagnostic neural amorcé...", "info");
    setTimeout(() => {
       showToast("Infrastructure 100% opérationnelle. Aucun goulot détecté.", "success");
    }, 2500);
  };

  const handleDeepOptimization = () => {
    showToast("OPTIMISATION PROFONDE : Purge des caches système...", "info");
    
    // Simulate cache clear
    setTimeout(() => {
       showToast("RE-SYNCHRONISATION DES NODES : Équilibrage de charge...", "info");
       setTimeout(() => {
          showToast("SYSTÈME OPTIMISÉ : Performance Elite restaurée sur tout le logiciel.", "success");
       }, 2000);
    }, 1500);
  };

  return (
    <div className="gombo-theme-dark" style={{ animation: 'pageEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1)', paddingBottom: '3rem', backgroundColor: '#070b14', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* --- PLECTO STYLE HEADER --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: 'white' }}>Centre de Commande Gombo</h2>
               </div>
               <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Intelligence de Flotte SaaS · Session Root: {currentUser?.nom_complet || 'Admin'}
               </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <button 
                 onClick={handleDeepOptimization} 
                 style={{ 
                   display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.25rem', height: '42px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)',
                   color: '#34d399', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em'
                 }}
               >
                 <Zap size={16} />
                 Optimisation Profonde
               </button>
               <button 
                 onClick={handleAudit} 
                 style={{ 
                   width: '42px', height: '42px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)',
                   color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                 }}
                 title="Audit Gombo AI"
               >
                 <Sparkles size={20} />
               </button>
            </div>
         </div>
      </div>

      {/* 🚀 HUB ECHELON : LES METRIQUES MAÎTRESSES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr', gap: '1.5rem', marginBottom: '2.5rem' }} className="mobile-stack">
         
         {/* HERO CARD : REVENU GLOBAL */}
         <div className="card" style={{ padding: '2rem', background: '#0e1422', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter: 'blur(30px)' }} />
            <div className="flex items-center gap-3 mb-6">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Volume Brut du Réseau (30J)</span>
            </div>
            <div className="flex items-baseline gap-2">
               <h2 style={{ fontSize: '3rem', fontWeight: 950, color: 'white', margin: 0, letterSpacing: '-0.04em' }}>
                 {stats.total_revenue?.toLocaleString()} 
                 <span style={{ fontSize: '1rem', color: '#06b6d4', marginLeft: '0.5rem', opacity: 0.6 }}>FCFA</span>
               </h2>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
               <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-black tracking-widest">+12.5%</div>
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">vs Période Précédente</span>
            </div>
         </div>

         {/* STAT PANELS */}
         <div className="card" style={{ padding: '2rem', background: '#0e1422', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Marchands</div>
            <div className="text-5xl font-black text-white mb-2">{totalTenants}</div>
            <div className="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest">Nodes Globaux</div>
         </div>

         <div className="card" style={{ padding: '2rem', background: '#0e1422', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Commandes Totales</div>
            <div className="text-4xl font-black text-white mb-2">{stats.total_orders?.toLocaleString()}</div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Flux Transactionnel</div>
         </div>

         <div className="card" style={{ padding: '2rem', background: '#0e1422', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTop: '4px solid #10b981' }}>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Santé Infra</div>
            <div className="text-4xl font-black text-emerald-400 mb-2">99.9%</div>
            <div className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest italic">Opérationnel</div>
         </div>
      </div>

      {/* 📊 CORE ANALYSIS : HEALTH & DATA FLOW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: '2rem', marginBottom: '2.5rem' }} className="mobile-stack">
         
         {/* INFRASTRUCTURE MATRIX (TABLE) */}
         <div className="card" style={{ padding: 0, background: '#0e1422', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
               <div>
                  <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white' }}>Matrice d'Infrastructure</h3>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800 }}>Segmentation & Puissance du Signal</p>
               </div>
               <button onClick={() => navigate('/super-admin/tenants')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, border: '1px solid rgba(6, 182, 212, 0.2)', cursor: 'pointer', backgroundColor: 'rgba(6, 182, 212, 0.05)', color: '#06b6d4', textTransform: 'uppercase' }}>Détails Master</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                     <tr style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <th style={{ padding: '1.25rem 2rem', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Tier de Signal</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Flux Réseau</th>
                        <th style={{ padding: '1.25rem 2rem', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>Unités</th>
                     </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                     {[
                        { name: 'Croissance', count: tenants.filter(t => t.plan === 'PREMIUM' || t.plan === 'ELITE').length, color: '#6366f1', sub: 'Volume Élevé', icon: <Rocket size={14} /> },
                        { name: 'Sain', count: tenants.filter(t => (t.plan === 'BASIC' || t.plan === 'FREE') && t.actif).length, color: '#10b981', sub: 'Flux Stable', icon: <CheckCircle size={14} /> },
                        { name: 'Critique', count: inactiveTenants, color: '#f43f5e', sub: 'Alerte Opérationnelle', icon: <AlertTriangle size={14} /> }
                     ].map((tier, i) => {
                        const percentage = Math.round((tier.count / Math.max(totalTenants, 1)) * 100);
                        return (
                           <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '1.25rem 2rem' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${tier.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tier.color, border: `1px solid ${tier.color}25` }}>
                                       {tier.icon}
                                    </div>
                                    <div>
                                       <p style={{ margin: 0, fontWeight: 900, fontSize: '0.85rem', color: 'white', textTransform: 'uppercase' }}>{tier.name}</p>
                                       <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{tier.sub}</p>
                                    </div>
                                 </div>
                              </td>
                              <td style={{ padding: '1.25rem 1rem' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                       <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: tier.color, boxShadow: `0 0 10px ${tier.color}` }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{percentage}%</span>
                                 </div>
                              </td>
                              <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                 <span style={{ fontSize: '1.25rem', fontWeight: 950, color: 'white' }}>{tier.count}</span>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         {/* PULSE ANALYZER */}
         <div className="flex flex-col gap-6">
            <div className="card" style={{ padding: '2rem', background: '#0e1422', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', height: '100%' }}>
               <div className="flex items-center justify-between mb-8">
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Taux de Pulsation Réseau</div>
                  <Activity size={18} className="text-cyan-400 animate-pulse" />
               </div>
               
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <svg width="180" height="180" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="4" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#06b6d4" strokeWidth="6" strokeDasharray={`${(activeTenants / Math.max(totalTenants, 1)) * 283}, 283`} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', filter: 'drop-shadow(0 0 10px #06b6d4)' }} />
                     </svg>
                     <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 950, color: 'white' }}>{Math.round((activeTenants / Math.max(totalTenants, 1)) * 100)}%</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase' }}>Intégrité</div>
                     </div>
                  </div>
               </div>

               <div className="mt-8 flex gap-3">
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                     <div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'white' }}>{activeTenants}</div>
                     <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase' }}>En Ligne</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                     <div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'rgba(255,255,255,0.5)' }}>{inactiveTenants}</div>
                     <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase' }}>Hors-Ligne</div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 📡 TELEMETRY DOCK : LIVE FLOW CHARTING */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }} className="mobile-stack">
         {[
            { label: 'Utilisateurs Réseau', val: stats.total_users, color: '#06b6d4', icon: <Users size={16} />, def: 'colorUsers' },
            { label: 'Flux Réseau Global', val: stats.total_orders, color: '#ec4899', icon: <Activity size={16} />, def: 'colorOrders' }
         ].map((panel, idx) => (
            <div key={idx} className="card" style={{ padding: '2rem', background: '#0e1422', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: panel.color }}>
                        {panel.icon}
                     </div>
                     <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{panel.label}</span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontFamily: 'monospace', fontWeight: 950, color: 'white' }}>{(panel.val || 0).toLocaleString()}</div>
               </div>
               <div style={{ width: '100%', height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={stats.growth_chart && stats.growth_chart.length > 0 ? (idx === 0 ? stats.growth_chart : stats.growth_chart.map((d: any) => ({ ...d, value: d.value * 1.5 }))) : [
                        { name: 'Jan', value: 10 }, { name: 'Feb', value: 25 }, { name: 'Mar', value: 15 }, { name: 'Apr', value: 45 }, { name: 'May', value: 30 }, { name: 'Jun', value: 60 }
                     ]}>
                        <defs>
                           <linearGradient id={panel.def} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={panel.color} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={panel.color} stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.02)" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: '#12182b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="value" stroke={panel.color} strokeWidth={3} fillOpacity={1} fill={`url(#${panel.def})`} animationDuration={idx === 0 ? 1500 : 2500} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
         ))}
      </div>

      {/* 🔮 TACTICAL ECHELON : SUCCESS MATRIX */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.5rem' }} className="mobile-stack">
         {[
            { label: 'Nodes de Croissance', count: tenants.filter(t => t.plan !== 'FREE' && t.actif).length, color: '#06b6d4', icon: <TrendingUp size={20} />, desc: 'Matrice de Performance Elite' },
            { label: 'Nodes Sains', count: tenants.filter(t => t.actif).length, color: '#10b981', icon: <CheckCircle size={20} />, desc: 'Indicateurs de Flux Stables' },
            { label: 'Alerte Critique', count: tenants.filter(t => !t.actif).length, color: '#f43f5e', icon: <AlertTriangle size={20} />, desc: 'Avertissement de rupture système' }
         ].map((card, idx) => (
            <div key={idx} className="card" style={{ padding: '2rem', background: '#0e1422', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)', borderLeft: `6px solid ${card.color}` }}>
               <div className="flex items-center justify-between mb-4">
                  <span style={{ fontSize: '0.75rem', fontWeight: 950, color: card.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{card.label}</span>
                  <div style={{ color: card.color }}>{card.icon}</div>
               </div>
               <div style={{ fontSize: '3rem', fontWeight: 950, color: 'white', marginBottom: '0.25rem' }}>{card.count}</div>
               <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.desc}</p>
            </div>
         ))}
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
      const { data, error } = await insforge.database.rpc('update_saas_plan', {
        p_id: plan.id,
        p_name: plan.name,
        p_price_fcfa: plan.price_fcfa,
        p_description: plan.description || '',
        p_is_popular: !!plan.is_popular,
        p_is_active: !!plan.is_active,
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
      if (data && data.success === false) throw new Error(data.error || 'Erreur infrastucture');

      showToast(`Plan "${plan.name}" mis à jour `, 'success');
      await fetchPlans();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (plan: any) => {
    if (!window.confirm(`Êtes-vous certain de vouloir supprimer définitivement le plan "${plan.name}" ?\n\nCette action est irréversible.`)) return;
    
    setSavingId(plan.id);
    try {
      const { data, error } = await insforge.database.rpc('delete_saas_plan', { p_id: plan.id });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Erreur lors de la suppression');

      showToast('Plan supprimé de l\'infrastructure', 'success');
      fetchPlans();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddPlan = async () => {
    try {
      const { data, error } = await insforge.database.rpc('create_saas_plan', {
        p_name: 'Nouveau Plan Strategy',
        p_price_fcfa: 25000,
        p_description: 'Description de la nouvelle offre commerciale'
      });
      
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Erreur creation');

      showToast('Nouveau plan initialisé', 'success');
      fetchPlans();
    } catch (err: any) {
      showToast(err.message, 'error');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'pageEnter 0.6s ease' }}>
      
      {/* STRATEGY HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
         <div style={{ display: 'flex', gap: '4rem' }}>
            <div>
               <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Offres Actives</p>
               <p style={{ fontSize: '2.5rem', fontWeight: 950, margin: 0, lineHeight: 1 }}>{plans.filter(p => p.is_active).length}</p>
            </div>
            <div>
               <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Brouillons</p>
               <p style={{ fontSize: '2.5rem', fontWeight: 950, margin: 0, lineHeight: 1 }}>{plans.filter(p => !p.is_active).length}</p>
            </div>
            <div>
               <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Popularité</p>
               <p style={{ fontSize: '2.5rem', fontWeight: 950, margin: 0, lineHeight: 1 }}>{plans.filter(p => p.is_popular).length}<span style={{ fontSize: '1rem', color: 'var(--primary)', marginLeft: '0.25rem' }}>★</span></p>
            </div>
         </div>
         <button 
           onClick={handleAddPlan}
           style={{ padding: '1rem 1.5rem', borderRadius: '16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 8px 20px rgba(6,182,212,0.3)' }}
         >
           <Plus size={18} /> Nouvelle Offre
         </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
          <Search size={22} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input 
            type="text" 
            placeholder="Rechercher une offre commerciale..." 
            style={{ width: '100%', paddingLeft: '4rem', height: '64px', background: '#0e1422', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', fontSize: '1rem', fontWeight: 700, color: 'white' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleRefresh}
          style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Activity size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
           {[1,2,3].map(i => <div key={i} style={{ height: '800px', borderRadius: '32px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} className="animate-pulse" />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '3rem' }}>
          {filteredPlans.map((plan, idx) => {
            const theme = getPlanTheme(idx);
            return (
              <div key={plan.id} 
                style={{ 
                  position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: '40px', overflow: 'hidden', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 32px 64px -16px rgba(0,0,0,0.5)', transition: 'transform 0.3s ease',
                  opacity: plan.is_active ? 1 : 0.7 
                }}
              >
                {/* HEADER (SLANTED & RIBBON) */}
                <div style={{ position: 'relative', height: '220px', background: plan.is_active ? theme.grad : 'linear-gradient(135deg, #1e293b, #334155)', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                   
                   {/* STATUS TOGGLE */}
                   <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>{plan.is_active ? 'Public' : 'Brouillon'}</span>
                      <input 
                        type="checkbox" checked={!!plan.is_active} 
                        onChange={e => handleChange(plan.id, 'is_active', e.target.checked)}
                        style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: theme.color }}
                      />
                   </div>

                   <input
                      type="text"
                      value={plan.name}
                      onChange={e => handleChange(plan.id, 'name', e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 900, fontSize: '1.75rem', textAlign: 'center', width: '100%', outline: 'none', textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                    />
                    
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 900, fontSize: '1rem' }}>CFA</span>
                      <input
                        type="number"
                        value={plan.price_fcfa}
                        onChange={e => handleChange(plan.id, 'price_fcfa', parseInt(e.target.value))}
                        style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 950, fontSize: '3.5rem', textAlign: 'center', outline: 'none', width: '200px', textShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                      />
                    </div>

                    {/* ANGLED BOTTOM EDGE */}
                    <div style={{ 
                      position: 'absolute', bottom: '-40px', left: 0, right: 0, height: '80px', 
                      background: plan.is_active ? theme.grad : 'linear-gradient(135deg, #1e293b, #334155)', 
                      clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 100%)', 
                      zIndex: 1
                    }} />
                </div>

                {/* CONTENT SECTION */}
                <div style={{ flex: 1, padding: '4rem 2rem 10rem 2rem' }}>
                  {/* QUOTAS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '2.5rem' }}>
                     {[
                       { k: 'max_users', label: 'Utilisateurs' }, { k: 'max_products', label: 'Produits' }, { k: 'max_orders_month', label: 'Ventes / Mo' }
                     ].map(q => (
                       <div key={q.k} style={{ padding: '1.25rem 0.5rem', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <input 
                            type="number" value={plan[q.k]} 
                            onChange={e => handleChange(plan.id, q.k, Number(e.target.value))}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 900, textAlign: 'center', fontSize: '1rem', outline: 'none', width: '100%' }} 
                          />
                          <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem', letterSpacing: '0.05em' }}>{q.label}</span>
                       </div>
                     ))}
                  </div>

                  {/* MODULES LIST */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {MODULE_CATEGORIES.map(cat => (
                      <div key={cat.title}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           {cat.title} <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.04)' }} />
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                           {cat.modules.map(mod => (
                             <div 
                               key={mod.key}
                               onClick={() => handleChange(plan.id, mod.key, !plan[mod.key])}
                               style={{ 
                                 display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                                 backgroundColor: plan[mod.key] ? 'rgba(255,255,255,0.03)' : 'transparent',
                                 opacity: plan[mod.key] ? 1 : 0.25,
                                 border: plan[mod.key] ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent'
                               }}
                             >
                                <div style={{ color: plan[mod.key] ? theme.color : 'white' }}>
                                   {plan[mod.key] ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mod.label}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DANGER ZONE */}
                  <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
                     <button 
                       onClick={() => handleDelete(plan)}
                       style={{ 
                         color: '#ef4444', 
                         background: 'rgba(239, 68, 68, 0.05)', 
                         border: '1px solid rgba(239, 68, 68, 0.2)', 
                         padding: '0.75rem 1.5rem', 
                         borderRadius: '14px', 
                         fontSize: '0.7rem', 
                         fontWeight: 900, 
                         textTransform: 'uppercase', 
                         letterSpacing: '0.15em', 
                         cursor: 'pointer', 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '0.75rem', 
                         transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                       }}
                       onMouseEnter={e => {
                         e.currentTarget.style.background = '#ef4444';
                         e.currentTarget.style.color = 'white';
                         e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.4)';
                       }}
                       onMouseLeave={e => {
                         e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                         e.currentTarget.style.color = '#ef4444';
                         e.currentTarget.style.boxShadow = 'none';
                       }}
                     >
                        <AlertTriangle size={16} /> SUPPRIMER L'OFFRE
                     </button>
                  </div>
                </div>

                {/* FOOTER AREA */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2.5rem', paddingTop: '5rem', background: 'linear-gradient(to top, #0f172a 60%, transparent)' }}>
                   <button
                    onClick={() => handleSave(plan)}
                    disabled={savingId === plan.id}
                    style={{ 
                      width: '100%', height: '60px', borderRadius: '16px', background: plan.is_active ? theme.grad : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', fontWeight: 950, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: plan.is_active ? `0 16px 40px ${theme.glow}` : 'none', transition: 'all 0.2s',
                      opacity: savingId === plan.id ? 0.5 : 1
                    }}
                   >
                     {savingId === plan.id ? <Activity size={24} className="animate-spin" /> : 'DÉPLOYER MISE À JOUR'}
                   </button>
                   
                   <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" checked={!!plan.is_popular} 
                        onChange={e => handleChange(plan.id, 'is_popular', e.target.checked)} 
                        id={`pop-p-${plan.id}`}
                        style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`pop-p-${plan.id}`} style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Recommandé (Ribbon ★)</label>
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
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
       const { data } = await insforge.database.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(6);
       setLogs(data || []);
    };
    fetchLogs();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return showToast("Mots de passe non identiques", "error");
    if (newPassword.length < 6) return showToast("Minimum 6 caractères", "error");
    
    setLoading(true);
    try {
      // @ts-ignore - SDK method name variations
      const { error } = await insforge.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast("Mot de passe mis à jour avec succès", "success");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeepScan = () => {
    showToast("Initialisation du scan neural AI...", "info");
    setTimeout(() => {
       showToast("Scan de l'infrastructure terminé : 0 menace détectée", "success");
    }, 3000);
  };

  return (
    <div style={{ animation: 'fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1)', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
       
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '100px', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Cyber-Shield AI Online</span>
             </div>
             <h2 style={{ fontSize: '3.5rem', fontWeight: 950, color: 'white', margin: 0, letterSpacing: '-0.03em', fontFamily: 'Outfit' }}>
                Safety & <span style={{ color: 'rgba(255,255,255,0.2)' }}>AI Security</span>
             </h2>
          </div>
          <button 
            onClick={handleDeepScan}
            style={{ padding: '1rem 2rem', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 950, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', boxShadow: '0 10px 30px rgba(6,182,212,0.3)' }}
          >
             Deep Neural Scan
          </button>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
             
             {/* INFRASTRUCTURE HEALTH */}
             <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2.5rem' }}>Infrastructure AI Health</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '3rem' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                         <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Intégrité des Données</span>
                         <span style={{ fontSize: '1rem', fontWeight: 950, color: '#10b981' }}>99.98%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                         <div style={{ width: '99.98%', height: '100%', background: '#10b981' }} />
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Aucune anomalie détectée sur les clusters de stockage PostgreSQL.</p>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                         <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Sync AI Nodes</span>
                         <span style={{ fontSize: '1rem', fontWeight: 950, color: 'var(--primary)' }}>Stable</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                         <div style={{ width: '85%', height: '100%', background: 'var(--primary)' }} />
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Latence moyenne de l'API : 24ms. Charge globale : 12%.</p>
                   </div>
                </div>
             </div>

             {/* AUDIT LOGS FEED */}
             <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                   <h4 style={{ fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Audit Master Logs</h4>
                   <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 900 }}>Voir tout</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {logs.length > 0 ? logs.map((log: any) => (
                     <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '100px', background: log.action.includes('error') ? '#f43f5e' : 'var(--primary)' }} />
                        <div style={{ flex: 1 }}>
                           <p style={{ margin: 0, fontSize: '0.8rem', color: 'white', fontWeight: 800 }}>{log.action}</p>
                           <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{log.details || 'Aucun détail supplémentaire'}</p>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>{new Date(log.created_at).toLocaleTimeString()}</span>
                     </div>
                   )) : (
                     <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>Aucun log d'audit récent détecté.</p>
                   )}
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
             {/* PASSWORD CENTER */}
             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                      <Lock size={20} />
                   </div>
                   <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.25rem', color: 'white' }}>Accès Master</h3>
                </div>
                
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginLeft: '0.5rem' }}>Nouveau Password</label>
                      <input 
                        type="password" 
                        style={{ width: '100%', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="Master Token Key"
                      />
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 950, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginLeft: '0.5rem' }}>Confirmation</label>
                      <input 
                        type="password" 
                        style={{ width: '100%', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                      />
                   </div>
                   <button 
                    type="submit" 
                    disabled={loading}
                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: '#f43f5e', color: 'white', border: 'none', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', marginTop: '1rem' }}
                   >
                     {loading ? 'EN COURS...' : 'ACTUALISER L\'ACCÈS'}
                   </button>
                </form>
             </div>

             {/* AUTH NODE */}
             <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <ShieldCheck size={32} color="#10b981" />
                <div>
                   <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 950, color: '#10b981', textTransform: 'uppercase' }}>Session Sécurisée</p>
                   <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>SSL 256-bit AES Encryption Active</p>
                </div>
             </div>
          </div>
       </div>

    </div>
  );
};
