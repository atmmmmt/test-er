import { Schema, model, Types } from 'mongoose';

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  productId: { type: Types.ObjectId, ref: 'Product', index: true },
  storageId: { type: Types.ObjectId, ref: 'Storage', index: true },
  movementType: { type: String, required: true },
  quantity: { type: Number, required: true },
  beforeQty: { type: Number, default: 0 },
  afterQty: { type: Number, default: 0 },
  note: String
}, { timestamps: true });

export const Movement = model('Movement', schema);
