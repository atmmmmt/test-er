import { DataModule } from '../components/DataModule';

export function OwnerPricingPage() {
  return <DataModule title="Pricing Plans" endpoint="/plans" fields={["name", "code", "priceMonthly", "priceYearly"]} />;
}
