import { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { 
  Edit, Trash2, 
  Sparkles, Activity,
  ChevronLeft, User, RefreshCw,
  Search, Plus, Globe, Newspaper, ShieldCheck
} from 'lucide-react';
import { BLOG_POSTS } from '../pages/blog/blogData';

export const BlogTab = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleDeepSync = async () => {
    setLoading(true);
    try {
      showToast("Gombo AI : Synchronisation SEO...", "info");
      let added = 0;
      for (const localPost of BLOG_POSTS) {
        const exists = posts.some(p => p.slug === localPost.slug);
        if (!exists) {
          const { error } = await insforge.database.from('blog_posts').insert({
            title: localPost.title,
            slug: localPost.slug,
            excerpt: localPost.excerpt,
            content: localPost.content,
            category: localPost.category,
            author: localPost.author,
            image: localPost.image,
            published: true
          });
          if (!error) added++;
        }
      }
      showToast(`${added} articles synchronisés`, "success");
      fetchPosts();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

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
        author: currentPost.author || 'Super Admin',
        image: currentPost.image,
        published: currentPost.published !== undefined ? currentPost.published : true
      };

      if (currentPost.id) {
        const { error } = await insforge.database.from('blog_posts').update(postData).eq('id', currentPost.id);
        if (error) throw error;
        showToast('Article mis à jour', 'success');
      } else {
        const { error } = await insforge.database.from('blog_posts').insert([postData]);
        if (error) throw error;
        showToast('Article publié !', 'success');
      }
      setIsEditing(false);
      setCurrentPost(null);
      fetchPosts();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous supprimer cet article ?')) return;
    try {
      const { error } = await insforge.database.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      showToast('Article supprimé', 'info');
      fetchPosts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'pageEnter 0.6s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem' }}>
          <button 
            onClick={() => setIsEditing(false)}
            style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'white', margin: 0, letterSpacing: '-0.02em', fontFamily: 'Outfit' }}>
              {currentPost?.id ? 'Modifier' : 'Rédiger'} <span style={{ color: 'rgba(255,255,255,0.3)' }}>l'article</span>
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '0.5rem' }}>Titre Editorial</label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '1.25rem 2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', color: 'white', fontSize: '1.25rem', fontWeight: 900, outline: 'none' }}
                    value={currentPost?.title || ''} 
                    onChange={e => setCurrentPost({...currentPost, title: e.target.value})} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginLeft: '0.5rem' }}>Contenu Master (HTML)</label>
                  <textarea 
                    style={{ width: '100%', padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.6, minHeight: '600px', outline: 'none', fontFamily: 'monospace' }}
                    value={currentPost?.content || ''} 
                    onChange={e => setCurrentPost({...currentPost, content: e.target.value})} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '100px', background: currentPost?.published !== false ? '#10b981' : '#334155', boxShadow: currentPost?.published !== false ? '0 0 15px rgba(16,185,129,0.5)' : 'none' }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          style={{ display: 'none' }} 
                          checked={currentPost?.published !== false} 
                          onChange={e => setCurrentPost({...currentPost, published: e.target.checked})} 
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Réseau Gombo Actif</span>
                      </label>
                   </div>
                   <button 
                    type="submit" 
                    disabled={loading}
                    style={{ padding: '1rem 3rem', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: 950, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.5 : 1 }}
                  >
                    {loading ? <Activity size={20} className="animate-spin" /> : 'DEPLOIEMENT ARTICLE'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <Sparkles size={18} color="var(--primary)" />
                 <span style={{ fontSize: '0.65rem', fontWeight: 950, color: 'white', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Configuration SEO</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Slug URL</label>
                  <input type="text" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 900 }} value={currentPost?.slug || ''} onChange={e => setCurrentPost({...currentPost, slug: e.target.value})} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Catégorie Gombo</label>
                  <select style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1rem', color: 'white', fontSize: '0.75rem', fontWeight: 900, outline: 'none' }} value={currentPost?.category || 'Logistique'} onChange={e => setCurrentPost({...currentPost, category: e.target.value})}>
                    <option value="Logistique">LOGISTIQUE</option>
                    <option value="E-commerce">E-COMMERCE</option>
                    <option value="Strategy">STRATÉGIE</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Image Master (URL)</label>
                  <input type="text" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.7rem' }} value={currentPost?.image || ''} onChange={e => setCurrentPost({...currentPost, image: e.target.value})} />
                </div>
              </div>
            </div>
            
            {currentPost?.image && (
              <div style={{ borderRadius: '32px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                 <img src={currentPost.image} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', animation: 'pageEnter 0.6s ease' }}>
      
      {/* INSIGHTS HEADER */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.5rem' }} className="hide-scrollbar">
         <div style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
               <Newspaper size={24} />
            </div>
            <div>
               <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Articles Publiés</p>
               <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 950, color: 'white' }}>{posts.length}</p>
            </div>
         </div>
         <div style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
               <Globe size={24} />
            </div>
            <div>
               <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Visibilité SEO</p>
               <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 950, color: 'white' }}>High Score</p>
            </div>
         </div>
         <div style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
               <ShieldCheck size={24} />
            </div>
            <div>
               <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sécurité Réseau</p>
               <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 950, color: 'white' }}>Garanti</p>
            </div>
         </div>
      </div>

      {/* SEARCH AND ACTIONS */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={22} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input 
            type="text" 
            placeholder="Rechercher un article stratégique..." 
            style={{ width: '100%', paddingLeft: '4rem', height: '64px', background: '#0e1422', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', fontSize: '1rem', fontWeight: 700, color: 'white', outline: 'none' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleDeepSync} 
            style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
          >
             <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => { setCurrentPost({}); setIsEditing(true); }} 
            style={{ padding: '0 2.5rem', borderRadius: '20px', background: 'white', color: 'black', border: 'none', fontWeight: 950, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 10px 30px rgba(255,255,255,0.1)' }}
          >
            <Plus size={24} /> NOUVEL ARTICLE
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
           {[1,2,3].map(i => <div key={i} style={{ height: '500px', borderRadius: '32px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} className="animate-pulse" />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
          {filteredPosts.map(post => (
            <div 
              key={post.id} 
              style={{ display: 'flex', flexDirection: 'column', background: '#0f172a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '40px', overflow: 'hidden', transition: 'all 0.3s ease' }}
            >
              <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
                 {post.image ? (
                   <img src={post.image} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt={post.title} />
                 ) : (
                   <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Newspaper size={48} color="rgba(255,255,255,0.1)" />
                   </div>
                 )}
                 <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
                    <span style={{ padding: '0.5rem 1rem', borderRadius: '100px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.6rem', fontWeight: 950, color: 'white', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                       {post.category}
                    </span>
                 </div>
                 {!post.published && (
                   <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem' }}>
                      <span style={{ padding: '0.5rem 1rem', borderRadius: '100px', background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.3)', fontSize: '0.6rem', fontWeight: 950, color: '#f43f5e', textTransform: 'uppercase' }}>
                         Brouillon
                      </span>
                   </div>
                 )}
              </div>

              <div style={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 1rem 0', fontFamily: 'Outfit' }}>{post.title}</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, lineHeight: 1.5, margin: '0 0 2rem 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '100px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                         <User size={14} />
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>{post.author}</span>
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                        style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'white'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
