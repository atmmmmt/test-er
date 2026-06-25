import { DataModule } from '../components/DataModule';

export function SuppliersPage() {
  return <DataModule title="Suppliers" endpoint="/suppliers" fields={["name", "phone", "email", "address"]} />;
}
