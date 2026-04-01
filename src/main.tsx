import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ============================================================
// SECURITY & PERFORMANCE FORCE 🛡️⚡
// ============================================================

// 1. PRO-ANTI COPIE (Désactive le clic droit et les raccourcis devtools)
if (import.meta.env.PROD) {
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

// 2. FORCE CACHE CLEAN (Hashed assets handled by Vite)
console.log("GomboSwiftCI Infrastructure Loaded. (Secure Layer Active)");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
