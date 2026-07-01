import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export function AlertsPage() {
  const [items, setItems] = useState<any[]>([]);
  async function load() {
    const result = await apiGet('/alerts/low-stock');
    setItems(result.data || []);
  }
  useEffect(() => { load(); }, []);
  return (
    <section className="panel glass">
      <h2>Low Stock Alerts</h2>
      <p className="muted">Products where total stock is below or equal to the minimum stock.</p>
      <button className="primary" onClick={load}>Refresh</button>
      <div className="list">
        {items.length === 0 && <p className="muted">No low stock alerts.</p>}
        {items.map((item) => <div className="row" key={item.productId}><b>{item.name} / {item.sku}</b><span className="muted">Qty {item.quantity} / Min {item.minStock}</span></div>)}
      </div>
    </section>
  );
}
