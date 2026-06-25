import { DataModule } from '../components/DataModule';

export function CustomersPage() {
  return <DataModule title="Customers" endpoint="/customers" fields={["name", "phone", "email", "address"]} />;
}
