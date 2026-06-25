import { DataModule } from '../components/DataModule';

export function OrdersInPage() {
  return <DataModule title="Inbound Orders" endpoint="/purchases" fields={["code", "partyId", "total", "notes"]} />;
}
