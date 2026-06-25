import { Router } from 'express';
import { Types } from 'mongoose';
import { Tenant } from './models/Tenant.js';
import { User } from './models/User.js';
import { Role } from './models/Role.js';
import { Plan } from './models/Plan.js';
import { Subscription } from './models/Subscription.js';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import { Storage } from './models/Storage.js';
import { Party } from './models/Party.js';
import { PurchaseOrder } from './models/PurchaseOrder.js';
import { Sale } from './models/Sale.js';
import { StockBalance } from './models/StockBalance.js';
import { Movement } from './models/Movement.js';
import { receivePurchase, issueSale, moveStock } from './services/flow.service.js';
export const routes = Router();
const demoTenantId = new Types.ObjectId('000000000000000000000001');
function withTenant(body: Record<string, unknown>) { return { tenantId: body.tenantId || demoTenantId, ...body }; }
function crud(path: string, model: any, extra: Record<string, unknown> = {}) {
  routes.get(path, async (_req, res) => res.json({ data: await model.find(extra).limit(200).sort({ createdAt: -1 }) }));
  routes.post(path, async (req, res) => res.status(201).json({ data: await model.create({ ...withTenant(req.body), ...extra }) }));
}
routes.get('/', (_req, res) => res.json({ name: 'Warehouse SaaS ERP', version: 'v1', ok: true }));
crud('/tenants', Tenant); crud('/roles', Role); crud('/plans', Plan); crud('/subscriptions', Subscription); crud('/users', User);
crud('/products', Product); crud('/categories', Category); crud('/warehouses', Storage); crud('/suppliers', Party, { type: 'supplier' }); crud('/customers', Party, { type: 'customer' });
crud('/purchases', PurchaseOrder); crud('/sales', Sale); crud('/balances', StockBalance); crud('/movements', Movement);
routes.post('/stock/receive', async (req, res) => res.status(201).json({ data: await receivePurchase(req.body) }));
routes.post('/stock/issue', async (req, res) => res.status(201).json({ data: await issueSale(req.body) }));
routes.post('/stock/move', async (req, res) => res.status(201).json({ data: await moveStock(req.body) }));
routes.get('/reports/overview', async (_req, res) => {
  const [tenants, plans, subscriptions, users, products, warehouses, suppliers, customers, purchases, sales, movements] = await Promise.all([Tenant.countDocuments(), Plan.countDocuments(), Subscription.countDocuments(), User.countDocuments(), Product.countDocuments(), Storage.countDocuments(), Party.countDocuments({ type: 'supplier' }), Party.countDocuments({ type: 'customer' }), PurchaseOrder.countDocuments(), Sale.countDocuments(), Movement.countDocuments()]);
  res.json({ data: { tenants, plans, subscriptions, users, products, warehouses, suppliers, customers, purchases, sales, movements } });
});
