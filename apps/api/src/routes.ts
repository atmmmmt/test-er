import { Router } from 'express';
import { Types } from 'mongoose';
import { routePermissions } from './config/routePermissions.js';
import { Tenant } from './models/Tenant.js';
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
import { confirmPurchase } from './services/purchase.service.js';
import { confirmSale } from './services/sale.service.js';
import { sessionRoutes } from './modules/session.routes.js';
import { userSecure } from './modules/userSecure.js';
import { usersRoutes } from './modules/users.routes.js';
import { requireAuth, requirePermission } from './middlewares/auth.js';
import { seed } from './modules/seed.js';
import { User } from './models/User.js';
export const routes = Router();
const demoTenantId = new Types.ObjectId('000000000000000000000001');
function tid(req: any) { return req.user?.tenantId || req.query.tenantId || req.body.tenantId || demoTenantId; }
function withTenant(req: any) { return { tenantId: tid(req), ...req.body }; }
function pass(_req: any, _res: any, next: any) { next(); }
function aw(fn: any) { return (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next); }
function crud(path: string, model: any, extra: Record<string, unknown> = {}, scoped = true, perms?: { read: string; write: string }) {
  routes.get(path, perms ? requirePermission(perms.read) : pass, aw(async (req: any, res: any) => res.json({ data: await model.find({ ...(scoped ? { tenantId: tid(req) } : {}), ...extra }).limit(200).sort({ createdAt: -1 }) })));
  routes.post(path, perms ? requirePermission(perms.write) : pass, aw(async (req: any, res: any) => res.status(201).json({ data: await model.create(scoped ? { ...withTenant(req), ...extra } : { ...req.body, ...extra }) })));
}
routes.get('/', (_req, res) => res.json({ name: 'Warehouse SaaS ERP', version: 'v1', ok: true }));
routes.use('/session', sessionRoutes); routes.post('/tenants', aw(async (req: any, res: any) => res.status(201).json({ data: await Tenant.create(req.body) }))); routes.use('/', userSecure); routes.use('/', seed);
routes.use(requireAuth);
routes.use('/', usersRoutes);
crud('/tenants', Tenant, {}, false); crud('/roles', Role, {}, true, routePermissions.users); crud('/plans', Plan, {}, false); crud('/subscriptions', Subscription);
crud('/products', Product, {}, true, routePermissions.products); crud('/categories', Category, {}, true, routePermissions.categories); crud('/warehouses', Storage, {}, true, routePermissions.warehouses); crud('/suppliers', Party, { type: 'supplier' }, true, routePermissions.suppliers); crud('/customers', Party, { type: 'customer' }, true, routePermissions.customers);
crud('/purchases', PurchaseOrder, {}, true, routePermissions.purchases); crud('/sales', Sale, {}, true, routePermissions.sales); crud('/balances', StockBalance, {}, true, routePermissions.warehouses); crud('/movements', Movement, {}, true, routePermissions.movements);
routes.post('/purchases/:id/confirm', requirePermission('purchase.write'), aw(async (req: any, res: any) => res.json({ data: await confirmPurchase(req.params.id, String(req.body.storageId || req.query.storageId || '')) })));
routes.post('/sales/:id/confirm', requirePermission('sales.write'), aw(async (req: any, res: any) => res.json({ data: await confirmSale(req.params.id) })));
routes.post('/stock/receive', requirePermission('stock.write'), aw(async (req: any, res: any) => res.status(201).json({ data: await receivePurchase(req.body) })));
routes.post('/stock/issue', requirePermission('stock.write'), aw(async (req: any, res: any) => res.status(201).json({ data: await issueSale(req.body) })));
routes.post('/stock/move', requirePermission('stock.write'), aw(async (req: any, res: any) => res.status(201).json({ data: await moveStock(req.body) })));
routes.get('/reports/overview', requirePermission('reports.read'), aw(async (req: any, res: any) => {
  const filter = { tenantId: tid(req) };
  const [tenants, plans, subscriptions, users, products, warehouses, suppliers, customers, purchases, sales, movements] = await Promise.all([Tenant.countDocuments(), Plan.countDocuments(), Subscription.countDocuments(filter), User.countDocuments(filter), Product.countDocuments(filter), Storage.countDocuments(filter), Party.countDocuments({ ...filter, type: 'supplier' }), Party.countDocuments({ ...filter, type: 'customer' }), PurchaseOrder.countDocuments(filter), Sale.countDocuments(filter), Movement.countDocuments(filter)]);
  res.json({ data: { tenants, plans, subscriptions, users, products, warehouses, suppliers, customers, purchases, sales, movements } });
}));
