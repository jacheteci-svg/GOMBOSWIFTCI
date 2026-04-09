import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { LandingNavbar } from '../../components/layout/LandingNavbar';
import { ArrowRight, Calendar, User, Search, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Blog: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await insforge.database
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const categories = ['All', ...new Set(posts.map(p => p.category))];
  
  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
      <LandingNavbar />
      
      {loading ? (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={48} className="animate-spin text-cyan-500" />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div style={{ padding: '10rem 2rem 6rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.6rem 1.5rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 900, color: '#22d3ee', marginBottom: '2.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
               <Sparkles size={16} /> Business Intelligence & Logistique
            </div>
            
            <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '2rem', background: 'linear-gradient(to bottom, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
               L'Expertise Gombo<br/><span style={{ color: '#06b6d4' }}>à votre service.</span>
            </h1>
            <p style={{ maxWidth: '750px', margin: '0 auto', fontSize: '1.25rem', color: '#94a3b8', lineHeight: 1.7, fontWeight: 500 }}>
               Découvrez nos analyses sur l'e-commerce, la tech logistique et les stratégies de croissance pour dominer votre marché.
            </p>
          </div>

          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem 10rem' }}>
            {/* Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '5rem' }}>
               <div style={{ position: 'relative', maxWidth: '500px', width: '100%' }}>
                  <Search size={20} className="text-slate-500" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Filtrer les articles..." 
                    style={{ width: '100%', height: '56px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '0 1.5rem 0 3.5rem', color: 'white', fontSize: '1rem', fontWeight: 700, outline: 'none', transition: 'all 0.3s' }}
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               
               <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                 {categories.map(cat => (
                   <button 
                     key={cat} 
                     onClick={() => setActiveCategory(cat)}
                     style={{ 
                       padding: '0.75rem 1.5rem', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s',
                       background: activeCategory === cat ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'rgba(255,255,255,0.03)',
                       border: '1px solid rgba(255,255,255,0.08)',
                       color: activeCategory === cat ? 'white' : '#94a3b8',
                       textTransform: 'uppercase',
                       letterSpacing: '0.05em'
                     }}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2.5rem' }}>
              {filteredPosts.map((post) => (
                <Link 
                  key={post.id} 
                  to={`/blog/${post.slug}`} 
                  className="blog-card-elite" 
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', borderRadius: '40px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)' }}
                >
                  <div style={{ height: '280px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <img src={post.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80'} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s' }} />
                    <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '0.5rem 1.25rem', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 950, color: 'white', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                       {post.category}
                    </div>
                  </div>

                  <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', opacity: 0.5, fontSize: '0.8rem', fontWeight: 800 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={14} /> {new Date(post.created_at).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={14} /> {post.author || 'Admin'}
                       </div>
                    </div>
                    
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '1.25rem', lineHeight: 1.2, letterSpacing: '-0.02em', color: 'white' }} className="title-glow">
                      {post.title}
                    </h3>
                    
                    <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2.5rem', fontWeight: 500, flex: 1 }}>
                      {post.excerpt}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 950, fontSize: '0.85rem', color: '#06b6d4', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                       LIRE L'INTELLIGENCE <ArrowRight size={18} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '10rem 0' }}>
                 <TrendingUp size={48} className="text-slate-800 mx-auto mb-6" />
                 <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Aucun article trouvé</h3>
                 <p style={{ color: '#64748b', marginTop: '1rem' }}>Essayez d'autres mots-clés ou catégories.</p>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        .search-input:focus { border-color: rgba(6, 182, 212, 0.5) !important; background: rgba(255,255,255,0.04) !important; }
        .blog-card-elite:hover { transform: translateY(-15px); border-color: rgba(6, 182, 212, 0.4) !important; background: rgba(255,255,255,0.03) !important; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.7); }
        .blog-card-elite:hover img { transform: scale(1.1); }
        .blog-card-elite:hover .title-glow { color: #06b6d4 !important; }
      `}</style>
    </div>
  );
};
