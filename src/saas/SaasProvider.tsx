import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tenant, Subscription, Plan, SaasPlanDb } from '../types';
import { insforge } from '../lib/insforge';
import { withTimeout } from '../lib/asyncTimeout';

interface SaasContextType {
  tenant: Tenant | null;
  subscription: Subscription | null;
  planConfig: SaasPlanDb | null;
  loading: boolean;
  isPlanAtLeast: (plan: Plan) => boolean;
  hasModule: (moduleName: keyof SaasPlanDb) => boolean;
  refreshSaasData: () => Promise<void>;
  isActive: boolean;
  isSubdomain: boolean;
}

const SaasContext = createContext<SaasContextType>({
  tenant: null,
  subscription: null,
  planConfig: null,
  loading: true,
  isPlanAtLeast: () => false,
  hasModule: () => false,
  refreshSaasData: async () => {},
  isActive: true,
  isSubdomain: false,
});

export const useSaas = () => useContext(SaasContext);

const PLAN_HIERARCHY: Record<Plan, number> = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  ENTERPRISE: 3,
  CUSTOM: 4,
};

const API_TIMEOUT_MS = 28000;

export const SaasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [planConfig, setPlanConfig] = useState<SaasPlanDb | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubdomainState, setIsSubdomainState] = useState(false);

  const fetchSaasData = useCallback(async (opts?: { force?: boolean }) => {
    const force = opts?.force === true;
    let targetSlug: string | null = null;
    const pathParts = location.pathname.split('/').filter(Boolean);
    const urlSlug = pathParts[0];

    // 1. Detection par sous-domaine (Priorite #1 car plus stable)
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const sub = parts[0].toLowerCase();
      const reserved = ['gomboswiftci', 'localhost', 'www', 'vercel', 'app', 'next', 'vite', 'system'];
      if (!reserved.includes(sub)) {
        targetSlug = sub;
      }
    }

    // 2. Detection par URL Path (Rediriger vers sous-domaine en prod)
    if (!targetSlug && urlSlug && !['super-admin', 'platform', 'login', 'register', 'gombo', 'saas', 'demo', 'api', 'help', 'status', 'privacy', 'terms', 'features', 'blog'].includes(urlSlug)) {
       targetSlug = urlSlug;
       
       const isProd = hostname === 'gomboswiftci.app' || hostname === 'www.gomboswiftci.app';
       if (isProd && targetSlug) {
         window.location.href = `https://${targetSlug}.gomboswiftci.app${location.pathname.replace(`/${targetSlug}`, '') || '/'}`;
         return;
       }
    }

    if (urlSlug === 'gombo') targetSlug = 'gombo';
    
    const isSub = !!targetSlug && (hostname.split('.').length >= 2 && !['www', 'gomboswiftci', 'localhost', 'vercel', 'app', 'next', 'vite', 'system'].includes(hostname.split('.')[0].toLowerCase()));
    setIsSubdomainState(isSub);

    if (!currentUser && !targetSlug) {
      setTenant(null);
      setSubscription(null);
      setPlanConfig(null);
      setLoading(false);
      return;
    }

    /* Super-admin sur /super-admin sans tenant ciblé : pas de requête inutile à chaque navigation */
    if (urlSlug === 'super-admin' && currentUser?.role === 'SUPER_ADMIN' && !targetSlug && !force) {
      setTenant(null);
      setSubscription(null);
      setPlanConfig(null);
      setLoading(false);
      return;
    }

    const canReuseTenant =
      tenant &&
      currentUser &&
      (currentUser.role === 'SUPER_ADMIN' && targetSlug
        ? tenant.slug === targetSlug
        : Boolean(currentUser.tenant_id && tenant.id === currentUser.tenant_id));

    if (canReuseTenant && !force) {
      return;
    }

    const shouldShowBlockingLoader = !canReuseTenant || force;
    if (shouldShowBlockingLoader) {
      setLoading(true);
    }

    try {
      let tenantData = null;

      if (currentUser?.role === 'SUPER_ADMIN' && targetSlug) {
        const { data } = await withTimeout(
          insforge.database.from('tenants').select('*').eq('slug', targetSlug).single(),
          API_TIMEOUT_MS,
          'tenants (super-admin)'
        );
        tenantData = data;
      } else if (currentUser?.tenant_id) {
        const { data } = await withTimeout(
          insforge.database.from('tenants').select('*').eq('id', currentUser.tenant_id).single(),
          API_TIMEOUT_MS,
          'tenants'
        );
        tenantData = data;
      }

      if (tenantData) {
        setTenant(tenantData as Tenant);

        if (tenantData.plan) {
          const { data: planData } = await withTimeout(
            insforge.database.from('saas_plans').select('*').eq('id', tenantData.plan).single(),
            API_TIMEOUT_MS,
            'saas_plans'
          );
          if (planData) setPlanConfig(planData as SaasPlanDb);
        } else {
          setPlanConfig(null);
        }

        const { data: subData } = await withTimeout(
          insforge.database
            .from('subscriptions')
            .select('*')
            .eq('tenant_id', tenantData.id)
            .eq('status', 'active')
            .single(),
          API_TIMEOUT_MS,
          'subscriptions'
        );

        if (subData) {
          setSubscription(subData as Subscription);
        } else {
          setSubscription(null);
        }
      } else {
        setTenant(null);
        setSubscription(null);
        setPlanConfig(null);
      }
    } catch (error) {
      console.error('Error fetching SaaS data:', error);
      setTenant(null);
      setSubscription(null);
      setPlanConfig(null);
    } finally {
      setLoading(false);
    }
  }, [location.pathname, currentUser, tenant]);

  useEffect(() => {
    void fetchSaasData();
  }, [fetchSaasData]);

  const isPlanAtLeast = (requiredPlan: Plan) => {
    const currentPlan = (tenant?.plan || 'FREE') as Plan;
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
  };

  const hasModule = (moduleName: keyof SaasPlanDb) => {
    if (currentUser?.role === 'SUPER_ADMIN') return true;

    if (planConfig) {
      return !!planConfig[moduleName as keyof SaasPlanDb];
    }
    if (moduleName === 'module_caisse' || moduleName === 'module_audit' || moduleName === 'module_api') {
      const p = (tenant?.plan || 'FREE') as Plan;
      if (p === 'CUSTOM' || p === 'PREMIUM') return true;
      if (p === 'BASIC' && moduleName === 'module_caisse') return true;
      return false;
    }
    return false;
  };

  const refreshSaasData = async () => {
    await fetchSaasData({ force: true });
  };

  return (
    <SaasContext.Provider
      value={{
        tenant,
        subscription,
        planConfig,
        loading,
        isPlanAtLeast,
        hasModule,
        refreshSaasData,
        isActive: tenant?.actif ?? true,
        isSubdomain: isSubdomainState,
      }}
    >
      {children}
    </SaasContext.Provider>
  );
};
