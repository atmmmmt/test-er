import { useEffect, useMemo, useState } from 'react';

type Entity = 'products' | 'categories' | 'warehouses' | 'suppliers' | 'customers' | 'purchases' | 'movements';

type ModuleConfig = {
  key: Entity;
  label: string;
  description: string;
  fields: { name: string; placeholder: string; type?: string }[];
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const modules: ModuleConfig[] = [
  { key: 'products', label: 'Products', description: 'SKU, prices, barcode, and stock thresholds.', fields: [{ name: 'name', placeholder: 'Product name' }, { name: 'sku', placeholder: 'SKU' }, { name: 'salePrice', placeholder: 'Sale price', type: 'number' }] },
  { key: 'categories', label: 'Categories', description: 'Organize products with categories.', fields: [{ name: 'name', placeholder: 'Category name' }] },
  { key: 'warehouses', label: 'Warehouses', description: 'Storage locations and branches.', fields: [{ name: 'name', placeholder: 'Warehouse name' }, { name: 'code', placeholder: 'Code' }, { name: 'city', placeholder: 'City' }] },
  { key: 'suppliers', label: 'Suppliers', description: 'Supplier profiles and contact details.', fields: [{ name: 'name', placeholder: 'Supplier name' }, { name: 'phone', placeholder: 'Phone' }] },
  { key: 'customers', label: 'Customers', description: 'Customer profiles and contact details.', fields: [{ name: 'name', placeholder: 'Customer name' }, { name: 'phone', placeholder: 'Phone' }] },
  { key: 'purchases', label: 'Purchases', description: 'Purchase orders from suppliers.', fields: [{ name: 'code', placeholder: 'Purchase code' }, { name: 'total', placeholder: 'Total', type: 'number' }] },
  { key: 'movements', label: 'Stock movements', description: 'Inventory movement ledger.', fields: [{ name: 'movementType', placeholder: 'Movement type' }, { name: 'quantity', placeholder: 'Quantity', type: 'number' }] }
];

export function App() {
  const [active, setActive] = useState<Entity>('products');
  const [items, setItems] = useState<any[]>([]);
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const selected = useMemo(() => modules.find((item) => item.key === active)!, [active]);

  async function load() {
    setLoading(true);
    const [listResponse, reportResponse] = await Promise.all([
      fetch(`${API_URL}/${active}`),
      fetch(`${API_URL}/reports/overview`)
    ]);
    const listJson = await listResponse.json();
    const reportJson = await reportResponse.json();
    setItems(listJson.data || []);
    setOverview(reportJson.data || {});
    setLoading(false);
  }

  useEffect(() => { load(); }, [active]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
    await fetch(`${API_URL}/${active}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setForm({});
    await load();
  }

  return (
    <main className="page">
      <section className="container">
        <div className="hero">
          <p className="eyebrow">Prootech Warehouse SaaS ERP</p>
          <h1>Professional warehouse SaaS platform</h1>
          <p className="lead">Runnable V1 dashboard connected to the Express API. You can test products, categories, warehouses, suppliers, customers, purchases, stock movements, and basic reports.</p>
        </div>

        <div className="grid" style={{ marginTop: 18 }}>
          {Object.entries(overview).map(([key, value]) => <div className="card" key={key}><span>Report</span><h2>{value}</h2><p className="muted">{key}</p></div>)}
        </div>

        <div className="toolbar">
          {modules.map((item) => <button className={`tab ${active === item.key ? 'active' : ''}`} key={item.key} onClick={() => setActive(item.key)}>{item.label}</button>)}
        </div>

        <div className="panel">
          <h2>{selected.label}</h2>
          <p className="muted">{selected.description}</p>
          <form className="form" onSubmit={submit}>
            {selected.fields.map((field) => <input className="input" key={field.name} type={field.type || 'text'} placeholder={field.placeholder} value={form[field.name] || ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />)}
            <button className="primary" type="submit">Create</button>
          </form>
          <div className="list">
            {loading && <p className="muted">Loading...</p>}
            {!loading && items.length === 0 && <p className="muted">No records yet. Create the first one.</p>}
            {items.map((item) => <div className="row" key={item._id}><strong>{item.name || item.code || item.movementType || item._id}</strong><span className="muted">{new Date(item.createdAt).toLocaleString()}</span></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}
