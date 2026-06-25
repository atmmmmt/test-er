import { Schema, model, Types } from 'mongoose';

const itemSchema = new Schema({ productId: Types.ObjectId, quantity: Number, price: Number, total: Number }, { _id: false });

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  customerId: { type: Types.ObjectId, ref: 'Party' },
  warehouseId: { type: Types.ObjectId, ref: 'Storage' },
  code: { type: String, required: true },
  status: { type: String, enum: ['draft', 'confirmed', 'picked', 'packed', 'delivered', 'cancelled'], default: 'draft' },
  items: [itemSchema],
  total: { type: Number, default: 0 },
  notes: String
}, { timestamps: true });

schema.index({ tenantId: 1, code: 1 }, { unique: true });

export const Sale = model('Sale', schema);
