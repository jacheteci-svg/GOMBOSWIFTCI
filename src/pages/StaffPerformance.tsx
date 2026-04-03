import { useSaas } from '../saas/SaasProvider';
import { PerformanceDashboard } from '../components/performance/PerformanceDashboard';

export const StaffPerformance = () => {
  const { tenant } = useSaas();
  
  return (
    <div className="absolute inset-0 bg-white">
      <PerformanceDashboard tenantId={tenant?.id} />
    </div>
  );
};
