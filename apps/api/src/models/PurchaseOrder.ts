import { Schema, model, Types } from 'mongoose';

const itemSchema = new Schema({ productId: Types.ObjectId, quantity: Number, price: Number }, { _id: false });

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  supplierId: { type: Types.ObjectId, ref: 'Party' },
  code: { type: String, required: true },
  status: { type: String, default: 'draft' },
  items: [itemSchema],
  total: { type: Number, default: 0 },
  notes: String
}, { timestamps: true });

schema.index({ tenantId: 1, code: 1 }, { unique: true });

export const PurchaseOrder = model('PurchaseOrder', schema);
