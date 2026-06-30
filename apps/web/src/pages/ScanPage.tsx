import { useRef, useState } from 'react';
import { apiGet } from '../api/client';

export function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState('Camera scanner is optional. Manual barcode page is always available.');
  async function selectCode(code: string) {
    const result = await apiGet('/products');
    const product = (result.data || []).find((item: any) => item.barcode === code || item.sku === code || item._id === code);
    if (product) {
      localStorage.setItem('productId', product._id);
      setStatus(`Detected and selected: ${product.name || product.sku}`);
    } else {
      setStatus(`Detected code: ${code}. Product not found.`);
    }
  }
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setStatus('Camera started. BarcodeDetector is not supported in this browser.');
        return;
      }
      const detector = new BarcodeDetectorCtor({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39'] });
      setStatus('Camera started. Searching for barcode...');
      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        const codes = await detector.detect(videoRef.current);
        const value = codes?.[0]?.rawValue;
        if (value) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          await selectCode(value);
        }
      }, 900);
    } catch {
      setStatus('Camera permission denied or not supported.');
    }
  }
  return (
    <section className="panel glass">
      <h2>Camera Scan</h2>
      <p className="muted">Browser camera scanner with BarcodeDetector fallback.</p>
      <button className="primary" onClick={startCamera}>Start Camera</button>
      <video ref={videoRef} className="scanner" autoPlay muted playsInline />
      <p className="muted">{status}</p>
    </section>
  );
}
