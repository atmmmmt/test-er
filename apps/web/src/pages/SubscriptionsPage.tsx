import { DataModule } from '../components/DataModule';

export function SubscriptionsPage() {
  return <DataModule title="Subscriptions" endpoint="/subscriptions" fields={["tenantId", "planId", "status", "amount"]} />;
}
