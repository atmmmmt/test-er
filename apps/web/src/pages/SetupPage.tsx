import { useState } from 'react';
import { apiPost } from '../api/client';

export function SetupPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await apiPost('/companies/setup', form);
    setDone(true);
  }
  return (
    <section className="panel glass">
      <h2>Company Setup</h2>
      <form className="form" onSubmit={submit}>
        {['companyName', 'slug', 'name', 'email'].map((field) => <input className="input" key={field} placeholder={field} value={form[field] || ''} onChange={(e) => setForm((old) => ({ ...old, [field]: e.target.value }))} />)}
        <button className="primary">Create Company</button>
      </form>
      {done && <p className="muted">Company created.</p>}
    </section>
  );
}
