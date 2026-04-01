import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { SaasProvider } from './saas/SaasProvider';
import { Pricing } from './saas/Pricing';
import { SubscriptionGuard } from './saas/SubscriptionGuard';
import { LandingPage } from './saas/LandingPage';
import { SuperAdmin } from './saas/SuperAdmin';
import { RegisterTenant } from './saas/RegisterTenant';
import { PlatformPortal } from './saas/PlatformPortal';

// --- Core Imports (Snappy) ---
import { Dashboard } from './pages/Dashboard';
import { Produits } from './pages/Produits';
import { Commandes } from './pages/Commandes';
import { CentreAppel } from './pages/CentreAppel';
import { Logistique } from './pages/Logistique';
import { Livraison } from './pages/Livraison';
import { Historique } from './pages/Historique';
import { Caisse } from './pages/Caisse';
import { Clients } from './pages/Clients';
import { Admin } from './pages/Admin';
import { Profil } from './pages/Profil';
import { Login } from './pages/Login';
import { FinancialReport } from './pages/FinancialReport';
import { Home } from './pages/Home';
import { StaffPerformance } from './pages/StaffPerformance';
import { NetProfit } from './pages/NetProfit';
import { AdminTresorerie } from './pages/AdminTresorerie';
import { AuditTresorerie } from './pages/AuditTresorerie';
import { SubscriptionCallback } from './pages/SubscriptionCallback';

// --- Lazy Loaded Pages ---
const FeaturesPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.FeaturesPage })));
const CostCalculatorPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.CostCalculatorPage })));
const ApiDocsPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ApiDocsPage })));
const SystemStatusPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.SystemStatusPage })));
const HelpCenterPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.HelpCenterPage })));
const ContactSalesPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ContactSalesPage })));
const ReportBugPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ReportBugPage })));
const PrivacyPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.TermsPage })));
const GdprPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.GdprPage })));
const DemoPage = lazy(() => import('./pages/DemoPage').then(m => ({ default: m.DemoPage })));
const Blog = lazy(() => import('./pages/blog/Blog').then(m => ({ default: m.Blog })));
const BlogPostDetail = lazy(() => import('./pages/blog/BlogPostDetail').then(m => ({ default: m.BlogPostDetail })));

