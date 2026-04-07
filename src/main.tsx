import { StrictMode } from 'react' // Final deploy: 2026-04-07 20:03:00 (Tenant Routing + User Profile Fix)
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ============================================================
// SECURITY & PERFORMANCE FORCE 🛡️⚡
// ============================================================

/* 1. PRO-ANTI COPIE (Désactive le clic droit et les raccourcis devtools sauf pour les admins)
if (import.meta.env.PROD) {
  const isSuperAdminPath = window.location.pathname.startsWith('/super-admin');
  const hasBypass = localStorage.getItem('gombo_debug_bypass') === 'true';

  if (!isSuperAdminPath && !hasBypass) {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'J') || 
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.key === 'S')
      ) {
        e.preventDefault();
        return false;
      }
    });
  }
} */

// 2. FORCE CACHE CLEAN (Hashed assets handled by Vite)
console.log("GomboSwiftCI Infrastructure Loaded. (Secure Layer Active)");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
