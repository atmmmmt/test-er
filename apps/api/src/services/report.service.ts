import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Storage } from '../models/Storage.js';
import { Party } from '../models/Party.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { Sale } from '../models/Sale.js';
import { Movement } from '../models/Movement.js';

export async function getOverview(tenantId?: string) {
  const filter = tenantId ? { tenantId } : {};
  const [tenants, users, products, warehouses, suppliers, customers, purchases, sales, movements] = await Promise.all([
    Tenant.countDocuments(),
    User.countDocuments(filter),
    Product.countDocuments(filter),
    Storage.countDocuments(filter),
    Party.countDocuments({ ...filter, type: 'supplier' }),
    Party.countDocuments({ ...filter, type: 'customer' }),
    PurchaseOrder.countDocuments(filter),
    Sale.countDocuments(filter),
    Movement.countDocuments(filter)
  ]);
  return { tenants, users, products, warehouses, suppliers, customers, purchases, sales, movements };
}
