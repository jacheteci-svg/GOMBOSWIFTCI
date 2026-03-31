import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tenant, Subscription, Plan, SaasPlanDb } from '../types';
import { insforge } from '../lib/insforge';

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
  'FREE': 0,
  'BASIC': 1,
  'PREMIUM': 2,
  'ENTERPRISE': 3,
  'CUSTOM': 4
};

export const SaasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [planConfig, setPlanConfig] = useState<SaasPlanDb | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSaasData = async () => {
    // Determine the target tenant slug from the URL if current user is admin OR if we're on a tenant route
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const urlSlug = pathParts[0]; 
    const isSpecialPath = ['super-admin', 'platform', 'login', 'register'].includes(urlSlug);
    const targetSlug = (!isSpecialPath && urlSlug && urlSlug !== 'nexus') ? urlSlug : (urlSlug === 'nexus' ? 'nexus' : null);

    // If no user and no slug, we can't do anything
    if (!currentUser && !targetSlug) {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      let tenantData = null;

      // 1. Fetch Tenant details (Priority: URL Slug for SuperAdmins, else Current User's ID)
      if (currentUser?.role === 'SUPER_ADMIN' && targetSlug) {
        const { data } = await insforge.database
          .from('tenants')
          .select('*')
          .eq('slug', targetSlug)
          .single();
        tenantData = data;
      } else if (currentUser?.tenant_id) {
        const { data } = await insforge.database
          .from('tenants')
          .select('*')
          .eq('id', currentUser.tenant_id)
          .single();
        tenantData = data;
      }

      if (tenantData) {
        setTenant(tenantData as Tenant);
        
        // 1.5 Fetch SaaS Plan details
        if (tenantData.plan) {
          const { data: planData } = await insforge.database
            .from('saas_plans')
            .select('*')
            .eq('id', tenantData.plan)
            .single();
          if (planData) setPlanConfig(planData as SaasPlanDb);
        }

        // 2. Fetch Subscription details
        const { data: subData } = await insforge.database
          .from('subscriptions')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .eq('status', 'active')
          .single();

        if (subData) {
          setSubscription(subData as Subscription);
        }
      } else {
        setTenant(null);
        setSubscription(null);
        setPlanConfig(null);
      }
    } catch (error) {
      console.error("Error fetching SaaS data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaasData();
  }, [currentUser, window.location.pathname]);

  const isPlanAtLeast = (requiredPlan: Plan) => {
    const currentPlan = (tenant?.plan || 'FREE') as Plan;
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
  };

  const hasModule = (moduleName: keyof SaasPlanDb) => {
    // 1. SuperAdmin bypass: total access to all modules
    if (currentUser?.role === 'SUPER_ADMIN') return true;

    // 2. If we have dynamic config, use it
    if (planConfig) {
      return !!planConfig[moduleName as keyof SaasPlanDb];
    }
    // Fallback if db is empty or migration pending: map based on hierarchy
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
    <SaasContext.Provider value={{ 
      tenant, subscription, planConfig, loading, isPlanAtLeast, hasModule, refreshSaasData,
      isActive: tenant?.actif ?? true 
    }}>
      {children}
    </SaasContext.Provider>
  );
};
