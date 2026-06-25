import { Schema, model, Types } from 'mongoose';

const lineSchema = new Schema({ productId: Types.ObjectId, expectedQty: Number, countedQty: Number, difference: Number }, { _id: false });

const schema = new Schema({
  tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
  storageId: { type: Types.ObjectId, ref: 'Storage', required: true },
  code: { type: String, required: true },
  status: { type: String, default: 'open' },
  lines: [lineSchema],
  closedAt: Date
}, { timestamps: true });

schema.index({ tenantId: 1, code: 1 }, { unique: true });

export const StockCount = model('StockCount', schema);
