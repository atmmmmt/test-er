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
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.productId) throw new Error('productId is required');
  if (!input.storageId) throw new Error('storageId is required');
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) throw new Error('quantity must be greater than zero');
  const tenantId = new Types.ObjectId(input.tenantId);
  const productId = new Types.ObjectId(input.productId);
  const storageId = new Types.ObjectId(input.storageId);
  const current = await StockBalance.findOne({ tenantId, productId, storageId });
  const beforeQty = current?.quantity || 0;
  const positiveTypes = ['purchase_receive', 'return_in', 'manual_in', 'transfer_in'];
  const delta = positiveTypes.includes(input.movementType) ? input.quantity : -input.quantity;
  const afterQty = beforeQty + delta;
  if (afterQty < 0) throw new Error('Insufficient stock');
  await StockBalance.findOneAndUpdate({ tenantId, productId, storageId }, { tenantId, productId, storageId, quantity: afterQty }, { upsert: true, new: true });
  return Movement.create({ tenantId, productId, storageId, movementType: input.movementType, quantity: input.quantity, beforeQty, afterQty, note: input.note });
}
