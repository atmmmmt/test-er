import { useState } from 'react';
import { apiPost } from '../api/client';

export function SeedPage() {
  const [status, setStatus] = useState('Ready');
  async function seedPlans() {
    const result = await apiPost('/seed/plans', {});
    setStatus(result.data ? 'Plans created' : result.message || 'Failed');
  }
  async function seedDemo() {
    const result = await apiPost('/seed/demo', {});
    if (result.data) {
      localStorage.setItem('tenantId', result.data.tenantId);
      localStorage.setItem('storageId', result.data.mainStorageId);
      localStorage.setItem('targetStorageId', result.data.branchStorageId);
      setStatus(`Demo ready: ${result.data.email} / ${result.data.password}`);
    } else {
      setStatus(result.message || 'Failed');
    }
  }
  return (
    <section className="panel glass">
      <h2>Seed Data</h2>
      <p className="muted">Create default data for testing.</p>
      <button className="primary" onClick={seedPlans}>Seed Plans</button>
      <button className="primary" onClick={seedDemo}>Seed Demo</button>
      <p className="muted">{status}</p>
    </section>
  );
}
