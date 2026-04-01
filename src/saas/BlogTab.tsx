import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { FileText, Edit, Trash2, PlusCircle, Save, Activity, Eye } from 'lucide-react';

export const BlogTab = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<any>(null);
  const { showToast } = useToast();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      showToast(err.message || 'Erreur chargement blog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const postData = {
        title: currentPost.title,
        slug: currentPost.slug || currentPost.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        excerpt: currentPost.excerpt,
        content: currentPost.content,
        category: currentPost.category || 'Logistique',
        author: currentPost.author || 'GomboSwift Admin',
        image: currentPost.image,
        published: currentPost.published !== undefined ? currentPost.published : true
      };

      if (currentPost.id) {
        const { error } = await insforge.database
          .from('blog_posts')
          .update(postData)
          .eq('id', currentPost.id);
        if (error) throw error;
        showToast('Article mis à jour', 'success');
      } else {
        const { error } = await insforge.database
          .from('blog_posts')
          .insert([postData]);
        if (error) throw error;
        showToast('Article créé', 'success');
      }

      setIsEditing(false);
      setCurrentPost(null);
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || 'Erreur sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      const { error } = await insforge.database.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      showToast('Article supprimé', 'success');
      fetchPosts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (isEditing) {
    return (
      <div className="nexus-card-elite reveal" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>{currentPost?.id ? 'Modifier Article' : 'Nouvel Article'}</h2>
          <button onClick={() => setIsEditing(false)} className="nexus-card" style={{ padding: '0.6rem 1.2rem', cursor: 'pointer' }}>Annuler</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Titre</label>
              <input type="text" className="form-input" style={{ background: 'rgba(255,255,255,0.03)', height: '52px' }} value={currentPost?.title || ''} onChange={e => setCurrentPost({...currentPost, title: e.target.value})} required />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Slug URL</label>
              <input type="text" className="form-input" style={{ background: 'rgba(255,255,255,0.03)', height: '52px' }} value={currentPost?.slug || ''} onChange={e => setCurrentPost({...currentPost, slug: e.target.value})} placeholder="ex: mon-article" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Catégorie</label>
              <select className="form-input" style={{ background: 'rgba(255,255,255,0.03)', height: '52px', appearance: 'none', cursor: 'pointer' }} value={currentPost?.category || 'Logistique'} onChange={e => setCurrentPost({...currentPost, category: e.target.value})}>
                <option value="Logistique" style={{ color: '#000' }}>Logistique</option>
                <option value="E-commerce" style={{ color: '#000' }}>E-commerce</option>
                <option value="Tutoriels" style={{ color: '#000' }}>Tutoriels</option>
                <option value="Mises à jour SaaS" style={{ color: '#000' }}>Mises à jour SaaS</option>
                <option value="Étude de cas" style={{ color: '#000' }}>Étude de cas</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Auteur</label>
              <select className="form-input" style={{ background: 'rgba(255,255,255,0.03)', height: '52px', appearance: 'none', cursor: 'pointer' }} value={currentPost?.author || 'Admin'} onChange={e => setCurrentPost({...currentPost, author: e.target.value})}>
                <option value="Admin" style={{ color: '#000' }}>Admin</option>
                <option value="L'Équipe GomboSwiftCI" style={{ color: '#000' }}>L'Équipe GomboSwiftCI</option>
                <option value="Support Technique" style={{ color: '#000' }}>Support Technique</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Image URL</label>
              <input type="text" className="form-input" style={{ background: 'rgba(255,255,255,0.03)', height: '52px' }} value={currentPost?.image || ''} onChange={e => setCurrentPost({...currentPost, image: e.target.value})} placeholder="https://..." />
            </div>
          </div>

          <div className="form-group">
             <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                 <span>Extrait (Optimisation SEO)</span>
                 <span style={{ color: (currentPost?.excerpt?.length || 0) > 160 ? '#ef4444' : '#10b981' }}>{currentPost?.excerpt?.length || 0}/160</span>
             </label>
             <textarea className="form-input" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', height: '80px', paddingTop: '0.75rem', resize: 'none' }} placeholder="Texte court et percutant pour les moteurs de recherche..." value={currentPost?.excerpt || ''} onChange={e => setCurrentPost({...currentPost, excerpt: e.target.value})} />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Contenu (HTML)</label>
            <textarea className="form-input" style={{ background: 'rgba(255,255,255,0.03)', height: '350px', paddingTop: '0.75rem', fontFamily: 'monospace' }} value={currentPost?.content || ''} onChange={e => setCurrentPost({...currentPost, content: e.target.value})} required />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input type="checkbox" id="published" checked={currentPost?.published !== false} onChange={e => setCurrentPost({...currentPost, published: e.target.checked})} />
            <label htmlFor="published" style={{ fontWeight: 800, cursor: 'pointer' }}>Publier l'article</label>
          </div>

          <button type="submit" disabled={loading} className="nexus-glow-button" style={{ height: '60px', marginTop: '1rem', fontSize: '1rem' }}>
            {loading ? <Activity className="animate-spin" /> : <><Save size={20} /> ENREGISTRER L'ARTICLE</>}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="reveal">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0 }}>Gestion du Blog</h2>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontWeight: 500 }}>Contenu marketing & SEO pour la plateforme</p>
        </div>
        <button 
          onClick={() => { setCurrentPost({}); setIsEditing(true); }}
          className="nexus-glow-button" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <PlusCircle size={20} /> NOUVEL ARTICLE
        </button>
      </div>

      <div className="nexus-card-elite" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive-cards px-0">
          <table className="nexus-table">
            <thead>
              <tr>
                <th>ARTICLE</th>
                <th>CATÉGORIE</th>
                <th>STATUT</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td data-label="ARTICLE">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="mobile-hide" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#1e293b', flexShrink: 0, overflow: 'hidden' }}>
                        {post.image ? <img src={post.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FileText size={18} style={{ margin: '12px' }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{post.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>/{post.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="CAT">
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.3rem 0.7rem', borderRadius: '8px', textTransform: 'uppercase' }}>
                      {post.category}
                    </span>
                  </td>
                  <td data-label="STATUT">
                    <div className={`nexus-badge ${post.published ? 'nexus-badge-active' : 'nexus-badge-warning'}`}>
                       {post.published ? 'Publié' : 'Brouillon'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setCurrentPost(post); setIsEditing(true); }} className="nexus-icon-btn"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(post.id)} className="nexus-icon-btn" style={{ color: '#f43f5e' }}><Trash2 size={16} /></button>
                      <a href={`/blog/${post.slug}`} target="_blank" className="nexus-icon-btn"><Eye size={16} /></a>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && !loading && (
                <tr>
                   <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Aucun article trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
