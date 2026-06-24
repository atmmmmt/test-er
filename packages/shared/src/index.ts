export const V1_FEATURES = [
  'tenants',
  'subscriptions',
  'users',
  'roles',
  'products',
  'categories',
  'warehouses',
  'suppliers',
  'customers',
  'purchases',
  'sales',
  'stockMovements',
  'basicReports'
] as const;

export const V2_FEATURES = [
  'pwa',
  'attendance',
  'tasks',
  'publicApi',
  'integrations',
  'pickingPacking'
] as const;

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';
export type MovementType = 'purchase_receive' | 'sale_issue' | 'manual_adjustment' | 'return_in' | 'return_out';
