import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { insforge } from '../../lib/insforge';
import { LandingNavbar } from '../../components/layout/LandingNavbar';
import { ArrowLeft, Clock, Share2, Facebook, Twitter, Linkedin, Loader2, ArrowRight, Sparkles, User } from 'lucide-react';

export const BlogPostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data, error } = await insforge.database
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        
        if (error) throw error;
        setPost(data);
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
        <Loader2 size={48} className="animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white', fontFamily: 'Outfit' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 950 }}>Intelligence introuvable</h1>
        <Link to="/blog" style={{ marginTop: '2rem', color: '#06b6d4', textDecoration: 'none', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Retour au centre de ressources</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
      <LandingNavbar />
      
      {/* Hero Section */}
      <div style={{ position: 'relative', height: '70vh', width: '100%', overflow: 'hidden' }}>
        <img src={post.image || 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80'} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #020617 0%, rgba(2, 6, 23, 0.4) 100%)' }} />
        
        <div style={{ position: 'absolute', bottom: '15%', left: '0', right: '0', maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(6, 182, 212, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.6rem 1.5rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 950, marginBottom: '2.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22d3ee' }}>
            {post.category}
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, marginBottom: '2.5rem', lineHeight: 1.1, letterSpacing: '-0.03em', background: 'linear-gradient(to bottom, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5rem', opacity: 0.7, fontSize: '1rem', fontWeight: 800 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <User size={18} className="text-cyan-500" /> {post.author || 'Gombo Intelligence'}
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={18} className="text-cyan-500" /> {new Date(post.created_at).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
             </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem 10rem', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
           <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#06b6d4', textDecoration: 'none', fontWeight: 900, marginBottom: '5rem', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', width: 'fit-content', padding: '0.75rem 1.5rem', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '15px' }}>
              <ArrowLeft size={18} /> RETOUR AUX ARTICLES
           </Link>
           
           <article className="blog-content-rich" style={{ fontSize: '1.25rem', lineHeight: 1.8, color: '#cbd5e1', fontWeight: 500 }}>
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
           </article>

           {/* Call To Actions Elite */}
           <div style={{ marginTop: '8rem', padding: '5rem 4rem', background: 'linear-gradient(145deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', borderRadius: '48px', border: '1px solid rgba(6, 182, 212, 0.15)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '40%', height: '80%', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
              
              <Sparkles size={48} className="text-cyan-400 mx-auto mb-6 opacity-40" />
              <h2 style={{ fontSize: '3rem', fontWeight: 950, marginBottom: '1.5rem', color: 'white', letterSpacing: '-0.02em' }}>Passez à la vitesse supérieure.</h2>
              <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '4rem', maxWidth: '750px', margin: '0 auto 4rem', lineHeight: 1.6 }}>
                Prêt à transformer votre entreprise avec le système logistique le plus avancé de Côte d'Ivoire ? Activez votre infrastructure GomboSwift maintenant.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                 <Link to="/register" style={{ padding: '1.5rem 3rem', borderRadius: '20px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', textDecoration: 'none', fontWeight: 950, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 20px 50px -10px rgba(6, 182, 212, 0.5)' }} className="cta-pulse">
                    ESSAYER GRATUITEMENT <ArrowRight size={22} />
                 </Link>
                 <Link to="/#pricing" style={{ padding: '1.5rem 3rem', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', color: 'white', textDecoration: 'none', fontWeight: 950, fontSize: '1.1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    VOIR LES FORFAITS
                 </Link>
              </div>
           </div>
           
           <div style={{ marginTop: '8rem', padding: '4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '2.5rem', letterSpacing: '-0.01em' }}>Recommander cet article</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                 {[
                   { icon: <Facebook size={22} />, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                   { icon: <Twitter size={22} />, url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}` },
                   { icon: <Linkedin size={22} />, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` }
                 ].map((social, idx) => (
                   <a 
                     key={idx}
                     href={social.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.4s', textDecoration: 'none' }}
                     className="social-btn"
                   >
                     {social.icon}
                   </a>
                 ))}
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(window.location.href);
                     alert('Lien copié !');
                   }}
                   style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                 >
                   <Share2 size={22} />
                 </button>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        .blog-content-rich h2 { font-size: 2.5rem; font-weight: 950; margin: 4.5rem 0 2rem; color: white; letter-spacing: -0.04em; line-height: 1.1; }
        .blog-content-rich h3 { font-size: 1.75rem; font-weight: 900; margin: 3rem 0 1.5rem; color: #06b6d4; letter-spacing: -0.02em; }
        .blog-content-rich p { margin-bottom: 2.5rem; }
        .blog-content-rich ul, .blog-content-rich ol { margin-bottom: 3rem; padding-left: 1.5rem; }
        .blog-content-rich li { margin-bottom: 1rem; }
        .blog-content-rich blockquote { border-left: 4px solid #06b6d4; padding: 1.5rem 2rem; background: rgba(6, 182, 212, 0.05); border-radius: 0 20px 20px 0; font-style: italic; margin: 3rem 0; color: white; }
        .social-btn:hover { background: #06b6d4 !important; border-color: #06b6d4 !important; transform: translateY(-5px); box-shadow: 0 10px 20px rgba(6, 182, 212, 0.3); }
        .cta-pulse:hover { transform: scale(1.05); }
        @media (max-width: 768px) {
          .blog-content-rich { fontSize: '1.15rem'; }
          .blog-content-rich h2 { fontSize: '2rem'; }
        }
      `}</style>
    </div>
  );
};
