import { Schema, model, Types } from 'mongoose';

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  productId: { type: Types.ObjectId, ref: 'Product', required: true, index: true },
  storageId: { type: Types.ObjectId, ref: 'Storage', required: true, index: true },
  quantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 }
}, { timestamps: true });

schema.index({ tenantId: 1, productId: 1, storageId: 1 }, { unique: true });

export const StockBalance = model('StockBalance', schema);
