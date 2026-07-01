import { DataModule } from '../components/DataModule';

export function UsersPage() {
  return <DataModule title="Users" endpoint="/users" fields={["name", "email", "password", "permissions"]} />;
}
