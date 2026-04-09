import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { useToast } from '../contexts/ToastContext';
import { 
  FileText, Edit, Trash2, PlusCircle, Save, 
  Activity, Eye, Sparkles, LayoutDashboard, 
  Image as ImageIcon, Globe, Zap, ChevronLeft, User, RefreshCw
} from 'lucide-react';
import { BLOG_POSTS } from '../pages/blog/blogData';

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

  const handleDeepSync = async () => {
    setLoading(true);
    try {
      showToast("Analyse de la bibliothèque SEO Gombo...", "info");
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
      showToast(`${added} articles synchronisés avec succès.`, "success");
      fetchPosts();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPosts();
    showToast('Recherche de nouveaux articles...', 'info');
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
        showToast('Article mis à jour avec succès', 'success');
      } else {
        const { error } = await insforge.database
          .from('blog_posts')
          .insert([postData]);
        if (error) throw error;
        showToast('Nouvel article publié !', 'success');
      }

      setIsEditing(false);
      setCurrentPost(null);
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cet article ? Cette action est irréversible.')) return;
    try {
      const { error } = await insforge.database.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      showToast('Article supprimé du réseau', 'info');
      fetchPosts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditing(false)}
              className="group flex items-center justify-center size-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
            >
              <ChevronLeft size={20} className="text-slate-400 group-hover:text-white" />
            </button>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit' }}>
                {currentPost?.id ? 'Éditer' : 'Rédiger'} <span className="text-slate-500">l&apos;article</span>
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                {currentPost?.id ? 'Modification de contenu existant' : 'Création d&apos;une nouvelle publication'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-[32px] border border-white/[0.08] bg-slate-900/40 p-8">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Titre de l&apos;article</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                    placeholder="Ex: Optimiser vos livraisons avec GomboSwiftCI"
                    value={currentPost?.title || ''} 
                    onChange={e => setCurrentPost({...currentPost, title: e.target.value})} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contenu (Format HTML)</label>
                  <textarea 
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-3xl px-6 py-4 text-slate-300 font-medium placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all min-h-[450px] font-mono text-sm leading-relaxed"
                    placeholder="Écrivez votre article ici..."
                    value={currentPost?.content || ''} 
                    onChange={e => setCurrentPost({...currentPost, content: e.target.value})} 
                    required 
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                   <div className="flex items-center gap-3">
                      <div className={`size-3 rounded-full ${currentPost?.published !== false ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-600'}`} />
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={currentPost?.published !== false} 
                          onChange={e => setCurrentPost({...currentPost, published: e.target.checked})} 
                        />
                        <span className="text-sm font-black text-slate-300 group-hover:text-white transition-colors">Publier immédiatement</span>
                      </label>
                   </div>
                   <button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50"
                  >
                    {loading ? <Activity size={20} className="animate-spin" /> : <><Save size={20} /> ENREGISTRER</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-[32px] border border-white/[0.08] bg-slate-900/60 p-8 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} className="text-amber-400" /> Métadonnées & SEO
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Slug URL</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-cyan-400 font-mono focus:outline-none"
                    placeholder="mon-article-slug"
                    value={currentPost?.slug || ''} 
                    onChange={e => setCurrentPost({...currentPost, slug: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Catégorie</label>
                  <select 
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    value={currentPost?.category || 'Logistique'} 
                    onChange={e => setCurrentPost({...currentPost, category: e.target.value})}
                  >
                    <option value="Logistique">Logistique</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Tutoriels">Tutoriels</option>
                    <option value="Mises à jour">Mises à jour</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Image de couverture</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-slate-400 focus:outline-none pr-10"
                      placeholder="https://images.unsplash.com/..."
                      value={currentPost?.image || ''} 
                      onChange={e => setCurrentPost({...currentPost, image: e.target.value})}
                    />
                    <ImageIcon size={14} className="absolute right-3 top-3.5 text-slate-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    <span>Extrait SEO</span>
                    <span className={(currentPost?.excerpt?.length || 0) > 160 ? 'text-rose-500' : 'text-emerald-500'}>{currentPost?.excerpt?.length || 0}/160</span>
                  </label>
                  <textarea 
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none min-h-[100px] resize-none"
                    placeholder="Brève description pour Google..."
                    value={currentPost?.excerpt || ''} 
                    onChange={e => setCurrentPost({...currentPost, excerpt: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-dashed border-white/10 p-8 text-center bg-white/[0.02]">
               <Globe size={32} className="mx-auto text-slate-700 mb-4" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aperçu Public</p>
               <p className="text-[10px] text-slate-600 mt-2">L&apos;article sera visible à l&apos;adresse<br/>/blog/{currentPost?.slug || '...'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.05] pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <Sparkles className="text-cyan-400 size-4" />
             <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400">Content Management System</span>
           </div>
           <h2 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit' }}>
             Blog <span className="text-slate-500">Intelligence</span>
           </h2>
           <p className="text-sm font-medium text-slate-500 mt-2">Gerez le contenu marketing et le référencement naturel.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDeepSync}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-xs uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
            title="Sychroniser avec la bibliothèque SEO"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Deep Sync
          </button>

          <button 
            onClick={handleRefresh}
            className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-slate-400 hover:text-white"
            title="Rafraîchir"
          >
            <Activity size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={() => { setCurrentPost({}); setIsEditing(true); }}
            className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-slate-950 font-black overflow-hidden hover:scale-105 transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <PlusCircle size={20} className="relative group-hover:text-white" />
            <span className="relative group-hover:text-white">NOUVEL ARTICLE</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div 
            key={post.id} 
            className="group relative flex flex-col rounded-[32px] border border-white/[0.08] bg-slate-900/40 overflow-hidden hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-black/50"
          >
            <div className="aspect-video w-full bg-slate-800 relative overflow-hidden">
               {post.image ? (
                 <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.title} />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-700">
                   <FileText size={48} />
                 </div>
               )}
               <div className="absolute top-4 left-4">
                 <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                   {post.category}
                 </span>
               </div>
               {!post.published && (
                 <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                       Brouillon
                    </span>
                 </div>
               )}
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-black text-white leading-tight mb-4 group-hover:text-cyan-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium line-clamp-3 mb-8">
                {post.excerpt || 'Aucun extrait disponible pour cet article.'}
              </p>

              <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/[0.05]">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-500">
                       <User size={12} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{post.author?.split(' ')[0]}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                      className="size-9 rounded-xl flex items-center justify-center bg-white/[0.04] text-slate-400 hover:bg-cyan-500 hover:text-white transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      className="size-9 rounded-xl flex items-center justify-center bg-white/[0.04] text-slate-400 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <a 
                      href={`/blog/${post.slug}`} 
                      target="_blank" 
                      className="size-9 rounded-xl flex items-center justify-center bg-white/[0.04] text-slate-400 hover:bg-violet-500 hover:text-white transition-all"
                    >
                      <Eye size={16} />
                    </a>
                 </div>
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
             <div className="size-20 rounded-[32px] bg-slate-900 border border-white/[0.05] flex items-center justify-center mx-auto mb-6">
                <LayoutDashboard size={32} className="text-slate-700" />
             </div>
             <h4 className="text-xl font-black text-white mb-2">Aucun article publié</h4>
             <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">Commencez à rédiger du contenu pour dynamiser votre présence en ligne.</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[1,2,3].map(i => (
             <div key={i} className="h-[400px] rounded-[32px] bg-slate-900/40 border border-white/[0.05] animate-pulse" />
           ))}
        </div>
      )}
    </div>
  );
};
