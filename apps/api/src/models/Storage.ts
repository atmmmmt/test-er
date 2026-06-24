import { Schema, model, Types } from 'mongoose';

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  address: String,
  city: String
}, { timestamps: true });

schema.index({ tenantId: 1, code: 1 }, { unique: true });

export const Storage = model('Storage', schema);
