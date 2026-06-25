import { Schema, model, Types } from 'mongoose';

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  planId: { type: Types.ObjectId, ref: 'Plan', required: true },
  status: { type: String, enum: ['trial', 'active', 'past_due', 'cancelled'], default: 'trial' },
  startsAt: Date,
  endsAt: Date,
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  amount: { type: Number, default: 0 },
  notes: String
}, { timestamps: true });

schema.index({ tenantId: 1, status: 1 });

export const Subscription = model('Subscription', schema);
