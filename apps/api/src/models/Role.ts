import { Schema, model, Types } from 'mongoose';

const roleSchema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

roleSchema.pre('validate', function () {
  if (typeof this.permissions === 'string') {
    this.permissions = String(this.permissions).split(',').map((item) => item.trim()).filter(Boolean) as any;
  }
});

roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Role = model('Role', roleSchema);
