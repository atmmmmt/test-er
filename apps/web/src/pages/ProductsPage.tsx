import { DataModule } from '../components/DataModule';

export function ProductsPage() {
  return <DataModule title="Products" endpoint="/products" fields={["name", "sku", "salePrice", "purchasePrice", "minStock"]} />;
}
