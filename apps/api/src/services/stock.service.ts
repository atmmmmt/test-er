import { Types } from 'mongoose';
import { StockBalance } from '../models/StockBalance.js';
import { Movement } from '../models/Movement.js';

export async function applyStockMovement(input: {
  tenantId: string;
  productId?: string;
  storageId?: string;
  movementType: string;
  quantity: number;
  note?: string;
}) {
  const tenantId = new Types.ObjectId(input.tenantId);
  const productId = input.productId ? new Types.ObjectId(input.productId) : undefined;
  const storageId = input.storageId ? new Types.ObjectId(input.storageId) : undefined;
  const current = productId && storageId ? await StockBalance.findOne({ tenantId, productId, storageId }) : null;
  const beforeQty = current?.quantity || 0;
  const positiveTypes = ['purchase_receive', 'return_in', 'manual_in'];
  const delta = positiveTypes.includes(input.movementType) ? input.quantity : -input.quantity;
  const afterQty = beforeQty + delta;
  if (productId && storageId) {
    await StockBalance.findOneAndUpdate({ tenantId, productId, storageId }, { quantity: afterQty }, { upsert: true, new: true });
  }
  return Movement.create({ tenantId, productId, storageId, movementType: input.movementType, quantity: input.quantity, beforeQty, afterQty, note: input.note });
}
