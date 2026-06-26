import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { Storage } from '../models/Storage.js';
import { Product } from '../models/Product.js';
import { Party } from '../models/Party.js';
import { StockBalance } from '../models/StockBalance.js';
import { makePasswordHash } from '../utils/password.js';

export async function seedDemo() {
  const tenant = await Tenant.findOneAndUpdate({ slug: 'demo-company' }, { name: 'Demo Company', slug: 'demo-company', status: 'trial' }, { upsert: true, new: true });
  const passwordHash = await makePasswordHash('demo12345');
  await User.findOneAndUpdate({ tenantId: tenant._id, email: 'admin@demo.com' }, { tenantId: tenant._id, name: 'Demo Admin', email: 'admin@demo.com', passwordHash, permissions: ['users.read','users.write','products.read','products.write','stock.write','reports.read'] }, { upsert: true, new: true });
  const main = await Storage.findOneAndUpdate({ tenantId: tenant._id, code: 'MAIN' }, { tenantId: tenant._id, name: 'Main Warehouse', code: 'MAIN', city: 'Dubai' }, { upsert: true, new: true });
  const branch = await Storage.findOneAndUpdate({ tenantId: tenant._id, code: 'BRANCH' }, { tenantId: tenant._id, name: 'Branch Warehouse', code: 'BRANCH', city: 'Aleppo' }, { upsert: true, new: true });
  const product = await Product.findOneAndUpdate({ tenantId: tenant._id, sku: 'SKU-001' }, { tenantId: tenant._id, name: 'Demo Product', sku: 'SKU-001', salePrice: 25, purchasePrice: 15, minStock: 10 }, { upsert: true, new: true });
  await Party.findOneAndUpdate({ tenantId: tenant._id, type: 'supplier', name: 'Demo Supplier' }, { tenantId: tenant._id, type: 'supplier', name: 'Demo Supplier', phone: '+000000' }, { upsert: true, new: true });
  await Party.findOneAndUpdate({ tenantId: tenant._id, type: 'customer', name: 'Demo Customer' }, { tenantId: tenant._id, type: 'customer', name: 'Demo Customer', phone: '+111111' }, { upsert: true, new: true });
  await StockBalance.findOneAndUpdate({ tenantId: tenant._id, productId: product._id, storageId: main._id }, { tenantId: tenant._id, productId: product._id, storageId: main._id, quantity: 100 }, { upsert: true, new: true });
  return { tenantId: tenant._id, mainStorageId: main._id, branchStorageId: branch._id, email: 'admin@demo.com', password: 'demo12345' };
}
