import { useSaas } from '../saas/SaasProvider';
import { PerformanceDashboard } from '../components/performance/PerformanceDashboard';

export const StaffPerformance = () => {
  const { tenant } = useSaas();

  return (
    <div className="min-h-full w-full">
      <PerformanceDashboard tenantId={tenant?.id} embeddedModuleChrome />
    </div>
  );
};
