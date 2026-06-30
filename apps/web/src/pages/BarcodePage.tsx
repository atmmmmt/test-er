import { useState } from 'react';
import { apiGet } from '../api/client';

export function BarcodePage() {
  const [barcode, setBarcode] = useState('');
  const [status, setStatus] = useState('Ready');
  async function findProduct() {
    const result = await apiGet('/products');
    const product = (result.data || []).find((item: any) => item.barcode === barcode || item.sku === barcode || item._id === barcode);
    if (product) {
      localStorage.setItem('productId', product._id);
      setStatus(`Selected: ${product.name || product.sku}`);
    } else {
      setStatus('Product not found');
    }
  }
  return (
    <section className="panel glass">
      <h2>Barcode</h2>
      <p className="muted">Scan or type barcode, SKU, or productId.</p>
      <div className="form">
        <input className="input" placeholder="barcode / sku / productId" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        <button className="primary" onClick={findProduct}>Find Product</button>
      </div>
      <p className="muted">{status}</p>
    </section>
  );
}
