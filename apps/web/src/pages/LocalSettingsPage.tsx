import { useState } from 'react';

export function LocalSettingsPage() {
  const [tenantId, setTenantId] = useState(localStorage.getItem('tenantId') || '');
  const [storageId, setStorageId] = useState(localStorage.getItem('storageId') || '');
  const [targetStorageId, setTargetStorageId] = useState(localStorage.getItem('targetStorageId') || '');
  function save(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('tenantId', tenantId);
    localStorage.setItem('storageId', storageId);
    localStorage.setItem('targetStorageId', targetStorageId);
  }
  return (
    <section className="panel glass">
      <h2>Local Settings</h2>
      <form className="form" onSubmit={save}>
        <input className="input" placeholder="tenantId" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        <input className="input" placeholder="storageId" value={storageId} onChange={(e) => setStorageId(e.target.value)} />
        <input className="input" placeholder="targetStorageId" value={targetStorageId} onChange={(e) => setTargetStorageId(e.target.value)} />
        <button className="primary">Save</button>
      </form>
    </section>
  );
}
