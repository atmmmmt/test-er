import { DataModule } from '../components/DataModule';

export function SalesPage() {
  return <DataModule title="Sales" endpoint="/sales" fields={["code", "customerId", "total", "notes"]} />;
}
