import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, X } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isBlog = location.pathname.startsWith('/blog');

  const navLinks = [
    { name: 'Produit', path: isBlog ? '/#features' : '#features', isAnchor: !isBlog },
    { name: 'Tarifs', path: isBlog ? '/#pricing' : '#pricing', isAnchor: !isBlog },
    { name: 'Blog', path: '/blog', isAnchor: false },
    { name: 'FAQ', path: isBlog ? '/#faq' : '#faq', isAnchor: !isBlog },
  ];

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
            <span style={{ 
              fontSize: '1.6rem', 
              fontWeight: 950, 
              letterSpacing: '-0.04em', 
              fontFamily: 'Outfit, sans-serif',
              background: 'linear-gradient(to right, #fff, #94a3b8)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>GomboSwiftCI</span>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '2rem', marginRight: '1rem' }} className="mobile-hide">
          {navLinks.map((link) => (
            link.isAnchor && !isBlog ? (
              <a key={link.name} href={link.path} className="premium-link">{link.name}</a>
            ) : (
              <Link key={link.name} to={link.path} className="premium-link">{link.name}</Link>
            )
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/login" className="mobile-hide hover-glow" style={{ textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Connexion</Link>
          <Link to="/register" className="btn-premium">Essai Gratuit</Link>
          
          <button 
            className="desktop-hide" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '0.6rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isMenuOpen ? <X size={24} /> : <Layout size={24} />}
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
          animation: 'fadeIn 0.3s ease',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          {navLinks.map((link) => (
            link.isAnchor && !isBlog ? (
              <a key={link.name} href={link.path} onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>{link.name}</a>
            ) : (
              <Link key={link.name} to={link.path} onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>{link.name}</Link>
            )
          ))}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
          <Link to="/login" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>Connexion</Link>
        </div>
      )}
    </nav>
  );
};

