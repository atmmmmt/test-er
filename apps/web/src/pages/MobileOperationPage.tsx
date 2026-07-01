import { useState } from 'react';
import { apiPost } from '../api/client';
import { mobileTasks } from '../pwa/tasks';
import { queueAction, readQueue, syncQueue } from '../offlineQueue';

export function MobileOperationPage() {
  const [status, setStatus] = useState('Ready');
  const [productId, setProductId] = useState(localStorage.getItem('productId') || '');
  const [quantity, setQuantity] = useState('1');
  const [queueCount, setQueueCount] = useState(readQueue().length);
  function payload(key: string) {
    const item = { productId, quantity: Number(quantity || 1) };
    if (key === 'receive') return { path: '/stock/receive', body: { tenantId: localStorage.getItem('tenantId'), storageId: localStorage.getItem('storageId'), items: [item] } };
    if (key === 'pick') return { path: '/stock/issue', body: { tenantId: localStorage.getItem('tenantId'), storageId: localStorage.getItem('storageId'), items: [item] } };
    return { path: '/stock/move', body: { tenantId: localStorage.getItem('tenantId'), fromStorageId: localStorage.getItem('storageId'), toStorageId: localStorage.getItem('targetStorageId'), items: [item] } };
  }
  async function run(key: string) {
    localStorage.setItem('productId', productId);
    const action = payload(key);
    const result = await apiPost(action.path, action.body);
    if (result.data) {
      setStatus(`Done: ${key}`);
    } else {
      const count = queueAction(action.path, action.body);
      setQueueCount(count);
      setStatus(`Offline queued: ${key}`);
    }
  }
  async function sync() {
    const result = await syncQueue(apiPost);
    setQueueCount(result.remaining);
    setStatus(`Synced ${result.synced}, remaining ${result.remaining}`);
  }
  return (
    <section className="phone-wrap">
      <div className="phone">
        <div className="phone-head"><b>Mobile Operations</b><span>{queueCount} queued</span></div>
        <input className="input" placeholder="productId" value={productId} onChange={(e) => setProductId(e.target.value)} />
        <input className="input" placeholder="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <p className="muted">{status}</p>
        <button className="task" onClick={sync}>Sync Queue<span>↻</span></button>
        {mobileTasks.map((task) => <button className="task" key={task.key} onClick={() => run(task.key)}>{task.label}<span>›</span></button>)}
      </div>
    </section>
  );
}
