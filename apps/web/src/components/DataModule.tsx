import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

export function DataModule({ title, endpoint, fields }: { title: string; endpoint: string; fields: string[] }) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const result = await apiGet(endpoint);
    setItems(result.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [endpoint]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await apiPost(endpoint, form);
    setForm({});
    await load();
  }

  return (
    <section className="panel glass">
      <h2>{title}</h2>
      <form className="form" onSubmit={submit}>
        {fields.map((field) => <input className="input" key={field} placeholder={field} value={form[field] || ''} onChange={(e) => setForm((old) => ({ ...old, [field]: e.target.value }))} />)}
        <button className="primary">Save</button>
      </form>
      <div className="list">
        {loading && <p className="muted">Loading...</p>}
        {items.map((item) => <div className="row" key={item._id}><b>{item.name || item.code || item._id}</b><span className="muted">{item.createdAt || ''}</span></div>)}
      </div>
    </section>
  );
}
