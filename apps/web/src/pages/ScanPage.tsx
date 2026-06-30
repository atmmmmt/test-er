import { useRef, useState } from 'react';

export function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState('Camera scanner is optional. Manual barcode page is always available.');
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('Camera started. Use manual barcode input if detector is not supported.');
    } catch {
      setStatus('Camera permission denied or not supported.');
    }
  }
  return (
    <section className="panel glass">
      <h2>Camera Scan</h2>
      <p className="muted">Browser camera scanner foundation.</p>
      <button className="primary" onClick={startCamera}>Start Camera</button>
      <video ref={videoRef} className="scanner" autoPlay muted playsInline />
      <p className="muted">{status}</p>
    </section>
  );
}
