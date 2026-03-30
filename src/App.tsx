import React, { Suspense } from 'react';
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


// --- Direct Imports to prevent Lazy Loading crashes on Vercel Delta ---
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
import { 
  FeaturesPage, 
  CostCalculatorPage, 
  ApiDocsPage, 
  SystemStatusPage, 
  HelpCenterPage, 
  ContactSalesPage, 
  ReportBugPage, 
  PrivacyPage, 
  TermsPage, 
  GdprPage 
} from './pages/StaticPages';
import { DemoPage } from './pages/DemoPage';

const PageLoader = () => {
  console.log("Routing to:", window.location.pathname);
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
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#fef2f2', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#991b1b' }}>Une erreur critique est survenue</h1>
          <p>L'application GomboSwiftCI a rencontré un problème inattendu au rendu.</p>
          <pre style={{ background: '#fee2e2', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxWidth: '90%', fontSize: '0.8rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Recharger l'application
          </button>
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

      {/* Main App with Protected Layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<ProtectedRoute requiredPermission="DASHBOARD"><Dashboard /></ProtectedRoute>} />
        <Route path="produits" element={<ProtectedRoute requiredPermission="PRODUITS"><Produits /></ProtectedRoute>} />
        <Route path="commandes" element={<ProtectedRoute requiredPermission="COMMANDES"><Commandes /></ProtectedRoute>} />
        <Route path="centre-appel" element={<ProtectedRoute requiredPermission="CENTRE_APPEL"><CentreAppel /></ProtectedRoute>} />
        <Route path="logistique" element={<ProtectedRoute requiredPermission="LOGISTIQUE"><Logistique /></ProtectedRoute>} />
        <Route path="livraison" element={<ProtectedRoute requiredPermission="LIVREUR"><Livraison /></ProtectedRoute>} />
        <Route path="caisse" element={<ProtectedRoute requiredPermission="CAISSE"><Caisse /></ProtectedRoute>} />
        <Route path="rapport-financier" element={<ProtectedRoute requiredPermission="FINANCE"><FinancialReport /></ProtectedRoute>} />
        <Route path="historique" element={<ProtectedRoute requiredPermission="HISTORIQUE"><Historique /></ProtectedRoute>} />
        <Route path="clients" element={<ProtectedRoute requiredPermission="CLIENTS"><Clients /></ProtectedRoute>} />
        <Route path="performance-staff" element={<ProtectedRoute requiredPermission="GESTION_LIVREURS"><StaffPerformance /></ProtectedRoute>} />
        <Route path="net-profit" element={<ProtectedRoute requiredPermission="ADMIN"><NetProfit /></ProtectedRoute>} />
        <Route path="admin/tresorerie" element={<ProtectedRoute requiredPermission="TRESORERIE"><AdminTresorerie /></ProtectedRoute>} />
        <Route path="audit-tresorerie" element={
          <ProtectedRoute requiredPermission="ADMIN">
            <SubscriptionGuard requiredPlan="PREMIUM">
              <AuditTresorerie />
            </SubscriptionGuard>
          </ProtectedRoute>
        } />
        <Route path="profil" element={<ProtectedRoute requiredPermission="PROFIL"><Profil /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute requiredPermission="ADMIN"><Admin /></ProtectedRoute>} />
        <Route path="super-admin" element={<ProtectedRoute requiredPermission="SUPER_ADMIN"><SuperAdmin /></ProtectedRoute>} />
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
