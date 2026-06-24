import { Router } from 'express';
import { Types } from 'mongoose';
import { Tenant } from './models/Tenant.js';
import { User } from './models/User.js';
import { Role } from './models/Role.js';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import { Storage } from './models/Storage.js';
import { Party } from './models/Party.js';
import { PurchaseOrder } from './models/PurchaseOrder.js';
import { StockBalance } from './models/StockBalance.js';
import { Movement } from './models/Movement.js';

export const routes = Router();
const demoTenantId = new Types.ObjectId('000000000000000000000001');

function withTenant(body: Record<string, unknown>) {
  return { tenantId: body.tenantId || demoTenantId, ...body };
}

function crud(path: string, model: any, extra: Record<string, unknown> = {}) {
  routes.get(path, async (_req, res) => {
    const data = await model.find(extra).limit(200).sort({ createdAt: -1 });
    res.json({ data });
  });
  routes.post(path, async (req, res) => {
    const data = await model.create({ ...withTenant(req.body), ...extra });
    res.status(201).json({ data });
  });
}

routes.get('/', (_req, res) => res.json({ name: 'Warehouse SaaS ERP', version: 'v1', ok: true }));
crud('/tenants', Tenant);
crud('/roles', Role);
crud('/users', User);
crud('/products', Product);
crud('/categories', Category);
crud('/warehouses', Storage);
crud('/suppliers', Party, { type: 'supplier' });
crud('/customers', Party, { type: 'customer' });
crud('/purchases', PurchaseOrder);
crud('/balances', StockBalance);
crud('/movements', Movement);

routes.get('/reports/overview', async (_req, res) => {
  const [tenants, users, products, warehouses, suppliers, customers, purchases, movements] = await Promise.all([
    Tenant.countDocuments(),
    User.countDocuments(),
    Product.countDocuments(),
    Storage.countDocuments(),
    Party.countDocuments({ type: 'supplier' }),
    Party.countDocuments({ type: 'customer' }),
    PurchaseOrder.countDocuments(),
    Movement.countDocuments()
  ]);
  res.json({ data: { tenants, users, products, warehouses, suppliers, customers, purchases, movements } });
});
