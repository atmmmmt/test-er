import { Schema, model, Types } from 'mongoose';

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  type: { type: String, enum: ['supplier', 'customer'], required: true },
  name: { type: String, required: true },
  phone: String,
  email: String,
  address: String,
  notes: String
}, { timestamps: true });

schema.index({ tenantId: 1, type: 1, name: 1 });

export const Party = model('Party', schema);
