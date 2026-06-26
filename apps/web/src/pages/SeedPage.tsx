import { useState } from 'react';
import { apiPost } from '../api/client';

export function SeedPage() {
  const [status, setStatus] = useState('Ready');
  async function seedPlans() {
    const result = await apiPost('/seed/plans', {});
    setStatus(result.data ? 'Plans created' : result.message || 'Failed');
  }
  return (
    <section className="panel glass">
      <h2>Seed Data</h2>
      <p className="muted">Create Starter, Professional, and Enterprise plans.</p>
      <button className="primary" onClick={seedPlans}>Seed Plans</button>
      <p className="muted">{status}</p>
    </section>
  );
}
