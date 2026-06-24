export type Entity = 'products' | 'categories' | 'warehouses' | 'suppliers' | 'customers' | 'purchases' | 'movements';

export const modules = [
  { key: 'products', ar: 'المنتجات', en: 'Products', fields: ['name', 'sku', 'salePrice'] },
  { key: 'categories', ar: 'التصنيفات', en: 'Categories', fields: ['name'] },
  { key: 'warehouses', ar: 'المستودعات', en: 'Warehouses', fields: ['name', 'code', 'city'] },
  { key: 'suppliers', ar: 'الموردون', en: 'Suppliers', fields: ['name', 'phone'] },
  { key: 'customers', ar: 'العملاء', en: 'Customers', fields: ['name', 'phone'] },
  { key: 'purchases', ar: 'المشتريات', en: 'Purchases', fields: ['code', 'total'] },
  { key: 'movements', ar: 'حركات المخزون', en: 'Stock Movements', fields: ['movementType', 'quantity'] }
] as const;

export const ownerCards = [
  { ar: 'الشركات', en: 'Tenants' },
  { ar: 'الخطط', en: 'Plans' },
  { ar: 'الاشتراكات', en: 'Subscriptions' },
  { ar: 'الفواتير', en: 'Billing' },
  { ar: 'الدعم', en: 'Support' },
  { ar: 'المراقبة', en: 'Monitoring' }
];
