import { Sale } from '../models/Sale.js';
import { issueSale } from './flow.service.js';

export async function confirmSale(id: string) {
  const sale = await Sale.findById(id);
  if (!sale) throw new Error('Sale not found');
  if (sale.status !== 'draft') return sale;
  await issueSale({ tenantId: String(sale.tenantId), storageId: String(sale.warehouseId), items: sale.items || [], note: `Sale ${sale.code}` });
  sale.status = 'confirmed';
  await sale.save();
  return sale;
}
