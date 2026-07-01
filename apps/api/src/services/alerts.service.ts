import { StockBalance } from '../models/StockBalance.js';
import { Product } from '../models/Product.js';

export async function lowStockAlerts(tenantId: string) {
  const products = await Product.find({ tenantId, status: 'active' }).lean();
  const balances = await StockBalance.find({ tenantId }).lean();
  const totalByProduct = new Map<string, number>();
  for (const balance of balances) {
    const key = String(balance.productId);
    totalByProduct.set(key, (totalByProduct.get(key) || 0) + Number(balance.quantity || 0));
  }
  return products
    .map((product: any) => ({
      productId: String(product._id),
      name: product.name,
      sku: product.sku,
      minStock: Number(product.minStock || 0),
      quantity: totalByProduct.get(String(product._id)) || 0
    }))
    .filter((item) => item.minStock > 0 && item.quantity <= item.minStock)
    .sort((a, b) => a.quantity - b.quantity);
}
