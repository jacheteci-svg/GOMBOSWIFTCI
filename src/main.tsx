import { StrictMode } from 'react' // Final deploy: 2026-04-07 20:03:00 (Tenant Routing + User Profile Fix)
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ============================================================
// GHOST SESSION KILLER 🧹👻
// ============================================================
// If we receive a 401 on refresh during startup, we're stuck in a "ghost session".
// We need to clear only the relevant bits to allow a clean re-login.
(function() {
  const lastRefreshError = localStorage.getItem('insforge_auth_error_timestamp');
  const now = Date.now();
  
  // If the last error was within 2 seconds of a page load, we might be in a loop
  // This is a safety mechanism to prevent 401 refresh loops in production.
  if (lastRefreshError && (now - parseInt(lastRefreshError) < 5000)) {
     console.warn('Ghost session detected. Clearing auth storage for recovery.');
     localStorage.removeItem('insforge.auth.token');
     localStorage.removeItem('insforge.auth.refreshToken');
     localStorage.removeItem('insforge_auth_error_timestamp');
  }
})();

// 1. PRO-ANTI COPIE (Désactive le clic droit et les raccourcis devtools sauf pour les admins)
/*
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
} 
*/

// 2. FORCE CACHE CLEAN (Hashed assets handled by Vite)
console.log("GomboSwiftCI Infrastructure Loaded. (Secure Layer Active)");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
