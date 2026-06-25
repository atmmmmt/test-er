import { DataModule } from '../components/DataModule';

export function PricingPage() {
  return <DataModule title="Pricing" endpoint="/plans" fields={["name", "code", "priceMonthly"]} />;
}
