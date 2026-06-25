import { DataModule } from '../components/DataModule';

export function WarehousesPage() {
  return <DataModule title="Warehouses" endpoint="/warehouses" fields={["name", "code", "city", "address"]} />;
}
