import { useEffect, useState } from 'react';
import type { ToastMessage } from './toast';

export function ToastHost() {
  const [items, setItems] = useState<ToastMessage[]>([]);
  useEffect(() => {
    function onToast(event: Event) {
      const toast = (event as CustomEvent<ToastMessage>).detail;
      setItems((old) => [...old, toast]);
      window.setTimeout(() => setItems((old) => old.filter((item) => item.id !== toast.id)), 3200);
    }
    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);
  return <div className="toast-host">{items.map((item) => <div className={`toast ${item.type}`} key={item.id}>{item.text}</div>)}</div>;
}
