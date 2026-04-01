import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, ArrowRight } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav style={{ 
      padding: '1.25rem 2rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      position: 'sticky', 
      top: 0, 
      background: 'rgba(2, 6, 23, 0.85)', 
      backdropFilter: 'blur(16px)',
      zIndex: 1000,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ padding: '0.2rem', flexShrink: 0 }}>
            <img src="/favicon.png" alt="Logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: 950, letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GomboSwiftCI</span>
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '2rem', marginRight: '2rem' }} className="nav-links mobile-hide">
          <Link to="/#features" className="premium-link">Produit</Link>
          <Link to="/#pricing" className="premium-link">Tarifs</Link>
          <Link to="/blog" className="premium-link" style={{ textDecoration: 'none', color: 'inherit' }}>Blog</Link>
          <Link to="/#faq" className="premium-link">FAQ</Link>
        </div>
        <Link to="/login" style={{ textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }} className="mobile-hide hover-glow">Connexion</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/register" className="btn-premium">Essai Gratuit</Link>
          <button 
            className="desktop-hide" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}
          >
            {isMenuOpen ? <ArrowRight style={{ transform: 'rotate(-90deg)' }} /> : <Layout size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          background: '#020617', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          zIndex: 999,
          animation: 'fadeIn 0.3s ease'
        }}>
          <Link to="/#features" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>Produit</Link>
          <Link to="/#pricing" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>Tarifs</Link>
          <Link to="/blog" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>Blog</Link>
          <Link to="/#faq" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>FAQ</Link>
          <Link to="/login" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>Connexion</Link>
        </div>
      )}
    </nav>
  );
};
