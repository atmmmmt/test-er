export const PERMISSIONS = [
  'owner.dashboard',
  'tenants.read',
  'tenants.write',
  'plans.manage',
  'subscriptions.manage',
  'users.read',
  'users.write',
  'roles.manage',
  'products.read',
  'products.write',
  'categories.write',
  'warehouses.write',
  'parties.write',
  'purchases.write',
  'sales.write',
  'stock.write',
  'reports.read',
  'pwa.access'
];

export const OWNER_PERMISSIONS = PERMISSIONS;
export const COMPANY_ADMIN_PERMISSIONS = ['users.read','users.write','roles.manage','products.read','products.write','categories.write','warehouses.write','parties.write','purchases.write','sales.write','stock.write','reports.read','pwa.access'];
export const EMPLOYEE_PERMISSIONS = ['pwa.access','products.read','stock.write','reports.read'];
