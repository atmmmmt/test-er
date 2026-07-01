import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  async function load() {
    const result = await apiGet('/activities');
    setItems(result.data || []);
  }
  useEffect(() => { load(); }, []);
  return (
    <section className="panel glass">
      <h2>Activity Log</h2>
      <p className="muted">Latest system actions and stock operations.</p>
      <button className="primary" onClick={load}>Refresh</button>
      <div className="list">
        {items.length === 0 && <p className="muted">No activity yet.</p>}
        {items.map((item) => <div className="row" key={item._id}><b>{item.action}</b><span className="muted">{item.message || item.createdAt}</span></div>)}
      </div>
    </section>
  );
}
