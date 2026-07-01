type OfflineAction = {
  id: string;
  path: string;
  body: unknown;
  createdAt: string;
};

const KEY = 'offlineStockQueue';

export function readQueue(): OfflineAction[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function queueAction(path: string, body: unknown) {
  const items = readQueue();
  items.push({ id: crypto.randomUUID(), path, body, createdAt: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(items));
  return items.length;
}

export function clearQueue() {
  localStorage.removeItem(KEY);
}

export async function syncQueue(post: (path: string, body: unknown) => Promise<any>) {
  const items = readQueue();
  const remaining: OfflineAction[] = [];
  for (const item of items) {
    const result = await post(item.path, item.body);
    if (!result.data) remaining.push(item);
  }
  localStorage.setItem(KEY, JSON.stringify(remaining));
  return { synced: items.length - remaining.length, remaining: remaining.length };
}
