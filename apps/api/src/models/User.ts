import { Schema, model, Types } from 'mongoose';

const userSchema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  roleId: { type: Types.ObjectId, ref: 'Role' },
  permissions: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive', 'invited'], default: 'active' },
  lastLoginAt: Date
}, { timestamps: true });

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export const User = model('User', userSchema);
