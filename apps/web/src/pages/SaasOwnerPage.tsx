import { ownerCards } from '../modules';

export function SaasOwnerPage({ isAr }: { isAr: boolean }) {
  return (
    <section className="panel glass">
      <h2>{isAr ? 'لوحة مالك المنصة' : 'SaaS Owner Dashboard'}</h2>
      <p className="muted">{isAr ? 'إدارة الشركات والخطط والاشتراكات والفواتير والدعم.' : 'Manage tenants, plans, subscriptions, billing, and support.'}</p>
      <div className="grid">
        {ownerCards.map((card) => (
          <div className="card" key={card.en}>
            <span>SaaS</span>
            <h2>{isAr ? card.ar : card.en}</h2>
            <p className="muted">{isAr ? 'جاهز للربط مع API' : 'Ready for API connection'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
