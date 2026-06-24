import { Router } from 'express';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import { Storage } from './models/Storage.js';
import { Party } from './models/Party.js';

export const routes = Router();

routes.get('/', (_req, res) => res.json({ name: 'Warehouse SaaS ERP', version: 'v1' }));

routes.get('/products', async (_req, res) => res.json({ data: await Product.find().limit(100) }));
routes.post('/products', async (req, res) => res.status(201).json({ data: await Product.create(req.body) }));

routes.get('/categories', async (_req, res) => res.json({ data: await Category.find().limit(100) }));
routes.post('/categories', async (req, res) => res.status(201).json({ data: await Category.create(req.body) }));

routes.get('/warehouses', async (_req, res) => res.json({ data: await Storage.find().limit(100) }));
routes.post('/warehouses', async (req, res) => res.status(201).json({ data: await Storage.create(req.body) }));

routes.get('/suppliers', async (_req, res) => res.json({ data: await Party.find({ type: 'supplier' }).limit(100) }));
routes.post('/suppliers', async (req, res) => res.status(201).json({ data: await Party.create({ ...req.body, type: 'supplier' }) }));

routes.get('/customers', async (_req, res) => res.json({ data: await Party.find({ type: 'customer' }).limit(100) }));
routes.post('/customers', async (req, res) => res.status(201).json({ data: await Party.create({ ...req.body, type: 'customer' }) }));

routes.get('/reports/overview', async (_req, res) => {
  const products = await Product.countDocuments();
  const warehouses = await Storage.countDocuments();
  res.json({ data: { products, warehouses } });
});
