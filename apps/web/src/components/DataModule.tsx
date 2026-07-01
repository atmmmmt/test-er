import { type FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/client';
import { showToast } from '../ui/toast';

export function DataModule({ title, endpoint, fields }: { title: string; endpoint: string; fields: string[] }) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    const result = await apiGet(endpoint);
    setItems(result.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [endpoint]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const missing = fields.find((field) => !String(form[field] || '').trim() && !['notes', 'address', 'email'].includes(field));
    if (missing) {
      const text = `${missing} is required`;
      setMessage(text);
      showToast(text, 'error');
      return;
    }
    const result = await apiPost(endpoint, form);
    if (result.data) {
      setForm({});
      setMessage('Saved');
      showToast(`${title} saved`, 'success');
      await load();
    } else {
      const text = result.message || 'Failed';
      setMessage(text);
      showToast(text, 'error');
    }
  }

  return (
    <section className="panel glass">
      <h2>{title}</h2>
      <form className="form" onSubmit={submit}>
        {fields.map((field) => <input className="input" type={field.toLowerCase().includes('password') ? 'password' : 'text'} key={field} placeholder={field} value={form[field] || ''} onChange={(e) => setForm((old) => ({ ...old, [field]: e.target.value }))} />)}
        <button className="primary">Save</button>
      </form>
      {message && <p className="muted">{message}</p>}
      <div className="list">
        {loading && <p className="muted">Loading...</p>}
        {items.map((item) => <div className="row" key={item._id || item.id}><b>{item.name || item.code || item.email || item._id || item.id}</b><span className="muted">{item.createdAt || item.status || ''}</span></div>)}
      </div>
    </section>
  );
}
