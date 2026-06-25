import { applyStockMovement } from './stock.service.js';

export async function receivePurchase(input: { tenantId: string; storageId: string; items: any[]; note?: string }) {
  const results = [];
  for (const item of input.items || []) {
    results.push(await applyStockMovement({ tenantId: input.tenantId, productId: String(item.productId), storageId: input.storageId, movementType: 'purchase_receive', quantity: Number(item.quantity || 0), note: input.note }));
  }
  return results;
}

export async function issueSale(input: { tenantId: string; storageId: string; items: any[]; note?: string }) {
  const results = [];
  for (const item of input.items || []) {
    results.push(await applyStockMovement({ tenantId: input.tenantId, productId: String(item.productId), storageId: input.storageId, movementType: 'sale_issue', quantity: Number(item.quantity || 0), note: input.note }));
  }
  return results;
}

export async function moveStock(input: { tenantId: string; fromStorageId: string; toStorageId: string; items: any[]; note?: string }) {
  const results = [];
  for (const item of input.items || []) {
    results.push(await applyStockMovement({ tenantId: input.tenantId, productId: String(item.productId), storageId: input.fromStorageId, movementType: 'transfer_out', quantity: Number(item.quantity || 0), note: input.note }));
    results.push(await applyStockMovement({ tenantId: input.tenantId, productId: String(item.productId), storageId: input.toStorageId, movementType: 'transfer_in', quantity: Number(item.quantity || 0), note: input.note }));
  }
  return results;
}