const PageLoader = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', padding: '5rem' }}>
      <div className="spinner"></div>
    </div>
  );
};

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    // Si c'est un problème de chargement de chunk (fréquent lors d'un déploiement Vercel), on tente de recharger.
    if (error && (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk'))) {
      window.location.reload();
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '3rem', borderRadius: '32px', border: '1px solid rgba(239, 68, 68, 0.2)', maxWidth: '600px' }}>
            <h1 style={{ color: '#ef4444', fontWeight: 900, fontSize: '2rem', marginBottom: '1rem' }}>Oups ! Une erreur est survenue</h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Le système Nexus a rencontré une anomalie au rendu. Cela peut arriver lors d'une mise à jour du logiciel.</p>
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '16px', overflow: 'auto', fontSize: '0.75rem', textAlign: 'left', border: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5' }}>
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              style={{ marginTop: '2rem', padding: '1rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '2rem auto 0' }}
            >
              🔄 ACTUALISER ET RÉPARER
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, requiredPermission }: { children: React.ReactNode, requiredPermission?: string }) => {
  const { currentUser, hasPermission } = useAuth();
  
  if (!currentUser) {
    if (window.location.pathname === '/') return <LandingPage />;
    if (window.location.pathname.startsWith('/super-admin')) return <Navigate to="/platform/login" replace />;
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission) {
    if (requiredPermission === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return <Navigate to="/" replace />;
    }
    
    if (requiredPermission !== 'SUPER_ADMIN' && !hasPermission(requiredPermission)) {
      console.warn(`Access denied for ${requiredPermission}`);
      return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* 1. Debug/Diagnostic Route */}
      <Route path="/test" element={<div>Test Route OK. Path: {window.location.pathname}</div>} />

      {/* 2. Platform Backend Routes (Prioritized) */}
      <Route path="/platform/login" element={<PlatformPortal mode="login" />} />
      <Route path="/platform/setup" element={<PlatformPortal mode="setup" />} />
      
      {/* 3. Explicit Landing Page (Matches ONLY /) */}
      <Route path="/landing" element={<LandingPage />} />
      
      {/* 4. Public Core Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterTenant />} />
      <Route path="/saas/pricing" element={<Pricing />} />

      {/* Static Info Pages */}
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/cost-calculator" element={<CostCalculatorPage />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />
      <Route path="/status" element={<SystemStatusPage />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/contact-sales" element={<ContactSalesPage />} />
      <Route path="/report-bug" element={<ReportBugPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/gdpr" element={<GdprPage />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPostDetail />} />
      <Route path="/subscription-done" element={<SubscriptionCallback />} />
      <Route path="/subscription-cancel" element={<Navigate to="/" replace />} />

      {/* ROOT REDIRECT */}
      <Route path="/" element={
        currentUser ? (
          currentUser.role === 'SUPER_ADMIN' ? (
            <Navigate to="/super-admin/overview" replace />
          ) : (
            <Navigate to={`/${currentUser.tenant_slug || 'nexus'}`} replace />
          )
        ) : (
          <LandingPage />
        )
      } />

      {/* 5. SUPER ADMIN - Specialized Path */}
      <Route path="/super-admin" element={
        <ProtectedRoute requiredPermission="SUPER_ADMIN">
          <Layout /> 
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="*" element={<SuperAdmin />} />
      </Route>

      {/* 6. TENANT PAGES - Dynamic Slug Path */}
      <Route path="/:tenantSlug" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="home" element={<Home />} />
        <Route path="dashboard" element={<ProtectedRoute requiredPermission="DASHBOARD"><Dashboard /></ProtectedRoute>} />
        <Route path="produits" element={<ProtectedRoute requiredPermission="PRODUITS"><Produits /></ProtectedRoute>} />
        <Route path="commandes" element={<ProtectedRoute requiredPermission="COMMANDES"><Commandes /></ProtectedRoute>} />
        <Route path="centre-appel" element={<ProtectedRoute requiredPermission="CENTRE_APPEL"><CentreAppel /></ProtectedRoute>} />
        <Route path="logistique" element={<ProtectedRoute requiredPermission="LOGISTIQUE"><Logistique /></ProtectedRoute>} />
        <Route path="livraison" element={<ProtectedRoute requiredPermission="LIVREUR"><Livraison /></ProtectedRoute>} />
        <Route path="caisse" element={
          <ProtectedRoute requiredPermission="CAISSE">
            <SubscriptionGuard requiredModule="module_caisse" moduleNameFriendly="Caisse & Retours">
              <Caisse />
            </SubscriptionGuard>
          </ProtectedRoute>
        } />
        <Route path="rapport-financier" element={<ProtectedRoute requiredPermission="FINANCE"><FinancialReport /></ProtectedRoute>} />
        <Route path="historique" element={<ProtectedRoute requiredPermission="HISTORIQUE"><Historique /></ProtectedRoute>} />
        <Route path="clients" element={<ProtectedRoute requiredPermission="CLIENTS"><Clients /></ProtectedRoute>} />
        <Route path="performance-staff" element={<ProtectedRoute requiredPermission="GESTION_LIVREURS"><StaffPerformance /></ProtectedRoute>} />
        <Route path="net-profit" element={<ProtectedRoute requiredPermission="ADMIN"><NetProfit /></ProtectedRoute>} />
        <Route path="admin/tresorerie" element={<ProtectedRoute requiredPermission="TRESORERIE"><AdminTresorerie /></ProtectedRoute>} />
        <Route path="audit-tresorerie" element={
          <ProtectedRoute requiredPermission="ADMIN">
            <SubscriptionGuard requiredModule="module_audit" moduleNameFriendly="Audit Expert">
              <AuditTresorerie />
            </SubscriptionGuard>
          </ProtectedRoute>
        } />
        <Route path="profil" element={<ProtectedRoute requiredPermission="PROFIL"><Profil /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute requiredPermission="ADMIN"><Admin /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SaasProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </SaasProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
