import { Schema, model, Types } from 'mongoose';

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  parentId: { type: Types.ObjectId, ref: 'Category' }
}, { timestamps: true });

schema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Category = model('Category', schema);
