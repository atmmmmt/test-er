import { Schema, model, Types } from 'mongoose';

const itemSchema = new Schema({ productId: Types.ObjectId, quantity: Number }, { _id: false });

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  fromStorageId: { type: Types.ObjectId, ref: 'Storage', required: true },
  toStorageId: { type: Types.ObjectId, ref: 'Storage', required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['draft', 'confirmed', 'done', 'cancelled'], default: 'draft' },
  items: [itemSchema],
  note: String
}, { timestamps: true });

schema.index({ tenantId: 1, code: 1 }, { unique: true });

export const Transfer = model('Transfer', schema);
