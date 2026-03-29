import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { Tenant } from '../types';
import { 
  Building, 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Globe,
  Zap,
  X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useToast } from '../contexts/ToastContext';

export const SuperAdmin: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformStats, setPlatformStats] = useState({
    total_tenants: 0,
    active_tenants: 0,
    total_users: 0,
    total_orders: 0,
    total_revenue: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ nom: '', slug: '', email_contact: '' });
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
      showToast(err.message || "Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePlan = async (tenantId: string, newPlan: string) => {
    try {
      setLoading(true);
      const { error } = await insforge.database.rpc('update_tenant_plan', { 
        t_id: tenantId, 
        new_plan: newPlan 
      });

      if (error) throw error;
      showToast("Plan mis à jour avec succès", "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      const { error } = await insforge.database
        .from('tenants')
        .update({ actif: !tenant.actif })
        .eq('id', tenant.id);

      if (error) throw error;
      showToast(`Organisation ${tenant.nom} ${!tenant.actif ? 'activée' : 'désactivée'}`, "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      showToast(err.message || "Erreur de création", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email_contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'pageEnter 0.6s ease' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="text-premium" style={{ fontSize: '2.5rem', fontWeight: 900 }}>Console SuperAdmin</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Gestion globale de la plateforme SaaS GomboSwiftCI.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary" 
          style={{ padding: '0.9rem 1.5rem', gap: '0.75rem' }}
        >
          <Plus size={20} />
          Nouvelle Organisation
        </button>
      </div>

      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard title="Organisations" value={platformStats.total_tenants} sub={`${platformStats.active_tenants} actives`} icon={<Building size={20} />} color="#3b82f6" trend="+4%" />
        <StatCard title="Utilisateurs totaux" value={platformStats.total_users} sub="Administrateurs & Staff" icon={<Users size={20} />} color="#8b5cf6" trend="+12%" />
        <StatCard title="Volume Colis" value={platformStats.total_orders.toLocaleString()} sub="Total historique" icon={<Zap size={20} />} color="#ec4899" trend="+8%" />
        <StatCard title="Chiffre d'Affaire Global" value={`${platformStats.total_revenue.toLocaleString()} F`} sub="Ventes livrées" icon={<TrendingUp size={20} />} color="#10b981" trend="+15%" />
      </div>

      {/* Analytics Chart Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '3rem' }} className="mobile-stack">
        <div className="card glass-effect" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem' }}>Croissance du Réseau</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div> Nouveaux Tenants
               </div>
            </div>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { date: 'Jan', val: 12 }, { date: 'Fév', val: 18 }, { date: 'Mar', val: 25 }, 
                { date: 'Avr', val: 32 }, { date: 'Mai', val: platformStats.total_tenants }
              ]}>
                <defs>
                   <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-premium)' }} />
                <Area type="monotone" dataKey="val" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorTenants)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card glass-effect" style={{ padding: '2rem' }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Distribution des Plans</h3>
          <div style={{ height: '200px', marginBottom: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Free', value: tenants.filter(t => t.plan === 'FREE').length, fill: '#94a3b8' },
                { name: 'Basic', value: tenants.filter(t => t.plan === 'BASIC').length, fill: '#3b82f6' },
                { name: 'Premium', value: tenants.filter(t => t.plan === 'PREMIUM').length, fill: '#8b5cf6' },
                { name: 'Enterprise', value: tenants.filter(t => t.plan === 'ENTERPRISE').length, fill: '#ec4899' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-premium)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--primary-glow)', borderRadius: '12px', border: '1px solid var(--primary-light)' }}>
             <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>💡 Insight Platform</p>
             <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.4 }}>
               Le passage au plan **Premium** a augmenté de **15%** ce mois-ci par rapport au mois précédent.
             </p>
          </div>
        </div>
      </div>

      {/* Main Filter & Table */}
      <div className="card glass-effect" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Rechercher par nom, slug ou email..." 
              style={{ paddingLeft: '3rem', height: '48px', borderRadius: '12px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Secteur / Slug</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Date Création</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner"></div>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Aucune organisation trouvée.
                  </td>
                </tr>
              ) : filteredTenants.map(tenant => (
                <tr key={tenant.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        {tenant.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{tenant.nom}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.email_contact}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Globe size={14} />
                      {tenant.slug}.gomboswiftci.app
                    </div>
                  </td>
                  <td>
                    <select 
                      className="form-select" 
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 700, color: 'var(--text-main)', width: 'auto' }}
                      value={tenant.plan}
                      onChange={(e) => handleUpdatePlan(tenant.id, e.target.value)}
                    >
                      <option value="FREE">FREE</option>
                      <option value="BASIC">BASIC</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: tenant.actif ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                      {tenant.actif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {tenant.actif ? 'Actif' : 'Suspendu'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleToggleStatus(tenant)}
                        className={`btn ${tenant.actif ? 'btn-outline' : 'btn-primary'}`} 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: tenant.actif ? '#ef4444' : 'white' }}
                      >
                        {tenant.actif ? 'Suspendre' : 'Activer'}
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '8px' }}>
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle Organisation */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="card glass-effect" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', animation: 'modalIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Nouvelle Organisation</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Nom de l'entreprise</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Gombo Logistique Sarl" 
                  required
                  value={newTenant.nom}
                  onChange={e => setNewTenant({...newTenant, nom: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Slug (Sous-domaine)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="ex: gomboland" 
                  required
                  value={newTenant.slug}
                  onChange={e => setNewTenant({...newTenant, slug: e.target.value})}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>URL: {newTenant.slug || 'slug'}.gomboswiftci.app</span>
              </div>
              <div className="form-group">
                <label className="form-label">Email de contact</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="contact@entreprise.ci" 
                  required
                  value={newTenant.email_contact}
                  onChange={e => setNewTenant({...newTenant, email_contact: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>{loading ? 'Création...' : "Créer l'Organisation"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon, color, trend }: any) => (
  <div className="card glass-effect" style={{ padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div style={{ background: `${color}15`, color: color, padding: '0.5rem', borderRadius: '10px' }}>
        {icon}
      </div>
      <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>{trend}</span>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.2rem' }}>{title}</div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{sub}</div>
  </div>
);