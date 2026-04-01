import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { BLOG_POSTS } from './blogData';
import { ArrowLeft, Clock, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';

export const BlogPostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 950 }}>Article introuvable</h1>
        <Link to="/blog" style={{ marginTop: '2rem', color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>Retour au blog</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', height: '60vh', width: '100%', overflow: 'hidden' }}>
        <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #020617 0%, transparent 100%)' }} />
        
        <div style={{ position: 'absolute', bottom: '10%', left: '0', right: '0', maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'inline-flex', background: '#6366f1', padding: '0.4rem 1.25rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '0.05em' }}>
            {post.category.toUpperCase()}
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 950, marginBottom: '2rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', opacity: 0.8, fontSize: '1rem', fontWeight: 600 }}>
             <span>{post.author}</span>
             <span style={{ height: '4px', width: '4px', borderRadius: '50%', background: '#94a3b8' }} />
             <span>{new Date(post.date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> 5 min de lecture</span>
          </div>
        </div>
      </div>

      <div className="blog-main-grid" style={{ maxWidth: '1000px', margin: '0 auto', gap: '4rem', padding: '5rem 2rem 8rem' }}>
        <div className="blog-content" style={{ fontSize: '1.2rem', lineHeight: 1.8, color: '#e2e8f0', fontWeight: 500 }}>
           <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: '#6366f1', textDecoration: 'none', fontWeight: 800, marginBottom: '4rem', fontSize: '1rem' }}>
              <ArrowLeft size={18} /> RETOUR AU BLOG
           </Link>
           
           <div dangerouslySetInnerHTML={{ __html: post.content }} />
           
           <div style={{ marginTop: '5rem', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>Cet article vous a été utile ?</h3>
              <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Partagez vos nouvelles connaissances logistiques avec votre réseau.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                 {[
                   { icon: <Facebook size={24} />, name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                   { icon: <Twitter size={24} />, name: 'Twitter', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}` },
                   { icon: <Linkedin size={24} />, name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` }
                 ].map((social, idx) => (
                   <a 
                     key={idx}
                     href={social.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     title={`Partager sur ${social.name}`}
                     style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', textDecoration: 'none' }}
                     onMouseOver={e => (e.currentTarget.style.background = '#6366f1')}
                     onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                   >
                     {social.icon}
                   </a>
                 ))}
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(window.location.href);
                     alert('Lien copié dans le presse-papier !');
                   }}
                   title="Copier le lien"
                   style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                 >
                   <Share2 size={24} />
                 </button>
              </div>
           </div>
        </div>

        {/* Sidebar / Reading tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           {/* Placeholder for scroll indicator or other tools */}
        </div>
      </div>

      <style>{`
        .blog-content h2 { font-size: 2.2rem; font-weight: 950; margin: 3.5rem 0 1.5rem; color: white; letter-spacing: -0.03em; }
        .blog-content h3 { font-size: 1.6rem; font-weight: 900; margin: 2.5rem 0 1.25rem; color: #818cf8; }
        .blog-content p { margin-bottom: 2rem; opacity: 0.9; }
        .blog-main-grid { display: grid; grid-template-columns: minmax(0, 1fr) 100px; }
        @media (max-width: 768px) {
          .blog-main-grid { grid-template-columns: 1fr; padding-top: 2rem !important; }
          .blog-content h2 { font-size: 1.8rem; margin: 2rem 0 1rem; }
          .blog-content p { font-size: 1.1rem; line-height: 1.65; }
        }
      `}</style>
    </div>
  );
};
