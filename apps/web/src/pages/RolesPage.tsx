import { DataModule } from '../components/DataModule';

export function RolesPage() {
  return <DataModule title="Roles" endpoint="/roles" fields={["name", "permissions"]} />;
}
