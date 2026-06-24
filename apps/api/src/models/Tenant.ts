import { Schema, model } from 'mongoose';

const tenantSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  logo: { url: String, publicId: String },
  currency: { type: String, default: 'USD' },
  language: { type: String, default: 'ar' },
  timezone: { type: String, default: 'Asia/Damascus' },
  status: { type: String, enum: ['trial', 'active', 'suspended', 'cancelled'], default: 'trial' },
  settings: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const Tenant = model('Tenant', tenantSchema);
