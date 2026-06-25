import { modules } from '../modules';

export function TenantArea({ isAr }: { isAr: boolean }) {
  return (
    <section className="panel glass">
      <h2>{isAr ? 'منطقة الشركة' : 'Tenant Area'}</h2>
      <div className="grid">
        {modules.map((item) => <div className="card" key={item.key}><span>V1</span><h2>{isAr ? item.ar : item.en}</h2></div>)}
      </div>
    </section>
  );
}
