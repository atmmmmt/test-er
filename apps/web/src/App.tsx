const modules = [
  'Tenants and subscriptions',
  'Users and permissions',
  'Products',
  'Categories',
  'Warehouses',
  'Suppliers',
  'Customers',
  'Purchases',
  'Sales',
  'Stock movements',
  'Basic reports'
];

export function App() {
  return (
    <main className="min-h-screen bg-[#090d1a] text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm text-indigo-200">Prootech Warehouse SaaS ERP</p>
          <h1 className="mt-3 text-5xl font-black">Professional warehouse SaaS platform</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">V1 includes tenants, subscriptions, users, permissions, products, warehouses, parties, orders, stock movement ledger, and basic reports.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <div key={item} className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
              <span className="text-xs text-indigo-300">V1 Module</span>
              <h2 className="mt-2 text-2xl font-bold">{item}</h2>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
