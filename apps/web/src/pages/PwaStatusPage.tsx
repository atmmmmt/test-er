import { useState } from 'react';
import { readQueue } from '../offlineQueue';

export function PwaStatusPage() {
  const [queueCount, setQueueCount] = useState(readQueue().length);
  const [online, setOnline] = useState(navigator.onLine);
  function refresh() {
    setQueueCount(readQueue().length);
    setOnline(navigator.onLine);
  }
  return (
    <section className="panel glass">
      <h2>PWA Status</h2>
      <div className="grid">
        <div className="card"><span>Connection</span><h2>{online ? 'Online' : 'Offline'}</h2></div>
        <div className="card"><span>Queued Actions</span><h2>{queueCount}</h2></div>
        <div className="card"><span>Install</span><h2>Ready</h2></div>
      </div>
      <button className="primary" onClick={refresh}>Refresh Status</button>
    </section>
  );
}
