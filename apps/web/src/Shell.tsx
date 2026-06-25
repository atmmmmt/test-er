import { useState } from 'react';
import { SaasOwnerPage } from './pages/SaasOwnerPage';
import { TenantArea } from './pages/TenantArea';
import { MobileOperationPage } from './pages/MobileOperationPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { OrdersInPage } from './pages/OrdersInPage';

const pages = ['owner', 'tenant', 'products', 'warehouses', 'suppliers', 'customers', 'orders', 'sales', 'reports', 'mobile'] as const;
type Page = typeof pages[number];

export function Shell() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [page, setPage] = useState<Page>('tenant');
  const isAr = lang === 'ar';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  return (
    <main className="page">
      <section className="container">
        <nav className="topbar glass"><div className="brand"><span className="mark">ERP</span><div><b>Warehouse Cloud</b><small>{isAr ? 'عربي / English' : 'English / عربي'}</small></div></div><button className="ghost" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'English' : 'العربية'}</button></nav>
        <header className="hero glass"><p className="eyebrow">Production SaaS ERP</p><h1>{isAr ? 'منصة إدارة مستودعات متكاملة' : 'Complete Warehouse SaaS Platform'}</h1><p className="lead">{isAr ? 'لوحة مالك المنصة، لوحة الشركة، صفحات تشغيلية، وواجهة موبايل PWA.' : 'Owner dashboard, company dashboard, operational pages, and mobile PWA.'}</p></header>
        <div className="view-switch">{pages.map((item) => <button key={item} className={page === item ? 'tab active' : 'tab'} onClick={() => setPage(item)}>{item}</button>)}</div>
        {page === 'owner' && <SaasOwnerPage isAr={isAr} />}
        {page === 'tenant' && <TenantArea isAr={isAr} />}
        {page === 'products' && <ProductsPage />}
        {page === 'warehouses' && <WarehousesPage />}
        {page === 'suppliers' && <SuppliersPage />}
        {page === 'customers' && <CustomersPage />}
        {page === 'orders' && <OrdersInPage />}
        {page === 'sales' && <SalesPage />}
        {page === 'reports' && <ReportsPage />}
        {page === 'mobile' && <MobileOperationPage />}
      </section>
    </main>
  );
}
