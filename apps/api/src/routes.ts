import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';
import { tenantRoutes } from './modules/tenants/tenant.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { productRoutes } from './modules/products/product.routes.js';
import { categoryRoutes } from './modules/categories/category.routes.js';
import { warehouseRoutes } from './modules/warehouses/warehouse.routes.js';
import { partyRoutes } from './modules/parties/party.routes.js';
import { purchaseRoutes } from './modules/purchases/purchase.routes.js';
import { salesRoutes } from './modules/sales/sale.routes.js';
import { stockRoutes } from './modules/stock/stock.routes.js';
import { reportRoutes } from './modules/reports/report.routes.js';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/tenants', tenantRoutes);
routes.use('/users', userRoutes);
routes.use('/products', productRoutes);
routes.use('/categories', categoryRoutes);
routes.use('/warehouses', warehouseRoutes);
routes.use('/parties', partyRoutes);
routes.use('/purchases', purchaseRoutes);
routes.use('/sales', salesRoutes);
routes.use('/stock', stockRoutes);
routes.use('/reports', reportRoutes);
