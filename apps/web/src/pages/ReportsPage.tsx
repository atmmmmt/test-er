import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export function ReportsPage() {
  const [data, setData] = useState<Record<string, number>>({});
  useEffect(() => { apiGet('/reports/overview').then((result) => setData(result.data || {})); }, []);
  return (
    <section className="panel glass">
      <h2>Reports</h2>
      <div className="grid">
        {Object.entries(data).map(([key, value]) => <div className="card" key={key}><span>Metric</span><h2>{value}</h2><p className="muted">{key}</p></div>)}
      </div>
    </section>
  );
}
