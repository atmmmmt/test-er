import { useState } from 'react';
import { apiPost } from '../api/client';
import { mobileTasks } from '../pwa/tasks';

export function MobileOperationPage() {
  const [status, setStatus] = useState('Ready');
  const [productId, setProductId] = useState(localStorage.getItem('productId') || '');
  const [quantity, setQuantity] = useState('1');
  async function run(key: string) {
    localStorage.setItem('productId', productId);
    const item = { productId, quantity: Number(quantity || 1) };
    if (key === 'receive') await apiPost('/stock/receive', { tenantId: localStorage.getItem('tenantId'), storageId: localStorage.getItem('storageId'), items: [item] });
    if (key === 'pick') await apiPost('/stock/issue', { tenantId: localStorage.getItem('tenantId'), storageId: localStorage.getItem('storageId'), items: [item] });
    if (key === 'transfer') await apiPost('/stock/move', { tenantId: localStorage.getItem('tenantId'), fromStorageId: localStorage.getItem('storageId'), toStorageId: localStorage.getItem('targetStorageId'), items: [item] });
    setStatus(`Done: ${key}`);
  }
  return (
    <section className="phone-wrap">
      <div className="phone">
        <div className="phone-head"><b>Mobile Operations</b><span>09:41</span></div>
        <input className="input" placeholder="productId" value={productId} onChange={(e) => setProductId(e.target.value)} />
        <input className="input" placeholder="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <p className="muted">{status}</p>
        {mobileTasks.map((task) => <button className="task" key={task.key} onClick={() => run(task.key)}>{task.label}<span>›</span></button>)}
      </div>
    </section>
  );
}
