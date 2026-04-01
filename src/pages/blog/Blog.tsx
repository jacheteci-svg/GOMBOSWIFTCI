import React, { useState } from 'react';
import { BLOG_POSTS } from './blogData';
import { ArrowRight, Calendar, User, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Blog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...new Set(BLOG_POSTS.map(p => p.category))];
  
  const filteredPosts = BLOG_POSTS.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      {/* Header SEO Header */}
      <div style={{ padding: '8rem 2rem 5rem', textAlign: 'center', background: 'radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.6rem 1.25rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', marginBottom: '2rem', letterSpacing: '0.05em' }}>
           📚 LOGISTIQUE INSIGHTS & STRATÉGIES
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(to bottom, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
           Maîtrisez la Logistique<br/>E-commerce en Afrique
        </h1>
        <p style={{ maxWidth: '650px', margin: '0 auto', fontSize: '1.25rem', color: '#94a3b8', lineHeight: 1.6 }}>
           Conseils d'experts, innovations IA et études de cas pour faire passer votre business logistique au niveau supérieur.
        </p>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 8rem' }}>
        {/* Search & Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem', opacity: 1, animation: 'fadeInUp 0.8s ease' }}>
           <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
              <Search size={22} color="#6366f1" style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
              <input 
                type="text" 
                placeholder="Rechercher un sujet (IA, Stock, Livraison...)" 
                style={{ width: '100%', height: '64px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '0 1.5rem 0 4rem', color: 'white', fontSize: '1.1rem', fontWeight: 600 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
             {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)}
                 style={{ 
                   padding: '0.7rem 1.5rem', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                   background: activeCategory === cat ? '#6366f1' : 'rgba(255,255,255,0.03)',
                   border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.06)',
                   color: activeCategory === cat ? 'white' : '#94a3b8'
                 }}
               >
                 {cat.toUpperCase()}
               </button>
             ))}
           </div>
        </div>

        {/* Blog Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {filteredPosts.map((post) => (
            <Link 
              key={post.id} 
              to={`/blog/${post.slug}`} 
              className="blog-card" 
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', borderRadius: '28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', transition: 'all 0.4s ease' }}
            >
              <div style={{ height: '260px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }} />
                <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900, color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)' }}>
                   {post.category}
                </div>
              </div>

              <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', opacity: 0.6 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      <Calendar size={14} /> {new Date(post.date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                      <User size={14} /> {post.author}
                   </div>
                </div>
                
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {post.title}
                </h3>
                
                <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem', fontWeight: 500, flex: 1 }}>
                  {post.excerpt}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 950, fontSize: '0.95rem', color: '#6366f1', letterSpacing: '0.02em' }}>
                   LIRE L'ARTICLE COMPLET <ArrowRight size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .blog-card:hover { transform: translateY(-12px); border-color: rgba(99,102,241,0.4) !important; background: rgba(255,255,255,0.05) !important; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5); }
        .blog-card:hover img { transform: scale(1.1); }
      `}</style>
    </div>
  );
};
