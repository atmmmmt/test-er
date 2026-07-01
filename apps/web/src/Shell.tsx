import { useState } from 'react';
import { pageLabels } from './navigation';
import { HomePage } from './pages/HomePage';
import { SaasOwnerPage } from './pages/SaasOwnerPage';
import { TenantArea } from './pages/TenantArea';
import { MobileOperationPage } from './pages/MobileOperationPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { OrdersInPage } from './pages/OrdersInPage';
import { MovementsPage } from './pages/MovementsPage';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { OwnerPricingPage } from './pages/OwnerPricingPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { LocalSettingsPage } from './pages/LocalSettingsPage';
import { SeedPage } from './pages/SeedPage';
import { ConfirmPage } from './pages/ConfirmPage';
import { RolesPage } from './pages/RolesPage';
import { UsersPage } from './pages/UsersPage';
import { BarcodePage } from './pages/BarcodePage';
import { ScanPage } from './pages/ScanPage';
import { PwaStatusPage } from './pages/PwaStatusPage';
import { ToastHost } from './ui/ToastHost';

const pages = ['home', 'login', 'setup', 'settings', 'seed', 'owner', 'pricing', 'subscriptions', 'tenant', 'users', 'roles', 'products', 'categories', 'warehouses', 'suppliers', 'customers', 'orders', 'sales', 'confirm', 'barcode', 'scan', 'pwa', 'movements', 'reports', 'mobile'] as const;
type Page = typeof pages[number];
function initialPage(): Page {
  const value = new URLSearchParams(window.location.search).get('page') as Page | null;
  return value && pages.includes(value) ? value : 'home';
}

export function Shell() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [page, setPage] = useState<Page>(initialPage());
  const isAr = lang === 'ar';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  return (
    <main className="page">
      <section className="container">
        <nav className="topbar glass"><div className="brand"><span className="mark">ERP</span><div><b>Warehouse Cloud</b><small>{isAr ? 'عربي / English' : 'English / عربي'}</small></div></div><button className="ghost" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'English' : 'العربية'}</button></nav>
        <header className="hero glass"><p className="eyebrow">Production SaaS ERP</p><h1>{isAr ? 'منصة إدارة مستودعات متكاملة' : 'Complete Warehouse SaaS Platform'}</h1><p className="lead">{isAr ? 'لوحة مالك المنصة، لوحة الشركة، صفحات تشغيلية، وواجهة موبايل PWA.' : 'Owner dashboard, company dashboard, operational pages, and mobile PWA.'}</p></header>
        <div className="view-switch">{pages.map((item) => <button key={item} className={page === item ? 'tab active' : 'tab'} onClick={() => setPage(item)}>{isAr ? pageLabels[item].ar : pageLabels[item].en}</button>)}</div>
        {page === 'home' && <HomePage openPage={(next) => setPage(next as Page)} />}
        {page === 'login' && <LoginPage />}
        {page === 'setup' && <SetupPage />}
        {page === 'settings' && <LocalSettingsPage />}
        {page === 'seed' && <SeedPage />}
        {page === 'owner' && <SaasOwnerPage isAr={isAr} />}
        {page === 'pricing' && <OwnerPricingPage />}
        {page === 'subscriptions' && <SubscriptionsPage />}
        {page === 'tenant' && <TenantArea isAr={isAr} />}
        {page === 'users' && <UsersPage />}
        {page === 'roles' && <RolesPage />}
        {page === 'products' && <ProductsPage />}
        {page === 'categories' && <CategoriesPage />}
        {page === 'warehouses' && <WarehousesPage />}
        {page === 'suppliers' && <SuppliersPage />}
        {page === 'customers' && <CustomersPage />}
        {page === 'orders' && <OrdersInPage />}
        {page === 'sales' && <SalesPage />}
        {page === 'confirm' && <ConfirmPage />}
        {page === 'barcode' && <BarcodePage />}
        {page === 'scan' && <ScanPage />}
        {page === 'pwa' && <PwaStatusPage />}
        {page === 'movements' && <MovementsPage />}
        {page === 'reports' && <ReportsPage />}
        {page === 'mobile' && <MobileOperationPage />}
      </section>
      <ToastHost />
    </main>
  );
}
