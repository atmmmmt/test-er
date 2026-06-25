import { Schema, model } from 'mongoose';

const schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  priceMonthly: { type: Number, default: 0 },
  priceYearly: { type: Number, default: 0 },
  maxUsers: { type: Number, default: 5 },
  maxWarehouses: { type: Number, default: 1 },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Plan = model('Plan', schema);
