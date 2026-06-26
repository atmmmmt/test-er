import { useState } from 'react';
import { apiPost } from '../api/client';
import { mobileTasks } from '../pwa/tasks';

export function MobileOperationPage() {
  const [status, setStatus] = useState('Ready');
  async function run(key: string) {
    if (key === 'receive') await apiPost('/stock/receive', { tenantId: localStorage.getItem('tenantId'), storageId: localStorage.getItem('storageId'), items: [] });
    if (key === 'pick') await apiPost('/stock/issue', { tenantId: localStorage.getItem('tenantId'), storageId: localStorage.getItem('storageId'), items: [] });
    if (key === 'transfer') await apiPost('/stock/move', { tenantId: localStorage.getItem('tenantId'), fromStorageId: localStorage.getItem('storageId'), toStorageId: localStorage.getItem('targetStorageId'), items: [] });
    setStatus(`Done: ${key}`);
  }
  return (
    <section className="phone-wrap">
      <div className="phone">
        <div className="phone-head"><b>Mobile Operations</b><span>09:41</span></div>
        <p className="muted">{status}</p>
        {mobileTasks.map((task) => <button className="task" key={task.key} onClick={() => run(task.key)}>{task.label}<span>›</span></button>)}
      </div>
    </section>
  );
}
