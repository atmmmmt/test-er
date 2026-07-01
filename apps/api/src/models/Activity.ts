import { Schema, model, Types } from 'mongoose';

const activitySchema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: String,
  entityId: String,
  message: String,
  meta: Schema.Types.Mixed
}, { timestamps: true });

activitySchema.index({ tenantId: 1, createdAt: -1 });

export const Activity = model('Activity', activitySchema);
