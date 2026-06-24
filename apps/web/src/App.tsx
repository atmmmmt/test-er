import { useState } from 'react';
import { hero, nav } from './content';
import { modules, ownerCards } from './modules';

export function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [view, setView] = useState<'owner' | 'company' | 'pwa'>('company');
  const isAr = lang === 'ar';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  return (
    <main className="page">
      <section className="container">
        <nav className="topbar glass">
          <div className="brand"><span className="mark">ERP</span><div><b>Warehouse Cloud</b><small>{isAr ? 'عربي / إنكليزي' : 'Arabic / English'}</small></div></div>
          <button className="ghost" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'English' : 'العربية'}</button>
        </nav>
        <header className="hero glass"><p className="eyebrow">Prootech SaaS ERP</p><h1>{isAr ? hero.arTitle : hero.enTitle}</h1><p className="lead">{isAr ? hero.arSub : hero.enSub}</p></header>
        <div className="view-switch">
          <button className={view === 'owner' ? 'tab active' : 'tab'} onClick={() => setView('owner')}>{isAr ? nav.owner.ar : nav.owner.en}</button>
          <button className={view === 'company' ? 'tab active' : 'tab'} onClick={() => setView('company')}>{isAr ? nav.company.ar : nav.company.en}</button>
          <button className={view === 'pwa' ? 'tab active' : 'tab'} onClick={() => setView('pwa')}>{isAr ? nav.pwa.ar : nav.pwa.en}</button>
        </div>
        {view === 'owner' && <section className="panel glass"><h2>{isAr ? nav.owner.ar : nav.owner.en}</h2><div className="grid">{ownerCards.map((card) => <div className="card" key={card.en}><span>SaaS</span><h2>{isAr ? card.ar : card.en}</h2><p className="muted">{isAr ? 'إدارة ومراقبة كاملة' : 'Full management and monitoring'}</p></div>)}</div></section>}
        {view === 'company' && <section className="panel glass"><h2>{isAr ? nav.company.ar : nav.company.en}</h2><div className="grid">{modules.map((item) => <div className="card" key={item.key}><span>V1</span><h2>{isAr ? item.ar : item.en}</h2><p className="muted">{isAr ? 'واجهة تشغيل وربط API' : 'Dashboard and API connection'}</p></div>)}</div></section>}
        {view === 'pwa' && <section className="phone-wrap"><div className="phone"><div className="phone-head"><b>{isAr ? nav.pwa.ar : nav.pwa.en}</b><span>09:41</span></div><h2>{isAr ? 'مهام المستودع اليومية' : 'Daily warehouse tasks'}</h2>{['Receive', 'Count', 'Pick', 'Transfer'].map((task) => <button className="task" key={task}>{task}<span>›</span></button>)}</div></section>}
      </section>
    </main>
  );
}
