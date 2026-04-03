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

  const fetchSaasData = useCallback(async () => {
    const hostname = window.location.hostname;
    const pathParts = location.pathname.split('/').filter(Boolean);
    const urlSlug = pathParts[0];

    let targetSlug: string | null = null;
    const isSpecialPath = ['super-admin', 'platform', 'login', 'register'].includes(urlSlug || '');

    if (!isSpecialPath && urlSlug && urlSlug !== 'nexus') {
      targetSlug = urlSlug;
    } else {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const sub = parts[0];
        const isDomainPart = ['gomboswiftci', 'localhost', 'www', 'vercel', 'app'].includes(sub.toLowerCase());
        if (!isDomainPart) {
          targetSlug = sub;
        }
      }
    }

    if (urlSlug === 'nexus') targetSlug = 'nexus';

    if (!currentUser && !targetSlug) {
      setTenant(null);
      setSubscription(null);
      setPlanConfig(null);
      setLoading(false);
      return;
    }

    setLoading(true);

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
  }, [location.pathname, currentUser?.id, currentUser?.role, currentUser?.tenant_id]);

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
    setLoading(true);
    await fetchSaasData();
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
      }}
    >
      {children}
    </SaasContext.Provider>
  );
};
