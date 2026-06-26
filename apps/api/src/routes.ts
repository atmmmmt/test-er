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
import { sessionRoutes } from './modules/session.routes.js';
import { userSecure } from './modules/userSecure.js';
import { requireAuth } from './middlewares/auth.js';
import { seed } from './modules/seed.js';
export const routes = Router();
const demoTenantId = new Types.ObjectId('000000000000000000000001');
function tid(req: any) { return req.user?.tenantId || req.query.tenantId || req.body.tenantId || demoTenantId; }
function withTenant(req: any) { return { tenantId: tid(req), ...req.body }; }
function crud(path: string, model: any, extra: Record<string, unknown> = {}, scoped = true) {
  routes.get(path, async (req, res) => res.json({ data: await model.find({ ...(scoped ? { tenantId: tid(req) } : {}), ...extra }).limit(200).sort({ createdAt: -1 }) }));
  routes.post(path, async (req, res) => res.status(201).json({ data: await model.create(scoped ? { ...withTenant(req), ...extra } : { ...req.body, ...extra }) }));
}
routes.get('/', (_req, res) => res.json({ name: 'Warehouse SaaS ERP', version: 'v1', ok: true }));
routes.use('/session', sessionRoutes); routes.post('/tenants', async (req, res) => res.status(201).json({ data: await Tenant.create(req.body) })); routes.use('/', userSecure); routes.use('/', seed);
routes.use(requireAuth);
crud('/tenants', Tenant, {}, false); crud('/roles', Role); crud('/plans', Plan, {}, false); crud('/subscriptions', Subscription); crud('/users', User); crud('/products', Product); crud('/categories', Category); crud('/warehouses', Storage); crud('/suppliers', Party, { type: 'supplier' }); crud('/customers', Party, { type: 'customer' });
crud('/purchases', PurchaseOrder); crud('/sales', Sale); crud('/balances', StockBalance); crud('/movements', Movement);
routes.post('/stock/receive', async (req, res) => res.status(201).json({ data: await receivePurchase(req.body) }));
routes.post('/stock/issue', async (req, res) => res.status(201).json({ data: await issueSale(req.body) }));
routes.post('/stock/move', async (req, res) => res.status(201).json({ data: await moveStock(req.body) }));
routes.get('/reports/overview', async (req, res) => {
  const filter = { tenantId: tid(req) };
  const [tenants, plans, subscriptions, users, products, warehouses, suppliers, customers, purchases, sales, movements] = await Promise.all([Tenant.countDocuments(), Plan.countDocuments(), Subscription.countDocuments(filter), User.countDocuments(filter), Product.countDocuments(filter), Storage.countDocuments(filter), Party.countDocuments({ ...filter, type: 'supplier' }), Party.countDocuments({ ...filter, type: 'customer' }), PurchaseOrder.countDocuments(filter), Sale.countDocuments(filter), Movement.countDocuments(filter)]);
  res.json({ data: { tenants, plans, subscriptions, users, products, warehouses, suppliers, customers, purchases, sales, movements } });
});
