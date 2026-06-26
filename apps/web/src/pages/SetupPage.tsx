import { useState } from 'react';
import { apiPost } from '../api/client';

export function SetupPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const tenant = await apiPost('/tenants', { name: form.companyName, slug: form.slug, status: 'trial' });
    await apiPost('/users', { tenantId: tenant.data?._id, name: form.name, email: form.email, passwordHash: form.password || 'change-me' });
    setDone(true);
  }
  return (
    <section className="panel glass">
      <h2>Company Setup</h2>
      <form className="form" onSubmit={submit}>
        {['companyName', 'slug', 'name', 'email', 'password'].map((field) => <input className="input" key={field} type={field === 'password' ? 'password' : 'text'} placeholder={field} value={form[field] || ''} onChange={(e) => setForm((old) => ({ ...old, [field]: e.target.value }))} />)}
        <button className="primary">Create Company</button>
      </form>
      {done && <p className="muted">Company and first user created.</p>}
    </section>
  );
}
