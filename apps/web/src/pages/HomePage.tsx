export function HomePage({ openPage }: { openPage: (page: string) => void }) {
  const items = ['owner', 'tenant', 'products', 'reports', 'mobile'];
  return (
    <section className="panel glass">
      <h2>Home</h2>
      <div className="grid">
        {items.map((item) => <button className="card" key={item} onClick={() => openPage(item)}><h2>{item}</h2></button>)}
      </div>
    </section>
  );
}
