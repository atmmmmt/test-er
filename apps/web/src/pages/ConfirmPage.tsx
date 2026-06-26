import { useState } from 'react';
import { apiPost } from '../api/client';

export function ConfirmPage() {
  const [purchaseId, setPurchaseId] = useState('');
  const [saleId, setSaleId] = useState('');
  const [storageId, setStorageId] = useState(localStorage.getItem('storageId') || '');
  const [status, setStatus] = useState('Ready');
  async function confirmPurchase() {
    const result = await apiPost(`/purchases/${purchaseId}/confirm`, { storageId });
    setStatus(result.data ? 'Purchase confirmed' : result.message || 'Failed');
  }
  async function confirmSale() {
    const result = await apiPost(`/sales/${saleId}/confirm`, {});
    setStatus(result.data ? 'Sale confirmed' : result.message || 'Failed');
  }
  return (
    <section className="panel glass">
      <h2>Confirm Operations</h2>
      <div className="form">
        <input className="input" placeholder="storageId" value={storageId} onChange={(e) => setStorageId(e.target.value)} />
        <input className="input" placeholder="purchaseId" value={purchaseId} onChange={(e) => setPurchaseId(e.target.value)} />
        <button className="primary" onClick={confirmPurchase}>Confirm Purchase</button>
        <input className="input" placeholder="saleId" value={saleId} onChange={(e) => setSaleId(e.target.value)} />
        <button className="primary" onClick={confirmSale}>Confirm Sale</button>
      </div>
      <p className="muted">{status}</p>
    </section>
  );
}
