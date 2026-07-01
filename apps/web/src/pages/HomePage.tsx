const items = ['owner', 'tenant', 'users', 'products', 'alerts', 'activity', 'reports', 'barcode', 'pwa', 'mobile'];

export function HomePage({ openPage }: { openPage: (page: string) => void }) {
  return (
    <section className="panel glass">
      <h2>Home</h2>
      <p className="muted">Quick access to the most important modules.</p>
      <div className="grid">
        {items.map((item) => <button className="card" key={item} onClick={() => openPage(item)}><span>Open</span><h2>{item}</h2></button>)}
      </div>
    </section>
  );
}
