import { DataModule } from '../components/DataModule';

export function CategoriesPage() {
  return <DataModule title="Categories" endpoint="/categories" fields={["name"]} />;
}
