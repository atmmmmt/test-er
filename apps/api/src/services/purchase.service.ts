import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { receivePurchase } from './flow.service.js';

export async function confirmPurchase(id: string, storageId: string) {
  const purchase = await PurchaseOrder.findById(id);
  if (!purchase) throw new Error('Purchase not found');
  if (purchase.status !== 'draft') return purchase;
  await receivePurchase({ tenantId: String(purchase.tenantId), storageId, items: purchase.items || [], note: `Purchase ${purchase.code}` });
  purchase.status = 'confirmed';
  await purchase.save();
  return purchase;
}
