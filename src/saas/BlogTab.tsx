import { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { 
  Edit, Trash2, 
  Sparkles, Activity,
  ChevronLeft, User, RefreshCw,
  Search, Plus
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsEditing(false)}
              className="group flex items-center justify-center size-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
            >
              <ChevronLeft size={24} className="text-slate-400 group-hover:text-white" />
            </button>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit' }}>
                {currentPost?.id ? 'Editer' : 'Rédiger'} <span className="text-slate-500">l&apos;article</span>
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="rounded-[40px] border border-white/[0.08] bg-slate-900/40 p-10">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Titre de l&apos;actualité</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl px-8 py-5 text-xl text-white font-black focus:outline-none focus:border-cyan-500/50 transition-all"
                    value={currentPost?.title || ''} 
                    onChange={e => setCurrentPost({...currentPost, title: e.target.value})} 
                    required 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contenu Master (HTML)</label>
                  <textarea 
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-3xl px-8 py-6 text-slate-300 font-medium focus:outline-none focus:border-cyan-500/50 transition-all min-h-[500px] font-mono text-sm"
                    value={currentPost?.content || ''} 
                    onChange={e => setCurrentPost({...currentPost, content: e.target.value})} 
                    required 
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-8">
                   <div className="flex items-center gap-4">
                      <div className={`size-4 rounded-full ${currentPost?.published !== false ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={currentPost?.published !== false} 
                          onChange={e => setCurrentPost({...currentPost, published: e.target.checked})} 
                        />
                        <span className="text-sm font-black text-slate-400 group-hover:text-white transition-colors">Diffuser sur le réseau</span>
                      </label>
                   </div>
                   <button 
                    type="submit" 
                    disabled={loading}
                    className="px-12 py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? <Activity size={20} className="animate-spin" /> : 'SAUVEGARDER'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="rounded-[40px] border border-white/[0.08] bg-slate-900/60 p-10 space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Sparkles size={18} className="text-cyan-400" /> SEO CONFIG
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug URL</label>
                  <input type="text" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 text-xs text-cyan-400 font-black" value={currentPost?.slug || ''} onChange={e => setCurrentPost({...currentPost, slug: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catégorie</label>
                  <select className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 text-xs font-black text-white outline-none" value={currentPost?.category || 'Logistique'} onChange={e => setCurrentPost({...currentPost, category: e.target.value})}>
                    <option value="Logistique">LOGISTIQUE</option>
                    <option value="E-commerce">E-COMMERCE</option>
                    <option value="Strategy">STRATÉGIE</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Image URL</label>
                  <input type="text" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 text-xs text-slate-400" value={currentPost?.image || ''} onChange={e => setCurrentPost({...currentPost, image: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
          <Search size={22} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Rechercher un article ou une catégorie..." 
            className="form-input"
            style={{ paddingLeft: '4rem', height: '64px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '1rem', fontWeight: 600 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={handleDeepSync} className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all">
             <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setCurrentPost({}); setIsEditing(true); }} className="btn btn-primary" style={{ height: '64px', padding: '0 2.5rem', borderRadius: '20px', fontWeight: 950, display: 'flex', gap: '0.8rem' }}>
            <Plus size={24} /> NOUVEL ARTICLE
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1,2,3].map(i => <div key={i} className="h-[450px] rounded-[32px] bg-white/[0.02] border border-white/[0.05] animate-pulse" />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: '2rem' }}>
          {filteredPosts.map(post => (
            <div 
              key={post.id} 
              className="gombo-card-elite group overflow-hidden flex flex-col"
              style={{ borderLeft: `6px solid ${post.published ? '#06b6d4' : '#f43f5e'}`, padding: 0 }}
            >
              <div className="aspect-video w-full bg-slate-900 relative overflow-hidden">
                 {post.image && <img src={post.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-100" alt={post.title} />}
                 <div className="absolute top-6 left-6">
                    <span className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                       {post.category}
                    </span>
                 </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-white leading-tight mb-4" style={{ fontFamily: 'Outfit' }}>{post.title}</h3>
                <p className="text-sm text-slate-500 font-medium line-clamp-3 mb-10">{post.excerpt}</p>

                <div className="mt-auto flex items-center justify-between pt-8 border-t border-white/[0.05]">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                         <User size={14} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{post.author}</span>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                        className="size-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="size-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
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
