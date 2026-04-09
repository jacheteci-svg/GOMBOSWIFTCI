import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { LandingNavbar } from '../../components/layout/LandingNavbar';
import { 
  ArrowRight, Calendar, User, Search, 
  Loader2, Sparkles, TrendingUp, BookOpen, 
  ChevronRight, ArrowUpRight, Zap, Target
} from 'lucide-react';
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
        setTimeout(() => setLoading(false), 800);
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
    <div style={{ background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'Outfit, sans-serif', overflowX: 'hidden' }}>
      <LandingNavbar />
      
      {/* Background Decor */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-100px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {loading ? (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          <div className="loader-container">
            <Loader2 size={64} className="animate-spin text-cyan-500" />
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.2em', color: '#94a3b8', textTransform: 'uppercase' }}>Synchronisation de l&apos;Intelligence...</p>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Hero Section - Ultra Premium */}
          <div style={{ padding: '12rem 2rem 8rem', textAlign: 'center', position: 'relative' }}>
            <div className="fade-in-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.8rem 2rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 950, color: '#22d3ee', marginBottom: '3rem', letterSpacing: '0.15em', textTransform: 'uppercase', backdropFilter: 'blur(10px)' }}>
               <Sparkles size={16} /> L&apos;Observatoire GomboSwift
            </div>
            
            <h1 className="scale-in" style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.9, marginBottom: '2.5rem', background: 'linear-gradient(to bottom, #ffffff 30%, #475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
               Stratégies &<br/><span style={{ color: '#06b6d4' }}>Logistique.</span>
            </h1>
            <p className="fade-in-up-delay" style={{ maxWidth: '850px', margin: '0 auto', fontSize: '1.4rem', color: '#94a3b8', lineHeight: 1.6, fontWeight: 500, letterSpacing: '-0.01em' }}>
               Décryptez les tendances du e-commerce africain, optimisez vos flux logistiques et propulsez votre rentabilité grâce à nos analyses d&apos;experts.
            </p>

            <div style={{ position: 'absolute', top: '15rem', left: '10%', opacity: 0.1 }} className="floating">
               <Zap size={120} />
            </div>
          </div>

          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 2.5rem 10rem' }}>
            {/* Contextual Action Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginBottom: '6rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', backdropFilter: 'blur(20px)' }}>
               <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                 {categories.map(cat => (
                   <button 
                     key={cat} 
                     onClick={() => setActiveCategory(cat)}
                     style={{ 
                       padding: '0.8rem 1.75rem', borderRadius: '18px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                       background: activeCategory === cat ? 'white' : 'transparent',
                       border: '1px solid',
                       borderColor: activeCategory === cat ? 'white' : 'rgba(255,255,255,0.1)',
                       color: activeCategory === cat ? '#020617' : '#64748b',
                       textTransform: 'uppercase',
                       letterSpacing: '0.05em'
                     }}
                   >
                     {cat}
                   </button>
                 ))}
               </div>

               <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                  <Search size={18} className={searchTerm ? 'text-cyan-400' : 'text-slate-600'} style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', transition: 'all 0.3s' }} />
                  <input 
                    type="text" 
                    placeholder="Chercher une thématique..." 
                    style={{ width: '100%', height: '54px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '0 3.5rem 0 1.5rem', color: 'white', fontSize: '0.95rem', fontWeight: 700, outline: 'none', transition: 'all 0.3s' }}
                    className="premium-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            {/* Grid Architecture */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '3rem' }}>
              {filteredPosts.map((post, i) => (
                <Link 
                  key={post.id} 
                  to={`/blog/${post.slug}`} 
                  className="card-reveal"
                  style={{ 
                    textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', borderRadius: '48px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    animationDelay: `${i * 0.1}s`
                  }}
                >
                  <div style={{ height: '320px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, #020617 100%)', zIndex: 1, opacity: 0.8 }} />
                    <img src={post.image || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80'} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 1.2s' }} className="blog-img" />
                    
                    <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 2, background: 'white', padding: '0.6rem 1.4rem', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 950, color: '#020617', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                       {post.category}
                    </div>

                    <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 2 }}>
                       <div className="arrow-circle" style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s' }}>
                          <ArrowUpRight size={20} className="text-white" />
                       </div>
                    </div>
                  </div>

                  <div style={{ padding: '3rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <Calendar size={14} className="text-cyan-500" /> {new Date(post.created_at).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <User size={14} className="text-violet-500" /> {post.author || 'GomboSwift'}
                       </div>
                    </div>
                    
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 950, marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white' }} className="title-target">
                      {post.title}
                    </h3>
                    
                    <p style={{ color: '#94a3b8', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '3rem', fontWeight: 500, flex: 1 }}>
                      {post.excerpt}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                       <div className="btn-insight" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 950, fontSize: '0.85rem', color: '#06b6d4', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          DÉCOUVRIR L&apos;INSIGHT <ChevronRight size={18} />
                       </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '12rem 0' }} className="fade-in">
                 <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3rem border: 1px solid rgba(255,255,255,0.05)' }}>
                    <Target size={40} className="text-slate-700" />
                 </div>
                 <h3 style={{ fontSize: '2rem', fontWeight: 950, color: 'white', marginBottom: '1rem' }}>Sujet non répertorié</h3>
                 <p style={{ color: '#64748b', fontSize: '1.2rem' }}>Notre moteur n&apos;a trouvé aucun article correspondant à votre recherche.</p>
                 <button 
                  onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
                  style={{ marginTop: '3rem', background: 'white', color: '#020617', padding: '1rem 2.5rem', borderRadius: '20px', fontWeight: 950, fontSize: '0.9rem', cursor: 'pointer', border: 'none' }}
                 >
                   RÉINITIALISER LES FILTRES
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        
        .premium-input:focus { border-color: rgba(6, 182, 212, 0.4) !important; background: rgba(255,255,255,0.06) !important; box-shadow: 0 0 30px rgba(6, 182, 212, 0.1); }
        
        .card-reveal { animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .fade-in-up { animation: fadeInUp 0.8s ease both; }
        .fade-in-up-delay { animation: fadeInUp 0.8s ease 0.2s both; }
        .scale-in { animation: scaleIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .floating { animation: float 6s ease-in-out infinite; }
        
        .card-reveal:hover { 
          transform: translateY(-20px); 
          border-color: rgba(6, 182, 212, 0.3) !important; 
          background: rgba(255,255,255,0.04) !important; 
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); 
        }
        .card-reveal:hover .blog-img { transform: scale(1.08); }
        .card-reveal:hover .title-target { color: #06b6d4 !important; }
        .card-reveal:hover .arrow-circle { background: #06b6d4 !important; border-color: #06b6d4 !important; transform: rotate(15deg) scale(1.2); }
        .card-reveal:hover .btn-insight { color: white !important; }
      `}</style>
    </div>
  );
};

