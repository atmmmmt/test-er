import { DataModule } from '../components/DataModule';

export function MovementsPage() {
  return <DataModule title="Stock Movements" endpoint="/movements" fields={["movementType", "quantity", "note"]} />;
}
