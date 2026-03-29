import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Tenant, Subscription, Plan } from '../types';
import { insforge } from '../lib/insforge';

interface SaasContextType {
  tenant: Tenant | null;
  subscription: Subscription | null;
  loading: boolean;
  isPlanAtLeast: (plan: Plan) => boolean;
  refreshSaasData: () => Promise<void>;
}

const SaasContext = createContext<SaasContextType>({
  tenant: null,
  subscription: null,
  loading: true,
  isPlanAtLeast: () => false,
  refreshSaasData: async () => {},
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
  const [loading, setLoading] = useState(true);

  const fetchSaasData = async () => {
    if (!currentUser || !currentUser.tenant_id) {
      setTenant(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Tenant details
      const { data: tenantData } = await insforge.database
        .from('tenants')
        .select('*')
        .eq('id', currentUser.tenant_id)
        .single();

      if (tenantData) {
        setTenant(tenantData as Tenant);
      }

      // 2. Fetch Subscription details
      const { data: subData } = await insforge.database
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', currentUser.tenant_id)
        .eq('status', 'active')
        .single();

      if (subData) {
        setSubscription(subData as Subscription);
      }
    } catch (error) {
      console.error("Error fetching SaaS data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaasData();
  }, [currentUser]);

  const isPlanAtLeast = (requiredPlan: Plan) => {
    const currentPlan = (tenant?.plan || 'FREE') as Plan;
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
  };

  const refreshSaasData = async () => {
    setLoading(true);
    await fetchSaasData();
  };

  return (
    <SaasContext.Provider value={{ tenant, subscription, loading, isPlanAtLeast, refreshSaasData }}>
      {children}
    </SaasContext.Provider>
  );
};
