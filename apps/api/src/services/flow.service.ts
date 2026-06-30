import { applyStockMovement } from './stock.service.js';

function validateItems(items: any[]) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('items are required');
  for (const item of items) {
    if (!item.productId) throw new Error('item.productId is required');
    if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) throw new Error('item.quantity must be greater than zero');
  }
}

export async function receivePurchase(input: { tenantId: string; storageId: string; items: any[]; note?: string }) {
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.storageId) throw new Error('storageId is required');
  validateItems(input.items);
  const results = [];
  for (const item of input.items || []) {
    results.push(await applyStockMovement({ tenantId: input.tenantId, productId: String(item.productId), storageId: input.storageId, movementType: 'purchase_receive', quantity: Number(item.quantity || 0), note: input.note }));
  }
  return results;
}

export async function issueSale(input: { tenantId: string; storageId: string; items: any[]; note?: string }) {
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.storageId) throw new Error('storageId is required');
  validateItems(input.items);
  const results = [];
  for (const item of input.items || []) {
    results.push(await applyStockMovement({ tenantId: input.tenantId, productId: String(item.productId), storageId: input.storageId, movementType: 'sale_issue', quantity: Number(item.quantity || 0), note: input.note }));
  }
  return results;
}

export async function moveStock(input: { tenantId: string; fromStorageId: string; toStorageId: string; items: any[]; note?: string }) {
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.fromStorageId) throw new Error('fromStorageId is required');
  if (!input.toStorageId) throw new Error('toStorageId is required');
  validateItems(input.items);
  const results = [];
  for (const item of input.items || []) {
    results.push(await applyStockMovement({ tenantId: input.tenantId, productId: String(item.productId), storageId: input.fromStorageId, movementType: 'transfer_out', quantity: Number(item.quantity || 0), note: input.note }));
    results.push(await applyStockMovement({ tenantId: input.tenantId, productId: String(item.productId), storageId: input.toStorageId, movementType: 'transfer_in', quantity: Number(item.quantity || 0), note: input.note }));
  }
  return results;
}
