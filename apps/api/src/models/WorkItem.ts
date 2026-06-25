import { Schema, model, Types } from 'mongoose';

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  warehouseId: { type: Types.ObjectId, ref: 'Storage' },
  userId: { type: Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  itemType: { type: String, default: 'general' },
  status: { type: String, default: 'open' },
  dueAt: Date
}, { timestamps: true });

export const WorkItem = model('WorkItem', schema);
