export const routePermissions: Record<string, { read: string; write: string }> = {
  users: { read: 'users.read', write: 'users.write' },
  products: { read: 'products.read', write: 'products.write' },
  categories: { read: 'products.read', write: 'products.write' },
  warehouses: { read: 'stock.read', write: 'stock.write' },
  suppliers: { read: 'parties.read', write: 'parties.write' },
  customers: { read: 'parties.read', write: 'parties.write' },
  purchases: { read: 'purchase.read', write: 'purchase.write' },
  sales: { read: 'sales.read', write: 'sales.write' },
  movements: { read: 'stock.read', write: 'stock.write' },
  reports: { read: 'reports.read', write: 'reports.read' }
};
