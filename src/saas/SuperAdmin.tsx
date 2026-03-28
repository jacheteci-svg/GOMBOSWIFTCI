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
  Globe
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const SuperAdmin: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (err: any) {
      showToast(err.message || "Erreur lors du chargement des organisations", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      const { error } = await insforge.database
        .from('tenants')
        .update({ actif: !tenant.actif })
        .eq('id', tenant.id);

      if (error) throw error;
      showToast(`Organisation ${tenant.nom} ${!tenant.actif ? 'activée' : 'désactivée'}`, "success");
      fetchTenants();
    } catch (err: any) {
      showToast(err.message, "error");
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
        <button className="btn btn-primary" style={{ padding: '0.9rem 1.5rem', gap: '0.75rem' }}>
          <Plus size={20} />
          Nouvelle Organisation
        </button>
      </div>

      {/* Stats Quick View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card glass-effect" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ background: '#eff6ff', color: 'var(--primary)', padding: '0.5rem', borderRadius: '10px' }}>
              <Building size={20} />
            </div>
            <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>+12%</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{tenants.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Organisations</div>
        </div>
        <div className="card glass-effect" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.5rem', borderRadius: '10px' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>2.4M FCFA</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>C.A Mensuel (MRR)</div>
        </div>
        <div className="card glass-effect" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '0.5rem', borderRadius: '10px' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{tenants.filter(t => t.plan !== 'FREE').length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Clients Payants</div>
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
                    <span className={`badge ${tenant.plan === 'FREE' ? 'badge-secondary' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                      {tenant.plan}
                    </span>
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
    </div>
  );
};
