import { Plan } from '../models/Plan.js';

export async function seedPlans() {
  const plans = [
    { name: 'Starter', code: 'starter', priceMonthly: 49, maxUsers: 5, maxWarehouses: 1, features: ['core'] },
    { name: 'Professional', code: 'professional', priceMonthly: 149, maxUsers: 25, maxWarehouses: 5, features: ['core', 'reports', 'pwa'] },
    { name: 'Enterprise', code: 'enterprise', priceMonthly: 399, maxUsers: 100, maxWarehouses: 20, features: ['core', 'reports', 'pwa', 'integrations'] }
  ];
  for (const plan of plans) {
    await Plan.findOneAndUpdate({ code: plan.code }, plan, { upsert: true, new: true });
  }
  return Plan.find().sort({ priceMonthly: 1 });
}
