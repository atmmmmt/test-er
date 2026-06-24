import { Schema, model, Types } from 'mongoose';

const productSchema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  barcode: String,
  categoryId: { type: Types.ObjectId, ref: 'Category' },
  image: { url: String, publicId: String, format: String, bytes: Number, compressed: Boolean },
  unit: { type: String, default: 'piece' },
  purchasePrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  description: String
}, { timestamps: true });

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productSchema.index({ tenantId: 1, barcode: 1 });

export const Product = model('Product', productSchema);
